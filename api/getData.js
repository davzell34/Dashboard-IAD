import { verifyToken } from '@clerk/backend';
const { createSnowflakeConnection } = require('./_snowflake');

// Bornes de dates par défaut, utilisées si le front n'en envoie pas
// (doivent rester cohérentes avec DEFAULT_WEIGHTS.date_range_start/end côté App.js).
const DEFAULT_DATE_START = '2025-10-01';
const DEFAULT_DATE_END = '2026-03-01';

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
                OFFER_ID,
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
                NUMERO_INCIDENT,
                CATEGORIE,
                INTERLOCUTEUR
            FROM V_TICKETS_SERVICE_TECHNIQUE
            WHERE COALESCE(REPORTE_LE, DERNIERE_ACTION) >= ? 
              AND COALESCE(REPORTE_LE, DERNIERE_ACTION) <= ?
            ${filtreTechs}
        `;

        // --- REQUÊTE 3 : ÉVÉNEMENTS "CAS PARTICULIER" (V_EVENEMENT, pas V_EVENEMENT_TECHNIQUE) ---
        // Deux types d'événements qui dépendent de la fin de la migration,
        // ni l'un ni l'autre dans la vue technique :
        //  - Formation ADAPPS (TYPE_EVENEMENT = 'Formation', libellé contient "ADAPPS")
        //  - Intervention matériel sur site (TYPE_EVENEMENT = 'Technique', libellé contient "matériel")
        // Pas de filtre technicien : la formation ou l'intervention matériel
        // peut être assignée à quelqu'un d'autre que le technicien de migration.
        // Fenêtre élargie de 90 jours après la fin du scope pour les capter
        // même si elles sont planifiées après la clôture de la période affichée.
        const formationRangeEndDate = new Date(`${rangeEnd}T00:00:00Z`);
        formationRangeEndDate.setUTCDate(formationRangeEndDate.getUTCDate() + 90);
        const formationRangeEnd = formationRangeEndDate.toISOString().split('T')[0];

        const sqlSpecialEvents = `
            SELECT 
                DATE,
                EVENEMENT,
                OFFER_ID,
                NUMDOSSIER,
                TYPE_EVENEMENT,
                RESPONSABLE
            FROM V_EVENEMENT
            WHERE DATE >= ? AND DATE <= ?
              AND (
                    (TYPE_EVENEMENT = 'Formation' AND EVENEMENT ILIKE '%ADAPPS%')
                 OR (TYPE_EVENEMENT = 'Technique' AND (EVENEMENT ILIKE '%materiel%' OR EVENEMENT ILIKE '%matériel%'))
              )
        `;

        console.log(`Exécution requêtes filtrées [${rangeStart} → ${rangeEnd}], techs: ${techLastNames.join(', ')}...`);
        const backofficeRows = await runQuery(conn, sqlBackoffice, [rangeStart, rangeEnd, ...techBinds]);
        const encoursRows = await runQuery(conn, sqlEncours, [rangeStart, rangeEnd, ...techBinds]);
        const specialEventRows = await runQuery(conn, sqlSpecialEvents, [rangeStart, formationRangeEnd]);

        // --- REQUÊTE 4 : NOTES DES TICKETS "[IAD] - Préparation Avocatmail" ---
        // Les notes vivent dans V_TICKET (colonne TIC_KPI_NOTES, un tableau
        // JSON imbriqué) et pas dans V_TICKETS_SERVICE_TECHNIQUE. On ne va
        // chercher les notes QUE pour les tickets IAD déjà identifiés dans
        // encoursRows (via NUMERO_INCIDENT), pour ne pas alourdir la requête
        // avec des notes de tickets qui ne nous intéressent pas ici.
        // LATERAL FLATTEN + GROUP BY (pas de sous-requête corrélée LISTAGG,
        // qui avait fait planter Snowflake par le passé sur ce même besoin).
        const iadIncidentIds = [...new Set(
            encoursRows
                .filter(r => String(r.MOTIF || '').startsWith('[IAD] - Préparation Avocatmail'))
                .map(r => r.NUMERO_INCIDENT)
                .filter(Boolean)
        )];

        let ticketNotesRows = [];
        if (iadIncidentIds.length > 0) {
            const sqlNotes = `
                SELECT 
                    t.TICKET_ID,
                    LISTAGG(
                        REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                            REGEXP_REPLACE(
                                REGEXP_REPLACE(
                                    REGEXP_REPLACE(n.value:"Contenu Note"::string, '<br[[:space:]]*/?>', '\n', 1, 0, 'i'),
                                    '</(p|div|li|tr|td|h[1-6])>', '\n', 1, 0, 'i'
                                ),
                                '<[^>]+>', ' ', 1, 0, 'i'
                            )
                        , '&eacute;','é'), '&egrave;','è'), '&agrave;','à'), '&ecirc;','ê'), '&ccedil;','ç'), '&ocirc;','ô'), '&ugrave;','ù'), '&nbsp;',' '), '&amp;','&'), '&gt;','>')
                    , '\n---\n') WITHIN GROUP (ORDER BY n.index) AS notes_clean
                FROM SEPTEO_SHARE.POLE_AVOCAT.V_TICKET t, LATERAL FLATTEN(input => t.TIC_KPI_NOTES, outer => TRUE) n
                WHERE t.TICKET_ID IN (${iadIncidentIds.map(() => '?').join(',')})
                GROUP BY t.TICKET_ID
            `;
            ticketNotesRows = await runQuery(conn, sqlNotes, iadIncidentIds);
        }

        // --- REQUÊTE 5 : RELANCES (priorité de relance client, vue "Relances" du dashboard) ---
        // Contrairement aux requêtes 1/2 (V_EVENEMENT_TECHNIQUE / V_TICKETS_SERVICE_TECHNIQUE,
        // scopées au workflow de migration), on interroge ici directement
        // SEPTEO_SHARE.POLE_AVOCAT.V_TICKET pour récupérer les champs de suivi
        // de relance (nombre de relances, statut, date de dernier message) qui
        // n'existent pas dans les vues "service technique". Même filtre
        // technicien (TIC_KPI_EMPLOYEE_RESP_NAME) que le reste du dashboard,
        // pour rester cohérent avec l'équipe suivie ici.
        // HYPOTHÈSES À VALIDER EN CONSOLE (cf. conversation) :
        //  - le pattern ILIKE '%attente%client%' sur TIC_KPI_STATUS pour détecter
        //    un statut "attente client" (valeurs réelles non confirmées)
        //  - la pondération du score (JOURS_SANS_MAJ x1, RELANCES x5, +10 si attente client)
        const filtreTechsRelances = `AND (${techLastNames.map(() => 'TIC_KPI_EMPLOYEE_RESP_NAME ILIKE ?').join(' OR ')})`;
        const techBindsRelances = techLastNames.map(name => `%${name}%`);

        const sqlRelances = `
            WITH parametre AS (
                SELECT TO_DATE(?) AS DATE_DEBUT, CURRENT_DATE() AS DATE_REF
            ),
            tickets AS (
                SELECT
                    TO_VARCHAR(t.TICKET_ID::INTEGER)   AS TICKET_ID,
                    t.CUSTOMER_NAME                    AS CABINET,
                    t.TIC_KPI_REASON                   AS MOTIF,
                    t.TIC_KPI_PRIORITY                 AS PRIORITE,
                    t.TIC_KPI_STATUS                   AS STATUT,
                    t.TIC_KPI_EMPLOYEE_RESP_NAME        AS TECHNICIEN,
                    t.TIC_KPI_CONTACT_NAME              AS CONTACT_CLIENT,
                    COALESCE(t.TIC_KPI_NUMBER_DUNNING, 0) AS RELANCES,
                    GREATEST(DATEDIFF('day',
                        COALESCE(t.TIC_KPI_STATUS_DATE, t.TIC_KPI_LAST_UPDATE, t.TIC_KPI_CREATION_DATE),
                        p.DATE_REF), 0)                                    AS JOURS_SANS_MAJ,
                    (t.TIC_KPI_STATUS ILIKE '%clot%' OR t.TIC_KPI_STATUS ILIKE '%résolu%'
                     OR t.TIC_KPI_STATUS ILIKE '%fermé%' OR t.TIC_KPI_CLOSING_DATE IS NOT NULL) AS EST_CLOS,
                    (t.TIC_KPI_STATUS ILIKE '%attente%client%')            AS ATTENTE_CLIENT
                FROM SEPTEO_SHARE.POLE_AVOCAT.V_TICKET t
                CROSS JOIN parametre p
                WHERE t.TIC_KPI_CREATION_DATE >= p.DATE_DEBUT
                ${filtreTechsRelances}
            )
            SELECT
                TICKET_ID, CABINET, MOTIF, PRIORITE, STATUT, TECHNICIEN, CONTACT_CLIENT,
                JOURS_SANS_MAJ, RELANCES, ATTENTE_CLIENT,
                (JOURS_SANS_MAJ * 1) + (RELANCES * 5) + (CASE WHEN ATTENTE_CLIENT THEN 10 ELSE 0 END) AS SCORE_RELANCE
            FROM tickets
            WHERE NOT EST_CLOS
            ORDER BY SCORE_RELANCE DESC
            LIMIT 50
        `;

        const relancesRows = await runQuery(conn, sqlRelances, [rangeStart, ...techBindsRelances]);

        response.status(200).json({
            message: "Données filtrées récupérées ✅",
            backoffice: backofficeRows,
            encours: encoursRows,
            specialEvents: specialEventRows,
            ticketNotes: ticketNotesRows,
            relances: relancesRows,
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
