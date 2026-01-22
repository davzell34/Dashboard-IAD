const snowflake = require('snowflake-sdk');

export default async function handler(request, response) {
  
  // --- 1. LE GARDIEN DE SÉCURITÉ 👮‍♂️ ---
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return response.status(401).json({ 
      error: 'Accès refusé ⛔', 
      message: 'Vous devez être connecté pour voir ces données.' 
    });
  }

  // --- 2. CONNEXION SNOWFLAKE ---
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
        console.error('Erreur connexion Snowflake:', err);
        response.status(500).json({ error: 'Erreur connexion DB : ' + err.message });
        return resolve();
      }

      // --- 3. LA REQUÊTE SQL FILTRÉE ---
      // On filtre sur les années 2025 et 2026 uniquement
      const sql = `
        SELECT 
            DATE,
            HEURE,
            DUREE_HRS,
            RESPONSABLE,
            DOSSIER,
            LIBELLE,
            EVENEMENT,
            NUMDOSSIER,
            "USER" 
        FROM V_EVENEMENT_AVOCATMAIL
        WHERE DATE >= '2025-01-01' AND DATE <= '2026-12-31'
        ORDER BY DATE DESC
      `;

      conn.execute({
        sqlText: sql,
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('Erreur exécution SQL:', err);
            // On renvoie l'erreur pour la voir dans le Dashboard
            response.status(500).json({ error: 'Erreur SQL : ' + err.message });
          } else {
            response.status(200).json({
                message: "Données 2025-2026 récupérées ✅",
                data: rows 
            });
          }
          conn.destroy();
          resolve();
        }
      });
    });
  });
}
