import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ComposedChart, ReferenceLine, RadialBarChart, RadialBar
} from 'recharts';
import { 
  Activity, Users, Clock, TrendingUp, AlertTriangle, CheckCircle, 
  Calendar, BarChart2, Filter, Info, X, Table as TableIcon, ChevronDown, ChevronUp, FileText, Briefcase, Loader,
  ArrowUpDown, ArrowUp, ArrowDown, CornerDownRight, Layout, Search, Layers
} from 'lucide-react';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, UserButton, useUser, useAuth } from "@clerk/clerk-react";

// --- CONFIGURATION ---
const TECH_LIST_DEFAULT = ["Jean-Philippe SAUROIS", "Jean-michel MESSIN", "Mathieu GROSSI", "Roderick GAMONDES", "Zakaria AYAT"];
const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

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
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
};

const formatMonthShort = (dateStr) => {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
};

const getWeekLabel = (dateStr) => {
    const date = new Date(dateStr);
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `S${weekNum}`;
};

const getCurrentMonthKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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

const SortableHeader = ({ label, sortKey, currentSort, onSort, align = 'left' }) => {
  const isSorted = currentSort.key === sortKey;
  return (
    <th 
      className={`px-2 py-2 font-semibold whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors group select-none text-${align}`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        {label}
        <span className="text-slate-400">
          {isSorted ? (
            currentSort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
          ) : (
            <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-50" />
          )}
        </span>
      </div>
    </th>
  );
};

// --- APPLICATION PRINCIPALE ---

function MigrationDashboard() {
  const [backofficeData, setBackofficeData] = useState([]);
  const [encoursData, setEncoursData] = useState([]);
  const [techList, setTechList] = useState(TECH_LIST_DEFAULT);
  const [isLoading, setIsLoading] = useState(true);
  
  // Navigation & Filtres
  const [selectedTech, setSelectedTech] = useState('Tous');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [showPlanning, setShowPlanning] = useState(false); 

  // Accordeons (États d'affichage)
  const [isDetailListExpanded, setIsDetailListExpanded] = useState(true);
  const [isTableExpanded, setIsTableExpanded] = useState(false); 
  const [isTechChartExpanded, setIsTechChartExpanded] = useState(false); // REPLIÉ PAR DÉFAUT

  // Tri
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  const { getToken } = useAuth(); 

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = await getToken();
        const response = await fetch('/api/getData', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`Erreur API`);
        const json = await response.json();
        
        if (json.backoffice) setBackofficeData(json.backoffice); 
        if (json.encours) setEncoursData(json.encours);
        setIsLoading(false);
      } catch (err) {
        console.error("❌ Erreur API :", err);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [getToken]);
  
  // --- TRAITEMENT CORE ---

  const { detailedData, eventsData, planningCount, analysisPipeCount, availableMonths } = useMemo(() => {
    if (backofficeData.length === 0 && encoursData.length === 0) {
        return { detailedData: [], eventsData: [], planningCount: 0, analysisPipeCount: 0, availableMonths: [] };
    }

    const events = [];
    const planningEventsList = [];
    const monthlyStats = new Map();
    const monthsSet = new Set(); 

    // Compteurs pour les pipes
    let countReadyMiseEnPlace = 0;
    let countReadyAnalyse = 0; // Nouveau compteur pour le 2ème pipe

    const addToStats = (month, tech, besoin, besoin_encours, capacite) => {
        monthsSet.add(month);
        const key = `${month}_${tech}`;
        if (!monthlyStats.has(key)) {
            monthlyStats.set(key, { month, tech, besoin: 0, besoin_encours: 0, capacite: 0 });
        }
        const entry = monthlyStats.get(key);
        entry.besoin += besoin;
        entry.besoin_encours += besoin_encours;
        entry.capacite += capacite;
    };

    // 1. BACKOFFICE
    backofficeData.forEach(row => {
      const cleanRow = {};
      Object.keys(row).forEach(k => cleanRow[k.trim()] = row[k]);

      const typeEvent = cleanRow['EVENEMENT'];
      const dateEvent = cleanRow['DATE'];
      const resp = cleanRow['RESPONSABLE'];
      const duree = cleanRow['DUREE_HRS'];
      const dossier = cleanRow['DOSSIER'] || cleanRow['LIBELLE'] || 'Client Inconnu';
      const nbUsers = cleanRow['USER'] || cleanRow['NB_USERS'] || '1';

      if (!typeEvent || !['Avocatmail - Analyse', 'Migration messagerie Adwin', 'Tache de backoffice Avocatmail'].includes(typeEvent)) return;
      
      let dateStr = dateEvent; 
      if (!dateStr) return;
      if (dateStr.includes('/')) {
         const parts = dateStr.split(' ')[0].split('/');
         if (parts.length === 3) dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`; 
      } else if (dateStr.includes('T')) dateStr = dateStr.split('T')[0]; 
      
      const month = dateStr.substring(0, 7);
      const tech = normalizeTechName(resp, techList);
      
      let duration = 0;
      if (typeof duree === 'number') duration = duree;
      else if (duree && typeof duree === 'string') {
          if (duree.includes(':')) {
            const [h, m] = duree.split(':').map(Number);
            duration = (h || 0) + (m || 0)/60;
          } else {
            duration = parseFloat(duree.replace(',', '.')) || 0;
          }
      }

      let besoin = 0; let capacite = 0; let color = 'gray'; let status = '';

      if (typeEvent === 'Tache de backoffice Avocatmail') {
        capacite = duration;
        color = 'purple';
        status = 'Production (Backoffice)';
      } else {
        const users = parseInt(nbUsers, 10);
        besoin = 1.0;
        if (users > 5) besoin += (users - 5) * (10/60);
        color = 'cyan';
        status = 'Besoin (Analyse/Migr)';
      }

      addToStats(month, tech, besoin, 0, capacite);

      events.push({
        date: dateStr,
        tech,
        client: dossier,
        type: typeEvent,
        duration: Math.max(besoin, capacite),
        status,
        color,
        raw_besoin: besoin,
        raw_capacite: capacite,
        raw_besoin_encours: 0
      });
    });

    // 2. ENCOURS
    encoursData.forEach(row => {
        const cleanRow = {};
        Object.keys(row).forEach(k => cleanRow[k.trim()] = row[k]);
        const techNameRaw = cleanRow['RESPONSABLE'];
        const categorie = cleanRow['CATEGORIE'];
        let lastAction = cleanRow['DERNIERE_ACTION'];
        const clientName = cleanRow['INTERLOCUTEUR'] || 'Client Inconnu';
        const tech = normalizeTechName(techNameRaw, techList);
        
        // --- LOGIQUE PIPE ---
        if (categorie === 'Prêt pour mise en place') {
            countReadyMiseEnPlace++;
            planningEventsList.push({
                date: "N/A", tech, client: clientName, type: "Prêt pour Mise en Place",
                duration: 0, status: "A Planifier (Migr)", color: "indigo"
            });
            return;
        }
        
        // --- LOGIQUE PIPE ANALYSE (Filtre temporaire ou à adapter) ---
        // Adapte ce test quand tu auras le critère exact pour "Prêt pour analyse"
        if (categorie === 'Prêt pour analyse' || categorie === 'A Planifier (Analyse)') {
            countReadyAnalyse++;
            planningEventsList.push({
                date: "N/A", tech, client: clientName, type: "Prêt pour Analyse",
                duration: 0, status: "A Planifier (Analyse)", color: "cyan"
            });
            // return; // Si on ne veut pas le traiter comme "En cours"
        }

        if (lastAction) {
            if (lastAction.includes('/')) {
                const parts = lastAction.split(' ')[0].split('/');
                if (parts.length === 3) lastAction = `${parts[2]}-${parts[1]}-${parts[0]}`;
            } else if (lastAction.includes('T')) lastAction = lastAction.split('T')[0];
            
            const lastDate = new Date(lastAction);
            if (!isNaN(lastDate.getTime())) {
                const targetDate = new Date(lastDate);
                targetDate.setDate(targetDate.getDate() + 7);
                const targetDateStr = targetDate.toISOString().split('T')[0];
                const targetMonth = targetDateStr.substring(0, 7);

                addToStats(targetMonth, tech, 0, 1.0, 0);

                events.push({
                    date: targetDateStr,
                    tech,
                    client: clientName,
                    type: "Analyse (En cours)",
                    duration: 1.0,
                    status: "En attente (Encours)",
                    color: "amber",
                    raw_besoin: 0,
                    raw_capacite: 0,
                    raw_besoin_encours: 1.0
                });
            }
        }
    });

    const detailedDataArray = Array.from(monthlyStats.values()).sort((a, b) => a.month.localeCompare(b.month));
    const sortedMonths = Array.from(monthsSet).sort().reverse(); 

    return {
        detailedData: detailedDataArray,
        eventsData: [...planningEventsList, ...events],
        planningCount: countReadyMiseEnPlace,
        analysisPipeCount: countReadyAnalyse, // Nouveau compteur
        availableMonths: sortedMonths
    };
  }, [backofficeData, encoursData, techList]);

  // --- LOGIQUE TRI ---
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const filteredAndSortedEvents = useMemo(() => {
    let events = eventsData;
    if (selectedTech !== 'Tous') events = events.filter(e => e.tech === selectedTech);
    
    // Filtrage spécial pour le bouton Planning : on montre les deux types de "A Planifier"
    if (showPlanning) events = events.filter(e => e.status.includes("A Planifier"));
    else if (selectedMonth) events = events.filter(e => e.date !== "N/A" && e.date.startsWith(selectedMonth));
    else events = events.filter(e => e.date !== "N/A");

    if (sortConfig.key) {
      events.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        if (sortConfig.key === 'date') {
            if (valA === 'N/A') valA = '0000-00-00';
            if (valB === 'N/A') valB = '0000-00-00';
        }
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return events;
  }, [selectedTech, selectedMonth, showPlanning, eventsData, sortConfig]);

  // --- AGREGATION MENSUELLE (VUE ANNUELLE) ---
  const monthlyAggregatedData = useMemo(() => {
    if (detailedData.length === 0) return [];
    
    const dataToUse = selectedTech === 'Tous' ? detailedData : detailedData.filter(d => d.tech === selectedTech);
    const aggMap = new Map();
    dataToUse.forEach(item => {
      if (!aggMap.has(item.month)) aggMap.set(item.month, { month: item.month, label: formatMonthShort(item.month), besoin: 0, besoin_encours: 0, capacite: 0 });
      const entry = aggMap.get(item.month);
      entry.besoin += item.besoin;
      entry.besoin_encours += item.besoin_encours;
      entry.capacite += item.capacite;
    });

    const allMonths = Array.from(aggMap.keys()).sort();
    if(allMonths.length === 0) return [];

    let current = new Date(allMonths[0] + '-01');
    const end = new Date(allMonths[allMonths.length - 1] + '-01');
    
    const result = [];
    while (current <= end) {
        const mStr = current.toISOString().substring(0, 7);
        const data = aggMap.get(mStr) || { month: mStr, label: formatMonthShort(mStr), besoin: 0, besoin_encours: 0, capacite: 0 };
        const totalBesoinMois = data.besoin + data.besoin_encours;
        result.push({
            ...data,
            totalBesoinMois,
            soldeMensuel: data.capacite - totalBesoinMois
        });
        current.setMonth(current.getMonth() + 1);
    }
    return result;
  }, [detailedData, selectedTech]);

  // --- AGREGATION HEBDOMADAIRE (VUE DETAIL) ---
  const weeklyAggregatedData = useMemo(() => {
      if (!selectedMonth) return [];
      let relevantEvents = eventsData.filter(e => e.date !== "N/A" && e.date.startsWith(selectedMonth));
      if (selectedTech !== 'Tous') relevantEvents = relevantEvents.filter(e => e.tech === selectedTech);

      const weekMap = new Map();
      relevantEvents.forEach(evt => {
          const weekLabel = getWeekLabel(evt.date);
          if (!weekMap.has(weekLabel)) weekMap.set(weekLabel, { month: weekLabel, label: weekLabel, besoin: 0, besoin_encours: 0, capacite: 0 });
          const entry = weekMap.get(weekLabel);
          entry.besoin += (evt.raw_besoin || 0);
          entry.besoin_encours += (evt.raw_besoin_encours || 0);
          entry.capacite += (evt.raw_capacite || 0);
      });

      return Array.from(weekMap.values()).sort((a, b) => {
          const numA = parseInt(a.label.replace('S', ''));
          const numB = parseInt(b.label.replace('S', ''));
          return numA - numB;
      });
  }, [eventsData, selectedMonth, selectedTech]);

  const mainChartData = selectedMonth ? weeklyAggregatedData : monthlyAggregatedData;

  // --- AGREGATION PAR TECH ---
  const techAggregatedData = useMemo(() => {
    const aggMap = new Map();
    let eventsToUse = eventsData.filter(e => e.date !== "N/A");
    if(selectedMonth) eventsToUse = eventsToUse.filter(e => e.date.startsWith(selectedMonth));

    eventsToUse.forEach(item => {
      if (!aggMap.has(item.tech)) aggMap.set(item.tech, { name: item.tech, besoin: 0, besoin_encours: 0, capacite: 0 });
      const entry = aggMap.get(item.tech);
      entry.besoin += (item.raw_besoin || 0);
      entry.besoin_encours += (item.raw_besoin_encours || 0);
      entry.capacite += (item.raw_capacite || 0);
    });
    return Array.from(aggMap.values());
  }, [eventsData, selectedMonth]);

  // KPI STATS
  const kpiStats = useMemo(() => {
    if (mainChartData.length === 0) return { besoin: 0, capacite: 0, ratio: 0 };
    const totalBesoin = mainChartData.reduce((acc, curr) => acc + (curr.totalBesoinMois || (curr.besoin + curr.besoin_encours)), 0);
    const totalCapacite = mainChartData.reduce((acc, curr) => acc + curr.capacite, 0);
    const ratio = totalBesoin > 0 ? (totalCapacite / totalBesoin) * 100 : 0;
    return { besoin: totalBesoin, capacite: totalCapacite, ratio };
  }, [mainChartData]);

  // Handlers
  const handleChartClick = (data) => {
    if (data && data.activeLabel && !selectedMonth) {
       setSelectedMonth(data.activeLabel);
       setShowPlanning(false); 
    }
  };

  const toggleViewMode = (mode) => {
      setShowPlanning(false);
      if (mode === 'months') {
          setSelectedMonth(null);
      } else {
          if (!selectedMonth) {
              const current = getCurrentMonthKey();
              setSelectedMonth(availableMonths.includes(current) ? current : availableMonths[0]);
          }
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4 lg:p-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <header className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-md">
            {isLoading ? <Loader className="w-5 h-5 text-blue-600 animate-spin" /> : <Activity className="w-5 h-5 text-blue-600" />}
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">Pilotage Migrations</h1>
            <p className="text-xs text-slate-500 flex items-center gap-2">{selectedTech === 'Tous' ? "Vue Équipe" : `Focus: ${selectedTech}`}</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
            <UserButton />
            <div className="relative">
                <Filter className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                <select 
                    value={selectedTech} 
                    onChange={(e) => { setSelectedTech(e.target.value); }}
                    className="pl-7 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 text-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                    <option value="Tous">Tous les techs</option>
                    {techList.map(tech => (<option key={tech} value={tech}>{tech}</option>))}
                </select>
            </div>
            {(selectedMonth || showPlanning) && (
              <button 
                onClick={() => { setSelectedMonth(null); setShowPlanning(false); }}
                className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-red-100 transition-colors border border-red-100"
              >
                <X className="w-3 h-3" /> Retour Vue Globale
              </button>
            )}
        </div>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {/* DOUBLE PIPE (PLANNING) */}
        <div 
            onClick={() => { setShowPlanning(!showPlanning); setSelectedMonth(null); }}
            className={`px-4 py-2 rounded-lg shadow-sm border flex items-center justify-between cursor-pointer transition-all duration-200 
            ${showPlanning ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
        >
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Pipes Planning</p>
            <div className="flex gap-4">
                <div className="flex flex-col">
                    <span className="text-lg font-bold text-indigo-600 leading-none">{planningCount}</span>
                    <span className="text-[9px] text-slate-400">Prêt Migr.</span>
                </div>
                <div className="flex flex-col border-l pl-3 border-slate-100">
                    <span className="text-lg font-bold text-cyan-600 leading-none">{analysisPipeCount}</span>
                    <span className="text-[9px] text-slate-400">Prêt Anal.</span>
                </div>
            </div>
          </div>
           {/* Mini Jauges */}
           <div className="flex gap-1">
                <div className="w-8 h-8 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart innerRadius="60%" outerRadius="100%" barSize={3} data={[{value: planningCount||1, fill: '#4f46e5'}]} startAngle={90} endAngle={-270}>
                            <RadialBar background dataKey="value" cornerRadius={10} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-8 h-8 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart innerRadius="60%" outerRadius="100%" barSize={3} data={[{value: analysisPipeCount||1, fill: '#06b6d4'}]} startAngle={90} endAngle={-270}>
                            <RadialBar background dataKey="value" cornerRadius={10} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                </div>
           </div>
        </div>

        <KPICard title="Besoin Total (h)" value={kpiStats.besoin.toFixed(0)} subtext={selectedMonth ? "Sur le mois" : "Annuel"} icon={Users} colorClass="text-slate-600" active={!!selectedMonth}/>
        <KPICard title="Capacité (h)" value={kpiStats.capacite.toFixed(0)} subtext="Planifiée" icon={Clock} colorClass="text-purple-600" active={!!selectedMonth}/>
        <KPICard title="Taux Couverture" value={`${kpiStats.ratio.toFixed(0)}%`} subtext="Capa. / Besoin" icon={TrendingUp} colorClass={kpiStats.ratio >= 100 ? "text-emerald-600" : "text-red-600"} active={!!selectedMonth}/>
      </div>

      {/* GRAPHIQUE PRINCIPAL (INTERACTIF) */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 mb-4">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                <button onClick={() => toggleViewMode('months')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${!selectedMonth ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Mois</button>
                <button onClick={() => toggleViewMode('weeks')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${selectedMonth ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Semaines</button>
            </div>
            {selectedMonth && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                    <span className="text-xs text-slate-500 font-medium">Mois :</span>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="text-sm border border-slate-200 rounded-md py-1 px-2 focus:ring-blue-500 bg-white">
                        {availableMonths.map(m => (<option key={m} value={m}>{formatMonth(m)}</option>))}
                    </select>
                </div>
            )}
            <div className="flex gap-3 text-[10px] font-medium uppercase tracking-wider text-slate-500 ml-auto">
                <div className="flex items-center gap-1"><span className="w-2 h-2 bg-cyan-500 rounded-full"></span> Besoin</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded-full"></span> En Cours</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-500 rounded-full"></span> Capacité</div>
            </div>
        </div>
        <div className="h-64 w-full cursor-pointer">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={mainChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} onClick={handleChartClick}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={5} tickFormatter={(val) => val.includes('-') ? formatMonthShort(val) : val} interval={0} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', padding: '8px'}} labelFormatter={(val) => val.includes('-') ? formatMonth(val) : `Semaine ${val.replace('S','')}`} formatter={(value, name) => [`${parseFloat(value).toFixed(1)} h`, name === 'besoin' ? 'Besoin (Nouv.)' : name === 'besoin_encours' ? 'Besoin (En cours)' : name === 'capacite' ? 'Capacité' : name]} />
              <Bar stackId="a" dataKey="besoin" fill="#06b6d4" radius={[0, 0, 0, 0]} barSize={selectedMonth ? 30 : 16} />
              <Bar stackId="a" dataKey="besoin_encours" fill="#f59e0b" radius={[3, 3, 0, 0]} barSize={selectedMonth ? 30 : 16} />
              <Bar stackId="b" dataKey="capacite" fill="#a855f7" radius={[3, 3, 0, 0]} barSize={selectedMonth ? 30 : 16} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {!selectedMonth && <p className="text-[10px] text-center text-slate-400 italic mt-1">Cliquez sur un mois pour voir le détail par semaine</p>}
      </div>

      {/* --- LISTE DÉTAILLÉE --- */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden mb-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button 
          onClick={() => setIsDetailListExpanded(!isDetailListExpanded)}
          className="w-full px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-800">Détail des Opérations {selectedTech !== 'Tous' ? `: ${selectedTech}` : "(Tous)"}</h2>
            <span className="ml-2 text-xs font-normal text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">{filteredAndSortedEvents.length} entrées</span>
          </div>
          {isDetailListExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>
        {isDetailListExpanded && (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-xs text-left text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100 sticky top-0 backdrop-blur-sm z-10">
                <tr>
                  <SortableHeader label="Date" sortKey="date" currentSort={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Technicien" sortKey="tech" currentSort={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Client" sortKey="client" currentSort={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Type" sortKey="type" currentSort={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Durée" sortKey="duration" currentSort={sortConfig} onSort={handleSort} align="right" />
                  <SortableHeader label="Statut" sortKey="status" currentSort={sortConfig} onSort={handleSort} align="center" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedEvents.map((event, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-2 py-1 font-medium text-slate-800 whitespace-nowrap">{event.date === "N/A" ? "En attente" : new Date(event.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-2 py-1 whitespace-nowrap truncate max-w-[150px]">{event.tech}</td>
                    <td className="px-2 py-1 font-medium text-slate-700 whitespace-nowrap truncate max-w-[200px]" title={event.client}>{event.client}</td>
                    <td className="px-2 py-1 text-slate-500 whitespace-nowrap">{event.type}</td>
                    <td className="px-2 py-1 text-right font-medium whitespace-nowrap">{event.duration > 0 ? event.duration.toFixed(2) : '-'}</td>
                    <td className="px-2 py-1 text-center whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${event.color === 'cyan' ? 'bg-cyan-100 text-cyan-700' : event.color === 'purple' ? 'bg-purple-100 text-purple-700' : event.color === 'indigo' ? 'bg-indigo-100 text-indigo-700' : event.color === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{event.status}</span>
                    </td>
                  </tr>
                ))}
                {filteredAndSortedEvents.length === 0 && (<tr><td colSpan="6" className="px-4 py-8 text-center text-slate-400 italic">Aucun événement trouvé.</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- BLOC BAS : CHARGE TECH (50%) & TABLEAU MENSUEL (REPLIÉS) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        
        {/* 1. CHARGE PAR TECH (Replié par défaut, 50% width) */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden h-fit">
            <button 
                onClick={() => setIsTechChartExpanded(!isTechChartExpanded)}
                className="w-full px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
            >
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    Charge par Tech {selectedMonth ? `(${formatMonth(selectedMonth)})` : "(Globale)"}
                </h2>
                {isTechChartExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>
            {isTechChartExpanded && (
                <div className="h-64 w-full p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={techAggregatedData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 500}} width={120} />
                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '6px', fontSize: '12px'}} formatter={(value) => [`${parseFloat(value).toFixed(1)} h`, '']} />
                        <Bar dataKey="besoin" fill="#06b6d4" barSize={12} stackId="a" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="besoin_encours" fill="#f59e0b" barSize={12} stackId="a" radius={[0, 2, 2, 0]} />
                        <Bar dataKey="capacite" fill="#a855f7" barSize={12} radius={[0, 2, 2, 0]} stackId="b" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>

        {/* 2. ESPACE VIDE OU FUTUR WIDGET (Le tableau mensuel descend en dessous sur demande "Pas le au dessus") */}
        <div className="hidden lg:block"></div> 
      </div>

      {/* --- TABLEAU MENSUEL (REPLIÉ PAR DÉFAUT, TOUTE LARGEUR) --- */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden mb-8">
        <button 
          onClick={() => setIsTableExpanded(!isTableExpanded)}
          className="w-full px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-slate-400" />
            Résultats Mensuels Détaillés (Globaux)
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyAggregatedData.map((row) => (
                  <tr key={row.month} className={`hover:bg-slate-50 transition-colors ${selectedMonth === row.month ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-4 py-2 font-medium text-slate-800 capitalize">{row.label}</td>
                    <td className="px-4 py-2 text-right">{row.totalBesoinMois.toFixed(1)} h</td>
                    <td className="px-4 py-2 text-right text-amber-500">{row.besoin_encours > 0 ? `${row.besoin_encours.toFixed(1)} h` : '-'}</td>
                    <td className="px-4 py-2 text-right text-purple-600 font-medium">{row.capacite.toFixed(1)} h</td>
                    <td className="px-4 py-2 text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.soldeMensuel >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {row.soldeMensuel > 0 ? '+' : ''}{row.soldeMensuel.toFixed(1)} h
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

export default function App() {
  if (!clerkPubKey) {
    return (
      <div className="flex items-center justify-center h-screen text-red-600 font-bold">
        Erreur : Clé Clerk (REACT_APP_CLERK_PUBLISHABLE_KEY) manquante dans Vercel.
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <SignedIn>
        <MigrationDashboard />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </ClerkProvider>
  );
}
