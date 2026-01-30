import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ComposedChart, ReferenceLine, RadialBarChart, RadialBar
} from 'recharts';
import { 
  Activity, Users, Clock, TrendingUp, AlertTriangle, CheckCircle, 
  Calendar, BarChart2, Filter, Info, X, Table as TableIcon, ChevronDown, ChevronUp, FileText, Briefcase, Loader,
  ArrowUpDown, ArrowUp, ArrowDown, CornerDownRight, Layout, Search, Layers, Server, FileSearch, Terminal,
  Calculator, Database, BookOpen, Settings, Save, RotateCcw
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

// Configuration initiale (Valeurs par défaut)
const DEFAULT_WEIGHTS = {
    pret_mise_en_place: 1.0,
    a_planifier: 1.0,
    copie_en_cours: 0.15,
    preparation_tenant: 0.75,
    attente_bloque: 0.05,
    suspendu: 0.0,
    defaut_autre: 0.50,
    prepa_avocatmail_motif: 0.50 // Exception motif
};

const COLORS = {
    besoin: "#60a5fa", encours: "#fb923c", capacite: "#34d399",
    ok: "#34d399", danger: "#f87171",
    bg_besoin: "bg-blue-400", bg_encours: "bg-orange-400", bg_capacite: "bg-emerald-400",
    text_besoin: "text-blue-600", text_encours: "text-orange-600", text_capacite: "text-emerald-600",
    text_ok: "text-emerald-600", text_danger: "text-red-600", text_neutral: "text-slate-600"
};

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
const ADMIN_EMAIL = "david.zell@septeo.com"; 

// --- UTILITAIRES SECURISÉS ---

const safeString = (val) => val ? String(val).trim() : "";
const safeUpper = (val) => safeString(val).toUpperCase();

const normalizeTechName = (name, techList) => {
  const cleanName = safeString(name);
  const upperName = cleanName.toUpperCase();
  for (const tech of techList) {
    if (tech.toUpperCase() === upperName) return tech;
    const lastName = tech.split(' ').pop().toUpperCase();
    if (upperName.includes(lastName)) return tech;
  }
  return cleanName || "Inconnu";
};

const toLocalDateString = (date) => {
    if (!date) return "N/A";
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
};

const formatMonth = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if(parts.length < 2) return dateStr;
  const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
};

const formatMonthShort = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if(parts.length < 2) return dateStr;
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
    return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
};

const getWeekLabel = (dateStr) => {
    const date = new Date(dateStr);
    if(isNaN(date.getTime())) return "S?";
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `S${weekNum}`;
};

const getWeekRange = (dateStr) => {
    const date = new Date(dateStr);
    if(isNaN(date.getTime())) return "";
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
    let cleanStr = String(dateStr);
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

const getEventTimeRange = (dateObj, timeStr, durationHrs) => {
    if (!dateObj) return null;
    const sTime = safeString(timeStr);
    if (!sTime.includes(':')) return null;
    const [h, m] = sTime.split(':').map(Number);
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

// --- LOGIQUE PONDÉRATION DYNAMIQUE ---
const getRemainingLoad = (categorie, motif, weights) => {
    const cleanCat = safeString(categorie).toLowerCase();
    const cleanMotif = safeString(motif);

    // 1. Cas SANS CATÉGORIE
    if (cleanCat === "") {
        if (cleanMotif.startsWith("[IAD] - Préparation Avocatmail")) {
            return weights.prepa_avocatmail_motif; 
        }
        return 0; 
    }

    // 2. Cas AVEC CATÉGORIE
    if (cleanCat.includes('prêt pour mise en place')) return weights.pret_mise_en_place;
    if (cleanCat.includes('a planifier')) return weights.a_planifier;
    if (cleanCat.includes('copie en cours')) return weights.copie_en_cours;
    if (cleanCat.includes('préparation tenant')) return weights.preparation_tenant;
    if (cleanCat.includes('attente') || cleanCat.includes('bloqué')) return weights.attente_bloque;
    if (cleanCat.includes('suspendu')) return weights.suspendu;
    
    return weights.defaut_autre;
};

// --- COMPOSANTS UI ---

const RulesModal = ({ isOpen, onClose, userEmail, currentWeights, onUpdateWeights }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempWeights, setTempWeights] = useState(currentWeights);
    const isAdmin = userEmail === ADMIN_EMAIL;

    useEffect(() => {
        setTempWeights(currentWeights);
    }, [currentWeights, isOpen]);

    const handleSave = async () => {
        try {
            // Appel à l'API pour sauvegarder en BDD via Clerk Metadata
            const token = await window.Clerk.session.getToken();
            
            const response = await fetch('/api/saveConfig', { 
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(tempWeights) 
            });
    
            if (response.ok) {
                onUpdateWeights(tempWeights); // Mise à jour locale immédiate
                setIsEditing(false);
                alert("✅ Configuration sauvegardée dans le Cloud ! Tous les utilisateurs verront ces changements.");
            } else {
                const errorData = await response.json();
                alert(`Erreur : ${errorData.error || "Problème de droits"}`);
            }
        } catch (e) {
            console.error(e);
            alert("Erreur de connexion au serveur.");
        }
    };

    const handleChange = (key, value) => {
        setTempWeights(prev => ({ ...prev, [key]: parseFloat(value) }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        {isEditing ? <Settings className="w-5 h-5 text-purple-600" /> : <Info className="w-5 h-5 text-blue-600" />}
                        {isEditing ? "Configuration Admin" : "Règles de Calcul"}
                    </h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                
                {/* Content */}
                <div className="p-6 text-xs space-y-6 overflow-y-auto">
                    
                    {/* SECTION BLEUE */}
                    <div className="space-y-2">
                        <h4 className={`font-bold uppercase tracking-wider ${COLORS.text_besoin} flex items-center gap-2 border-b border-blue-100 pb-1`}>1. Besoin Planifié</h4>
                        <ul className="list-disc pl-4 space-y-1 text-slate-600">
                            <li>Source : Calendrier (Snowflake).</li>
                            <li>Calcul : Durée réelle, sinon <code className="bg-slate-100 px-1 rounded">1h + (Nb Users - 5) × 10min</code>.</li>
                        </ul>
                    </div>

                    {/* SECTION ORANGE (EDITABLE) */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center border-b border-orange-100 pb-1">
                            <h4 className={`font-bold uppercase tracking-wider ${COLORS.text_encours} flex items-center gap-2`}>
                                2. Tickets "En Cours"
                            </h4>
                            {isAdmin && !isEditing && (
                                <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded hover:bg-purple-200 transition-colors">
                                    <Settings size={12} /> Configurer
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="grid grid-cols-1 gap-2 bg-slate-50 p-3 rounded border border-slate-200">
                                <p className="text-slate-500 italic mb-2">Modifiez les temps (en heures) :</p>
                                {[
                                    { label: "Prêt / A planifier", key: "pret_mise_en_place" },
                                    { label: "Préparation Tenant", key: "preparation_tenant" },
                                    { label: "Copie en cours", key: "copie_en_cours" },
                                    { label: "Défaut / Autre", key: "defaut_autre" },
                                    { label: "Attente / Bloqué", key: "attente_bloque" },
                                    { label: "Suspendu", key: "suspendu" },
                                    { label: "Motif: Prépa Avocatmail", key: "prepa_avocatmail_motif" },
                                ].map((item) => (
                                    <div key={item.key} className="flex justify-between items-center">
                                        <span className="font-semibold text-slate-700">{item.label}</span>
                                        <input 
                                            type="number" 
                                            step="0.05" 
                                            value={tempWeights[item.key]} 
                                            onChange={(e) => handleChange(item.key, e.target.value)}
                                            className="w-20 text-right text-xs p-1 border rounded focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <ul className="list-disc pl-4 space-y-1 text-slate-600">
                                <li>Déduplication : Si client déjà planifié (Bleu) -> Ignoré (0h). <span className="text-red-500 font-bold">SAUF SI date de report fixée.</span></li>
                                <li>Sans Catégorie : Ignoré, sauf motif <i>"[IAD] - Préparation Avocatmail"</i> ({currentWeights.prepa_avocatmail_motif}h).</li>
                                <li className="mt-2">
                                    <span className="font-semibold text-slate-800 border-b border-slate-200 pb-0.5">Pondération actuelle :</span>
                                    <ul className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 ml-2">
                                        <li>• Prêt / Planif : <b>{currentWeights.pret_mise_en_place} h</b></li>
                                        <li>• Prép. Tenant : <b>{currentWeights.preparation_tenant} h</b></li>
                                        <li>• Copie en cours : <b>{currentWeights.copie_en_cours} h</b></li>
                                        <li>• Standard : <b>{currentWeights.defaut_autre} h</b></li>
                                        <li>• Attente : <b>{currentWeights.attente_bloque} h</b></li>
                                        <li>• Suspendu : <b>{currentWeights.suspendu} h</b></li>
                                    </ul>
                                </li>
                            </ul>
                        )}
                    </div>

                    {/* SECTION VERTE */}
                    <div className="space-y-2">
                        <h4 className={`font-bold uppercase tracking-wider ${COLORS.text_capacite} flex items-center gap-2 border-b border-emerald-100 pb-1`}>3. Capacité</h4>
                        <ul className="list-disc pl-4 space-y-1 text-slate-600">
                            <li>Source : Événements "Backoffice".</li>
                            <li>Calcul : Durée nette (moins les RDV clients).</li>
                        </ul>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                    {isEditing ? (
                        <>
                            <button onClick={() => { setIsEditing(false); setTempWeights(currentWeights); }} className="px-3 py-2 text-slate-600 hover:bg-slate-200 rounded transition-colors flex items-center gap-1">
                                <RotateCcw size={14} /> Annuler
                            </button>
                            <button onClick={handleSave} className="px-4 py-2 bg-purple-600 text-white rounded-md text-xs font-bold hover:bg-purple-700 transition-colors flex items-center gap-1">
                                <Save size={14} /> Enregistrer
                            </button>
                        </>
                    ) : (
                        <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 rounded-md text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors">
                            Fermer
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const dispo = (data.capacite || 0) - ((data.besoin || 0) + (data.besoin_encours || 0));
    const isPositive = dispo >= 0;
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg text-xs min-w-[180px]">
        <p className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">{String(label).startsWith('S') ? label : formatMonth(data.month)}</p>
        <div className="space-y-1">
            <div className={`flex justify-between items-center ${COLORS.text_besoin}`}><span>Besoin (Nouv) :</span><span className="font-bold">{data.besoin?.toFixed(1)} h</span></div>
            <div className={`flex justify-between items-center ${COLORS.text_encours}`}><span>Besoin (En cours) :</span><span className="font-bold">{data.besoin_encours?.toFixed(1)} h</span></div>
            <div className={`flex justify-between items-center ${COLORS.text_capacite}`}><span>Capacité Planifiée :</span><span className="font-bold">{data.capacite?.toFixed(1)} h</span></div>
        </div>
        <div className={`mt-3 pt-2 border-t border-slate-100 flex justify-between items-center font-bold text-sm ${isPositive ? COLORS.text_ok : COLORS.text_danger}`}>
            <span>DISPONIBLE :</span><span>{isPositive ? '+' : ''}{dispo.toFixed(1)} h</span>
        </div>
      </div>
    );
  }
  return null;
};

const KPICard = ({ title, value, subtext, icon: Icon, colorClass, active, onClick }) => (
  <div onClick={onClick} className={`px-4 py-3 rounded-lg shadow-sm border transition-all duration-300 flex items-center justify-between ${active ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100' : 'bg-white border-slate-100'} ${onClick ? 'cursor-pointer hover:bg-slate-50' : ''}`}>
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-xl font-bold text-slate-800">{value}</h3>
        {subtext && <p className={`text-xs font-medium ${colorClass}`}>{subtext}</p>}
      </div>
    </div>
    <div className={`p-2 rounded-md ${colorClass.replace('text-', 'bg-').replace('600', '50')}`}><Icon className={`w-5 h-5 ${colorClass}`} /></div>
  </div>
);

const SortableHeader = ({ label, sortKey, currentSort, onSort, align = 'left' }) => {
  const isSorted = currentSort.key === sortKey;
  return (
    <th className={`px-2 py-2 font-semibold whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors group select-none text-${align}`} onClick={() => onSort(sortKey)}>
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        {label}
        <span className="text-slate-400">{isSorted ? (currentSort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : (<ArrowUpDown size={12} className="opacity-0 group-hover:opacity-50" />)}</span>
      </div>
    </th>
  );
};

const PipeProgress = ({ label, count, colorClass, barColor }) => {
    const percentage = Math.min((count / 15) * 100, 100);
    return (
        <div className="flex flex-col w-full">
            <div className="flex justify-between items-end mb-1"><span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">{label}</span><span className={`text-sm font-bold ${colorClass}`}>{count}</span></div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`} style={{ width: `${percentage}%` }} /></div>
        </div>
    );
};

// --- APPLICATION PRINCIPALE ---

function MigrationDashboard() {
  const { user } = useUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;

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
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [debugData, setDebugData] = useState(null);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [debugTab, setDebugTab] = useState('calc'); 
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  
  // STATE DE CONFIGURATION DES POIDS (Dynamique)
  const [weightsConfig, setWeightsConfig] = useState(DEFAULT_WEIGHTS);

  const { getToken } = useAuth(); 

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = await getToken();
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Récupération des Données Métiers
        const response = await fetch('/api/getData', { headers });
        const json = await response.json();
        setDebugData(json);

        // 2. Récupération de la Configuration (si l'API existe)
        try {
            const configRes = await fetch('/api/getConfig');
            if (configRes.ok) {
                const configJson = await configRes.json();
                if (Object.keys(configJson).length > 0) {
                    setWeightsConfig(prev => ({ ...prev, ...configJson }));
                }
            }
        } catch (e) {
            console.warn("Impossible de charger la config dynamique, usage des valeurs par défaut.");
        }

        if (!response.ok) throw new Error(json.error || `Erreur API`);
        if (json.backoffice) setBackofficeData(json.backoffice || []); 
        if (json.encours) setEncoursData(json.encours || []);
        setIsLoading(false);
      } catch (err) {
        console.error("❌ Erreur API :", err);
        setDebugData({ error: err.message });
        setIsLoading(false);
      }
    };
    fetchData();
  }, [getToken]);
  
  const { detailedData, eventsData, planningCount, analysisPipeCount, availableMonths } = useMemo(() => {
    // Initialisation
    const monthlyStats = new Map();
    const monthsSet = new Set(); 
    const techBackofficeSchedule = {}; 
    const scheduledClients = new Set(); 
    const allowedNeedEvents = ['Avocatmail - Analyse', 'Migration messagerie Adwin', 'Migration messagerie Adwin - analyse'];
    let allEvents = [];

    // 1. TRAITEMENT BACKOFFICE
    if(Array.isArray(backofficeData)) {
      backofficeData.forEach(row => {
          const cleanRow = {};
          Object.keys(row || {}).forEach(k => cleanRow[k.trim()] = row[k]);
          
          const typeEventRaw = safeString(cleanRow['EVENEMENT']);
          const typeEventLower = typeEventRaw.toLowerCase();
          
          const isBackoffice = typeEventLower.includes('tache de backoffice avocatmail');
          const isNeed = allowedNeedEvents.includes(typeEventRaw) || 
                        (typeEventLower.includes("avocatmail") && typeEventLower.includes("analyse"));

          if (!isBackoffice && !isNeed) return;

          const tech = normalizeTechName(cleanRow['RESPONSABLE'], techList);
          if (!techList.includes(tech)) return;

          const dateEvent = parseDateSafe(cleanRow['DATE']);
          if(!dateEvent) return;
          
          const dateFormatted = toLocalDateString(dateEvent);
          const month = dateFormatted.substring(0, 7);
          const duration = calculateDuration(cleanRow['DUREE_HRS']);
          const timeRange = getEventTimeRange(dateEvent, cleanRow['HEURE'], duration);
          
          const dossier = safeString(cleanRow['DOSSIER'] || cleanRow['LIBELLE'] || 'Client Inconnu');
          const nbUsers = cleanRow['NB_USERS'] || cleanRow['USER'] || '1';

          if (isBackoffice) {
              if (!techBackofficeSchedule[tech]) techBackofficeSchedule[tech] = [];
              techBackofficeSchedule[tech].push(dateEvent.getTime());
          }

          if (dossier !== 'Client Inconnu' && !isBackoffice) {
              scheduledClients.add(safeUpper(dossier));
          }

          allEvents.push({
              id: Math.random(), date: dateFormatted, month, tech, typeRaw: typeEventRaw, duration,
              isBackoffice, isNeed, timeRange, dossier, nbUsers,
              netCapacity: isBackoffice ? duration : 0, netNeed: 0, isAbsorbed: false,
              status: '', color: ''
          });
      });
    }

    Object.keys(techBackofficeSchedule).forEach(t => {
        techBackofficeSchedule[t].sort((a, b) => a - b);
    });

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
            bo.tech === te.tech && bo.date === te.date && bo.timeRange && te.timeRange && 
            getOverlapHours(bo.timeRange, te.timeRange) > 0
        );
        if (boMatch) {
            const overlap = getOverlapHours(boMatch.timeRange, te.timeRange);
            boMatch.netCapacity = Math.max(0, boMatch.netCapacity - overlap);
            te.netNeed = 0;
            te.isAbsorbed = true;
        }
    });

    const addToStats = (month, tech, besoin, besoin_encours, capacite) => {
        monthsSet.add(month);
        const key = `${month}_${tech}`;
        if (!monthlyStats.has(key)) monthlyStats.set(key, { month, tech, besoin: 0, besoin_encours: 0, capacite: 0 });
        const entry = monthlyStats.get(key);
        entry.besoin += besoin;
        entry.besoin_encours += besoin_encours;
        entry.capacite += capacite;
    };

    const finalEventsList = [];

    [...boEvents, ...techEvents].forEach(ev => {
        if (ev.isBackoffice) {
            ev.color = 'capacity'; 
            ev.status = ev.netCapacity < ev.duration ? `Prod BO (Net: ${ev.netCapacity.toFixed(1)}h)` : 'Production (Backoffice)';
            addToStats(ev.month, ev.tech, 0, 0, ev.netCapacity);
        } else {
            if (ev.isAbsorbed) { ev.color = 'absorbed'; ev.status = 'Planifié pendant BO'; } 
            else { ev.color = 'need'; ev.status = 'Besoin (Analyse/Migr)'; addToStats(ev.month, ev.tech, ev.netNeed, 0, 0); }
        }
        finalEventsList.push({
            date: ev.date, tech: ev.tech, client: ev.dossier, type: ev.typeRaw, duration: ev.duration,
            status: ev.status, color: ev.color, raw_besoin: ev.netNeed, raw_capacite: ev.netCapacity, raw_besoin_encours: 0
        });
    });

    // 2. TRAITEMENT ENCOURS
    let countReadyMiseEnPlace = 0;
    let countReadyAnalyse = 0; 
    const planningEventsList = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    if(Array.isArray(encoursData)) {
      encoursData.forEach(row => {
          const cleanRow = {};
          Object.keys(row || {}).forEach(k => cleanRow[k.trim()] = row[k]);
          
          const tech = normalizeTechName(cleanRow['RESPONSABLE'], techList);
          if (!techList.includes(tech)) return;

          const categorie = safeString(cleanRow['CATEGORIE']);
          const motif = safeString(cleanRow['MOTIF']);
          const clientName = safeString(cleanRow['INTERLOCUTEUR'] || 'Client Inconnu');
          const reportDateStr = cleanRow['REPORTE_LE'];
          
          const reportDate = parseDateSafe(reportDateStr);

          // RÈGLE : Report > Déduplication
          if (!reportDate && scheduledClients.has(safeUpper(clientName))) {
              return; 
          }

          if (categorie === 'Prêt pour mise en place') {
              countReadyMiseEnPlace++;
              planningEventsList.push({ date: "N/A", tech, client: clientName, type: "Prêt pour Mise en Place", duration: 0, status: "A Planifier (Migr)", color: "ready_migr" });
              return;
          }
          if (categorie === 'Prêt pour analyse' || categorie === 'A Planifier (Analyse)') {
              countReadyAnalyse++;
              planningEventsList.push({ date: "N/A", tech, client: clientName, type: "Prêt pour Analyse", duration: 0, status: "A Planifier (Analyse)", color: "ready_analyse" });
          }

          // APPEL AVEC CONFIGURATION DYNAMIQUE
          const remainingLoad = getRemainingLoad(categorie, motif, weightsConfig);
          
          if (remainingLoad <= 0) return; 

          let targetDate = null;
          let status = "";
          let color = "";

          if (reportDate) {
              targetDate = reportDate;
              status = "Reporté";
              color = "reporte";
          } else {
              const techSlots = techBackofficeSchedule[tech] || [];
              const targetSlotTime = techSlots.find(t => t >= todayTime);
              if (targetSlotTime) {
                  targetDate = new Date(targetSlotTime);
                  status = "Auto (Prochain BO)";
                  color = "encours";
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

              let displayType = `Encours (${categorie || "Non classé"})`;
              if (categorie === "" && remainingLoad === weightsConfig.prepa_avocatmail_motif) displayType = "Prépa. Avocatmail (Auto)";

              finalEventsList.push({
                  date: targetDateStr, tech, client: clientName, type: displayType, duration: remainingLoad,
                  status: status, color: color, raw_besoin: 0, raw_capacite: 0, raw_besoin_encours: remainingLoad
              });
          }
      });
    }

    const detailedDataArray = Array.from(monthlyStats.values()).sort((a, b) => a.month.localeCompare(b.month));
    const sortedMonths = Array.from(monthsSet).sort().reverse(); 

    return { detailedData: detailedDataArray, eventsData: [...planningEventsList, ...finalEventsList], planningCount: countReadyMiseEnPlace, analysisPipeCount: countReadyAnalyse, availableMonths: sortedMonths };
  }, [backofficeData, encoursData, techList, weightsConfig]); 

  // --- RENDU CHART & TABLEAUX ---
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
        if (sortConfig.key === 'date') { if (valA === 'N/A') valA = '0000-00-00'; if (valB === 'N/A') valB = '0000-00-00'; }
        valA = safeString(valA).toLowerCase();
        valB = safeString(valB).toLowerCase();
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
        result.push({ ...data, totalBesoinMois, soldeMensuel: data.capacite - totalBesoinMois });
        currentM++;
        if (currentM > 12) { currentM = 1; currentY++; }
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
              weekMap.set(weekNum, { month: weekNum, label: label, weekSort: parseInt(weekNum.replace('S', '')), besoin: 0, besoin_encours: 0, capacite: 0 });
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
         if(clickedData && clickedData.month) { setSelectedMonth(clickedData.month); setShowPlanning(false); }
    }
  };

  const toggleViewMode = (mode) => {
      setShowPlanning(false);
      if (mode === 'months') { setSelectedMonth(null); } 
      else { if (!selectedMonth) { const current = getCurrentMonthKey(); setSelectedMonth(availableMonths.includes(current) ? current : availableMonths[0]); } }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4 lg:p-6 animate-in fade-in duration-500 relative">
      <header className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-md">{isLoading ? <Loader className="w-5 h-5 text-blue-600 animate-spin" /> : <Activity className="w-5 h-5 text-blue-600" />}</div>
          <div><h1 className="text-lg font-bold text-slate-800 leading-tight">Pilotage Migrations</h1><p className="text-xs text-slate-500 flex items-center gap-2">{selectedTech === 'Tous' ? "Vue Équipe" : `Focus: ${selectedTech}`}</p></div>
        </div>
        <div className="flex gap-2 items-center">
            <button onClick={() => setIsRulesModalOpen(true)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Règles de calcul"><Info size={20} /></button>
            <UserButton />
            <div className="relative">
                <Filter className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                <select value={selectedTech} onChange={(e) => { setSelectedTech(e.target.value); }} className="pl-7 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 text-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
                    <option value="Tous">Tous les techs</option>
                    {techList.map(tech => (<option key={tech} value={tech}>{tech}</option>))}
                </select>
            </div>
            {(selectedMonth || showPlanning) && (<button onClick={() => { setSelectedMonth(null); setShowPlanning(false); }} className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-red-100 transition-colors border border-red-100"><X className="w-3 h-3" /> Retour Vue Globale</button>)}
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div onClick={() => { setShowPlanning(!showPlanning); setSelectedMonth(null); }} className={`px-4 py-3 rounded-lg shadow-sm border flex flex-col justify-center cursor-pointer transition-all duration-200 gap-3 ${showPlanning ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
            <PipeProgress label="Prêt pour Mise en Place" count={planningCount} colorClass="text-indigo-600" barColor="bg-indigo-500" />
            <PipeProgress label="Prêt pour Analyse" count={analysisPipeCount} colorClass="text-cyan-600" barColor="bg-cyan-500" />
        </div>
        <KPICard title="Besoin Total (h)" value={kpiStats.besoin.toFixed(0)} subtext={selectedMonth ? "Sur le mois" : "Annuel"} icon={Users} colorClass={COLORS.text_besoin} active={!!selectedMonth}/>
        <KPICard title="Capacité (h)" value={kpiStats.capacite.toFixed(0)} subtext="Planifiée" icon={Clock} colorClass={COLORS.text_capacite} active={!!selectedMonth}/>
        <KPICard title="Taux Couverture" value={`${kpiStats.ratio.toFixed(0)}%`} subtext="Capa. / Besoin" icon={TrendingUp} colorClass={kpiStats.ratio >= 100 ? COLORS.text_ok : COLORS.text_danger} active={!!selectedMonth}/>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 mb-4">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                <button onClick={() => toggleViewMode('months')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${!selectedMonth ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Vue Annuelle (Mois)</button>
                <button onClick={() => toggleViewMode('weeks')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${selectedMonth ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Vue Détaillée (Semaines)</button>
            </div>
            {selectedMonth && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                    <span className="text-xs text-slate-500 font-medium">Mois :</span>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="text-sm border border-slate-200 rounded-md py-1 px-2 focus:ring-blue-500 bg-white">{availableMonths.map(m => (<option key={m} value={m}>{formatMonth(m)}</option>))}</select>
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
              <XAxis dataKey={selectedMonth ? "label" : "month"} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={5} tickFormatter={(val) => { if (String(val).startsWith('S')) return val; return formatMonthShort(val); }} interval={0} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
              <Bar stackId="a" dataKey="besoin" fill={COLORS.besoin} radius={[0, 0, 0, 0]} barSize={selectedMonth ? 30 : 16} />
              <Bar stackId="a" dataKey="besoin_encours" fill={COLORS.encours} radius={[3, 3, 0, 0]} barSize={selectedMonth ? 30 : 16} />
              <Bar stackId="b" dataKey="capacite" fill={COLORS.capacite} radius={[3, 3, 0, 0]} barSize={selectedMonth ? 30 : 16} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {!selectedMonth && <p className="text-[10px] text-center text-slate-400 italic mt-1">Cliquez sur un mois pour voir le détail par semaine</p>}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden mb-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button onClick={() => setIsDetailListExpanded(!isDetailListExpanded)} className="w-full px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors">
          <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /><h2 className="text-sm font-bold text-slate-800">Détail des Opérations {selectedTech !== 'Tous' ? `: ${selectedTech}` : "(Tous)"}</h2><span className="ml-2 text-xs font-normal text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">{filteredAndSortedEvents.length} entrées</span></div>
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
                    <td className="px-2 py-1 text-center whitespace-nowrap"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeColor(event.color)}`}>{event.status}</span></td>
                  </tr>
                ))}
                {filteredAndSortedEvents.length === 0 && (<tr><td colSpan="6" className="px-4 py-8 text-center text-slate-400 italic">Aucun événement trouvé.</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
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

      <RulesModal 
        isOpen={isRulesModalOpen} 
        onClose={() => setIsRulesModalOpen(false)} 
        userEmail={userEmail} 
        currentWeights={weightsConfig}
        onUpdateWeights={setWeightsConfig}
      />

      <div className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${isDebugOpen ? 'translate-y-0' : 'translate-y-[calc(100%-40px)]'}`}>
        <div className="bg-slate-900 border-t border-slate-700 shadow-2xl flex flex-col h-64">
            <div className="w-full h-10 bg-slate-800 flex items-center justify-between px-4 border-b border-slate-700">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 cursor-pointer text-white text-xs font-mono" onClick={() => setIsDebugOpen(!isDebugOpen)}><Terminal size={14} className="text-green-400" /><span>CONSOLE DEBUG</span></div>
                    <div className="flex bg-slate-950 rounded p-0.5">
                        <button onClick={() => setDebugTab('raw')} className={`px-3 py-1 text-[10px] rounded transition-colors ${debugTab === 'raw' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}>Données Brutes</button>
                        <button onClick={() => setDebugTab('calc')} className={`px-3 py-1 text-[10px] rounded transition-colors ${debugTab === 'calc' ? 'bg-blue-900 text-blue-100 font-bold' : 'text-slate-400 hover:text-slate-200'}`}>Audit : Besoin (Nouv)</button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {debugData && (<span className={`px-2 py-0.5 rounded text-[10px] ${debugData.error ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>{debugData.error ? 'ERREUR API' : 'DONNÉES REÇUES'}</span>)}
                    <button onClick={() => setIsDebugOpen(!isDebugOpen)} className="text-slate-400 hover:text-white">{isDebugOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}</button>
                </div>
            </div>
            <div className="flex-1 overflow-auto p-4 font-mono text-xs bg-slate-950">
                {debugTab === 'raw' ? (<div className="text-green-400">{debugData ? (<pre>{JSON.stringify(debugData, null, 2)}</pre>) : (<div className="flex items-center gap-2 text-slate-500"><Activity size={14} className="animate-spin" /> Chargement des données...</div>)}</div>) : (<div className="text-blue-200">{auditData ? (Object.keys(auditData).length > 0 ? (Object.entries(auditData).map(([week, events]) => (<div key={week} className="mb-4 border-b border-slate-800 pb-2"><h3 className="font-bold text-yellow-400 mb-1">Semaine {week} <span className="text-slate-500 font-normal">({events.length} événements)</span></h3><table className="w-full text-left text-[10px]"><thead><tr className="text-slate-500 border-b border-slate-800"><th className="pb-1">Date</th><th className="pb-1">Client</th><th className="pb-1">Technicien</th><th className="pb-1 text-right">Valeur (h)</th></tr></thead><tbody>{events.map((ev, i) => (<tr key={i} className="hover:bg-slate-900"><td className="py-0.5 text-slate-300">{ev.date}</td><td className="py-0.5 text-blue-300 truncate max-w-[200px]">{ev.client}</td><td className="py-0.5 text-slate-400">{ev.tech}</td><td className="py-0.5 text-right font-bold text-white">{ev.raw_besoin.toFixed(2)}</td></tr>))}<tr className="bg-slate-900 font-bold"><td colSpan="3" className="text-right py-1 text-slate-400">TOTAL SEMAINE :</td><td className="text-right py-1 text-green-400">{events.reduce((sum, e) => sum + e.raw_besoin, 0).toFixed(2)} h</td></tr></tbody></table></div>))) : (<div className="text-slate-500 italic p-4">Aucun événement "Besoin (Nouv)" trouvé pour ce mois.</div>)) : (<div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2"><Calculator size={24} /><p>Sélectionnez un mois sur le graphique pour voir le détail hebdomadaire.</p></div>)}</div>)}
            </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  if (!clerkPubKey) { return <div className="flex items-center justify-center h-screen text-red-600 font-bold">Erreur : Clé Clerk manquante.</div>; }
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <SignedIn><MigrationDashboard /></SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </ClerkProvider>
  );
}
