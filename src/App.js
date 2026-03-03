const categorie = safeString(cleanRow['CATEGORIE']);
          const motif = safeString(cleanRow['MOTIF']);
          const clientName = safeString(cleanRow['INTERLOCUTEUR'] || 'Client Inconnu');
          const reportDateStr = cleanRow['REPORTE_LE'];
          
          // --- NOUVEAU : Calcul de l'âge du ticket ---
          const creeLeStr = cleanRow['CREE_LE'];
          const creeLeDate = parseDateSafe(creeLeStr);
          let ageWarning = null;
          let creeLeFormatted = "N/A";

          if (creeLeDate) {
              creeLeFormatted = creeLeDate.toLocaleDateString('fr-FR');
              const diffTime = Date.now() - creeLeDate.getTime();
              const diffWeeks = diffTime / (1000 * 60 * 60 * 24 * 7); // Différence en semaines

              if (diffWeeks > 6) {
                  ageWarning = 'red';
              } else if (diffWeeks > 4) {
                  ageWarning = 'orange';
              }
          }
          // -------------------------------------------
