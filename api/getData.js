import { verifyToken } from '@clerk/backend';
const snowflake = require('snowflake-sdk');

export default async function handler(request, response) {
  
  // --- 1. SÉCURITÉ RENFORCÉE 👮‍♂️ ---
  // On vérifie non seulement la présence du token, mais aussi sa validité cryptographique
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return response.status(401).json({ error: 'Accès refusé ⛔ : Aucun token fourni.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Vérification de la signature du token auprès de Clerk
    // Cela garantit que le token a bien été généré par votre application et n'a pas expiré
    await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
  } catch (error) {
    console.error("Token invalide:", error);
    return response.status(401).json({ error: 'Accès refusé ⛔ : Token invalide ou expiré.' });
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

  // Fonction utilitaire pour exécuter une requête SQL proprement
  const runQuery = (conn, sql) => {
    return new Promise((resolve, reject) => {
      conn.execute({
        sqlText: sql,
        complete: (err, stmt, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      });
    });
  };

  return new Promise((resolve, reject) => {
    connection.connect(async (err, conn) => {
      if (err) {
        console.error('Erreur connexion Snowflake:', err);
        response.status(500).json({ error: 'Erreur connexion DB' });
        return resolve();
      }

      try {
        // --- REQUÊTE 1 : BACKOFFICE (Historique 2025-2026) ---
        const sqlBackoffice = `
            SELECT DATE, HEURE, DUREE_HRS, RESPONSABLE, DOSSIER, LIBELLE, EVENEMENT, NUMDOSSIER, "USER"
            FROM V_EVENEMENT_AVOCATMAIL
            WHERE DATE >= '2025-01-01' AND DATE <= '2026-12-31'
            ORDER BY DATE DESC
        `;

        // --- REQUÊTE 2 : EN COURS (Tickets actifs 2025-2026) ---
        const sqlEncours = `
            SELECT 
                ETAT_PRIORITE,
                CREE_LE,
                NB_RAPPELS_CLIENT,
                RESPONSABLE,
                MOTIF,
                DUREE_MINUTES,
                DERNIERE_ACTION,
                NUMERO_DOSSIER,
                CATEGORIE,
                INTERLOCUTEUR
            FROM V_TICKETS_SERVICE_TECHNIQUE
            WHERE DERNIERE_ACTION >= '2025-01-01' AND DERNIERE_ACTION <= '2026-12-31'
        `;

        // Exécution séquentielle
        console.log("Exécution requête Backoffice...");
        const backofficeRows = await runQuery(conn, sqlBackoffice);
        
        console.log("Exécution requête Encours...");
        const encoursRows = await runQuery(conn, sqlEncours);

        // Réponse combinée
        response.status(200).json({
            message: "Données 2025-2026 complètes récupérées ✅",
            backoffice: backofficeRows,
            encours: encoursRows
        });

      } catch (queryErr) {
        console.error('Erreur SQL:', queryErr);
        response.status(500).json({ error: 'Erreur lors des requêtes : ' + queryErr.message });
      } finally {
        conn.destroy();
        resolve();
      }
    });
  });
}
