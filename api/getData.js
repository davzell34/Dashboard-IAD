import snowflake from 'snowflake-sdk';
import { verifyToken } from '@clerk/backend';

export default async function handler(req, res) {
  // 1. Sécurité Clerk
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: "Non autorisé" });
  }

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
    connection.connect((err, conn) => {
      if (err) {
        console.error('Unable to connect: ' + err.message);
        reject(err);
      } else {
        resolve(conn);
      }
    });
  });

  try {
    // 3. Exécution des requêtes SQL (Sur l'ancienne vue V_EVENEMENT_AVOCATMAIL)
    
    // Requête 1 : Historique / Backoffice
    const queryBackoffice = `
      SELECT * FROM V_EVENEMENT_AVOCATMAIL 
      WHERE DATE >= DATEADD(month, -12, CURRENT_DATE())
      ORDER BY DATE DESC
    `;
    
    const backofficeData = await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: queryBackoffice,
        complete: (err, stmt, rows) => {
          if (err) reject(err);
          else resolve(rows);
        },
      });
    });

    // Requête 2 : En cours / Tickets
    const queryEncours = `SELECT * FROM V_TICKETS_ENCOURS_AVOCATMAIL`;
    
    const encoursData = await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: queryEncours,
        complete: (err, stmt, rows) => {
          if (err) reject(err);
          else resolve(rows);
        },
      });
    });

    // 4. Renvoi des données
    res.status(200).json({
      backoffice: backofficeData,
      encours: encoursData
    });

  } catch (error) {
    console.error("Snowflake Query Error:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des données Snowflake" });
  } finally {
    // Optionnel : fermer la connexion si nécessaire, bien que souvent géré par le contexte serverless
    // connection.destroy();
  }
}
