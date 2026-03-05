import React, { useState, useMemo, useEffect, useRef } from "react";

// IMPORTS COMPLETS
import {
  Calculator, FileText, ChevronDown, ChevronUp,
  Plus, Minus, Trash2, Package, Gift, Box, Cloud, Mail,
  Wrench, Database, Shield, Users, Activity, Terminal, 
  UserPlus, UserCheck, ShieldCheck, Lock, 
  ScanSearch, ArrowRight, Tablet, HandCoins, Eye, EyeOff,
  CheckCircle, Check, ToggleLeft, ToggleRight, ZoomIn, 
  ChevronLeft, ChevronRight, X, Cpu, Tv, Download, List, Info
} from "lucide-react";

import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
  useAuth
} from "@clerk/clerk-react";

import {
  LOGO_SEPTEO_HEADER, LOGO_M365, LOGO_INTUNE,
  PRESENTATION_DETAILS,
  FRAIS_TEMPO_PRICE, MIGRATION_MAIL_PRICE, MIGRATION_CLOUD_PRICE, 
  OPTION_UPGRADE_COLLAB_PRICE, OPTION_UPGRADE_SECU_PRICE, 
  OPTION_BACKUP_PRICE, GLOBAL_BACKUP_SETUP_PRICE,
  DUAL_SCREEN_PRICE, COLLAB_PREMIUM_PRICE, COLLAB_PREMIUM_SAVE_PRICE, UPGRADE_DIFF_PRICE,
  INITIAL_QUANTITIES, BASES, OPTIONS,
  getThemeClasses, getImagesForConfigId, normalizeRowKeys
} from "./data/constants";

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

// --- DICTIONNAIRE DES IMAGES PAR BUNDLE_REFERENCE ---
const BUNDLE_IMAGES = {
  "bdentreedegamme3": ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/A23R4EA-ABF_3_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A23R4EA-ABF_8_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A23R4EA-ABF_9_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A23R4EA-ABF_4_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A23R4EA-ABF_1750x1285.jpg"],
  "bdentreedegamme4": ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/A23R4EA-ABF_3_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A23R4EA-ABF_8_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A23R4EA-ABF_9_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A23R4EA-ABF_4_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A23R4EA-ABF_1750x1285.jpg"],
  "bdentreedegamme1": ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/1f09f243-d7c1-432f-8d9b-767a7acaa0a0_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A23R2EA-ABF_13_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A23R2EA-ABF_14_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/2600a563-2d1d-40a4-b770-0654ab267a48_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/76183f3a-61ab-42c2-9b69-ece2106bf137_1750x1285.jpg"],
  "bdentreedegamme2": ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/1f09f243-d7c1-432f-8d9b-767a7acaa0a0_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A23R2EA-ABF_13_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A23R2EA-ABF_14_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/2600a563-2d1d-40a4-b770-0654ab267a48_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/76183f3a-61ab-42c2-9b69-ece2106bf137_1750x1285.jpg"],
  "bdmoyendegamme1": ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_3_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_4_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_5_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_8_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_1_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/b9301335-09bb-4cb4-866c-7fa8d6c4905a_1750x1285.jpg"],
  "bdmoyendegamme2": ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_3_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_4_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_5_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_8_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_1_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/b9301335-09bb-4cb4-866c-7fa8d6c4905a_1750x1285.jpg"],
  "bdmoyendegamme3": ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_3_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_4_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_5_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_8_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_1_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/b9301335-09bb-4cb4-866c-7fa8d6c4905a_1750x1285.jpg"],
  "bdmoyendegamme4": ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_3_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_4_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_5_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_8_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_1_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/b9301335-09bb-4cb4-866c-7fa8d6c4905a_1750x1285.jpg"],
  "bdmoyendegamme5": ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/539afc89-6121-42be-94c3-4c6ab5ea6c51_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27BYEA-ABF_3_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27BYEA-ABF_1_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27BYEA-ABF_4_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/61c1e7e4-83b7-4075-8453-b2d637217a93_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/147016dc-d830-4661-9bd4-c60fd453f8e5_1750x1285.jpg"],
  "bdmoyendegamme6": ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/539afc89-6121-42be-94c3-4c6ab5ea6c51_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27BYEA-ABF_3_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27BYEA-ABF_1_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27BYEA-ABF_4_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/61c1e7e4-83b7-4075-8453-b2d637217a93_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/147016dc-d830-4661-9bd4-c60fd453f8e5_1750x1285.jpg"],
  "bdmoyendegamme7": ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/539afc89-6121-42be-94c3-4c6ab5ea6c51_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27BYEA-ABF_3_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27BYEA-ABF_1_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27BYEA-ABF_4_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/61c1e7e4-83b7-4075-8453-b2d637217a93_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/147016dc-d830-4661-9bd4-c60fd453f8e5_1750x1285.jpg"],
  "bdhautdegamme1": ["https://www.hp.com/ca-fr/shop/media/catalog/product/3/e/3ea6b621-3e66-4c0e-ae0d-7b1d5704e5a4.png?store=ca-fr&image-type=image&auto=avif&quality=100&format=jpg&bg-color=ffffff&type=image-product&width=960&fit=bounds", "https://www.hp.com/ca-fr/shop/media/catalog/product/f/c/fc09f2e9-8b0c-424a-bf6f-e33ee9a84a00.png?store=ca-fr&image-type=image&auto=avif&quality=100&format=jpg&bg-color=ffffff&type=image-product&width=100p&fit=bounds", "https://www.hp.com/ca-fr/shop/media/catalog/product/3/2/32726e71-10bb-47eb-bb3c-373516fbb8ff.png?store=ca-fr&image-type=image&auto=avif&quality=100&format=jpg&bg-color=ffffff&type=image-product&width=100p&fit=bounds", "https://www.hp.com/ca-fr/shop/media/catalog/product/2/3/23805ccc-e73b-4d3a-ab8b-124ceb9e6e23.png?store=ca-fr&image-type=image&auto=avif&quality=100&format=jpg&bg-color=ffffff&type=image-product&width=100p&fit=bounds", "https://www.hp.com/ca-fr/shop/media/catalog/product/2/1/21068d06-a0dc-4523-aa3d-be8ea3016fa4.png?store=ca-fr&image-type=image&auto=avif&quality=100&format=jpg&bg-color=ffffff&type=image-product&width=100p&fit=bounds", "https://www.hp.com/ca-fr/shop/media/catalog/product/6/d/6d08073e-9316-4f5c-9557-f2aa65a2b854.png?store=ca-fr&image-type=image&auto=avif&quality=100&format=jpg&bg-color=ffffff&type=image-product&width=100p&fit=bounds", "https://www.hp.com/ca-fr/shop/media/catalog/product/d/a/da89079f-6d31-4082-a9c5-111ab2e4dfc7.png?store=ca-fr&image-type=image&auto=avif&quality=100&format=jpg&bg-color=ffffff&type=image-product&width=100p&fit=bounds", "https://www.hp.com/ca-fr/shop/media/catalog/product/b/3/b3c4f86d-a7d3-4bce-9a4d-be2ac5b68634.png?store=ca-fr&image-type=image&auto=avif&quality=100&format=jpg&bg-color=ffffff&type=image-product&width=100p&fit=bounds"],
  "bdhautdegamme2": ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68SJEA-ABF_4_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68SJEA-ABF_7_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68SJEA-ABF_8_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68SJEA-ABF_9_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68SJEA-ABF_12_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68SJEA-ABF_11_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68SJEA-ABF_13_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68SJEA-ABF_14_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68SJEA-ABF_3_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68SJEA-ABF_1_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68SJEA-ABF_5_1750x1285.jpg"],
  "bdhautdegamme3": ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/86900dc6-306b-4124-9b04-f69849162908_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68T4EA-ABF_9_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/47cdb7de-fb85-45ff-8526-6a61277524f3_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/90d01265-6e93-4a60-bf4c-aed681543113_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/449c06c1-4f50-4ea9-9ea0-549ea3d4bd7b_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68T4EA-ABF_1_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68T4EA-ABF_5_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68T4EA-ABF_9_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68T4EA-ABF_8_1750x1285.jpg"],
  "bdhautdegamme4": ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/28402795-7fd7-4e8a-9f89-3a4926695a76_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68T6EA-ABF_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68T6EA-ABF_1_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68T6EA-ABF_2_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68T6EA-ABF_3_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68T6EA-ABF_4_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68T6EA-ABF_7_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68T6EA-ABF_8_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68T6EA-ABF_9_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/71afe419-df31-41d2-a3cd-84c1e1d99391_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/232a7418-4a2e-45cb-acdb-540a076acd87_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/6d7e9a55-9b5b-44c9-a4e2-7ec7d632ecb0_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/5fb01f4d-52da-4905-9b40-74e11899edd3_1750x1285.jpg"],
  "bdaio1": ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/cb06d866-41ca-4b49-8cee-1dc865c1f3d9_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A0ZF5EA-ABF_6_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A0ZF5EA-ABF_5_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A0ZF5EA-ABF_4_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A0ZF5EA-ABF_1_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/157dd283-8600-4016-a6f3-5e3244ae7169_1750x1285.jpg"],
  "bdaio2": ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/e5436d36-5254-46c8-9b34-2cfb55cbb649_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A0ZF4EA-ABF_6_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A0ZF4EA-ABF_5_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A0ZF4EA-ABF_2_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/0313e0cc-6331-4166-8239-7823412bb889_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/66865f32-0797-46da-ace2-bee235dba865_1750x1285.jpg"],
  "bdaio3": ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/e5436d36-5254-46c8-9b34-2cfb55cbb649_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A0ZF4EA-ABF_6_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A0ZF4EA-ABF_5_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A0ZF4EA-ABF_2_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/0313e0cc-6331-4166-8239-7823412bb889_1750x1285.jpg"],
  "bdaio4": ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/cb06d866-41ca-4b49-8cee-1dc865c1f3d9_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A0ZF5EA-ABF_6_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A0ZF5EA-ABF_5_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A0ZF5EA-ABF_4_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A0ZF5EA-ABF_1_1750x1285.jpg", "https://www.hp.com/fr-fr/shop/Html/Merch/Images/157dd283-8600-4016-a6f3-5e3244ae7169_1750x1285.jpg"],
  "bdpostefixe1": ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/C61RVEA-ABF_1_1750x1285.jpg"],
  "bdpostefixe2": ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/c08576880_1750x1285.jpg"],
  "bdpostefixe3": ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/c08576880_1750x1285.jpg"],
  "bdpostefixe4": ["https://www.hp.com/fr-fr/shop/Html/Merch/Images/c08576880_1750x1285.jpg"]
};

// --- FONCTION FORMATAGE TAG ---
const formatBundleTag = (tag) => {
    if (!tag || tag === "0") return tag;
    const parts = tag.split(/\s+/);
    const formattedParts = parts.map(p => {
        if (p === "1000" || p === "1024") return "1to";
        if (p === "512" || p === "256") return p + "go";
        if (p === "16" || p === "32" || p === "8" || p === "64") return p + "go";
        if (/^Ci[3579]$/i.test(p)) return p.toUpperCase().replace('CI', 'U');
        if (/^i[3579]$/i.test(p)) return p.toUpperCase().replace('I', 'U');
        return p;
    });
    return formattedParts.join(', ');
};

// --- COMPOSANTS UI ---
const PriceTag = ({ price, period = "/mois", originalPrice = null, isUpgrade = false }) => (
  <div className="flex flex-col items-end cursor-help">
    {originalPrice !== null && ( <span className="text-xs text-slate-400 line-through decoration-slate-400"> {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(originalPrice)} </span> )}
    <span className={`font-bold flex items-center gap-1 ${isUpgrade ? "text-emerald-600" : "text-slate-800"}`}> 
      {isUpgrade && "+"} {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(price || 0)} 
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

const ImageCarousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  useEffect(() => { setCurrentIndex(0); }, [images]);
  if (!images || images.length === 0) return (<div className="w-40 h-32 md:w-56 md:h-44 bg-slate-100 rounded-lg flex items-center justify-center text-slate-300 border border-slate-200"><Box size={24} /></div>);
  const nextImage = (e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev + 1) % images.length); };
  const prevImage = (e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev - 1 + images.length) % images.length); };
  const openZoom = (e) => { e.stopPropagation(); setIsZoomed(true); };
  const closeZoom = (e) => { e.stopPropagation(); setIsZoomed(false); setCurrentIndex(0); };
  return (
    <>
      <div className="relative group w-40 h-32 md:w-56 md:h-44 shrink-0 cursor-pointer" onClick={openZoom}>
        <div className="w-full h-full rounded-lg overflow-hidden border border-slate-200 bg-white relative"><img src={images[currentIndex]} alt="Product" className="w-full h-full object-contain p-1" /></div>
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center pointer-events-none"><ZoomIn size={16} className="text-slate-600" /></div>
        {images.length > 1 && (
            <>
                <button onClick={prevImage} className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-1 rounded-full z-10 shadow-sm"><ChevronLeft size={12}/></button>
                <button onClick={nextImage} className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-1 rounded-full z-10 shadow-sm"><ChevronRight size={12}/></button>
            </>
        )}
        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 rounded-full z-10">{currentIndex + 1}/{images.length}</div>
      </div>
      {isZoomed && (<div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={closeZoom}><div className="relative max-w-5xl w-full flex flex-col items-center justify-center gap-4"><img src={images[currentIndex]} alt="Zoom product" className="max-w-full max-h-[75vh] object-contain rounded-md shadow-2xl" onClick={(e) => e.stopPropagation()} /><div className="flex items-center gap-6 bg-black/50 px-6 py-2 rounded-full backdrop-blur-sm" onClick={(e) => e.stopPropagation()}><button className="text-white hover:text-blue-400 transition-colors" onClick={prevImage}><ChevronLeft size={32} /></button><span className="text-white font-medium min-w-[50px] text-center">{currentIndex + 1} / {images.length}</span><button className="text-white hover:text-blue-400 transition-colors" onClick={nextImage}><ChevronRight size={32} /></button></div><button className="absolute top-[-40px] right-0 text-white/70 hover:text-white" onClick={closeZoom}><X size={32} /></button></div></div>)}
    </>
  );
};

const AssetGauge = ({ count, threshold = 10, isExistingClient }) => {
  const percentage = Math.min(100, (count / threshold) * 100);
  const isComplete = count >= threshold;
  const remaining = Math.max(0, threshold - count);
  const barColor = isExistingClient ? (isComplete ? "bg-emerald-600" : "bg-emerald-400") : (isComplete ? "bg-green-500" : "bg-blue-500");
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
      <div className="flex justify-between items-center mb-2"><div className="flex items-center gap-2"><Package size={18} className="text-slate-600" /><span className="font-bold text-slate-700 text-sm">Volume Parc (Assets)</span></div><span className={`text-sm font-bold ${isComplete ? "text-green-600" : "text-slate-500"}`}>{count} / {threshold}</span></div>
      <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden mb-2"><div className={`h-full transition-all duration-500 ease-out ${barColor}`} style={{ width: `${percentage}%` }} /></div>
      <div className="flex items-start gap-2 text-xs">{isComplete ? ( <><Gift size={14} className="text-green-600 mt-0.5 shrink-0" /><span className="text-green-700 font-medium">Palier atteint ! Frais Tempo (Forfait Logistique) offerts.</span></> ) : ( <span className="text-slate-500">Ajoutez encore <strong>{remaining}</strong> éléments pour débloquer la gratuité des Frais Tempo.</span> )}</div>
    </div>
  );
};

// --- SIMULATEUR ---
function LeasingSimulator() {
  const [activeTab, setActiveTab] = useState("presentation"); 
  const [clientName, setClientName] = useState("");
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [quantities, setQuantities] = useState(INITIAL_QUANTITIES);
  const [includeBackup, setIncludeBackup] = useState(false); 
  const [activeConfigTab, setActiveConfigTab] = useState({ entry: 0, mid: 0, high: 0, fixed: 0 });
  const [expandedItems, setExpandedItems] = useState({});
  const [isExistingClient, setIsExistingClient] = useState(false);
  const [isClientVerified, setIsClientVerified] = useState(false);
  const [isLoadingClient, setIsLoadingClient] = useState(false);
  const [securityLines, setSecurityLines] = useState([]);
  const [currentM365Name, setCurrentM365Name] = useState("");
  const [currentM365Count, setCurrentM365Count] = useState(0);
  const [maintenanceCount, setMaintenanceCount] = useState(0); 
  const [clientCompanyName, setClientCompanyName] = useState("");
  const [snowflakeData, setSnowflakeData] = useState(null);
  const [isDebugOpen, setIsDebugOpen] = useState(false); 
  const [selectedFeature, setSelectedFeature] = useState(null); 
  const [isParkDetailsVisible, setIsParkDetailsVisible] = useState(false);
  
  // STATE POUR LES LOGS DE LA CONSOLE
  const [actionLogs, setActionLogs] = useState([]);
  
  const [dynamicConfigs, setDynamicConfigs] = useState([]);
  const hasFetchedCatalog = useRef(false);
  const [isCatalogLoading, setIsCatalogLoading] = useState(!hasFetchedCatalog.current);

  const [globalServiceNames, setGlobalServiceNames] = useState({
      stdName: "Pack Collaboratif Premium",
      saveName: "Pack Collaboratif Premium + Sauvegarde M365",
  });

  // ETAT POUR STOCKER LES PRIX ET NOMS DYNAMIQUES DES OPTIONS (Initialisé à null pour la gestion du tooltip)
  const [fetchedPrices, setFetchedPrices] = useState({
      migMail: null, migMailName: "0", migMailRef: "0", rawPrice: null,
      migCloud: null, migCloudName: "0", migCloudRef: "0", rawPriceCloud: null,
      migSharepoint: null, migSharepointName: "0", migSharepointRef: "0", rawPriceSharepoint: null,
      migTeams: null, migTeamsName: "0", migTeamsRef: "0", rawPriceTeams: null
  });

  const { getToken } = useAuth(); 

  // FONCTION POUR AJOUTER UN LOG DANS LA CONSOLE
  const logAction = (msg) => {
      const time = new Date().toLocaleTimeString();
      setActionLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 15));
  };

  const parseDynamicCatalog = (rows) => {
    if (!Array.isArray(rows)) return { configs: [], globalServices: null, dynamicPrices: {}, debug: {} };

    let cyber = 0, maint = 0, collabStd = 0, collabSave = 0;
    let cyberName = null, cyberRef = null, maintName = null, maintRef = null;
    let bundle87282Name = "Pack Collaboratif Premium";
    let bundle87283Name = "Pack Collaboratif Premium + Sauvegarde M365";
    
    let dynamicMigMailPrice = null, dynamicMigMailName = "0", dynamicMigMailRef = "0";
    let dynamicMigCloudPrice = null, dynamicMigCloudName = "0", dynamicMigCloudRef = "0";
    let dynamicMigSharepointPrice = null, dynamicMigSharepointName = "0", dynamicMigSharepointRef = "0";
    let dynamicMigTeamsPrice = null, dynamicMigTeamsName = "0", dynamicMigTeamsRef = "0";

    const processedServiceRefs = new Set();
    const trace_calculs = [];
    const lignes_brutes = []; 

    const hardwareBundles = {};

    rows.forEach(r => {
      const bundleId = String(r.BUNDLE_ID);
      const refProd = (r.PRODUIT_REFERENCE || "").toLowerCase();
      const pvProd = parseFloat(r.PRODUIT_PV || 0);
      const refAssoc = (r.PRODUIT_ASSOCIE_REFERENCE || "").toLowerCase();
      const pvAssoc = parseFloat(r.PRODUIT_ASSOCIE_PV || 0);
      const rawBundlePv = r.BUNDLE_PV;
      const stringPv = String(r.BUNDLE_PV || "0").replace(',', '.');
      const bundlePv = parseFloat(stringPv);
      const bundleRef = (r.BUNDLE_REFERENCE || "").toLowerCase();

      if (r.PRODUIT_REFERENCE && !lignes_brutes.some(l => l.ref === r.PRODUIT_REFERENCE)) {
          lignes_brutes.push({
              bundle: r.BUNDLENOM, ref_produit: r.PRODUIT_REFERENCE, nom_produit: r.PRODUIT_NOM || "Non défini", ref_associe: r.PRODUIT_ASSOCIE_REFERENCE
          });
      }

      if (refAssoc === 'install@') { dynamicMigMailPrice = pvAssoc / 36; dynamicMigMailName = r.PRODUIT_ASSOCIE_NOM; dynamicMigMailRef = r.PRODUIT_ASSOCIE_REFERENCE; }
      if (refAssoc === 'forf-onedrive') { dynamicMigCloudPrice = pvAssoc / 36; dynamicMigCloudName = r.PRODUIT_ASSOCIE_NOM; dynamicMigCloudRef = r.PRODUIT_ASSOCIE_REFERENCE; }
      if (refAssoc === 's-prep-sharp') { dynamicMigSharepointPrice = pvAssoc / 36; dynamicMigSharepointName = r.PRODUIT_ASSOCIE_NOM; dynamicMigSharepointRef = r.PRODUIT_ASSOCIE_REFERENCE; }
      if (refAssoc === 'forf-migr') { dynamicMigTeamsPrice = pvAssoc / 36; dynamicMigTeamsName = r.PRODUIT_ASSOCIE_NOM; dynamicMigTeamsRef = r.PRODUIT_ASSOCIE_REFERENCE; }

      if (refProd === 'install@') { dynamicMigMailPrice = pvProd / 36; dynamicMigMailName = r.PRODUIT_NOM; dynamicMigMailRef = r.PRODUIT_REFERENCE; }
      if (refProd === 'forf-onedrive') { dynamicMigCloudPrice = pvProd / 36; dynamicMigCloudName = r.PRODUIT_NOM; dynamicMigCloudRef = r.PRODUIT_REFERENCE; }
      if (refProd === 's-prep-sharp') { dynamicMigSharepointPrice = pvProd / 36; dynamicMigSharepointName = r.PRODUIT_NOM; dynamicMigSharepointRef = r.PRODUIT_REFERENCE; }
      if (refProd === 'forf-migr') { dynamicMigTeamsPrice = pvProd / 36; dynamicMigTeamsName = r.PRODUIT_NOM; dynamicMigTeamsRef = r.PRODUIT_REFERENCE; }

      if (bundleId === '87282' || bundleId === '87283') {
        if (bundleId === '87282' && r.BUNDLENOM) bundle87282Name = String(r.BUNDLENOM);
        if (bundleId === '87283' && r.BUNDLENOM) bundle87283Name = String(r.BUNDLENOM);

        const prodName = r.PRODUIT_NOM;
        if (refProd && !processedServiceRefs.has(bundleId + '_' + refProd)) {
          if (refProd === 'abo_secu365_2') { cyber = pvProd / 12; cyberName = prodName; cyberRef = r.PRODUIT_REFERENCE; }
          if (refProd === 'maint-materiel') { maint = pvProd / 12; maintName = prodName; maintRef = r.PRODUIT_REFERENCE; }
          if (refProd === 'ms-packcopr') { collabStd = pvProd / 12; }
          if (refProd === 'ms-packcoprsauv') { collabSave = pvProd / 12; }
          processedServiceRefs.add(bundleId + '_' + refProd); 
        }
      }

      let targetCategory = null;
      if (bundleRef.startsWith('bdentreedegamme')) targetCategory = 'entry';
      else if (bundleRef.startsWith('bdmoyendegamme')) targetCategory = 'mid';
      else if (bundleRef.startsWith('bdhautdegamme')) targetCategory = 'high';
      else if (bundleRef.startsWith('bdpostefixe') || bundleRef.startsWith('bdaio')) targetCategory = 'fixed';

      if (targetCategory) {
          if (!hardwareBundles[bundleId]) {
              const rawBundleNom = r.BUNDLENOM ? String(r.BUNDLENOM) : "0";
              const cleanBundleNom = rawBundleNom !== "0" ? rawBundleNom.replace(/^(Bundle\s+Portable\s+|Bundle\s+Fixe\s+|Bundle\s+|Pack\s+Portable\s+|Pack\s+Fixe\s+|Pack\s+)/i, '').trim() : "0";
              const tag = r.BUNDLE_TAG ? String(r.BUNDLE_TAG).trim() : "0";

              hardwareBundles[bundleId] = {
                  categoryId: targetCategory,
                  bundleRef: bundleRef,
                  buttonName: tag !== "0" ? formatBundleTag(tag) : cleanBundleNom, 
                  bundleNomClean: cleanBundleNom, 
                  rawName: rawBundleNom, 
                  mainSpecs: null, 
                  hwPrice: 0,
                  deploy: 0,
                  deployName: "0", 
                  deployRef: "0",
                  processedAssocRefs: new Set(),
                  includedProducts: new Set() 
              };

              if (bundlePv > 0) {
                  hardwareBundles[bundleId].hwPrice = bundlePv / 36;
                  trace_calculs.push({
                      bundle: hardwareBundles[bundleId].buttonName,
                      valeur: rawBundlePv,
                      resultat_divise_36: bundlePv / 36
                  });
              }
          }

          const currentHW = hardwareBundles[bundleId];
          const prodName = r.PRODUIT_NOM;
          if (prodName) {
              const cleanProdName = String(prodName).trim();
              if (bundleId !== '87282' && bundleId !== '87283' && refProd !== 'install@' && refProd !== 'forf-onedrive' && refProd !== 's-prep-sharp' && refProd !== 'forf-migr') {
                  if (!currentHW.mainSpecs && /^(pack\s+portable|pack\s+fixe|pack\s+pc|pack|bundle)/i.test(cleanProdName)) {
                      currentHW.mainSpecs = cleanProdName.replace(/^(pack\s+portable\s+|pack\s+fixe\s+|pack\s+pc\s+|pack\s+|bundle\s+portable\s+|bundle\s+fixe\s+|bundle\s+)/i, '').trim();
                  } else {
                      currentHW.includedProducts.add(cleanProdName);
                  }
              }
          }

          if (refAssoc && !currentHW.processedAssocRefs.has(refAssoc)) {
              if (refAssoc === 's-installhl') {
                  currentHW.deploy += pvAssoc / 36;
                  currentHW.deployName = r.PRODUIT_ASSOCIE_NOM || "0";
                  currentHW.deployRef = r.PRODUIT_ASSOCIE_REFERENCE || "0";
              }
              currentHW.processedAssocRefs.add(refAssoc);
          }
      }
    });

    const newConfigs = [];
    Object.keys(hardwareBundles).forEach(bId => {
        const hw = hardwareBundles[bId];
        if (hw.hwPrice > 0) {
            const pcSpec = hw.mainSpecs || hw.bundleNomClean || "0";
            const accessoriesList = Array.from(hw.includedProducts);

            newConfigs.push({
                categoryId: hw.categoryId,
                config: {
                    id: `dyn_${hw.categoryId}_${bId}`,
                    bundleRef: hw.bundleRef,
                    name: hw.buttonName,          
                    bundleNomClean: hw.bundleNomClean, 
                    rawName: hw.rawName,
                    specs: pcSpec,                
                    accessories: accessoriesList, 
                    hardwarePrice: hw.hwPrice,
                    isDynamic: true,
                    dynamicPrices: { 
                        deploy: hw.deploy,
                        deployName: hw.deployName,
                        deployRef: hw.deployRef,
                        cyber: cyber, 
                        cyberName: cyberName,
                        cyberRef: cyberRef,
                        maint: maint, 
                        maintName: maintName,
                        maintRef: maintRef,
                        collabStd: collabStd, 
                        collabSave: collabSave 
                    }
                }
            });
        }
    });

    return { 
        configs: newConfigs, 
        globalServices: {
            stdName: bundle87282Name,
            saveName: bundle87283Name
        },
        dynamicPrices: {
            migMail: dynamicMigMailPrice, migMailName: dynamicMigMailName, migMailRef: dynamicMigMailRef,
            migCloud: dynamicMigCloudPrice, migCloudName: dynamicMigCloudName, migCloudRef: dynamicMigCloudRef,
            migSharepoint: dynamicMigSharepointPrice, migSharepointName: dynamicMigSharepointName, migSharepointRef: dynamicMigSharepointRef,
            migTeams: dynamicMigTeamsPrice, migTeamsName: dynamicMigTeamsName, migTeamsRef: dynamicMigTeamsRef
        },
        debug: { 
            ordinateurs_trouves: Object.keys(hardwareBundles).length,
            option_migration_trouvee: dynamicMigMailRef ? "OUI" : "NON",
            lignes_brutes_recues: lignes_brutes,
            trace_calculs: trace_calculs 
        } 
    };
  };

  useEffect(() => {
    let isMounted = true;
    if (activeTab === "simulator" && !hasFetchedCatalog.current) {
      hasFetchedCatalog.current = true;
      
      const fetchCatalog = async () => {
        setIsCatalogLoading(true); 
        logAction("Début de la récupération des données depuis Snowflake...");
        setSnowflakeData({ debug: "Tentative de connexion à /api/getCatalog..." });
        
        try {
          const token = await getToken();
          const response = await fetch(`/api/getCatalog`, { headers: { Authorization: `Bearer ${token}` } });
          const json = await response.json();
          
          if (response.ok) {
            if (isMounted) {
              if (json.data && Array.isArray(json.data)) {
                logAction(`Succès : ${json.data.length} lignes matérielles récupérées.`);
                
                const parsedResult = parseDynamicCatalog(json.data);
                setDynamicConfigs(parsedResult.configs);
                
                if (parsedResult.globalServices) {
                    setGlobalServiceNames(parsedResult.globalServices);
                }
                
                if (parsedResult.dynamicPrices) {
                    setFetchedPrices(prev => ({ 
                        ...prev, 
                        ...parsedResult.dynamicPrices,
                        rawPrice: parsedResult.dynamicPrices.migMail !== null ? parsedResult.dynamicPrices.migMail * 36 : null,
                        rawPriceCloud: parsedResult.dynamicPrices.migCloud !== null ? parsedResult.dynamicPrices.migCloud * 36 : null,
                        rawPriceSharepoint: parsedResult.dynamicPrices.migSharepoint !== null ? parsedResult.dynamicPrices.migSharepoint * 36 : null,
                        rawPriceTeams: parsedResult.dynamicPrices.migTeams !== null ? parsedResult.dynamicPrices.migTeams * 36 : null
                    }));
                }
                
                setSnowflakeData({
                    statut: "Données reçues et traitées",
                    analyse_du_prix: parsedResult.debug
                });
              } else {
                setSnowflakeData(json);
              }
            }
          } else {
            if (isMounted) {
              logAction(`Erreur serveur : ${response.status}`);
              setSnowflakeData({ error: true, status: response.status, vrai_message_snowflake: json.error || json.message, details: json.details });
            }
          }
        } catch (e) {
          if (isMounted) {
            logAction(`Erreur réseau : ${e.message}`);
            setSnowflakeData({ error: true, message: e.message, details: "Serveur injoignable." });
          }
        } finally {
          if (isMounted) {
              setIsCatalogLoading(false); 
          }
        }
      };
      fetchCatalog();
    }
    return () => { isMounted = false; };
  }, [activeTab, getToken]);

  const computedBases = useMemo(() => {
    return BASES.map(base => {
      const dynsForBase = dynamicConfigs.filter(d => d.categoryId === base.id).map(d => d.config);
      return {
        ...base,
        configs: [...dynsForBase, ...(base.configs || [])]
      };
    });
  }, [dynamicConfigs]);

  const totalAssets = useMemo(() => {
    let count = 0;
    computedBases.forEach((b) => { 
        (b.configs || []).forEach((c) => (count += quantities[c.id] || 0)); 
    });
    (OPTIONS || []).forEach((opt) => { 
        if(opt.assetCount > 0) { count += (quantities[opt.id] || 0) * opt.assetCount; } 
    });
    count += quantities["dual_screen"] || 0; 
    count += quantities["fixed_screen"] || 0;
    return count;
  }, [quantities, computedBases]);

  const isModeLocked = totalAssets > 0;
  const isInterfaceLocked = isExistingClient && !isClientVerified;

  const totalWorkstations = useMemo(() => { 
      let count = 0; 
      computedBases.forEach((b) => { 
          (b.configs || []).forEach((c) => (count += quantities[c.id] || 0)); 
      }); 
      return count; 
  }, [quantities, computedBases]);
  
  const isFraisTempoWaived = totalAssets >= 10;
  const isFraisTempoDue = !isFraisTempoWaived && totalAssets > 0;
  
  const getTotalMigMail = () => (quantities.entry_mig_mail || 0) + (quantities.mid_mig_mail || 0) + (quantities.high_mig_mail || 0) + (quantities.fixed_mig_mail || 0);
  const getTotalMigCloud = () => (quantities.entry_mig_cloud || 0) + (quantities.mid_mig_cloud || 0) + (quantities.high_mig_cloud || 0) + (quantities.fixed_mig_cloud || 0);

  const handleClientSearch = async () => {
      if (!clientName) return;
      setIsLoadingClient(true);
      logAction(`Recherche du dossier client : ${clientName}`);
      try {
          const token = await getToken();
          const response = await fetch(`/api/getData?dossier=${encodeURIComponent(clientName)}`, { headers: { Authorization: `Bearer ${token}` } });
          const json = await response.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
              const firstRow = normalizeRowKeys(json.data[0]);
              setClientCompanyName(firstRow['CLIENT'] || "Client Inconnu");
              const securityMap = new Map();
              let m365Count = 0;
              let m365Name = "";
              let maintCount = 0; 

              json.data.forEach(row => {
                  const cleanRow = normalizeRowKeys(row);
                  const labelRaw = cleanRow['PRODUIT'] || "";
                  const refRaw = (cleanRow['REFERENCEPRODUIT'] || cleanRow['REFENCEPRODUIT'] || "").toLowerCase();
                  
                  const label = labelRaw.toUpperCase();
                  const qty = parseInt(cleanRow['QUANTITEREELLE'] || 0);
                  
                  if (label.includes("PACK SECURITE") || label.includes("PACK SÉCURITÉ")) {
                      if (securityMap.has(labelRaw)) { securityMap.set(labelRaw, securityMap.get(labelRaw) + qty); } else { securityMap.set(labelRaw, qty); }
                  }
                  
                  const isM365 = label.includes("PACK COLLABORATIF") || label.includes("OFFICE ET DEPLOIEMENT") || label.includes("OFFICE ET DÉPLOIEMENT");
                  if (isM365) { m365Count += qty; if (!m365Name) m365Name = labelRaw; }

                  if (refRaw.includes("maint-materiel")) {
                      maintCount += qty;
                  }
              });
              setSecurityLines(Array.from(securityMap, ([name, count]) => ({ name, count })));
              setCurrentM365Count(m365Count);
              setCurrentM365Name(m365Name || "Microsoft 365");
              setMaintenanceCount(maintCount); 
              setIsClientVerified(true);
              logAction(`Client trouvé : ${firstRow['CLIENT']}`);
          } else { 
              alert("Aucun dossier trouvé."); 
              setIsClientVerified(false); 
              logAction(`Aucun dossier trouvé pour : ${clientName}`);
          }
      } catch (error) { 
          console.error("Erreur", error); 
          alert("Erreur lors de la recherche."); 
          logAction(`Erreur API Client: ${error.message}`);
      } finally { 
          setIsLoadingClient(false); 
      }
  };

  const toggleItemDetail = (id) => { setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] })); };
  const updateActiveConfigTab = (baseId, configIndex) => { setActiveConfigTab((prev) => ({ ...prev, [baseId]: configIndex })); };
  
  const getActiveIndexForBase = (baseId) => activeConfigTab[baseId] || 0;
  
  const getTotalQtyForBase = (baseId) => { 
      const base = computedBases.find((b) => b.id === baseId); 
      if (!base || !base.configs) return 0; 
      return base.configs.reduce((sum, config) => sum + (quantities[config.id] || 0), 0); 
  };
  
  const updateQuantity = (key, newVal) => {
    setQuantities((prev) => {
      const newState = { ...prev, [key]: newVal };
      ["entry", "mid", "high", "fixed"].forEach((baseId) => {
        const base = computedBases.find((b) => b.id === baseId);
        if (!base || !base.configs) return;
        const belongs = base.configs.some((c) => c.id === key);
        if (belongs) {
          const newBaseTotal = base.configs.reduce((sum, c) => sum + (newState[c.id] || 0), 0);
          if (newState[`${baseId}_upgrade_collab`] > newBaseTotal) newState[`${baseId}_upgrade_collab`] = newBaseTotal;
          if (newState[`${baseId}_upgrade_secu`] > newBaseTotal) newState[`${baseId}_upgrade_secu`] = newBaseTotal;
          if (newState[`${baseId}_mig_mail`] > newBaseTotal) newState[`${baseId}_mig_mail`] = newBaseTotal;
          if (newState[`${baseId}_mig_cloud`] > newBaseTotal) newState[`${baseId}_mig_cloud`] = newBaseTotal;
        }
      });
      if (key.startsWith("mini") || key.startsWith("aio")) {
        const fixedBase = computedBases.find((b) => b.id === "fixed");
        if(fixedBase && fixedBase.configs) {
            const newFixedTotal = fixedBase.configs.reduce((sum, c) => sum + (newState[c.id] || 0), 0);
            if (newState.fixed_screen > newFixedTotal * 2) { newState.fixed_screen = newFixedTotal * 2; }
        }
      }
      if (key === "screen" && newState.dual_screen > newVal) { newState.dual_screen = newVal; }
      if (key === "fixed_screen") {
        const fixedBase = computedBases.find((b) => b.id === "fixed");
        if(fixedBase && fixedBase.configs) {
            const currentFixedTotal = fixedBase.configs.reduce((sum, c) => sum + (prev[c.id] || 0), 0);
            if (newVal > currentFixedTotal * 2) return prev;
        }
      }
      return newState;
    });
  };

  const resetAll = () => { setQuantities(INITIAL_QUANTITIES); setActiveConfigTab({ entry: 0, mid: 0, high: 0, fixed: 0 }); setExpandedItems({}); setClientName(""); setIncludeBackup(false); setShowProposalModal(false); setSecurityLines([]); setCurrentM365Name(""); setCurrentM365Count(0); setMaintenanceCount(0); setClientCompanyName(""); if (isExistingClient) setIsClientVerified(false); setIsParkDetailsVisible(false); logAction("Formulaire réinitialisé."); };
  
  const getAggregatedServices = () => {
    const aggregated = {};
    computedBases.forEach((base) => {
        (base.configs || []).forEach((config) => {
            const qty = quantities[config.id] || 0;
            if (qty > 0 && config.isDynamic) {
                if (config.dynamicPrices.deploy > 0 && config.dynamicPrices.deployRef && config.dynamicPrices.deployRef !== "0") {
                    const ref = config.dynamicPrices.deployRef;
                    if (!aggregated[ref]) aggregated[ref] = { name: config.dynamicPrices.deployName, ref, qty: 0, price: config.dynamicPrices.deploy };
                    aggregated[ref].qty += qty;
                }
                if (isExistingClient) {
                    if (config.dynamicPrices.cyber > 0 && config.dynamicPrices.cyberRef && config.dynamicPrices.cyberRef !== "0") {
                        const ref = config.dynamicPrices.cyberRef;
                        if (!aggregated[ref]) aggregated[ref] = { name: config.dynamicPrices.cyberName, ref, qty: 0, price: config.dynamicPrices.cyber };
                        aggregated[ref].qty += qty;
                    }
                    if (config.dynamicPrices.maint > 0 && config.dynamicPrices.maintRef && config.dynamicPrices.maintRef !== "0") {
                        const ref = config.dynamicPrices.maintRef;
                        if (!aggregated[ref]) aggregated[ref] = { name: config.dynamicPrices.maintName, ref, qty: 0, price: config.dynamicPrices.maint };
                        aggregated[ref].qty += qty;
                    }
                }
            }
        });
    });
    return Object.values(aggregated);
  };

  const getConfigServicesList = (base, config) => {
    if (config.isDynamic) {
      return [
        { name: config.dynamicPrices.cyberName || "0", price: config.dynamicPrices.cyber || 0 },
        { name: config.dynamicPrices.maintName || "0", price: config.dynamicPrices.maint || 0 },
      ];
    }
    return base.commonServices || [];
  };

  const getConfigCollabPrice = (config, withBackup, isExisting) => {
    if (config.isDynamic) {
      if (!isExisting) return withBackup ? (config.dynamicPrices.collabSave || 0) : (config.dynamicPrices.collabStd || 0);
      return withBackup ? OPTION_BACKUP_PRICE : 0;
    }
    if (!isExisting) return withBackup ? COLLAB_PREMIUM_SAVE_PRICE : COLLAB_PREMIUM_PRICE;
    return withBackup ? OPTION_BACKUP_PRICE : 0;
  };

  const getPosteFullMonthlyPrice = (base, config, withBackup, isExisting) => { 
      if (!config) return 0;
      if (config.isDynamic) {
          const servicesPrice = (config.dynamicPrices.cyber || 0) + (config.dynamicPrices.maint || 0) + (config.dynamicPrices.deploy || 0);
          let collabPrice = 0;
          if (!isExisting) {
              collabPrice = withBackup ? (config.dynamicPrices.collabSave || 0) : (config.dynamicPrices.collabStd || 0);
          } else {
              collabPrice = withBackup ? OPTION_BACKUP_PRICE : 0;
          }
          return (config.hardwarePrice || 0) + servicesPrice + collabPrice;
      }
      const fixedServicesPrice = (base.commonServices || []).reduce((acc, s) => acc + s.price, 0); 
      let collabPrice = 0; 
      if (!isExisting) { collabPrice = withBackup ? COLLAB_PREMIUM_SAVE_PRICE : COLLAB_PREMIUM_PRICE; } 
      else { if(withBackup) collabPrice = OPTION_BACKUP_PRICE; } 
      return (config.hardwarePrice || 0) + fixedServicesPrice + collabPrice; 
  };

  const totals = useMemo(() => {
    let monthly = 0;
    computedBases.forEach((base) => {
      (base.configs || []).forEach((config) => {
        const qty = quantities[config.id] || 0;
        if (qty > 0) { const unitPrice = getPosteFullMonthlyPrice(base, config, includeBackup, isExistingClient); monthly += unitPrice * qty; }
      });
      
      // CALCUL MISE A NIVEAU UNIQUE POUR CLIENT EXISTANT
      if (isExistingClient) { 
          const upQty = quantities[`${base.id}_upgrade_m365`] || 0;
          if (upQty > 0 && dynamicConfigs.length > 0) {
              const dynPrices = dynamicConfigs[0].config.dynamicPrices;
              const m365UpgradePrice = includeBackup ? Math.max(0, (dynPrices.collabSave || 0) - OPTION_BACKUP_PRICE) : (dynPrices.collabStd || 0);
              monthly += upQty * m365UpgradePrice;
          }
      }
    });
    
    if (isFraisTempoDue) { monthly += FRAIS_TEMPO_PRICE; }
    
    ["entry", "mid", "high", "fixed"].forEach(baseId => { 
        const base = computedBases.find(b => b.id === baseId); 
        if(base) { 
            const finalMigPrice = fetchedPrices.migMail !== null ? fetchedPrices.migMail : 0;
            monthly += (quantities[`${baseId}_mig_mail`] || 0) * finalMigPrice; 
            
            const finalCloudPrice = fetchedPrices.migCloud !== null ? fetchedPrices.migCloud : 0;
            monthly += (quantities[`${baseId}_mig_cloud`] || 0) * finalCloudPrice; 
        } 
    });
    
    if (includeBackup && totalWorkstations > 0) { monthly += GLOBAL_BACKUP_SETUP_PRICE; }
    
    (OPTIONS || []).forEach((opt) => { 
        let dynPrice = opt.monthlyPrice;
        if (opt.id === "mig_sharepoint" && fetchedPrices.migSharepointRef && fetchedPrices.migSharepointRef !== "0") dynPrice = fetchedPrices.migSharepoint || 0;
        if (opt.id === "mig_teams" && fetchedPrices.migTeamsRef && fetchedPrices.migTeamsRef !== "0") dynPrice = fetchedPrices.migTeams || 0;
        monthly += dynPrice * (quantities[opt.id] || 0); 
    });

    monthly += DUAL_SCREEN_PRICE * (quantities.dual_screen || 0);
    monthly += DUAL_SCREEN_PRICE * (quantities.fixed_screen || 0);
    return { monthly: monthly, total36: monthly * 36 };
  }, [quantities, isFraisTempoDue, includeBackup, totalWorkstations, isExistingClient, computedBases, fetchedPrices, dynamicConfigs]);

  const hasSelection = totals.monthly > 0;

  const downloadProposalTxt = () => {
    return new Promise((resolve) => {
        try {
            const date = new Date().toLocaleDateString("fr-FR");
            const safeClientName = clientName || "Client";
            const typeClient = isExistingClient ? "CLIENT EXISTANT (Renouvellement)" : "NOUVEAU CLIENT";
            let content = `OFFRE DE LOCATION EVOLUTIVE - TEMPO\nDate : ${date}\nClient : ${safeClientName}\nType : ${typeClient}\n--------------------------------------------------\n\n`;
            
            content += `1. BUNDLES MATERIEL\n`;
            computedBases.forEach((base) => {
                (base.configs || []).forEach((config) => {
                const qty = quantities[config.id];
                if (qty > 0) {
                    content += `[BUNDLE] ${config.rawName || config.name} (Réf: ${config.bundleRef}) (x${qty}) -> ${((config.hardwarePrice || 0) * qty).toFixed(2)} EUR/mois\n`;
                }
                });
            });

            if (!isExistingClient && totalWorkstations > 0) {
                content += `\n2. BUNDLES LICENCES & SECURITE M365\n`;
                let m365Name = includeBackup ? globalServiceNames.saveName : globalServiceNames.stdName;
                let m365Price = includeBackup ? (dynamicConfigs[0]?.config?.dynamicPrices?.collabSave || 0) : (dynamicConfigs[0]?.config?.dynamicPrices?.collabStd || 0);
                m365Price += (dynamicConfigs[0]?.config?.dynamicPrices?.cyber || 0) + (dynamicConfigs[0]?.config?.dynamicPrices?.maint || 0);
                content += `[BUNDLE] ${m365Name || "0"} (x${totalWorkstations}) -> ${(m365Price * totalWorkstations).toFixed(2)} EUR/mois\n`;
            }

            content += `\n3. PRESTATIONS & OPTIONS GENERALES\n`;
            
            const aggregatedSrv = getAggregatedServices();
            aggregatedSrv.forEach(srv => {
                content += `- PRESTATION / SERVICE : ${srv.name || "0"} (Réf: ${srv.ref}) (x${srv.qty}) -> ${(srv.price * srv.qty).toFixed(2)} EUR/mois\n`;
            });

            if (quantities.dual_screen > 0) content += `- Option Dual Screen (x${quantities.dual_screen}) -> ${(DUAL_SCREEN_PRICE * quantities.dual_screen).toFixed(2)} EUR/mois\n`;
            if (quantities.fixed_screen > 0) content += `- Option Ecran pour Fixe (x${quantities.fixed_screen}) -> ${(DUAL_SCREEN_PRICE * quantities.fixed_screen).toFixed(2)} EUR/mois\n`;
            
            if (getTotalMigMail() > 0 && fetchedPrices.migMailRef !== "0" && fetchedPrices.migMailRef !== null) {
                content += `- ${fetchedPrices.migMailName !== "0" && fetchedPrices.migMailName !== null ? fetchedPrices.migMailName : "0"} (Réf: ${fetchedPrices.migMailRef}) (x${getTotalMigMail()}) : ${((fetchedPrices.migMail || 0) * getTotalMigMail()).toFixed(2)} EUR/mois\n`;
            }
            if (getTotalMigCloud() > 0 && fetchedPrices.migCloudRef !== "0" && fetchedPrices.migCloudRef !== null) {
                content += `- ${fetchedPrices.migCloudName !== "0" && fetchedPrices.migCloudName !== null ? fetchedPrices.migCloudName : "0"} (Réf: ${fetchedPrices.migCloudRef}) (x${getTotalMigCloud()}) : ${((fetchedPrices.migCloud || 0) * getTotalMigCloud()).toFixed(2)} EUR/mois\n`;
            }
            
            OPTIONS.filter(o => quantities[o.id] > 0).forEach(opt => {
                let n = opt.name;
                let p = opt.monthlyPrice;
                let refText = "";
                
                if (opt.id === "mig_sharepoint" && fetchedPrices.migSharepointRef && fetchedPrices.migSharepointRef !== "0") {
                    n = fetchedPrices.migSharepointName || "0";
                    p = fetchedPrices.migSharepoint || 0;
                    refText = ` (Réf: ${fetchedPrices.migSharepointRef})`;
                }
                if (opt.id === "mig_teams" && fetchedPrices.migTeamsRef && fetchedPrices.migTeamsRef !== "0") {
                    n = fetchedPrices.migTeamsName || "0";
                    p = fetchedPrices.migTeams || 0;
                    refText = ` (Réf: ${fetchedPrices.migTeamsRef})`;
                }
                
                content += `- ${n}${refText} x${quantities[opt.id]} : ${(p * quantities[opt.id]).toFixed(2)} EUR/mois\n`;
            });
            
            if (isFraisTempoDue) content += `- Frais Tempo (Logistique) x1 : ${FRAIS_TEMPO_PRICE.toFixed(2)} EUR/mois\n`;
            if (includeBackup && totalWorkstations > 0) content += `- Setup Sauvegarde x1 : ${GLOBAL_BACKUP_SETUP_PRICE.toFixed(2)} EUR/mois\n`;
            
            if (isExistingClient) {
                content += `\n4. UPGRADES (CLIENT EXISTANT)\n`;
                computedBases.forEach(base => {
                    const upQty = quantities[`${base.id}_upgrade_m365`] || 0;
                    if (upQty > 0) {
                        const bName = includeBackup ? globalServiceNames.saveName : globalServiceNames.stdName;
                        const bRef = includeBackup ? "BDPackCollaboratif+Save365" : "BDPackCollaboratif";
                        
                        let m365UpgradePrice = 0;
                        if (dynamicConfigs.length > 0) {
                            const dynPrices = dynamicConfigs[0].config.dynamicPrices;
                            m365UpgradePrice = includeBackup ? Math.max(0, (dynPrices.collabSave || 0) - OPTION_BACKUP_PRICE) : (dynPrices.collabStd || 0);
                        }
                        content += `- Mise à niveau : ${bName || "0"} (Réf: ${bRef}) x${upQty} : ${(upQty * m365UpgradePrice).toFixed(2)} EUR/mois\n`;
                    }
                });
            }
            content += `\n--------------------------------------------------\nTOTAL LOYER MENSUEL : ${totals.monthly.toFixed(2)} EUR HT\nDUREE : 36 mois\nCOUT TOTAL CONTRAT : ${totals.total36.toFixed(2)} EUR HT\n`;
            const element = document.createElement("a");
            const file = new Blob([content], { type: "text/plain;charset=utf-8" });
            element.href = URL.createObjectURL(file);
            element.download = `Offre_TEMPO_${safeClientName.replace(/\s+/g, "_")}_${date.replace(/\//g, "-")}.txt`;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
            resolve();
        } catch (error) { console.error("Erreur", error); resolve(); }
    });
  };

  const handleDownload = () => { downloadProposalTxt(); };
  const openModal = (key) => setSelectedFeature(key);
  const closeModal = () => setSelectedFeature(null);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 relative">
      {/* NAVIGATION DU HAUT (TABS) */}
      <div className="bg-slate-900 text-white shadow-md z-50 relative">
         <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-6">
                <span className="text-lg font-bold tracking-wider">SEPTEO <span className="font-normal text-blue-300">Avocats</span></span>
                <nav className="flex bg-slate-800 rounded-lg p-1">
                    <button onClick={() => setActiveTab("presentation")} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'presentation' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Présentation Offre</button>
                    <button onClick={() => setActiveTab("simulator")} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'simulator' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Simulateur</button>
                </nav>
            </div>
            <UserButton />
         </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      {activeTab === "presentation" ? (
         <div className="animate-in fade-in duration-500">
             <div className="bg-slate-900 text-white py-12 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2/3 h-full bg-blue-600/10 -skew-x-12 transform origin-top-right" />
                <div className="max-w-7xl mx-auto relative z-10 grid md:grid-cols-2 items-center gap-12">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">L'Informatique <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">dédiée aux Avocats.</span></h1>
                        <p className="text-lg text-slate-300 max-w-2xl mb-8 leading-relaxed">Une solution complète incluant le matériel HP, la sécurité managée, la suite Microsoft 365 et un support technique expert.</p>
                        <button onClick={() => setActiveTab("simulator")} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-900/50 transition-all transform hover:-translate-y-1 flex items-center gap-2">Configurer mon parc <ArrowRight size={20} /></button>
                    </div>
                    <div className="hidden md:flex justify-end">
                        <div className="p-6 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 shadow-2xl transform hover:scale-105 transition-transform">
                             <img src={LOGO_SEPTEO_HEADER} alt="Septeo Avocats" className="w-full max-w-[450px] object-contain" />
                        </div>
                    </div>
                </div>
             </div>

             <div className="max-w-4xl mx-auto px-4 pt-12 pb-6 text-center">
                 <h2 className="text-2xl font-bold text-slate-900 mb-3">Pourquoi choisir l'offre TEMPO ?</h2>
                 <p className="text-slate-500 mb-6">Une approche globale pour libérer votre cabinet des contraintes techniques.</p>
                 <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-sm text-slate-700 leading-relaxed shadow-sm text-left mx-auto">
                    <p>Nous vous proposons une transition vers une gestion de parc <strong>100% Cloud</strong>, éliminant le besoin de serveurs physiques sur site. Grâce à la technologie <strong>Microsoft Intune</strong>, nous pilotons, sécurisons et mettons à jour vos postes à distance, garantissant une conformité totale où que vous soyez. En tant qu'<strong>interlocuteur unique</strong>, nous simplifions votre quotidien : un seul point de contact pour votre matériel, vos logiciels métiers et votre cybersécurité.</p>
                 </div>
             </div>

             <div className="max-w-7xl mx-auto px-4 pb-12 pt-6">
                 <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
                    <div onClick={() => openModal('unique')} className="p-6 rounded-2xl bg-white border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group"><div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform"><Users size={24} /></div><h3 className="font-bold text-lg mb-2">Interlocuteur Unique</h3><p className="text-slate-600 text-sm">Un seul point de contact pour tout votre écosystème numérique.</p></div>
                    <div onClick={() => openModal('security')} className="p-6 rounded-2xl bg-white border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group"><div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform"><Shield size={24} /></div><h3 className="font-bold text-lg mb-2">Sécurité Managée</h3><p className="text-slate-600 text-sm">Protection SOC 24/7 anti-ransomware et surveillance active.</p></div>
                    <div onClick={() => openModal('collab')} className="p-6 rounded-2xl bg-white border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group"><div className="h-12 mb-4 flex items-center justify-center group-hover:scale-110 transition-transform"><img src={LOGO_M365} alt="Microsoft 365" className="h-full object-contain" /></div><h3 className="font-bold text-lg mb-2">Collaboration M365</h3><p className="text-slate-600 text-sm">Suite Office complète, Teams et stockage sécurisé.</p></div>
                    <div onClick={() => openModal('cloud')} className="p-6 rounded-2xl bg-white border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group"><div className="h-12 mb-4 flex items-center justify-center group-hover:scale-110 transition-transform"><img src={LOGO_INTUNE} alt="Intune" className="h-full object-contain" /></div><h3 className="font-bold text-lg mb-2">Gestion Full Cloud</h3><p className="text-slate-600 text-sm">Pilotage à distance via Intune, sans serveur local.</p></div>
                    <div onClick={() => openModal('leasing')} className="p-6 rounded-2xl bg-white border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group"><div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform"><HandCoins size={24} /></div><h3 className="font-bold text-lg mb-2">Location Évolutive</h3><p className="text-slate-600 text-sm">Financement flexible pour un parc informatique toujours à jour.</p></div>
                 </div>
             </div>

             {/* MODALE PRESENTATION */}
             {selectedFeature && PRESENTATION_DETAILS[selectedFeature] && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeModal}>
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
                    <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 p-2 rounded-full z-10"><X size={24} /></button>
                    <div className="p-10">
                       <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-6">
                           <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                             {selectedFeature === 'unique' && <Users size={36} />}
                             {selectedFeature === 'security' && <Shield size={36} />}
                             {selectedFeature === 'collab' && <Cloud size={36} />}
                             {selectedFeature === 'cloud' && <Tablet size={36} />}
                             {selectedFeature === 'leasing' && <HandCoins size={36} />}
                           </div>
                           <div><h3 className="text-3xl font-bold text-slate-900">{PRESENTATION_DETAILS[selectedFeature].title}</h3><p className="text-blue-600 font-medium text-lg">{PRESENTATION_DETAILS[selectedFeature].subtitle}</p></div>
                       </div>
                       <div className="text-slate-600 leading-relaxed text-base clearfix">
                           {PRESENTATION_DETAILS[selectedFeature].image && (
                             <div className={`hidden md:block float-right ml-8 mb-6 rounded-xl overflow-hidden border border-slate-200 shadow-lg ${['unique', 'collab'].includes(selectedFeature) ? 'w-1/2 max-w-[400px]' : 'w-2/3'}`}>
                               <img src={PRESENTATION_DETAILS[selectedFeature].image} alt="Illustration" className="w-full h-auto object-cover" />
                             </div>
                           )}
                           {PRESENTATION_DETAILS[selectedFeature].sections ? (
                               <div className="space-y-8">
                                   {PRESENTATION_DETAILS[selectedFeature].sections.map((section, idx) => (
                                       <div key={idx} className="clear-none">
                                           <h4 className="font-bold text-slate-900 text-xl mb-3 flex items-center gap-2"><span className="w-2 h-8 bg-blue-500 rounded-full inline-block"></span>{section.title}</h4>
                                           {section.content.map((item, i) => (
                                               item.type === 'paragraph' ? (<p key={i} className="text-slate-700 mb-3 text-justify">{item.text}</p>) : (<ul key={i} className="space-y-2 pl-2 mb-4">{item.items.map((li, j) => (<li key={j} className="flex items-start gap-2 text-slate-700 font-medium"><CheckCircle size={16} className="text-blue-500 mt-1 shrink-0" /><span>{li}</span></li>))}</ul>)
                                           ))}
                                       </div>
                                   ))}
                               </div>
                           ) : (
                               <div>
                                   <p className="text-lg mb-6">{PRESENTATION_DETAILS[selectedFeature].description}</p>
                                   <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                                       <h4 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Points Clés</h4>
                                       <ul className="space-y-3">
                                          {PRESENTATION_DETAILS[selectedFeature].points.map((point, i) => (<li key={i} className="flex items-start gap-3 text-base font-medium text-slate-700"><CheckCircle size={20} className="text-green-500 mt-0.5 shrink-0" /><span>{point}</span></li>))}
                                       </ul>
                                   </div>
                               </div>
                           )}
                           {PRESENTATION_DETAILS[selectedFeature].image && (<div className="md:hidden mt-6 rounded-xl overflow-hidden border border-slate-200 shadow-lg"><img src={PRESENTATION_DETAILS[selectedFeature].image} alt="Illustration" className="w-full h-auto object-cover" /></div>)}
                       </div>
                    </div>
                    <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-end"><button onClick={closeModal} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg">Fermer</button></div>
                  </div>
                </div>
             )}
         </div>
      ) : (
        /* VUE SIMULATEUR */
        <div className="animate-in slide-in-from-right duration-500 flex flex-col h-full">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg text-white transition-colors ${isExistingClient ? 'bg-emerald-600' : 'bg-blue-600'}`}><Calculator size={24} /></div>
                        <div><h1 className="text-xl font-bold text-slate-900">Configurateur offre TEMPO</h1><p className={`text-xs font-medium transition-colors ${isExistingClient ? 'text-emerald-600' : 'text-slate-500'}`}>{isExistingClient ? "Mode : Client Existant (Renouvellement)" : "Mode : Nouveau Client"}</p></div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200" title={isModeLocked ? "Veuillez réinitialiser la sélection pour changer de mode" : ""}>
                            <button disabled={isModeLocked} onClick={() => { if(!isModeLocked) { setIsExistingClient(false); setIncludeBackup(false); setIsClientVerified(false); logAction("Mode basculé sur : Nouveau Client");}}} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${!isExistingClient ? 'bg-white text-blue-700 shadow-sm' : (isModeLocked ? 'text-slate-300' : 'text-slate-500')}`}>{isModeLocked && isExistingClient ? <Lock size={12}/> : <UserPlus size={14}/>} Nouveau</button>
                            <button disabled={isModeLocked} onClick={() => { if(!isModeLocked) { setIsExistingClient(true); setIsClientVerified(false); logAction("Mode basculé sur : Client Existant");}}} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${isExistingClient ? 'bg-white text-emerald-700 shadow-sm' : (isModeLocked ? 'text-slate-300' : 'text-slate-500')}`}>{isModeLocked && !isExistingClient ? <Lock size={12}/> : <UserCheck size={14}/>} Existant</button>
                        </div>
                        <div className="text-right hidden sm:block relative">
                            <p className="text-sm text-slate-500">{isExistingClient ? "Numéro Dossier" : "Client"}</p>
                            <div className="flex items-center">
                                <input type="text" placeholder={isExistingClient ? "Dossier..." : "Entreprise..."} value={clientName} onChange={(e) => setClientName(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && isExistingClient) handleClientSearch(); }} className={`text-right font-medium border-none focus:ring-0 p-0 text-slate-800 placeholder-slate-400 bg-transparent w-40 ${isExistingClient && !isClientVerified ? 'text-red-500' : ''}`} />
                                {isExistingClient && (<button onClick={handleClientSearch} disabled={isLoadingClient || !clientName} className={`ml-2 p-1.5 rounded-full transition-colors ${isClientVerified ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>{isLoadingClient ? <Activity size={14} className="animate-spin" /> : (isClientVerified ? <Check size={14} /> : <ScanSearch size={14} />)}</button>)}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* AFFICHE LE LOADER OU LE CONTENU SELON L'ÉTAT DU FETCH */}
            {isCatalogLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center mt-24 animate-in fade-in duration-500">
                    <div className="relative mb-6">
                        <div className="w-20 h-20 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                            <Database size={24} className="animate-pulse" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Chargement du catalogue matériel</h2>
                    <p className="text-slate-500 font-medium">Récupération des postes et tarifs depuis Snowflake en temps réel...</p>
                </div>
            ) : (
                <main className="max-w-7xl w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className={`lg:col-span-2 space-y-6 transition-opacity duration-300 ${isInterfaceLocked ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                      <section>
                         <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><span className="bg-slate-200 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span><h2 className="text-lg font-bold">Sélectionner les postes</h2></div><span className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${isExistingClient ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>Mix possible dans chaque gamme</span></div>
                         <div className="grid grid-cols-1 gap-6">
                           {computedBases.map((base) => {
                             if (!base.configs || base.configs.length === 0) return null;
                             
                             const totalBaseQty = getTotalQtyForBase(base.id);
                             const isExpanded = expandedItems[base.id];
                             const theme = getThemeClasses(base.color, totalBaseQty > 0, isExistingClient);
                             const activeIndex = activeConfigTab[base.id] || 0;
                             const activeConfig = base.configs[activeIndex];
                             if (!activeConfig) return null;
                             
                             const activeConfigImages = activeConfig.bundleRef && BUNDLE_IMAGES[activeConfig.bundleRef.toLowerCase()] 
                                ? BUNDLE_IMAGES[activeConfig.bundleRef.toLowerCase()] 
                                : getImagesForConfigId(activeConfig.id);

                             const activeDisplayPrice = getPosteFullMonthlyPrice(base, activeConfig, includeBackup, isExistingClient);
                             return (
                               <div key={base.id} className="space-y-2">
                                 <div className={`relative rounded-xl border-2 transition-all duration-200 ${theme.container}`}>
                                    {(!isExistingClient && includeBackup && totalBaseQty > 0) && <div className="absolute top-[-2px] right-[-2px] bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-xl z-10 flex items-center gap-1 shadow-sm"><Check size={10} /> Pack Save M365 Actif</div>}
                                    {(isExistingClient && includeBackup && totalBaseQty > 0) && <div className="absolute top-[-2px] right-[-2px] bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-xl z-10 flex items-center gap-1 shadow-sm"><Check size={10} /> Option Save Active</div>}
                                    <div className="p-4 flex flex-col md:flex-row gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2"><base.icon className={`w-8 h-8 ${theme.text}`} /><div><h3 className="font-bold text-slate-900">{base.name}</h3><p className="text-xs text-slate-500">{base.description}</p></div>{totalBaseQty > 0 && <span className={`ml-auto md:ml-2 text-xs font-bold px-2 py-1 rounded-full ${theme.badge}`}>{totalBaseQty}</span>}</div>
                                            <div className="mb-3 flex flex-wrap gap-2">{(base.configs || []).map((conf, idx) => { const qty = quantities[conf.id] || 0; return (<button key={conf.id} onClick={() => updateActiveConfigTab(base.id, idx)} className={`text-[10px] font-semibold px-2 py-1 rounded-md border transition-all flex items-center gap-1.5 ${idx === activeIndex ? "bg-slate-800 text-white border-slate-800 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>{conf.name}{qty > 0 && <span className={`text-[9px] px-1 rounded-full ${idx === activeIndex ? "bg-white text-slate-800" : "bg-slate-200 text-slate-700"}`}>{qty}</span>}</button>); })}</div>
                                            
                                            <div className="bg-slate-50/50 rounded-lg p-2 mb-2 border border-slate-100">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1">
                                                    <Cpu size={14} className="text-slate-500" />
                                                    Spécifications :
                                                </div>
                                                <div className="text-xs text-slate-600 font-mono leading-relaxed">
                                                    {activeConfig.specs}
                                                </div>
                                                {activeConfig.accessories && activeConfig.accessories.length > 0 && (
                                                    <details className="mt-1.5 group">
                                                        <summary className="text-[10px] text-blue-500 font-medium cursor-pointer hover:text-blue-700 list-none [&::-webkit-details-marker]:hidden flex items-center gap-1 select-none w-fit">
                                                            <ChevronRight size={12} className="group-open:rotate-90 transition-transform duration-200" />
                                                            Voir les accessoires inclus ({activeConfig.accessories.length})
                                                        </summary>
                                                        <ul className="pl-5 mt-1.5 space-y-1 pb-1">
                                                            {activeConfig.accessories.map((acc, i) => (
                                                                <li key={i} className="text-[10px] text-slate-500 list-disc leading-tight">{acc}</li>
                                                            ))}
                                                        </ul>
                                                    </details>
                                                )}
                                            </div>

                                            <div className={`flex items-center gap-1 text-xs font-medium cursor-pointer w-fit transition-colors ${isExistingClient ? 'text-emerald-600 hover:text-emerald-800' : 'text-slate-500 hover:text-blue-600'}`} onClick={() => toggleItemDetail(base.id)}>{isExpanded ? "Masquer services" : "Voir services inclus"}{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</div>
                                        </div>
                                        
                                        <div className="flex flex-col justify-between items-end border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 shrink-0 gap-4 min-w-[220px]">
                                            <div className="text-right w-full relative group">
                                                <div className="flex justify-between md:flex-col items-center md:items-end">
                                                    <span className="md:hidden text-xs font-bold text-slate-500 uppercase tracking-wider">Prix unitaire</span>
                                                    <div className="text-right">
                                                        <PriceTag price={activeDisplayPrice} />
                                                        <div className="text-[9px] text-slate-400 mt-1 uppercase font-mono tracking-wider">Réf: {activeConfig.bundleRef}</div>
                                                    </div>
                                                </div>
                                                {activeConfig.isDynamic && (
                                                    <div className="absolute bottom-full right-0 mb-2 w-60 bg-slate-900 text-white text-xs p-3 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[9999] text-left border border-slate-700">
                                                        <div className="font-bold mb-2 border-b border-slate-700 pb-2 flex items-center gap-1.5"><Info size={14} className="text-blue-400"/> Détail du calcul Snowflake</div>
                                                        <div className="flex justify-between py-1 text-slate-300"><span>Matériel (/36)</span><span className="font-mono text-white">{(activeConfig.hardwarePrice || 0).toFixed(2)}€</span></div>
                                                        <div className="flex justify-between py-1 text-slate-300"><span>Installation (/36)</span><span className="font-mono text-white">{(activeConfig.dynamicPrices.deploy || 0).toFixed(2)}€</span></div>
                                                        <div className="flex justify-between py-1 text-slate-300"><span>Cyber Défense (/12)</span><span className="font-mono text-white">{(activeConfig.dynamicPrices.cyber || 0).toFixed(2)}€</span></div>
                                                        <div className="flex justify-between py-1 text-slate-300"><span>Maintenance (/12)</span><span className="font-mono text-white">{(activeConfig.dynamicPrices.maint || 0).toFixed(2)}€</span></div>
                                                        <div className="flex justify-between py-1 pt-2 mt-1 border-t border-slate-700 text-blue-300 font-bold"><span>Licence M365</span><span className="font-mono text-blue-200">+{(getConfigCollabPrice(activeConfig, includeBackup, isExistingClient)).toFixed(2)}€</span></div>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="w-full flex justify-center md:justify-end">
                                                <ImageCarousel images={activeConfigImages} />
                                            </div>

                                            <div className="flex justify-between w-full items-center mt-auto pt-2">
                                                <span className="text-[10px] text-slate-500 font-medium md:hidden uppercase tracking-wider">Quantité</span>
                                                <QuantitySelector value={quantities[activeConfig.id] || 0} onChange={(val) => { updateQuantity(activeConfig.id, val); logAction(`Modification qté ${activeConfig.name} : ${val}`); }} />
                                            </div>
                                        </div>
                                    </div>
                                    {isExpanded && <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 text-xs rounded-b-xl"><p className="font-semibold text-slate-700 mb-2 flex items-center gap-2"><Box size={14} /> Services & Logiciels inclus :</p><ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">{getConfigServicesList(base, activeConfig).map((item, idx) => ( <li key={idx} className="flex items-start gap-2 text-slate-600"><CheckCircle size={12} className="mt-0.5 text-blue-400 shrink-0" /><span>{item.name}</span></li> ))}{!isExistingClient ? (<li className={`flex items-start gap-2 font-medium ${includeBackup ? 'text-indigo-600' : 'text-blue-600'}`}><CheckCircle size={12} className="mt-0.5 shrink-0" /><span>{includeBackup ? "Pack Collaboratif Premium + Sauvegarde M365" : "Pack Collaboratif Premium"}</span></li>) : (<li className="flex items-start gap-2 font-medium text-slate-400 italic"><span>Aucune licence incluse (Matériel seul)</span></li>)}</ul></div>}
                                 </div>
                                 {base.id === "fixed" && totalBaseQty > 0 && <div className="ml-4 md:ml-8 mb-2 bg-slate-100 border border-slate-200 rounded-lg p-3 flex items-center justify-between shadow-sm animate-in slide-in-from-top-2"><div className="flex items-center gap-2"><div className="text-slate-500 bg-white p-1.5 rounded border border-slate-200"><Tv size={16} /></div><div><h5 className="text-xs font-bold text-slate-900 leading-tight">Ajouter un écran HP 24"</h5><p className="text-9px text-slate-500 mt-0.5">Pour compléter la tour (Non inclus de base) - Max 2 par poste</p></div></div><div className="flex flex-col items-end gap-1"><span className="font-bold text-slate-700 text-xs">{DUAL_SCREEN_PRICE.toFixed(2)}€</span><div className="scale-90 origin-right"><QuantitySelector value={quantities.fixed_screen} onChange={(val) => { updateQuantity("fixed_screen", val); logAction(`Option écran modifiée : ${val}`); }} max={totalBaseQty * 2} /></div></div></div>}
                                 {totalBaseQty > 0 && (
                                    <div className="ml-4 md:ml-8 space-y-3 animate-in slide-in-from-top-2 fade-in duration-300">
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            
                                            {/* OPTION MIGRATION MAIL */}
                                            {fetchedPrices.migMailRef !== "0" && fetchedPrices.migMailRef !== null && (
                                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center justify-between shadow-sm relative group cursor-help before:absolute before:left-[-18px] before:top-[-15px] before:w-[18px] before:h-[35px] before:border-l-2 before:border-b-2 before:border-slate-300 before:rounded-bl-lg">
                                                    <div className="absolute bottom-[105%] left-0 mb-2 w-64 bg-slate-900 text-white p-3 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[9999] border border-slate-700 font-mono text-[10px]">
                                                        <div className="font-bold text-orange-400 mb-1 border-b border-slate-700 pb-1">INFO SNOWFLAKE</div>
                                                        <div>NOM: {fetchedPrices.migMailName}</div>
                                                        <div>REF: {fetchedPrices.migMailRef}</div>
                                                        <div>PV BRUT: {fetchedPrices.rawPrice ? fetchedPrices.rawPrice.toFixed(2) : "0"}€</div>
                                                    </div>
                                                    <div className="flex items-center gap-2"><div className="text-orange-500 bg-white p-1.5 rounded border border-orange-100"><Mail size={16} /></div><div><h5 className="text-xs font-bold text-orange-900 leading-tight">{fetchedPrices.migMailName !== "0" ? fetchedPrices.migMailName : "Option Migration AvocatMail"}</h5><p className="text-[9px] text-orange-700 mt-0.5 leading-tight italic">Nécessaire en cas de migration d'une boite email existante vers Avocatmail</p></div></div><div className="flex flex-col items-end gap-1"><span className="font-bold text-orange-700 text-xs">{(fetchedPrices.migMail || 0).toFixed(2)}€</span><div className="scale-90 origin-right"><QuantitySelector value={quantities[`${base.id}_mig_mail`]} onChange={(val) => updateQuantity(`${base.id}_mig_mail`, val)} max={totalBaseQty} /></div></div>
                                                </div>
                                            )}

                                            {/* OPTION MIGRATION ONEDRIVE */}
                                            {fetchedPrices.migCloudRef !== "0" && fetchedPrices.migCloudRef !== null && (
                                                <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 flex items-center justify-between shadow-sm relative group cursor-help md:before:hidden before:absolute before:left-[-18px] before:top-[-15px] before:w-[18px] before:h-[35px] before:border-l-2 before:border-b-2 before:border-slate-300 before:rounded-bl-lg">
                                                    <div className="absolute bottom-[105%] left-0 mb-2 w-64 bg-slate-900 text-white p-3 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[9999] border border-slate-700 font-mono text-[10px]">
                                                        <div className="font-bold text-sky-400 mb-1 border-b border-slate-700 pb-1">INFO SNOWFLAKE</div>
                                                        <div>NOM: {fetchedPrices.migCloudName}</div>
                                                        <div>REF: {fetchedPrices.migCloudRef}</div>
                                                        <div>PV BRUT: {fetchedPrices.rawPriceCloud ? fetchedPrices.rawPriceCloud.toFixed(2) : "0"}€</div>
                                                    </div>
                                                    <div className="flex items-center gap-2"><div className="text-sky-500 bg-white p-1.5 rounded border border-sky-100"><Cloud size={16} /></div><div><h5 className="text-xs font-bold text-sky-900 leading-tight">{fetchedPrices.migCloudName !== "0" ? fetchedPrices.migCloudName : "Option Migration OneDrive"}</h5><p className="text-[9px] text-sky-700 mt-0.5 leading-tight italic">Nécessaire en cas de migration de stockage cloud (icloud, google drive/workspace, OneDrive Perso/Pro...) vers OneDrive du cabinet.</p></div></div><div className="flex flex-col items-end gap-1"><span className="font-bold text-sky-700 text-xs">{(fetchedPrices.migCloud || 0).toFixed(2)}€</span><div className="scale-90 origin-right"><QuantitySelector value={quantities[`${base.id}_mig_cloud`]} onChange={(val) => updateQuantity(`${base.id}_mig_cloud`, val)} max={totalBaseQty} /></div></div>
                                                </div>
                                            )}

                                         </div>
                                         
                                         {/* SECTION CLIENT EXISTANT : MISE A NIVEAU UNIQUE M365 */}
                                         {isExistingClient && (() => {
                                            const m365UpgradePrice = includeBackup 
                                                ? Math.max(0, (dynamicConfigs[0]?.config?.dynamicPrices?.collabSave || 0) - OPTION_BACKUP_PRICE) 
                                                : (dynamicConfigs[0]?.config?.dynamicPrices?.collabStd || 0);
                                            
                                            return (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                                    
                                                    {/* BOUTON UNIQUE MISE A NIVEAU */}
                                                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex flex-col justify-between shadow-sm h-full">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="text-emerald-600 bg-white p-1.5 rounded border border-emerald-100"><Users size={16} /></div>
                                                            <div>
                                                                <h5 className="text-xs font-bold text-emerald-900 leading-tight">
                                                                    {includeBackup ? globalServiceNames.saveName : globalServiceNames.stdName}
                                                                </h5>
                                                                <p className="text-[9px] text-emerald-700 mt-0.5">
                                                                    Mise à niveau (Réf: {includeBackup ? "BDPackCollaboratif+Save365" : "BDPackCollaboratif"})
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className="font-bold text-emerald-700 text-xs">+{m365UpgradePrice.toFixed(2)}€</span>
                                                            <div className="scale-90 origin-right">
                                                                <QuantitySelector value={quantities[`${base.id}_upgrade_m365`] || 0} onChange={(val) => updateQuantity(`${base.id}_upgrade_m365`, val)} max={totalBaseQty} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* BOUTON OPTION SAUVEGARDE GLOBALE */}
                                                    <div className={`rounded-lg p-3 flex flex-col justify-between shadow-sm border transition-colors cursor-pointer h-full ${includeBackup ? 'bg-emerald-100 border-emerald-300 ring-1 ring-emerald-400' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`} onClick={() => setIncludeBackup(!includeBackup)}>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className={`p-1.5 rounded border ${includeBackup ? 'text-emerald-700 bg-white border-emerald-200' : 'text-slate-400 bg-white border-slate-200'}`}><Database size={16} /></div>
                                                            <div>
                                                                <h5 className={`text-xs font-bold leading-tight ${includeBackup ? 'text-emerald-900' : 'text-slate-700'}`}>Option Sauvegarde M365 (Global)</h5>
                                                                <p className={`text-[9px] mt-0.5 ${includeBackup ? 'text-emerald-700' : 'text-slate-500'}`}>Global (Tout le parc)</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className={`font-bold text-xs ${includeBackup ? 'text-emerald-800' : 'text-slate-400'}`}>+{OPTION_BACKUP_PRICE.toFixed(2)}€/p</span>
                                                            {includeBackup ? (<ToggleRight className="text-emerald-600 w-8 h-8" />) : (<ToggleLeft className="text-slate-300 w-8 h-8" />)}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                         })()}

                                         {/* SECTION NOUVEAU CLIENT : BOUTON SAUVEGARDE GLOBALE */}
                                         {!isExistingClient && (
                                            <div className={`rounded-lg p-3 flex items-center justify-between shadow-sm border transition-colors cursor-pointer relative before:absolute before:left-[-18px] before:top-[-15px] before:w-[18px] before:h-[135%] before:border-l-2 before:border-b-2 before:border-slate-300 before:rounded-bl-lg ${includeBackup ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`} onClick={() => setIncludeBackup(!includeBackup)}><div className="flex items-center gap-3"><div className={`p-1.5 rounded border ${includeBackup ? 'text-indigo-600 bg-white border-indigo-100' : 'text-slate-400 bg-white border-slate-200'}`}><Database size={16} /></div><div><h5 className={`text-xs font-bold leading-tight ${includeBackup ? 'text-indigo-900' : 'text-slate-700'}`}>Option Sauvegarde M365 (Global)</h5><p className={`text-[9px] mt-0.5 leading-tight italic ${includeBackup ? 'text-indigo-700' : 'text-slate-500'}`}>Active la sauvegarde pour <strong>tous</strong> les postes du parc.</p><span className="text-[8px] opacity-70 block mt-0.5">Passe le bundle à {COLLAB_PREMIUM_SAVE_PRICE}€/mois + Forfait Setup</span></div></div><div className="flex flex-col items-end gap-1"><span className={`font-bold text-xs ${includeBackup ? 'text-indigo-700' : 'text-slate-400'}`}>+{UPGRADE_DIFF_PRICE.toFixed(2)}€/poste</span>{includeBackup ? (<ToggleRight className="text-indigo-600 w-8 h-8" />) : (<ToggleLeft className="text-slate-300 w-8 h-8" />)}</div></div>
                                         )}
                                    </div>
                                 )}
                               </div>
                             );
                           })}
                         </div>
                      </section>
                      <section className="mt-8">
                        <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><span className="bg-slate-200 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span><h2 className="text-lg font-bold">Options & Infrastructure</h2></div></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {OPTIONS.map((opt) => {
                             const isSP = opt.id === "mig_sharepoint";
                             const isTeams = opt.id === "mig_teams";
                             
                             const dynRef = isSP ? fetchedPrices.migSharepointRef : (isTeams ? fetchedPrices.migTeamsRef : "1"); 
                             
                             if ((isSP || isTeams) && (dynRef === "0" || dynRef === null)) return null;

                             const dynName = isSP ? fetchedPrices.migSharepointName : (isTeams ? fetchedPrices.migTeamsName : opt.name);
                             const dynPrice = isSP ? fetchedPrices.migSharepoint : (isTeams ? fetchedPrices.migTeams : opt.monthlyPrice);
                             const rawPrice = isSP ? fetchedPrices.rawPriceSharepoint : (isTeams ? fetchedPrices.rawPriceTeams : null);

                             const theme = getThemeClasses(opt.color, (quantities[opt.id] || 0) > 0, false);
                             return (
                              <div key={opt.id} className={`p-4 rounded-xl border-2 transition-all relative group ${isSP || isTeams ? 'cursor-help' : ''} ${theme.container}`}>
                                {(isSP || isTeams) && (
                                    <div className="absolute bottom-[105%] left-0 mb-2 w-64 bg-slate-900 text-white p-3 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[9999] border border-slate-700 font-mono text-[10px]">
                                        <div className={`font-bold mb-1 border-b border-slate-700 pb-1 ${isSP ? 'text-teal-400' : 'text-indigo-400'}`}>INFO SNOWFLAKE</div>
                                        <div>NOM: {dynName}</div>
                                        <div>REF: {dynRef}</div>
                                        <div>PV BRUT: {rawPrice ? rawPrice.toFixed(2) : "0"}€</div>
                                    </div>
                                )}
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${theme.iconBg}`}>{opt.icon}</div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">{dynName !== "0" && dynName !== null ? dynName : opt.name}</h4>
                                            {isSP ? (
                                                <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1 text-justify pr-2">
                                                    Prestation de migration directe de vos partages de fichiers locaux vers SharePoint Online, avec reprise à l'identique de votre arborescence standard. Cette offre permet une transition rapide vers le Cloud, mais exclut la restructuration d'arborescences "métiers" complexes et la migration de sites SharePoint déjà structurés.
                                                </p>
                                            ) : (
                                                <p className="text-[10px] text-slate-500 font-medium">{opt.isService ? "Prestation unique (par lot)" : (opt.hasDeployment ? `+${opt.deploymentPrice}€ Frais Install` : "")}</p>
                                            )}
                                        </div>
                                    </div>
                                    <PriceTag price={dynPrice || 0} />
                                </div>
                                {opt.details && (<ul className="mb-4 space-y-1">{opt.details.filter(detail => !detail.toLowerCase().includes("prestation pour migrer")).map((detail, idx) => (<li key={idx} className="flex items-start gap-2 text-[10px] text-slate-600"><CheckCircle size={10} className="mt-0.5 text-slate-400 flex-shrink-0" /><span>{detail}</span></li>))}</ul>)}
                                <div className="flex justify-end"><QuantitySelector value={quantities[opt.id] || 0} onChange={(val) => { updateQuantity(opt.id, val); logAction(`Option ${opt.name} : ${val}`); }} /></div>
                                {opt.id === "screen" && (quantities.screen > 0) && (<div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center bg-purple-50 p-2 rounded"><div className="text-xs text-purple-800 font-bold">Ajouter 2ème écran HP<span className="block text-[10px] font-normal text-purple-600">Dual Screen (+{DUAL_SCREEN_PRICE}€/mois)</span></div><div className="scale-90 origin-right"><QuantitySelector value={quantities.dual_screen || 0} onChange={(val) => updateQuantity("dual_screen", val)} max={quantities.screen} /></div></div>)}
                              </div>
                             );
                          })}
                        </div>
                      </section>
                    </div>
                    <div className="lg:col-span-1 space-y-4">
                      <AssetGauge count={totalAssets} isExistingClient={isExistingClient} />
                      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden sticky top-24">
                        <div className={`p-6 relative text-white ${isExistingClient ? 'bg-emerald-900' : 'bg-slate-900'}`}><h3 className="text-lg font-medium opacity-80 mb-1">Total Loyer Mensuel</h3><div className="text-4xl font-bold tracking-tight">{totals.monthly.toFixed(2)} €<span className="text-lg font-normal text-white/60">/HT</span></div><p className="text-xs text-white/60 mt-2">Engagement 36 mois</p></div>
                        <div className="p-6 space-y-4">
                          {!hasSelection ? ( <div className="text-center py-8 text-slate-400"><p>Aucun élément sélectionné</p></div> ) : (
                            <div className="space-y-3">
                              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Votre sélection</div>
                              {computedBases.map((base) => { const activeConfigs = (base.configs || []).filter((c) => quantities[c.id] > 0); if (activeConfigs.length === 0) return null; return activeConfigs.map((config) => { const bundlePrice = getPosteFullMonthlyPrice(base, config, includeBackup, isExistingClient); const qty = quantities[config.id]; return ( <div key={config.id} className="flex justify-between text-sm items-start"><div className="text-slate-700"><span className="font-bold text-slate-900 mr-1">{qty}x</span>{base.name.replace("Poste ", "")} <span className="text-[10px] text-slate-400">({config.name})</span></div><span className="font-medium whitespace-nowrap">{(bundlePrice * qty).toFixed(2)} €</span></div> ); }); })}
                              
                              {/* LIGNE MISE A NIVEAU UNIQUE POUR LE RECAPITULATIF */}
                              {isExistingClient && computedBases.map(base => { 
                                  const upQty = quantities[`${base.id}_upgrade_m365`] || 0; 
                                  if(upQty === 0) return null; 
                                  
                                  const bName = includeBackup ? globalServiceNames.saveName : globalServiceNames.stdName;
                                  let m365UpgradePrice = 0;
                                  if (dynamicConfigs.length > 0) {
                                      const dynPrices = dynamicConfigs[0].config.dynamicPrices;
                                      m365UpgradePrice = includeBackup ? Math.max(0, (dynPrices.collabSave || 0) - OPTION_BACKUP_PRICE) : (dynPrices.collabStd || 0);
                                  }

                                  return ( 
                                      <div key={`upgrade-${base.id}`} className="border-t border-dashed border-slate-200 pt-1 mt-1"> 
                                          <div className="flex justify-between text-sm items-start text-emerald-700 bg-emerald-50 px-2 py-1 rounded mb-1">
                                              <div><span className="font-bold mr-1">{upQty}x</span>{bName} ({base.name.split(' ')[1]})</div>
                                              <span className="font-medium whitespace-nowrap">{(upQty * m365UpgradePrice).toFixed(2)} €</span>
                                          </div> 
                                      </div> 
                                  ); 
                              })}

                              {isFraisTempoDue && ( <div className="flex justify-between text-sm items-start text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200"><div><span className="font-bold mr-1">1x</span>Frais Tempo (Forfait)</div><span className="font-medium whitespace-nowrap">{FRAIS_TEMPO_PRICE.toFixed(2)} €</span></div> )}
                              
                              {/* AGREGEATION SERVICES GLOBAUX DU RECAP */}
                              {(() => {
                                  const aggregated = getAggregatedServices();
                                  if (aggregated.length === 0) return null;
                                  return (
                                      <div className="border-t border-dashed border-slate-200 pt-1 mt-1 space-y-1">
                                          {aggregated.map((srv, idx) => (
                                              <div key={`agg-${idx}`} className="flex justify-between text-sm items-start text-slate-700 bg-slate-50 px-2 py-1 rounded">
                                                  <div><span className="font-bold mr-1">{srv.qty}x</span>{srv.name || "0"}</div>
                                                  <span className="font-medium whitespace-nowrap">{(srv.price * srv.qty).toFixed(2)} €</span>
                                              </div>
                                          ))}
                                      </div>
                                  );
                              })()}

                              {includeBackup && totalWorkstations > 0 && (<div className={`flex flex-col gap-1 p-2 rounded border ${isExistingClient ? 'bg-emerald-50 border-emerald-200' : 'bg-indigo-50 border-indigo-200'}`}><div className="flex justify-between items-center text-xs"><span className={`font-medium flex items-center gap-1 ${isExistingClient ? 'text-emerald-700' : 'text-indigo-700'}`}><Wrench size={10}/> Setup Sauvegarde (Unique)</span><div className="text-right"><span className={`${isExistingClient ? 'text-emerald-400' : 'text-indigo-400'} mr-2`}>1 x {GLOBAL_BACKUP_SETUP_PRICE.toFixed(2)}€</span><span className={`font-bold ${isExistingClient ? 'text-emerald-800' : 'text-indigo-800'}`}>{GLOBAL_BACKUP_SETUP_PRICE.toFixed(2)} €</span></div></div></div>)}
                              
                              {getTotalMigMail() > 0 && fetchedPrices.migMailRef !== "0" && fetchedPrices.migMailRef !== null && ( 
                                  <div className="flex justify-between text-sm items-start text-orange-700 bg-orange-50 px-2 py-1 rounded border border-orange-200">
                                      <div><span className="font-bold mr-1">{getTotalMigMail()}x</span>{fetchedPrices.migMailName !== "0" ? fetchedPrices.migMailName : "Option Migration AvocatMail"}</div>
                                      <span className="font-medium whitespace-nowrap">{((fetchedPrices.migMail || 0) * getTotalMigMail()).toFixed(2)} €</span>
                                  </div> 
                              )}
                              
                              {getTotalMigCloud() > 0 && fetchedPrices.migCloudRef !== "0" && fetchedPrices.migCloudRef !== null && ( 
                                  <div className="flex justify-between text-sm items-start text-sky-700 bg-sky-50 px-2 py-1 rounded border border-sky-200">
                                      <div><span className="font-bold mr-1">{getTotalMigCloud()}x</span>{fetchedPrices.migCloudName !== "0" ? fetchedPrices.migCloudName : "Option Migration OneDrive"}</div>
                                      <span className="font-medium whitespace-nowrap">{((fetchedPrices.migCloud || 0) * getTotalMigCloud()).toFixed(2)} €</span>
                                  </div> 
                              )}

                              {(OPTIONS || []).filter((o) => quantities[o.id] > 0).map((opt) => {
                                  let isSP = opt.id === "mig_sharepoint";
                                  let isTeams = opt.id === "mig_teams";
                                  let dynRef = isSP ? fetchedPrices.migSharepointRef : (isTeams ? fetchedPrices.migTeamsRef : "1");
                                  let dynName = isSP ? fetchedPrices.migSharepointName : (isTeams ? fetchedPrices.migTeamsName : opt.name);
                                  let dynPrice = isSP ? fetchedPrices.migSharepoint : (isTeams ? fetchedPrices.migTeams : opt.monthlyPrice);

                                  if ((isSP || isTeams) && (dynRef === "0" || dynRef === null)) return null;

                                  return ( <div key={opt.id} className="flex justify-between text-sm items-start text-indigo-700 bg-indigo-50 px-2 py-1 rounded"><div><span className="font-bold mr-1">{quantities[opt.id]}x</span>{dynName !== "0" && dynName !== null ? dynName : opt.name}</div><span className="font-medium whitespace-nowrap">{((dynPrice || 0) * quantities[opt.id]).toFixed(2)} €</span></div> )
                              })}

                              {quantities.dual_screen > 0 && ( <div className="flex justify-between text-sm items-start text-indigo-700 bg-indigo-100 px-2 py-1 rounded border border-indigo-200"><div><span className="font-bold mr-1">{quantities.dual_screen}x</span>Option Dual Screen</div><span className="font-medium whitespace-nowrap">{(DUAL_SCREEN_PRICE * quantities.dual_screen).toFixed(2)} €</span></div> )}
                              {quantities.fixed_screen > 0 && ( <div className="flex justify-between text-sm items-start text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200"><div><span className="font-bold mr-1">{quantities.fixed_screen}x</span>Option Ecran (Fixe)</div><span className="font-medium whitespace-nowrap">{(DUAL_SCREEN_PRICE * quantities.fixed_screen).toFixed(2)} €</span></div> )}
                            </div>
                          )}
                          <button onClick={() => setShowProposalModal(true)} disabled={!hasSelection} className={`w-full font-bold py-3 px-4 rounded-xl transition-colors shadow-lg mt-4 flex items-center justify-center gap-2 relative z-20 ${hasSelection ? (isExistingClient ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 cursor-pointer" : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 cursor-pointer") : "bg-slate-300 text-slate-500 cursor-not-allowed"}`}><FileText size={18} />Références pour projets MySepteo</button>
                          <button className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium py-3 px-4 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2" onClick={resetAll}><Trash2 size={16} />Tout réinitialiser</button>
                        </div>
                        {isExistingClient && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mx-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
                             {/* EN-TÊTE CLIQUABLE POUR MASQUER/AFFICHER */}
                             <div 
                               className="flex justify-between items-center cursor-pointer mb-2"
                               onClick={() => setIsParkDetailsVisible(!isParkDetailsVisible)}
                             >
                                <h4 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                                    <Activity size={16} /> Parc Actuel (Déclaratif)
                                </h4>
                                <button className="text-emerald-600 hover:text-emerald-800 transition-colors">
                                    {isParkDetailsVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                             </div>
                             
                             {/* CONTENU MASQUÉ PAR DÉFAUT */}
                             {isParkDetailsVisible && (
                                 <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div><label className="text-[10px] uppercase font-bold text-emerald-600 mb-1 block">Pack Sécurité</label>{securityLines.length > 0 ? (securityLines.map((line, idx) => (<div key={idx} className="flex gap-2 mb-2 last:mb-0"><div className="relative flex-1"><ShieldCheck size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-emerald-400" /><input type="text" readOnly value={line.name} className="w-full text-sm border border-emerald-200 rounded-md py-1.5 pl-8 pr-2 bg-slate-100 text-emerald-800 font-medium" /></div><input type="number" readOnly value={line.count} className="w-16 text-center font-bold text-sm border border-emerald-200 rounded-md py-1.5 px-2 bg-slate-100 text-emerald-900 appearance-none" /></div>))) : (<div className="flex gap-2"><div className="relative flex-1"><ShieldCheck size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-emerald-400" /><input type="text" placeholder="Aucun pack détecté" readOnly className="w-full text-sm border border-emerald-200 rounded-md py-1.5 pl-8 pr-2 bg-slate-50 text-slate-400 italic" /></div><input type="number" placeholder="-" readOnly className="w-16 text-center font-bold text-sm border border-emerald-200 rounded-md py-1.5 px-2 bg-slate-50 text-slate-400 appearance-none" /></div>)}</div>
                                    <div><label className="text-[10px] uppercase font-bold text-emerald-600 mb-1 block">Abonnements Microsoft365</label><div className="flex gap-2"><div className="relative flex-1"><Database size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-emerald-400" /><input type="text" readOnly value={currentM365Name || (currentM365Count > 0 ? "Microsoft 365" : "")} placeholder={currentM365Count > 0 ? "" : "Aucun abonnement détecté"} className={`w-full text-sm border border-emerald-200 rounded-md py-1.5 pl-8 pr-2 ${currentM365Count > 0 ? "bg-slate-100 text-emerald-800 font-medium" : "bg-slate-50 text-slate-400 italic"}`} /></div><input type="number" readOnly value={currentM365Count || ""} placeholder="-" className={`w-16 text-center font-bold text-sm border border-emerald-200 rounded-md py-1.5 px-2 appearance-none ${currentM365Count > 0 ? "bg-slate-100 text-emerald-900" : "bg-slate-50 text-slate-400"}`} /></div></div>
                                    <div><label className="text-[10px] uppercase font-bold text-emerald-600 mb-1 block">Contrat de Maintenance</label><div className="flex gap-2"><div className="relative flex-1"><Wrench size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-emerald-400" /><input type="text" readOnly value={maintenanceCount > 0 ? "Maintenance Matériel" : "Aucun contrat"} className={`w-full text-sm border border-emerald-200 rounded-md py-1.5 pl-8 pr-2 ${maintenanceCount > 0 ? "bg-slate-100 text-emerald-800 font-medium" : "bg-slate-50 text-slate-400 italic"}`} /></div><input type="number" readOnly value={maintenanceCount || ""} placeholder="-" className={`w-16 text-center font-bold text-sm border border-emerald-200 rounded-md py-1.5 px-2 appearance-none ${maintenanceCount > 0 ? "bg-slate-100 text-emerald-900" : "bg-slate-50 text-slate-400"}`} /></div></div>
                                 </div>
                             )}
                          </div>
                        )}
                      </div>
                    </div>
                </main>
            )}
            
            {/* --- MODALE RECAPITULATIF (AVEC SOUS-PRODUITS DETAILES) --- */}
            {showProposalModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                    <div className={`p-6 flex justify-between items-start text-white ${isExistingClient ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                        <div><h2 className="text-xl font-bold flex items-center gap-2"><List size={24} />Récapitulatif Offre</h2><p className="text-blue-100 text-sm mt-1">Format Base de référence produits MySepteo</p></div>
                        <button onClick={() => setShowProposalModal(false)} className="text-blue-100 hover:text-white hover:bg-white/20 p-1 rounded-full transition-colors"><X size={24} /></button>
                    </div>
                    <div className="p-6 overflow-y-auto custom-scrollbar bg-slate-50 text-sm">
                        <div className="space-y-6">
                           <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                               <h3 className="font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2"><FileText size={16} className="text-blue-600"/>Résumé de la commande</h3>
                               <div className="space-y-4">
                                   <div>
                                       <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">1. Bundles Matériel</h4>
                                       {computedBases.map(base => {
                                           const activeConfigs = (base.configs || []).filter(c => quantities[c.id] > 0);
                                           if(activeConfigs.length === 0) return null;
                                           return activeConfigs.map(config => {
                                               const qty = quantities[config.id];
                                               return (
                                               <div key={config.id} className="flex justify-between text-sm py-1 border-b border-slate-50 last:border-0">
                                                   <span className="text-slate-700 font-medium"><span className="font-bold mr-2 text-blue-600">{qty}x</span> {config.rawName || config.name}</span>
                                                   <span className="font-mono text-slate-500">{((config.hardwarePrice || 0) * qty).toFixed(2)}€</span>
                                               </div>
                                           )});
                                       })}
                                   </div>

                                   {/* BUNDLE M365 SEPARE POUR LES NOUVEAUX CLIENTS */}
                                   {!isExistingClient && totalWorkstations > 0 && (
                                       <div>
                                           <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 mt-4">2. Bundles Licences & Sécurité M365</h4>
                                           <div className="flex justify-between text-sm py-1 border-b border-slate-50 last:border-0 pl-4 border-l-2 border-blue-200 bg-blue-50/50 mt-2 rounded pr-2">
                                               <span className="text-blue-800 font-medium"><span className="font-bold mr-2">{totalWorkstations}x</span> {includeBackup ? globalServiceNames.saveName : globalServiceNames.stdName}</span>
                                               <span className="font-mono text-blue-600 font-bold">{((includeBackup ? (dynamicConfigs[0]?.config?.dynamicPrices?.collabSave || 0) : (dynamicConfigs[0]?.config?.dynamicPrices?.collabStd || 0)) * totalWorkstations).toFixed(2)}€</span>
                                           </div>
                                       </div>
                                   )}

                                   <div>
                                       <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 mt-4">3. Prestations & Options Complémentaires</h4>
                                       
                                       {/* Prestations associées aux postes (AGRÉGÉES POUR TOUT LE PARC) */}
                                       {getAggregatedServices().map((srv, idx) => (
                                            <div key={`agg-srv-${idx}`} className="flex justify-between text-sm py-1 pl-4 border-l-2 border-slate-200">
                                                <span className="text-slate-700">
                                                    <span className="font-bold">{srv.qty}x</span> {srv.name || "0"}
                                                    <span className="text-[10px] text-slate-400 ml-1">({srv.ref})</span>
                                                </span>
                                                <span className="font-mono text-slate-500">{(srv.price * srv.qty).toFixed(2)}€</span>
                                            </div>
                                       ))}

                                       {quantities.dual_screen > 0 && <div className="flex justify-between text-sm py-1 pl-4 border-l-2 border-slate-200"><span className="text-slate-700"><span className="font-bold">{quantities.dual_screen}x</span> Dual Screen (2e écran)</span><span className="font-mono text-slate-500">{(quantities.dual_screen * DUAL_SCREEN_PRICE).toFixed(2)}€</span></div>}
                                       {quantities.fixed_screen > 0 && <div className="flex justify-between text-sm py-1 pl-4 border-l-2 border-slate-200"><span className="text-slate-700"><span className="font-bold">{quantities.fixed_screen}x</span> Ecran Fixe HP</span><span className="font-mono text-slate-500">{(quantities.fixed_screen * DUAL_SCREEN_PRICE).toFixed(2)}€</span></div>}
                                       
                                       {/* AFFICHAGE OPTIONS DYNAMIQUES DANS LE RECAP */}
                                       {getTotalMigMail() > 0 && fetchedPrices.migMailRef !== "0" && fetchedPrices.migMailRef !== null && (
                                           <div className="flex justify-between text-sm py-1 pl-4 border-l-2 border-slate-200">
                                               <span className="text-slate-700">
                                                   <span className="font-bold">{getTotalMigMail()}x</span> {fetchedPrices.migMailName !== "0" && fetchedPrices.migMailName !== null ? fetchedPrices.migMailName : "0"}
                                                   <span className="text-[10px] text-slate-400 ml-1">({fetchedPrices.migMailRef})</span>
                                               </span>
                                               <span className="font-mono text-slate-500">{((fetchedPrices.migMail || 0) * getTotalMigMail()).toFixed(2)}€</span>
                                           </div>
                                       )}
                                       {getTotalMigCloud() > 0 && fetchedPrices.migCloudRef !== "0" && fetchedPrices.migCloudRef !== null && (
                                           <div className="flex justify-between text-sm py-1 pl-4 border-l-2 border-slate-200">
                                               <span className="text-slate-700">
                                                   <span className="font-bold">{getTotalMigCloud()}x</span> {fetchedPrices.migCloudName !== "0" && fetchedPrices.migCloudName !== null ? fetchedPrices.migCloudName : "0"}
                                                   <span className="text-[10px] text-slate-400 ml-1">({fetchedPrices.migCloudRef})</span>
                                               </span>
                                               <span className="font-mono text-slate-500">{((fetchedPrices.migCloud || 0) * getTotalMigCloud()).toFixed(2)}€</span>
                                           </div>
                                       )}

                                       {(OPTIONS || []).filter(o => o.isService && quantities[o.id] > 0).map(opt => {
                                           let isSP = opt.id === "mig_sharepoint";
                                           let isTeams = opt.id === "mig_teams";
                                           
                                           let dynRef = isSP ? fetchedPrices.migSharepointRef : (isTeams ? fetchedPrices.migTeamsRef : "1");
                                           if ((isSP || isTeams) && (dynRef === "0" || dynRef === null)) return null;

                                           let n = opt.name;
                                           let p = opt.monthlyPrice;
                                           let ref = "";
                                           if (isSP) {
                                               n = fetchedPrices.migSharepointName !== "0" ? fetchedPrices.migSharepointName : "0";
                                               p = fetchedPrices.migSharepoint || 0;
                                               ref = fetchedPrices.migSharepointRef;
                                           }
                                           if (isTeams) {
                                               n = fetchedPrices.migTeamsName !== "0" ? fetchedPrices.migTeamsName : "0";
                                               p = fetchedPrices.migTeams || 0;
                                               ref = fetchedPrices.migTeamsRef;
                                           }

                                           return (
                                               <div key={opt.id} className="flex justify-between text-sm py-1 border-b border-slate-50 last:border-0 pl-4 border-l-2 border-slate-200">
                                                   <span className="text-slate-700">
                                                       <span className="font-bold">{quantities[opt.id]}x</span> {n}
                                                       {ref && ref !== "1" && <span className="text-[10px] text-slate-400 ml-1">({ref})</span>}
                                                   </span>
                                                   <span className="font-mono text-slate-500">{(p * quantities[opt.id]).toFixed(2)}€</span>
                                               </div>
                                           );
                                       })}

                                       {isFraisTempoDue && <div className="flex justify-between text-sm py-1 pl-4 border-l-2 border-slate-200"><span className="text-slate-700"><span className="font-bold">1x</span> Frais Tempo (Logistique)</span><span className="font-mono text-slate-500">{FRAIS_TEMPO_PRICE.toFixed(2)}€</span></div>}
                                       {includeBackup && totalWorkstations > 0 && <div className="flex justify-between text-sm py-1 pl-4 border-l-2 border-slate-200"><span className="text-slate-700"><span className="font-bold">1x</span> Setup Sauvegarde</span><span className="font-mono text-slate-500">{GLOBAL_BACKUP_SETUP_PRICE.toFixed(2)}€</span></div>}
                                   </div>
                                   
                                   {/* LIGNE MISE A NIVEAU UNIQUE POUR LE RECAPITULATIF */}
                                   {isExistingClient && (
                                       <div>
                                           <h4 className="text-xs font-bold text-emerald-600 uppercase mb-2 mt-4">4. Upgrades (Client Existant)</h4>
                                           {computedBases.map(base => {
                                                const upQty = quantities[`${base.id}_upgrade_m365`] || 0;
                                                if(upQty === 0) return null;
                                                
                                                const bName = includeBackup ? globalServiceNames.saveName : globalServiceNames.stdName;
                                                const bRef = includeBackup ? "BDPackCollaboratif+Save365" : "BDPackCollaboratif";
                                                
                                                let m365UpgradePrice = 0;
                                                if (dynamicConfigs.length > 0) {
                                                    const dynPrices = dynamicConfigs[0].config.dynamicPrices;
                                                    m365UpgradePrice = includeBackup ? Math.max(0, (dynPrices.collabSave || 0) - OPTION_BACKUP_PRICE) : (dynPrices.collabStd || 0);
                                                }

                                                return (
                                                    <div key={`up-${base.id}`}>
                                                        <div className="flex justify-between text-sm py-1 pl-4 border-l-2 border-emerald-200 bg-emerald-50 mb-1 rounded pr-2">
                                                            <span className="text-emerald-700">
                                                                <span className="font-bold">{upQty}x</span> Mise à niveau {bName || "0"} 
                                                                <span className="text-[10px] text-emerald-500 ml-1">({bRef})</span>
                                                            </span>
                                                            <span className="font-mono text-emerald-600">{(upQty * m365UpgradePrice).toFixed(2)}€</span>
                                                        </div>
                                                    </div>
                                                )
                                           })}
                                       </div>
                                   )}

                                   <div className="mt-4 pt-4 border-t-2 border-slate-100 flex justify-between items-center">
                                       <span className="font-bold text-slate-900">Total Mensuel</span>
                                       <span className="text-xl font-bold text-blue-600">{totals.monthly.toFixed(2)} €</span>
                                   </div>
                               </div>
                           </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 border-t border-slate-200 flex justify-end gap-3"><button onClick={() => setShowProposalModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Fermer</button><button onClick={handleDownload} className={`px-4 py-2 text-white rounded-lg font-bold flex items-center gap-2 transition-colors shadow-md ${isExistingClient ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}><Download size={18} /> Télécharger le fichier .txt</button></div>
                  </div>
                </div>
            )}
        </div>
      )}

      {/* --- CONSOLE DEBUG SNOWFLAKE --- */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${isDebugOpen ? 'translate-y-0' : 'translate-y-[calc(100%-40px)]'}`}>
        <div className="bg-slate-900 border-t border-slate-700 shadow-2xl flex flex-col h-64">
            <div className="w-full h-10 bg-slate-800 flex items-center justify-between px-4 border-b border-slate-700 cursor-pointer" onClick={() => setIsDebugOpen(!isDebugOpen)}>
                <div className="flex items-center gap-2 text-white">
                    <Terminal size={14} className="text-green-400" />
                    <span className="text-xs font-mono">CONSOLE DEBUG : SNOWFLAKE DATA</span>
                    {snowflakeData && (
                        <span className={`px-2 py-0.5 rounded text-[10px] ${snowflakeData.error ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
                            {snowflakeData.error ? 'ERREUR API' : 'DONNÉES REÇUES'}
                        </span>
                    )}
                </div>
                <button className="text-slate-400 hover:text-white">
                    {isDebugOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
            </div>
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
