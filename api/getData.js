import { verifyToken } from '@clerk/backend';
const { createSnowflakeConnection } = require('./_snowflake');

// Liste de secours si le front n'envoie rien ou envoie une valeur invalide.
const DEFAULT_TECH_LAST_NAMES = ['AYAT', 'MESSIN', 'GROSSI', 'SAUROIS', 'GAMONDES'];

// Valide un format YYYY-MM-DD simple pour éviter d'injecter n'importe quoi
// dans les binds Snowflake.
const isValidDate = (str) => typeof str === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(str);

// Extrait les noms de famille (dernier mot de chaque "Prénom NOM") depuis le
// paramètre `techs` (JSON stringifié envoyé par le front), pour construire le
// filtre ILIKE dynamiquement plutôt que sur une liste figée dans le code.
const getTechLastNames = (techsParam) => {
  try {
    const parsed = JSON.parse(techsParam);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const names = parsed
        .map(t => String(t).trim().split(' ').pop().toUpperCase())
        .filter(Boolean);
      if (names.length > 0) return names;
    }
  } catch (e) {
    // paramètre absent ou invalide : on retombe sur la liste par défaut
  }
  return DEFAULT_TECH_LAST_NAMES;
};

export default async function handler(request, response) {
  
  // 1. SÉCURITÉ
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return response.status(401).json({ error: 'Accès refusé ⛔' });
  }

  const token = authHeader.split(' ')[1];

  // 1bis. SCOPE DE DATES (envoyé par le front, avec repli sur les valeurs par défaut)
  const rangeStart = isValidDate(request.query?.start) ? request.query.start : DEFAULT_DATE_START;
  const rangeEnd = isValidDate(request.query?.end) ? request.query.end : DEFAULT_DATE_END;
  const techLastNames = getTechLastNames(request.query?.techs);

  try {
    if (process.env.CLERK_SECRET_KEY) {
        await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    }
  } catch (error) {
    console.error("Token invalide:", error);
    return response.status(401).json({ error: 'Accès refusé ⛔' });
  }

  // 2. CONNEXION
  const connection = createSnowflakeConnection();

  const runQuery = (conn, sql, binds = []) => {
    return new Promise((resolve, reject) => {
      conn.execute({
        sqlText: sql,
        binds,
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
        // Construit dynamiquement à partir de la liste envoyée par le front
        // (gérée dans l'UI), avec ILIKE pour ignorer la casse.
        const filtreTechs = `AND (${techLastNames.map(() => 'RESPONSABLE ILIKE ?').join(' OR ')})`;
        const techBinds = techLastNames.map(name => `%${name}%`);

        // --- REQUÊTE 1 : BACKOFFICE ---
        // Chargée intégralement sur le scope de dates (nécessaire au calcul de
        // capacité / absorption des besoins) : pas de pagination ici.
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
            WHERE DATE >= ? AND DATE <= ?
            ${filtreTechs}
            ORDER BY DATE DESC
        `;

        // --- REQUÊTE 2 : EN COURS ---
        // Chargée intégralement elle aussi : les KPI, graphiques et compteurs
        // "Prêt pour..." sont calculés côté front à partir de TOUT le backlog
        // sur le scope de dates. La pagination visible dans l'UI (tableau
        // "Détail des Opérations") se fait uniquement côté affichage, une fois
        // les données chargées, pour ne pas fausser les agrégats.
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
            WHERE COALESCE(REPORTE_LE, DERNIERE_ACTION) >= ? 
              AND COALESCE(REPORTE_LE, DERNIERE_ACTION) <= ?
            ${filtreTechs}
        `;

        console.log(`Exécution requêtes filtrées [${rangeStart} → ${rangeEnd}], techs: ${techLastNames.join(', ')}...`);
        const backofficeRows = await runQuery(conn, sqlBackoffice, [rangeStart, rangeEnd, ...techBinds]);
        const encoursRows = await runQuery(conn, sqlEncours, [rangeStart, rangeEnd, ...techBinds]);

        response.status(200).json({
            message: "Données filtrées récupérées ✅",
            backoffice: backofficeRows,
            encours: encoursRows,
            dateRange: { start: rangeStart, end: rangeEnd }
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
