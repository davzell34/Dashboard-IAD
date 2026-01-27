import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart
} from 'recharts';
import { 
  Activity, Users, Clock, TrendingUp, Filter, X, Table as TableIcon, ChevronDown, ChevronUp, FileText, Loader,
  ArrowUpDown, ArrowUp, ArrowDown, Terminal, AlertTriangle
} from 'lucide-react';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, UserButton, useAuth } from "@clerk/clerk-react";

// --- CONFIGURATION ---
const TECH_LIST_DEFAULT = [
    "Zakaria AYAT", 
    "Jean-michel MESSIN", 
    "Mathieu GROSSI", 
    "Jean-Philippe SAUROIS", 
    "Roderick GAMONDES"
];

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

// --- UTILITAIRES SÉCURISÉS ---

const normalizeRowKeys = (row) => {
    if (!row || typeof row !== 'object') return {};
    const newRow = {};
    Object.keys(row).forEach(key => {
        if (key) newRow[key.toUpperCase().trim()] = row[key];
    });
    return newRow;
};

const normalizeTechName = (name, techList) => {
  if (!name || typeof name !== 'string') return "Inconnu";
  const cleanName = name.trim();
  const upperName = cleanName.toUpperCase();
  for (const tech of techList) {
    if (tech.toUpperCase() === upperName) return tech;
    const lastName = tech.split(' ').pop().toUpperCase();
    if (upperName.includes(lastName)) return tech;
  }
  return "Autre";
};

const parseDateSafe = (dateStr) => {
    if (!dateStr) return null;
    try {
        if (dateStr instanceof Date) return dateStr;
        let cleanStr = String(dateStr).trim();
        if (cleanStr.includes('/')) {
            const parts = cleanStr.split(' ')[0].split('/'); 
            if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        } 
        if (cleanStr.includes('T')) cleanStr = cleanStr.split('T')[0];
        const d = new Date(cleanStr);
        return isNaN(d.getTime()) ? null : d;
    } catch (e) { return null; }
};

const calculateDuration = (duree) => {
    try {
        if (typeof duree === 'number') return duree;
        if (!duree) return 0;
        const str = String(duree).replace(',', '.');
        if (str.includes(':')) {
            const [h, m] = str.split(':').map(Number);
            return (h || 0) + (m || 0)/60;
        }
        return parseFloat(str) || 0;
    } catch (e) { return 0; }
};

const getEventTimeRange = (dateObj, timeStr, durationHrs) => {
    if (!dateObj) return null;
    // Si pas d'heure, on ne peut pas calculer de chevauchement précis -> return null
    if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) return null;
    
    try {
        const [h, m] = timeStr.split(':').map(Number);
        if (isNaN(h)) return null; 

        const start = new Date(dateObj);
        start.setHours(h, m || 0, 0, 0);
        
        const end = new Date(start);
        end.setMinutes(start.getMinutes() + (durationHrs * 60));
        
        return { start: start.getTime(), end: end.getTime() };
    } catch (e) { return null; }
};

const getOverlapHours = (range1, range2) => {
    if (!range1 || !range2) return 0; // Si l'un des deux n'a pas d'heure précise, pas de chevauchement calculable
    const start = Math.max(range1.start, range2.start);
    const end = Math.min(range1.end, range2.end);
    if (end <= start) return 0;
    return (end - start) / (1000 * 60 * 60); 
};

// --- COMPOSANTS UI ---

const KPICard = ({ title, value, subtext, icon: Icon, colorClass }) => (
  <div className="px-4 py-3 rounded-lg shadow-sm border bg-white border-slate-100 flex items-center justify-between">
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase">{title}</p>
      <div className="flex items-baseline gap-2"><h3 className="text-xl font-bold text-slate-800">{value}</h3>{subtext && <p className={`text-xs font-medium ${colorClass}`}>{subtext}</p>}</div>
    </div>
    <div className={`p-2 rounded-md ${colorClass.replace('text-', 'bg-').replace('600', '100')}`}><Icon className={`w-4 h-4 ${colorClass}`} /></div>
  </div>
);

const SortableHeader = ({ label, sortKey, currentSort, onSort, align = 'left' }) => {
  const isSorted = currentSort.key === sortKey;
  return (
    <th className={`px-2 py-2 font-semibold whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors group select-none text-${align}`} onClick={() => onSort(sortKey)}>
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>{label}<span className="text-slate-400">{isSorted ? (currentSort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : (<ArrowUpDown size={12} className="opacity-0 group-hover:opacity-50" />)}</span></div>
    </th>
  );
};

// --- APPLICATION ---

function MigrationDashboard() {
  const [backofficeData, setBackofficeData] = useState([]);
  const [encoursData, setEncoursData] = useState([]);
  const [techList] = useState(TECH_LIST_DEFAULT);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTech, setSelectedTech] = useState('Tous');
  
  // Debug & Erreurs
  const [debugData, setDebugData] = useState(null);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [isDetailListExpanded, setIsDetailListExpanded] = useState(true);

  const { getToken } = useAuth(); 

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = await getToken();
        const response = await fetch('/api/getData', { headers: { Authorization: `Bearer ${token}` } });
        const json = await response.json();
        setDebugData(json);

        if (!response.ok) throw new Error(json.error || `Erreur API`);
        
        if (Array.isArray(json.backoffice)) setBackofficeData(json.backoffice); 
        else setBackofficeData([]);

        if (Array.isArray(json.encours)) setEncoursData(json.encours);
        else setEncoursData([]);

      } catch (err) {
        console.error("❌ Erreur API :", err);
        setDebugData({ error: err.message });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [getToken]);
  
  // --- CŒUR DU CALCUL (SECURISE) ---
  const { processedEvents, kpiStats, logs } = useMemo(() => {
    const logs = [];
    const log = (msg) => logs.push(msg);
    const emptyResult = { processedEvents: [], kpiStats: { besoin: 0, capacite: 0, ratio: 0 }, logs };

    if (!backofficeData || backofficeData.length === 0) return emptyResult;

    try {
        let allEvents = [];
        let rejectCount = { date: 0, relevant: 0 };

        // 1. NORMALISATION ET FILTRAGE
        backofficeData.forEach((row, index) => {
            if (!row) return;
            const cleanRow = normalizeRowKeys(row);
            
            if (index === 0) log(`🔍 Clés détectées : ${JSON.stringify(Object.keys(cleanRow))}`);

            const typeEventRaw = cleanRow['EVENEMENT'] || "";
            const typeEventLower = String(typeEventRaw).toLowerCase();
            
            // Filtre
            const isBackoffice = typeEventLower.includes('backoffice') || typeEventLower.includes('back office');
            const isRelevant = typeEventLower.includes("avocatmail") || typeEventLower.includes("adwin") || typeEventLower.includes("migration") || typeEventLower.includes("analyse") || isBackoffice;

            if (!isRelevant) {
                rejectCount.relevant++;
                return;
            }

            const dateStr = cleanRow['DATE'];
            const dateEvent = parseDateSafe(dateStr);
            if (!dateEvent) {
                rejectCount.date++;
                return;
            }

            const resp = cleanRow['RESPONSABLE'];
            const tech = normalizeTechName(resp, techList);
            
            const timeStr = cleanRow['HEURE']; 
            const duree = cleanRow['DUREE_HRS'];
            const duration = calculateDuration(duree);
            
            // Calcul plage horaire (peut être null si pas d'heure précise)
            const timeRange = getEventTimeRange(dateEvent, timeStr, duration);
            
            const dossier = cleanRow['DOSSIER'] || cleanRow['LIBELLE'] || 'Inconnu';
            const nbUsers = cleanRow['NB_USERS'] || cleanRow['USER'] || '1';

            allEvents.push({
                id: Math.random(),
                date: dateEvent.toISOString().split('T')[0],
                month: dateEvent.toISOString().split('T')[0].substring(0, 7),
                tech,
                typeRaw: typeEventRaw,
                isBackoffice,
                duration,
                timeRange, // IMPORTANT : peut être null
                dossier,
                nbUsers,
                netCapacity: 0, 
                netNeed: 0,
                isAbsorbed: false
            });
        });

        log(`📊 Import: ${allEvents.length} événements valides.`);

        // 2. DEDUCTION (ABSORPTION)
        const boEvents = allEvents.filter(e => e.isBackoffice);
        const techEvents = allEvents.filter(e => !e.isBackoffice);

        // Initialisation
        boEvents.forEach(bo => bo.netCapacity = bo.duration); 
        techEvents.forEach(te => {
            const users = parseInt(te.nbUsers, 10) || 1;
            let baseNeed = 1.0;
            if (users > 5) baseNeed += (users - 5) * (10/60);
            te.netNeed = Math.max(te.duration, baseNeed);
        });

        // Logique de collision : SI et SEULEMENT SI les heures sont connues
        techEvents.forEach(te => {
            // On ne peut absorber que si l'événement technique ET le backoffice ont des heures précises
            if (!te.timeRange) return;

            const boMatch = boEvents.find(bo => 
                bo.tech === te.tech && 
                bo.date === te.date && 
                bo.timeRange && // Le backoffice doit aussi avoir une heure
                getOverlapHours(bo.timeRange, te.timeRange) > 0
            );

            if (boMatch) {
                const overlap = getOverlapHours(boMatch.timeRange, te.timeRange);
                boMatch.netCapacity = Math.max(0, boMatch.netCapacity - overlap);
                
                // ABSORPTION : Le besoin est annulé
                te.netNeed = 0; 
                te.isAbsorbed = true;
                te.absorbedBy = boMatch.typeRaw;
            }
        });

        // 3. AGRÉGATION FINALE
        const finalEvents = [...boEvents, ...techEvents].filter(e => selectedTech === 'Tous' || e.tech === selectedTech);
        
        let totalBesoin = 0, totalCapa = 0;
        finalEvents.forEach(e => {
            e.status = e.isBackoffice 
                ? (e.netCapacity < e.duration ? `Prod BO (Net: ${e.netCapacity.toFixed(1)}h)` : 'Production (Backoffice)')
                : (e.isAbsorbed ? 'Planifié (Inclus BO)' : 'Besoin (Analyse/Migr)');
            
            e.color = e.isBackoffice ? 'purple' : (e.isAbsorbed ? 'slate' : 'cyan');

            if(e.isBackoffice) totalCapa += e.netCapacity;
            else totalBesoin += e.netNeed;
        });

        return { 
            processedEvents: finalEvents, 
            kpiStats: { besoin: totalBesoin, capacite: totalCapa, ratio: totalBesoin > 0 ? (totalCapa/totalBesoin)*100 : 0 },
            logs 
        };

    } catch (e) {
        console.error("CRITICAL ERROR:", e);
        log(`🔥 CRASH CALCUL: ${e.message}`);
        return emptyResult;
    }

  }, [backofficeData, selectedTech, techList]);

  // Formattage date court pour graph
  const formatMonthShortSafe = (d) => {
      if(!d) return '';
      const parts = d.split('-');
      return `${parts[1]}/${parts[0].slice(2)}`;
  }

  // Préparation Graphique Mensuel
  const chartData = useMemo(() => {
      const agg = {};
      processedEvents.forEach(ev => {
          if (!agg[ev.month]) agg[ev.month] = { month: ev.month, label: formatMonthShortSafe(ev.month), besoin: 0, capacite: 0 };
          if (ev.isBackoffice) agg[ev.month].capacite += ev.netCapacity;
          else agg[ev.month].besoin += ev.netNeed;
      });
      return Object.values(agg).sort((a,b) => a.month.localeCompare(b.month));
  }, [processedEvents]);

  // Tri du tableau
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedTableData = useMemo(() => {
      let data = [...processedEvents];
      if (sortConfig.key) {
          data.sort((a, b) => {
              let valA = a[sortConfig.key];
              let valB = b[sortConfig.key];
              if (typeof valA === 'string') valA = valA.toLowerCase();
              if (typeof valB === 'string') valB = valB.toLowerCase();
              if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
              if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
              return 0;
          });
      }
      return data;
  }, [processedEvents, sortConfig]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4 relative">
      <header className="mb-4 flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-md"><Activity className="w-5 h-5 text-blue-600" /></div>
          <div><h1 className="text-lg font-bold">Pilotage Migrations</h1><p className="text-xs text-slate-500">{processedEvents.length} événements chargés</p></div>
        </div>
        <div className="flex gap-2">
            <UserButton />
            <select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)} className="text-sm bg-slate-50 border border-slate-200 rounded-md p-1">
                <option value="Tous">Tous</option>
                {TECH_LIST_DEFAULT.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
        </div>
      </header>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <KPICard title="Besoin Net (h)" value={kpiStats.besoin.toFixed(1)} icon={Users} colorClass="text-cyan-600" />
        <KPICard title="Capacité Nette (h)" value={kpiStats.capacite.toFixed(1)} icon={Clock} colorClass="text-purple-600" />
        <KPICard title="Taux Couverture" value={`${kpiStats.ratio.toFixed(0)}%`} icon={TrendingUp} colorClass={kpiStats.ratio >= 100 ? "text-emerald-600" : "text-red-600"} />
      </div>

      {/* CHART */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 h-64 mb-4">
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" style={{fontSize: 10}} />
                <YAxis style={{fontSize: 10}} />
                <Tooltip />
                <Bar dataKey="besoin" fill="#06b6d4" barSize={20} name="Besoin" />
                <Bar dataKey="capacite" fill="#a855f7" barSize={20} name="Capacité" />
            </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* TABLEAU */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden mb-32">
          <button onClick={() => setIsDetailListExpanded(!isDetailListExpanded)} className="w-full px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors">
            <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /><span className="font-bold text-sm">Liste Détaillée ({processedEvents.length})</span></div>
            {isDetailListExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {isDetailListExpanded && (
            <div className="max-h-96 overflow-auto">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 sticky top-0">
                        <tr>
                            <SortableHeader label="Date" sortKey="date" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Tech" sortKey="tech" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Type" sortKey="typeRaw" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Durée" sortKey="duration" currentSort={sortConfig} onSort={handleSort} align="right" />
                            <SortableHeader label="Net" sortKey="netCapacity" currentSort={sortConfig} onSort={handleSort} align="right" />
                            <SortableHeader label="Statut" sortKey="status" currentSort={sortConfig} onSort={handleSort} align="center" />
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTableData.map((ev, i) => (
                            <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
                                <td className="p-2 whitespace-nowrap">{ev.date}</td>
                                <td className="p-2 whitespace-nowrap">{ev.tech}</td>
                                <td className="p-2 truncate max-w-[200px]" title={ev.typeRaw}>{ev.typeRaw}</td>
                                <td className="p-2 text-right">{ev.duration.toFixed(2)}h</td>
                                <td className="p-2 text-right font-bold">{ev.isBackoffice ? ev.netCapacity.toFixed(2) : ev.netNeed.toFixed(2)}h</td>
                                <td className="p-2 text-center"><span className={`px-2 py-0.5 rounded text-[10px] bg-${ev.color}-100 text-${ev.color}-700`}>{ev.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          )}
      </div>

      {/* DEBUG BAR */}
      <div className={`fixed bottom-0 left-0 right-0 bg-slate-900 text-green-400 font-mono text-xs transition-all duration-300 flex flex-col ${isDebugOpen ? 'h-64' : 'h-8'}`}>
        <button onClick={() => setIsDebugOpen(!isDebugOpen)} className="w-full bg-slate-800 text-white flex justify-between px-4 py-1">
            <span>CONSOLE DEBUG ({logs.length} logs)</span>
            {isDebugOpen ? <ChevronDown size={14}/> : <ChevronUp size={14}/>}
        </button>
        <div className="overflow-auto p-4 flex-1">
            {debugData && debugData.error && <div className="text-red-400 font-bold mb-2">ERREUR API: {JSON.stringify(debugData)}</div>}
            {logs.map((l, i) => <div key={i} className="border-b border-slate-800 py-1">{l}</div>)}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  if (!clerkPubKey) return <div>Clé Clerk Manquante</div>;
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <SignedIn><MigrationDashboard /></SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </ClerkProvider>
  );
}
