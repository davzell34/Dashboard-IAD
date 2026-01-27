import snowflake from 'snowflake-sdk';
import { verifyToken } from '@clerk/backend';

export default async function handler(req, res) {
  // 1. SÉCURITÉ
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: "Token manquant" });
  try {
    await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
  } catch (err) {
    return res.status(401).json({ error: "Token invalide" });
  }

  // 2. CONNEXION
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

    // --- TEST 1 : OÙ SUIS-JE ? ---
    const contextQuery = `SELECT CURRENT_DATABASE() as DB, CURRENT_SCHEMA() as SC, CURRENT_ROLE() as RL`;
    const contextResult = await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: contextQuery,
        complete: (err, stmt, rows) => (err ? reject(err) : resolve(rows)),
      });
    });

    // --- TEST 2 : QU'EST-CE QUE JE VOIS ? ---
    // On cherche tout ce qui ressemble à "EVENEMENT" dans le schéma actuel
    const searchViewQuery = `
        SELECT TABLE_NAME, TABLE_SCHEMA 
        FROM INFORMATION_SCHEMA.VIEWS 
        WHERE TABLE_NAME ILIKE '%EVENEMENT%'
    `;
    const viewsResult = await new Promise((resolve, reject) => {
        connection.execute({
          sqlText: searchViewQuery,
          complete: (err, stmt, rows) => (err ? reject(err) : resolve(rows)),
        });
      });

    // RÉSULTAT
    res.status(200).json({ 
        message: "AUDIT CONNEXION", 
        contexte_actuel: contextResult[0], // Affiche DB, SCHEMA et ROLE
        vues_trouvees: viewsResult,        // Affiche la liste des vues disponibles
        backoffice: [], // Vide pour ne pas faire planter le front
        encours: []
    });

  } catch (error) {
    console.error("Snowflake Error:", error);
    res.status(500).json({ 
        error: "ERREUR CRITIQUE", 
        message: error.message, // LE MESSAGE IMPORTANT EST ICI
        code: error.code 
    });
  }
}
