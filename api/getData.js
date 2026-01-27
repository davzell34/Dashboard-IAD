import { verifyToken } from '@clerk/backend';
const snowflake = require('snowflake-sdk');

export default async function handler(request, response) {
  
  // 1. SÉCURITÉ
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return response.status(401).json({ error: 'Accès refusé ⛔' });
  }

  const token = authHeader.split(' ')[1];

  try {
    if (process.env.CLERK_SECRET_KEY) {
        await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    }
  } catch (error) {
    console.error("Token invalide:", error);
    return response.status(401).json({ error: 'Accès refusé ⛔' });
  }

  // 2. CONNEXION
  const connection = snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT,
    username: process.env.SNOWFLAKE_USERNAME,
    password: process.env.SNOWFLAKE_PASSWORD,
    database: process.env.SNOWFLAKE_DB,
    schema: process.env.SNOWFLAKE_SCHEMA,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE
  });

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
        // --- FILTRE RESPONSABLES (Réutilisable) ---
        // Utilisation de ILIKE pour ignorer la casse (majuscule/minuscule)
        const filtreTechs = `
            AND (
                 RESPONSABLE ILIKE '%AYAT%' 
              OR RESPONSABLE ILIKE '%MESSIN%' 
              OR RESPONSABLE ILIKE '%GROSSI%' 
              OR RESPONSABLE ILIKE '%SAUROIS%' 
              OR RESPONSABLE ILIKE '%GAMONDES%'
            )
        `;

        // --- REQUÊTE 1 : BACKOFFICE ---
        const sqlBackoffice = `
            SELECT 
                DATE, 
                HEURE, 
                DUREE_HRS, 
                RESPONSABLE, 
                DOSSIER, 
                LIBELLE, 
                EVENEMENT, 
                NUMDOSSIER, 
                "USER" as NB_USERS -- Alias pour compatibilité frontend
            FROM V_EVENEMENT_TECHNIQUE
            WHERE DATE >= '2025-01-01' AND DATE <= '2026-12-31'
            ${filtreTechs}
            ORDER BY DATE DESC
        `;

        // --- REQUÊTE 2 : EN COURS ---
        const sqlEncours = `
            SELECT 
                ETAT_PRIORITE,
                CREE_LE,
                NB_RAPPELS_CLIENT,
                RESPONSABLE,
                MOTIF,
                DUREE_MINUTES,
                DERNIERE_ACTION,
                REPORTE_LE,
                NUMERO_DOSSIER,
                CATEGORIE,
                INTERLOCUTEUR
            FROM V_TICKETS_SERVICE_TECHNIQUE
            WHERE COALESCE(REPORTE_LE, DERNIERE_ACTION) >= '2025-01-01' 
              AND COALESCE(REPORTE_LE, DERNIERE_ACTION) <= '2026-12-31'
            ${filtreTechs}
        `;

        console.log("Exécution requêtes filtrées...");
        const backofficeRows = await runQuery(conn, sqlBackoffice);
        const encoursRows = await runQuery(conn, sqlEncours);

        response.status(200).json({
            message: "Données filtrées récupérées ✅",
            backoffice: backofficeRows,
            encours: encoursRows
        });

      } catch (queryErr) {
        console.error('Erreur SQL:', queryErr);
        response.status(500).json({ error: 'Erreur requêtes : ' + queryErr.message });
      } finally {
        conn.destroy();
        resolve();
      }
    });
  });
}
