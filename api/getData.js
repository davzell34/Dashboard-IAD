import snowflake from 'snowflake-sdk';
import { verifyToken } from '@clerk/backend';

export default async function handler(req, res) {
  // 1. Sécurité Clerk (Identique à avant)
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: "Non autorisé" });
  try {
    await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
  } catch (err) {
    return res.status(401).json({ error: "Token invalide" });
  }

  // 2. Connexion Snowflake
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
    // 3. Requête SQL mise à jour vers V_EVENEMENT_TECHNIQUE
    // J'utilise des ALIAS (AS) pour garantir que le Frontend reçoive les bonnes clés
    // même si la nouvelle vue a des noms légèrement différents.
    const query = `
      SELECT 
        DATE, 
        HEURE, 
        RESPONSABLE, 
        EVENEMENT,       -- Assurez-vous que cette colonne contient bien "Avocatmail - Analyse", etc.
        DUREE_HRS, 
        LIBELLE AS DOSSIER, -- Adaptation possible si la colonne s'appelle LIBELLE dans la nouvelle vue
        NB_USERS 
      FROM V_EVENEMENT_TECHNIQUE
      WHERE 
        -- Optimisation : On ne charge pas tout l'historique inutilement
        DATE >= DATEADD(month, -12, CURRENT_DATE()) 
        AND (
            -- Filtre SQL optionnel pour alléger le transfert de données
            EVENEMENT ILIKE '%Avocatmail%' 
            OR EVENEMENT ILIKE '%Adwin%'
            OR EVENEMENT ILIKE '%Migration%'
        )
    `;

    // Récupération Backoffice
    const backofficeData = await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: query,
        complete: (err, stmt, rows) => (err ? reject(err) : resolve(rows)),
      });
    });

    // Récupération Encours (Reste probablement inchangé, ou pointe vers la même vue ?)
    // Si l'encours est une autre vue (ex: V_TICKETS_ENCOURS), on la laisse telle quelle.
    const encoursQuery = `SELECT * FROM V_TICKETS_ENCOURS_AVOCATMAIL`; 
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
    // Si la connexion reste ouverte trop longtemps, Vercel peut timer out
    // connection.destroy(); // Décommenter si besoin
  }
}
