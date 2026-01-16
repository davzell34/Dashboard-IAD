const snowflake = require('snowflake-sdk');

export default function handler(request, response) {
  
  // --- CONFIGURATION ---
  // Mets ici le nom de la table que tu veux inspecter (ex: "CLIENTS", "LOGS", etc.)
  const TABLE_A_EXPLORER = "V_GETLISTEDOSSIERSRECHERCHES"; 

  const connection = snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT,
    username: process.env.SNOWFLAKE_USERNAME,
    password: process.env.SNOWFLAKE_PASSWORD,
    database: process.env.SNOWFLAKE_DB,
    schema: process.env.SNOWFLAKE_SCHEMA,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE
  });

  return new Promise((resolve, reject) => {
    connection.connect((err, conn) => {
      if (err) {
        response.status(500).json({ error: 'Erreur connexion : ' + err.message });
        return resolve();
      }

      // On récupère TOUT (*) mais on limite à 100 lignes pour ne pas faire exploser le navigateur
      const sql = `SELECT * FROM "${V_GETLISTEDOSSIERSRECHERCHES}" LIMIT 100`;

      conn.execute({
        sqlText: sql,
        complete: (err, stmt, rows) => {
          if (err) {
            // Si la table n'existe pas, tu verras l'erreur ici
            response.status(500).json({ 
                titre: "Erreur SQL ❌", 
                message: err.message,
                conseil: "Vérifie le nom de la table (Majuscules ? Guillemets ?)"
            });
          } else {
            response.status(200).json({
                titre: `Contenu de la table ${TABLE_A_EXPLORER} (100 premières lignes) ✅`,
                total_lignes_recuperees: rows.length,
                donnees: rows
            });
          }
          conn.destroy();
          resolve();
        }
      });
    });
  });
}
