import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ComposedChart, ReferenceLine, RadialBarChart, RadialBar
} from 'recharts';
import { 
  Activity, Users, Clock, TrendingUp, AlertTriangle, CheckCircle, 
  Calendar, BarChart2, Filter, Info, X, Table as TableIcon, ChevronDown, ChevronUp, FileText, Briefcase, Loader,
  ArrowUpDown, ArrowUp, ArrowDown, CornerDownRight, Layout, Search, Layers, Server, FileSearch, Terminal
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
    if (typeof cleanStr !== 'string') return null; // Sécurité anti-crash
    
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

// Fonction pour calculer les plages horaires (Start/End Timestamps)
// SÉCURISÉE CONTRE LES VALEURS NULL
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

// Fonction pour calculer le chevauchement en heures entre deux plages
const getOverlapHours = (range1, range2) => {
    if (!range1 || !range2) return 0;
    const start = Math.max(range1.start, range2.start);
    const end = Math.min(range1.end, range2.end);
    if (end <= start) return 0;
    return (end - start) / (1000 * 60 * 60); 
};

// --- CALCUL AVANCEMENT ---
const getRemainingLoad = (categorie) => {
    if (!categorie) return 0.5; 

    const cat = categorie.trim();
    let completion = 0.5; 

    if (cat.includes('Préparation tenant 365')) completion = 0.15;
    else if (cat.includes('Attente retour client')) completion = 0.05;
    else if (cat.includes('Attente retour presta')) completion = 0.05;
    else if (cat.includes('Bloqué cause client/presta')) completion = 0.05;
    else if (cat.includes('Copie en cours')) completion = 0.75;
    else if (cat.includes('Suspendu')) completion = 0.05;
    else if (cat.includes('Prêt pour mise en place')) completion = 1.0; 
    else if (cat.includes('A planifier')) completion = 1.0; 
    
    return Math.max(0, 1.0 * (1 - completion));
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
  
  // --- TRAITEMENT CORE (LOGIQUE DE SOUSTRACTION/ABSORPTION) ---

  const { detailedData, eventsData, planningCount, analysisPipeCount, availableMonths } = useMemo(() => {
    // Protection contre plantage si données vides
    if (!Array.isArray(backofficeData) || (backofficeData.length === 0 && encoursData.length === 0)) {
        return { detailedData: [], eventsData: [], planningCount: 0, analysisPipeCount: 0, availableMonths: [] };
    }

    try {
        const planningEventsList = [];
        const monthlyStats = new Map();
        const monthsSet = new Set(); 

        // --- ÉTAPE 1 : PRÉ-TRAITEMENT ---
        let allEvents = [];

        const allowedNeedEvents = [
            'Avocatmail - Analyse', 
            'Migration messagerie Adwin', 
            'Migration messagerie Adwin - analyse',
        ];

        backofficeData.forEach(row => {
            const cleanRow = {};
            Object.keys(row).forEach(k => cleanRow[k.trim()] = row[k]);
            
            const typeEventRaw = cleanRow['EVENEMENT'] || "";
            const typeEventLower = typeEventRaw.toLowerCase();
            
            // Filtre Global
            const isBackoffice = typeEventLower.includes('backoffice') || typeEventLower.includes('back office');
            const isRelevant = allowedNeedEvents.includes(typeEventRaw) || 
                            typeEventLower.includes("avocatmail") || 
                            typeEventLower.includes("adwin") ||
                            typeEventLower.includes("migration") ||
                            isBackoffice;

            if (!isRelevant) return;

            const resp = cleanRow['RESPONSABLE'];
            const tech = normalizeTechName(resp, techList);
            if (!techList.includes(tech)) return;

            const dateStr = cleanRow['DATE'];
            const timeStr = cleanRow['HEURE']; // PEUT ETRE NULL
            const duree = cleanRow['DUREE_HRS'];
            const dateEvent = parseDateSafe(dateStr);
            if (!dateEvent) return;

            const duration = calculateDuration(duree);
            
            // SÉCURITÉ : timeRange sera null si pas d'heure, mais ça ne plantera pas
            const timeRange = getEventTimeRange(dateEvent, timeStr, duration);
            
            const dossier = cleanRow['DOSSIER'] || cleanRow['LIBELLE'] || 'Client Inconnu';
            const nbUsers = cleanRow['NB_USERS'] || cleanRow['USER'] || '1';

            allEvents.push({
                id: Math.random(),
                date: dateEvent.toISOString().split('T')[0],
                month: dateEvent.toISOString().split('T')[0].substring(0, 7),
                tech,
                typeRaw: typeEventRaw,
                isBackoffice,
                duration,
                timeRange, // Peut être null si pas d'heure
                dossier,
                nbUsers,
                netCapacity: 0, 
                netNeed: 0,
                status: '',
                color: ''
            });
        });

        // --- ÉTAPE 2 : CALCUL DES CHEVAUCHEMENTS (ABSORPTION) ---
        const boEvents = allEvents.filter(e => e.isBackoffice);
        const techEvents = allEvents.filter(e => !e.isBackoffice);

        // Initialisation
        boEvents.forEach(bo => bo.netCapacity = bo.duration); 
        techEvents.forEach(te => {
            const users = parseInt(te.nbUsers, 10) || 1;
            let baseNeed = 1.0;
            if (users > 5) baseNeed += (users - 5) * (10/60);
            te.netNeed = Math.max(te.duration, baseNeed);
            te.isAbsorbed = false;
        });

        // Boucle de collision
        techEvents.forEach(te => {
            // On cherche un BO compatible
            const boMatch = boEvents.find(bo => 
                bo.tech === te.tech && 
                bo.date === te.date && 
                bo.timeRange && te.timeRange && // Il faut que les heures soient définies
                getOverlapHours(bo.timeRange, te.timeRange) > 0
            );

            if (boMatch) {
                // COLLISION TROUVÉE !
                const overlap = getOverlapHours(boMatch.timeRange, te.timeRange);
                
                // 1. On réduit la capacité du Backoffice
                boMatch.netCapacity = Math.max(0, boMatch.netCapacity - overlap);
                
                // 2. On annule le besoin de l'événement technique (car absorbé par le temps BO)
                te.netNeed = 0;
                te.isAbsorbed = true;
                te.absorbedBy = boMatch.typeRaw;
            }
        });

        // --- ÉTAPE 3 : GÉNÉRATION DES STATS ET LISTE FINALE ---
        
        // Helper stats
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

        // Ajout des BO traités
        boEvents.forEach(bo => {
            addToStats(bo.month, bo.tech, 0, 0, bo.netCapacity);
            finalEventsList.push({
                date: bo.date,
                tech: bo.tech,
                client: bo.dossier,
                type: bo.typeRaw,
                duration: bo.duration, 
                status: bo.netCapacity < bo.duration ? `Prod BO (Net: ${bo.netCapacity.toFixed(1)}h)` : 'Production (Backoffice)',
                color: 'purple',
                raw_besoin: 0,
                raw_capacite: bo.netCapacity,
                raw_besoin_encours: 0
            });
        });

        // Ajout des Tech Events traités
        techEvents.forEach(te => {
            addToStats(te.month, te.tech, te.netNeed, 0, 0); // Si absorbé, netNeed = 0
            finalEventsList.push({
                date: te.date,
                tech: te.tech,
                client: te.dossier,
                type: te.typeRaw,
                duration: te.duration,
                status: te.isAbsorbed ? 'Planifié (Inclus BO)' : 'Besoin (Analyse/Migr)',
                color: te.isAbsorbed ? 'slate' : 'cyan', // Gris si absorbé, Cyan sinon
                raw_besoin: te.netNeed,
                raw_capacite: 0,
                raw_besoin_encours: 0
            });
        });

        // --- ÉTAPE 4 : ENCOURS ---
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (Array.isArray(encoursData)) {
            encoursData.forEach(row => {
                const cleanRow = {};
                Object.keys(row).forEach(k => cleanRow[k.trim()] = row[k]);
                const techNameRaw = cleanRow['RESPONSABLE'];
                const categorie = cleanRow['CATEGORIE'];
                const reportDateStr = cleanRow['REPORTE_LE'];
                const clientName = cleanRow['INTERLOCUTEUR'] || 'Client Inconnu';
                const tech = normalizeTechName(techNameRaw, techList);
                
                if (!techList.includes(tech)) return;

                if (categorie === 'Prêt pour mise en place') {
                    countReadyMiseEnPlace++;
                    planningEventsList.push({
                        date: "N/A", tech, client: clientName, type: "Prêt pour Mise en Place",
                        duration: 0, status: "A Planifier (Migr)", color: "indigo"
                    });
                    return;
                }
                
                if (categorie === 'Prêt pour analyse' || categorie === 'A Planifier (Analyse)') {
                    countReadyAnalyse++;
                    planningEventsList.push({
                        date: "N/A", tech, client: clientName, type: "Prêt pour Analyse",
                        duration: 0, status: "A Planifier (Analyse)", color: "cyan"
                    });
                }

                const remainingLoad = getRemainingLoad(categorie);
                if (remainingLoad <= 0) return;

                const reportDate = parseDateSafe(reportDateStr);
                const targetDate = reportDate || new Date(); 
                const targetDateStr = targetDate.toISOString().split('T')[0];
                const targetMonth = targetDateStr.substring(0, 7);

                addToStats(targetMonth, tech, 0, remainingLoad, 0);

                if (reportDate) { 
                    finalEventsList.push({
                        date: targetDateStr,
                        tech,
                        client: clientName,
                        type: `Encours (${categorie || "Non classé"})`,
                        duration: remainingLoad,
                        status: "Reporté",
                        color: "red",
                        raw_besoin: 0,
                        raw_capacite: 0,
                        raw_besoin_encours: remainingLoad
                    });
                }
            });
        }

        const detailedDataArray = Array.from(monthlyStats.values()).sort((a, b) => a.month.localeCompare(b.month));
        const sortedMonths = Array.from(monthsSet).sort().reverse(); 

        return {
            detailedData: detailedDataArray,
            eventsData: [...planningEventsList, ...finalEventsList],
            planningCount: countReadyMiseEnPlace,
            analysisPipeCount: countReadyAnalyse,
            availableMonths: sortedMonths
        };
    } catch (e) {
        console.error("Erreur de calcul dans useMemo:", e);
        return { detailedData: [], eventsData: [], planningCount: 0, analysisPipeCount: 0, availableMonths: [] };
    }
  }, [backofficeData, encoursData, techList]);

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

        <KPICard title="Besoin Total (h)" value={kpiStats.besoin.toFixed(0)} subtext={selectedMonth ? "Sur le mois" : "Annuel"} icon={Users} colorClass="text-slate-600" active={!!selectedMonth}/>
        <KPICard title="Capacité (h)" value={kpiStats.capacite.toFixed(0)} subtext="Planifiée" icon={Clock} colorClass="text-purple-600" active={!!selectedMonth}/>
        <KPICard title="Taux Couverture" value={`${kpiStats.ratio.toFixed(0)}%`} subtext="Capa. / Besoin" icon={TrendingUp} colorClass={kpiStats.ratio >= 100 ? "text-emerald-600" : "text-red-600"} active={!!selectedMonth}/>
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
                <div className="flex items-center gap-1"><span className="w-2 h-2 bg-cyan-500 rounded-full"></span> Besoin</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded-full"></span> En Cours</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-500 rounded-full"></span> Capacité</div>
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
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
                contentStyle={{borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', padding: '8px'}} 
                labelFormatter={(val) => {
                    if (String(val).startsWith('S')) return val; 
                    return formatMonth(val);
                }}
                formatter={(value, name) => [`${parseFloat(value).toFixed(1)} h`, name === 'besoin' ? 'Besoin (Nouv.)' : name === 'besoin_encours' ? 'Besoin (En cours)' : name === 'capacite' ? 'Capacité' : name]} 
              />
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
                    <td className="px-2 py-1 text-center whitespace-nowrap"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${event.color === 'cyan' ? 'bg-cyan-100 text-cyan-700' : event.color === 'purple' ? 'bg-purple-100 text-purple-700' : event.color === 'indigo' ? 'bg-indigo-100 text-indigo-700' : event.color === 'amber' ? 'bg-amber-100 text-amber-700' : event.color === 'red' ? 'bg-red-100 text-red-700' : event.color === 'slate' ? 'bg-slate-200 text-slate-600' : 'bg-blue-100 text-blue-700'}`}>{event.status}</span></td>
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
                        <Bar dataKey="besoin" fill="#06b6d4" barSize={12} stackId="a" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="besoin_encours" fill="#f59e0b" barSize={12} stackId="a" radius={[0, 2, 2, 0]} />
                        <Bar dataKey="capacite" fill="#a855f7" barSize={12} radius={[0, 2, 2, 0]} stackId="b" />
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
                    <td className="px-4 py-2 text-right"><span className={`px-2 py-0.5 rounded text-xs font-medium ${row.soldeMensuel >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{row.soldeMensuel > 0 ? '+' : ''}{row.soldeMensuel.toFixed(1)} h</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- DEBUG CONSOLE (Rétractable) --- */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${isDebugOpen ? 'translate-y-0' : 'translate-y-[calc(100%-40px)]'}`}>
        <div className="bg-slate-900 border-t border-slate-700 shadow-2xl flex flex-col h-64">
            <button 
                onClick={() => setIsDebugOpen(!isDebugOpen)}
                className="w-full h-10 bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono flex items-center justify-between px-4 transition-colors cursor-pointer border-b border-slate-700"
            >
                <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-green-400" />
                    <span>CONSOLE DEBUG : SNOWFLAKE DATA</span>
                    {debugData && (
                        <span className={`px-2 py-0.5 rounded text-[10px] ${debugData.error ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
                            {debugData.error ? 'ERREUR API' : 'DONNÉES REÇUES'}
                        </span>
                    )}
                </div>
                {isDebugOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
            <div className="flex-1 overflow-auto p-4 font-mono text-xs text-green-400 bg-slate-950">
                {debugData ? (
                    <pre>{JSON.stringify(debugData, null, 2)}</pre>
                ) : (
                    <div className="flex items-center gap-2 text-slate-500">
                        <Activity size={14} className="animate-spin" /> Chargement des données...
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
