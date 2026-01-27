import snowflake from 'snowflake-sdk';
import { verifyToken } from '@clerk/backend';

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: "Non autorisé" });
  try {
    await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
  } catch (err) {
    return res.status(401).json({ error: "Token invalide" });
  }

  const connection = snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT,
    username: process.env.SNOWFLAKE_USERNAME,
    password: process.env.SNOWFLAKE_PASSWORD,
    database: process.env.SNOWFLAKE_DATABASE,
    schema: process.env.SNOWFLAKE_SCHEMA,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE,
    role: process.env.SNOWFLAKE_ROLE,
  });

  try {
    await new Promise((resolve, reject) => {
      connection.connect((err, conn) => (err ? reject(err) : resolve(conn)));
    });

    // --- REQUÊTE CORRIGÉE ---
    const query = `
      SELECT 
        DATE, 
        HEURE, 
        RESPONSABLE, 
        EVENEMENT,
        DUREE_HRS,
        LIBELLE AS DOSSIER,
        
        -- CORRECTION ICI : On prend la colonne "USER" et on la renomme "NB_USERS"
        -- pour que le reste du code comprenne.
        "USER" AS NB_USERS 

      FROM V_EVENEMENT_TECHNIQUE
      WHERE 
        DATE >= '2025-01-01' AND DATE <= '2026-12-31'
        AND (
             RESPONSABLE ILIKE '%AYAT%' OR RESPONSABLE ILIKE '%MESSIN%'
          OR RESPONSABLE ILIKE '%GROSSI%' OR RESPONSABLE ILIKE '%SAUROIS%'
          OR RESPONSABLE ILIKE '%GAMONDES%'
        )
        AND (
             EVENEMENT ILIKE '%Avocatmail%' 
          OR EVENEMENT ILIKE '%Adwin%'
          OR EVENEMENT ILIKE '%Migration%'
        )
    `;

    const backofficeData = await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: query,
        complete: (err, stmt, rows) => (err ? reject(err) : resolve(rows)),
      });
    });

    // Requête Encours (Inchangée)
    const encoursQuery = `
        SELECT * FROM V_TICKETS_ENCOURS_AVOCATMAIL
        WHERE (
             RESPONSABLE ILIKE '%AYAT%' 
          OR RESPONSABLE ILIKE '%MESSIN%' 
          OR RESPONSABLE ILIKE '%GROSSI%' 
          OR RESPONSABLE ILIKE '%SAUROIS%' 
          OR RESPONSABLE ILIKE '%GAMONDES%'
        )
    `; 
    
    const encoursData = await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: encoursQuery,
        complete: (err, stmt, rows) => (err ? reject(err) : resolve(rows)),
      });
    });

    res.status(200).json({ backoffice: backofficeData, encours: encoursData });

  } catch (error) {
    console.error("Snowflake Error:", error);
    // On renvoie toujours le détail pour debugger si besoin
    res.status(500).json({ 
        error: "Erreur Snowflake", 
        details: error.message,
        sqlState: error.sqlState
    });
  }
}
