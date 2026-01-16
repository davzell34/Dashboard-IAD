import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ComposedChart, ReferenceLine, RadialBarChart, RadialBar
} from 'recharts';
import { 
  Activity, Users, Clock, TrendingUp, AlertTriangle, CheckCircle, 
  Calendar, BarChart2, Filter, Info, X, Table as TableIcon, ChevronDown, ChevronUp, FileText, Briefcase, Upload, FileSpreadsheet, Loader
} from 'lucide-react';

// --- CONFIGURATION ---
const TECH_LIST_DEFAULT = ["Jean-Philippe SAUROIS", "Jean-michel MESSIN", "Mathieu GROSSI", "Roderick GAMONDES", "Zakaria AYAT"];

// --- UTILITAIRES ---

const normalizeTechName = (name, techList) => {
  if (!name || typeof name !== 'string') return "Inconnu";
  const cleanName = name.trim();
  const upperName = cleanName.toUpperCase();
  
  for (const tech of techList) {
    if (tech.toUpperCase() === upperName) return tech;
    const lastName = tech.split(' ').pop().toUpperCase();
    if (upperName.includes(lastName)) return tech;
  }
  return cleanName;
};

const formatMonth = (dateStr) => {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
};

// Fonction simple pour parser un CSV (séparateur , ou ;)
const parseCSV = (text) => {
  if (!text) return [];
  const lines = text.split(/\r\n|\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  // Détection du séparateur (virgule ou point-virgule)
  const firstLine = lines[0];
  const separator = firstLine.includes(';') ? ';' : ',';

  const headers = firstLine.split(separator).map(h => h.trim().replace(/"/g, ''));
  
  return lines.slice(1).map(line => {
    // Gestion basique des guillemets
    const regex = new RegExp(`(?:${separator}|\\r?\\n|^)(?:"([^"]*)"|([^"${separator}]*))`, 'g');
    const values = [];
    let match;
    while ((match = regex.exec(line))) {
       // match[1] is quoted value, match[2] is unquoted
       values.push(match[1] ? match[1] : match[2]); 
    }
    // Fallback simple split si regex échoue ou trop complexe
    const simpleValues = line.split(separator).map(val => val.trim().replace(/^"|"$/g, ''));
    
    // On utilise simpleValues si le compte correspond, sinon on essaie de mapper au mieux
    const dataRow = simpleValues.length === headers.length ? simpleValues : values;

    return headers.reduce((obj, header, index) => {
      obj[header] = dataRow[index] || '';
      return obj;
    }, {});
  });
};

// --- COMPOSANTS UI ---

const KPICard = ({ title, value, subtext, icon: Icon, colorClass, active, onClick }) => (
  <div 
    onClick={onClick}
    className={`px-4 py-3 rounded-lg shadow-sm border transition-all duration-300 flex items-center justify-between ${active ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100' : 'bg-white border-slate-100'} ${onClick ? 'cursor-pointer hover:bg-slate-50' : ''}`}
  >
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-xl font-bold text-slate-800">{value}</h3>
        {subtext && <p className={`text-xs font-medium ${colorClass}`}>{subtext}</p>}
      </div>
    </div>
    <div className={`p-2 rounded-md ${colorClass.replace('text-', 'bg-').replace('600', '100').replace('500', '100')}`}>
      <Icon className={`w-4 h-4 ${colorClass}`} />
    </div>
  </div>
);

// --- APPLICATION PRINCIPALE ---

export default function MigrationDashboard() {
  // États des données (Initialisés vides)
  const [backofficeData, setBackofficeData] = useState([]);
  const [encoursData, setEncoursData] = useState([]);
  const [techList, setTechList] = useState(TECH_LIST_DEFAULT);
  
  // États de chargement
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // États de l'interface
  const [selectedTech, setSelectedTech] = useState('Tous');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [isTableExpanded, setIsTableExpanded] = useState(false); 
  const [isDetailListExpanded, setIsDetailListExpanded] = useState(true);
  const [showPlanning, setShowPlanning] = useState(false); 

  // --- LOGIQUE D'IMPORTATION INTELLIGENTE ---

  const handleSmartUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setLoadingMsg("Analyse des fichiers en cours...");
    setErrorMsg('');
    
    let newBackofficeData = [];
    let newEncoursData = [];
    let foundBackoffice = false;
    let foundEncours = false;

    // Compteur pour savoir quand tous les fichiers sont lus
    let filesRead = 0;

    files.forEach(file => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const jsonData = parseCSV(text);

          if (jsonData.length > 0) {
            // Détection automatique du type de fichier via les colonnes
            const columns = Object.keys(jsonData[0]);
            
            // Fichier Backoffice contient généralement "Evènement"
            if (columns.some(c => c.includes('Evènement') || c.includes('Evenement') || c.includes('Dossier'))) {
              newBackofficeData = jsonData;
              foundBackoffice = true;
            } 
            // Fichier Encours contient "Interlocuteur"
            else if (columns.some(c => c.includes('Interlocuteur') || c.includes('Catégorie') || c.includes('Client'))) {
              newEncoursData = jsonData;
              foundEncours = true;
            }
          }
        } catch (err) {
          console.error("Erreur parsing", err);
        } finally {
          filesRead++;
          // Vérification finale une fois tous les fichiers lus
          if (filesRead === files.length) {
            if (foundBackoffice || foundEncours) {
              if (foundBackoffice) setBackofficeData(newBackofficeData);
              if (foundEncours) setEncoursData(newEncoursData);
              
              // Mise à jour de la liste des techniciens
              const techs = new Set();
              if (foundBackoffice) {
                newBackofficeData.forEach(row => {
                  if (row['Responsable']) techs.add(normalizeTechName(row['Responsable'], TECH_LIST_DEFAULT));
                });
              }
              if (foundEncours) {
                newEncoursData.forEach(row => {
                  if (row['Interlocuteur']) techs.add(normalizeTechName(row['Interlocuteur'], TECH_LIST_DEFAULT));
                });
              }
              if (techs.size > 0) setTechList(Array.from(techs).sort());
              
              setIsDataLoaded(true);
              setLoadingMsg('');
            } else {
              setErrorMsg("Impossible d'identifier les fichiers. Vérifiez qu'il s'agit bien de fichiers CSV valides avec les bonnes colonnes.");
              setLoadingMsg('');
            }
          }
        }
      };
      reader.readAsText(file); // Lecture en texte pour CSV
    });
  };

  // --- TRAITEMENT DES DONNÉES (Core Logic) ---

  const { detailedData, eventsData, planningCount } = useMemo(() => {
    if (!isDataLoaded) return { detailedData: [], eventsData: [], planningCount: 0 };

    const events = [];
    const planningEventsList = [];
    const monthlyStats = new Map();

    // 1. Traitement Backoffice
    backofficeData.forEach(row => {
      // Nettoyage des clés (parfois des espaces invisibles dans les headers CSV)
      const cleanRow = {};
      Object.keys(row).forEach(k => cleanRow[k.trim()] = row[k]);

      if (!['Avocatmail - Analyse', 'Migration messagerie Adwin', 'Tache de backoffice Avocatmail'].includes(cleanRow['Evènement'])) return;
      
      let dateStr = cleanRow['Date']; 
      if (!dateStr) return;
      
      // Tentative de parsing date format YYYY-MM-DD ou DD/MM/YYYY
      if (dateStr.includes('/')) {
         const parts = dateStr.split(' ')[0].split('/');
         if (parts.length === 3) dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`; // Convertir DD/MM/YYYY en YYYY-MM-DD
      }
      
      const month = dateStr.substring(0, 7);
      const tech = normalizeTechName(cleanRow['Responsable'], techList);
      
      // Calcul Durée
      let duration = 0;
      const dureeStr = cleanRow['Durée'];
      if (dureeStr && dureeStr.includes(':')) {
        const [h, m, s] = dureeStr.split(':').map(Number);
        duration = (h || 0) + (m || 0)/60;
      } else if (dureeStr) {
          duration = parseFloat(dureeStr.replace(',', '.')) || 0;
      }

      // Règles de calcul
      let besoin = 0;
      let capacite = 0;
      let color = 'gray';
      let status = '';

      if (cleanRow['Evènement'] === 'Tache de backoffice Avocatmail') {
        capacite = duration;
        color = 'purple';
        status = 'Production (Backoffice)';
      } else {
        const users = parseInt(cleanRow['users'] || '1', 10);
        besoin = 1.0;
        if (users > 5) besoin += (users - 5) * (10/60);
        color = 'cyan';
        status = 'Besoin (Analyse/Migr)';
      }

      const key = `${month}_${tech}`;
      if (!monthlyStats.has(key)) {
        monthlyStats.set(key, { month, tech, besoin: 0, besoin_encours: 0, capacite: 0 });
      }
      const entry = monthlyStats.get(key);
      entry.besoin += besoin;
      entry.capacite += capacite;

      events.push({
        date: dateStr,
        tech,
        client: cleanRow['Dossier'] || cleanRow['Libellé'] || 'Client Inconnu',
        type: cleanRow['Evènement'],
        duration: Math.max(besoin, capacite),
        status,
        color
      });
    });

    // 2. Traitement Encours
    encoursData.forEach(row => {
        const cleanRow = {};
        Object.keys(row).forEach(k => cleanRow[k.trim()] = row[k]);

        const tech = normalizeTechName(cleanRow['Interlocuteur'], techList);
        const category = cleanRow['Catégorie'];
        let lastActionDateStr = cleanRow['Dernière action'];
        
        // Planning (Indigo)
        if (category === 'Prêt pour mise en place') {
            planningEventsList.push({
                date: "N/A",
                tech,
                client: cleanRow['Client'] || 'Client Inconnu',
                type: "Prêt pour Mise en Place",
                duration: 0,
                status: "A Planifier",
                color: "indigo"
            });
            return;
        }

        // En cours (Orange/Amber)
        if (lastActionDateStr) {
             // Parsing date DD/MM/YYYY ou YYYY-MM-DD
            if (lastActionDateStr.includes('/')) {
                const parts = lastActionDateStr.split(' ')[0].split('/');
                if (parts.length === 3) lastActionDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            
            const lastDate = new Date(lastActionDateStr);
            if (!isNaN(lastDate.getTime())) {
                const targetDate = new Date(lastDate);
                targetDate.setDate(targetDate.getDate() + 7); // J+7
                const targetDateStr = targetDate.toISOString().split('T')[0];
                const targetMonth = targetDateStr.substring(0, 7);

                const key = `${targetMonth}_${tech}`;
                if (!monthlyStats.has(key)) {
                    monthlyStats.set(key, { month: targetMonth, tech, besoin: 0, besoin_encours: 0, capacite: 0 });
                }
                const entry = monthlyStats.get(key);
                entry.besoin_encours += 1.0;

                events.push({
                    date: targetDateStr,
                    tech,
                    client: cleanRow['Client'] || 'Client Inconnu',
                    type: "Analyse (En cours)",
                    duration: 1.0,
                    status: "En attente (Encours)",
                    color: "amber"
                });
            }
        }
    });

    const detailedDataArray = Array.from(monthlyStats.values()).sort((a, b) => a.month.localeCompare(b.month));
    const allEvents = [...planningEventsList, ...events.sort((a, b) => b.date.localeCompare(a.date))];

    return {
        detailedData: detailedDataArray,
        eventsData: allEvents,
        planningCount: planningEventsList.length
    };
  }, [backofficeData, encoursData, isDataLoaded, techList]);

  // --- LOGIQUE D'AFFICHAGE ---

  const filteredRawData = useMemo(() => {
    if (selectedTech === 'Tous') return detailedData;
    return detailedData.filter(d => d.tech === selectedTech);
  }, [selectedTech, detailedData]);

  const monthlyAggregatedData = useMemo(() => {
    if (!isDataLoaded || detailedData.length === 0) return [];
    
    // Plage dynamique basée sur les données chargées
    const allMonths = detailedData.map(d => d.month).sort();
    const startMonthStr = allMonths[0] || '2025-01';
    const endMonthStr = allMonths[allMonths.length - 1] || '2026-12';
    
    const aggMap = new Map();
    filteredRawData.forEach(item => {
      if (!aggMap.has(item.month)) aggMap.set(item.month, { month: item.month, besoin: 0, besoin_encours: 0, capacite: 0 });
      const entry = aggMap.get(item.month);
      entry.besoin += item.besoin;
      entry.besoin_encours += item.besoin_encours;
      entry.capacite += item.capacite;
    });

    let current = new Date(startMonthStr + '-01');
    const end = new Date(endMonthStr + '-01');
    if (current > end) return [];
    
    const result = [];
    let cumulBesoin = 0;
    let cumulCapacite = 0;

    while (current <= end) {
        const mStr = current.toISOString().substring(0, 7);
        const data = aggMap.get(mStr) || { month: mStr, besoin: 0, besoin_encours: 0, capacite: 0 };
        
        const totalBesoinMois = data.besoin + data.besoin_encours;
        cumulBesoin += totalBesoinMois;
        cumulCapacite += data.capacite;

        result.push({
            ...data,
            formattedMonth: formatMonth(mStr),
            totalBesoinMois,
            cumulBesoin,
            cumulCapacite,
            soldeMensuel: data.capacite - totalBesoinMois,
            soldeCumule: cumulCapacite - cumulBesoin
        });
        current.setMonth(current.getMonth() + 1);
    }
    return result;
  }, [filteredRawData, isDataLoaded, detailedData]);

  const techAggregatedData = useMemo(() => {
    const aggMap = new Map();
    const dataToUse = selectedMonth 
        ? filteredRawData.filter(d => d.month === selectedMonth) 
        : filteredRawData;

    dataToUse.forEach(item => {
      if (!aggMap.has(item.tech)) aggMap.set(item.tech, { name: item.tech, besoin: 0, besoin_encours: 0, capacite: 0 });
      const entry = aggMap.get(item.tech);
      entry.besoin += item.besoin;
      entry.besoin_encours += item.besoin_encours;
      entry.capacite += item.capacite;
    });
    return Array.from(aggMap.values());
  }, [filteredRawData, selectedMonth]);

  const filteredEvents = useMemo(() => {
    let events = eventsData;
    if (selectedTech !== 'Tous') events = events.filter(e => e.tech === selectedTech);
    if (showPlanning) return events.filter(e => e.status === "A Planifier");
    if (selectedMonth) events = events.filter(e => e.date !== "N/A" && e.date.startsWith(selectedMonth));
    if (!showPlanning && !selectedMonth) events = events.filter(e => e.date !== "N/A");
    return events;
  }, [selectedTech, selectedMonth, showPlanning, eventsData]);

  const kpiStats = useMemo(() => {
    if (!monthlyAggregatedData.length) return { besoin: 0, capacite: 0, delta: 0, ratio: 0 };
    
    if (selectedMonth) {
      const monthData = monthlyAggregatedData.find(d => d.month === selectedMonth);
      if (!monthData) return { besoin: 0, capacite: 0, delta: 0, ratio: 0 };
      const totalBesoin = monthData.totalBesoinMois;
      const ratio = totalBesoin > 0 ? (monthData.capacite / totalBesoin) * 100 : 0;
      return {
        besoin: totalBesoin,
        capacite: monthData.capacite,
        delta: monthData.soldeMensuel,
        ratio: ratio
      };
    } else {
      const totalBesoin = monthlyAggregatedData.reduce((acc, curr) => acc + curr.totalBesoinMois, 0);
      const totalCapacite = monthlyAggregatedData.reduce((acc, curr) => acc + curr.capacite, 0);
      const ratio = totalBesoin > 0 ? (totalCapacite / totalBesoin) * 100 : 0;
      const lastMonth = monthlyAggregatedData[monthlyAggregatedData.length - 1];
      return {
        besoin: totalBesoin,
        capacite: totalCapacite,
        delta: lastMonth ? lastMonth.soldeCumule : 0,
        ratio: ratio
      };
    }
  }, [monthlyAggregatedData, selectedMonth]);

  const handleChartClick = (data) => {
    if (data && data.activeLabel) {
       setSelectedMonth(prev => prev === data.activeLabel ? null : data.activeLabel);
       setShowPlanning(false); 
    }
  };

  const handlePlanningClick = () => {
    setShowPlanning(!showPlanning);
    setSelectedMonth(null);
  };

  // --- RENDER : ÉCRAN DE CHARGEMENT ---
  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full text-center border border-slate-100">
          <div className="bg-blue-50 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Upload className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Tableau de Bord Migrations</h1>
          <p className="text-slate-500 mb-8 px-4">
            Importez vos fichiers CSV pour générer le tableau de bord.<br/>
            <span className="text-xs text-slate-400">(Sélectionnez "backoffice.csv" et "encours.csv" en même temps)</span>
          </p>
          
          <div className="space-y-4">
            <div className="relative group">
              <input 
                type="file" 
                multiple
                accept=".csv,.txt"
                onChange={handleSmartUpload}
                className="hidden"
                id="smart-upload"
              />
              <label 
                htmlFor="smart-upload"
                className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-blue-200 rounded-xl cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50/50 bg-slate-50"
              >
                <div className="bg-white p-3 rounded-full shadow-sm">
                   <FileSpreadsheet className="w-8 h-8 text-blue-500" />
                </div>
                <div className="text-center">
                  <span className="font-semibold text-blue-700 text-lg">Cliquez pour importer</span>
                  <p className="text-slate-400 text-sm mt-1">Sélectionnez vos fichiers CSV</p>
                </div>
              </label>
            </div>
          </div>

          {loadingMsg && (
            <div className="mt-6 flex items-center justify-center gap-2 text-blue-600 animate-pulse">
              <Loader className="w-5 h-5 animate-spin" />
              <span>{loadingMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mt-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-center gap-2 justify-center">
              <AlertTriangle className="w-4 h-4" />
              {errorMsg}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDER : TABLEAU DE BORD ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4 lg:p-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <header className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-md">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">Pilotage Migrations</h1>
            <p className="text-xs text-slate-500 flex items-center gap-2">
               {selectedTech === 'Tous' ? "Vue Équipe" : `Focus: ${selectedTech}`}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 items-center">
            <div className="relative">
                <Filter className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                <select 
                    value={selectedTech} 
                    onChange={(e) => { setSelectedTech(e.target.value); setSelectedMonth(null); setShowPlanning(false); }}
                    className="pl-7 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 text-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                    <option value="Tous">Tous les techs</option>
                    {techList.map(tech => (
                        <option key={tech} value={tech}>{tech}</option>
                    ))}
                </select>
            </div>
            {(selectedMonth || showPlanning) && (
              <button 
                onClick={() => { setSelectedMonth(null); setShowPlanning(false); }}
                className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-red-100 transition-colors border border-red-100"
              >
                <X className="w-3 h-3" />
                Effacer ({showPlanning ? "Planning" : formatMonth(selectedMonth)})
              </button>
            )}
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {/* Jauge Pipe Planning */}
        <div 
            onClick={handlePlanningClick}
            className={`px-4 py-3 rounded-lg shadow-sm border flex items-center justify-between cursor-pointer transition-all duration-200 
            ${showPlanning ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pipe Planning</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl font-bold text-indigo-600">{planningCount}</h3>
              <p className="text-xs font-medium text-slate-400">dossiers prêts</p>
            </div>
          </div>
           <div className="w-12 h-12 relative">
             <ResponsiveContainer width="100%" height="100%">
               <RadialBarChart 
                 innerRadius="70%" outerRadius="100%" 
                 barSize={4} 
                 data={[{name: 'ready', value: planningCount, fill: '#4f46e5'}]} 
                 startAngle={90} endAngle={-270}
               >
                 <RadialBar background dataKey="value" cornerRadius={10} />
               </RadialBarChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Briefcase className={`w-4 h-4 ${showPlanning ? 'text-indigo-700' : 'text-indigo-500'}`} />
             </div>
           </div>
        </div>

        <KPICard 
          title="Besoin Total (h)" 
          value={kpiStats.besoin.toFixed(0)} 
          subtext="Estimé + En cours"
          icon={Users} 
          colorClass="text-slate-600"
          active={!!selectedMonth}
        />
        <KPICard 
          title="Capacité (h)" 
          value={kpiStats.capacite.toFixed(0)} 
          subtext="Planifiée"
          icon={Clock} 
          colorClass="text-purple-600" 
          active={!!selectedMonth}
        />
         <KPICard 
          title="Taux Couverture" 
          value={`${kpiStats.ratio.toFixed(0)}%`} 
          subtext="Capa. / Besoin"
          icon={TrendingUp} 
          colorClass={kpiStats.delta >= 0 ? "text-emerald-600" : "text-red-600"}
          active={!!selectedMonth}
        />
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-slate-400" />
            Performance {selectedMonth ? `(Focus ${formatMonth(selectedMonth)})` : "(Globale)"}
          </h2>
          <div className="flex gap-3 text-[10px] font-medium uppercase tracking-wider text-slate-500">
            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-cyan-500 rounded-full"></span> Besoin (Nouv.)</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded-full"></span> En Cours</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-500 rounded-full"></span> Capacité</div>
            <div className="flex items-center gap-1"><span className="w-3 h-0.5 bg-slate-600"></span> Stock Temps</div>
          </div>
        </div>
        
        <div className="h-64 w-full cursor-pointer">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={monthlyAggregatedData} 
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              onClick={handleChartClick}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#64748b', fontSize: 10}} 
                dy={5} 
                tickFormatter={formatMonth}
                interval={0} 
              />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 600}} />
              <Tooltip 
                contentStyle={{borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', padding: '8px'}}
                labelFormatter={formatMonth}
                formatter={(value, name) => [
                  `${parseFloat(value).toFixed(2)} h`, 
                  name === 'besoin' ? 'Besoin (Nouv.)' : name === 'besoin_encours' ? 'Besoin (En cours)' : name === 'capacite' ? 'Capacité' : name
                ]}
              />
              <ReferenceLine y={0} yAxisId="right" stroke="#cbd5e1" strokeDasharray="3 3" />
              
              <Bar yAxisId="left" stackId="a" dataKey="besoin" fill="#06b6d4" radius={[0, 0, 0, 0]} barSize={16}>
                {monthlyAggregatedData.map((entry, index) => (
                  <Cell key={`cell-besoin-${index}`} fillOpacity={selectedMonth && entry.month !== selectedMonth ? 0.3 : 1} />
                ))}
              </Bar>
              <Bar yAxisId="left" stackId="a" dataKey="besoin_encours" fill="#f59e0b" radius={[3, 3, 0, 0]} barSize={16}>
                 {monthlyAggregatedData.map((entry, index) => (
                  <Cell key={`cell-encours-${index}`} fillOpacity={selectedMonth && entry.month !== selectedMonth ? 0.3 : 1} />
                ))}
              </Bar>

              <Bar yAxisId="left" stackId="b" dataKey="capacite" fill="#a855f7" radius={[3, 3, 0, 0]} barSize={16}>
                 {monthlyAggregatedData.map((entry, index) => (
                  <Cell key={`cell-capa-${index}`} fillOpacity={selectedMonth && entry.month !== selectedMonth ? 0.3 : 1} />
                ))}
              </Bar>
              
              <Line yAxisId="right" type="monotone" dataKey="soldeCumule" stroke="#475569" strokeWidth={2} dot={{r: 3, fill: '#475569', strokeWidth: 1, stroke: '#fff'}} activeDot={{r: 5}} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden mb-4">
        <button 
          onClick={() => setIsTableExpanded(!isTableExpanded)}
          className="w-full px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-slate-400" />
            Résultats Mensuels Détaillés
          </h2>
          {isTableExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>
        
        {isTableExpanded && (
          <div className="overflow-x-auto animate-in fade-in slide-in-from-top-2 duration-200">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-semibold">Mois</th>
                  <th className="px-4 py-3 font-semibold text-right">Besoin Total</th>
                  <th className="px-4 py-3 font-semibold text-right text-amber-500">Dont En Cours</th>
                  <th className="px-4 py-3 font-semibold text-right text-purple-600">Capacité</th> 
                  <th className="px-4 py-3 font-semibold text-right">Ecart Mensuel</th>
                  <th className="px-4 py-3 font-semibold text-right text-slate-600">Stock Temps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyAggregatedData.map((row) => (
                  <tr key={row.month} className={`hover:bg-slate-50 transition-colors ${selectedMonth === row.month ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-4 py-2 font-medium text-slate-800 capitalize">{row.formattedMonth}</td>
                    <td className="px-4 py-2 text-right">{row.totalBesoinMois.toFixed(1)} h</td>
                    <td className="px-4 py-2 text-right text-amber-500">{row.besoin_encours > 0 ? `${row.besoin_encours.toFixed(1)} h` : '-'}</td>
                    <td className="px-4 py-2 text-right text-purple-600 font-medium">{row.capacite.toFixed(1)} h</td>
                    <td className="px-4 py-2 text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.soldeMensuel >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {row.soldeMensuel > 0 ? '+' : ''}{row.soldeMensuel.toFixed(1)} h
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-slate-600">
                      {row.soldeCumule > 0 ? '+' : ''}{row.soldeCumule.toFixed(1)} h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              Charge par Tech (h)
            </h2>
            <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={techAggregatedData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 500}} width={120} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '6px', fontSize: '12px'}} formatter={(value) => [`${parseFloat(value).toFixed(1)} h`, '']} />
                <Bar dataKey="besoin" fill="#06b6d4" barSize={8} stackId="a" radius={[0, 0, 0, 0]} /> {/* Cyan */}
                <Bar dataKey="besoin_encours" fill="#f59e0b" barSize={8} stackId="a" radius={[0, 2, 2, 0]} /> {/* Amber */}
                <Bar dataKey="capacite" fill="#a855f7" barSize={8} radius={[0, 2, 2, 0]} stackId="b" /> {/* Purple */}
                </BarChart>
            </ResponsiveContainer>
            </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              Courbes Cumulées
            </h2>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyAggregatedData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCapacite" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/> 
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={formatMonth} interval={0} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip contentStyle={{borderRadius: '6px', fontSize: '12px'}} />
                {selectedMonth && <ReferenceLine x={selectedMonth} stroke="#3b82f6" strokeDasharray="2 2" />}
                <Area type="monotone" dataKey="cumulCapacite" stroke="#a855f7" strokeWidth={2} fill="url(#gradCapacite)" /> 
                <Area type="monotone" dataKey="cumulBesoin" stroke="#06b6d4" strokeWidth={2} fill="transparent" strokeDasharray="3 3" /> {/* Cyan */}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden mb-8">
        <button 
          onClick={() => setIsDetailListExpanded(!isDetailListExpanded)}
          className="w-full px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-800">
              Détail des Opérations {selectedTech !== 'Tous' ? `: ${selectedTech}` : "(Tous)"}
            </h2>
            <span className="ml-2 text-xs font-normal text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              {filteredEvents.length} entrées
            </span>
          </div>
          {isDetailListExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>
        
        {isDetailListExpanded && (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-xs text-left text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100 sticky top-0 backdrop-blur-sm">
                <tr>
                  <th className="px-2 py-2 font-semibold whitespace-nowrap">Date</th>
                  <th className="px-2 py-2 font-semibold whitespace-nowrap">Technicien</th>
                  <th className="px-2 py-2 font-semibold whitespace-nowrap">Client</th>
                  <th className="px-2 py-2 font-semibold whitespace-nowrap">Type</th>
                  <th className="px-2 py-2 font-semibold text-right whitespace-nowrap">Durée</th>
                  <th className="px-2 py-2 font-semibold text-center whitespace-nowrap">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((event, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-2 py-1 font-medium text-slate-800 whitespace-nowrap">
                      {event.date === "N/A" ? "En attente" : new Date(event.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap truncate max-w-[150px]">{event.tech}</td>
                    <td className="px-2 py-1 font-medium text-slate-700 whitespace-nowrap truncate max-w-[200px]" title={event.client}>{event.client}</td>
                    <td className="px-2 py-1 text-slate-500 whitespace-nowrap">{event.type}</td>
                    <td className="px-2 py-1 text-right font-medium whitespace-nowrap">
                      {event.duration > 0 ? event.duration.toFixed(2) : '-'}
                    </td>
                    <td className="px-2 py-1 text-center whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                        ${event.color === 'cyan' ? 'bg-cyan-100 text-cyan-700' : 
                          event.color === 'purple' ? 'bg-purple-100 text-purple-700' : 
                          event.color === 'indigo' ? 'bg-indigo-100 text-indigo-700' : 
                          event.color === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {event.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-400 italic">
                      Aucun événement trouvé pour cette sélection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
