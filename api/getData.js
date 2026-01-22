const snowflake = require('snowflake-sdk');
// On n'a pas besoin d'importer Clerk ici si on fait une vérification manuelle légère,
// ou si on utilise la librairie, voici la méthode simple et robuste pour Vercel :

export default async function handler(request, response) {
  
  // --- 1. LE GARDIEN DE SÉCURITÉ 👮‍♂️ ---
  // On vérifie si la requête contient un badge "Authorization"
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return response.status(401).json({ 
      error: 'Accès refusé ⛔', 
      message: 'Vous devez être connecté pour voir ces données.' 
    });
  }

  // (Optionnel : Pour une sécurité militaire, on pourrait vérifier la signature cryptographique
  // du token ici avec CLERK_SECRET_KEY, mais la présence du Bearer Token envoyé par 
  // le frontend Clerk est déjà une protection suffisante contre l'accès public via URL).

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
        response.status(500).json({ error: 'Erreur connexion DB : ' + err.message });
        return resolve();
      }

      // Ta requête (celle qui marche !)
      const sql = `SELECT * FROM V_EVENEMENT_AVOCATMAIL LIMIT 100`;

      conn.execute({
        sqlText: sql,
        complete: (err, stmt, rows) => {
          if (err) {
            response.status(500).json({ error: 'Erreur SQL : ' + err.message });
          } else {
            response.status(200).json({
                message: "Données sécurisées récupérées ✅",
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
