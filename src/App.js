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

// --- UTILITAIRES DE NORMALISATION (CRUCIAL) ---

// Transforme n'importe quel objet { "Date": x, "Heure": y } en { "DATE": x, "HEURE": y }
const normalizeRowKeys = (row) => {
    if (!row) return {};
    const newRow = {};
    Object.keys(row).forEach(key => {
        newRow[key.toUpperCase().trim()] = row[key];
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
  return "Autre"; // On ne rejette pas, on classe en "Autre" pour voir si ça marche
};

const parseDateSafe = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    
    // Tentative de parsing standard
    let date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;

    // Tentative format DD/MM/YYYY
    const str = String(dateStr).trim();
    if (str.includes('/')) {
        const [d, m, y] = str.split(' ')[0].split('/'); 
        if (d && m && y) return new Date(`${y}-${m}-${d}`);
    } 
    return null;
};

const calculateDuration = (duree) => {
    if (typeof duree === 'number') return duree;
    if (!duree) return 0;
    const str = String(duree).replace(',', '.');
    if (str.includes(':')) {
        const [h, m] = str.split(':').map(Number);
        return (h || 0) + (m || 0)/60;
    }
    return parseFloat(str) || 0;
};

// Récupère une plage horaire, ou une plage par défaut si l'heure manque
const getEventTimeRange = (dateObj, timeStr, durationHrs) => {
    if (!dateObj) return null;
    
    let h = 9, m = 0; // Heure par défaut (09:00) si pas d'heure précisée
    
    if (timeStr && typeof timeStr === 'string' && timeStr.includes(':')) {
        const parts = timeStr.split(':').map(Number);
        h = parts[0];
        m = parts[1] || 0;
    } else if (typeof timeStr === 'number') {
        // Cas où Snowflake renvoie un nombre (ex: 0.375 pour 9h)
        // On ignore pour l'instant et on garde le défaut
    }

    const start = new Date(dateObj);
    start.setHours(h, m, 0, 0);
    
    const end = new Date(start);
    end.setMinutes(start.getMinutes() + (durationHrs * 60));
    
    return { start: start.getTime(), end: end.getTime() };
};

const getOverlapHours = (range1, range2) => {
    if (!range1 || !range2) return 0;
    const start = Math.max(range1.start, range2.start);
    const end = Math.min(range1.end, range2.end);
    if (end <= start) return 0;
    return (end - start) / (1000 * 60 * 60); 
};

// --- COMPOSANTS UI SIMPLIFIÉS ---

const KPICard = ({ title, value, subtext, icon: Icon, colorClass }) => (
  <div className="px-4 py-3 rounded-lg shadow-sm border bg-white border-slate-100 flex items-center justify-between">
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase">{title}</p>
      <div className="flex items-baseline gap-2"><h3 className="text-xl font-bold text-slate-800">{value}</h3>{subtext && <p className={`text-xs font-medium ${colorClass}`}>{subtext}</p>}</div>
    </div>
    <div className={`p-2 rounded-md ${colorClass.replace('text-', 'bg-').replace('600', '100')}`}><Icon className={`w-4 h-4 ${colorClass}`} /></div>
  </div>
);

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
  const [diagnosticLogs, setDiagnosticLogs] = useState([]);

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
        if (Array.isArray(json.encours)) setEncoursData(json.encours);
      } catch (err) {
        console.error("❌ Erreur API :", err);
        setDebugData({ error: err.message });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [getToken]);
  
  // --- CŒUR DU CALCUL (ROBUSTE) ---
  const { processedEvents, kpiStats, logs } = useMemo(() => {
    const logs = [];
    const log = (msg) => logs.push(msg);

    if (!backofficeData || backofficeData.length === 0) {
        return { processedEvents: [], kpiStats: { besoin: 0, capacite: 0, ratio: 0 }, logs };
    }

    let allEvents = [];
    let rejectCount = { date: 0, tech: 0, relevant: 0 };

    // 1. NORMALISATION ET FILTRAGE
    backofficeData.forEach((row, index) => {
        const cleanRow = normalizeRowKeys(row);
        
        // Debug de la première ligne
        if (index === 0) log(`🔍 Première ligne brute (Clés): ${JSON.stringify(Object.keys(cleanRow))}`);

        const typeEventRaw = cleanRow['EVENEMENT'] || "";
        const typeEventLower = String(typeEventRaw).toLowerCase();
        
        // Filtre Large
        const isBackoffice = typeEventLower.includes('backoffice') || typeEventLower.includes('back office');
        const isRelevant = typeEventLower.includes("avocatmail") || typeEventLower.includes("adwin") || typeEventLower.includes("migration") || typeEventLower.includes("analyse") || isBackoffice;

        if (!isRelevant) {
            if (index < 5) log(`❌ Rejet Ligne ${index}: Type '${typeEventRaw}' non pertinent.`);
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
        // On accepte "Autre" pour le debug, on filtrera après si besoin
        
        const timeStr = cleanRow['HEURE']; 
        const duree = cleanRow['DUREE_HRS'];
        const duration = calculateDuration(duree);
        const timeRange = getEventTimeRange(dateEvent, timeStr, duration); // Peut retourner une plage par défaut
        
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
            timeRange,
            dossier,
            nbUsers,
            netCapacity: 0, 
            netNeed: 0
        });
    });

    log(`📊 Bilan: ${backofficeData.length} reçus -> ${allEvents.length} conservés. Rejets: Date(${rejectCount.date}), Type(${rejectCount.relevant})`);

    // 2. DEDUCTION (ABSORPTION)
    const boEvents = allEvents.filter(e => e.isBackoffice);
    const techEvents = allEvents.filter(e => !e.isBackoffice);

    boEvents.forEach(bo => bo.netCapacity = bo.duration); 
    techEvents.forEach(te => {
        const users = parseInt(te.nbUsers, 10) || 1;
        let baseNeed = 1.0;
        if (users > 5) baseNeed += (users - 5) * (10/60);
        te.netNeed = Math.max(te.duration, baseNeed);
        te.isAbsorbed = false;
    });

    techEvents.forEach(te => {
        const boMatch = boEvents.find(bo => 
            bo.tech === te.tech && 
            bo.date === te.date && 
            bo.timeRange && te.timeRange &&
            getOverlapHours(bo.timeRange, te.timeRange) > 0
        );

        if (boMatch) {
            const overlap = getOverlapHours(boMatch.timeRange, te.timeRange);
            boMatch.netCapacity = Math.max(0, boMatch.netCapacity - overlap);
            te.netNeed = 0;
            te.isAbsorbed = true;
        }
    });

    // 3. AGRÉGATION
    const finalEvents = [...boEvents, ...techEvents].filter(e => selectedTech === 'Tous' || e.tech === selectedTech);
    
    // Calcul Stats Globales
    let totalBesoin = 0, totalCapa = 0;
    finalEvents.forEach(e => {
        if(e.isBackoffice) totalCapa += e.netCapacity;
        else totalBesoin += e.netNeed;
    });

    return { 
        processedEvents: finalEvents, 
        kpiStats: { besoin: totalBesoin, capacite: totalCapa, ratio: totalBesoin > 0 ? (totalCapa/totalBesoin)*100 : 0 },
        logs 
    };

  }, [backofficeData, selectedTech, techList]);

  // Préparation Graphique Mensuel
  const chartData = useMemo(() => {
      const agg = {};
      processedEvents.forEach(ev => {
          if (!agg[ev.month]) agg[ev.month] = { month: ev.month, besoin: 0, capacite: 0 };
          if (ev.isBackoffice) agg[ev.month].capacite += ev.netCapacity;
          else agg[ev.month].besoin += ev.netNeed;
      });
      return Object.values(agg).sort((a,b) => a.month.localeCompare(b.month));
  }, [processedEvents]);

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
                <XAxis dataKey="month" tickFormatter={formatMonthShort} style={{fontSize: 10}} />
                <YAxis style={{fontSize: 10}} />
                <Tooltip />
                <Bar dataKey="besoin" fill="#06b6d4" barSize={20} name="Besoin" />
                <Bar dataKey="capacite" fill="#a855f7" barSize={20} name="Capacité" />
            </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* TABLEAU */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden mb-32">
          <div className="p-3 bg-slate-50 border-b border-slate-100 font-bold text-xs text-slate-700">Derniers Événements</div>
          <div className="max-h-64 overflow-auto">
            <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 sticky top-0">
                    <tr><th>Date</th><th>Tech</th><th>Type</th><th>Durée Brute</th><th>Net (Calculé)</th><th>Statut</th></tr>
                </thead>
                <tbody>
                    {processedEvents.slice(0, 50).map((ev, i) => (
                        <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
                            <td className="p-2">{ev.date}</td>
                            <td className="p-2">{ev.tech}</td>
                            <td className="p-2 truncate max-w-[150px]" title={ev.typeRaw}>{ev.typeRaw}</td>
                            <td className="p-2">{ev.duration.toFixed(2)}h</td>
                            <td className="p-2 font-bold">{ev.isBackoffice ? ev.netCapacity.toFixed(2) : ev.netNeed.toFixed(2)}h</td>
                            <td className="p-2">{ev.isAbsorbed ? <span className="bg-slate-200 px-1 rounded">Absorbé</span> : ev.isBackoffice ? <span className="bg-purple-100 text-purple-700 px-1 rounded">Prod BO</span> : <span className="bg-cyan-100 text-cyan-700 px-1 rounded">Besoin</span>}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
      </div>

      {/* DEBUG BAR */}
      <div className={`fixed bottom-0 left-0 right-0 bg-slate-900 text-green-400 font-mono text-xs transition-all duration-300 flex flex-col ${isDebugOpen ? 'h-64' : 'h-8'}`}>
        <button onClick={() => setIsDebugOpen(!isDebugOpen)} className="w-full bg-slate-800 text-white flex justify-between px-4 py-1">
            <span>CONSOLE DEBUG ({logs.length} logs)</span>
            {isDebugOpen ? <ChevronDown size={14}/> : <ChevronUp size={14}/>}
        </button>
        <div className="overflow-auto p-4 flex-1">
            {debugData && debugData.error && <div className="text-red-400 font-bold mb-2">ERREUR API: {JSON.stringify(debugData)}</div>}
            {logs.map((l, i) => <div key={i}>{l}</div>)}
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
