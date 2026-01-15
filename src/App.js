import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ComposedChart, ReferenceLine, RadialBarChart, RadialBar
} from 'recharts';
import { 
  Activity, Users, Clock, TrendingUp, AlertTriangle, CheckCircle, 
  Calendar, BarChart2, Filter, Info, X, Table as TableIcon, ChevronDown, ChevronUp, FileText, Briefcase
} from 'lucide-react';

/**
 * DONNÉES AGRÉGÉES (12 mois glissants : Sept 2025 - Août 2026)
 * Règles de calcul :
 * - Besoin (Bleu) : 1h + 10min/user > 5 (Analyses nouvelles + Migrations Adwin)
 * - Besoin Encours (Rouge) : 1h/dossier non "Prêt" (J+7)
 * - Capacité (Vert) : Heures planifiées en Backoffice
 */
const DETAILED_DATA = [
  { "month": "2025-09", "tech": "Jean-Philippe SAUROIS", "besoin": 5.0, "besoin_encours": 0.0, "capacite": 15.25 },
  { "month": "2025-09", "tech": "Jean-michel MESSIN", "besoin": 15.0, "besoin_encours": 0.0, "capacite": 34.0 },
  { "month": "2025-09", "tech": "Mathieu GROSSI", "besoin": 12.0, "besoin_encours": 0.0, "capacite": 27.0 },
  { "month": "2025-09", "tech": "Roderick GAMONDES", "besoin": 17.33, "besoin_encours": 0.0, "capacite": 29.0 },
  { "month": "2025-09", "tech": "Zakaria AYAT", "besoin": 11.17, "besoin_encours": 0.0, "capacite": 28.0 },
  { "month": "2025-10", "tech": "Jean-Philippe SAUROIS", "besoin": 14.67, "besoin_encours": 0.0, "capacite": 18.5 },
  { "month": "2025-10", "tech": "Jean-michel MESSIN", "besoin": 7.0, "besoin_encours": 0.0, "capacite": 29.5 },
  { "month": "2025-10", "tech": "Mathieu GROSSI", "besoin": 15.0, "besoin_encours": 0.0, "capacite": 44.25 },
  { "month": "2025-10", "tech": "Roderick GAMONDES", "besoin": 20.83, "besoin_encours": 0.0, "capacite": 37.5 },
  { "month": "2025-10", "tech": "Zakaria AYAT", "besoin": 7.0, "besoin_encours": 0.0, "capacite": 36.75 },
  { "month": "2025-11", "tech": "Jean-Philippe SAUROIS", "besoin": 9.67, "besoin_encours": 0.0, "capacite": 15.5 },
  { "month": "2025-11", "tech": "Jean-michel MESSIN", "besoin": 14.0, "besoin_encours": 5.0, "capacite": 30.0 },
  { "month": "2025-11", "tech": "Mathieu GROSSI", "besoin": 12.17, "besoin_encours": 0.0, "capacite": 31.75 },
  { "month": "2025-11", "tech": "Roderick GAMONDES", "besoin": 12.0, "besoin_encours": 2.0, "capacite": 30.25 },
  { "month": "2025-11", "tech": "Zakaria AYAT", "besoin": 4.5, "besoin_encours": 0.0, "capacite": 27.0 },
  { "month": "2025-12", "tech": "Jean-Philippe SAUROIS", "besoin": 14.17, "besoin_encours": 0.0, "capacite": 13.0 },
  { "month": "2025-12", "tech": "Jean-michel MESSIN", "besoin": 19.0, "besoin_encours": 6.0, "capacite": 43.75 },
  { "month": "2025-12", "tech": "Mathieu GROSSI", "besoin": 12.0, "besoin_encours": 0.0, "capacite": 17.5 },
  { "month": "2025-12", "tech": "Roderick GAMONDES", "besoin": 35.33, "besoin_encours": 4.0, "capacite": 39.75 },
  { "month": "2025-12", "tech": "Zakaria AYAT", "besoin": 8.0, "besoin_encours": 0.0, "capacite": 33.0 },
  { "month": "2026-01", "tech": "Jean-Philippe SAUROIS", "besoin": 11.0, "besoin_encours": 0.0, "capacite": 30.0 },
  { "month": "2026-01", "tech": "Jean-michel MESSIN", "besoin": 16.0, "besoin_encours": 0.0, "capacite": 40.75 },
  { "month": "2026-01", "tech": "Mathieu GROSSI", "besoin": 15.0, "besoin_encours": 0.0, "capacite": 44.5 },
  { "month": "2026-01", "tech": "Roderick GAMONDES", "besoin": 9.17, "besoin_encours": 3.0, "capacite": 32.75 },
  { "month": "2026-01", "tech": "Zakaria AYAT", "besoin": 13.0, "besoin_encours": 0.0, "capacite": 41.5 },
  { "month": "2026-02", "tech": "Jean-Philippe SAUROIS", "besoin": 0.0, "besoin_encours": 0.0, "capacite": 16.0 },
  { "month": "2026-02", "tech": "Jean-michel MESSIN", "besoin": 3.0, "besoin_encours": 0.0, "capacite": 30.0 },
  { "month": "2026-02", "tech": "Mathieu GROSSI", "besoin": 1.0, "besoin_encours": 0.0, "capacite": 30.0 },
  { "month": "2026-02", "tech": "Roderick GAMONDES", "besoin": 1.0, "besoin_encours": 0.0, "capacite": 30.0 },
  { "month": "2026-02", "tech": "Zakaria AYAT", "besoin": 1.0, "besoin_encours": 0.0, "capacite": 28.0 },
  { "month": "2026-03", "tech": "Jean-Philippe SAUROIS", "besoin": 0.0, "besoin_encours": 0.0, "capacite": 16.0 },
  { "month": "2026-03", "tech": "Jean-michel MESSIN", "besoin": 0.0, "besoin_encours": 0.0, "capacite": 30.0 },
  { "month": "2026-03", "tech": "Mathieu GROSSI", "besoin": 0.0, "besoin_encours": 0.0, "capacite": 34.0 },
  { "month": "2026-03", "tech": "Roderick GAMONDES", "besoin": 0.0, "besoin_encours": 0.0, "capacite": 30.0 },
  { "month": "2026-03", "tech": "Zakaria AYAT", "besoin": 0.0, "besoin_encours": 0.0, "capacite": 28.0 }
];

const TECH_LIST = ["Jean-Philippe SAUROIS", "Jean-michel MESSIN", "Mathieu GROSSI", "Roderick GAMONDES", "Zakaria AYAT"];
const PLANNING_COUNT = 18; 

// --- LISTE ÉVÉNEMENTS ---
// Couleurs : Green (Prod), Blue (Besoin), Red (En cours), Indigo (Planning)
const EVENTS_DATA = [
  // ... (Pipe Planning - Indigo)
  {"date": "N/A", "tech": "Roderick GAMONDES", "client": "GIRERD Pauline", "type": "Prêt pour Mise en Place", "duration": 0, "status": "A Planifier", "color": "indigo"},
  {"date": "N/A", "tech": "Jean-michel MESSIN", "client": "NORA CHATI", "type": "Prêt pour Mise en Place", "duration": 0, "status": "A Planifier", "color": "indigo"},
  // ... (Liste tronquée pour l'exemple, contient tous les éléments "Prêt")
  
  // ... (Opérations Datées - Green/Blue/Red)
  {"date": "2026-03-30", "tech": "Mathieu GROSSI", "client": "GROSSI Mathieu", "type": "Tache de backoffice Avocatmail", "duration": 4.0, "status": "Production (Backoffice)", "color": "green"},
  {"date": "2026-02-06", "tech": "Roderick GAMONDES", "client": "MARION VIVIEN", "type": "Avocatmail - Analyse", "duration": 1.0, "status": "Besoin (Analyse/Migr)", "color": "blue"},
  {"date": "2025-12-23", "tech": "Jean-michel MESSIN", "client": "SCP GRANGIE & ASSOCIES - NOTAIRES", "type": "Analyse (En cours)", "duration": 1.0, "status": "En attente (Encours)", "color": "red"},
  // ... (Liste complète des événements dans l'application réelle)
];

// Formatter de date (YYYY-MM -> MMM YY)
const formatMonth = (dateStr) => {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
};

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

export default function MigrationDashboard() {
  const [selectedTech, setSelectedTech] = useState('Tous');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [isTableExpanded, setIsTableExpanded] = useState(false); 
  const [isDetailListExpanded, setIsDetailListExpanded] = useState(true);
  const [showPlanning, setShowPlanning] = useState(false); 

  // Filtrage des données
  const filteredRawData = useMemo(() => {
    if (selectedTech === 'Tous') return DETAILED_DATA;
    return DETAILED_DATA.filter(d => d.tech === selectedTech);
  }, [selectedTech]);

  // Agrégation par mois
  const monthlyAggregatedData = useMemo(() => {
    const aggMap = new Map();
    filteredRawData.forEach(item => {
      if (!aggMap.has(item.month)) aggMap.set(item.month, { month: item.month, besoin: 0, besoin_encours: 0, capacite: 0 });
      const entry = aggMap.get(item.month);
      entry.besoin += item.besoin;
      entry.besoin_encours += item.besoin_encours;
      entry.capacite += item.capacite;
    });

    const fullRange = [];
    const startYear = 2025;
    const startMonthIdx = 9; 

    for(let i=0; i<12; i++) {
        const date = new Date(startYear, startMonthIdx - 1 + i, 1);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        fullRange.push(`${y}-${m}`);
    }
    
    let cumulBesoin = 0;
    let cumulCapacite = 0;
    
    return fullRange.map(month => {
      const data = aggMap.get(month) || { month, besoin: 0, besoin_encours: 0, capacite: 0 };
      const totalBesoinMois = data.besoin + data.besoin_encours;
      cumulBesoin += totalBesoinMois;
      cumulCapacite += data.capacite;

      return {
        ...data,
        formattedMonth: formatMonth(month),
        totalBesoinMois,
        cumulBesoin,
        cumulCapacite,
        soldeMensuel: data.capacite - totalBesoinMois,
        soldeCumule: cumulCapacite - cumulBesoin
      };
    });
  }, [filteredRawData]);

  // Agrégation par technicien
  const techAggregatedData = useMemo(() => {
    const aggMap = new Map();
    const monthsOfInterest = new Set(monthlyAggregatedData.map(d => d.month));
    
    const dataToUse = selectedMonth 
        ? filteredRawData.filter(d => d.month === selectedMonth) 
        : filteredRawData.filter(d => monthsOfInterest.has(d.month));

    dataToUse.forEach(item => {
      if (!aggMap.has(item.tech)) aggMap.set(item.tech, { name: item.tech, besoin: 0, besoin_encours: 0, capacite: 0 });
      const entry = aggMap.get(item.tech);
      entry.besoin += item.besoin;
      entry.besoin_encours += item.besoin_encours;
      entry.capacite += item.capacite;
    });
    return Array.from(aggMap.values());
  }, [filteredRawData, selectedMonth, monthlyAggregatedData]);

  // Filtrage des événements
  const filteredEvents = useMemo(() => {
    let events = EVENTS_DATA;
    if (selectedTech !== 'Tous') {
      events = events.filter(e => e.tech === selectedTech);
    }
    if (showPlanning) {
      return events.filter(e => e.status === "A Planifier");
    }
    if (selectedMonth) {
        events = events.filter(e => e.date !== "N/A" && e.date.startsWith(selectedMonth));
    }
    if (!showPlanning && !selectedMonth) {
         events = events.filter(e => e.date !== "N/A");
    }
    return events;
  }, [selectedTech, selectedMonth, showPlanning]);

  // Calcul des KPIs
  const kpiStats = useMemo(() => {
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4 lg:p-6">
      
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
                    {TECH_LIST.map(tech => (
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

      {/* INFO */}
      <div className="mb-4 flex items-start gap-2 text-xs text-slate-500 bg-slate-100 p-2 rounded border border-slate-200">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p>
          <strong>Vue 12 mois glissants :</strong> Sept 2025 - Août 2026. <span className="text-red-500 font-semibold ml-2">Rouge</span> = Analyse en cours (1h/dossier).
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div 
            onClick={handlePlanningClick}
            className={`px-4 py-3 rounded-lg shadow-sm border flex items-center justify-between cursor-pointer transition-all duration-200 
            ${showPlanning ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pipe Planning</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl font-bold text-indigo-600">{PLANNING_COUNT}</h3>
              <p className="text-xs font-medium text-slate-400">dossiers prêts</p>
            </div>
          </div>
           <div className="w-12 h-12 relative">
             <ResponsiveContainer width="100%" height="100%">
               <RadialBarChart 
                 innerRadius="70%" outerRadius="100%" 
                 barSize={4} 
                 data={[{name: 'ready', value: PLANNING_COUNT, fill: '#4f46e5'}]} 
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
          colorClass="text-emerald-600" // GREEN
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

      {/* GRAPH CHART */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-slate-400" />
            Performance {selectedMonth ? `(Focus ${formatMonth(selectedMonth)})` : "(12 Mois)"}
          </h2>
          <div className="flex gap-3 text-[10px] font-medium uppercase tracking-wider text-slate-500">
            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> Besoin</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full"></span> En Cours</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Capacité</div>
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
              
              <Bar yAxisId="left" stackId="a" dataKey="besoin" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={16}> {/* Blue */}
                {monthlyAggregatedData.map((entry, index) => (
                  <Cell key={`cell-besoin-${index}`} fillOpacity={selectedMonth && entry.month !== selectedMonth ? 0.3 : 1} />
                ))}
              </Bar>
              <Bar yAxisId="left" stackId="a" dataKey="besoin_encours" fill="#ef4444" radius={[3, 3, 0, 0]} barSize={16}> {/* Red */}
                 {monthlyAggregatedData.map((entry, index) => (
                  <Cell key={`cell-encours-${index}`} fillOpacity={selectedMonth && entry.month !== selectedMonth ? 0.3 : 1} />
                ))}
              </Bar>

              <Bar yAxisId="left" stackId="b" dataKey="capacite" fill="#10b981" radius={[3, 3, 0, 0]} barSize={16}> {/* Green */}
                 {monthlyAggregatedData.map((entry, index) => (
                  <Cell key={`cell-capa-${index}`} fillOpacity={selectedMonth && entry.month !== selectedMonth ? 0.3 : 1} />
                ))}
              </Bar>
              
              <Line yAxisId="right" type="monotone" dataKey="soldeCumule" stroke="#475569" strokeWidth={2} dot={{r: 3, fill: '#475569', strokeWidth: 1, stroke: '#fff'}} activeDot={{r: 5}} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MONTHLY RESULTS TABLE */}
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
                  <th className="px-4 py-3 font-semibold text-right text-red-500">Dont En Cours</th>
                  <th className="px-4 py-3 font-semibold text-right text-emerald-600">Capacité</th> 
                  <th className="px-4 py-3 font-semibold text-right">Ecart Mensuel</th>
                  <th className="px-4 py-3 font-semibold text-right text-slate-600">Stock Temps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyAggregatedData.map((row) => (
                  <tr key={row.month} className={`hover:bg-slate-50 transition-colors ${selectedMonth === row.month ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-4 py-2 font-medium text-slate-800 capitalize">{row.formattedMonth}</td>
                    <td className="px-4 py-2 text-right">{row.totalBesoinMois.toFixed(1)} h</td>
                    <td className="px-4 py-2 text-right text-red-500">{row.besoin_encours > 0 ? `${row.besoin_encours.toFixed(1)} h` : '-'}</td>
                    <td className="px-4 py-2 text-right text-emerald-600 font-medium">{row.capacite.toFixed(1)} h</td>
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

      {/* SECONDARY CHARTS */}
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
                <Bar dataKey="besoin" fill="#3b82f6" barSize={8} stackId="a" radius={[0, 0, 0, 0]} /> {/* Blue */}
                <Bar dataKey="besoin_encours" fill="#ef4444" barSize={8} stackId="a" radius={[0, 2, 2, 0]} /> {/* Red */}
                <Bar dataKey="capacite" fill="#10b981" barSize={8} radius={[0, 2, 2, 0]} stackId="b" /> {/* Green */}
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
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/> 
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={formatMonth} interval={0} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip contentStyle={{borderRadius: '6px', fontSize: '12px'}} />
                {selectedMonth && <ReferenceLine x={selectedMonth} stroke="#3b82f6" strokeDasharray="2 2" />}
                <Area type="monotone" dataKey="cumulCapacite" stroke="#10b981" strokeWidth={2} fill="url(#gradCapacite)" /> 
                <Area type="monotone" dataKey="cumulBesoin" stroke="#3b82f6" strokeWidth={2} fill="transparent" strokeDasharray="3 3" /> {/* Blue */}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- LISTE OPÉRATIONS --- */}
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
                        ${event.color === 'blue' ? 'bg-blue-100 text-blue-700' : 
                          event.color === 'green' ? 'bg-emerald-100 text-emerald-700' : 
                          event.color === 'indigo' ? 'bg-indigo-100 text-indigo-700' : 
                          event.color === 'red' ? 'bg-red-100 text-red-700' : 'bg-slate-100'}`}>
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