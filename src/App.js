import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ComposedChart, ReferenceLine, RadialBarChart, RadialBar
} from 'recharts';
import { 
  Activity, Users, Clock, TrendingUp, AlertTriangle, CheckCircle, 
  Calendar, BarChart2, Filter, Info, X, Table as TableIcon, ChevronDown, ChevronUp, FileText, Briefcase, Loader,
  ArrowUpDown, ArrowUp, ArrowDown, CornerDownRight, Layout, Search, Layers, Server, FileSearch, Terminal,
  Calculator, Database
} from 'lucide-react';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, UserButton, useUser, useAuth } from "@clerk/clerk-react";

// --- CONFIGURATION ---
const TECH_LIST_DEFAULT = [
    "Zakaria AYAT", 
    "Jean-michel MESSIN", 
    "Mathieu GROSSI", 
    "Jean-Philippe SAUROIS", 
    "Roderick GAMONDES"
];

// PALETTE "CLAIRE" (Bleu clair, Orange clair, Vert clair)
const COLORS = {
    besoin: "#60a5fa",        // Bleu clair (Blue-400)
    encours: "#fb923c",       // Orange clair (Orange-400)
    capacite: "#34d399",      // Vert clair (Emerald-400)

    ok: "#34d399",            // Vert clair pour le positif
    danger: "#f87171",        // Rouge clair pour le négatif/alerte

    bg_besoin: "bg-blue-400",
    bg_encours: "bg-orange-400",
    bg_capacite: "bg-emerald-400",

    text_besoin: "text-blue-600",     
    text_encours: "text-orange-600",
    text_capacite: "text-emerald-600",
    text_ok: "text-emerald-600",
    text_danger: "text-red-600",
    text_neutral: "text-slate-600"
};

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

const toLocalDateString = (date) => {
    if (!date) return "N/A";
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
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

const getWeekRange = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDay(); 
    const diffToMonday = date.getDate() - day + (day === 0 ? -6 : 1);
    
    const monday = new Date(date);
    monday.setDate(diffToMonday);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const format = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    return `${format(monday)} - ${format(sunday)}`;
};

const getCurrentMonthKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const parseDateSafe = (dateStr) => {
    if (!dateStr) return null;
    let cleanStr = dateStr;
    if (cleanStr.includes('/')) {
        const parts = cleanStr.split(' ')[0].split('/'); 
        if (parts.length === 3) cleanStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
    } else if (cleanStr.includes('T')) {
        cleanStr = cleanStr.split('T')[0];
    }
    const date = new Date(cleanStr);
    return isNaN(date.getTime()) ? null : date;
};

const calculateDuration = (duree) => {
    if (typeof duree === 'number') return duree;
    if (duree && typeof duree === 'string') {
        if (duree.includes(':')) {
          const [h, m] = duree.split(':').map(Number);
          return (h || 0) + (m || 0)/60;
        } else {
          return parseFloat(duree.replace(',', '.')) || 0;
        }
    }
    return 0;
};

// --- GESTION DES PLAGES HORAIRES ---
const getEventTimeRange = (dateObj, timeStr, durationHrs) => {
    if (!dateObj) return null;
    if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) return null;
    
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h)) return null; 

    const start = new Date(dateObj);
    start.setHours(h, m || 0, 0, 0);
    
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

// --- NOUVELLE LOGIQUE DE PONDÉRATION (FIXE) ---
const getRemainingLoad = (categorie) => {
    if (!categorie) return 0.5; 

    const cat = categorie.trim().toLowerCase();

    // 1.00 h
    if (cat.includes('prêt pour mise en place') || cat.includes('a planifier')) {
        return 1.0;
    }

    // 0.75 h
    if (cat.includes('copie en cours')) {
        return 0.75;
    }

    // 0.15 h
    if (cat.includes('préparation tenant')) {
        return 0.15;
    }

    // 0.05 h (Attente / Bloqué) - Valeur très faible pour ne pas charger le graph
    if (cat.includes('attente') || cat.includes('bloqué')) {
        return 0.05;
    }

    // 0.00 h (Suspendu)
    if (cat.includes('suspendu')) {
        return 0.0;
    }

    // 0.50 h (Défaut / Autres)
    return 0.5;
};

// --- COMPOSANTS UI ---

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const besoin = data.besoin || 0;
    const encours = data.besoin_encours || 0;
    const capacite = data.capacite || 0;
    
    const dispo = capacite - (besoin + encours);
    const isPositive = dispo >= 0;

    return (
      <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg text-xs min-w-[180px]">
        <p className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">
            {String(label).startsWith('S') ? label : formatMonth(data.month)}
        </p>
        
        <div className="space-y-1">
            <div className={`flex justify-between items-center ${COLORS.text_besoin}`}>
                <span>Besoin (Nouv) :</span>
                <span className="font-bold">{besoin.toFixed(1)} h</span>
            </div>
            <div className={`flex justify-between items-center ${COLORS.text_encours}`}>
                <span>Besoin (En cours) :</span>
                <span className="font-bold">{encours.toFixed(1)} h</span>
            </div>
            <div className={`flex justify-between items-center ${COLORS.text_capacite}`}>
                <span>Capacité Planifiée :</span>
                <span className="font-bold">{capacite.toFixed(1)} h</span>
            </div>
        </div>

        <div className={`mt-3 pt-2 border-t border-slate-100 flex justify-between items-center font-bold text-sm ${isPositive ? COLORS.text_ok : COLORS.text_danger}`}>
            <span>DISPONIBLE :</span>
            <span>{isPositive ? '+' : ''}{dispo.toFixed(1)} h</span>
        </div>
      </div>
    );
  }
  return null;
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
    <div className={`p-2 rounded-md ${colorClass.replace('text-', 'bg-').replace('600', '50')}`}>
      <Icon className={`w-5 h-5 ${colorClass}`} />
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

const PipeProgress = ({ label, count, colorClass, barColor }) => {
    const percentage = Math.min((count / 15) * 100, 100);
    return (
        <div className="flex flex-col w-full">
            <div className="flex justify-between items-end mb-1">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">{label}</span>
                <span className={`text-sm font-bold ${colorClass}`}>{count}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`} style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
};

// --- APPLICATION PRINCIPALE ---

function MigrationDashboard() {
  const [backofficeData, setBackofficeData] = useState([]);
  const [encoursData, setEncoursData] = useState([]);
  const [techList, setTechList] = useState(TECH_LIST_DEFAULT);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedTech, setSelectedTech] = useState('Tous');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [showPlanning, setShowPlanning] = useState(false); 

  const [isDetailListExpanded, setIsDetailListExpanded] = useState(true);
  const [isTableExpanded, setIsTableExpanded] = useState(false); 
  const [isTechChartExpanded, setIsTechChartExpanded] = useState(false); 

  // --- DEBUG STATE ---
  const [debugData, setDebugData] = useState(null);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [debugTab, setDebugTab] = useState('calc'); 

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
        const json = await response.json();
        setDebugData(json);

        if (!response.ok) throw new Error(json.error || `Erreur API`);
        
        if (json.backoffice) setBackofficeData(json.backoffice); 
        if (json.encours) setEncoursData(json.encours);
        setIsLoading(false);
      } catch (err) {
        console.error("❌ Erreur API :", err);
        setDebugData({ error: err.message });
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

    const monthlyStats = new Map();
    const monthsSet = new Set(); 
    const techBackofficeSchedule = {}; 
    const scheduledClients = new Set(); 

    const allowedNeedEvents = [
        'Avocatmail - Analyse', 
        'Migration messagerie Adwin', 
        'Migration messagerie Adwin - analyse',
    ];

    let allEvents = [];

    // 1. TRAITEMENT BACKOFFICE / PLANNING
    backofficeData.forEach(row => {
        const cleanRow = {};
        Object.keys(row).forEach(k => cleanRow[k.trim()] = row[k]);
        
        const typeEventRaw = cleanRow['EVENEMENT'] || "";
        const typeEventLower = typeEventRaw.toLowerCase();
        
        const isBackoffice = typeEventLower.includes('tache de backoffice avocatmail');
        const isNeed = allowedNeedEvents.includes(typeEventRaw) || 
                       (typeEventLower.includes("avocatmail") && typeEventLower.includes("analyse"));

        if (!isBackoffice && !isNeed) return;

        const resp = cleanRow['RESPONSABLE'];
        const tech = normalizeTechName(resp, techList);
        if (!techList.includes(tech)) return;

        const dateStr = cleanRow['DATE'];
        const timeStr = cleanRow['HEURE']; 
        const duree = cleanRow['DUREE_HRS'];
        const dateEvent = parseDateSafe(dateStr);
        if(!dateEvent) return;
        
        const dateFormatted = toLocalDateString(dateEvent);
        const month = dateFormatted.substring(0, 7);
        const duration = calculateDuration(duree);
        const timeRange = getEventTimeRange(dateEvent, timeStr, duration);
        
        const dossier = cleanRow['DOSSIER'] || cleanRow['LIBELLE'] || 'Client Inconnu';
        const nbUsers = cleanRow['NB_USERS'] || cleanRow['USER'] || '1';

        if (isBackoffice) {
            if (!techBackofficeSchedule[tech]) techBackofficeSchedule[tech] = [];
            techBackofficeSchedule[tech].push(dateEvent.getTime());
        }

        if (dossier && dossier !== 'Client Inconnu') {
            scheduledClients.add(dossier.trim().toUpperCase());
        }

        allEvents.push({
            id: Math.random(),
            date: dateFormatted,
            month,
            tech,
            typeRaw: typeEventRaw,
            duration,
            isBackoffice,
            isNeed,
            timeRange,
            dossier,
            nbUsers,
            netCapacity: isBackoffice ? duration : 0, 
            netNeed: 0, 
            isAbsorbed: false,
            status: '',
            color: ''
        });
    });

    Object.keys(techBackofficeSchedule).forEach(t => {
        techBackofficeSchedule[t].sort((a, b) => a - b);
    });

    // 2. COLLISIONS
    const boEvents = allEvents.filter(e => e.isBackoffice);
    const techEvents = allEvents.filter(e => e.isNeed);

    techEvents.forEach(te => {
        const users = parseInt(te.nbUsers, 10) || 1;
        let baseNeed = 1.0;
        if (users > 5) baseNeed += (users - 5) * (10/60);
        te.netNeed = Math.max(te.duration, baseNeed);
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

    // 3. STATS
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

    const finalEventsList = [];

    [...boEvents, ...techEvents].forEach(ev => {
        if (ev.isBackoffice) {
            ev.color = 'capacity'; // Vert clair
            ev.status = ev.netCapacity < ev.duration 
                ? `Prod BO (Net: ${ev.netCapacity.toFixed(1)}h)` 
                : 'Production (Backoffice)';
            addToStats(ev.month, ev.tech, 0, 0, ev.netCapacity);
        } 
        else {
            if (ev.isAbsorbed) {
                ev.color = 'absorbed'; // Slate light
                ev.status = 'Planifié pendant BO';
            } else {
                ev.color = 'need'; // Bleu clair
                ev.status = 'Besoin (Analyse/Migr)';
                addToStats(ev.month, ev.tech, ev.netNeed, 0, 0);
            }
        }

        finalEventsList.push({
            date: ev.date,
            tech: ev.tech,
            client: ev.dossier,
            type: ev.typeRaw,
            duration: ev.duration,
            status: ev.status,
            color: ev.color,
            raw_besoin: ev.netNeed,
            raw_capacite: ev.netCapacity,
            raw_besoin_encours: 0
        });
    });

    // 4. ENCOURS
    let countReadyMiseEnPlace = 0;
    let countReadyAnalyse = 0; 
    const planningEventsList = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    encoursData.forEach(row => {
        const cleanRow = {};
        Object.keys(row).forEach(k => cleanRow[k.trim()] = row[k]);
        const techNameRaw = cleanRow['RESPONSABLE'];
        const categorie = cleanRow['CATEGORIE'];
        const reportDateStr = cleanRow['REPORTE_LE'];
        const clientName = cleanRow['INTERLOCUTEUR'] || 'Client Inconnu';
        const tech = normalizeTechName(techNameRaw, techList);
        
        if (!techList.includes(tech)) return;

        // DÉDUPLICATION
        if (scheduledClients.has(clientName.trim().toUpperCase())) {
            return;
        }

        if (categorie === 'Prêt pour mise en place') {
            countReadyMiseEnPlace++;
            planningEventsList.push({
                date: "N/A", tech, client: clientName, type: "Prêt pour Mise en Place",
                duration: 0, status: "A Planifier (Migr)", color: "ready_migr"
            });
            return;
        }
        
        if (categorie === 'Prêt pour analyse' || categorie === 'A Planifier (Analyse)') {
            countReadyAnalyse++;
            planningEventsList.push({
                date: "N/A", tech, client: clientName, type: "Prêt pour Analyse",
                duration: 0, status: "A Planifier (Analyse)", color: "ready_analyse"
            });
        }

        // --- NOUVELLE FONCTION DE CALCUL CHARGE ---
        const remainingLoad = getRemainingLoad(categorie);
        if (remainingLoad <= 0) return; // Si 0.00h (ex: Suspendu), on ne l'affiche pas dans le graph

        const reportDate = parseDateSafe(reportDateStr);
        let targetDate = null;
        let status = "";
        let color = "";

        if (reportDate) {
            targetDate = reportDate;
            status = "Reporté";
            color = "reporte";
        } 
        else {
            const techSlots = techBackofficeSchedule[tech] || [];
            const targetSlotTime = techSlots.find(t => t >= todayTime);

            if (targetSlotTime) {
                targetDate = new Date(targetSlotTime);
                status = "Auto (Prochain BO)";
                color = "encours"; // Orange clair
            } else {
                targetDate = new Date(today);
                targetDate.setDate(today.getDate() + 7);
                status = "En attente (Pas de BO dispo)";
                color = "attente";
            }
        }

        if (targetDate) { 
            const targetDateStr = toLocalDateString(targetDate);
            const targetMonth = targetDateStr.substring(0, 7);

            addToStats(targetMonth, tech, 0, remainingLoad, 0);

            finalEventsList.push({
                date: targetDateStr,
                tech,
                client: clientName,
                type: `Encours (${categorie || "Non classé"})`,
                duration: remainingLoad,
                status: status,
                color: color,
                raw_besoin: 0,
                raw_capacite: 0,
                raw_besoin_encours: remainingLoad
            });
        }
    });

    const detailedDataArray = Array.from(monthlyStats.values()).sort((a, b) => a.month.localeCompare(b.month));
    const sortedMonths = Array.from(monthsSet).sort().reverse(); 

    return {
        detailedData: detailedDataArray,
        eventsData: [...planningEventsList, ...finalEventsList],
        planningCount: countReadyMiseEnPlace,
        analysisPipeCount: countReadyAnalyse,
        availableMonths: sortedMonths
    };
  }, [backofficeData, encoursData, techList]);

  // --- LOGIQUE DEBUG AUDIT ---
  const auditData = useMemo(() => {
      if (!selectedMonth) return null;
      
      const relevantEvents = eventsData.filter(e => 
          e.date.startsWith(selectedMonth) && 
          e.raw_besoin > 0 &&
          (selectedTech === 'Tous' || e.tech === selectedTech)
      );

      const grouped = {};
      relevantEvents.forEach(e => {
          const week = getWeekLabel(e.date);
          if (!grouped[week]) grouped[week] = [];
          grouped[week].push(e);
      });

      return grouped;
  }, [eventsData, selectedMonth, selectedTech]);

  // --- LOGIQUE TRI & AFFICHAGE ---
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const filteredAndSortedEvents = useMemo(() => {
    let events = eventsData;
    if (selectedTech !== 'Tous') events = events.filter(e => e.tech === selectedTech);
    
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

    const allMonthsKeys = Array.from(aggMap.keys()).sort();
    if(allMonthsKeys.length === 0) return [];

    const [startYear, startMonth] = allMonthsKeys[0].split('-').map(Number);
    const [endYear, endMonth] = allMonthsKeys[allMonthsKeys.length - 1].split('-').map(Number);
    
    const result = [];
    let currentY = startYear;
    let currentM = startMonth;

    while (currentY < endYear || (currentY === endYear && currentM <= endMonth)) {
        const mStr = `${currentY}-${String(currentM).padStart(2, '0')}`;
        const data = aggMap.get(mStr) || { month: mStr, label: formatMonthShort(mStr), besoin: 0, besoin_encours: 0, capacite: 0 };
        const totalBesoinMois = data.besoin + data.besoin_encours;
        result.push({
            ...data,
            totalBesoinMois,
            soldeMensuel: data.capacite - totalBesoinMois
        });
        currentM++;
        if (currentM > 12) {
            currentM = 1;
            currentY++;
        }
    }
    return result;
  }, [detailedData, selectedTech]);

  const weeklyAggregatedData = useMemo(() => {
      if (!selectedMonth) return [];
      let relevantEvents = eventsData.filter(e => e.date !== "N/A" && e.date.startsWith(selectedMonth));
      if (selectedTech !== 'Tous') relevantEvents = relevantEvents.filter(e => e.tech === selectedTech);

      const weekMap = new Map();
      relevantEvents.forEach(evt => {
          const weekNum = getWeekLabel(evt.date); 
          const weekRange = getWeekRange(evt.date); 
          const label = `${weekNum} (${weekRange})`; 

          if (!weekMap.has(weekNum)) {
              weekMap.set(weekNum, { 
                  month: weekNum, 
                  label: label, 
                  weekSort: parseInt(weekNum.replace('S', '')),
                  besoin: 0, besoin_encours: 0, capacite: 0 
              });
          }
          const entry = weekMap.get(weekNum);
          entry.besoin += (evt.raw_besoin || 0);
          entry.besoin_encours += (evt.raw_besoin_encours || 0);
          entry.capacite += (evt.raw_capacite || 0);
      });

      return Array.from(weekMap.values()).sort((a, b) => a.weekSort - b.weekSort);
  }, [eventsData, selectedMonth, selectedTech]);

  const mainChartData = selectedMonth ? weeklyAggregatedData : monthlyAggregatedData;

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

  const kpiStats = useMemo(() => {
    if (mainChartData.length === 0) return { besoin: 0, capacite: 0, ratio: 0 };
    const totalBesoin = mainChartData.reduce((acc, curr) => acc + (curr.totalBesoinMois || (curr.besoin + curr.besoin_encours)), 0);
    const totalCapacite = mainChartData.reduce((acc, curr) => acc + curr.capacite, 0);
    const ratio = totalBesoin > 0 ? (totalCapacite / totalBesoin) * 100 : 0;
    return { besoin: totalBesoin, capacite: totalCapacite, ratio };
  }, [mainChartData]);

  const handleChartClick = (data) => {
    if (data && data.activePayload && data.activePayload.length > 0 && !selectedMonth) {
         const clickedData = data.activePayload[0].payload;
         if(clickedData && clickedData.month) {
             setSelectedMonth(clickedData.month); 
             setShowPlanning(false);
         }
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

  const getStatusBadgeColor = (colorCode) => {
      switch(colorCode) {
          case 'need': return `bg-blue-50 ${COLORS.text_besoin} border border-blue-100`;
          case 'encours': return `bg-orange-50 ${COLORS.text_encours} border border-orange-100`;
          case 'capacity': return `bg-emerald-50 ${COLORS.text_capacite} border border-emerald-100`;
          case 'ready_migr': return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
          case 'ready_analyse': return 'bg-cyan-50 text-cyan-600 border border-cyan-100';
          case 'reporte': return `bg-red-50 ${COLORS.text_danger} border border-red-100`;
          case 'attente': return `bg-slate-50 ${COLORS.text_neutral} border border-slate-200`;
          default: return `bg-slate-50 ${COLORS.text_neutral}`;
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4 lg:p-6 animate-in fade-in duration-500 relative">
      
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
        {/* NOUVEAU DOUBLE PIPE (BARRES) */}
        <div 
            onClick={() => { setShowPlanning(!showPlanning); setSelectedMonth(null); }}
            className={`px-4 py-3 rounded-lg shadow-sm border flex flex-col justify-center cursor-pointer transition-all duration-200 gap-3
            ${showPlanning ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
        >
            <PipeProgress label="Prêt pour Mise en Place" count={planningCount} colorClass="text-indigo-600" barColor="bg-indigo-500" />
            <PipeProgress label="Prêt pour Analyse" count={analysisPipeCount} colorClass="text-cyan-600" barColor="bg-cyan-500" />
        </div>

        <KPICard title="Besoin Total (h)" value={kpiStats.besoin.toFixed(0)} subtext={selectedMonth ? "Sur le mois" : "Annuel"} icon={Users} colorClass={COLORS.text_besoin} active={!!selectedMonth}/>
        <KPICard title="Capacité (h)" value={kpiStats.capacite.toFixed(0)} subtext="Planifiée" icon={Clock} colorClass={COLORS.text_capacite} active={!!selectedMonth}/>
        <KPICard title="Taux Couverture" value={`${kpiStats.ratio.toFixed(0)}%`} subtext="Capa. / Besoin" icon={TrendingUp} colorClass={kpiStats.ratio >= 100 ? COLORS.text_ok : COLORS.text_danger} active={!!selectedMonth}/>
      </div>

      {/* GRAPHIQUE PRINCIPAL */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 mb-4">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                <button onClick={() => toggleViewMode('months')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${!selectedMonth ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Vue Annuelle (Mois)</button>
                <button onClick={() => toggleViewMode('weeks')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${selectedMonth ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Vue Détaillée (Semaines)</button>
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
                <div className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${COLORS.bg_besoin}`}></span> Besoin (Bleu clair)</div>
                <div className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${COLORS.bg_encours}`}></span> En Cours (Orange clair)</div>
                <div className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${COLORS.bg_capacite}`}></span> Capacité (Vert clair)</div>
            </div>
        </div>
        <div className="h-64 w-full cursor-pointer">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={mainChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} onClick={handleChartClick}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey={selectedMonth ? "label" : "month"} 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#64748b', fontSize: 10}} 
                dy={5} 
                tickFormatter={(val) => {
                    if (String(val).startsWith('S')) return val;
                    return formatMonthShort(val);
                }}
                interval={0} 
              />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
              {/* REMPLACEMENT ICI PAR LE TOOLTIP PERSONNALISÉ */}
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
              
              <Bar stackId="a" dataKey="besoin" fill={COLORS.besoin} radius={[0, 0, 0, 0]} barSize={selectedMonth ? 30 : 16} />
              <Bar stackId="a" dataKey="besoin_encours" fill={COLORS.encours} radius={[3, 3, 0, 0]} barSize={selectedMonth ? 30 : 16} />
              <Bar stackId="b" dataKey="capacite" fill={COLORS.capacite} radius={[3, 3, 0, 0]} barSize={selectedMonth ? 30 : 16} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {!selectedMonth && <p className="text-[10px] text-center text-slate-400 italic mt-1">Cliquez sur un mois pour voir le détail par semaine</p>}
      </div>

      {/* --- LISTE DÉTAILLÉE --- */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden mb-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button onClick={() => setIsDetailListExpanded(!isDetailListExpanded)} className="w-full px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" /><h2 className="text-sm font-bold text-slate-800">Détail des Opérations {selectedTech !== 'Tous' ? `: ${selectedTech}` : "(Tous)"}</h2>
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
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeColor(event.color)}`}>
                            {event.status}
                        </span>
                    </td>
                  </tr>
                ))}
                {filteredAndSortedEvents.length === 0 && (<tr><td colSpan="6" className="px-4 py-8 text-center text-slate-400 italic">Aucun événement trouvé.</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- BLOC BAS : CHARGE TECH & TABLEAU MENSUEL (REPLIÉS) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* CHARGE PAR TECH */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden h-fit">
            <button onClick={() => setIsTechChartExpanded(!isTechChartExpanded)} className="w-full px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Users className="w-4 h-4 text-slate-400" />Charge par Tech {selectedMonth ? `(${formatMonth(selectedMonth)})` : "(Globale)"}</h2>
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
                        <Bar dataKey="besoin" fill={COLORS.besoin} barSize={12} stackId="a" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="besoin_encours" fill={COLORS.encours} barSize={12} stackId="a" radius={[0, 2, 2, 0]} />
                        <Bar dataKey="capacite" fill={COLORS.capacite} barSize={12} radius={[0, 2, 2, 0]} stackId="b" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
        <div className="hidden lg:block"></div> 
      </div>

      {/* TABLEAU MENSUEL */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden mb-16">
        <button onClick={() => setIsTableExpanded(!isTableExpanded)} className="w-full px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2"><TableIcon className="w-4 h-4 text-slate-400" />Résultats Mensuels Détaillés (Globaux)</h2>
          {isTableExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>
        {isTableExpanded && (
          <div className="overflow-x-auto animate-in fade-in slide-in-from-top-2 duration-200">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                <tr>
                    <th className="px-4 py-3 font-semibold">Mois</th>
                    <th className="px-4 py-3 font-semibold text-right">Besoin Total</th>
                    <th className={`px-4 py-3 font-semibold text-right ${COLORS.text_encours}`}>Dont En Cours</th>
                    <th className={`px-4 py-3 font-semibold text-right ${COLORS.text_capacite}`}>Capacité</th> 
                    <th className="px-4 py-3 font-semibold text-right">Ecart Mensuel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyAggregatedData.map((row) => (
                  <tr key={row.month} className={`hover:bg-slate-50 transition-colors ${selectedMonth === row.month ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-4 py-2 font-medium text-slate-800 capitalize">{row.label}</td>
                    <td className="px-4 py-2 text-right">{row.totalBesoinMois.toFixed(1)} h</td>
                    <td className={`px-4 py-2 text-right ${COLORS.text_encours}`}>{row.besoin_encours > 0 ? `${row.besoin_encours.toFixed(1)} h` : '-'}</td>
                    <td className={`px-4 py-2 text-right ${COLORS.text_capacite} font-medium`}>{row.capacite.toFixed(1)} h</td>
                    <td className="px-4 py-2 text-right"><span className={`px-2 py-0.5 rounded text-xs font-medium ${row.soldeMensuel >= 0 ? `bg-emerald-50 ${COLORS.text_ok}` : `bg-red-50 ${COLORS.text_danger}`}`}>{row.soldeMensuel > 0 ? '+' : ''}{row.soldeMensuel.toFixed(1)} h</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- DEBUG CONSOLE (Rétractable avec Onglets) --- */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${isDebugOpen ? 'translate-y-0' : 'translate-y-[calc(100%-40px)]'}`}>
        <div className="bg-slate-900 border-t border-slate-700 shadow-2xl flex flex-col h-64">
            
            {/* Header avec Onglets */}
            <div className="w-full h-10 bg-slate-800 flex items-center justify-between px-4 border-b border-slate-700">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 cursor-pointer text-white text-xs font-mono" onClick={() => setIsDebugOpen(!isDebugOpen)}>
                        <Terminal size={14} className="text-green-400" />
                        <span>CONSOLE DEBUG</span>
                    </div>
                    {/* Onglets */}
                    <div className="flex bg-slate-950 rounded p-0.5">
                        <button 
                            onClick={() => setDebugTab('raw')}
                            className={`px-3 py-1 text-[10px] rounded transition-colors ${debugTab === 'raw' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Données Brutes
                        </button>
                        <button 
                            onClick={() => setDebugTab('calc')}
                            className={`px-3 py-1 text-[10px] rounded transition-colors ${debugTab === 'calc' ? 'bg-blue-900 text-blue-100 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Audit : Besoin (Nouv)
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {debugData && (
                        <span className={`px-2 py-0.5 rounded text-[10px] ${debugData.error ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
                            {debugData.error ? 'ERREUR API' : 'DONNÉES REÇUES'}
                        </span>
                    )}
                    <button onClick={() => setIsDebugOpen(!isDebugOpen)} className="text-slate-400 hover:text-white">
                        {isDebugOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </button>
                </div>
            </div>

            {/* Contenu */}
            <div className="flex-1 overflow-auto p-4 font-mono text-xs bg-slate-950">
                {debugTab === 'raw' ? (
                    <div className="text-green-400">
                        {debugData ? (
                            <pre>{JSON.stringify(debugData, null, 2)}</pre>
                        ) : (
                            <div className="flex items-center gap-2 text-slate-500">
                                <Activity size={14} className="animate-spin" /> Chargement des données...
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-blue-200">
                        {auditData ? (
                            Object.keys(auditData).length > 0 ? (
                                Object.entries(auditData).map(([week, events]) => (
                                    <div key={week} className="mb-4 border-b border-slate-800 pb-2">
                                        <h3 className="font-bold text-yellow-400 mb-1">Semaine {week} <span className="text-slate-500 font-normal">({events.length} événements)</span></h3>
                                        <table className="w-full text-left text-[10px]">
                                            <thead>
                                                <tr className="text-slate-500 border-b border-slate-800">
                                                    <th className="pb-1">Date</th>
                                                    <th className="pb-1">Client</th>
                                                    <th className="pb-1">Technicien</th>
                                                    <th className="pb-1 text-right">Valeur (h)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {events.map((ev, i) => (
                                                    <tr key={i} className="hover:bg-slate-900">
                                                        <td className="py-0.5 text-slate-300">{ev.date}</td>
                                                        <td className="py-0.5 text-blue-300 truncate max-w-[200px]">{ev.client}</td>
                                                        <td className="py-0.5 text-slate-400">{ev.tech}</td>
                                                        <td className="py-0.5 text-right font-bold text-white">{ev.raw_besoin.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-slate-900 font-bold">
                                                    <td colSpan="3" className="text-right py-1 text-slate-400">TOTAL SEMAINE :</td>
                                                    <td className="text-right py-1 text-green-400">
                                                        {events.reduce((sum, e) => sum + e.raw_besoin, 0).toFixed(2)} h
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                ))
                            ) : (
                                <div className="text-slate-500 italic p-4">Aucun événement "Besoin (Nouv)" trouvé pour ce mois.</div>
                            )
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                                <Calculator size={24} />
                                <p>Sélectionnez un mois sur le graphique pour voir le détail hebdomadaire.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>

    </div>
  );
}

export default function App() {
  if (!clerkPubKey) {
    return <div className="flex items-center justify-center h-screen text-red-600 font-bold">Erreur : Clé Clerk manquante.</div>;
  }
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <SignedIn><MigrationDashboard /></SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </ClerkProvider>
  );
}
