import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ComposedChart, ReferenceLine, RadialBarChart, RadialBar
} from 'recharts';
import { 
  Activity, Users, Clock, TrendingUp, AlertTriangle, CheckCircle, 
  Calendar, BarChart2, Filter, Info, X, Table as TableIcon, ChevronDown, ChevronUp, FileText, Briefcase, Loader,
  ArrowUpDown, ArrowUp, ArrowDown, CornerDownRight, Layout, Search, Layers, Server, FileSearch
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

    const deductionsMap = new Map();
    
    // --- 1. INDEXATION DES CRENEAUX BACKOFFICE ---
    const techBackofficeSchedule = {}; 

    backofficeData.forEach(row => {
        const cleanRow = {};
        Object.keys(row).forEach(k => cleanRow[k.trim()] = row[k]);
        
        const typeEvent = cleanRow['EVENEMENT'];
        const dateStr = cleanRow['DATE'];
        const timeStr = cleanRow['HEURE'];
        const resp = cleanRow['RESPONSABLE'];
        const duree = cleanRow['DUREE_HRS'];

        if (!dateStr || !resp) return;
        const tech = normalizeTechName(resp, techList);
        if (!techList.includes(tech)) return;

        const dateEvent = parseDateSafe(dateStr);
        if(!dateEvent) return;
        
        const dateKey = dateEvent.toISOString().split('T')[0];
        
        if (typeEvent === 'Tache de backoffice Avocatmail') {
            if (!techBackofficeSchedule[tech]) techBackofficeSchedule[tech] = [];
            techBackofficeSchedule[tech].push(dateEvent.getTime()); 
        }
        
        if (typeEvent !== 'Tache de backoffice Avocatmail' && timeStr) {
            const timeKey = timeStr.substring(0, 5); 
            const key = `${dateKey}_${timeKey}_${tech}`;
            const duration = calculateDuration(duree);
            const currentDeduction = deductionsMap.get(key) || 0;
            deductionsMap.set(key, currentDeduction + duration);
        }
    });

    Object.keys(techBackofficeSchedule).forEach(t => {
        techBackofficeSchedule[t].sort((a, b) => a - b);
    });

    let countReadyMiseEnPlace = 0;
    let countReadyAnalyse = 0; 

    const addToStats = (month, tech, besoin, besoin_encours, capacite, besoin_retard = 0) => {
        monthsSet.add(month);
        const key = `${month}_${tech}`;
        if (!monthlyStats.has(key)) {
            monthlyStats.set(key, { month, tech, besoin: 0, besoin_encours: 0, capacite: 0, besoin_retard: 0 });
        }
        const entry = monthlyStats.get(key);
        entry.besoin += besoin;
        entry.besoin_encours += besoin_encours;
        entry.capacite += capacite;
        entry.besoin_retard += besoin_retard;
    };

    // 2. BACKOFFICE (TRAITEMENT PRINCIPAL)
    backofficeData.forEach(row => {
      const cleanRow = {};
      Object.keys(row).forEach(k => cleanRow[k.trim()] = row[k]);

      const typeEvent = cleanRow['EVENEMENT'];
      const dateStr = cleanRow['DATE'];
      const timeStr = cleanRow['HEURE'];
      const resp = cleanRow['RESPONSABLE'];
      const duree = cleanRow['DUREE_HRS'];
      const dossier = cleanRow['DOSSIER'] || cleanRow['LIBELLE'] || 'Client Inconnu';
      const nbUsers = cleanRow['USER'] || cleanRow['NB_USERS'] || '1';

      if (!typeEvent || !['Avocatmail - Analyse', 'Migration messagerie Adwin', 'Tache de backoffice Avocatmail'].includes(typeEvent)) return;
      
      const tech = normalizeTechName(resp, techList);
      if (!techList.includes(tech)) return;

      const dateEvent = parseDateSafe(dateStr);
      if (!dateEvent) return;
      
      const dateFormatted = dateEvent.toISOString().split('T')[0];
      const month = dateFormatted.substring(0, 7);
      const duration = calculateDuration(duree);

      let besoin = 0; let capacite = 0; let color = 'gray'; let status = '';

      if (typeEvent === 'Tache de backoffice Avocatmail') {
        const timeKey = timeStr ? timeStr.substring(0, 5) : '';
        const key = `${dateFormatted}_${timeKey}_${tech}`;
        const deduction = deductionsMap.get(key) || 0;
        
        capacite = Math.max(0, duration - deduction);
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
        date: dateFormatted,
        tech,
        client: dossier,
        type: typeEvent,
        duration: Math.max(besoin, capacite), 
        status,
        color,
        raw_besoin: besoin,
        raw_capacite: capacite,
        raw_besoin_encours: 0,
        raw_besoin_retard: 0
      });
    });

    // 3. ENCOURS (LOGIQUE SIMPLIFIÉE : 1 Ticket = 1 Barre Unique)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    encoursData.forEach(row => {
        const cleanRow = {};
        Object.keys(row).forEach(k => cleanRow[k.trim()] = row[k]);
        const techNameRaw = cleanRow['RESPONSABLE'];
        const categorie = cleanRow['CATEGORIE'];
        const reportDateStr = cleanRow['REPORTE_LE'];
        const lastActionStr = cleanRow['DERNIERE_ACTION'];
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

        const reportDate = parseDateSafe(reportDateStr);
        const lastActionDate = parseDateSafe(lastActionStr); 

        // CAS 1 : REPORT FORCÉ
        if (reportDate) {
            const targetDateStr = reportDate.toISOString().split('T')[0];
            const targetMonth = targetDateStr.substring(0, 7);
            addToStats(targetMonth, tech, 0, 1.0, 0);
            events.push({
                date: targetDateStr, tech, client: clientName,
                type: "Analyse (Reportée)", duration: 1.0, status: "Reporté", color: "red",
                raw_besoin: 0, raw_capacite: 0, raw_besoin_encours: 1.0, raw_besoin_retard: 0
            });
        } 
        // CAS 2 : PLACEMENT AUTOMATIQUE (HISTORIQUE OU FUTUR)
        else {
            const techSlots = techBackofficeSchedule[tech] || [];
            
            // Point de départ : Dernière action (ou aujourd'hui si vide)
            const refTime = lastActionDate ? lastActionDate.getTime() : todayTime;

            // On cherche le PREMIER créneau disponible >= RefTime
            // (On ne boucle plus sur tous les créneaux, on prend juste le premier pertinent)
            const targetSlotTime = techSlots.find(t => t >= refTime);

            let targetDate = null;
            let isHistory = false;

            if (targetSlotTime) {
                targetDate = new Date(targetSlotTime);
            } else {
                // Si pas de créneau trouvé dans la liste (fin de calendrier ou tech sans slot)
                // On met une date par défaut (J+7)
                targetDate = new Date(refTime);
                targetDate.setDate(targetDate.getDate() + 7);
            }

            // Classification : Est-ce du passé (Retard) ou du futur (En cours) ?
            if (targetDate.getTime() < todayTime) {
                isHistory = true; // C'est du passé -> Historique
            }

            const dStr = targetDate.toISOString().split('T')[0];
            const mStr = dStr.substring(0, 7);

            if (isHistory) {
                // HISTORIQUE (Gris)
                addToStats(mStr, tech, 0, 0, 0, 1.0); 
                events.push({
                    date: dStr, tech, client: clientName,
                    type: "Non traité (Historique)", duration: 1.0, status: "Non traité", color: "slate",
                    raw_besoin: 0, raw_capacite: 0, raw_besoin_encours: 0, raw_besoin_retard: 1.0
                });
            } else {
                // FUTUR / AUJOURD'HUI (Orange)
                addToStats(mStr, tech, 0, 1.0, 0, 0); 
                events.push({
                    date: dStr, tech, client: clientName,
                    type: "Analyse (En cours)", duration: 1.0, status: "Auto (Prochain BO)", color: "amber",
                    raw_besoin: 0, raw_capacite: 0, raw_besoin_encours: 1.0, raw_besoin_retard: 0
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
        analysisPipeCount: countReadyAnalyse,
        availableMonths: sortedMonths
    };
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
      if (!aggMap.has(item.month)) aggMap.set(item.month, { month: item.month, label: formatMonthShort(item.month), besoin: 0, besoin_encours: 0, besoin_retard: 0, capacite: 0 });
      const entry = aggMap.get(item.month);
      entry.besoin += item.besoin;
      entry.besoin_encours += item.besoin_encours;
      entry.besoin_retard += item.besoin_retard;
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
        const data = aggMap.get(mStr) || { month: mStr, label: formatMonthShort(mStr), besoin: 0, besoin_encours: 0, besoin_retard: 0, capacite: 0 };
        const totalBesoinMois = data.besoin + data.besoin_encours + data.besoin_retard;
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
                  besoin: 0, besoin_encours: 0, besoin_retard: 0, capacite: 0 
              });
          }
          const entry = weekMap.get(weekNum);
          entry.besoin += (evt.raw_besoin || 0);
          entry.besoin_encours += (evt.raw_besoin_encours || 0);
          entry.besoin_retard += (evt.raw_besoin_retard || 0);
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
      if (!aggMap.has(item.tech)) aggMap.set(item.tech, { name: item.tech, besoin: 0, besoin_encours: 0, besoin_retard: 0, capacite: 0 });
      const entry = aggMap.get(item.tech);
      entry.besoin += (item.raw_besoin || 0);
      entry.besoin_encours += (item.raw_besoin_encours || 0);
      entry.besoin_retard += (item.raw_besoin_retard || 0);
      entry.capacite += (item.raw_capacite || 0);
    });
    return Array.from(aggMap.values());
  }, [eventsData, selectedMonth]);

  const kpiStats = useMemo(() => {
    if (mainChartData.length === 0) return { besoin: 0, capacite: 0, ratio: 0 };
    const totalBesoin = mainChartData.reduce((acc, curr) => acc + (curr.totalBesoinMois || (curr.besoin + curr.besoin_encours + curr.besoin_retard)), 0);
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
                <div className="flex items-center gap-1"><span className="w-2 h-2 bg-slate-400 rounded-full"></span> Historique</div>
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
                formatter={(value, name) => [`${parseFloat(value).toFixed(1)} h`, name === 'besoin' ? 'Besoin (Nouv.)' : name === 'besoin_encours' ? 'Besoin (En cours)' : name === 'besoin_retard' ? 'Historique (Non traité)' : name === 'capacite' ? 'Capacité' : name]} 
              />
              
              <Bar stackId="a" dataKey="besoin_retard" fill="#94a3b8" radius={[0, 0, 0, 0]} barSize={selectedMonth ? 30 : 16} />
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
                        
                        <Bar dataKey="besoin_retard" fill="#94a3b8" barSize={12} stackId="a" radius={[0, 0, 0, 0]} />
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
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden mb-8">
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
                    <th className="px-4 py-3 font-semibold text-right text-slate-500">Dont Histo</th>
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
                    <td className="px-4 py-2 text-right text-slate-400">{row.besoin_retard > 0 ? `${row.besoin_retard.toFixed(1)} h` : '-'}</td>
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
