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

    // --- 3. LE TEST ULTIME ---
    // On sélectionne TOUT (*) mais sur 1 seule ligne.
    // Cela ne plantera pas à cause d'un mauvais nom de colonne.
    const query = `SELECT * FROM V_EVENEMENT_TECHNIQUE LIMIT 1`;

    const result = await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: query,
        complete: (err, stmt, rows) => {
          if (err) reject(err);
          else resolve(rows);
        },
      });
    });

    // On renvoie le résultat brut pour lecture dans la console
    // On met 'result' dans 'backoffice' pour que le front l'affiche sans crasher
    res.status(200).json({ 
        message: "DIAGNOSTIC REUSSI", 
        colonnes_trouvees: result.length > 0 ? Object.keys(result[0]) : "Aucune donnée trouvée",
        backoffice: [], 
        encours: [],
        debug_row: result[0] // On verra la ligne complète
    });

  } catch (error) {
    console.error("Snowflake Error:", error);
    res.status(500).json({ 
        error: "ECHEC DIAGNOSTIC", 
        message: error.message, 
        sqlState: error.sqlState 
    });
  }
}
