const snowflake = require('snowflake-sdk');

export default function handler(request, response) {
  
  const connection = snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT,
    username: process.env.SNOWFLAKE_USERNAME,
    password: process.env.SNOWFLAKE_PASSWORD,
    database: process.env.SNOWFLAKE_DB,     // C'est ici que SEPTEO_SHARE est utilisé
    schema: process.env.SNOWFLAKE_SCHEMA,   // C'est ici que POLE_AVOCAT est utilisé
    warehouse: process.env.SNOWFLAKE_WAREHOUSE
  });

  return new Promise((resolve, reject) => {
    connection.connect((err, conn) => {
      if (err) {
        response.status(500).json({ error: 'Erreur connexion : ' + err.message });
        return resolve();
      }

      // LA REQUÊTE CIBLE
      // On limite à 100 lignes pour commencer et valider que ça marche
      const sql = `SELECT * FROM V_GETLISTEDOSSIERSRECHERCHES LIMIT 100`;

      conn.execute({
        sqlText: sql,
        complete: (err, stmt, rows) => {
          if (err) {
            response.status(500).json({ 
                error: 'Erreur SQL ❌', 
                details: err.message,
                query: sql
            });
          } else {
            response.status(200).json({
                message: "Données récupérées avec succès ✅",
                total: rows.length,
                data: rows // Tes vraies données seront ici
            });
          }
          conn.destroy();
          resolve();
        }
      });
    });
  });
}
