import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ComposedChart, ReferenceLine, ReferenceArea, RadialBarChart, RadialBar
} from 'recharts';
import { 
  Activity, Users, Clock, TrendingUp, AlertTriangle, CheckCircle, 
  Calendar, BarChart2, Filter, Info, X, Table as TableIcon, ChevronDown, ChevronUp, FileText, Briefcase, Loader,
  ArrowUpDown, ArrowUp, ArrowDown, CornerDownRight, Layout, Search, Layers, Server, FileSearch,
  Calculator, Database, BookOpen, Settings, Save, RotateCcw, Plus, Trash2, SlidersHorizontal, RefreshCw,
  CheckCircle2, AlertCircle, Phone, Copy, Send, PauseCircle, GraduationCap, CalendarClock, Wrench
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

const ADMIN_EMAIL = "david.zell@septeo.com"; 

// Configuration initiale (Valeurs par défaut robustes)
const DEFAULT_WEIGHTS = {
    pret_mise_en_place: 1.0,
    a_planifier: 1.0,
    copie_en_cours: 0.15,
    preparation_tenant: 0.75,
    attente_bloque: 0.05,
    suspendu: 0.0,
    defaut_autre: 0.50,
    prepa_avocatmail_motif: 0.50,
    // Scope de dates envoyé au backend pour limiter le volume de données
    // remontées de Snowflake. Modifiable dans l'en-tête par un admin, et
    // persisté avec le reste de la config (mêmes valeurs par défaut que
    // DEFAULT_DATE_START/END côté api/getData.js).
    date_range_start: '2025-10-01',
    date_range_end: '2026-03-01'
};

const DETAIL_TABLE_PAGE_SIZE = 25;

// --- CACHE LOCAL (sessionStorage) ---
// Évite de re-taper Snowflake à chaque fois qu'on navigue dans l'interface
// (changement de filtre, de tech, retour sur l'onglet, F5...). Portée à
// l'onglet du navigateur (vidé à sa fermeture) pour ne jamais servir de
// données obsolètes d'une session à l'autre au-delà de la durée de vie fixée.
const CACHE_PREFIX = 'pilotageMigrations:';
const DATA_CACHE_TTL_MS = 3 * 60 * 1000;   // 3 min : données métier (tickets/événements)
const CONFIG_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min : config (poids, scope, équipe)

const readCache = (key) => {
    try {
        if (typeof window === 'undefined') return null;
        const raw = window.sessionStorage.getItem(CACHE_PREFIX + key);
        if (!raw) return null;
        const { value, expiresAt } = JSON.parse(raw);
        if (Date.now() > expiresAt) { window.sessionStorage.removeItem(CACHE_PREFIX + key); return null; }
        return value;
    } catch (e) {
        return null; // stockage indisponible (navigation privée, quota...) : on continue sans cache
    }
};

const writeCache = (key, value, ttlMs) => {
    try {
        if (typeof window === 'undefined') return;
        window.sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ value, expiresAt: Date.now() + ttlMs }));
    } catch (e) {
        // quota dépassé ou stockage indisponible : on continue sans cache, rien de bloquant
    }
};

const COLORS = {
    besoin: "#60a5fa", encours: "#fb923c", capacite: "#34d399",
    ok: "#34d399", danger: "#f87171",
    bg_besoin: "bg-blue-400", bg_encours: "bg-orange-400", bg_capacite: "bg-emerald-400",
    text_besoin: "text-blue-600", text_encours: "text-orange-600", text_capacite: "text-emerald-600",
    text_ok: "text-emerald-600", text_danger: "text-red-600", text_neutral: "text-slate-600"
};

// --- THÈME "AURORA" (optionnel, activable) : palette et couleurs métier
// alignées sur celles déjà utilisées (COLORS) pour ne pas changer le sens
// des couleurs, seulement l'habillage visuel.
// --- THÈME "SECIB" (optionnel, activable) : reprend la palette déjà validée
// sur le CSM Dashboard (même famille d'outils internes, cohérence visuelle
// entre les deux). Couleurs métier (COLORS) inchangées, seul l'habillage change.
const AURORA_THEMES = {
    light: { page: '#F4F5F7', card: '#FFFFFF', border: '#E1E3E8', text: '#1F2129', sub: '#6B6F7B', accent: '#304287', accentBg: '#E8EBF7', track: '#EEF0F4', hover: '#F7F8FA', alea: '#B5722E', aleaBg: '#DEA07C33', handoff: '#8B2E6B', handoffBg: '#8B2E6B18' },
    dark: { page: '#1F2129', card: '#303441', border: '#3D414F', text: '#F0F1F4', sub: '#9497A3', accent: '#5A72C9', accentBg: '#2E3862', track: '#3D414F', hover: '#383C4A', alea: '#DEA07C', aleaBg: '#DEA07C22', handoff: '#E38BC0', handoffBg: '#E38BC022' }
};

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

// --- UTILITAIRES DE SECURITE ---

const safeString = (val) => (val !== null && val !== undefined) ? String(val).trim() : "";
const safeUpper = (val) => safeString(val).toUpperCase();

const normalizeTechName = (name, techList) => {
  const cleanName = safeString(name);
  if (!cleanName) return "Inconnu";
  const upperName = cleanName.toUpperCase();
  for (const tech of techList) {
    if (tech.toUpperCase() === upperName) return tech;
    const lastName = tech.split(' ').pop().toUpperCase();
    if (upperName.includes(lastName)) return tech;
  }
  return cleanName;
};

const toLocalDateString = (date) => {
    if (!date || isNaN(date.getTime())) return "N/A";
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

// Retourne le dimanche (fin de semaine) d'une date donnée, pour savoir si une
// semaine est déjà entièrement passée par rapport à aujourd'hui.
const getWeekEndDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    const day = date.getDay();
    const diffToMonday = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date);
    monday.setDate(diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return sunday;
};

// Retourne le lundi (début de semaine) d'une date donnée — utile pour
// dater l'axe par semaine et pour rattacher chaque semaine à son mois.
const getWeekStartDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    const day = date.getDay();
    const diffToMonday = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date);
    monday.setDate(diffToMonday);
    monday.setHours(0, 0, 0, 0);
    return monday;
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

// --- LOGIQUE PONDÉRATION (Utilise la config dynamique) ---
const getRemainingLoad = (categorie, motif, weights) => {
    const w = weights || DEFAULT_WEIGHTS; 
    const cleanCat = safeString(categorie).toLowerCase();
    const cleanMotif = safeString(motif);

    if (cleanCat === "") {
        if (cleanMotif.startsWith("[IAD] - Préparation Avocatmail")) {
            return w.prepa_avocatmail_motif; 
        }
        return 0; 
    }

    if (cleanCat.includes('prêt pour mise en place')) return w.pret_mise_en_place;
    if (cleanCat.includes('a planifier')) return w.a_planifier;
    if (cleanCat.includes('copie en cours')) return w.copie_en_cours;
    if (cleanCat.includes('préparation tenant')) return w.preparation_tenant;
    if (cleanCat.includes('attente') || cleanCat.includes('bloqué')) return w.attente_bloque;
    if (cleanCat.includes('suspendu')) return w.suspendu;
    
    return w.defaut_autre;
};

// --- "MES MIGRATIONS" (prototype) : mêmes libellés d'événement que le moteur
// de calcul principal, réutilisés ici pour repérer l'événement de kickoff
// (analyse) d'un dossier.
const ANALYSIS_EVENT_NAMES = ['Avocatmail - Analyse', 'Migration messagerie Adwin', 'Migration messagerie Adwin - analyse'];
const MIGRATION_STAGES = [
    { key: 'analyse', label: 'Analyse', icon: Phone, tooltip: "Analyse avocatmail : rendez-vous téléphonique de prise d'information (1h) avec le client. Un ticket est créé à cette occasion." },
    { key: 'tenant', label: 'Tenant', icon: Settings, tooltip: "Préparation du tenant : création du tenant, configuration du nom de domaine, licences, comptes, migration des données. Catégorie ticket : \"Préparation du tenant\"." },
    { key: 'copie', label: 'Copie', icon: Copy, tooltip: "Copie (optionnelle) : migration/copie des données si nécessaire. Catégorie ticket : \"Copie en cours\"." },
    { key: 'pret', label: 'Prêt', icon: Send, tooltip: "Prêt pour mise en place : demande d'intervention envoyée au service de planification. Catégorie ticket : \"Prêt pour mise en place\"." },
    { key: 'livraison', label: 'Livraison', icon: Users, tooltip: "Finalisation & mise en place : migration MX (optionnelle) et déploiement des nouveaux comptes chez le client, via des événements planifiés par le service." }
];

const ALEA_INFO = {
    'Attente client': { icon: Clock, tooltip: "Attente retour client : se positionne souvent entre la préparation du tenant et la copie en cours." },
    'Attente presta': { icon: Clock, tooltip: "Attente retour prestataire : se positionne souvent entre la préparation du tenant et la copie en cours." },
    'Bloquée': { icon: AlertTriangle, tooltip: "Bloquée cause client/presta : peut se positionner avant la préparation du tenant, avant la copie, ou juste après la copie." },
    'Suspendu': { icon: PauseCircle, tooltip: "Suspendu : blocage quasi définitif du projet, menant souvent à une annulation ou à la planification d'une nouvelle migration." }
};

// Icône du cas particulier affiché en pointillé après l'étape Livraison :
// formation ADAPPS vs intervention matériel sur site.
const getCasParticulierIcon = (kind) => kind === 'formation' ? GraduationCap : Wrench;

// Retire les accents pour un matching robuste sur les libellés d'événement
// (ex. "matériel" vs "materiel" selon la saisie du technicien).
const stripAccents = (s) => safeString(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Un dossier client peut avoir des événements sans rapport avec la migration
// de messagerie (devis logiciel, licence, autre intervention technique...).
// On ne considère "lié à la migration" qu'un événement dont le libellé
// référence explicitement Avocatmail ou une migration MX — un simple
// rapprochement par numéro de dossier laisserait passer du bruit.
const isMigrationRelatedEvent = (eventName) => {
    const n = stripAccents(eventName).toLowerCase();
    return n.includes('avocatmail') || n.includes('migration messagerie') || /\bmx\b/.test(n);
};

// Traduit la catégorie (et le motif) d'un ticket en position sur la frise.
// HYPOTHÈSE À VALIDER : les catégories "attente"/"bloqué"/"suspendu" ne
// précisent pas sur quelle étape principale elles se sont greffées — on les
// affiche donc comme un badge "aléa" séparé plutôt que de leur inventer une
// position precise sur la frise.
const getMigrationStage = (categorie, motif) => {
    const cleanCat = safeString(categorie).toLowerCase();
    if (cleanCat.includes('suspendu')) return { index: 2, alea: 'Suspendu' };
    if (cleanCat.includes('attente') && cleanCat.includes('client')) return { index: 2, alea: 'Attente client' };
    if (cleanCat.includes('attente') && cleanCat.includes('presta')) return { index: 2, alea: 'Attente presta' };
    if (cleanCat.includes('attente') || cleanCat.includes('bloqué')) return { index: 2, alea: 'Bloquée' };
    if (cleanCat.includes('prêt pour mise en place')) return { index: 4, alea: null };
    if (cleanCat.includes('copie en cours')) return { index: 3, alea: null };
    if (cleanCat.includes('préparation tenant')) return { index: 2, alea: null };
    if (cleanCat.includes('a planifier')) return { index: 1, alea: null };
    return { index: 2, alea: null };
};

// --- COMPOSANTS UI ---

// --- TOAST (remplace les alert() bloquants) ---
const Toast = ({ toast, onClose }) => {
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [toast, onClose]);

    if (!toast) return null;
    const isError = toast.type === 'error';
    return (
        <div className={`fixed bottom-4 right-4 z-[100] max-w-sm w-full sm:w-auto flex items-start gap-2 px-4 py-3 rounded-lg shadow-xl border animate-in fade-in slide-in-from-bottom-4 duration-200 ${isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
            {isError ? <AlertCircle size={16} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={16} className="shrink-0 mt-0.5" />}
            <p className="text-xs font-medium leading-snug">{toast.message}</p>
            <button onClick={onClose} className="ml-auto text-current opacity-60 hover:opacity-100"><X size={14} /></button>
        </div>
    );
};

// --- SKELETON (état de chargement) ---
const Skeleton = ({ className = "", style }) => (
    <div className={`animate-pulse bg-slate-200/70 rounded ${className}`} style={style} />
);

// --- PANNEAU : SCOPE DE DATES (admin) ---
const DateScopePanel = ({ dateScopeDraft, setDateScopeDraft, onApply, onClose, isSaving }) => (
    <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-150">
        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Scope de dates (Snowflake)</h4>
        <div className="space-y-2 mb-3">
            <label className="block text-xs text-slate-600">
                Début
                <input type="date" value={dateScopeDraft.start || ''} onChange={(e) => setDateScopeDraft(d => ({ ...d, start: e.target.value }))} className="mt-1 w-full text-sm border border-slate-200 rounded-md py-1.5 px-2 focus:ring-1 focus:ring-blue-500 outline-none" />
            </label>
            <label className="block text-xs text-slate-600">
                Fin
                <input type="date" value={dateScopeDraft.end || ''} onChange={(e) => setDateScopeDraft(d => ({ ...d, end: e.target.value }))} className="mt-1 w-full text-sm border border-slate-200 rounded-md py-1.5 px-2 focus:ring-1 focus:ring-blue-500 outline-none" />
            </label>
        </div>
        <p className="text-[10px] text-slate-400 mb-3">Réduit ou élargit le volume de données remonté depuis Snowflake. Recharge les données après sauvegarde.</p>
        <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md transition-colors">Annuler</button>
            <button onClick={() => onApply()} disabled={isSaving} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1">
                {isSaving ? <Loader size={12} className="animate-spin" /> : <Save size={12} />} Appliquer
            </button>
        </div>
    </div>
);

// --- PANNEAU : GESTION DE L'ÉQUIPE (admin) ---
const TeamManagerPanel = ({ techList, newTechName, setNewTechName, onAdd, onRemove, onClose }) => (
    <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-150">
        <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Équipe technique</h4>
            <button onClick={onClose}><X size={14} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <ul className="space-y-1 mb-3 max-h-40 overflow-y-auto">
            {techList.map(tech => (
                <li key={tech} className="flex items-center justify-between text-xs bg-slate-50 border border-slate-100 rounded-md px-2 py-1.5">
                    <span className="text-slate-700">{tech}</span>
                    <button onClick={() => onRemove(tech)} title="Retirer" className="text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
                </li>
            ))}
        </ul>
        <div className="flex gap-2">
            <input
                type="text"
                value={newTechName}
                onChange={(e) => setNewTechName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') onAdd(); }}
                placeholder="Prénom NOM"
                className="flex-1 text-xs border border-slate-200 rounded-md py-1.5 px-2 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <button onClick={onAdd} className="px-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"><Plus size={14} /></button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2">Le nom doit correspondre au champ Responsable dans Snowflake pour être reconnu.</p>
    </div>
);

// --- FRISE COMPACTE (icônes + infobulles, mode normal ou compact, avec cas particulier optionnel) ---
const MigrationTimelineMini = ({ currentIndex, alea, casParticulier, compact, livraisonDifferentTech, livraisonAssignee }) => {
    const iconSize = compact ? 15 : 20;
    const circleSize = compact ? 'w-7 h-7' : 'w-10 h-10';
    const casSlotWidth = compact ? 'w-16' : 'w-24';
    const topOffset = compact ? '13px' : '19px';
    const CasIcon = casParticulier ? getCasParticulierIcon(casParticulier.kind) : null;
    return (
        // Les 5 étapes principales occupent tout l'espace disponible (connecteurs
        // élastiques) pour que la frise remplisse la largeur de la ligne. Le
        // segment "cas particulier" occupe un slot de largeur FIXE, toujours
        // réservé (même vide) : ça garde une largeur totale identique sur
        // toutes les lignes, donc le chevron reste aligné à droite partout.
        <div className="flex items-start w-full">
            <div className="flex items-start flex-1 min-w-0">
                {MIGRATION_STAGES.map((stage, i) => {
                    const stepNum = i + 1;
                    const isDone = stepNum < currentIndex;
                    const isCurrent = stepNum === currentIndex;
                    const StageIcon = stage.icon;
                    // Cas fréquent : l'analyse/le ticket sont portés par un
                    // technicien, mais la finalisation est planifiée sur un
                    // autre — on le signale par une couleur distincte sur la
                    // pastille Livraison plutôt que le bleu habituel.
                    const isHandoff = stage.key === 'livraison' && isCurrent && livraisonDifferentTech;
                    const tooltipText = isHandoff ? `${stage.tooltip} Finalisation prévue par ${livraisonAssignee}, pas par vous.` : stage.tooltip;
                    return (
                        <React.Fragment key={stage.key}>
                            <div className="flex flex-col items-center gap-1 shrink-0" title={tooltipText}>
                                <div className={`${circleSize} rounded-full flex items-center justify-center transition-colors cursor-help ${
                                    isHandoff ? 'bg-slate-900 ring-4 ring-fuchsia-300' :
                                    isCurrent ? (alea ? 'bg-amber-100 ring-4 ring-amber-50' : 'bg-blue-600 ring-4 ring-blue-100') :
                                    isDone ? 'bg-blue-500' : 'bg-white border-2 border-dashed border-slate-200'
                                }`}>
                                    {isDone ? (
                                        <CheckCircle2 size={iconSize} className="text-white" />
                                    ) : (
                                        <StageIcon size={iconSize} className={isHandoff ? 'text-white' : isCurrent ? (alea ? 'text-amber-700' : 'text-white') : 'text-slate-300'} />
                                    )}
                                </div>
                                {!compact && <span className={`text-[10px] font-medium whitespace-nowrap ${isHandoff ? 'text-fuchsia-600' : isCurrent ? 'text-slate-800' : isDone ? 'text-blue-500' : 'text-slate-300'}`}>{stage.label}</span>}
                            </div>
                            {i < MIGRATION_STAGES.length - 1 && (
                                <div className="flex-1 mx-1 rounded-full" style={{ height: '2px', minWidth: '12px', marginTop: topOffset, backgroundColor: stepNum < currentIndex ? '#93C5FD' : '#EAECF0' }} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
            <div className={`${casSlotWidth} shrink-0 flex items-start`}>
                {casParticulier && (
                    <>
                        <div className="flex-1 mx-1" style={{ marginTop: topOffset, borderTop: '2px dashed #F87171' }} />
                        <div className="flex flex-col items-center gap-1 shrink-0" title={`Cas particulier : ${casParticulier.label}${casParticulier.assignee ? ' — attribué à ' + casParticulier.assignee : ''}${casParticulier.date ? ' — ' + casParticulier.date.toLocaleDateString('fr-FR') : ''}`}>
                            <div className={`${circleSize} rounded-full flex items-center justify-center bg-red-100 ring-4 ring-red-50 cursor-help`}>
                                <CasIcon size={iconSize} className="text-red-600" />
                            </div>
                            {/* La date du cas particulier reste visible même en mode compact (contrairement aux libellés des autres étapes) */}
                            <span className="text-[10px] font-medium whitespace-nowrap text-red-600">{casParticulier.date ? casParticulier.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : 'Cas part.'}</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// --- LIGNE "MA MIGRATION" (condensée, dépliable au clic) ---
const MigrationRow = ({ migration, isExpanded, onToggle }) => {
    const formatDate = (d) => d ? d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : null;
    return (
        <div className="border-b border-slate-100 last:border-b-0">
            {/* Grille à colonnes FIXES (nom | frise | aléa | chevron) : chaque
                colonne garde toujours la même largeur, qu'elle soit vide ou
                non, pour que la frise tombe au même endroit sur toutes les
                lignes — contrairement à un flex où une colonne vide (pas
                d'aléa) laissait plus de place à la frise que sur les lignes
                qui en ont un. */}
            <button onClick={onToggle} className="w-full grid grid-cols-[130px_1fr_90px_16px] sm:grid-cols-[190px_1fr_100px_16px] items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left">
                <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{migration.dossierName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">n°{migration.numDossier}</span>
                        {migration.interlocuteur && <span className="text-[10px] text-slate-400 truncate">{migration.interlocuteur}</span>}
                    </div>
                </div>
                <div className="min-w-0">
                    {!isExpanded && (
                        <MigrationTimelineMini currentIndex={migration.stageIndex} alea={migration.alea} casParticulier={migration.casParticulier} livraisonDifferentTech={migration.livraisonDifferentTech} livraisonAssignee={migration.livraisonAssignee} compact />
                    )}
                </div>
                <div className="hidden sm:flex min-w-0">
                    {migration.alea && (
                        <span className="truncate px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-100">{migration.alea}</span>
                    )}
                </div>
                <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isExpanded && (
                <div className="px-4 pb-4 pt-2 bg-slate-50/60 animate-in fade-in duration-150">
                    <div onClick={onToggle} className="cursor-pointer">
                        <MigrationTimelineMini currentIndex={migration.stageIndex} alea={migration.alea} casParticulier={migration.casParticulier} livraisonDifferentTech={migration.livraisonDifferentTech} livraisonAssignee={migration.livraisonAssignee} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-500">
                        {migration.analysisDate && <span>Analyse : {formatDate(migration.analysisDate)}</span>}
                        {migration.livraisonDate && <span>Planifié : {formatDate(migration.livraisonDate)}</span>}
                        {migration.livraisonDifferentTech && (
                            <span className="text-fuchsia-600 font-medium">Finalisation par : {migration.livraisonAssignee}</span>
                        )}
                        {migration.casParticulier && (
                            <span className="text-red-600 font-medium">
                                {migration.casParticulier.label}{migration.casParticulier.assignee ? ` — ${migration.casParticulier.assignee}` : ''}{migration.casParticulier.date ? ` (${formatDate(migration.casParticulier.date)})` : ''}
                            </span>
                        )}
                    </div>
                    {migration.linkedTicket ? (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1"><FileText size={11} /> Ticket lié</p>
                                {migration.linkedTicket.etat && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">{migration.linkedTicket.etat}</span>
                                )}
                            </div>
                            <p className="text-xs font-medium text-slate-700 mb-1.5">{migration.linkedTicket.motif}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                                {migration.linkedTicket.categorie && <span>Catégorie : <span className="text-slate-700 font-medium">{migration.linkedTicket.categorie}</span></span>}
                                {migration.linkedTicket.creeLe && <span>Créé le : {formatDate(migration.linkedTicket.creeLe)}</span>}
                                {migration.linkedTicket.derniereAction && <span>Dernière action : {formatDate(migration.linkedTicket.derniereAction)}</span>}
                                {migration.linkedTicket.reporteLe && <span>Reporté au : {formatDate(migration.linkedTicket.reporteLe)}</span>}
                                {migration.linkedTicket.dureeMinutes > 0 && <span>Durée : {(migration.linkedTicket.dureeMinutes / 60).toFixed(1)} h</span>}
                                {migration.linkedTicket.nbRappelsClient > 0 && <span>Rappels client : {migration.linkedTicket.nbRappelsClient}</span>}
                            </div>
                            {migration.linkedTicket.notes && (
                                <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5 max-h-48 overflow-y-auto">
                                    {migration.linkedTicket.notes.split('\n---\n').filter(Boolean).map((note, i) => (
                                        <p key={i} className="text-[11px] text-slate-600 bg-white border border-slate-200 rounded-md px-2 py-1.5 whitespace-pre-wrap">{note.trim()}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-400 italic">Aucun ticket "[IAD] - Préparation Avocatmail" trouvé pour ce dossier.</p>
                    )}
                </div>
            )}
        </div>
    );
};

// --- THÈME AURORA : frise en barre de progression (aperçu) ---
const MigrationStepperBar = ({ currentIndex, alea, accentColor, theme }) => {
    const t = AURORA_THEMES[theme];
    const segW = 100 / 5;
    return (
        <div style={{ position: 'relative', height: 20, background: t.track, borderRadius: 6, margin: '4px 0' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.max(currentIndex - 1, 0) * segW + segW / 2}%`, background: accentColor, opacity: 0.25, borderRadius: 6 }} />
            {MIGRATION_STAGES.map((stage, i) => {
                const stepNum = i + 1;
                const done = stepNum <= currentIndex;
                const StageIcon = stage.icon;
                return (
                    <div key={stage.key} title={stage.tooltip} style={{ position: 'absolute', left: `${i * segW + segW / 2}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 20, height: 20, borderRadius: 6, background: done ? accentColor : t.track, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help' }}>
                        <StageIcon size={12} color={done ? '#fff' : t.sub} />
                    </div>
                );
            })}
        </div>
    );
};

// --- THÈME AURORA : ligne de migration (aperçu — liste dense sans carte, frise en barre) ---
const MigrationRowAurora = ({ migration, theme, isExpanded, onToggle }) => {
    const t = AURORA_THEMES[theme];
    const formatDate = (d) => d ? d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : null;
    const accentColor = migration.alea ? t.alea : migration.livraisonDifferentTech ? t.handoff : t.accent;
    return (
        <div
            onClick={onToggle}
            style={{ padding: '12px 14px', borderTop: `1px solid ${t.border}`, cursor: 'pointer', background: 'transparent', transition: 'background .15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: t.text, minWidth: 0 }}>
                    {migration.dossierName} <span style={{ color: t.sub, fontWeight: 400, fontSize: 11 }}>n°{migration.numDossier}</span>
                </div>
                {migration.alea && <span style={{ fontSize: 10, fontWeight: 500, color: t.alea, background: t.aleaBg, padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>{migration.alea}</span>}
                {!migration.alea && migration.livraisonDifferentTech && <span style={{ fontSize: 10, fontWeight: 500, color: t.handoff, background: t.handoffBg, padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>Passation</span>}
            </div>
            <MigrationStepperBar currentIndex={migration.stageIndex} alea={migration.alea} accentColor={accentColor} theme={theme} />
            {isExpanded && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${t.border}`, fontSize: 11, color: t.sub, display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                    {migration.analysisDate && <span>Analyse : {formatDate(migration.analysisDate)}</span>}
                    {migration.livraisonDate && <span>Planifié : {formatDate(migration.livraisonDate)}</span>}
                    {migration.livraisonDifferentTech && <span style={{ color: t.handoff, fontWeight: 500 }}>Finalisation par : {migration.livraisonAssignee}</span>}
                    {migration.casParticulier && <span style={{ color: '#DC2626', fontWeight: 500 }}>{migration.casParticulier.label}{migration.casParticulier.date ? ` (${formatDate(migration.casParticulier.date)})` : ''}</span>}
                </div>
            )}
        </div>
    );
};


const RulesModal = ({ isOpen, onClose, userEmail, currentWeights, onUpdateWeights, onToast }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempWeights, setTempWeights] = useState(DEFAULT_WEIGHTS);
    const isAdmin = userEmail === ADMIN_EMAIL;

    useEffect(() => {
        if(currentWeights) setTempWeights(currentWeights);
    }, [currentWeights, isOpen]);

    const handleSave = async () => {
        try {
            onUpdateWeights(tempWeights); // Optimiste
            setIsEditing(false);

            const response = await fetch('/api/saveConfig', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tempWeights) 
            });
    
            if (response.ok) {
                onToast?.("Config sauvegardée.", 'success');
            } else {
                console.warn("Erreur sauvegarde backend.");
                onToast?.("Erreur de sauvegarde. Vérifiez la console.", 'error');
            }
        } catch (e) {
            console.error("Erreur save:", e);
            onToast?.("Erreur de connexion.", 'error');
        }
    };

    const handleChange = (key, value) => {
        setTempWeights(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
                <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        {isEditing ? <Settings className="w-5 h-5 text-purple-600" /> : <Info className="w-5 h-5 text-blue-600" />}
                        {isEditing ? "Mode Édition" : "Règles de Calcul"}
                    </h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                <div className="p-6 text-xs space-y-6 overflow-y-auto">
                    <div className="space-y-2">
                        <h4 className={`font-bold uppercase tracking-wider ${COLORS.text_besoin} flex items-center gap-2 border-b border-blue-100 pb-1`}>1. Besoin Planifié</h4>
                        <ul className="list-disc pl-4 space-y-1 text-slate-600">
                            <li>Source : Calendrier (Snowflake).</li>
                            <li>Calcul : Durée réelle, sinon <code className="bg-slate-100 px-1 rounded">1h + (Nb Users - 5) × 10min</code>.</li>
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center border-b border-orange-100 pb-1">
                            <h4 className={`font-bold uppercase tracking-wider ${COLORS.text_encours} flex items-center gap-2`}>2. Tickets "En Cours"</h4>
                            {isAdmin && !isEditing && (
                                <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded hover:bg-purple-200 transition-colors">
                                    <Settings size={12} /> Modifier
                                </button>
                            )}
                        </div>
                        {isEditing ? (
                            <div className="grid grid-cols-1 gap-2 bg-slate-50 p-3 rounded border border-slate-200">
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
                                        <input type="number" step="0.05" value={tempWeights[item.key]} onChange={(e) => handleChange(item.key, e.target.value)} className="w-20 text-right text-xs p-1 border rounded focus:ring-2 focus:ring-purple-500 outline-none" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 ml-2 text-slate-600">
                                <li>• Prêt / Planif : <b>{tempWeights.pret_mise_en_place} h</b></li>
                                <li>• Prép. Tenant : <b>{tempWeights.preparation_tenant} h</b></li>
                                <li>• Copie en cours : <b>{tempWeights.copie_en_cours} h</b></li>
                                <li>• Standard : <b>{tempWeights.defaut_autre} h</b></li>
                                <li>• Attente : <b>{tempWeights.attente_bloque} h</b></li>
                                <li>• Suspendu : <b>{tempWeights.suspendu} h</b></li>
                            </ul>
                        )}
                    </div>
                    <div className="space-y-2">
                        <h4 className={`font-bold uppercase tracking-wider ${COLORS.text_capacite} flex items-center gap-2 border-b border-emerald-100 pb-1`}>3. Capacité</h4>
                        <ul className="list-disc pl-4 space-y-1 text-slate-600">
                            <li>Source : Événements "Backoffice".</li>
                            <li>Calcul : Durée nette (moins les RDV clients).</li>
                        </ul>
                    </div>
                </div>
                <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                    {isEditing ? (
                        <>
                            <button onClick={() => { setIsEditing(false); setTempWeights(currentWeights); }} className="px-3 py-2 text-slate-600 hover:bg-slate-200 rounded transition-colors flex items-center gap-1"><RotateCcw size={14} /> Annuler</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-purple-600 text-white rounded-md text-xs font-bold hover:bg-purple-700 transition-colors flex items-center gap-1"><Save size={14} /> Enregistrer</button>
                        </>
                    ) : (
                        <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 rounded-md text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors">Fermer</button>
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
    const byTechEntries = data.byTech ? Object.entries(data.byTech).sort((a, b) => a[0].localeCompare(b[0])) : [];
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg text-xs min-w-[180px] max-w-[280px]">
        <p className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">{data.weekSort !== undefined ? data.label : formatMonth(data.month)}</p>
        <div className="space-y-1">
            <div className={`flex justify-between items-center ${COLORS.text_besoin}`}><span>Besoin (Nouv) :</span><span className="font-bold">{data.besoin?.toFixed(1)} h</span></div>
            <div className={`flex justify-between items-center ${COLORS.text_encours}`}><span>Besoin (En cours) :</span><span className="font-bold">{data.besoin_encours?.toFixed(1)} h</span></div>
            <div className={`flex justify-between items-center ${COLORS.text_capacite}`}><span>Capacité Planifiée :</span><span className="font-bold">{data.capacite?.toFixed(1)} h</span></div>
        </div>
        <div className={`mt-3 pt-2 border-t border-slate-100 flex justify-between items-center font-bold text-sm ${isPositive ? COLORS.text_ok : COLORS.text_danger}`}>
            <span>DISPONIBLE :</span><span>{isPositive ? '+' : ''}{dispo.toFixed(1)} h</span>
        </div>
        {byTechEntries.length > 0 && (
          <div className="mt-3 pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">
              <span>Technicien</span>
              <span className="flex items-center gap-1 shrink-0">
                <span className={COLORS.text_capacite}>Capa.</span>
                <span className="text-slate-300">/</span>
                <span className={COLORS.text_besoin}>Besoin</span>
              </span>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {byTechEntries.map(([tech, t]) => (
                <div key={tech} className="flex justify-between items-center gap-2">
                  <span className="text-slate-600 truncate">{tech}</span>
                  <span className="font-medium shrink-0">
                    <span className={COLORS.text_capacite}>{t.capacite.toFixed(0)}h</span>
                    <span className="text-slate-300 mx-0.5">/</span>
                    <span className={COLORS.text_besoin}>{(t.besoin + t.besoin_encours).toFixed(0)}h</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const KPICard = ({ title, value, subtext, icon: Icon, colorClass, active, onClick, isLoading }) => (
  <div onClick={onClick} className={`px-4 py-3 rounded-xl shadow-sm border transition-all duration-300 flex items-center justify-between ${active ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100' : 'bg-white border-slate-200/70'} ${onClick ? 'cursor-pointer hover:bg-slate-50' : ''}`}>
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
      {isLoading ? (
        <Skeleton className="h-6 w-16 mt-1" />
      ) : (
        <div className="flex items-baseline gap-2">
          <h3 className="text-xl font-bold text-slate-800">{value}</h3>
          {subtext && <p className={`text-xs font-medium ${colorClass}`}>{subtext}</p>}
        </div>
      )}
    </div>
    <div className={`p-2.5 rounded-full ring-1 ring-inset ${colorClass.replace('text-', 'ring-').replace('600', '100')} ${colorClass.replace('text-', 'bg-').replace('600', '50')}`}><Icon className={`w-5 h-5 ${colorClass}`} /></div>
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
  const [specialEventsData, setSpecialEventsData] = useState([]);
  const [ticketNotesData, setTicketNotesData] = useState([]);
  const [relancesData, setRelancesData] = useState([]);
  const [techList, setTechList] = useState(TECH_LIST_DEFAULT);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTech, setSelectedTech] = useState('Tous');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [showPlanning, setShowPlanning] = useState(false); 
  const [isDetailListExpanded, setIsDetailListExpanded] = useState(true);
  const [isTableExpanded, setIsTableExpanded] = useState(false); 
  const [isTechChartExpanded, setIsTechChartExpanded] = useState(false); 
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [weightsConfig, setWeightsConfig] = useState(DEFAULT_WEIGHTS);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDateScopeOpen, setIsDateScopeOpen] = useState(false);
  const [dateScopeDraft, setDateScopeDraft] = useState({ start: DEFAULT_WEIGHTS.date_range_start, end: DEFAULT_WEIGHTS.date_range_end });
  const [isSavingDateScope, setIsSavingDateScope] = useState(false);
  const [toast, setToast] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);
  const [newTechName, setNewTechName] = useState('');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'mine' | 'relances'
  const [relanceSelection, setRelanceSelection] = useState(() => new Set());

  const { getToken } = useAuth();
  const isAdmin = userEmail === ADMIN_EMAIL;
  const currentTechName = normalizeTechName(user?.fullName, techList);
  const [viewAsTech, setViewAsTech] = useState(null);
  const [expandedDossier, setExpandedDossier] = useState(null);
  const [migrationStageFilter, setMigrationStageFilter] = useState(null); // null = toutes les étapes
  const [migrationDisplayMode, setMigrationDisplayMode] = useState('grouped'); // 'grouped' | 'list'
  const [uiTheme, setUiTheme] = useState(() => {
      try { return (typeof window !== 'undefined' && window.localStorage.getItem('pilotageMigrations:uiTheme')) || 'default'; }
      catch (e) { return 'default'; }
  });
  const setUiThemeAndPersist = (val) => {
      setUiTheme(val);
      try { if (typeof window !== 'undefined') window.localStorage.setItem('pilotageMigrations:uiTheme', val); } catch (e) { /* stockage indisponible */ }
  };
  const [migrationSortDir, setMigrationSortDir] = useState('asc');
  const [chartMode, setChartMode] = useState('weeks-all'); // 'months' | 'weeks-month' | 'weeks-all'
  const effectiveTechName = viewAsTech || currentTechName;

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // --- CHARGEMENT DES DONNÉES MÉTIER (dépend du scope de dates courant) ---
  const fetchBusinessData = useCallback(async (dateRange, techsForQuery, options = {}) => {
    const { forceRefresh = false } = options;
    const techsList = techsForQuery || TECH_LIST_DEFAULT;
    const cacheKey = `data:${dateRange.start}:${dateRange.end}:${JSON.stringify(techsList)}`;

    if (!forceRefresh) {
      const cached = readCache(cacheKey);
      if (cached) {
        setBackofficeData(cached.backoffice || []);
        setEncoursData(cached.encours || []);
        setSpecialEventsData(cached.specialEvents || []);
        setTicketNotesData(cached.ticketNotes || []);
        setRelancesData(cached.relances || []);
        setLastSyncTime(new Date(cached.cachedAt));
        console.log("📍 Données métier chargées depuis le cache local.");
        return;
      }
    }

    console.log("📍 Chargement des données métier...", dateRange);
    setIsLoading(true);
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const params = new URLSearchParams({ start: dateRange.start, end: dateRange.end, techs: JSON.stringify(techsList) });

      const response = await fetch(`/api/getData?${params.toString()}`, { headers });
      const json = await response.json();

      if (!response.ok) throw new Error(json.error || `Erreur API getData`);

      if (json.backoffice) setBackofficeData(json.backoffice || []);
      if (json.encours) setEncoursData(json.encours || []);
      if (json.specialEvents) setSpecialEventsData(json.specialEvents || []);
      if (json.ticketNotes) setTicketNotesData(json.ticketNotes || []);
      setRelancesData(json.relances || []);

      const cachedAt = Date.now();
      writeCache(cacheKey, { backoffice: json.backoffice, encours: json.encours, specialEvents: json.specialEvents, ticketNotes: json.ticketNotes, relances: json.relances, cachedAt }, DATA_CACHE_TTL_MS);

      setLastSyncTime(new Date(cachedAt));
      console.log("📍 Données métier chargées !");
    } catch (err) {
      console.error("❌ ERREUR GLOBALE :", err);
      showToast("Erreur de chargement des données. Voir la console.", 'error');
    } finally {
      setIsLoading(false);
    }
  }, [getToken, showToast]);

  // --- LE USE EFFECT BLINDÉ (DEBUG & CHARGEMENT) ---
  useEffect(() => {
    const init = async () => {
      console.log("📍 ÉTAPE 1 : Démarrage du chargement de la config...");

      let loadedRange = { start: DEFAULT_WEIGHTS.date_range_start, end: DEFAULT_WEIGHTS.date_range_end };
      let loadedTechList = TECH_LIST_DEFAULT;

      const applyConfig = (configJson) => {
          if (!configJson || Object.keys(configJson).length === 0) return;
          setWeightsConfig(prev => ({ ...prev, ...configJson }));
          loadedRange = {
              start: configJson.date_range_start || loadedRange.start,
              end: configJson.date_range_end || loadedRange.end
          };
          if (Array.isArray(configJson.tech_list) && configJson.tech_list.length > 0) {
              loadedTechList = configJson.tech_list;
              setTechList(loadedTechList);
          }
      };

      const cachedConfig = readCache('config');
      if (cachedConfig) {
          console.log("📍 Config chargée depuis le cache local.");
          applyConfig(cachedConfig);
      } else {
        try {
          const configRes = await fetch(`/api/getConfig?t=${Date.now()}`);
          if (configRes.ok) {
              const configJson = await configRes.json();
              console.log("✅ SUCCÈS - CONFIG REÇUE :", configJson);
              applyConfig(configJson);
              if (configJson && Object.keys(configJson).length > 0) {
                  writeCache('config', configJson, CONFIG_CACHE_TTL_MS);
              }
          } else {
              const textError = await configRes.text();
              console.error("❌ ERREUR API CONFIG (Pas 200 OK) :", configRes.status, textError);
          }
        } catch (e) {
            console.error("❌ CRASH APPEL API CONFIG :", e);
        }
      }

      setDateScopeDraft(loadedRange);
      await fetchBusinessData(loadedRange, loadedTechList);
    };
    init();
  }, [fetchBusinessData]);

  // --- SCOPE DE DATES : sauvegarde + rechargement des données sur ce nouveau scope ---
  const handleApplyDateScope = async (rangeOverride) => {
      const range = rangeOverride || dateScopeDraft;
      if (!range.start || !range.end || range.start > range.end) {
          showToast("Merci de vérifier les dates (début doit précéder la fin).", 'error');
          return;
      }
      setIsSavingDateScope(true);
      const updatedConfig = { ...weightsConfig, date_range_start: range.start, date_range_end: range.end };
      try {
          const response = await fetch('/api/saveConfig', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedConfig)
          });
          if (!response.ok) throw new Error("Échec sauvegarde du scope de dates.");
          setWeightsConfig(updatedConfig);
          writeCache('config', updatedConfig, CONFIG_CACHE_TTL_MS);
          setDateScopeDraft(range);
          setIsDateScopeOpen(false);
          setCurrentPage(1);
          showToast("Scope de dates mis à jour.", 'success');
          await fetchBusinessData(range, techList, { forceRefresh: true });
      } catch (e) {
          console.error("Erreur sauvegarde scope de dates:", e);
          showToast("Erreur lors de la sauvegarde du scope de dates.", 'error');
      } finally {
          setIsSavingDateScope(false);
      }
  };

  // Raccourci "toute l'année" : élargit le scope sans avoir à ouvrir le
  // panneau et taper les dates à la main. Couvre 6 mois avant à 6 mois après
  // aujourd'hui, en jours calendaires (une base large, ajustable ensuite via
  // le panneau si besoin).
  const handleQuickYearScope = () => {
      const now = new Date();
      const start = new Date(now); start.setMonth(start.getMonth() - 6);
      const end = new Date(now); end.setMonth(end.getMonth() + 6);
      handleApplyDateScope({ start: toLocalDateString(start), end: toLocalDateString(end) });
  };

  // --- ÉQUIPE : ajout / suppression d'un technicien, persisté dans la même config partagée ---
  const persistTechList = async (nextList) => {
      const updatedConfig = { ...weightsConfig, tech_list: nextList };
      try {
          const response = await fetch('/api/saveConfig', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedConfig)
          });
          if (!response.ok) throw new Error("Échec sauvegarde équipe.");
          setWeightsConfig(updatedConfig);
          writeCache('config', updatedConfig, CONFIG_CACHE_TTL_MS);
          setTechList(nextList);
          showToast("Équipe mise à jour.", 'success');
          // La liste d'équipe pilote aussi le filtre technicien côté Snowflake
          // (getData.js) : sans ce rechargement, un technicien nouvellement
          // ajouté n'aurait aucune donnée tant que la page n'est pas rechargée.
          await fetchBusinessData({ start: updatedConfig.date_range_start, end: updatedConfig.date_range_end }, nextList, { forceRefresh: true });
      } catch (e) {
          console.error("Erreur sauvegarde équipe:", e);
          showToast("Erreur lors de la sauvegarde de l'équipe.", 'error');
      }
  };

  const handleAddTech = () => {
      const name = newTechName.trim();
      if (!name) return;
      if (techList.some(t => t.toLowerCase() === name.toLowerCase())) {
          showToast("Ce technicien est déjà dans la liste.", 'error');
          return;
      }
      persistTechList([...techList, name]);
      setNewTechName('');
  };

  const handleRemoveTech = (name) => {
      if (techList.length <= 1) {
          showToast("Il doit rester au moins un technicien.", 'error');
          return;
      }
      persistTechList(techList.filter(t => t !== name));
      if (selectedTech === name) setSelectedTech('Tous');
  };
  
  const { detailedData, eventsData, planningCount, analysisPipeCount, availableMonths } = useMemo(() => {
    const monthlyStats = new Map();
    const monthsSet = new Set(); 
    const techBackofficeSchedule = {}; 
    const scheduledClients = new Set(); 
    const allowedNeedEvents = ['Avocatmail - Analyse', 'Migration messagerie Adwin', 'Migration messagerie Adwin - analyse'];
    let allEvents = [];

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

          const reportDate = parseDateSafe(reportDateStr);

          if (!reportDate && scheduledClients.has(safeUpper(clientName))) {
              return; 
          }

          if (categorie === 'Prêt pour mise en place') {
              countReadyMiseEnPlace++;
              planningEventsList.push({ date: "N/A", tech, client: clientName, type: "Prêt pour Mise en Place", duration: 0, status: "A Planifier (Migr)", color: "ready_migr", creeLeFormatted, ageWarning });
              return;
          }
          if (categorie === 'Prêt pour analyse' || categorie === 'A Planifier (Analyse)') {
              countReadyAnalyse++;
              planningEventsList.push({ date: "N/A", tech, client: clientName, type: "Prêt pour Analyse", duration: 0, status: "A Planifier (Analyse)", color: "ready_analyse", creeLeFormatted, ageWarning });
          }

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
                  status: status, color: color, raw_besoin: 0, raw_capacite: 0, raw_besoin_encours: remainingLoad,
                  creeLeFormatted, ageWarning
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
    // On part toujours d'une copie : on ne veut jamais trier/muter le
    // tableau `eventsData` mémoïsé (partagé avec d'autres calculs comme
    // techAggregatedData ou weeklyAggregatedData).
    let events = [...eventsData];
    if (selectedTech !== 'Tous') events = events.filter(e => e.tech === selectedTech);
    if (showPlanning) events = events.filter(e => e.status.includes("A Planifier"));
    else if (selectedMonth) events = events.filter(e => e.date !== "N/A" && e.date.startsWith(selectedMonth));
    else events = events.filter(e => e.date !== "N/A");
    const q = searchQuery.trim().toLowerCase();
    if (q) events = events.filter(e => safeString(e.client).toLowerCase().includes(q));
    if (sortConfig.key) {
      events.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        if (sortConfig.key === 'date') { if (valA === 'N/A') valA = '0000-00-00'; if (valB === 'N/A') valB = '0000-00-00'; }

        // Comparaison numérique pour la durée (sinon "10" < "9" en tri texte)
        if (sortConfig.key === 'duration') {
          const numA = Number(valA) || 0;
          const numB = Number(valB) || 0;
          if (numA < numB) return sortConfig.direction === 'asc' ? -1 : 1;
          if (numA > numB) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        }

        valA = safeString(valA).toLowerCase();
        valB = safeString(valB).toLowerCase();
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return events;
  }, [selectedTech, selectedMonth, showPlanning, eventsData, sortConfig, searchQuery]);

  // Réinitialise la pagination du tableau dès que les filtres, le tri ou les
  // données changent, pour éviter de rester bloqué sur une page vide.
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTech, selectedMonth, showPlanning, sortConfig, eventsData, searchQuery]);

  const totalDetailPages = Math.max(1, Math.ceil(filteredAndSortedEvents.length / DETAIL_TABLE_PAGE_SIZE));
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * DETAIL_TABLE_PAGE_SIZE;
    return filteredAndSortedEvents.slice(start, start + DETAIL_TABLE_PAGE_SIZE);
  }, [filteredAndSortedEvents, currentPage]);

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

    // Le mois en cours mélange des semaines déjà passées (capacité perdue,
    // qu'elle ait servi ou non) et des semaines à venir : le total mensuel
    // brut donne une fausse impression de marge. On le remplace par le
    // total des seules semaines restantes à partir d'aujourd'hui.
    const currentMonthKey = getCurrentMonthKey();
    const todayISO = toLocalDateString(new Date());
    if (aggMap.has(currentMonthKey)) {
        let relevantEvents = eventsData.filter(e => e.date !== "N/A" && e.date.startsWith(currentMonthKey) && e.date >= todayISO);
        if (selectedTech !== 'Tous') relevantEvents = relevantEvents.filter(e => e.tech === selectedTech);
        const remaining = { besoin: 0, besoin_encours: 0, capacite: 0 };
        relevantEvents.forEach(evt => {
            remaining.besoin += (evt.raw_besoin || 0);
            remaining.besoin_encours += (evt.raw_besoin_encours || 0);
            remaining.capacite += (evt.raw_capacite || 0);
        });
        aggMap.set(currentMonthKey, { ...aggMap.get(currentMonthKey), ...remaining, isCurrentMonthPartial: true });
    }

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
  }, [detailedData, eventsData, selectedTech]);

  const weeklyAggregatedData = useMemo(() => {
      if (!selectedMonth) return [];
      const monthEvents = eventsData.filter(e => e.date !== "N/A" && e.date.startsWith(selectedMonth));
      const relevantEvents = selectedTech !== 'Tous' ? monthEvents.filter(e => e.tech === selectedTech) : monthEvents;
      const weekMap = new Map();
      const ensureEntry = (weekNum, evt) => {
          if (!weekMap.has(weekNum)) {
              const label = `${weekNum} (${getWeekRange(evt.date)})`;
              weekMap.set(weekNum, { month: weekNum, label, weekSort: parseInt(weekNum.replace('S', '')), besoin: 0, besoin_encours: 0, capacite: 0, weekEnd: getWeekEndDate(evt.date), byTech: {} });
          }
          return weekMap.get(weekNum);
      };
      relevantEvents.forEach(evt => {
          const entry = ensureEntry(getWeekLabel(evt.date), evt);
          entry.besoin += (evt.raw_besoin || 0);
          entry.besoin_encours += (evt.raw_besoin_encours || 0);
          entry.capacite += (evt.raw_capacite || 0);
      });
      // Détail par technicien pour l'infobulle : toujours calculé sur toute
      // l'équipe, indépendamment du filtre technicien appliqué au graphique.
      monthEvents.forEach(evt => {
          const entry = ensureEntry(getWeekLabel(evt.date), evt);
          if (!entry.byTech[evt.tech]) entry.byTech[evt.tech] = { besoin: 0, besoin_encours: 0, capacite: 0 };
          const t = entry.byTech[evt.tech];
          t.besoin += (evt.raw_besoin || 0);
          t.besoin_encours += (evt.raw_besoin_encours || 0);
          t.capacite += (evt.raw_capacite || 0);
      });
      const now = new Date();
      return Array.from(weekMap.values())
        .map(w => ({ ...w, isPast: w.weekEnd ? w.weekEnd < now : false }))
        .sort((a, b) => a.weekSort - b.weekSort);
  }, [eventsData, selectedMonth, selectedTech]);

  // Toutes les semaines du scope, indépendamment du mois sélectionné —
  // regroupées par (année, n° de semaine) pour éviter les collisions quand
  // le scope de dates chevauche deux années civiles.
  const allWeeksAggregatedData = useMemo(() => {
      const allEvents = eventsData.filter(e => e.date !== "N/A");
      const relevantEvents = selectedTech !== 'Tous' ? allEvents.filter(e => e.tech === selectedTech) : allEvents;
      const weekMap = new Map();
      const buildKey = (evt) => {
          const d = new Date(evt.date);
          if (isNaN(d.getTime())) return null;
          return { key: `${d.getFullYear()}-${getWeekLabel(evt.date)}`, d };
      };
      const ensureEntry = (key, d, evt) => {
          if (!weekMap.has(key)) {
              const weekNum = getWeekLabel(evt.date);
              const weekRange = getWeekRange(evt.date);
              const label = `${weekNum} (${weekRange})`;
              const weekStart = getWeekStartDate(evt.date);
              const dateLabel = weekStart ? weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : weekNum;
              const monthKey = weekStart ? `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}` : null;
              weekMap.set(key, { month: key, label, shortLabel: weekNum, dateLabel, monthKey, year: d.getFullYear(), weekSort: parseInt(weekNum.replace('S', '')), besoin: 0, besoin_encours: 0, capacite: 0, weekEnd: getWeekEndDate(evt.date), byTech: {} });
          }
          return weekMap.get(key);
      };
      relevantEvents.forEach(evt => {
          const k = buildKey(evt);
          if (!k) return;
          const entry = ensureEntry(k.key, k.d, evt);
          entry.besoin += (evt.raw_besoin || 0);
          entry.besoin_encours += (evt.raw_besoin_encours || 0);
          entry.capacite += (evt.raw_capacite || 0);
      });
      // Détail par technicien pour l'infobulle : toujours calculé sur toute
      // l'équipe, indépendamment du filtre technicien appliqué au graphique.
      allEvents.forEach(evt => {
          const k = buildKey(evt);
          if (!k) return;
          const entry = ensureEntry(k.key, k.d, evt);
          if (!entry.byTech[evt.tech]) entry.byTech[evt.tech] = { besoin: 0, besoin_encours: 0, capacite: 0 };
          const t = entry.byTech[evt.tech];
          t.besoin += (evt.raw_besoin || 0);
          t.besoin_encours += (evt.raw_besoin_encours || 0);
          t.capacite += (evt.raw_capacite || 0);
      });
      const now = new Date();
      return Array.from(weekMap.values())
        .map(w => ({ ...w, isPast: w.weekEnd ? w.weekEnd < now : false }))
        .sort((a, b) => a.year - b.year || a.weekSort - b.weekSort);
  }, [eventsData, selectedTech]);

  // Bandes de fond alternées par mois, pour repérer visuellement où commence
  // et finit chaque mois dans la vue "Toutes les Semaines".
  const monthBands = useMemo(() => {
      if (chartMode !== 'weeks-all' || allWeeksAggregatedData.length === 0) return [];
      const bands = [];
      let current = null;
      allWeeksAggregatedData.forEach(w => {
          if (!current || current.monthKey !== w.monthKey) {
              if (current) bands.push(current);
              current = { monthKey: w.monthKey, start: w.dateLabel, end: w.dateLabel };
          }
          current.end = w.dateLabel;
      });
      if (current) bands.push(current);
      return bands.map((b, i) => ({
          ...b,
          label: b.monthKey ? new Date(`${b.monthKey}-01T00:00:00`).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }) : '',
          shaded: i % 2 === 1
      }));
  }, [allWeeksAggregatedData, chartMode]);

  const mainChartData = chartMode === 'months' ? monthlyAggregatedData : chartMode === 'weeks-all' ? allWeeksAggregatedData : weeklyAggregatedData;

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
    // On exclut les semaines déjà passées du total affiché en KPI : elles
    // restent visibles (grisées) dans le graphique pour le contexte, mais ne
    // comptent pas dans "ce qu'il reste à faire/disponible".
    const relevantData = mainChartData.filter(curr => !curr.isPast);
    const totalBesoin = relevantData.reduce((acc, curr) => acc + (curr.totalBesoinMois || (curr.besoin + curr.besoin_encours)), 0);
    const totalCapacite = relevantData.reduce((acc, curr) => acc + curr.capacite, 0);
    const ratio = totalBesoin > 0 ? (totalCapacite / totalBesoin) * 100 : 0;
    return { besoin: totalBesoin, capacite: totalCapacite, ratio };
  }, [mainChartData]);

  const handleChartClick = (data) => {
    if (data && data.activePayload && data.activePayload.length > 0 && chartMode === 'months') {
         const clickedData = data.activePayload[0].payload;
         if(clickedData && clickedData.month) { setSelectedMonth(clickedData.month); setChartMode('weeks-month'); setShowPlanning(false); }
    }
  };

  const toggleViewMode = (mode) => {
      setShowPlanning(false);
      setChartMode(mode);
      if (mode === 'months') {
          setSelectedMonth(null);
      } else if (mode === 'weeks-month') {
          if (!selectedMonth) { const current = getCurrentMonthKey(); setSelectedMonth(availableMonths.includes(current) ? current : availableMonths[0]); }
      } else if (mode === 'weeks-all') {
          // Vue transversale, non filtrée par mois : on ne veut pas que le
          // tableau détail se retrouve limité à un seul mois par effet de bord.
          setSelectedMonth(null);
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

  // --- "MES MIGRATIONS" (prototype) : un dossier par ligne active du technicien connecté ---
  const myMigrations = useMemo(() => {
    if (!effectiveTechName || effectiveTechName === 'Inconnu') return [];
    const myTickets = (encoursData || []).filter(t => normalizeTechName(t.RESPONSABLE, techList) === effectiveTechName);

    // Un dossier peut avoir plusieurs lignes de ticket : on garde la plus
    // récente pour déterminer l'étape (statut courant), mais aussi la liste
    // complète pour pouvoir retrouver le ticket "[IAD] - Préparation
    // Avocatmail" spécifiquement (souvent une ligne distincte du dossier).
    const byDossier = new Map();
    const allTicketsByDossier = new Map();
    myTickets.forEach(t => {
      const numDossier = safeString(t.NUMERO_DOSSIER);
      if (!numDossier) return;
      if (!allTicketsByDossier.has(numDossier)) allTicketsByDossier.set(numDossier, []);
      allTicketsByDossier.get(numDossier).push(t);

      const creeLe = parseDateSafe(t.CREE_LE);
      const existing = byDossier.get(numDossier);
      if (!existing || (creeLe && (!existing.creeLe || creeLe > existing.creeLe))) {
        byDossier.set(numDossier, { numDossier, categorie: t.CATEGORIE, motif: t.MOTIF, interlocuteur: safeString(t.INTERLOCUTEUR), creeLe });
      }
    });

    return Array.from(byDossier.values()).map(dossier => {
      const linkedEvents = (backofficeData || []).filter(e => safeString(e.NUMDOSSIER) === dossier.numDossier);
      // Un dossier client peut avoir des événements sans rapport avec la
      // migration (devis logiciel, licence, autre intervention technique...).
      // On ne garde, pour la détection analyse/livraison, que les événements
      // dont le libellé référence explicitement Avocatmail/MX — le simple
      // rapprochement par numéro de dossier n'est pas suffisant.
      const migrationEvents = linkedEvents.filter(e => isMigrationRelatedEvent(e.EVENEMENT));
      const analysisEvent = migrationEvents.find(e => ANALYSIS_EVENT_NAMES.includes(safeString(e.EVENEMENT)));
      // Le reste des événements de migration du dossier, triés
      // chronologiquement : le premier est supposé être la livraison (MX /
      // mise en place).
      const otherEventsSorted = migrationEvents
        .filter(e => e !== analysisEvent)
        .map(e => ({ ...e, _date: parseDateSafe(e.DATE) }))
        .filter(e => e._date)
        .sort((a, b) => a._date - b._date);
      const livraisonEvent = otherEventsSorted[0] || null;
      const stage = getMigrationStage(dossier.categorie, dossier.motif);
      // Heuristique : si "Prêt pour mise en place" ET qu'un événement de
      // planification (hors analyse) existe déjà pour ce dossier, on
      // considère la livraison enclenchée. À valider avec un vrai libellé
      // d'événement de finalisation si disponible.
      const stageIndex = (stage.index === 4 && livraisonEvent && !stage.alea) ? 5 : stage.index;
      const dossierName = safeString(linkedEvents[0]?.DOSSIER) || dossier.interlocuteur || `Dossier ${dossier.numDossier}`;

      // Cas fréquent : un technicien fait l'analyse et porte le ticket, mais
      // la finalisation (mise en place / migration MX) est planifiée sur un
      // autre technicien. On le repère en comparant le responsable de
      // l'événement de livraison au technicien du dossier.
      const livraisonAssignee = livraisonEvent ? normalizeTechName(livraisonEvent.RESPONSABLE, techList) : null;
      const livraisonDifferentTech = !!(livraisonAssignee && livraisonAssignee !== 'Inconnu' && livraisonAssignee !== effectiveTechName);

      // "Cas particulier" : deux types possibles, on prend le plus proche
      // dans le temps si les deux existent.
      //  1. Formation ADAPPS — rattachée au même OFFER_ID que la livraison,
      //     et planifiée dans les 60 jours qui suivent (pas au-delà).
      //  2. Intervention matérielle sur site — l'OFFER_ID n'étant pas fiable
      //     pour ce cas, on rapproche par numéro de dossier à la place, sans
      //     limite de 60 jours (délai non précisé pour ce cas).
      const offerId = safeString(livraisonEvent?.OFFER_ID || analysisEvent?.OFFER_ID || '');
      const afterDate = livraisonEvent?._date || parseDateSafe(analysisEvent?.DATE);
      const maxFormationDate = afterDate ? new Date(afterDate.getTime() + 60 * 24 * 60 * 60 * 1000) : null;
      const candidates = [];

      if (offerId && afterDate) {
        (specialEventsData || [])
          .filter(e => safeString(e.TYPE_EVENEMENT) === 'Formation')
          .filter(e => stripAccents(e.EVENEMENT).toLowerCase().includes('adapps'))
          .filter(e => safeString(e.OFFER_ID) === offerId)
          .forEach(e => {
            const d = parseDateSafe(e.DATE);
            if (d && d > afterDate && (!maxFormationDate || d <= maxFormationDate)) {
              candidates.push({ label: safeString(e.EVENEMENT), date: d, kind: 'formation', assignee: safeString(e.RESPONSABLE) });
            }
          });
      }

      if (afterDate) {
        (specialEventsData || [])
          .filter(e => safeString(e.TYPE_EVENEMENT) === 'Technique')
          .filter(e => stripAccents(e.EVENEMENT).toLowerCase().includes('materiel'))
          .filter(e => safeString(e.NUMDOSSIER) === dossier.numDossier)
          .forEach(e => {
            const d = parseDateSafe(e.DATE);
            if (d && d > afterDate) {
              candidates.push({ label: safeString(e.EVENEMENT), date: d, kind: 'materiel', assignee: safeString(e.RESPONSABLE) });
            }
          });
      }

      candidates.sort((a, b) => a.date - b.date);
      const casParticulier = candidates[0] || null;

      // Ticket lié à la migration : même dossier, même technicien, motif
      // "[IAD] - Préparation Avocatmail" (ligne de suivi du travail de
      // préparation, distincte de la ligne utilisée pour l'étape courante).
      const dossierTickets = allTicketsByDossier.get(dossier.numDossier) || [];
      const linkedTicketRaw = dossierTickets.find(t => safeString(t.MOTIF).startsWith('[IAD] - Préparation Avocatmail'));
      const notesRow = linkedTicketRaw ? (ticketNotesData || []).find(n => String(n.TICKET_ID) === String(linkedTicketRaw.NUMERO_INCIDENT)) : null;
      const linkedTicket = linkedTicketRaw ? {
        motif: safeString(linkedTicketRaw.MOTIF),
        categorie: safeString(linkedTicketRaw.CATEGORIE),
        etat: safeString(linkedTicketRaw.ETAT_PRIORITE),
        interlocuteur: safeString(linkedTicketRaw.INTERLOCUTEUR),
        creeLe: parseDateSafe(linkedTicketRaw.CREE_LE),
        derniereAction: parseDateSafe(linkedTicketRaw.DERNIERE_ACTION),
        reporteLe: parseDateSafe(linkedTicketRaw.REPORTE_LE),
        dureeMinutes: Number(linkedTicketRaw.DUREE_MINUTES) || 0,
        nbRappelsClient: Number(linkedTicketRaw.NB_RAPPELS_CLIENT) || 0,
        notes: notesRow ? safeString(notesRow.NOTES_CLEAN) : ''
      } : null;

      return {
        ...dossier,
        dossierName,
        stageIndex,
        alea: stage.alea,
        analysisDate: parseDateSafe(analysisEvent?.DATE),
        livraisonDate: livraisonEvent?._date || null,
        livraisonAssignee,
        livraisonDifferentTech,
        casParticulier,
        linkedTicket
      };
    }).sort((a, b) => (a.stageIndex || 0) - (b.stageIndex || 0));
  }, [encoursData, backofficeData, specialEventsData, ticketNotesData, effectiveTechName, techList]);

  // Filtre + tri par étape appliqués à l'affichage, indépendamment du calcul brut
  const displayedMigrations = useMemo(() => {
    let list = migrationStageFilter ? myMigrations.filter(m => m.stageIndex === migrationStageFilter) : myMigrations;
    list = [...list].sort((a, b) => migrationSortDir === 'asc' ? (a.stageIndex || 0) - (b.stageIndex || 0) : (b.stageIndex || 0) - (a.stageIndex || 0));
    return list;
  }, [myMigrations, migrationStageFilter, migrationSortDir]);

  // Regroupement pour la "Vue par étape" : les dossiers en aléa (attente/
  // bloqué/suspendu) sortent de leur étape numérique pour former leur propre
  // groupe transversal, plutôt que de se mélanger avec les dossiers qui
  // avancent normalement à cette même étape.
  const groupedMigrations = useMemo(() => {
    const groupDefs = [
      { key: 'stage-1', label: "Migrations en attente d'analyse" },
      { key: 'stage-2', label: "Migrations en cours de préparation" },
      { key: 'stage-3', label: "Migrations en cours de copie / à planifier" },
      { key: 'stage-4', label: "Migrations prêtes pour finalisation" },
      { key: 'stage-5', label: "Migrations en cours de livraison" },
      { key: 'alea', label: "Migration en attente d'un retour client et/ou bloquées" }
    ];
    const buckets = new Map(groupDefs.map(g => [g.key, []]));
    displayedMigrations.forEach(m => {
      const key = m.alea ? 'alea' : `stage-${m.stageIndex}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(m);
    });
    return groupDefs.map(g => ({ ...g, items: buckets.get(g.key) || [] })).filter(g => g.items.length > 0);
  }, [displayedMigrations]);

  // --- RELANCES : formatage du prompt à copier vers Copilot (Outlook / Copilot Chat) ---
  const buildRelancePrompt = (rows) => {
    const lignes = rows.map((r, i) => {
      const parts = [`${i + 1}. Cabinet ${r.CABINET || 'Inconnu'}`];
      if (r.CONTACT_CLIENT) parts.push(`contact ${r.CONTACT_CLIENT}`);
      const details = [];
      if (r.MOTIF) details.push(`motif : ${r.MOTIF}`);
      if (r.JOURS_SANS_MAJ !== undefined && r.JOURS_SANS_MAJ !== null) details.push(`sans nouvelles depuis ${r.JOURS_SANS_MAJ} jours`);
      if (r.RELANCES) details.push(`déjà relancé ${r.RELANCES} fois`);
      return parts.join(' — ') + (details.length ? `\n   ${details.join(' — ')}` : '');
    }).join('\n');

    return `Prépare-moi des brouillons de relance pour les cabinets suivants,\nen t'appuyant sur mes derniers échanges mail avec chacun d'eux :\n\n${lignes}\n\nPour chaque cabinet : retrouve le fil de discussion correspondant,\nrédige un message de relance courtois qui mentionne le motif ci-dessus,\net laisse le brouillon en attente de mon envoi.`;
  };

  const copyRelancePrompt = async (rows) => {
    if (!rows || rows.length === 0) return;
    const text = buildRelancePrompt(rows);
    try {
      await navigator.clipboard.writeText(text);
      showToast(`Prompt copié (${rows.length} cabinet${rows.length > 1 ? 's' : ''}).`, 'success');
    } catch (e) {
      console.error("Erreur copie presse-papiers:", e);
      showToast("Impossible de copier le prompt (presse-papiers indisponible).", 'error');
    }
  };

  const toggleRelanceSelection = (ticketId) => {
    setRelanceSelection(prev => {
      const next = new Set(prev);
      if (next.has(ticketId)) next.delete(ticketId); else next.add(ticketId);
      return next;
    });
  };

  const relanceSelectedRows = useMemo(() => {
    return (relancesData || []).filter(r => relanceSelection.has(r.TICKET_ID));
  }, [relancesData, relanceSelection]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4 lg:p-6 animate-in fade-in duration-500 relative">
      <header className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/70 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-2.5 rounded-full ring-1 ring-blue-100">{isLoading ? <Loader className="w-5 h-5 text-blue-600 animate-spin" /> : <Activity className="w-5 h-5 text-blue-600" />}</div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">Pilotage Migrations</h1>
            <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
              <span>{selectedTech === 'Tous' ? "Vue Équipe" : `Focus: ${selectedTech}`}</span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Calendar size={11} />
                Scope : {weightsConfig.date_range_start ? new Date(weightsConfig.date_range_start).toLocaleDateString('fr-FR') : '—'} → {weightsConfig.date_range_end ? new Date(weightsConfig.date_range_end).toLocaleDateString('fr-FR') : '—'}
              </span>
              {lastSyncTime && (
                <>
                  <span className="text-slate-300">•</span>
                  <button
                    onClick={() => fetchBusinessData({ start: weightsConfig.date_range_start, end: weightsConfig.date_range_end }, techList, { forceRefresh: true })}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors disabled:opacity-50"
                    title="Recharger les données"
                  >
                    <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
                    Synchro {lastSyncTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {/* --- Barre d'actions desktop --- */}
        <div className="hidden md:flex gap-2 items-center">
            {isAdmin && (
              <div className="relative">
                <button
                  onClick={() => { setIsTeamManagerOpen(o => !o); setIsDateScopeOpen(false); }}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Gérer l'équipe"
                >
                  <Users size={20} />
                </button>
                {isTeamManagerOpen && (
                  <TeamManagerPanel techList={techList} newTechName={newTechName} setNewTechName={setNewTechName} onAdd={handleAddTech} onRemove={handleRemoveTech} onClose={() => setIsTeamManagerOpen(false)} />
                )}
              </div>
            )}
            {isAdmin && (
              <div className="relative">
                <button
                  onClick={() => { setDateScopeDraft({ start: weightsConfig.date_range_start, end: weightsConfig.date_range_end }); setIsDateScopeOpen(o => !o); setIsTeamManagerOpen(false); }}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Modifier le scope de dates"
                >
                  <Calendar size={20} />
                </button>
                {isDateScopeOpen && (
                  <DateScopePanel dateScopeDraft={dateScopeDraft} setDateScopeDraft={setDateScopeDraft} onApply={handleApplyDateScope} onClose={() => setIsDateScopeOpen(false)} isSaving={isSavingDateScope} />
                )}
              </div>
            )}
            <button onClick={() => setIsRulesModalOpen(true)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Règles de calcul"><Info size={20} /></button>
            <UserButton />
            <div className="relative">
                <Filter className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                <select value={selectedTech} onChange={(e) => { setSelectedTech(e.target.value); }} className="pl-7 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 text-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
                    <option value="Tous">Tous les techs</option>
                    {techList.map(tech => (<option key={tech} value={tech}>{tech}</option>))}
                </select>
            </div>
            {(selectedMonth || showPlanning) && (<button onClick={() => { setSelectedMonth(null); setShowPlanning(false); setChartMode('months'); }} className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-red-100 transition-colors border border-red-100"><X className="w-3 h-3" /> Retour Vue Globale</button>)}
        </div>

        {/* --- Barre d'actions mobile : tout regroupé derrière un bouton "Filtres" --- */}
        <div className="flex md:hidden items-center gap-2">
            <button onClick={() => setIsRulesModalOpen(true)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Règles de calcul"><Info size={18} /></button>
            <UserButton />
            <button
              onClick={() => setIsMobileFiltersOpen(o => !o)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${isMobileFiltersOpen || selectedTech !== 'Tous' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
            >
              <SlidersHorizontal size={14} /> Filtres
            </button>
        </div>
      </header>

      {isMobileFiltersOpen && (
        <div className="md:hidden mb-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Technicien</label>
            <select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)} className="w-full pl-3 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 text-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="Tous">Tous les techs</option>
                {techList.map(tech => (<option key={tech} value={tech}>{tech}</option>))}
            </select>
          </div>
          {isAdmin && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Scope de dates</label>
              <div className="flex items-center gap-2">
                <input type="date" value={dateScopeDraft.start || ''} onChange={(e) => setDateScopeDraft(d => ({ ...d, start: e.target.value }))} className="flex-1 text-sm border border-slate-200 rounded-md py-2 px-2" />
                <span className="text-slate-400 text-xs">→</span>
                <input type="date" value={dateScopeDraft.end || ''} onChange={(e) => setDateScopeDraft(d => ({ ...d, end: e.target.value }))} className="flex-1 text-sm border border-slate-200 rounded-md py-2 px-2" />
              </div>
              <button onClick={() => handleApplyDateScope()} disabled={isSavingDateScope} className="mt-2 w-full px-3 py-2 text-xs bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                {isSavingDateScope ? <Loader size={12} className="animate-spin" /> : <Save size={12} />} Appliquer le scope
              </button>
            </div>
          )}
          {(selectedMonth || showPlanning) && (
            <button onClick={() => { setSelectedMonth(null); setShowPlanning(false); setChartMode('months'); }} className="w-full flex items-center justify-center gap-1 bg-red-50 text-red-600 px-3 py-2 rounded-md text-xs font-medium hover:bg-red-100 transition-colors border border-red-100"><X className="w-3 h-3" /> Retour Vue Globale</button>
          )}
        </div>
      )}

      <div className="flex gap-1 mb-4 bg-slate-100/70 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeView === 'dashboard' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Vue équipe
        </button>
        <button
          onClick={() => setActiveView('mine')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeView === 'mine' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Mes migrations
          {myMigrations.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px]">{myMigrations.length}</span>}
        </button>
        <button
          onClick={() => setActiveView('relances')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeView === 'relances' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Relances
          {relancesData.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px]">{relancesData.length}</span>}
        </button>
      </div>

      {activeView === 'dashboard' && (
      <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div onClick={() => { setShowPlanning(!showPlanning); setSelectedMonth(null); setChartMode('months'); }} className={`px-4 py-3 rounded-xl shadow-sm border flex flex-col justify-center cursor-pointer transition-all duration-200 gap-3 ${showPlanning ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-white border-slate-200/70 hover:bg-slate-50'}`}>
            <PipeProgress label="Prêt pour Mise en Place" count={planningCount} colorClass="text-indigo-600" barColor="bg-indigo-500" />
            <PipeProgress label="Prêt pour Analyse" count={analysisPipeCount} colorClass="text-cyan-600" barColor="bg-cyan-500" />
        </div>
        <KPICard title="Besoin Total (h)" value={kpiStats.besoin.toFixed(0)} subtext={chartMode !== 'months' ? "Restant" : "Annuel"} icon={Users} colorClass={COLORS.text_besoin} active={chartMode !== 'months'} isLoading={isLoading}/>
        <KPICard title="Capacité (h)" value={kpiStats.capacite.toFixed(0)} subtext="Planifiée" icon={Clock} colorClass={COLORS.text_capacite} active={chartMode !== 'months'} isLoading={isLoading}/>
        <KPICard title="Taux Couverture" value={`${kpiStats.ratio.toFixed(0)}%`} subtext="Capa. / Besoin" icon={TrendingUp} colorClass={kpiStats.ratio >= 100 ? COLORS.text_ok : COLORS.text_danger} active={chartMode !== 'months'} isLoading={isLoading}/>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/70 mb-4">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg flex-wrap">
                <button onClick={() => toggleViewMode('months')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${chartMode === 'months' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Vue Annuelle (Mois)</button>
                <button onClick={() => toggleViewMode('weeks-month')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${chartMode === 'weeks-month' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Vue Détaillée (Semaines)</button>
                <button onClick={() => toggleViewMode('weeks-all')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${chartMode === 'weeks-all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Toutes les Semaines</button>
            </div>
            {chartMode === 'weeks-month' && (
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
          {isLoading ? (
            <div className="h-full w-full flex items-end gap-2 px-2 pb-1">
              {[40, 65, 50, 80, 35, 60, 45, 70, 55, 30, 75, 48].map((h, i) => (
                <div key={i} className="flex-1 h-full flex items-end">
                  <Skeleton className="w-full" style={{ height: `${h}%` }} />
                </div>
              ))}
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={mainChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} onClick={handleChartClick} barGap={3} barCategoryGap={chartMode === 'weeks-all' ? '20%' : '30%'}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              {chartMode === 'weeks-all' && monthBands.filter(b => b.shaded).map((b, i) => (
                <ReferenceArea
                  key={i}
                  x1={b.start}
                  x2={b.end}
                  fill="#F1F5F9"
                  fillOpacity={0.6}
                  ifOverflow="visible"
                  label={{ value: b.label, position: 'insideTop', fontSize: 10, fill: '#94a3b8' }}
                />
              ))}
              <XAxis 
                dataKey={chartMode === 'months' ? "month" : chartMode === 'weeks-all' ? "dateLabel" : "label"} 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#64748b', fontSize: 10}} 
                dy={chartMode === 'weeks-all' ? 0 : 5}
                angle={chartMode === 'weeks-all' ? -45 : 0}
                textAnchor={chartMode === 'weeks-all' ? 'end' : 'middle'}
                height={chartMode === 'weeks-all' ? 45 : 30}
                tickFormatter={(val) => chartMode === 'months' ? formatMonthShort(val) : val}
                interval={0} 
              />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
              <Bar stackId="a" dataKey="besoin" fill={COLORS.besoin} radius={[0, 0, 0, 0]} barSize={chartMode === 'weeks-month' ? 28 : chartMode === 'weeks-all' ? 14 : 18}>
                {mainChartData.map((entry, i) => (<Cell key={i} fillOpacity={entry.isPast ? 0.3 : 1} />))}
              </Bar>
              <Bar stackId="a" dataKey="besoin_encours" fill={COLORS.encours} radius={[3, 3, 0, 0]} barSize={chartMode === 'weeks-month' ? 28 : chartMode === 'weeks-all' ? 14 : 18}>
                {mainChartData.map((entry, i) => (<Cell key={i} fillOpacity={entry.isPast ? 0.3 : 1} />))}
              </Bar>
              <Bar stackId="b" dataKey="capacite" fill={COLORS.capacite} radius={[3, 3, 0, 0]} barSize={chartMode === 'weeks-month' ? 28 : chartMode === 'weeks-all' ? 14 : 18}>
                {mainChartData.map((entry, i) => (<Cell key={i} fillOpacity={entry.isPast ? 0.3 : 1} />))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
          )}
        </div>
        {chartMode === 'months' && <p className="text-[10px] text-center text-slate-400 italic mt-1">Cliquez sur un mois pour voir le détail par semaine</p>}
        {chartMode === 'months' && monthlyAggregatedData.some(m => m.isCurrentMonthPartial) && (
          <p className="text-[10px] text-center text-slate-400 italic">Mois en cours : seule la capacité/besoin restant à partir d'aujourd'hui est comptabilisé.</p>
        )}
        {chartMode !== 'months' && mainChartData.some(w => w.isPast) && (
          <p className="text-[10px] text-center text-slate-400 italic mt-1">Semaines grisées : déjà passées, exclues des totaux ci-dessus.</p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 overflow-hidden mb-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button onClick={() => setIsDetailListExpanded(!isDetailListExpanded)} className="w-full px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors">
          <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /><h2 className="text-sm font-bold text-slate-800">Détail des Opérations {selectedTech !== 'Tous' ? `: ${selectedTech}` : "(Tous)"}</h2><span className="ml-2 text-xs font-normal text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">{filteredAndSortedEvents.length} entrées</span></div>
          {isDetailListExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>
        {isDetailListExpanded && (
          <div className="px-4 py-2 border-b border-slate-100 bg-white">
            <div className="relative max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un client / dossier..."
                className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        )}
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
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={`skeleton-${i}`}>
                      <td className="px-2 py-2"><Skeleton className="h-3 w-16" /></td>
                      <td className="px-2 py-2"><Skeleton className="h-3 w-24" /></td>
                      <td className="px-2 py-2"><Skeleton className="h-3 w-28" /></td>
                      <td className="px-2 py-2"><Skeleton className="h-3 w-20" /></td>
                      <td className="px-2 py-2"><Skeleton className="h-3 w-10 ml-auto" /></td>
                      <td className="px-2 py-2"><Skeleton className="h-3 w-14 mx-auto" /></td>
                    </tr>
                  ))
                ) : (
                  <>
                    {paginatedEvents.map((event, index) => (
                      <tr 
                          key={index} 
                          className={`transition-colors ${
                              event.ageWarning === 'red' ? 'bg-red-100 hover:bg-red-200' : 
                              event.ageWarning === 'orange' ? 'bg-orange-100 hover:bg-orange-200' : 
                              'hover:bg-slate-50'
                          }`}
                          title={event.creeLeFormatted && event.creeLeFormatted !== "N/A" ? `Créé le : ${event.creeLeFormatted}` : ""}
                      >
                        <td className="px-2 py-1 font-medium text-slate-800 whitespace-nowrap">{event.date === "N/A" ? "En attente" : new Date(event.date).toLocaleDateString('fr-FR')}</td>
                        <td className="px-2 py-1 whitespace-nowrap truncate max-w-[150px]">{event.tech}</td>
                        <td className="px-2 py-1 font-medium text-slate-700 whitespace-nowrap truncate max-w-[200px]">{event.client}</td>
                        <td className="px-2 py-1 text-slate-500 whitespace-nowrap">{event.type}</td>
                        <td className="px-2 py-1 text-right font-medium whitespace-nowrap">{event.duration > 0 ? event.duration.toFixed(2) : '-'}</td>
                        <td className="px-2 py-1 text-center whitespace-nowrap"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeColor(event.color)}`}>{event.status}</span></td>
                      </tr>
                    ))}
                    {filteredAndSortedEvents.length === 0 && (<tr><td colSpan="6" className="px-4 py-8 text-center text-slate-400 italic">Aucun événement trouvé.</td></tr>)}
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}
        {isDetailListExpanded && !isLoading && filteredAndSortedEvents.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
            <span>
              {(currentPage - 1) * DETAIL_TABLE_PAGE_SIZE + 1}–{Math.min(currentPage * DETAIL_TABLE_PAGE_SIZE, filteredAndSortedEvents.length)} sur {filteredAndSortedEvents.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded border border-slate-200 bg-white font-medium hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Précédent
              </button>
              <span className="font-medium text-slate-600">Page {currentPage} / {totalDetailPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalDetailPages, p + 1))}
                disabled={currentPage === totalDetailPages}
                className="px-2 py-1 rounded border border-slate-200 bg-white font-medium hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 overflow-hidden h-fit">
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 overflow-hidden mb-16">
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
                    <td className="px-4 py-2 font-medium text-slate-800 capitalize">
                        {row.label}
                        {row.isCurrentMonthPartial && <span className="ml-1.5 text-[9px] font-bold uppercase text-blue-500 bg-blue-50 px-1 py-0.5 rounded align-middle">restant</span>}
                    </td>
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
      </>
      )}

      {activeView === 'mine' && (
        <div style={uiTheme !== 'default' ? { background: AURORA_THEMES[uiTheme === 'aurora-dark' ? 'dark' : 'light'].page, borderRadius: 16, padding: 16, margin: '-4px' } : undefined}>
          <div className="mb-4 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className={`text-base font-bold ${uiTheme !== 'default' ? '' : 'text-slate-800'}`} style={uiTheme !== 'default' ? { color: AURORA_THEMES[uiTheme === 'aurora-dark' ? 'dark' : 'light'].text } : undefined}>Mes migrations en cours</h2>
              <p className={`text-xs mt-0.5 ${uiTheme !== 'default' ? '' : 'text-slate-500'}`} style={uiTheme !== 'default' ? { color: AURORA_THEMES[uiTheme === 'aurora-dark' ? 'dark' : 'light'].sub } : undefined}>
                {effectiveTechName === 'Inconnu'
                  ? "Votre nom n'a pas été reconnu dans l'équipe technique — vérifiez la correspondance avec votre profil Clerk."
                  : `Suivi des dossiers actifs assignés à ${effectiveTechName}, basé sur la catégorie du ticket.`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isAdmin && (
                <>
                  <div className="relative">
                    <button
                      onClick={() => { setDateScopeDraft({ start: weightsConfig.date_range_start, end: weightsConfig.date_range_end }); setIsDateScopeOpen(o => !o); }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                      title="Élargir ou réduire la période affichée"
                    >
                      <Calendar size={13} /> Scope de dates
                    </button>
                    {isDateScopeOpen && (
                      <DateScopePanel dateScopeDraft={dateScopeDraft} setDateScopeDraft={setDateScopeDraft} onApply={handleApplyDateScope} onClose={() => setIsDateScopeOpen(false)} isSaving={isSavingDateScope} />
                    )}
                  </div>
                  <button
                    onClick={handleQuickYearScope}
                    disabled={isSavingDateScope}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50"
                    title="Élargit le scope à 6 mois avant / 6 mois après aujourd'hui"
                  >
                    {isSavingDateScope ? <Loader size={13} className="animate-spin" /> : <CalendarClock size={13} />} Voir toute l'année
                  </button>
                </>
              )}
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Visualiser en tant que</label>
              <select
                value={viewAsTech || ''}
                onChange={(e) => setViewAsTech(e.target.value || null)}
                className="text-sm border border-slate-200 rounded-md py-1.5 px-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Moi ({currentTechName})</option>
                {techList.map(tech => (<option key={tech} value={tech}>{tech}</option>))}
              </select>
            </div>
          </div>
          {myMigrations.length > 0 && (
            <div className="flex items-center gap-1 mb-3 bg-slate-100/70 p-1 rounded-lg w-fit">
              <button
                onClick={() => setUiThemeAndPersist('default')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${uiTheme === 'default' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Thème par défaut
              </button>
              <button
                onClick={() => setUiThemeAndPersist('aurora-light')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${uiTheme === 'aurora-light' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Thème Secib clair
              </button>
              <button
                onClick={() => setUiThemeAndPersist('aurora-dark')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${uiTheme === 'aurora-dark' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Thème Secib sombre
              </button>
            </div>
          )}
          {myMigrations.length > 0 && (
            <div className="flex items-center gap-1 mb-3 bg-slate-100/70 p-1 rounded-lg w-fit">
              <button
                onClick={() => setMigrationDisplayMode('grouped')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${migrationDisplayMode === 'grouped' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Vue par étape
              </button>
              <button
                onClick={() => setMigrationDisplayMode('list')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${migrationDisplayMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Vue liste
              </button>
            </div>
          )}
          {myMigrations.length > 0 && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <div className="relative">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                <select
                  value={migrationStageFilter || ''}
                  onChange={(e) => setMigrationStageFilter(e.target.value ? Number(e.target.value) : null)}
                  className="pl-7 pr-3 py-1.5 text-xs bg-white border border-slate-200 text-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Toutes les étapes</option>
                  {MIGRATION_STAGES.map((s, i) => (<option key={s.key} value={i + 1}>{s.label}</option>))}
                </select>
              </div>
              {migrationDisplayMode === 'list' && (
                <button
                  onClick={() => setMigrationSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 transition-colors"
                  title="Inverser l'ordre de tri par étape"
                >
                  {migrationSortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                  Étape {migrationSortDir === 'asc' ? '1 → 5' : '5 → 1'}
                </button>
              )}
              {migrationStageFilter && (
                <span className="text-[11px] text-slate-400">{displayedMigrations.length} dossier{displayedMigrations.length > 1 ? 's' : ''}</span>
              )}
            </div>
          )}
          {myMigrations.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200/80 text-center text-sm text-slate-400 italic">
              Aucun dossier actif trouvé pour le moment.
            </div>
          ) : displayedMigrations.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200/80 text-center text-sm text-slate-400 italic">
              Aucun dossier à cette étape.
            </div>
          ) : migrationDisplayMode === 'grouped' ? (
            <div className="space-y-4">
              {groupedMigrations.map(group => {
                if (uiTheme !== 'default') {
                  const t = AURORA_THEMES[uiTheme === 'aurora-dark' ? 'dark' : 'light'];
                  return (
                    <div key={group.key} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden' }}>
                      <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${t.border}` }}>
                        <p style={{ fontSize: 12, fontWeight: 500, color: t.text, margin: 0 }}>{group.label}</p>
                        <span style={{ fontSize: 10, color: t.sub }}>{group.items.length}</span>
                      </div>
                      {group.items.map(m => (
                        <MigrationRowAurora
                          key={m.numDossier}
                          migration={m}
                          theme={uiTheme === 'aurora-dark' ? 'dark' : 'light'}
                          isExpanded={expandedDossier === m.numDossier}
                          onToggle={() => setExpandedDossier(expandedDossier === m.numDossier ? null : m.numDossier)}
                        />
                      ))}
                    </div>
                  );
                }
                return (
                  <div key={group.key} className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-600">{group.label}</p>
                      <span className="text-[10px] text-slate-400">{group.items.length}</span>
                    </div>
                    {group.items.map(m => (
                      <MigrationRow
                        key={m.numDossier}
                        migration={m}
                        isExpanded={expandedDossier === m.numDossier}
                        onToggle={() => setExpandedDossier(expandedDossier === m.numDossier ? null : m.numDossier)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          ) : uiTheme !== 'default' ? (
            <div style={{ background: AURORA_THEMES[uiTheme === 'aurora-dark' ? 'dark' : 'light'].card, border: `1px solid ${AURORA_THEMES[uiTheme === 'aurora-dark' ? 'dark' : 'light'].border}`, borderRadius: 14, overflow: 'hidden' }}>
              {displayedMigrations.map(m => (
                <MigrationRowAurora
                  key={m.numDossier}
                  migration={m}
                  theme={uiTheme === 'aurora-dark' ? 'dark' : 'light'}
                  isExpanded={expandedDossier === m.numDossier}
                  onToggle={() => setExpandedDossier(expandedDossier === m.numDossier ? null : m.numDossier)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              {displayedMigrations.map(m => (
                <MigrationRow
                  key={m.numDossier}
                  migration={m}
                  isExpanded={expandedDossier === m.numDossier}
                  onToggle={() => setExpandedDossier(expandedDossier === m.numDossier ? null : m.numDossier)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'relances' && (
        <div>
          <div className="mb-4 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-base font-bold text-slate-800">Cabinets à relancer</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tickets ouverts triés par priorité de relance (silence prolongé + relances déjà effectuées + statut "attente client"). Score interne, ajustable si besoin.
              </p>
            </div>
            {relanceSelection.size > 0 && (
              <button
                onClick={() => copyRelancePrompt(relanceSelectedRows)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Copy size={13} /> Copier le prompt ({relanceSelection.size})
              </button>
            )}
          </div>
          {relancesData.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200/80 text-center text-sm text-slate-400 italic">
              {isLoading ? "Chargement..." : "Aucun ticket à relancer sur le scope de dates actuel."}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-600">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-3 py-2 w-8"></th>
                      <th className="px-3 py-2 font-semibold">Cabinet</th>
                      <th className="px-3 py-2 font-semibold">Contact</th>
                      <th className="px-3 py-2 font-semibold">Motif</th>
                      <th className="px-3 py-2 font-semibold">Technicien</th>
                      <th className="px-3 py-2 font-semibold text-right">Sans MAJ</th>
                      <th className="px-3 py-2 font-semibold text-right">Relances</th>
                      <th className="px-3 py-2 font-semibold text-center">Attente client</th>
                      <th className="px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {relancesData.map((r) => (
                      <tr key={r.TICKET_ID} className={`hover:bg-slate-50 transition-colors ${relanceSelection.has(r.TICKET_ID) ? 'bg-blue-50/50' : ''}`}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={relanceSelection.has(r.TICKET_ID)}
                            onChange={() => toggleRelanceSelection(r.TICKET_ID)}
                            className="cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">{r.CABINET}</td>
                        <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{r.CONTACT_CLIENT || '—'}</td>
                        <td className="px-3 py-2 text-slate-600 max-w-[260px] truncate" title={r.MOTIF}>{r.MOTIF || '—'}</td>
                        <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{r.TECHNICIEN || '—'}</td>
                        <td className="px-3 py-2 text-right font-medium whitespace-nowrap">{r.JOURS_SANS_MAJ} j</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">{r.RELANCES || 0}</td>
                        <td className="px-3 py-2 text-center">
                          {r.ATTENTE_CLIENT && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-100">Oui</span>}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => copyRelancePrompt([r])}
                            title="Copier le prompt de relance pour ce cabinet"
                            className="text-slate-400 hover:text-blue-600 transition-colors"
                          >
                            <Copy size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <RulesModal 
        isOpen={isRulesModalOpen} 
        onClose={() => setIsRulesModalOpen(false)} 
        userEmail={userEmail} 
        currentWeights={weightsConfig}
        onUpdateWeights={(newConfig) => { setWeightsConfig(newConfig); writeCache('config', newConfig, CONFIG_CACHE_TTL_MS); }}
        onToast={showToast}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
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
