// api/getData.js
const snowflake = require('snowflake-sdk');

export default function handler(request, response) {
  // 1. Configuration de la connexion avec les variables Vercel
  const connection = snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT,
    username: process.env.SNOWFLAKE_USERNAME,
    password: process.env.SNOWFLAKE_PASSWORD,
    database: process.env.SNOWFLAKE_DB,
    schema: process.env.SNOWFLAKE_SCHEMA,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE,
    role: process.env.SNOWFLAKE_ROLE // Optionnel, supprime si pas besoin
  });

  return new Promise((resolve, reject) => {
    // 2. On se connecte
    connection.connect((err, conn) => {
      if (err) {
        console.error('Erreur connexion Snowflake:', err);
        response.status(500).json({ error: 'Erreur connexion Snowflake' });
        return resolve();
      }

      // 3. LA REQUÊTE SQL
      // Astuce : Utilise "AS" pour renommer tes colonnes SQL afin qu'elles
      // correspondent exactement aux noms que ton code React attendait du CSV 
      // (ex: "Evènement", "Durée", "Responsable")
      const sql = `
        SELECT 
            type_evenement AS "Evènement", 
            duree_minutes AS "Durée", 
            responsable_nom AS "Responsable", 
            date_action AS "Date",
            nom_client AS "Dossier",
            'backoffice' as "Source"
        FROM MA_TABLE_PROD
        UNION ALL
        SELECT 
            type_action AS "Evènement", 
            0 AS "Durée", 
            interlocuteur AS "Responsable", 
            date_prevue AS "Date",
            client AS "Dossier",
            'encours' as "Source"
        FROM MA_TABLE_ENCOURS
      `;

      conn.execute({
        sqlText: sql,
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('Erreur requête SQL:', err);
            response.status(500).json({ error: 'Erreur requête SQL ' + err.message });
          } else {
            // On renvoie les données au Frontend
            response.status(200).json(rows);
          }
          // On ferme la porte en partant
          conn.destroy(); 
          resolve();
        }
      });
    });
  });
}
