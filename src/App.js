import React, { useState, useMemo, useEffect } from "react";
import {
  Laptop, Monitor, Shield, Calculator, FileText, ChevronDown, ChevronUp,
  Server, Plus, Minus, Trash2, Package, Gift, Box, Copy, Cloud, Mail,
  Wrench, Database, Briefcase, Crown, Wifi, Download, X, List, Cpu, Tv,
  ChevronLeft, ChevronRight, ZoomIn, CheckCircle, Check, ToggleLeft, ToggleRight,
  Layers, FolderUp, Users, ArrowDownRight, Link as LinkIcon, Activity, Terminal, 
  UserPlus, UserCheck, ShieldCheck, Lock, DatabaseZap
} from "lucide-react";

import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
  useAuth
} from "@clerk/clerk-react";

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

// --- CONSTANTES GLOBALES ---
const FRAIS_TEMPO_PRICE = 11.11;
const FRAIS_DEPLOYMENT_PRICE = 6.11;
const FIREWALL_DEPLOYMENT_PRICE = 13.75;
const DUAL_SCREEN_PRICE = 4.89;
const MIGRATION_MAIL_PRICE = 3.47;
const MIGRATION_CLOUD_PRICE = 3.47;

const SERVICE_CYBER = 14.17;
const SERVICE_MAINTENANCE = 15.0;
const SERVICE_ACCESSORIES = 1.08;

// --- TARIFS LICENCES ---

// 1. NOUVEAU CLIENT (Pack complet inclus)
const COLLAB_PREMIUM_PRICE = 24.67; 
const COLLAB_PREMIUM_SAVE_PRICE = 27.69;
const UPGRADE_DIFF_PRICE = COLLAB_PREMIUM_SAVE_PRICE - COLLAB_PREMIUM_PRICE;

// 2. CLIENT EXISTANT (Options à la carte - A AJUSTER)
const OPTION_UPGRADE_COLLAB_PRICE = 3.02; // Prix Upgrade vers Collab Premium
const OPTION_UPGRADE_SECU_PRICE = 4.50;   // Prix Upgrade vers Sécurité Avancée
const OPTION_BACKUP_PRICE = 3.02;         // Prix Option Sauvegarde (Global)
const GLOBAL_BACKUP_SETUP_PRICE = 6.94; 

// --- BANQUE D'IMAGES ---
const IMAGE_DB = {
  entry_14: ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/1f09f243-d7c1-432f-8d9b-767a7acaa0a0_1750x1285.jpg"],
  entry_16: ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/A23R4EA-ABF_3_1750x1285.jpg"],
  mid_14: ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_1750x1285.jpg"],
  mid_16: ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/539afc89-6121-42be-94c3-4c6ab5ea6c51_1750x1285.jpg"],
  high_flip: ["https://www.hp.com/ca-fr/shop/media/catalog/product/3/e/3ea6b621-3e66-4c0e-ae0d-7b1d5704e5a4.png?store=ca-fr&image-type=image&auto=avif&quality=100&format=jpg&bg-color=ffffff&type=image-product&width=960&fit=bounds"],
  high_std: ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68SNEA-ABF_1750x1285.jpg"],
  fixed_aio_27: ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/c08174144_1750x1285.jpg"],
  fixed_aio_24: ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/c08550764_1750x1285.jpg"],
  fixed_mini_8: ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/c08576880_1750x1285.jpg"],
  fixed_mini_4: ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/C61RVEA-ABF_1_1750x1285.jpg"],
};

const getImagesForConfigId = (configId) => {
  if (configId.startsWith("u5_14") || configId.startsWith("u7_14")) return IMAGE_DB["entry_14"] || [];
  if (configId.startsWith("u5_16") || configId.startsWith("u7_16")) return IMAGE_DB["entry_16"] || [];
  if (configId.startsWith("hp8_14")) return IMAGE_DB["mid_14"] || [];
  if (configId.startsWith("hp8_16")) return IMAGE_DB["mid_16"] || [];
  if (configId === "hp_flip") return IMAGE_DB["high_flip"] || [];
  if (configId === "hp_std" || configId === "hp_std_bis") return IMAGE_DB["high_std"] || [];
  if (configId.startsWith("aio_27")) return IMAGE_DB["fixed_aio_27"] || [];
  if (configId.startsWith("aio_24")) return IMAGE_DB["fixed_aio_24"] || [];
  if (configId.startsWith("mini_8")) return IMAGE_DB["fixed_mini_8"] || [];
  if (configId.startsWith("mini_4")) return IMAGE_DB["fixed_mini_4"] || [];
  return [];
};

// --- DONNÉES DES POSTES ---
const BASES = [
  {
    id: "entry", name: "Poste Entrée de Gamme", description: "Essentiel bureautique & mobilité standard.", color: "blue", icon: Laptop,
    commonServices: [{ name: "Abonnement Cyberdéfense", price: SERVICE_CYBER }, { name: "Maintenance matériel (SaaS)", price: SERVICE_MAINTENANCE }, { name: "Frais de déploiement", price: FRAIS_DEPLOYMENT_PRICE }, { name: "Services & Accessoires (Câbles...)", price: SERVICE_ACCESSORIES }],
    configs: [{ id: "u5_14", name: '14" U5 16Go', specs: "Pack Portable HP 4 G1i 14 AI Glacier - U5-225U (12 Tops) - 16Go - 512Go SSD - 14' - Win11 Pro", hardwarePrice: 30.86 }, { id: "u7_14", name: '14" U7 16Go', specs: "Pack Portable HP 4 G1i 14 AI Glacier - U7-255U (12 Tops) - 16Go - 512Go SSD - 14' - Win11 Pro", hardwarePrice: 35.11 }, { id: "u5_16", name: '16" U5 16Go', specs: "Pack Portable HP 4 G1i 16 AI Glacier - U5-225U (12 Tops) - 16Go - 512Go SSD - 16' - Win11 Pro", hardwarePrice: 31.08 }, { id: "u7_16", name: '16" U7 16Go', specs: "Pack Portable HP 4 G1i 16 AI Glacier - U7-255U (12 Tops) - 16Go - 512Go SSD - 16' - Win11 Pro", hardwarePrice: 35.33 }],
  },
  {
    id: "mid", name: "Poste Milieu de Gamme", description: "Performance multitâche & applications métiers.", color: "indigo", icon: Briefcase,
    commonServices: [{ name: "Abonnement Cyberdéfense", price: SERVICE_CYBER }, { name: "Maintenance matériel (SaaS)", price: SERVICE_MAINTENANCE }, { name: "Frais de déploiement", price: FRAIS_DEPLOYMENT_PRICE }, { name: "Services & Accessoires (Câbles...)", price: SERVICE_ACCESSORIES }],
    configs: [{ id: "hp8_14_u5_16", name: '14" U5 16Go', specs: "Pack Portable HP 8 G1i 14 AI Glacier - U5-225U (12 Tops) - 16Go - 512Go SSD - 14' - Win11 Pro", hardwarePrice: 38.0 }, { id: "hp8_14_u5_32", name: '14" U5 32Go', specs: "Pack Portable HP 8 G1i 14 AI Glacier - U5-225U (12 Tops) - 32Go - 512Go SSD - 14' - Win11 Pro", hardwarePrice: 40.72 }, { id: "hp8_14_u7_16", name: '14" U7 16Go', specs: "Pack Portable HP 8 G1i 14 AI Glacier - U7-255U (12 Tops) - 16Go - 512Go SSD - 14' - Win11 Pro", hardwarePrice: 42.5 }, { id: "hp8_14_u7_32", name: '14" U7 32Go', specs: "Pack Portable HP 8 G1i 14 AI Glacier - U7-255U (12 Tops) - 32Go - 512Go SSD - 14' - Win11 Pro", hardwarePrice: 45.22 }, { id: "hp8_16_u5_16", name: '16" U5 16Go', specs: "Pack Portable HP 8 G1i 16 AI Glacier - U5-225U (12 Tops) - 16Go - 512Go SSD - 16' - Win11 Pro", hardwarePrice: 40.0 }, { id: "hp8_16_u5_32", name: '16" U5 32Go', specs: "Pack Portable HP 8 G1i 16 AI Glacier - U5-225U (12 Tops) - 32Go - 512Go SSD - 16' - Win11 Pro", hardwarePrice: 42.72 }, { id: "hp8_16_u7_16", name: '16" U7 16Go', specs: "Pack Portable HP 8 G1i 16 AI Glacier - U7-255U (12 Tops) - 16Go - 512Go SSD - 16' - Win11 Pro", hardwarePrice: 44.5 }],
  },
  {
    id: "high", name: "Poste Haut de Gamme", description: "Puissance Direction & VIP.", color: "violet", icon: Crown,
    commonServices: [{ name: "Abonnement Cyberdéfense", price: SERVICE_CYBER }, { name: "Maintenance matériel (SaaS)", price: SERVICE_MAINTENANCE }, { name: "Frais de déploiement", price: FRAIS_DEPLOYMENT_PRICE }, { name: "Services & Accessoires (Câbles...)", price: SERVICE_ACCESSORIES }],
    configs: [{ id: "hp_flip", name: 'X-G1i Flip 14"', specs: "Pack Portable HP EliteBook (X-G1i Flip) - Tactile - Core Ultra 7 - 32Go - 1To SSD - Win11 Pro", hardwarePrice: 70.86 }, { id: "hp_std", name: 'X-G1i Std 14"', specs: "Pack Portable HP EliteBook (X-G1i Standard) - Non-Tactile - Core Ultra 7 - 32Go - 1To SSD - Win11 Pro", hardwarePrice: 68.5 }, { id: "hp_std_bis", name: 'X-G1i Std 14" (Opt)', specs: "Pack Portable HP EliteBook (X-G1i Standard) - Non-Tactile - Core Ultra 7 - 32Go - 1To SSD - Win11 Pro", hardwarePrice: 72.8 }],
  },
  {
    id: "fixed", name: "Poste Fixe (Desktop)", description: "Station de travail sédentaire performante.", color: "slate", icon: Server,
    commonServices: [{ name: "Abonnement Cyberdéfense", price: SERVICE_CYBER }, { name: "Maintenance matériel (SaaS)", price: SERVICE_MAINTENANCE }, { name: "Frais de déploiement", price: FRAIS_DEPLOYMENT_PRICE }, { name: "Services & Accessoires (Câbles...)", price: SERVICE_ACCESSORIES }],
    configs: [{ id: "mini_4_u5", name: "Mini 4 G1i (U5)", specs: "HP Elite Mini 400 G1i - Core Ultra 5 - 16Go - 512Go SSD - Win11 Pro (Sans écran)", hardwarePrice: 32.5 }, { id: "mini_8_u7", name: "Mini 8 G1i (U7)", specs: "HP Elite Mini 800 G1i - Core Ultra 7 - 32Go - 512Go SSD - Win11 Pro (Sans écran)", hardwarePrice: 38.5 }, { id: "aio_24_u5", name: 'AIO 24" (U5)', specs: "HP EliteOne 840 G9/G1i AIO 24' - Core Ultra 5 - 16Go - 512Go SSD - Ecran Tactile - Win11 Pro", hardwarePrice: 36.5 }, { id: "aio_24_u7", name: 'AIO 24" (U7)', specs: "HP EliteOne 840 G9/G1i AIO 24' - Core Ultra 7 - 32Go - 512Go SSD - Ecran Tactile - Win11 Pro", hardwarePrice: 40.0 }, { id: "aio_27_u5", name: 'AIO 27" (U5)', specs: "HP EliteOne 870 G9/G1i AIO 27' - Core Ultra 5 - 16Go - 512Go SSD - Ecran Non-Tactile - Win11 Pro", hardwarePrice: 41.2 }, { id: "aio_27_u7", name: 'AIO 27" (U7)', specs: "HP EliteOne 870 G9/G1i AIO 27' - Core Ultra 7 - 32Go - 1To SSD - Ecran Non-Tactile - Win11 Pro", hardwarePrice: 45.8 }],
  },
];

const OPTIONS = [
  { id: "screen", name: "Pack Confort Visuel", icon: <Monitor className="w-6 h-6" />, monthlyPrice: 11.92, color: "purple", assetCount: 2, hasDeployment: false, details: ["Écran LED HP (EliteDisplay 23.8)", "Station d'accueil HP (TB 100W G6)", "Kit Clavier souris HP"] },
  { id: "switch", name: "Pack Connectivité", icon: <Server className="w-6 h-6" />, monthlyPrice: 11.94, color: "emerald", assetCount: 1, hasDeployment: true, deploymentPrice: FRAIS_DEPLOYMENT_PRICE, details: ["Switch ARUBA (1820-24G)", "Frais de déploiement", "Câblage RJ45 Cat6 (1m & 3m)"] },
  { id: "wifi", name: "Pack Wifi", icon: <Wifi className="w-6 h-6" />, monthlyPrice: 24.72, color: "cyan", assetCount: 1, hasDeployment: true, deploymentPrice: FRAIS_DEPLOYMENT_PRICE, details: ["Borne Wifi Watchguard AP130", "Licence Wifi management (3 ans)", "Power Supply AP130", "Frais de déploiement", "Câblage RJ45 Cat6"] },
  { id: "firewall", name: "Pack Firewall", icon: <Shield className="w-6 h-6" />, monthlyPrice: 78.87, color: "red", assetCount: 1, hasDeployment: true, deploymentPrice: FIREWALL_DEPLOYMENT_PRICE, details: ["Boitier WatchGuard (Firebox T25-W)", "Licence APT Blocker (3 ans)", "Frais de déploiement (Config Sécu)", "Câblage RJ45 Cat6"] },
  { id: "mig_sharepoint", name: "Migration vers SharePoint Online", icon: <FolderUp className="w-6 h-6" />, monthlyPrice: 27.50, color: "blue", assetCount: 0, hasDeployment: false, isService: true, details: ["Prestation pour migrer partage de fichiers serveur vers Sharepoint Online."] },
  { id: "mig_teams", name: "Migration d'une équipe Teams", icon: <Users className="w-6 h-6" />, monthlyPrice: 3.47, color: "indigo", assetCount: 0, hasDeployment: false, isService: true, details: ["Prestation pour migrer une équipe Teams d'un tenant Microsoft365 à un autre.", "Ajouter en quantité le nombre d'équipe Teams à migrer."] },
];

const ImageCarousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  if (!images || images.length === 0) return (<div className="w-32 h-24 md:w-40 md:h-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-300 border border-slate-200"><Box size={24} /></div>);
  const nextImage = (e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev + 1) % images.length); };
  const prevImage = (e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev - 1 + images.length) % images.length); };
  const openZoom = (e) => { e.stopPropagation(); setIsZoomed(true); };
  const closeZoom = (e) => { e.stopPropagation(); setIsZoomed(false); setCurrentIndex(0); };
  return (
    <>
      <div className="relative group w-32 h-24 md:w-40 md:h-32 shrink-0 cursor-pointer" onClick={openZoom}>
        <div className="w-full h-full rounded-lg overflow-hidden border border-slate-200 bg-white"><img src={images[currentIndex]} alt="Product" className="w-full h-full object-contain p-1" /></div>
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"><ZoomIn size={16} className="text-slate-600" /></div>
        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 rounded-full">{currentIndex + 1}/{images.length}</div>
      </div>
      {isZoomed && (<div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={closeZoom}><div className="relative max-w-5xl w-full flex flex-col items-center justify-center gap-4"><img src={images[currentIndex]} alt="Zoom product" className="max-w-full max-h-[75vh] object-contain rounded-md shadow-2xl" onClick={(e) => e.stopPropagation()} /><div className="flex items-center gap-6 bg-black/50 px-6 py-2 rounded-full backdrop-blur-sm" onClick={(e) => e.stopPropagation()}><button className="text-white hover:text-blue-400 transition-colors" onClick={prevImage}><ChevronLeft size={32} /></button><span className="text-white font-medium min-w-[50px] text-center">{currentIndex + 1} / {images.length}</span><button className="text-white hover:text-blue-400 transition-colors" onClick={nextImage}><ChevronRight size={32} /></button></div><button className="absolute top-[-40px] right-0 text-white/70 hover:text-white" onClick={closeZoom}><X size={32} /></button></div></div>)}
    </>
  );
};

const getThemeClasses = (color, isActive, isExistingClient) => {
  const existingClientThemes = {
    iconBg: "bg-emerald-100 text-emerald-700",
    text: "text-emerald-700",
    badge: "bg-emerald-600 text-white",
    activeContainer: "border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500 shadow-md",
    activeBorder: "border-emerald-500"
  };

  const newClientThemes = {
    blue: { iconBg: "bg-blue-100 text-blue-600", text: "text-blue-600", badge: "bg-blue-600 text-white", activeContainer: "border-blue-500 bg-blue-50/20 ring-1 ring-blue-500 shadow-md", activeBorder: "border-blue-500" },
    indigo: { iconBg: "bg-indigo-100 text-indigo-600", text: "text-indigo-600", badge: "bg-indigo-600 text-white", activeContainer: "border-indigo-500 bg-indigo-50/20 ring-1 ring-indigo-500 shadow-md", activeBorder: "border-indigo-500" },
    violet: { iconBg: "bg-violet-100 text-violet-600", text: "text-violet-600", badge: "bg-violet-600 text-white", activeContainer: "border-violet-500 bg-violet-50/20 ring-1 ring-violet-500 shadow-md", activeBorder: "border-violet-500" },
    slate: { iconBg: "bg-slate-200 text-slate-700", text: "text-slate-700", badge: "bg-slate-700 text-white", activeContainer: "border-slate-500 bg-slate-50/20 ring-1 ring-slate-500 shadow-md", activeBorder: "border-slate-500" },
    purple: { iconBg: "bg-purple-100 text-purple-600", text: "text-purple-600", badge: "bg-purple-600 text-white", activeContainer: "border-purple-500 bg-purple-50/30 ring-1 ring-purple-500 shadow-md", activeBorder: "border-purple-500" },
    emerald: { iconBg: "bg-emerald-100 text-emerald-600", text: "text-emerald-600", badge: "bg-emerald-600 text-white", activeContainer: "border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500 shadow-md", activeBorder: "border-emerald-500" },
    cyan: { iconBg: "bg-cyan-100 text-cyan-600", text: "text-cyan-600", badge: "bg-cyan-600 text-white", activeContainer: "border-cyan-500 bg-cyan-50/30 ring-1 ring-cyan-500 shadow-md", activeBorder: "border-cyan-500" },
    red: { iconBg: "bg-red-100 text-red-600", text: "text-red-600", badge: "bg-red-600 text-white", activeContainer: "border-red-500 bg-red-50/30 ring-1 ring-red-500 shadow-md", activeBorder: "border-red-500" },
  };

  const theme = isExistingClient ? existingClientThemes : (newClientThemes[color] || newClientThemes.blue);
  return { iconBg: theme.iconBg, text: theme.text, badge: isActive ? theme.badge : "hidden", container: isActive ? theme.activeContainer : "border-slate-200 bg-white hover:border-slate-300 shadow-sm", border: isActive ? theme.activeBorder : "border-slate-200" };
};

const PriceTag = ({ price, period = "/mois", originalPrice = null, isUpgrade = false }) => (
  <div className="flex flex-col items-end">
    {originalPrice !== null && ( <span className="text-xs text-slate-400 line-through decoration-slate-400"> {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(originalPrice)} </span> )}
    <span className={`font-bold ${isUpgrade ? "text-emerald-600" : "text-slate-800"}`}>
      {isUpgrade && "+"}
      {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(price)}
      <span className="text-xs font-normal text-gray-500">{period}</span>
    </span>
  </div>
);

const QuantitySelector = ({ value, onChange, min = 0, max = Infinity, disabled = false }) => (
  <div className={`flex items-center gap-3 bg-slate-100 rounded-lg p-1 ${disabled ? "opacity-50" : ""}`}>
    <button onClick={(e) => { e.stopPropagation(); onChange(Math.max(min, value - 1)); }} className={`p-2 rounded-md transition-colors ${value <= min || disabled ? "text-slate-300 cursor-not-allowed" : "bg-white text-slate-700 shadow-sm hover:bg-slate-50"}`} disabled={value <= min || disabled}><Minus size={14} /></button>
    <span className="font-bold text-slate-900 w-6 text-center">{value}</span>
    <button onClick={(e) => { e.stopPropagation(); if (value < max) onChange(value + 1); }} className={`p-2 rounded-md transition-colors ${value >= max || disabled ? "text-slate-300 cursor-not-allowed" : "bg-white text-blue-600 shadow-sm hover:bg-blue-50"}`} disabled={value >= max || disabled}><Plus size={14} /></button>
  </div>
);

const AssetGauge = ({ count, threshold = 10, isExistingClient }) => {
  const percentage = Math.min(100, (count / threshold) * 100);
  const isComplete = count >= threshold;
  const remaining = Math.max(0, threshold - count);
  const barColor = isExistingClient ? (isComplete ? "bg-emerald-600" : "bg-emerald-400") : (isComplete ? "bg-green-500" : "bg-blue-500");
  
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2"><Package size={18} className="text-slate-600" /><span className="font-bold text-slate-700 text-sm">Volume Parc (Assets)</span></div>
        <span className={`text-sm font-bold ${isComplete ? "text-green-600" : "text-slate-500"}`}>{count} / {threshold}</span>
      </div>
      <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden mb-2"><div className={`h-full transition-all duration-500 ease-out ${barColor}`} style={{ width: `${percentage}%` }} /></div>
      <div className="flex items-start gap-2 text-xs">
        {isComplete ? ( <><Gift size={14} className="text-green-600 mt-0.5 shrink-0" /><span className="text-green-700 font-medium">Palier atteint ! Frais Tempo (Forfait Logistique) offerts.</span></> ) : ( <span className="text-slate-500">Ajoutez encore <strong>{remaining}</strong> éléments pour débloquer la gratuité des Frais Tempo.</span> )}
      </div>
    </div>
  );
};

// INITIALISATION SÉCURISÉE AVEC LES CLÉS DES OPTIONS POUR CHAQUE GAMME
const INITIAL_QUANTITIES = {
  screen: 0, dual_screen: 0, switch: 0, firewall: 0, wifi: 0, fixed_screen: 0,
  entry_mig_mail: 0, entry_mig_cloud: 0, mid_mig_mail: 0, mid_mig_cloud: 0, high_mig_mail: 0, high_mig_cloud: 0, fixed_mig_mail: 0, fixed_mig_cloud: 0,
  mig_sharepoint: 0, mig_teams: 0,
  // Initialisation explicite des upgrades par gamme pour éviter le "bug du 1"
  entry_upgrade_collab: 0, entry_upgrade_secu: 0,
  mid_upgrade_collab: 0, mid_upgrade_secu: 0,
  high_upgrade_collab: 0, high_upgrade_secu: 0,
  fixed_upgrade_collab: 0, fixed_upgrade_secu: 0,
};
BASES.forEach((b) => b.configs.forEach((c) => (INITIAL_QUANTITIES[c.id] = 0)));

function LeasingSimulator() {
  const [clientName, setClientName] = useState("");
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [quantities, setQuantities] = useState(INITIAL_QUANTITIES);
  
  // --- STATES OPTIONS ---
  const [includeBackup, setIncludeBackup] = useState(false); 

  const [activeConfigTab, setActiveConfigTab] = useState({ entry: 0, mid: 0, high: 0, fixed: 0 });
  const [expandedItems, setExpandedItems] = useState({});
  const [showGlobalDetails, setShowGlobalDetails] = useState(false);

  // --- NOUVEAU STATE : MODE CLIENT ---
  const [isExistingClient, setIsExistingClient] = useState(false);
  
  // --- NOUVEAUX ÉTATS POUR LES COMPTEURS D'ABONNEMENTS ACTUELS AVEC NOMS ---
  const [currentSecurityName, setCurrentSecurityName] = useState("");
  const [currentSecurityCount, setCurrentSecurityCount] = useState(0);
  const [currentM365Name, setCurrentM365Name] = useState("");
  const [currentM365Count, setCurrentM365Count] = useState(0);

  // --- ÉTATS POUR SNOWFLAKE & DEBUG ---
  const [snowflakeData, setSnowflakeData] = useState(null);
  const [isDebugOpen, setIsDebugOpen] = useState(false); 
  const { getToken } = useAuth(); 

  const totalAssets = useMemo(() => {
    let count = 0;
    BASES.forEach((b) => { b.configs.forEach((c) => (count += quantities[c.id] || 0)); });
    OPTIONS.forEach((opt) => { if(opt.assetCount > 0) { count += (quantities[opt.id] || 0) * opt.assetCount; } });
    count += quantities["dual_screen"] || 0; 
    count += quantities["fixed_screen"] || 0;
    return count;
  }, [quantities]);

  const isModeLocked = totalAssets > 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        if (!token) return; 
        const response = await fetch('/api/getData', { headers: { Authorization: `Bearer ${token}` } });
        const json = await response.json();
        setSnowflakeData(json);
      } catch (error) { console.error("Erreur Fetch Snowflake:", error); setSnowflakeData({ error: error.message }); }
    };
    fetchData();
  }, [getToken]);

  const toggleItemDetail = (id) => { setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] })); };
  const updateActiveConfigTab = (baseId, configIndex) => { setActiveConfigTab((prev) => ({ ...prev, [baseId]: configIndex })); };

  const getTotalQtyForBase = (baseId) => {
    const base = BASES.find((b) => b.id === baseId);
    if (!base) return 0;
    return base.configs.reduce((sum, config) => sum + (quantities[config.id] || 0), 0);
  };

  const updateQuantity = (key, newVal) => {
    setQuantities((prev) => {
      const newState = { ...prev, [key]: newVal };
      
      // Sécurité : On s'assure que les upgrades ne dépassent pas la quantité de postes de la gamme
      // Si on réduit le nombre de postes, on doit potentiellement réduire les upgrades associés
      ["entry", "mid", "high", "fixed"].forEach((baseId) => {
        const base = BASES.find((b) => b.id === baseId);
        const belongs = base.configs.some((c) => c.id === key);
        
        if (belongs) {
          const newBaseTotal = base.configs.reduce((sum, c) => sum + (newState[c.id] || 0), 0);
          
          // Vérification Upgrades
          if (newState[`${baseId}_upgrade_collab`] > newBaseTotal) newState[`${baseId}_upgrade_collab`] = newBaseTotal;
          if (newState[`${baseId}_upgrade_secu`] > newBaseTotal) newState[`${baseId}_upgrade_secu`] = newBaseTotal;
          
          // Vérification Migrations
          if (newState[`${baseId}_mig_mail`] > newBaseTotal) newState[`${baseId}_mig_mail`] = newBaseTotal;
          if (newState[`${baseId}_mig_cloud`] > newBaseTotal) newState[`${baseId}_mig_cloud`] = newBaseTotal;
        }
      });

      // Logique existante pour les écrans et autres
      if (key.startsWith("mini") || key.startsWith("aio")) {
        const fixedBase = BASES.find((b) => b.id === "fixed");
        const newFixedTotal = fixedBase.configs.reduce((sum, c) => sum + (newState[c.id] || 0), 0);
        if (newState.fixed_screen > newFixedTotal * 2) { newState.fixed_screen = newFixedTotal * 2; }
      }
      if (key === "screen" && newState.dual_screen > newVal) { newState.dual_screen = newVal; }
      if (key === "fixed_screen") {
        const fixedBase = BASES.find((b) => b.id === "fixed");
        const currentFixedTotal = fixedBase.configs.reduce((sum, c) => sum + (prev[c.id] || 0), 0);
        if (newVal > currentFixedTotal * 2) return prev;
      }

      return newState;
    });
  };

  const resetAll = () => {
    setQuantities(INITIAL_QUANTITIES);
    setActiveConfigTab({ entry: 0, mid: 0, high: 0, fixed: 0 });
    setExpandedItems({});
    setClientName("");
    setIncludeBackup(false);
    setShowProposalModal(false);
    setCurrentSecurityName("");
    setCurrentSecurityCount(0);
    setCurrentM365Name("");
    setCurrentM365Count(0);
  };

  const totalWorkstations = useMemo(() => {
    let count = 0;
    BASES.forEach((b) => { b.configs.forEach((c) => (count += quantities[c.id] || 0)); });
    return count;
  }, [quantities]);

  const isFraisTempoWaived = totalAssets >= 10;
  const isFraisTempoDue = !isFraisTempoWaived && totalAssets > 0;

  const getTotalMigMail = () => (quantities.entry_mig_mail || 0) + (quantities.mid_mig_mail || 0) + (quantities.high_mig_mail || 0) + (quantities.fixed_mig_mail || 0);
  const getTotalMigCloud = () => (quantities.entry_mig_cloud || 0) + (quantities.mid_mig_cloud || 0) + (quantities.high_mig_cloud || 0) + (quantities.fixed_mig_cloud || 0);

  // --- LOGIQUE DE PRIX ---
  const getPosteFullMonthlyPrice = (base, config, withBackup) => {
    const fixedServicesPrice = base.commonServices.reduce((acc, s) => acc + s.price, 0);
    
    let collabPrice = 0;
    // Si Nouveau Client : Prix pack complet inclus
    if (!isExistingClient) {
        collabPrice = withBackup ? COLLAB_PREMIUM_SAVE_PRICE : COLLAB_PREMIUM_PRICE;
    } else {
        // Si Client Existant : Juste le backup s'il est global (pour les postes renouvelés)
        if(withBackup) collabPrice = OPTION_BACKUP_PRICE;
    }

    return config.hardwarePrice + fixedServicesPrice + collabPrice;
  };

  const totals = useMemo(() => {
    let monthly = 0;
    BASES.forEach((base) => {
      base.configs.forEach((config) => {
        const qty = quantities[config.id] || 0;
        if (qty > 0) {
          const unitPrice = getPosteFullMonthlyPrice(base, config, includeBackup);
          monthly += unitPrice * qty;
        }
      });
      
      // Ajout des Upgrades spécifiques à la gamme
      if (isExistingClient) {
          monthly += (quantities[`${base.id}_upgrade_collab`] || 0) * OPTION_UPGRADE_COLLAB_PRICE;
          monthly += (quantities[`${base.id}_upgrade_secu`] || 0) * OPTION_UPGRADE_SECU_PRICE;
      }
    });

    if (isFraisTempoDue) { monthly += FRAIS_TEMPO_PRICE; }
    ["entry", "mid", "high", "fixed"].forEach(baseId => {
         const base = BASES.find(b => b.id === baseId);
         if(base) {
            monthly += (quantities[`${baseId}_mig_mail`] || 0) * MIGRATION_MAIL_PRICE;
            monthly += (quantities[`${baseId}_mig_cloud`] || 0) * MIGRATION_CLOUD_PRICE;
         }
    });
    if (includeBackup && totalWorkstations > 0) { monthly += GLOBAL_BACKUP_SETUP_PRICE; }
    
    OPTIONS.forEach((opt) => { monthly += opt.monthlyPrice * (quantities[opt.id] || 0); });
    monthly += DUAL_SCREEN_PRICE * (quantities.dual_screen || 0);
    monthly += DUAL_SCREEN_PRICE * (quantities.fixed_screen || 0);
    
    const sharepointOpt = OPTIONS.find(o => o.id === "mig_sharepoint");
    if(sharepointOpt) monthly += (quantities.mig_sharepoint || 0) * sharepointOpt.monthlyPrice;
    const teamsOpt = OPTIONS.find(o => o.id === "mig_teams");
    if(teamsOpt) monthly += (quantities.mig_teams || 0) * teamsOpt.monthlyPrice;
    
    return { monthly: monthly, total36: monthly * 36 };
  }, [quantities, isFraisTempoDue, includeBackup, totalWorkstations, isExistingClient]);

  const hasSelection = totals.monthly > 0;

  const downloadProposalTxt = () => {
    try {
      const date = new Date().toLocaleDateString("fr-FR");
      const safeClientName = clientName || "Client";
      const typeClient = isExistingClient ? "CLIENT EXISTANT (Renouvellement)" : "NOUVEAU CLIENT";
      let content = `OFFRE DE LOCATION EVOLUTIVE - TEMPO\nDate : ${date}\nClient : ${safeClientName}\nType : ${typeClient}\n--------------------------------------------------\n\n1. DETAIL DES BUNDLES COMPLETS\n`;
      BASES.forEach((base) => {
        const upgradeCollabQty = quantities[`${base.id}_upgrade_collab`] || 0;
        const upgradeSecuQty = quantities[`${base.id}_upgrade_secu`] || 0;

        base.configs.forEach((config) => {
          const qty = quantities[config.id];
          if (qty > 0) {
            content += `\n[BUNDLE] ${base.name} - ${config.name} (x${qty})\n`;
            content += `  - MATERIEL : ${config.specs} -> ${config.hardwarePrice.toFixed(2)} EUR/mois\n`;
            base.commonServices.forEach(s => { content += `  - SERVICE : ${s.name} -> ${s.price.toFixed(2)} EUR/mois\n`; });
            
            let collabLine = "";
            if (!isExistingClient) {
                const collabName = includeBackup ? "Pack Collaboratif Premium + Sauvegarde M365" : "Pack Collaboratif Premium";
                const collabPrice = includeBackup ? COLLAB_PREMIUM_SAVE_PRICE : COLLAB_PREMIUM_PRICE;
                collabLine = `  - LICENCE : ${collabName} -> ${collabPrice.toFixed(2)} EUR/mois\n`;
            } else {
                if(includeBackup) collabLine = `  - OPTION : Option Sauvegarde M365 (Global) (+${OPTION_BACKUP_PRICE.toFixed(2)} EUR)\n`;
                else collabLine = `  - LICENCE : Standard (Renouvellement Matériel uniquement)\n`;
            }
            content += collabLine;

            const migMailQty = quantities[`${base.id}_mig_mail`] || 0;
            if (migMailQty > 0) content += `  - PRODUIT ASSOCIE : Migration AvocatMail (x${migMailQty}) -> ${MIGRATION_MAIL_PRICE} EUR/mois\n`;
            const migCloudQty = quantities[`${base.id}_mig_cloud`] || 0;
            if (migCloudQty > 0) content += `  - PRODUIT ASSOCIE : Migration OneDrive (x${migCloudQty}) -> ${MIGRATION_CLOUD_PRICE} EUR/mois\n`;
            if (base.id === "fixed" && quantities.fixed_screen > 0) { content += `  - PRODUIT ASSOCIE : Option Ecran pour Fixe (x${quantities.fixed_screen}) -> ${DUAL_SCREEN_PRICE} EUR/mois\n`; }
          }
        });

        // Affichage des upgrades spécifiques à cette base dans le txt
        if (isExistingClient) {
            if (upgradeCollabQty > 0) content += `  - OPTION GAMME : Pack Collaboratif Premium (x${upgradeCollabQty}) : ${OPTION_UPGRADE_COLLAB_PRICE.toFixed(2)} EUR/mois\n`;
            if (upgradeSecuQty > 0) content += `  - OPTION GAMME : Pack Sécurité Avancé Microsoft365 (x${upgradeSecuQty}) : ${OPTION_UPGRADE_SECU_PRICE.toFixed(2)} EUR/mois\n`;
        }
      });

      if (quantities.screen > 0) {
          const optScreen = OPTIONS.find(o => o.id === 'screen');
          content += `\n[BUNDLE] ${optScreen.name} (x${quantities.screen})\n`;
          content += `  - MATERIEL : Ecrans & Docking -> ${optScreen.monthlyPrice.toFixed(2)} EUR/mois\n`;
          if (quantities.dual_screen > 0) { content += `  - OPTION : Dual Screen (x${quantities.dual_screen}) -> ${DUAL_SCREEN_PRICE.toFixed(2)} EUR/mois\n`; }
      }
      OPTIONS.filter((o) => quantities[o.id] > 0 && !o.isService && o.id !== 'screen').forEach((opt) => { content += `\n[BUNDLE] ${opt.name} (x${quantities[opt.id]}) -> ${opt.monthlyPrice.toFixed(2)} EUR/mois\n`; });
      
      content += `\n3. PRESTATIONS & FRAIS GLOBAUX\n`;
      if (isFraisTempoDue) { content += `- Frais Tempo (Forfait Logistique Projet) x1 : ${FRAIS_TEMPO_PRICE.toFixed(2)} EUR/mois\n`; }
      if (includeBackup && totalWorkstations > 0) { content += `- Prestation: Mise en place Sauvegarde (Forfait Projet) x1 : ${GLOBAL_BACKUP_SETUP_PRICE.toFixed(2)} EUR/mois\n`; }
      if (quantities.mig_sharepoint > 0) { const opt = OPTIONS.find(o => o.id === "mig_sharepoint"); content += `- ${opt.name} x${quantities.mig_sharepoint} : ${(opt.monthlyPrice * quantities.mig_sharepoint).toFixed(2)} EUR/mois\n`; }
      if (quantities.mig_teams > 0) { const opt = OPTIONS.find(o => o.id === "mig_teams"); content += `- ${opt.name} x${quantities.mig_teams} : ${(opt.monthlyPrice * quantities.mig_teams).toFixed(2)} EUR/mois\n`; }
      content += `\n--------------------------------------------------\nTOTAL LOYER MENSUEL : ${totals.monthly.toFixed(2)} EUR HT\nDUREE : 36 mois\nCOUT TOTAL CONTRAT : ${totals.total36.toFixed(2)} EUR HT\n`;
      const element = document.createElement("a");
      const file = new Blob([content], { type: "text/plain;charset=utf-8" });
      element.href = URL.createObjectURL(file);
      element.download = `Offre_TEMPO_${safeClientName.replace(/\s+/g, "_")}_${date.replace(/\//g, "-")}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) { console.error("Erreur génération TXT:", error); alert("Erreur lors de la génération du fichier."); }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 relative">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg text-white transition-colors ${isExistingClient ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                <Calculator size={24} />
            </div>
            <div>
                <h1 className="text-xl font-bold text-slate-900">Configurateur offre TEMPO</h1>
                <p className={`text-xs font-medium transition-colors ${isExistingClient ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {isExistingClient ? "Mode : Client Existant (Renouvellement)" : "Mode : Nouveau Client"}
                </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* SWITCH CLIENT TYPE */}
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200" title={isModeLocked ? "Veuillez réinitialiser la sélection pour changer de mode" : ""}>
                <button 
                    disabled={isModeLocked}
                    onClick={() => { 
                        if (!isModeLocked) {
                            setIsExistingClient(false); 
                            setIncludeBackup(false); 
                            // Reset quantities handled by global logic if needed, but quantities map handles it
                        }
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${!isExistingClient ? 'bg-white text-blue-700 shadow-sm' : (isModeLocked ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-700')}`}
                >
                    {isModeLocked && isExistingClient ? <Lock size={12} /> : <UserPlus size={14} />} Nouveau
                </button>
                <button 
                    disabled={isModeLocked}
                    onClick={() => {
                        if (!isModeLocked) setIsExistingClient(true);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${isExistingClient ? 'bg-white text-emerald-700 shadow-sm' : (isModeLocked ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-700')}`}
                >
                    {isModeLocked && !isExistingClient ? <Lock size={12} /> : <UserCheck size={14} />} Existant
                </button>
            </div>

            <div className="text-right hidden sm:block">
                <p className="text-sm text-slate-500">Client</p>
                <input type="text" placeholder="Entreprise..." value={clientName} onChange={(e) => setClientName(e.target.value)} className="text-right font-medium border-none focus:ring-0 p-0 text-slate-800 placeholder-slate-400 bg-transparent w-40" />
            </div>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><span className="bg-slate-200 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span><h2 className="text-lg font-bold">Sélectionner les postes</h2></div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${isExistingClient ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>Mix possible dans chaque gamme</span>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {BASES.map((base) => {
                const totalBaseQty = getTotalQtyForBase(base.id);
                const isExpanded = expandedItems[base.id];
                // Thème dynamique selon le mode client
                const theme = getThemeClasses(base.color, totalBaseQty > 0, isExistingClient);
                const Icon = base.icon;
                const activeIndex = activeConfigTab[base.id];
                const activeConfig = base.configs[activeIndex];
                const activeConfigImages = getImagesForConfigId(activeConfig.id);
                const activeDisplayPrice = getPosteFullMonthlyPrice(base, activeConfig, includeBackup);
                const isFixedPost = base.id === "fixed";

                const upgradeCollabKey = `${base.id}_upgrade_collab`;
                const upgradeSecuKey = `${base.id}_upgrade_secu`;

                return (
                  <div key={base.id} className="space-y-2">
                    <div className={`relative rounded-xl border-2 transition-all duration-200 overflow-hidden ${theme.container}`}>
                      {(!isExistingClient && includeBackup && totalBaseQty > 0) && (
                        <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg z-10 flex items-center gap-1 shadow-sm">
                            <Check size={10} /> Pack Save M365 Actif
                        </div>
                      )}
                      
                      {/* En mode existant, la sauvegarde est aussi indiquée ici si activée */}
                      {(isExistingClient && includeBackup && totalBaseQty > 0) && (
                        <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg z-10 flex items-center gap-1 shadow-sm">
                            <Check size={10} /> Option Save Active
                        </div>
                      )}

                      <div className="p-4 flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Icon className={`w-8 h-8 ${theme.text}`} />
                            <div><h3 className="font-bold text-slate-900">{base.name}</h3><p className="text-xs text-slate-500">{base.description}</p></div>
                            {totalBaseQty > 0 && ( <span className={`ml-auto md:ml-2 text-xs font-bold px-2 py-1 rounded-full ${theme.badge}`}>{totalBaseQty}</span> )}
                          </div>
                          <div className="mb-3 flex flex-wrap gap-2">
                            {base.configs.map((conf, idx) => {
                              const qty = quantities[conf.id] || 0;
                              return (
                                <button key={conf.id} onClick={() => updateActiveConfigTab(base.id, idx)} className={`text-[10px] font-semibold px-2 py-1 rounded-md border transition-all flex items-center gap-1.5 ${idx === activeIndex ? "bg-slate-800 text-white border-slate-800 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
                                  {conf.name}{qty > 0 && ( <span className={`text-[9px] px-1 rounded-full ${idx === activeIndex ? "bg-white text-slate-800" : "bg-slate-200 text-slate-700"}`}>{qty}</span> )}
                                </button>
                              );
                            })}
                          </div>
                          <div className="bg-slate-50/50 rounded-lg p-2 mb-2 border border-slate-100">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1"><Cpu size={14} className="text-slate-500" />Spécifications <span className="text-slate-400 font-normal">({activeConfig.name})</span> :</div>
                            <div className="text-xs text-slate-600 font-mono leading-relaxed">{activeConfig.specs}</div>
                          </div>
                          <div className={`flex items-center gap-1 text-xs font-medium cursor-pointer w-fit transition-colors ${isExistingClient ? 'text-emerald-600 hover:text-emerald-800' : 'text-slate-500 hover:text-blue-600'}`} onClick={() => toggleItemDetail(base.id)}>
                            {isExpanded ? "Masquer services" : "Voir services inclus"}{isExpanded ? ( <ChevronUp size={14} /> ) : ( <ChevronDown size={14} /> )}
                          </div>
                        </div>
                        <div className="flex items-center justify-center border-l border-r border-slate-100 px-2 md:px-4"><ImageCarousel images={activeConfigImages} /></div>
                        <div className="flex flex-row md:flex-col justify-between items-end gap-3 pl-0 md:pl-4 min-w-[120px]">
                          <div className="text-right">
                              <PriceTag price={activeDisplayPrice} />
                              <div className="text-[10px] text-slate-400 mt-1">Config : {activeConfig.name}</div>
                          </div>
                          <div className="flex flex-col items-end gap-1"><span className="text-[10px] text-slate-500 font-medium">Quantité</span><QuantitySelector value={quantities[activeConfig.id] || 0} onChange={(val) => updateQuantity(activeConfig.id, val)} /></div>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 text-xs">
                          <p className="font-semibold text-slate-700 mb-2 flex items-center gap-2"><Box size={14} /> Services & Logiciels inclus :</p>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
                            {base.commonServices.map((item, idx) => ( <li key={idx} className="flex items-start gap-2 text-slate-600"><CheckCircle size={12} className="mt-0.5 text-blue-400 shrink-0" /><span>{item.name}</span></li> ))}
                            
                            {!isExistingClient ? (
                                <li className={`flex items-start gap-2 font-medium ${includeBackup ? 'text-indigo-600' : 'text-blue-600'}`}>
                                    <CheckCircle size={12} className="mt-0.5 shrink-0" />
                                    <span>{includeBackup ? "Pack Collaboratif Premium + Sauvegarde M365" : "Pack Collaboratif Premium"}</span>
                                </li>
                            ) : (
                                // EN MODE EXISTANT, PAS DE PACK INCLUS DANS LE POSTE DE BASE
                                <li className="flex items-start gap-2 font-medium text-slate-400 italic">
                                    <span>Aucune licence incluse (Matériel seul)</span>
                                </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                    {isFixedPost && totalBaseQty > 0 && (
                      <div className="ml-4 md:ml-8 mb-2 bg-slate-100 border border-slate-200 rounded-lg p-3 flex items-center justify-between shadow-sm animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-2"><div className="text-slate-500 bg-white p-1.5 rounded border border-slate-200"><Tv size={16} /></div><div><h5 className="text-xs font-bold text-slate-900 leading-tight">Ajouter un écran HP 24"</h5><p className="text-9px text-slate-500 mt-0.5">Pour compléter la tour (Non inclus de base) - Max 2 par poste</p></div></div>
                        <div className="flex flex-col items-end gap-1"><span className="font-bold text-slate-700 text-xs">{DUAL_SCREEN_PRICE.toFixed(2)}€</span><div className="scale-90 origin-right"><QuantitySelector value={quantities.fixed_screen} onChange={(val) => updateQuantity("fixed_screen", val)} max={totalBaseQty * 2} /></div></div>
                      </div>
                    )}
                    {totalBaseQty > 0 && (
                      <div className="ml-4 md:ml-8 space-y-3 animate-in slide-in-from-top-2 fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center justify-between shadow-sm relative before:absolute before:left-[-18px] before:top-[-15px] before:w-[18px] before:h-[35px] before:border-l-2 before:border-b-2 before:border-slate-300 before:rounded-bl-lg">
                            <div className="flex items-center gap-2"><div className="text-orange-500 bg-white p-1.5 rounded border border-orange-100"><Mail size={16} /></div><div><h5 className="text-xs font-bold text-orange-900 leading-tight">Option Migration<br />AvocatMail</h5><p className="text-[9px] text-orange-700 mt-0.5 leading-tight italic">Nécessaire en cas de reprise de boite mail existante</p></div></div>
                            <div className="flex flex-col items-end gap-1"><span className="font-bold text-orange-700 text-xs">{MIGRATION_MAIL_PRICE.toFixed(2)}€</span><div className="scale-90 origin-right"><QuantitySelector value={quantities[`${base.id}_mig_mail`]} onChange={(val) => updateQuantity(`${base.id}_mig_mail`, val)} max={totalBaseQty} /></div></div>
                            </div>
                            <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 flex items-center justify-between shadow-sm relative md:before:hidden before:absolute before:left-[-18px] before:top-[-15px] before:w-[18px] before:h-[35px] before:border-l-2 before:border-b-2 before:border-slate-300 before:rounded-bl-lg">
                            <div className="flex items-center gap-2"><div className="text-sky-500 bg-white p-1.5 rounded border border-sky-100"><Cloud size={16} /></div><div><h5 className="text-xs font-bold text-sky-900 leading-tight">Option Migration<br />OneDrive</h5><p className="text-[9px] text-sky-700 mt-0.5 leading-tight italic">Nécessaire en cas de reprise de stockage cloud existant</p></div></div>
                            <div className="flex flex-col items-end gap-1"><span className="font-bold text-sky-700 text-xs">{MIGRATION_CLOUD_PRICE.toFixed(2)}€</span><div className="scale-90 origin-right"><QuantitySelector value={quantities[`${base.id}_mig_cloud`]} onChange={(val) => updateQuantity(`${base.id}_mig_cloud`, val)} max={totalBaseQty} /></div></div>
                            </div>
                        </div>

                        {/* --- OPTIONS SPÉCIFIQUES "CLIENT EXISTANT" (3 CARTES DISTINCTES) --- */}
                        {isExistingClient && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* OPTION 1 : UPGRADE COLLAB */}
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex flex-col justify-between shadow-sm h-full">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="text-emerald-600 bg-white p-1.5 rounded border border-emerald-100"><Users size={16} /></div>
                                        <div>
                                            <h5 className="text-xs font-bold text-emerald-900 leading-tight">Pack Collaboratif Premium</h5>
                                            <p className="text-[9px] text-emerald-700 mt-0.5">Mise à niveau licence</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="font-bold text-emerald-700 text-xs">+{OPTION_UPGRADE_COLLAB_PRICE.toFixed(2)}€</span>
                                        <div className="scale-90 origin-right">
                                            <QuantitySelector value={quantities[upgradeCollabKey] || 0} onChange={(val) => updateQuantity(upgradeCollabKey, val)} max={totalBaseQty} />
                                        </div>
                                    </div>
                                </div>

                                {/* OPTION 2 : UPGRADE SECU */}
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex flex-col justify-between shadow-sm h-full">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="text-emerald-600 bg-white p-1.5 rounded border border-emerald-100"><ShieldCheck size={16} /></div>
                                        <div>
                                            <h5 className="text-xs font-bold text-emerald-900 leading-tight">Pack Sécurité Avancé Microsoft365</h5>
                                            <p className="text-[9px] text-emerald-700 mt-0.5">Mise à niveau sécurité</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="font-bold text-emerald-700 text-xs">+{OPTION_UPGRADE_SECU_PRICE.toFixed(2)}€</span>
                                        <div className="scale-90 origin-right">
                                            <QuantitySelector value={quantities[upgradeSecuKey] || 0} onChange={(val) => updateQuantity(upgradeSecuKey, val)} max={totalBaseQty} />
                                        </div>
                                    </div>
                                </div>

                                {/* OPTION 3 : SAUVEGARDE (TOGGLE GLOBAL) */}
                                <div 
                                    className={`rounded-lg p-3 flex flex-col justify-between shadow-sm border transition-colors cursor-pointer h-full
                                    ${includeBackup ? 'bg-emerald-100 border-emerald-300 ring-1 ring-emerald-400' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                                    onClick={() => setIncludeBackup(!includeBackup)}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`p-1.5 rounded border ${includeBackup ? 'text-emerald-700 bg-white border-emerald-200' : 'text-slate-400 bg-white border-slate-200'}`}>
                                            <Database size={16} />
                                        </div>
                                        <div>
                                            <h5 className={`text-xs font-bold leading-tight ${includeBackup ? 'text-emerald-900' : 'text-slate-700'}`}>
                                                Option Sauvegarde M365 (Global)
                                            </h5>
                                            <p className={`text-[9px] mt-0.5 ${includeBackup ? 'text-emerald-700' : 'text-slate-500'}`}>Global (Tout le parc)</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`font-bold text-xs ${includeBackup ? 'text-emerald-800' : 'text-slate-400'}`}>
                                            +{OPTION_BACKUP_PRICE.toFixed(2)}€/p
                                        </span>
                                        {includeBackup ? (<ToggleRight className="text-emerald-600 w-8 h-8" />) : (<ToggleLeft className="text-slate-300 w-8 h-8" />)}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- OPTION STANDARD "NOUVEAU CLIENT" (SINGLE TOGGLE) --- */}
                        {!isExistingClient && (
                            <div 
                                className={`rounded-lg p-3 flex items-center justify-between shadow-sm border transition-colors cursor-pointer relative before:absolute before:left-[-18px] before:top-[-15px] before:w-[18px] before:h-[135%] before:border-l-2 before:border-b-2 before:border-slate-300 before:rounded-bl-lg
                                ${includeBackup ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                                onClick={() => setIncludeBackup(!includeBackup)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded border ${includeBackup ? 'text-indigo-600 bg-white border-indigo-100' : 'text-slate-400 bg-white border-slate-200'}`}>
                                        <Database size={16} />
                                    </div>
                                    <div>
                                        <h5 className={`text-xs font-bold leading-tight ${includeBackup ? 'text-indigo-900' : 'text-slate-700'}`}>
                                            Option Sauvegarde M365 (Global)
                                        </h5>
                                        <p className={`text-[9px] mt-0.5 leading-tight italic ${includeBackup ? 'text-indigo-700' : 'text-slate-500'}`}>
                                            Active la sauvegarde pour <strong>tous</strong> les postes du parc.
                                        </p>
                                        <span className="text-[8px] opacity-70 block mt-0.5">
                                            Passe le bundle à {COLLAB_PREMIUM_SAVE_PRICE}€/mois + Forfait Setup
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`font-bold text-xs ${includeBackup ? 'text-indigo-700' : 'text-slate-400'}`}>
                                        +{UPGRADE_DIFF_PRICE.toFixed(2)}€/poste
                                    </span>
                                    {includeBackup ? (<ToggleRight className="text-indigo-600 w-8 h-8" />) : (<ToggleLeft className="text-slate-300 w-8 h-8" />)}
                                </div>
                            </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button onClick={() => setShowGlobalDetails(!showGlobalDetails)} className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-colors"><span className="font-semibold text-slate-700 flex items-center gap-2"><FileText size={18} />Détail des coûts unitaires (Ventilation)</span>{showGlobalDetails ? ( <ChevronUp size={18} /> ) : ( <ChevronDown size={18} /> )}</button>
            {showGlobalDetails && (
              <div className="p-4 text-sm bg-white">
                <p className="text-xs text-slate-400 mb-4 italic">Note: Les prix ci-dessous s'entendent unitaire / mois.</p>
                {BASES.map((base) => {
                  const activeConfigs = base.configs.filter((c) => quantities[c.id] > 0);
                  if (activeConfigs.length === 0) return null;
                  return (
                    <div key={base.id} className="mb-6">
                      <h5 className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-2">{base.name}</h5>
                      {activeConfigs.map((config) => {
                        const fullPrice = getPosteFullMonthlyPrice(base, config, includeBackup);
                        return (
                          <div key={config.id} className="mb-4 pl-2 border-l-2 border-slate-100">
                            <div className="font-semibold text-slate-700 mb-1">{config.name} (x{quantities[config.id]})</div>
                            <table className="w-full text-left">
                              <tbody>
                                <tr className="text-slate-600 font-medium"><td className="py-1 flex items-center gap-2">Matériel</td><td className="py-1 text-right">{config.hardwarePrice.toFixed(2)} €</td></tr>
                                {base.commonServices.map((item, idx) => ( <tr key={`base-${idx}`} className={`text-slate-500 text-xs`}><td className="py-0.5 pl-4 flex items-center gap-2">- {item.name}</td><td className={`py-0.5 text-right`}>{item.price.toFixed(2)} €</td></tr> ))}
                                
                                <tr className={`text-xs ${isExistingClient ? 'text-emerald-600 font-medium' : (includeBackup ? 'text-indigo-600 font-medium' : 'text-blue-600')}`}>
                                    <td className="py-0.5 pl-4 flex items-center gap-2">
                                        - {isExistingClient 
                                            ? (includeBackup ? "Option Sauvegarde M365 (Global)" : "Aucune option liée au poste") 
                                            : (includeBackup ? "Pack Collaboratif Premium + Sauvegarde M365" : "Pack Collaboratif Premium")}
                                    </td>
                                    <td className="py-0.5 text-right">
                                        {isExistingClient 
                                            ? (includeBackup ? OPTION_BACKUP_PRICE.toFixed(2) : "0.00")
                                            : (includeBackup ? COLLAB_PREMIUM_SAVE_PRICE.toFixed(2) : COLLAB_PREMIUM_PRICE.toFixed(2))} €
                                    </td>
                                </tr>

                                <tr className="font-bold bg-slate-50"><td className="py-1 pl-2">Total Unitaire (Bundle)</td><td className="py-1 text-right pr-2 text-blue-600">{fullPrice.toFixed(2)} €</td></tr>
                              </tbody>
                            </table>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <AssetGauge count={totalAssets} isExistingClient={isExistingClient} />
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden sticky top-24">
            <div className={`p-6 relative text-white ${isExistingClient ? 'bg-emerald-900' : 'bg-slate-900'}`}>
              <h3 className="text-lg font-medium opacity-80 mb-1">Total Loyer Mensuel</h3>
              <div className="text-4xl font-bold tracking-tight">{totals.monthly.toFixed(2)} €<span className="text-lg font-normal text-white/60">/HT</span></div>
              <p className="text-xs text-white/60 mt-2">Engagement 36 mois</p>
            </div>
            <div className="p-6 space-y-4">
              {!hasSelection ? ( <div className="text-center py-8 text-slate-400"><p>Aucun élément sélectionné</p></div> ) : (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Votre sélection</div>
                  {BASES.map((base) => {
                    const activeConfigs = base.configs.filter((c) => quantities[c.id] > 0);
                    if (activeConfigs.length === 0) return null;
                    return activeConfigs.map((config) => {
                      const bundlePrice = getPosteFullMonthlyPrice(base, config, includeBackup);
                      const qty = quantities[config.id];
                      return ( <div key={config.id} className="flex justify-between text-sm items-start"><div className="text-slate-700"><span className="font-bold text-slate-900 mr-1">{qty}x</span>{base.name.replace("Poste ", "")} <span className="text-[10px] text-slate-400">({config.name})</span></div><span className="font-medium whitespace-nowrap">{(bundlePrice * qty).toFixed(2)} €</span></div> );
                    });
                  })}
                  
                  {/* --- AFFICHAGE SEPARE DES UPGRADES (EXISTING CLIENT) --- */}
                  {isExistingClient && BASES.map(base => {
                      const upCollab = quantities[`${base.id}_upgrade_collab`] || 0;
                      const upSecu = quantities[`${base.id}_upgrade_secu`] || 0;
                      if(upCollab === 0 && upSecu === 0) return null;
                      
                      return (
                        <div key={`upgrade-${base.id}`} className="border-t border-dashed border-slate-200 pt-1 mt-1">
                            {upCollab > 0 && (
                                <div className="flex justify-between text-sm items-start text-emerald-700 bg-emerald-50 px-2 py-1 rounded mb-1">
                                    <div><span className="font-bold mr-1">{upCollab}x</span>Pack Collaboratif Premium ({base.name.split(' ')[1]})</div>
                                    <span className="font-medium whitespace-nowrap">{(upCollab * OPTION_UPGRADE_COLLAB_PRICE).toFixed(2)} €</span>
                                </div>
                            )}
                            {upSecu > 0 && (
                                <div className="flex justify-between text-sm items-start text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                                    <div><span className="font-bold mr-1">{upSecu}x</span>Pack Sécurité Avancé Microsoft365 ({base.name.split(' ')[1]})</div>
                                    <span className="font-medium whitespace-nowrap">{(upSecu * OPTION_UPGRADE_SECU_PRICE).toFixed(2)} €</span>
                                </div>
                            )}
                        </div>
                      );
                  })}

                  {isFraisTempoDue && ( <div className="flex justify-between text-sm items-start text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200"><div><span className="font-bold mr-1">1x</span>Frais Tempo (Forfait)</div><span className="font-medium whitespace-nowrap">{FRAIS_TEMPO_PRICE.toFixed(2)} €</span></div> )}
                  
                  {includeBackup && totalWorkstations > 0 && (
                    <div className={`flex flex-col gap-1 p-2 rounded border ${isExistingClient ? 'bg-emerald-50 border-emerald-200' : 'bg-indigo-50 border-indigo-200'}`}>
                        <div className="flex justify-between items-center text-xs">
                            <span className={`font-medium flex items-center gap-1 ${isExistingClient ? 'text-emerald-700' : 'text-indigo-700'}`}><Wrench size={10}/> Setup Sauvegarde (Unique)</span>
                            <div className="text-right">
                                <span className={`${isExistingClient ? 'text-emerald-400' : 'text-indigo-400'} mr-2`}>1 x {GLOBAL_BACKUP_SETUP_PRICE.toFixed(2)}€</span>
                                <span className={`font-bold ${isExistingClient ? 'text-emerald-800' : 'text-indigo-800'}`}>{GLOBAL_BACKUP_SETUP_PRICE.toFixed(2)} €</span>
                            </div>
                        </div>
                    </div>
                  )}
                  
                  {getTotalMigMail() > 0 && ( <div className="flex justify-between text-sm items-start text-orange-700 bg-orange-50 px-2 py-1 rounded border border-orange-200"><div><span className="font-bold mr-1">{getTotalMigMail()}x</span>Migration AvocatMail</div><span className="font-medium whitespace-nowrap">{(MIGRATION_MAIL_PRICE * getTotalMigMail()).toFixed(2)} €</span></div> )}
                  {getTotalMigCloud() > 0 && ( <div className="flex justify-between text-sm items-start text-sky-700 bg-sky-50 px-2 py-1 rounded border border-sky-200"><div><span className="font-bold mr-1">{getTotalMigCloud()}x</span>Migration OneDrive</div><span className="font-medium whitespace-nowrap">{(MIGRATION_CLOUD_PRICE * getTotalMigCloud()).toFixed(2)} €</span></div> )}
                  
                  {OPTIONS.filter((o) => quantities[o.id] > 0).map((opt) => ( <div key={opt.id} className="flex justify-between text-sm items-start text-indigo-700 bg-indigo-50 px-2 py-1 rounded"><div><span className="font-bold mr-1">{quantities[opt.id]}x</span>{opt.name}</div><span className="font-medium whitespace-nowrap">{(opt.monthlyPrice * quantities[opt.id]).toFixed(2)} €</span></div> ))}
                  {quantities.dual_screen > 0 && ( <div className="flex justify-between text-sm items-start text-indigo-700 bg-indigo-100 px-2 py-1 rounded border border-indigo-200"><div><span className="font-bold mr-1">{quantities.dual_screen}x</span>Option Dual Screen</div><span className="font-medium whitespace-nowrap">{(DUAL_SCREEN_PRICE * quantities.dual_screen).toFixed(2)} €</span></div> )}
                  {quantities.fixed_screen > 0 && ( <div className="flex justify-between text-sm items-start text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200"><div><span className="font-bold mr-1">{quantities.fixed_screen}x</span>Option Ecran (Fixe)</div><span className="font-medium whitespace-nowrap">{(DUAL_SCREEN_PRICE * quantities.fixed_screen).toFixed(2)} €</span></div> )}
                </div>
              )}
              <button 
                onClick={() => setShowProposalModal(true)} 
                disabled={!hasSelection} 
                className={`w-full font-bold py-3 px-4 rounded-xl transition-colors shadow-lg mt-4 flex items-center justify-center gap-2 ${hasSelection ? (isExistingClient ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 cursor-pointer" : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 cursor-pointer") : "bg-slate-300 text-slate-500 cursor-not-allowed"}`}
              >
                <FileText size={18} />Références pour projets MySepteo
              </button>
              <button className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium py-3 px-4 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2" onClick={resetAll}><Trash2 size={16} />Tout réinitialiser</button>
            </div>
            
            {/* --- NOUVELLE SECTION PARC ACTUEL (CLIENT EXISTANT) --- */}
            {isExistingClient && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mx-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
                <h4 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
                  <Activity size={16} /> Parc Actuel (Déclaratif)
                </h4>
                <div className="space-y-3">
                  {/* Ligne Sécurité */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-emerald-600 mb-1 block">Sécurité (Antivirus/EDR)</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <ShieldCheck size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-emerald-400" />
                        <input 
                          type="text" 
                          placeholder="Nom (ex: ESET)" 
                          value={currentSecurityName}
                          onChange={(e) => setCurrentSecurityName(e.target.value)}
                          className="w-full text-sm border border-emerald-200 rounded-md py-1.5 pl-8 pr-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white placeholder-emerald-300"
                        />
                      </div>
                      <input 
                        type="number" 
                        min="0"
                        placeholder="Qté"
                        value={currentSecurityCount || ""} 
                        onChange={(e) => setCurrentSecurityCount(parseInt(e.target.value) || 0)} 
                        className="w-16 text-center font-bold text-sm border border-emerald-200 rounded-md py-1.5 px-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white text-emerald-900" 
                      />
                    </div>
                  </div>

                  {/* Ligne M365 */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-emerald-600 mb-1 block">Tenant Microsoft 365</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <DatabaseZap size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-emerald-400" />
                        <input 
                          type="text" 
                          placeholder="Nom (ex: Tenant A)" 
                          value={currentM365Name}
                          onChange={(e) => setCurrentM365Name(e.target.value)}
                          className="w-full text-sm border border-emerald-200 rounded-md py-1.5 pl-8 pr-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white placeholder-emerald-300"
                        />
                      </div>
                      <input 
                        type="number" 
                        min="0"
                        placeholder="Qté"
                        value={currentM365Count || ""} 
                        onChange={(e) => setCurrentM365Count(parseInt(e.target.value) || 0)} 
                        className="w-16 text-center font-bold text-sm border border-emerald-200 rounded-md py-1.5 px-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white text-emerald-900" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* --- CONSOLE DEBUG SNOWFLAKE --- */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${isDebugOpen ? 'translate-y-0' : 'translate-y-[calc(100%-40px)]'}`}>
        <div className="bg-slate-900 border-t border-slate-700 shadow-2xl flex flex-col h-64">
            <button 
                onClick={() => setIsDebugOpen(!isDebugOpen)}
                className="w-full h-10 bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono flex items-center justify-between px-4 transition-colors cursor-pointer border-b border-slate-700"
            >
                <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-green-400" />
                    <span>CONSOLE DEBUG : SNOWFLAKE DATA</span>
                    {snowflakeData && (
                        <span className="bg-green-900 text-green-300 px-2 py-0.5 rounded text-[10px]">
                            {snowflakeData.error ? 'ERREUR API' : 'DONNÉES REÇUES'}
                        </span>
                    )}
                </div>
                {isDebugOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
            <div className="flex-1 overflow-auto p-4 font-mono text-xs text-green-400 bg-slate-950">
                {snowflakeData ? (
                    <pre>{JSON.stringify(snowflakeData, null, 2)}</pre>
                ) : (
                    <div className="flex items-center gap-2 text-slate-500">
                        <Activity size={14} className="animate-spin" /> Chargement des données...
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* MODAL PROPOSAL */}
      {showProposalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className={`p-6 flex justify-between items-start text-white ${isExistingClient ? 'bg-emerald-600' : 'bg-blue-600'}`}><div><h2 className="text-xl font-bold flex items-center gap-2"><List className="text-blue-200" />Récapitulatif Offre</h2><p className="text-blue-100 text-sm mt-1">Format Base de référence produits MySepteo</p></div><button onClick={() => setShowProposalModal(false)} className="text-blue-100 hover:text-white hover:bg-white/20 p-1 rounded-full transition-colors"><X size={24} /></button></div>
            <div className="p-6 overflow-y-auto custom-scrollbar bg-slate-50 text-sm">
                
                {/* --- CONTENU DE LA MODALE --- */}
                <div className="space-y-6">
                    <div className="pb-4 border-b border-slate-200">
                        <h4 className="font-bold text-slate-800 mb-2 text-base">1. Détail des Postes & Bundles</h4>
                        <div className="space-y-4">
                            {BASES.map(base => {
                                // On ne garde que les configs sélectionnées
                                const activeConfigs = base.configs.filter(c => quantities[c.id] > 0);
                                if (activeConfigs.length === 0) return null;

                                // Pour l'existant, on récupère aussi les upgrades liés à cette gamme
                                const upCollab = quantities[`${base.id}_upgrade_collab`] || 0;
                                const upSecu = quantities[`${base.id}_upgrade_secu`] || 0;

                                return (
                                    <div key={base.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
                                            <base.icon size={18} className={`text-${base.color}-600`} />
                                            <h5 className={`font-bold text-${base.color}-800 uppercase text-xs`}>{base.name}</h5>
                                        </div>
                                        
                                        {activeConfigs.map(config => {
                                            const qty = quantities[config.id];
                                            const unitPrice = getPosteFullMonthlyPrice(base, config, includeBackup);
                                            
                                            return (
                                                <div key={config.id} className="mb-3 last:mb-0">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="font-bold text-slate-700 text-sm">{qty} x {config.name}</div>
                                                            <div className="text-xs text-slate-500 mt-0.5">{config.specs}</div>
                                                            
                                                            {/* Liste des Services Inclus */}
                                                            <ul className="mt-2 space-y-1">
                                                                {base.commonServices.map((s, i) => (
                                                                    <li key={i} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                                                        <CheckCircle size={10} /> {s.name}
                                                                    </li>
                                                                ))}
                                                                {/* Ligne Licence (Dynamique) */}
                                                                <li className={`flex items-center gap-1.5 text-[10px] font-semibold ${isExistingClient ? 'text-slate-400 italic' : 'text-blue-600'}`}>
                                                                    <CheckCircle size={10} />
                                                                    {isExistingClient 
                                                                        ? (includeBackup ? "Option Sauvegarde Incluse" : "Matériel Seul (Pas de licence)") 
                                                                        : (includeBackup ? "Pack Collaboratif Premium + Sauvegarde M365" : "Pack Collaboratif Premium")
                                                                    }
                                                                </li>
                                                            </ul>
                                                        </div>
                                                        <div className="text-right font-bold text-slate-800 text-sm">
                                                            {(unitPrice * qty).toFixed(2)} €
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* SECTION UPGRADES SPECIFIQUES A LA GAMME (SI CLIENT EXISTANT) */}
                                        {isExistingClient && (upCollab > 0 || upSecu > 0) && (
                                            <div className="mt-3 pt-2 border-t border-dashed border-emerald-200 bg-emerald-50/50 -mx-4 -mb-4 p-3 rounded-b-lg">
                                                <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Options Licences Ajoutées</p>
                                                {upCollab > 0 && (
                                                    <div className="flex justify-between text-xs text-emerald-800 mb-1">
                                                        <span>{upCollab} x Pack Collaboratif Premium</span>
                                                        <span className="font-medium">{(upCollab * OPTION_UPGRADE_COLLAB_PRICE).toFixed(2)} €</span>
                                                    </div>
                                                )}
                                                {upSecu > 0 && (
                                                    <div className="flex justify-between text-xs text-emerald-800">
                                                        <span>{upSecu} x Pack Sécurité Avancé Microsoft365</span>
                                                        <span className="font-medium">{(upSecu * OPTION_UPGRADE_SECU_PRICE).toFixed(2)} €</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* SECTION 2 : MIGRATIONS & OPTIONS */}
                    <div className="pb-4 border-b border-slate-200">
                        <h4 className="font-bold text-slate-800 mb-2 text-base">2. Migrations & Options Annexes</h4>
                        <div className="space-y-2 text-sm text-slate-600">
                            {getTotalMigMail() > 0 && ( <div className="flex justify-between"><span>{getTotalMigMail()} x Migration AvocatMail</span><span className="font-medium">{(getTotalMigMail() * MIGRATION_MAIL_PRICE).toFixed(2)} €</span></div> )}
                            {getTotalMigCloud() > 0 && ( <div className="flex justify-between"><span>{getTotalMigCloud()} x Migration OneDrive</span><span className="font-medium">{(getTotalMigCloud() * MIGRATION_CLOUD_PRICE).toFixed(2)} €</span></div> )}
                            {OPTIONS.filter(o => quantities[o.id] > 0).map(opt => (
                                <div key={opt.id} className="flex justify-between"><span>{quantities[opt.id]} x {opt.name}</span><span className="font-medium">{(quantities[opt.id] * opt.monthlyPrice).toFixed(2)} €</span></div>
                            ))}
                            {(quantities.dual_screen > 0) && <div className="flex justify-between"><span>{quantities.dual_screen} x Option Dual Screen</span><span className="font-medium">{(quantities.dual_screen * DUAL_SCREEN_PRICE).toFixed(2)} €</span></div>}
                            {(quantities.fixed_screen > 0) && <div className="flex justify-between"><span>{quantities.fixed_screen} x Option Ecran (Fixe)</span><span className="font-medium">{(quantities.fixed_screen * DUAL_SCREEN_PRICE).toFixed(2)} €</span></div>}
                        </div>
                    </div>

                    {/* SECTION 3 : FRAIS GLOBAUX */}
                    <div>
                        <h4 className="font-bold text-slate-800 mb-2 text-base">3. Frais & Services Globaux</h4>
                        <div className="space-y-2 text-sm text-slate-600">
                            {isFraisTempoDue && (
                                <div className="flex justify-between">
                                    <span>Frais Tempo (Forfait Logistique Projet)</span>
                                    <span className="font-medium">{FRAIS_TEMPO_PRICE.toFixed(2)} €</span>
                                </div>
                            )}
                            {(includeBackup && totalWorkstations > 0) && (
                                <div className="flex justify-between text-indigo-700 font-medium">
                                    <span>Prestation Mise en place Sauvegarde (Forfait)</span>
                                    <span>{GLOBAL_BACKUP_SETUP_PRICE.toFixed(2)} €</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
            <div className="bg-white p-4 border-t border-slate-200 flex justify-end gap-3"><button onClick={() => setShowProposalModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Fermer</button><button onClick={downloadProposalTxt} className={`px-4 py-2 text-white rounded-lg font-bold flex items-center gap-2 transition-colors shadow-md ${isExistingClient ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}><Download size={18} /> Télécharger le fichier .txt</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  if (!clerkPubKey) {
    return (
      <div className="flex items-center justify-center h-screen text-red-600 font-bold">
        Erreur : Clé Clerk (REACT_APP_CLERK_PUBLISHABLE_KEY) manquante.
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <SignedIn>
        <LeasingSimulator />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </ClerkProvider>
  );
}
