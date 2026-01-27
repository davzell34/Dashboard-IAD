import snowflake from 'snowflake-sdk';
import { verifyToken } from '@clerk/backend';

export default async function handler(req, res) {
  // --- 1. SÉCURITÉ (Clerk) ---
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: "Non autorisé" });
  try {
    await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
  } catch (err) {
    return res.status(401).json({ error: "Token invalide" });
  }

  // --- 2. CONNEXION SNOWFLAKE ---
  const connection = snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT,
    username: process.env.SNOWFLAKE_USERNAME,
    password: process.env.SNOWFLAKE_PASSWORD,
    database: process.env.SNOWFLAKE_DATABASE,
    schema: process.env.SNOWFLAKE_SCHEMA,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE,
    role: process.env.SNOWFLAKE_ROLE,
  });

  await new Promise((resolve, reject) => {
    connection.connect((err, conn) => (err ? reject(err) : resolve(conn)));
  });

  try {
    // --- 3. REQUÊTE SQL OPTIMISÉE ---
    const query = `
      SELECT 
        DATE, 
        HEURE, 
        RESPONSABLE, 
        EVENEMENT, 
        DUREE_HRS, 
        LIBELLE AS DOSSIER, -- Alias pour correspondre au code Frontend
        NB_USERS 
      FROM V_EVENEMENT_TECHNIQUE
      WHERE 
        -- 1. Filtre Temporel (2025 et 2026 uniquement)
        DATE >= '2025-01-01' AND DATE <= '2026-12-31'
        
        -- 2. Filtre Techniciens (Liste spécifique)
        -- Utilisation de ILIKE pour gérer les majuscules/minuscules et l'ordre Nom/Prénom
        AND (
             RESPONSABLE ILIKE '%AYAT%Zakaria%' OR RESPONSABLE ILIKE '%Zakaria%AYAT%'
          OR RESPONSABLE ILIKE '%MESSIN%Jean-Michel%' OR RESPONSABLE ILIKE '%Jean-Michel%MESSIN%'
          OR RESPONSABLE ILIKE '%GROSSI%Mathieu%' OR RESPONSABLE ILIKE '%Mathieu%GROSSI%'
          OR RESPONSABLE ILIKE '%SAUROIS%Jean-Philippe%' OR RESPONSABLE ILIKE '%Jean-Philippe%SAUROIS%'
          OR RESPONSABLE ILIKE '%GAMONDES%Roderick%' OR RESPONSABLE ILIKE '%Roderick%GAMONDES%'
        )

        -- 3. Filtre Pertinence (On ne charge que les events liés aux migrations)
        AND (
             EVENEMENT ILIKE '%Avocatmail%' 
          OR EVENEMENT ILIKE '%Adwin%'
          OR EVENEMENT ILIKE '%Migration%'
        )
    `;

    // Exécution Backoffice
    const backofficeData = await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: query,
        complete: (err, stmt, rows) => (err ? reject(err) : resolve(rows)),
      });
    });

    // Exécution Encours (Vous pouvez garder l'ancienne vue ou adapter selon vos besoins)
    // J'ajoute un filtre basique sur RESPONSABLE ici aussi pour être cohérent
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
    res.status(500).json({ error: "Erreur serveur Snowflake" });
  } finally {
    // Optionnel : connection.destroy();
  }
}
