const snowflake = require('snowflake-sdk');

export default function handler(request, response) {
  // 1. Configuration de la connexion
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
        console.error('Erreur de connexion :', err);
        // Affiche l'erreur précise pour t'aider à débugger
        response.status(500).json({ 
            status: "Echec de connexion ❌", 
            message: err.message 
        });
        return resolve();
      }

      // 2. La requête "Ping" (Ne nécessite aucune de tes tables)
      // On demande juste des infos système pour valider les droits
      const sql = `
        SELECT 
            current_version() as "Version Snowflake",
            current_user() as "Utilisateur Connecté",
            current_database() as "Base de Données",
            current_schema() as "Schema Actuel",
            current_warehouse() as "Warehouse"
      `;

      // OPTIONNEL : Si tu as une table et que tu veux voir 5 lignes, 
      // décommente la ligne ci-dessous et remplace NOM_DE_TA_TABLE :
      // const sql = `SELECT * FROM NOM_DE_TA_TABLE LIMIT 5`;

      conn.execute({
        sqlText: sql,
        complete: (err, stmt, rows) => {
          if (err) {
            response.status(500).json({ error: 'Erreur SQL : ' + err.message });
          } else {
            // 3. Succès ! On renvoie les infos
            response.status(200).json({
                status: "Connexion Réussie ! ✅",
                resultat: rows
            });
          }
          conn.destroy();
          resolve();
        }
      });
    });
  });
}
