import React, { useState, useMemo, useEffect } from "react";

// 1. IMPORTS SÉCURISÉS
import {
  Laptop, Monitor, Shield, Calculator, FileText, ChevronDown, ChevronUp,
  Server, Plus, Minus, Trash2, Package, Gift, Box, Cloud, Mail,
  Wrench, Database, Briefcase, Crown, Wifi, Download, X, List, Cpu, Tv,
  ChevronLeft, ChevronRight, ZoomIn, CheckCircle, Check, ToggleLeft, ToggleRight,
  FolderUp, Users, Activity, Terminal, 
  UserPlus, UserCheck, ShieldCheck, Lock, 
  ScanSearch, // Icone pour la recherche client (évite le bug "Search")
  ArrowRight, Tablet, Copy, HandCoins, Eye, EyeOff
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

// --- CONFIGURATION DES IMAGES ---
const LOGO_SEPTEO_HEADER = "./logosepteo2.png"; 
const LOGO_SEPTEO = "./images.png"; 
const LOGO_M365 = "./M365_Copilot_Logo_400x250_e2e764baed.png";
const LOGO_INTUNE = "./microsoft-intune.jpg";
const IMG_SECU_SCHEMA = "./Packsecuanalog.jpg";
const IMG_CARTE_FRANCE = "./carte.jpg";
const IMG_INTUNE_SCHEMA = "./intune2.jpg";

// --- CONTENU DES FENÊTRES DÉTAILLÉES ---
const PRESENTATION_DETAILS = {
  unique: {
    title: "Interlocuteur Unique",
    subtitle: "Une gestion centralisée pour votre sérénité",
    description: "Fini la multiplication des prestataires qui se renvoient la balle. Avec Septeo Avocats, vous avez un seul point de contact pour l'ensemble de votre chaîne de valeur numérique : du PC physique aux logiciels métiers, en passant par la sécurité et le cloud.",
    points: [
      "Support dédié Avocats (spécialistes métier)",
      "Guichet unique Matériel + Logiciel métier + Cybersécurité", 
      "Suivi de parc proactif et remplacement J+1",
      "Nous constatons deux fois moins d'appels pour problème au support des cabinets pour qui nous gérons l'ensemble de l'écosystème"
    ],
    image: IMG_CARTE_FRANCE
  },
  security: {
    title: "Sécurité Managée (SOC)",
    subtitle: "Une forteresse active 24/7 pour votre Cloud",
    sections: [
      {
        title: "La protection active",
        content: [
           { type: 'paragraph', text: "Dans un environnement Full Cloud, votre PC n'héberge plus les données mais il héberge les accès (la clé du cabinet). Si un poste est compromis par une attaque par rebond, il sert de base arrière pour infiltrer votre Microsoft 365 ou le Cloud SEPTEO. Notre offre verrouille cette porte d'entrée avec une triple couche de protection." }
        ]
      },
      {
        title: "Points Clés",
        content: [
          { type: 'list', items: [
            "EDR & MDR (Bitdefender) : Analyse comportementale + Experts SOC intervenant 24/7 en moins de 30 min.",
            "XDR Microsoft 365 : Détecte les flux anormaux directement dans le Cloud (ex : vol massif de dossiers SharePoint, usurpation d'identité, vol d'emails...).",
            "Albert (Phishing) : Entraînement de vos collaborateurs pour qu'ils deviennent votre première ligne de défense."
          ]}
        ]
      },
      {
        title: "Statistiques 2025",
        content: [
          { type: 'paragraph', text: "Sur 2025 nous avions environ 9000 postes équipés de notre solution de sécurité avancée :" },
          { type: 'list', items: [
            "182 isolations de postes compromis par les équipes Bitdefender en moins de 30mins avec vérification des équipes techniques Septeo Avocats.",
            "244 réponses actions du SOC Bitdefender (blocage fichier, utilisateur, processus) verification à effectuer par nos équipes.",
            "7485 recommandations d’actions de verification (spam/phishing).",
            "210 Applications suspectes ou détournées de leur fonction bloquées automatiquement."
          ]}
        ]
      }
    ],
    image: IMG_SECU_SCHEMA
  },
  collab: {
    title: "Microsoft 365 Business Premium",
    subtitle: "Productivité et Gouvernance",
    sections: [
      {
        title: "Le Socle Collaboratif : Office & Teams",
        content: [
          { type: 'list', items: [
            "Applications Office Premium : La suite complète sur tous vos appareils (PC/Mac/Mobile) pour une productivité sans interruption, au bureau comme en déplacement.",
            "Microsoft Teams : L'espace de travail unique qui centralise conversations, visioconférences et collaboration pour fluidifier les échanges."
          ]}
        ]
      },
      {
        title: "Stockage Cloud Intelligent (OneDrive & SharePoint)",
        content: [
          { type: 'list', items: [
            "Collaboration fluide : Travaillez à plusieurs en même temps sur les mêmes documents (co-édition).",
            "Sécurité des données : Profitez d'1 To de stockage par utilisateur et de l'historique des versions pour restaurer un fichier à une date antérieure en un clic."
          ]}
        ]
      },
      {
        title: "Archivage et Conformité (Les Atouts Premium)",
        content: [
          { type: 'paragraph', text: "C'est sur ces fonctionnalités que la licence Business Premium sécurise l'avenir juridique et historique de l'entreprise :" },
          { type: 'list', items: [
            "Archivage à extension automatique : Capacité de stockage quasi illimitée pour vos archives.",
            "Conservation pour litige : Gardez une trace de tout. Retrouvez n'importe quel échange ou document en cas de conflit, même ceux qui ont été vidés de la corbeille.",
            "Accès Conditionnel : Protégez vos données automatiquement. Le système détecte les contextes à risque (pays inhabituel, appareil non sécurisé) et bloque l'accès avant même qu'il n'y ait intrusion."
          ]}
        ]
      }
    ],
    image: LOGO_M365 
  },
  cloud: {
    title: "Gestion Industrielle & Intune",
    subtitle: "Standardisation, RGPD et Secret Professionnel",
    sections: [
      {
        title: "Gestion industrielle du parc",
        content: [
          { type: 'paragraph', text: "Grâce à Intune, SECIB standardise votre informatique pour éliminer l'erreur humaine :" },
          { type: 'list', items: [
            "Configuration identique : Tous les postes configurés pareil, plus de 'cas particuliers'.",
            "Inventaire en temps réel : Nous savons exactement quel logiciel est installé, l'état batterie, espace disque...",
            "Mises à jour transparentes : Planifiées hors production pour éviter les blocages."
          ]}
        ]
      },
      {
        title: "Sécurisation et Secret Professionnel",
        content: [
          { type: 'paragraph', text: "Dans le cadre du RGPD et du secret professionnel, Intune est votre meilleure garantie :" },
          { type: 'list', items: [
            "Chiffrement automatique (BitLocker) : Force le chiffrement du disque. Données illisibles en cas de vol.",
            "Le 'Wipe' à distance : Effacement intégral des données professionnelles en un clic à distance.",
            "Contrôle de conformité : Interdiction d'accès aux emails si le PC n'est pas à jour ou sécurisé."
          ]}
        ]
      },
      {
        title: "Pourquoi c'est indispensable ?",
        content: [
          { type: 'paragraph', text: "Sans serveur local (AD), Intune redonne le contrôle centralisé. Sans lui, chaque PC est une île isolée et vulnérable. Avec Intune, vous avez une flotte cohérente et pilotée." }
        ]
      },
      {
        title: "Cas concret d'utilisation d'Intune",
        content: [
          { type: 'paragraph', text: "En cas de vol ou de panne, Microsoft Intune garantit une sécurité totale : le disque est rendu illisible par le chiffrement BitLocker et les données peuvent être effacées à distance d'un simple clic. La reprise d'activité est immédiate grâce au déploiement Autopilot qui permet de livrer un PC neuf directement à l'utilisateur : celui-ci n'a qu'à se connecter pour que ses applications, ses accès Wi-Fi et ses dossiers (bureau, Mes Documents, Mes images) sont restaurés automatiquement via OneDrive. Ce processus élimine toute intervention physique de l'informatique, réduit les coûts logistiques et assure que le collaborateur reste productif, où qu'il soit, sur un poste nativement conforme." }
        ]
      }
    ],
    image: null 
  },
  leasing: {
    title: "Location Évolutive (Leasing)",
    subtitle: "Flexibilité et Maîtrise des Coûts",
    description: "Financez votre matériel informatique via une solution de location évolutive. Préservez votre trésorerie, lissez vos dépenses et renouvelez votre parc simplement à la fin du contrat.",
    sections: [
        {
            title: "1. Optimisation Fiscale et Comptable",
            content: [
                 { type: 'list', items: [
                     "Préservation de la trésorerie : Évitez les sorties de fonds massives. Les loyers passent en charges d'exploitation (OPEX), sans alourdir votre bilan.",
                     "Simplification administrative : Fini la gestion complexe des amortissements sur 5 ans. La charge est lissée, prévisible et intégralement déductible."
                 ]}
            ]
        },
        {
            title: "2. Performance à l'ère de l'Intelligence Artificielle",
            content: [
                 { type: 'paragraph', text: "Le paysage technologique évolue plus vite que jamais. Avec le cycle de renouvellement TEMPO, votre cabinet ne subit plus l'obsolescence :" },
                 { type: 'list', items: [
                     "Puissance de calcul optimisée : L’intégration croissante de l’IA dans les logiciels métiers (comptabilité, audit, juridique) exige des processeurs et des unités NPU (Neural Processing Units) performants.",
                     "Productivité sans compromis : Vos collaborateurs disposent de machines toujours à jour, capables de faire tourner les outils d'IA les plus gourmands sans ralentissement.",
                     "Sécurité renforcée : Un matériel récent est la première barrière contre les cybermenaces, grâce à des composants intégrant les dernières normes de sécurité.",
                     "Disponibilité maximale : Un parc récent réduit drastiquement le taux de panne."
                 ]}
            ]
        },
        {
            title: "3. Engagement RSE et Économie Circulaire",
            content: [
                 { type: 'paragraph', text: "Parce que la performance ne doit pas se faire au détriment de la planète, TEMPO intègre une gestion responsable de la fin de vie du matériel :" },
                 { type: 'list', items: [
                     "Seconde vie garantie : En fin de contrat, les postes ne sont pas jetés. Ils sont collectés pour être reconditionnés, offrant ainsi une seconde vie à des équipements encore fonctionnels.",
                     "Recyclage certifié : Pour le matériel en fin de course, nous assurons un démantèlement dans le respect des normes environnementales DEEE, avec une traçabilité complète.",
                     "Bilan carbone valorisé : En optant pour le leasing circulaire, votre cabinet participe activement à la réduction des déchets électroniques et améliore son empreinte carbone."
                 ]}
            ]
        },
        {
            title: "En résumé",
            content: [
                 { type: 'paragraph', text: "L'offre TEMPO vous permet de rester à la pointe de la révolution IA tout en inscrivant votre cabinet dans une démarche éco-responsable concrète." }
            ]
        }
    ],
    image: null
  }
};

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
const COLLAB_PREMIUM_PRICE = 24.67; 
const COLLAB_PREMIUM_SAVE_PRICE = 27.69;
const UPGRADE_DIFF_PRICE = COLLAB_PREMIUM_SAVE_PRICE - COLLAB_PREMIUM_PRICE;

const OPTION_UPGRADE_COLLAB_PRICE = 3.02; 
const OPTION_UPGRADE_SECU_PRICE = 4.50;   
const OPTION_BACKUP_PRICE = 3.02;         
const GLOBAL_BACKUP_SETUP_PRICE = 6.94; 

// --- BANQUE D'IMAGES COMPLETE (CORRIGÉE ET VÉRIFIÉE) ---
const IMAGE_DB = {
  // Entrée de gamme 14" (HP ProBook 440/445)
  entry_14: [
    "https://www.hp.com/fr-fr/shop/Html/Merch/Images/1f09f243-d7c1-432f-8d9b-767a7acaa0a0_1750x1285.jpg",
    "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A23R2EA-ABF_13_1750x1285.jpg",
    "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A23R2EA-ABF_14_1750x1285.jpg"
  ],
  // Entrée de gamme 16" (HP ProBook 460/465)
  entry_16: [
    "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A23R4EA-ABF_3_1750x1285.jpg",
    "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A23R4EA-ABF_4_1750x1285.jpg",
    "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A23R4EA-ABF_1750x1285.jpg"
  ],
  // Milieu de gamme 14" (HP EliteBook 840/845)
  mid_14: [
    "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_1750x1285.jpg",
    "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_3_1750x1285.jpg",
    "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27C3EA-ABF_5_1750x1285.jpg"
  ],
  // Milieu de gamme 16" (HP EliteBook 860/865)
  mid_16: [
    "https://www.hp.com/fr-fr/shop/Html/Merch/Images/539afc89-6121-42be-94c3-4c6ab5ea6c51_1750x1285.jpg",
    "https://www.hp.com/fr-fr/shop/Html/Merch/Images/A27BYEA-ABF_3_1750x1285.jpg",
    "https://www.hp.com/fr-fr/shop/Html/Merch/Images/61c1e7e4-83b7-4075-8453-b2d637217a93_1750x1285.jpg"
  ],
  // Haut de gamme Flip (HP Elite x360 1040 / Dragonfly)
  high_flip: [
    "https://www.hp.com/ca-fr/shop/media/catalog/product/3/e/3ea6b621-3e66-4c0e-ae0d-7b1d5704e5a4.png",
    "https://www.hp.com/ca-fr/shop/media/catalog/product/c/0/c08192461_1.png"
  ],
  // Haut de gamme Standard (HP EliteBook 1040)
  high_std: [
    "https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68SNEA-ABF_1750x1285.jpg",
    "https://www.hp.com/fr-fr/shop/Html/Merch/Images/B68SNEA-ABF_3_1750x1285.jpg"
  ],
  // Fixe AIO 27" (HP EliteOne 870)
  fixed_aio_27: [
    "https://www.hp.com/fr-fr/shop/Html/Merch/Images/c08174144_1750x1285.jpg",
    "https://www.hp.com/fr-fr/shop/Html/Merch/Images/c08163334_1750x1285.jpg"
  ],
  // Fixe AIO 24" (HP EliteOne 840)
  fixed_aio_24: [
    "https://www.hp.com/fr-fr/shop/Html/Merch/Images/c08550764_1750x1285.jpg",
    "https://www.hp.com/fr-fr/shop/Html/Merch/Images/c08550910_1750x1285.jpg"
  ],
  // Fixe Mini (HP Elite Mini 800)
  fixed_mini_8: [
    "https://www.hp.com/fr-fr/shop/Html/Merch/Images/c08576880_1750x1285.jpg",
    "https://www.hp.com/fr-fr/shop/Html/Merch/Images/c08576885_1750x1285.jpg"
  ],
  // Fixe Mini (HP Elite Mini 400/600)
  fixed_mini_4: [
    "https://www.hp.com/fr-fr/shop/Html/Merch/Images/C61RVEA-ABF_1_1750x1285.jpg",
    "https://www.hp.com/fr-fr/shop/Html/Merch/Images/c08576885_1750x1285.jpg"
  ],
};

const getImagesForConfigId = (configId) => {
  if (configId.startsWith("u5_14") || configId.startsWith("u7_14")) return IMAGE_DB["entry_14"];
  if (configId.startsWith("u5_16") || configId.startsWith("u7_16")) return IMAGE_DB["entry_16"];
  if (configId.startsWith("hp8_14")) return IMAGE_DB["mid_14"];
  if (configId.startsWith("hp8_16")) return IMAGE_DB["mid_16"];
  if (configId === "hp_flip") return IMAGE_DB["high_flip"];
  if (configId.startsWith("hp_std")) return IMAGE_DB["high_std"];
  if (configId.startsWith("aio_27")) return IMAGE_DB["fixed_aio_27"];
  if (configId.startsWith("aio_24")) return IMAGE_DB["fixed_aio_24"];
  if (configId.startsWith("mini_8")) return IMAGE_DB["fixed_mini_8"];
  if (configId.startsWith("mini_4")) return IMAGE_DB["fixed_mini_4"];
  return [];
};

const normalizeRowKeys = (row) => {
    if (!row || typeof row !== 'object') return {};
    const newRow = {};
    Object.keys(row).forEach(key => {
        if (key) newRow[key.toUpperCase().trim()] = row[key];
    });
    return newRow;
};

// --- DATA ---
const BASES = [
  { id: "entry", name: "Poste Entrée de Gamme", description: "Essentiel bureautique & mobilité standard.", color: "blue", icon: Laptop, commonServices: [{ name: "Abonnement Cyberdéfense", price: SERVICE_CYBER }, { name: "Maintenance matériel (SaaS)", price: SERVICE_MAINTENANCE }, { name: "Frais de déploiement", price: FRAIS_DEPLOYMENT_PRICE }, { name: "Services & Accessoires (Câbles...)", price: SERVICE_ACCESSORIES }], configs: [{ id: "u5_14", name: '14" U5 16Go', specs: "Pack Portable HP 4 G1i 14 AI Glacier - U5-225U (12 Tops) - 16Go - 512Go SSD - 14' - Win11 Pro", hardwarePrice: 30.86 }, { id: "u7_14", name: '14" U7 16Go', specs: "Pack Portable HP 4 G1i 14 AI Glacier - U7-255U (12 Tops) - 16Go - 512Go SSD - 14' - Win11 Pro", hardwarePrice: 35.11 }, { id: "u5_16", name: '16" U5 16Go', specs: "Pack Portable HP 4 G1i 16 AI Glacier - U5-225U (12 Tops) - 16Go - 512Go SSD - 16' - Win11 Pro", hardwarePrice: 31.08 }, { id: "u7_16", name: '16" U7 16Go', specs: "Pack Portable HP 4 G1i 16 AI Glacier - U7-255U (12 Tops) - 16Go - 512Go SSD - 16' - Win11 Pro", hardwarePrice: 35.33 }] },
  { id: "mid", name: "Poste Milieu de Gamme", description: "Performance multitâche & applications métiers.", color: "indigo", icon: Briefcase, commonServices: [{ name: "Abonnement Cyberdéfense", price: SERVICE_CYBER }, { name: "Maintenance matériel (SaaS)", price: SERVICE_MAINTENANCE }, { name: "Frais de déploiement", price: FRAIS_DEPLOYMENT_PRICE }, { name: "Services & Accessoires (Câbles...)", price: SERVICE_ACCESSORIES }], configs: [{ id: "hp8_14_u5_16", name: '14" U5 16Go', specs: "Pack Portable HP 8 G1i 14 AI Glacier - U5-225U (12 Tops) - 16Go - 512Go SSD - 14' - Win11 Pro", hardwarePrice: 38.0 }, { id: "hp8_14_u5_32", name: '14" U5 32Go', specs: "Pack Portable HP 8 G1i 14 AI Glacier - U5-225U (12 Tops) - 32Go - 512Go SSD - 14' - Win11 Pro", hardwarePrice: 40.72 }, { id: "hp8_14_u7_16", name: '14" U7 16Go', specs: "Pack Portable HP 8 G1i 14 AI Glacier - U7-255U (12 Tops) - 16Go - 512Go SSD - 14' - Win11 Pro", hardwarePrice: 42.5 }, { id: "hp8_14_u7_32", name: '14" U7 32Go', specs: "Pack Portable HP 8 G1i 14 AI Glacier - U7-255U (12 Tops) - 32Go - 512Go SSD - 14' - Win11 Pro", hardwarePrice: 45.22 }, { id: "hp8_16_u5_16", name: '16" U5 16Go', specs: "Pack Portable HP 8 G1i 16 AI Glacier - U5-225U (12 Tops) - 16Go - 512Go SSD - 16' - Win11 Pro", hardwarePrice: 40.0 }, { id: "hp8_16_u5_32", name: '16" U5 32Go', specs: "Pack Portable HP 8 G1i 16 AI Glacier - U5-225U (12 Tops) - 32Go - 512Go SSD - 16' - Win11 Pro", hardwarePrice: 42.72 }, { id: "hp8_16_u7_16", name: '16" U7 16Go', specs: "Pack Portable HP 8 G1i 16 AI Glacier - U7-255U (12 Tops) - 16Go - 512Go SSD - 16' - Win11 Pro", hardwarePrice: 44.5 }] },
  { id: "high", name: "Poste Haut de Gamme", description: "Puissance Direction & VIP.", color: "violet", icon: Crown, commonServices: [{ name: "Abonnement Cyberdéfense", price: SERVICE_CYBER }, { name: "Maintenance matériel (SaaS)", price: SERVICE_MAINTENANCE }, { name: "Frais de déploiement", price: FRAIS_DEPLOYMENT_PRICE }, { name: "Services & Accessoires (Câbles...)", price: SERVICE_ACCESSORIES }], configs: [{ id: "hp_flip", name: 'X-G1i Flip 14"', specs: "Pack Portable HP EliteBook (X-G1i Flip) - Tactile - Core Ultra 7 - 32Go - 1To SSD - Win11 Pro", hardwarePrice: 70.86 }, { id: "hp_std", name: 'X-G1i Std 14"', specs: "Pack Portable HP EliteBook (X-G1i Standard) - Non-Tactile - Core Ultra 7 - 32Go - 1To SSD - Win11 Pro", hardwarePrice: 68.5 }, { id: "hp_std_bis", name: 'X-G1i Std 14" (Opt)', specs: "Pack Portable HP EliteBook (X-G1i Standard) - Non-Tactile - Core Ultra 7 - 32Go - 1To SSD - Win11 Pro", hardwarePrice: 72.8 }] },
  { id: "fixed", name: "Poste Fixe (Desktop)", description: "Station de travail sédentaire performante.", color: "slate", icon: Server, commonServices: [{ name: "Abonnement Cyberdéfense", price: SERVICE_CYBER }, { name: "Maintenance matériel (SaaS)", price: SERVICE_MAINTENANCE }, { name: "Frais de déploiement", price: FRAIS_DEPLOYMENT_PRICE }, { name: "Services & Accessoires (Câbles...)", price: SERVICE_ACCESSORIES }], configs: [{ id: "mini_4_u5", name: "Mini 4 G1i (U5)", specs: "HP Elite Mini 400 G1i - Core Ultra 5 - 16Go - 512Go SSD - Win11 Pro (Sans écran)", hardwarePrice: 32.5 }, { id: "mini_8_u7", name: "Mini 8 G1i (U7)", specs: "HP Elite Mini 800 G1i - Core Ultra 7 - 32Go - 512Go SSD - Win11 Pro (Sans écran)", hardwarePrice: 38.5 }, { id: "aio_24_u5", name: 'AIO 24" (U5)', specs: "HP EliteOne 840 G9/G1i AIO 24' - Core Ultra 5 - 16Go - 512Go SSD - Ecran Tactile - Win11 Pro", hardwarePrice: 36.5 }, { id: "aio_24_u7", name: 'AIO 24" (U7)', specs: "HP EliteOne 840 G9/G1i AIO 24' - Core Ultra 7 - 32Go - 512Go SSD - Ecran Tactile - Win11 Pro", hardwarePrice: 40.0 }, { id: "aio_27_u5", name: 'AIO 27" (U5)', specs: "HP EliteOne 870 G9/G1i AIO 27' - Core Ultra 5 - 16Go - 512Go SSD - Ecran Non-Tactile - Win11 Pro", hardwarePrice: 41.2 }, { id: "aio_27_u7", name: 'AIO 27" (U7)', specs: "HP EliteOne 870 G9/G1i AIO 27' - Core Ultra 7 - 32Go - 1To SSD - Ecran Non-Tactile - Win11 Pro", hardwarePrice: 45.8 }] },
];

const OPTIONS = [
  { id: "screen", name: "Pack Confort Visuel", icon: <Monitor className="w-6 h-6" />, monthlyPrice: 11.92, color: "purple", assetCount: 2, hasDeployment: false, details: ["Écran LED HP (EliteDisplay 23.8)", "Station d'accueil HP (TB 100W G6)", "Kit Clavier souris HP"] },
  { id: "switch", name: "Pack Connectivité", icon: <Server className="w-6 h-6" />, monthlyPrice: 11.94, color: "emerald", assetCount: 1, hasDeployment: true, deploymentPrice: FRAIS_DEPLOYMENT_PRICE, details: ["Switch ARUBA (1820-24G)", "Frais de déploiement", "Câblage RJ45 Cat6 (1m & 3m)"] },
  { id: "wifi", name: "Pack Wifi", icon: <Wifi className="w-6 h-6" />, monthlyPrice: 24.72, color: "cyan", assetCount: 1, hasDeployment: true, deploymentPrice: FRAIS_DEPLOYMENT_PRICE, details: ["Borne Wifi Watchguard AP130", "Licence Wifi management (3 ans)", "Power Supply AP130", "Frais de déploiement", "Câblage RJ45 Cat6"] },
  { id: "firewall", name: "Pack Firewall", icon: <Shield className="w-6 h-6" />, monthlyPrice: 78.87, color: "red", assetCount: 1, hasDeployment: true, deploymentPrice: FIREWALL_DEPLOYMENT_PRICE, details: ["Boitier WatchGuard (Firebox T25-W)", "Licence APT Blocker (3 ans)", "Frais de déploiement (Config Sécu)", "Câblage RJ45 Cat6"] },
  { id: "mig_sharepoint", name: "Migration vers SharePoint Online", icon: <FolderUp className="w-6 h-6" />, monthlyPrice: 27.50, color: "blue", assetCount: 0, hasDeployment: false, isService: true, details: ["Prestation pour migrer partage de fichiers serveur vers Sharepoint Online."] },
  { id: "mig_teams", name: "Migration d'une équipe Teams", icon: <Users className="w-6 h-6" />, monthlyPrice: 3.47, color: "indigo", assetCount: 0, hasDeployment: false, isService: true, details: ["Prestation pour migrer une équipe Teams d'un tenant Microsoft365 à un autre.", "Ajouter en quantité le nombre d'équipe Teams à migrer."] },
];

const INITIAL_QUANTITIES = {
  screen: 0, dual_screen: 0, switch: 0, firewall: 0, wifi: 0, fixed_screen: 0,
  entry_mig_mail: 0, entry_mig_cloud: 0, mid_mig_mail: 0, mid_mig_cloud: 0, high_mig_mail: 0, high_mig_cloud: 0, fixed_mig_mail: 0, fixed_mig_cloud: 0,
  mig_sharepoint: 0, mig_teams: 0,
  entry_upgrade_collab: 0, entry_upgrade_secu: 0,
  mid_upgrade_collab: 0, mid_upgrade_secu: 0,
  high_upgrade_collab: 0, high_upgrade_secu: 0,
  fixed_upgrade_collab: 0, fixed_upgrade_secu: 0,
};
BASES.forEach((b) => b.configs.forEach((c) => (INITIAL_QUANTITIES[c.id] = 0)));

// --- HELPERS UI ---
const getThemeClasses = (color, isActive, isExistingClient) => {
  const existingClientThemes = { iconBg: "bg-emerald-100 text-emerald-700", text: "text-emerald-700", badge: "bg-emerald-600 text-white", activeContainer: "border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500 shadow-md", activeBorder: "border-emerald-500" };
  const newClientThemes = { blue: { iconBg: "bg-blue-100 text-blue-600", text: "text-blue-600", badge: "bg-blue-600 text-white", activeContainer: "border-blue-500 bg-blue-50/20 ring-1 ring-blue-500 shadow-md", activeBorder: "border-blue-500" }, indigo: { iconBg: "bg-indigo-100 text-indigo-600", text: "text-indigo-600", badge: "bg-indigo-600 text-white", activeContainer: "border-indigo-500 bg-indigo-50/20 ring-1 ring-indigo-500 shadow-md", activeBorder: "border-indigo-500" }, violet: { iconBg: "bg-violet-100 text-violet-600", text: "text-violet-600", badge: "bg-violet-600 text-white", activeContainer: "border-violet-500 bg-violet-50/20 ring-1 ring-violet-500 shadow-md", activeBorder: "border-violet-500" }, slate: { iconBg: "bg-slate-200 text-slate-700", text: "text-slate-700", badge: "bg-slate-700 text-white", activeContainer: "border-slate-500 bg-slate-50/20 ring-1 ring-slate-500 shadow-md", activeBorder: "border-slate-500" }, purple: { iconBg: "bg-purple-100 text-purple-600", text: "text-purple-600", badge: "bg-purple-600 text-white", activeContainer: "border-purple-500 bg-purple-50/30 ring-1 ring-purple-500 shadow-md", activeBorder: "border-purple-500" }, emerald: { iconBg: "bg-emerald-100 text-emerald-600", text: "text-emerald-600", badge: "bg-emerald-600 text-white", activeContainer: "border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500 shadow-md", activeBorder: "border-emerald-500" }, cyan: { iconBg: "bg-cyan-100 text-cyan-600", text: "text-cyan-600", badge: "bg-cyan-600 text-white", activeContainer: "border-cyan-500 bg-cyan-50/30 ring-1 ring-cyan-500 shadow-md", activeBorder: "border-cyan-500" }, red: { iconBg: "bg-red-100 text-red-600", text: "text-red-600", badge: "bg-red-600 text-white", activeContainer: "border-red-500 bg-red-50/30 ring-1 ring-red-500 shadow-md", activeBorder: "border-red-500" } };
  const theme = isExistingClient ? existingClientThemes : (newClientThemes[color] || newClientThemes.blue);
  return { iconBg: theme.iconBg, text: theme.text, badge: isActive ? theme.badge : "hidden", container: isActive ? theme.activeContainer : "border-slate-200 bg-white hover:border-slate-300 shadow-sm", border: isActive ? theme.activeBorder : "border-slate-200" };
};

const PriceTag = ({ price, period = "/mois", originalPrice = null, isUpgrade = false }) => (
  <div className="flex flex-col items-end">
    {originalPrice !== null && ( <span className="text-xs text-slate-400 line-through decoration-slate-400"> {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(originalPrice)} </span> )}
    <span className={`font-bold ${isUpgrade ? "text-emerald-600" : "text-slate-800"}`}> {isUpgrade && "+"} {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(price)} <span className="text-xs font-normal text-gray-500">{period}</span> </span>
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
  if (!images || images.length === 0) return (<div className="w-32 h-24 md:w-40 md:h-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-300 border border-slate-200"><Box size={24} /></div>);
  const nextImage = (e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev + 1) % images.length); };
  const prevImage = (e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev - 1 + images.length) % images.length); };
  const openZoom = (e) => { e.stopPropagation(); setIsZoomed(true); };
  const closeZoom = (e) => { e.stopPropagation(); setIsZoomed(false); setCurrentIndex(0); };
  return (
    <>
      <div className="relative group w-32 h-24 md:w-40 md:h-32 shrink-0 cursor-pointer" onClick={openZoom}>
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
  const [showGlobalDetails, setShowGlobalDetails] = useState(false);
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
  const isInterfaceLocked = isExistingClient && !isClientVerified;

  const handleClientSearch = async () => {
      if (!clientName) return;
      setIsLoadingClient(true);
      try {
          const token = await getToken();
          const response = await fetch(`/api/getData?dossier=${encodeURIComponent(clientName)}`, { headers: { Authorization: `Bearer ${token}` } });
          const json = await response.json();
          setSnowflakeData(json);
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
          } else { alert("Aucun dossier trouvé."); setIsClientVerified(false); }
      } catch (error) { console.error("Erreur", error); alert("Erreur lors de la recherche."); } finally { setIsLoadingClient(false); }
  };

  const toggleItemDetail = (id) => { setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] })); };
  const updateActiveConfigTab = (baseId, configIndex) => { setActiveConfigTab((prev) => ({ ...prev, [baseId]: configIndex })); };
  const getTotalQtyForBase = (baseId) => { const base = BASES.find((b) => b.id === baseId); if (!base) return 0; return base.configs.reduce((sum, config) => sum + (quantities[config.id] || 0), 0); };
  
  const updateQuantity = (key, newVal) => {
    setQuantities((prev) => {
      const newState = { ...prev, [key]: newVal };
      ["entry", "mid", "high", "fixed"].forEach((baseId) => {
        const base = BASES.find((b) => b.id === baseId);
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

  const resetAll = () => { setQuantities(INITIAL_QUANTITIES); setActiveConfigTab({ entry: 0, mid: 0, high: 0, fixed: 0 }); setExpandedItems({}); setClientName(""); setIncludeBackup(false); setShowProposalModal(false); setSecurityLines([]); setCurrentM365Name(""); setCurrentM365Count(0); setMaintenanceCount(0); setClientCompanyName(""); if (isExistingClient) setIsClientVerified(false); setIsParkDetailsVisible(false); };
  const totalWorkstations = useMemo(() => { let count = 0; BASES.forEach((b) => { b.configs.forEach((c) => (count += quantities[c.id] || 0)); }); return count; }, [quantities]);
  const isFraisTempoWaived = totalAssets >= 10;
  const isFraisTempoDue = !isFraisTempoWaived && totalAssets > 0;
  const getTotalMigMail = () => (quantities.entry_mig_mail || 0) + (quantities.mid_mig_mail || 0) + (quantities.high_mig_mail || 0) + (quantities.fixed_mig_mail || 0);
  const getTotalMigCloud = () => (quantities.entry_mig_cloud || 0) + (quantities.mid_mig_cloud || 0) + (quantities.high_mig_cloud || 0) + (quantities.fixed_mig_cloud || 0);
  const getPosteFullMonthlyPrice = (base, config, withBackup) => { const fixedServicesPrice = base.commonServices.reduce((acc, s) => acc + s.price, 0); let collabPrice = 0; if (!isExistingClient) { collabPrice = withBackup ? COLLAB_PREMIUM_SAVE_PRICE : COLLAB_PREMIUM_PRICE; } else { if(withBackup) collabPrice = OPTION_BACKUP_PRICE; } return config.hardwarePrice + fixedServicesPrice + collabPrice; };

  const totals = useMemo(() => {
    let monthly = 0;
    BASES.forEach((base) => {
      base.configs.forEach((config) => {
        const qty = quantities[config.id] || 0;
        if (qty > 0) { const unitPrice = getPosteFullMonthlyPrice(base, config, includeBackup); monthly += unitPrice * qty; }
      });
      if (isExistingClient) { monthly += (quantities[`${base.id}_upgrade_collab`] || 0) * OPTION_UPGRADE_COLLAB_PRICE; monthly += (quantities[`${base.id}_upgrade_secu`] || 0) * OPTION_UPGRADE_SECU_PRICE; }
    });
    if (isFraisTempoDue) { monthly += FRAIS_TEMPO_PRICE; }
    ["entry", "mid", "high", "fixed"].forEach(baseId => { const base = BASES.find(b => b.id === baseId); if(base) { monthly += (quantities[`${baseId}_mig_mail`] || 0) * MIGRATION_MAIL_PRICE; monthly += (quantities[`${baseId}_mig_cloud`] || 0) * MIGRATION_CLOUD_PRICE; } });
    if (includeBackup && totalWorkstations > 0) { monthly += GLOBAL_BACKUP_SETUP_PRICE; }
    OPTIONS.forEach((opt) => { monthly += opt.monthlyPrice * (quantities[opt.id] || 0); });
    monthly += DUAL_SCREEN_PRICE * (quantities.dual_screen || 0);
    monthly += DUAL_SCREEN_PRICE * (quantities.fixed_screen || 0);
    const sharepointOpt = OPTIONS.find(o => o.id === "mig_sharepoint"); if(sharepointOpt) monthly += (quantities.mig_sharepoint || 0) * sharepointOpt.monthlyPrice;
    const teamsOpt = OPTIONS.find(o => o.id === "mig_teams"); if(teamsOpt) monthly += (quantities.mig_teams || 0) * teamsOpt.monthlyPrice;
    return { monthly: monthly, total36: monthly * 36 };
  }, [quantities, isFraisTempoDue, includeBackup, totalWorkstations, isExistingClient]);

  const hasSelection = totals.monthly > 0;

  const downloadProposalTxt = () => {
    return new Promise((resolve) => {
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
                    let collabLine = isExistingClient ? (includeBackup ? `  - OPTION : Option Sauvegarde M365 (Global) (+${OPTION_BACKUP_PRICE.toFixed(2)} EUR)` : `  - LICENCE : Standard`) : `  - LICENCE : ${includeBackup ? "Pack Collaboratif Premium + Sauvegarde M365" : "Pack Collaboratif Premium"}`;
                    content += collabLine + "\n";
                    if (base.id === "fixed" && quantities.fixed_screen > 0) content += `  - PRODUIT ASSOCIE : Option Ecran pour Fixe (x${quantities.fixed_screen}) -> ${DUAL_SCREEN_PRICE} EUR/mois\n`;
                }
                });
            });
            OPTIONS.filter(o => !o.isService && quantities[o.id] > 0).forEach(opt => content += `\n[BUNDLE] ${opt.name} (x${quantities[opt.id]}) -> ${opt.monthlyPrice.toFixed(2)} EUR/mois\n`);
            if (quantities.dual_screen > 0) content += `\n[OPTION] Dual Screen (x${quantities.dual_screen}) -> ${DUAL_SCREEN_PRICE.toFixed(2)} EUR/mois\n`;
            content += `\n2. PRESTATIONS & SERVICES\n`;
            if (getTotalMigMail() > 0) content += `- Migration AvocatMail x${getTotalMigMail()} : ${(getTotalMigMail() * MIGRATION_MAIL_PRICE).toFixed(2)} EUR/mois\n`;
            if (getTotalMigCloud() > 0) content += `- Migration OneDrive x${getTotalMigCloud()} : ${(getTotalMigCloud() * MIGRATION_CLOUD_PRICE).toFixed(2)} EUR/mois\n`;
            OPTIONS.filter(o => o.isService && quantities[o.id] > 0).forEach(opt => content += `- ${opt.name} x${quantities[opt.id]} : ${(opt.monthlyPrice * quantities[opt.id]).toFixed(2)} EUR/mois\n`);
            if (isFraisTempoDue) content += `- Frais Tempo (Logistique) x1 : ${FRAIS_TEMPO_PRICE.toFixed(2)} EUR/mois\n`;
            if (includeBackup && totalWorkstations > 0) content += `- Setup Sauvegarde x1 : ${GLOBAL_BACKUP_SETUP_PRICE.toFixed(2)} EUR/mois\n`;
            if (isExistingClient) {
                content += `\n3. UPGRADES (CLIENT EXISTANT)\n`;
                BASES.forEach(base => {
                    const upCollab = quantities[`${base.id}_upgrade_collab`] || 0;
                    const upSecu = quantities[`${base.id}_upgrade_secu`] || 0;
                    if (upCollab > 0) content += `- Upgrade Collab Premium (${base.name}) x${upCollab} : ${(upCollab * OPTION_UPGRADE_COLLAB_PRICE).toFixed(2)} EUR/mois\n`;
                    if (upSecu > 0) content += `- Upgrade Sécurité (${base.name}) x${upSecu} : ${(upSecu * OPTION_UPGRADE_SECU_PRICE).toFixed(2)} EUR/mois\n`;
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
         <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-6">
                {/* REMPLACEMENT DU LOGO IMAGE PAR DU TEXTE DANS LA NAVBAR */}
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
             {/* BANDEAU PRINCIPAL AVEC GRILLE POUR LE LOGO A DROITE */}
             <div className="bg-slate-900 text-white py-12 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2/3 h-full bg-blue-600/10 -skew-x-12 transform origin-top-right" />
                <div className="max-w-6xl mx-auto relative z-10 grid md:grid-cols-2 items-center gap-12">
                    {/* COLONNE GAUCHE : TEXTE */}
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">L'Informatique <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">dédiée aux Avocats.</span></h1>
                        <p className="text-lg text-slate-300 max-w-2xl mb-8 leading-relaxed">Une solution complète incluant le matériel HP, la sécurité managée, la suite Microsoft 365 et un support technique expert.</p>
                        <button onClick={() => setActiveTab("simulator")} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-900/50 transition-all transform hover:-translate-y-1 flex items-center gap-2">Configurer mon parc <ArrowRight size={20} /></button>
                    </div>
                    {/* COLONNE DROITE : NOUVEAU LOGO SEPTEO GRAND FORMAT */}
                    <div className="hidden md:flex justify-end">
                        <div className="p-6 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 shadow-2xl transform hover:scale-105 transition-transform">
                             {/* LOGO AGRANDI ICI (max-w-[450px]) */}
                             <img src={LOGO_SEPTEO_HEADER} alt="Septeo Avocats" className="w-full max-w-[450px] object-contain" />
                        </div>
                    </div>
                </div>
             </div>

             {/* TEXTE INTERMEDIAIRE REINTEGRE */}
             <div className="max-w-4xl mx-auto px-4 pt-12 pb-6 text-center">
                 <h2 className="text-2xl font-bold text-slate-900 mb-3">Pourquoi choisir l'offre TEMPO ?</h2>
                 <p className="text-slate-500 mb-6">Une approche globale pour libérer votre cabinet des contraintes techniques.</p>
                 <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-sm text-slate-700 leading-relaxed shadow-sm text-left mx-auto">
                    <p>Nous vous proposons une transition vers une gestion de parc <strong>100% Cloud</strong>, éliminant le besoin de serveurs physiques sur site. Grâce à la technologie <strong>Microsoft Intune</strong>, nous pilotons, sécurisons et mettons à jour vos postes à distance, garantissant une conformité totale où que vous soyez. En tant qu'<strong>interlocuteur unique</strong>, nous simplifions votre quotidien : un seul point de contact pour votre matériel, vos logiciels métiers et votre cybersécurité.</p>
                 </div>
             </div>

             <div className="max-w-6xl mx-auto px-4 pb-12 pt-6">
                 {/* PASSAGE A 5 COLONNES POUR INTEGRER LE LEASING */}
                 <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
                    <div onClick={() => openModal('unique')} className="p-6 rounded-2xl bg-white border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group"><div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform"><Users size={24} /></div><h3 className="font-bold text-lg mb-2">Interlocuteur Unique</h3><p className="text-slate-600 text-sm">Un seul point de contact pour tout votre écosystème numérique.</p></div>
                    <div onClick={() => openModal('security')} className="p-6 rounded-2xl bg-white border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group"><div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform"><Shield size={24} /></div><h3 className="font-bold text-lg mb-2">Sécurité Managée</h3><p className="text-slate-600 text-sm">Protection SOC 24/7 anti-ransomware et surveillance active.</p></div>
                    <div onClick={() => openModal('collab')} className="p-6 rounded-2xl bg-white border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group"><div className="h-12 mb-4 flex items-center justify-center group-hover:scale-110 transition-transform"><img src={LOGO_M365} alt="Microsoft 365" className="h-full object-contain" /></div><h3 className="font-bold text-lg mb-2">Collaboration M365</h3><p className="text-slate-600 text-sm">Suite Office complète, Teams et stockage sécurisé.</p></div>
                    <div onClick={() => openModal('cloud')} className="p-6 rounded-2xl bg-white border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group"><div className="h-12 mb-4 flex items-center justify-center group-hover:scale-110 transition-transform"><img src={LOGO_INTUNE} alt="Intune" className="h-full object-contain" /></div><h3 className="font-bold text-lg mb-2">Gestion Full Cloud</h3><p className="text-slate-600 text-sm">Pilotage à distance via Intune, sans serveur local.</p></div>
                    {/* NOUVEAU BLOC LEASING AVEC ICONE HandCoins */}
                    <div onClick={() => openModal('leasing')} className="p-6 rounded-2xl bg-white border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group"><div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform"><HandCoins size={24} /></div><h3 className="font-bold text-lg mb-2">Location Évolutive</h3><p className="text-slate-600 text-sm">Financement flexible pour un parc informatique toujours à jour.</p></div>
                 </div>
             </div>

             {/* MODALE PRESENTATION */}
             {selectedFeature && PRESENTATION_DETAILS[selectedFeature] && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeModal}>
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
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
        <div className="animate-in slide-in-from-right duration-500">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg text-white transition-colors ${isExistingClient ? 'bg-emerald-600' : 'bg-blue-600'}`}><Calculator size={24} /></div>
                        <div><h1 className="text-xl font-bold text-slate-900">Configurateur offre TEMPO</h1><p className={`text-xs font-medium transition-colors ${isExistingClient ? 'text-emerald-600' : 'text-slate-500'}`}>{isExistingClient ? "Mode : Client Existant (Renouvellement)" : "Mode : Nouveau Client"}</p></div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200" title={isModeLocked ? "Veuillez réinitialiser la sélection pour changer de mode" : ""}>
                            <button disabled={isModeLocked} onClick={() => { if(!isModeLocked) { setIsExistingClient(false); setIncludeBackup(false); setIsClientVerified(false); }}} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${!isExistingClient ? 'bg-white text-blue-700 shadow-sm' : (isModeLocked ? 'text-slate-300' : 'text-slate-500')}`}>{isModeLocked && isExistingClient ? <Lock size={12}/> : <UserPlus size={14}/>} Nouveau</button>
                            <button disabled={isModeLocked} onClick={() => { if(!isModeLocked) { setIsExistingClient(true); setIsClientVerified(false); }}} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${isExistingClient ? 'bg-white text-emerald-700 shadow-sm' : (isModeLocked ? 'text-slate-300' : 'text-slate-500')}`}>{isModeLocked && !isExistingClient ? <Lock size={12}/> : <UserCheck size={14}/>} Existant</button>
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

            <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`lg:col-span-2 space-y-6 transition-opacity duration-300 ${isInterfaceLocked ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                  <section>
                     <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><span className="bg-slate-200 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span><h2 className="text-lg font-bold">Sélectionner les postes</h2></div><span className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${isExistingClient ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>Mix possible dans chaque gamme</span></div>
                     <div className="grid grid-cols-1 gap-6">
                       {BASES.map((base) => {
                         const totalBaseQty = getTotalQtyForBase(base.id);
                         const isExpanded = expandedItems[base.id];
                         const theme = getThemeClasses(base.color, totalBaseQty > 0, isExistingClient);
                         const activeIndex = activeConfigTab[base.id];
                         const activeConfig = base.configs[activeIndex];
                         const activeConfigImages = getImagesForConfigId(activeConfig.id);
                         const activeDisplayPrice = getPosteFullMonthlyPrice(base, activeConfig, includeBackup);
                         return (
                           <div key={base.id} className="space-y-2">
                             <div className={`relative rounded-xl border-2 transition-all duration-200 overflow-hidden ${theme.container}`}>
                                {(!isExistingClient && includeBackup && totalBaseQty > 0) && <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg z-10 flex items-center gap-1 shadow-sm"><Check size={10} /> Pack Save M365 Actif</div>}
                                {(isExistingClient && includeBackup && totalBaseQty > 0) && <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg z-10 flex items-center gap-1 shadow-sm"><Check size={10} /> Option Save Active</div>}
                                <div className="p-3 flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2"><base.icon className={`w-8 h-8 ${theme.text}`} /><div><h3 className="font-bold text-slate-900">{base.name}</h3><p className="text-xs text-slate-500">{base.description}</p></div>{totalBaseQty > 0 && <span className={`ml-auto md:ml-2 text-xs font-bold px-2 py-1 rounded-full ${theme.badge}`}>{totalBaseQty}</span>}</div>
                                        <div className="mb-3 flex flex-wrap gap-2">{base.configs.map((conf, idx) => { const qty = quantities[conf.id] || 0; return (<button key={conf.id} onClick={() => updateActiveConfigTab(base.id, idx)} className={`text-[10px] font-semibold px-2 py-1 rounded-md border transition-all flex items-center gap-1.5 ${idx === activeIndex ? "bg-slate-800 text-white border-slate-800 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>{conf.name}{qty > 0 && <span className={`text-[9px] px-1 rounded-full ${idx === activeIndex ? "bg-white text-slate-800" : "bg-slate-200 text-slate-700"}`}>{qty}</span>}</button>); })}</div>
                                        <div className="bg-slate-50/50 rounded-lg p-2 mb-2 border border-slate-100"><div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1"><Cpu size={14} className="text-slate-500" />Spécifications <span className="text-slate-400 font-normal">({activeConfig.name})</span> :</div><div className="text-xs text-slate-600 font-mono leading-relaxed">{activeConfig.specs}</div></div>
                                        <div className={`flex items-center gap-1 text-xs font-medium cursor-pointer w-fit transition-colors ${isExistingClient ? 'text-emerald-600 hover:text-emerald-800' : 'text-slate-500 hover:text-blue-600'}`} onClick={() => toggleItemDetail(base.id)}>{isExpanded ? "Masquer services" : "Voir services inclus"}{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</div>
                                    </div>
                                    <div className="flex items-center justify-center border-l border-r border-slate-100 px-2 md:px-4 h-28"><ImageCarousel images={activeConfigImages} /></div>
                                    <div className="flex flex-row md:flex-col justify-between items-end gap-3 pl-0 md:pl-4 min-w-[120px]">
                                        <div className="text-right"><PriceTag price={activeDisplayPrice} /><div className="text-[10px] text-slate-400 mt-1">Config : {activeConfig.name}</div></div>
                                        <div className="flex flex-col items-end gap-1"><span className="text-[10px] text-slate-500 font-medium">Quantité</span><QuantitySelector value={quantities[activeConfig.id] || 0} onChange={(val) => updateQuantity(activeConfig.id, val)} /></div>
                                    </div>
                                </div>
                                {isExpanded && <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 text-xs"><p className="font-semibold text-slate-700 mb-2 flex items-center gap-2"><Box size={14} /> Services & Logiciels inclus :</p><ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">{base.commonServices.map((item, idx) => ( <li key={idx} className="flex items-start gap-2 text-slate-600"><CheckCircle size={12} className="mt-0.5 text-blue-400 shrink-0" /><span>{item.name}</span></li> ))}{!isExistingClient ? (<li className={`flex items-start gap-2 font-medium ${includeBackup ? 'text-indigo-600' : 'text-blue-600'}`}><CheckCircle size={12} className="mt-0.5 shrink-0" /><span>{includeBackup ? "Pack Collaboratif Premium + Sauvegarde M365" : "Pack Collaboratif Premium"}</span></li>) : (<li className="flex items-start gap-2 font-medium text-slate-400 italic"><span>Aucune licence incluse (Matériel seul)</span></li>)}</ul></div>}
                             </div>
                             {base.id === "fixed" && totalBaseQty > 0 && <div className="ml-4 md:ml-8 mb-2 bg-slate-100 border border-slate-200 rounded-lg p-3 flex items-center justify-between shadow-sm animate-in slide-in-from-top-2"><div className="flex items-center gap-2"><div className="text-slate-500 bg-white p-1.5 rounded border border-slate-200"><Tv size={16} /></div><div><h5 className="text-xs font-bold text-slate-900 leading-tight">Ajouter un écran HP 24"</h5><p className="text-9px text-slate-500 mt-0.5">Pour compléter la tour (Non inclus de base) - Max 2 par poste</p></div></div><div className="flex flex-col items-end gap-1"><span className="font-bold text-slate-700 text-xs">{DUAL_SCREEN_PRICE.toFixed(2)}€</span><div className="scale-90 origin-right"><QuantitySelector value={quantities.fixed_screen} onChange={(val) => updateQuantity("fixed_screen", val)} max={totalBaseQty * 2} /></div></div></div>}
                             {totalBaseQty > 0 && (
                                <div className="ml-4 md:ml-8 space-y-3 animate-in slide-in-from-top-2 fade-in duration-300">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center justify-between shadow-sm relative before:absolute before:left-[-18px] before:top-[-15px] before:w-[18px] before:h-[35px] before:border-l-2 before:border-b-2 before:border-slate-300 before:rounded-bl-lg"><div className="flex items-center gap-2"><div className="text-orange-500 bg-white p-1.5 rounded border border-orange-100"><Mail size={16} /></div><div><h5 className="text-xs font-bold text-orange-900 leading-tight">Option Migration<br />AvocatMail</h5><p className="text-[9px] text-orange-700 mt-0.5 leading-tight italic">Nécessaire en cas de reprise de boite mail existante</p></div></div><div className="flex flex-col items-end gap-1"><span className="font-bold text-orange-700 text-xs">{MIGRATION_MAIL_PRICE.toFixed(2)}€</span><div className="scale-90 origin-right"><QuantitySelector value={quantities[`${base.id}_mig_mail`]} onChange={(val) => updateQuantity(`${base.id}_mig_mail`, val)} max={totalBaseQty} /></div></div></div>
                                        <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 flex items-center justify-between shadow-sm relative md:before:hidden before:absolute before:left-[-18px] before:top-[-15px] before:w-[18px] before:h-[35px] before:border-l-2 before:border-b-2 before:border-slate-300 before:rounded-bl-lg"><div className="flex items-center gap-2"><div className="text-sky-500 bg-white p-1.5 rounded border border-sky-100"><Cloud size={16} /></div><div><h5 className="text-xs font-bold text-sky-900 leading-tight">Option Migration<br />OneDrive</h5><p className="text-[9px] text-sky-700 mt-0.5 leading-tight italic">Nécessaire en cas de reprise de stockage cloud existant</p></div></div><div className="flex flex-col items-end gap-1"><span className="font-bold text-sky-700 text-xs">{MIGRATION_CLOUD_PRICE.toFixed(2)}€</span><div className="scale-90 origin-right"><QuantitySelector value={quantities[`${base.id}_mig_cloud`]} onChange={(val) => updateQuantity(`${base.id}_mig_cloud`, val)} max={totalBaseQty} /></div></div></div>
                                     </div>
                                     {isExistingClient && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex flex-col justify-between shadow-sm h-full"><div className="flex items-center gap-2 mb-2"><div className="text-emerald-600 bg-white p-1.5 rounded border border-emerald-100"><Users size={16} /></div><div><h5 className="text-xs font-bold text-emerald-900 leading-tight">Pack Collaboratif Premium</h5><p className="text-[9px] text-emerald-700 mt-0.5">Mise à niveau licence</p></div></div><div className="flex flex-col items-end gap-1"><span className="font-bold text-emerald-700 text-xs">+{OPTION_UPGRADE_COLLAB_PRICE.toFixed(2)}€</span><div className="scale-90 origin-right"><QuantitySelector value={quantities[`${base.id}_upgrade_collab`] || 0} onChange={(val) => updateQuantity(`${base.id}_upgrade_collab`, val)} max={totalBaseQty} /></div></div></div>
                                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex flex-col justify-between shadow-sm h-full"><div className="flex items-center gap-2 mb-2"><div className="text-emerald-600 bg-white p-1.5 rounded border border-emerald-100"><ShieldCheck size={16} /></div><div><h5 className="text-xs font-bold text-emerald-900 leading-tight">Pack Sécurité Avancé Microsoft365</h5><p className="text-[9px] text-emerald-700 mt-0.5">Mise à niveau sécurité</p></div></div><div className="flex flex-col items-end gap-1"><span className="font-bold text-emerald-700 text-xs">+{OPTION_UPGRADE_SECU_PRICE.toFixed(2)}€</span><div className="scale-90 origin-right"><QuantitySelector value={quantities[`${base.id}_upgrade_secu`] || 0} onChange={(val) => updateQuantity(`${base.id}_upgrade_secu`, val)} max={totalBaseQty} /></div></div></div>
                                            <div className={`rounded-lg p-3 flex flex-col justify-between shadow-sm border transition-colors cursor-pointer h-full ${includeBackup ? 'bg-emerald-100 border-emerald-300 ring-1 ring-emerald-400' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`} onClick={() => setIncludeBackup(!includeBackup)}><div className="flex items-center gap-2 mb-2"><div className={`p-1.5 rounded border ${includeBackup ? 'text-emerald-700 bg-white border-emerald-200' : 'text-slate-400 bg-white border-slate-200'}`}><Database size={16} /></div><div><h5 className={`text-xs font-bold leading-tight ${includeBackup ? 'text-emerald-900' : 'text-slate-700'}`}>Option Sauvegarde M365 (Global)</h5><p className={`text-[9px] mt-0.5 ${includeBackup ? 'text-emerald-700' : 'text-slate-500'}`}>Global (Tout le parc)</p></div></div><div className="flex flex-col items-end gap-1"><span className={`font-bold text-xs ${includeBackup ? 'text-emerald-800' : 'text-slate-400'}`}>+{OPTION_BACKUP_PRICE.toFixed(2)}€/p</span>{includeBackup ? (<ToggleRight className="text-emerald-600 w-8 h-8" />) : (<ToggleLeft className="text-slate-300 w-8 h-8" />)}</div></div>
                                        </div>
                                     )}
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
                         const theme = getThemeClasses(opt.color, (quantities[opt.id] || 0) > 0, false);
                         return (
                          <div key={opt.id} className={`p-4 rounded-xl border-2 transition-all ${theme.container}`}>
                            <div className="flex justify-between items-start mb-3"><div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${theme.iconBg}`}>{opt.icon}</div><div><h4 className="font-bold text-slate-800 text-sm">{opt.name}</h4><p className="text-[10px] text-slate-500 font-medium">{opt.isService ? "Prestation unique (par lot)" : (opt.hasDeployment ? `+${opt.deploymentPrice}€ Frais Install` : "")}</p></div></div><PriceTag price={opt.monthlyPrice} /></div>
                            {opt.details && (<ul className="mb-4 space-y-1">{opt.details.map((detail, idx) => (<li key={idx} className="flex items-start gap-2 text-[10px] text-slate-600"><CheckCircle size={10} className="mt-0.5 text-slate-400 flex-shrink-0" /><span>{detail}</span></li>))}</ul>)}
                            <div className="flex justify-end"><QuantitySelector value={quantities[opt.id] || 0} onChange={(val) => updateQuantity(opt.id, val)} /></div>
                            {opt.id === "screen" && (quantities.screen > 0) && (<div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center bg-purple-50 p-2 rounded"><div className="text-xs text-purple-800 font-bold">Ajouter 2ème écran HP<span className="block text-[10px] font-normal text-purple-600">Dual Screen (+{DUAL_SCREEN_PRICE}€/mois)</span></div><div className="scale-90 origin-right"><QuantitySelector value={quantities.dual_screen || 0} onChange={(val) => updateQuantity("dual_screen", val)} max={quantities.screen} /></div></div>)}
                          </div>
                         );
                      })}
                    </div>
                  </section>
                  <section className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-8">
                    <button onClick={() => setShowGlobalDetails(!showGlobalDetails)} className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-colors"><span className="font-semibold text-slate-700 flex items-center gap-2"><FileText size={18} />Détail des coûts unitaires (Ventilation)</span>{showGlobalDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button>
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
                                    <table className="w-full text-left"><tbody><tr className="text-slate-600 font-medium"><td className="py-1 flex items-center gap-2">Matériel</td><td className="py-1 text-right">{config.hardwarePrice.toFixed(2)} €</td></tr>{base.commonServices.map((item, idx) => ( <tr key={`base-${idx}`} className={`text-slate-500 text-xs`}><td className="py-0.5 pl-4 flex items-center gap-2">- {item.name}</td><td className={`py-0.5 text-right`}>{item.price.toFixed(2)} €</td></tr> ))}<tr className={`text-xs ${isExistingClient ? 'text-emerald-600 font-medium' : (includeBackup ? 'text-indigo-600 font-medium' : 'text-blue-600')}`}><td className="py-0.5 pl-4 flex items-center gap-2">- {isExistingClient ? (includeBackup ? "Option Sauvegarde M365 (Global)" : "Aucune option liée au poste") : (includeBackup ? "Pack Collaboratif Premium + Sauvegarde M365" : "Pack Collaboratif Premium")}</td><td className="py-0.5 text-right">{isExistingClient ? (includeBackup ? OPTION_BACKUP_PRICE.toFixed(2) : "0.00") : (includeBackup ? COLLAB_PREMIUM_SAVE_PRICE.toFixed(2) : COLLAB_PREMIUM_PRICE.toFixed(2))} €</td></tr><tr className="font-bold bg-slate-50"><td className="py-1 pl-2">Total Unitaire (Bundle)</td><td className="py-1 text-right pr-2 text-blue-600">{fullPrice.toFixed(2)} €</td></tr></tbody></table>
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
                    <div className={`p-6 relative text-white ${isExistingClient ? 'bg-emerald-900' : 'bg-slate-900'}`}><h3 className="text-lg font-medium opacity-80 mb-1">Total Loyer Mensuel</h3><div className="text-4xl font-bold tracking-tight">{totals.monthly.toFixed(2)} €<span className="text-lg font-normal text-white/60">/HT</span></div><p className="text-xs text-white/60 mt-2">Engagement 36 mois</p></div>
                    <div className="p-6 space-y-4">
                      {!hasSelection ? ( <div className="text-center py-8 text-slate-400"><p>Aucun élément sélectionné</p></div> ) : (
                        <div className="space-y-3">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Votre sélection</div>
                          {BASES.map((base) => { const activeConfigs = base.configs.filter((c) => quantities[c.id] > 0); if (activeConfigs.length === 0) return null; return activeConfigs.map((config) => { const bundlePrice = getPosteFullMonthlyPrice(base, config, includeBackup); const qty = quantities[config.id]; return ( <div key={config.id} className="flex justify-between text-sm items-start"><div className="text-slate-700"><span className="font-bold text-slate-900 mr-1">{qty}x</span>{base.name.replace("Poste ", "")} <span className="text-[10px] text-slate-400">({config.name})</span></div><span className="font-medium whitespace-nowrap">{(bundlePrice * qty).toFixed(2)} €</span></div> ); }); })}
                          {isExistingClient && BASES.map(base => { const upCollab = quantities[`${base.id}_upgrade_collab`] || 0; const upSecu = quantities[`${base.id}_upgrade_secu`] || 0; if(upCollab === 0 && upSecu === 0) return null; return ( <div key={`upgrade-${base.id}`} className="border-t border-dashed border-slate-200 pt-1 mt-1"> {upCollab > 0 && ( <div className="flex justify-between text-sm items-start text-emerald-700 bg-emerald-50 px-2 py-1 rounded mb-1"><div><span className="font-bold mr-1">{upCollab}x</span>Pack Collaboratif Premium ({base.name.split(' ')[1]})</div><span className="font-medium whitespace-nowrap">{(upCollab * OPTION_UPGRADE_COLLAB_PRICE).toFixed(2)} €</span></div> )} {upSecu > 0 && ( <div className="flex justify-between text-sm items-start text-emerald-700 bg-emerald-50 px-2 py-1 rounded"><div><span className="font-bold mr-1">{upSecu}x</span>Pack Sécurité Avancé Microsoft365 ({base.name.split(' ')[1]})</div><span className="font-medium whitespace-nowrap">{(upSecu * OPTION_UPGRADE_SECU_PRICE).toFixed(2)} €</span></div> )} </div> ); })}
                          {isFraisTempoDue && ( <div className="flex justify-between text-sm items-start text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200"><div><span className="font-bold mr-1">1x</span>Frais Tempo (Forfait)</div><span className="font-medium whitespace-nowrap">{FRAIS_TEMPO_PRICE.toFixed(2)} €</span></div> )}
                          {includeBackup && totalWorkstations > 0 && (<div className={`flex flex-col gap-1 p-2 rounded border ${isExistingClient ? 'bg-emerald-50 border-emerald-200' : 'bg-indigo-50 border-indigo-200'}`}><div className="flex justify-between items-center text-xs"><span className={`font-medium flex items-center gap-1 ${isExistingClient ? 'text-emerald-700' : 'text-indigo-700'}`}><Wrench size={10}/> Setup Sauvegarde (Unique)</span><div className="text-right"><span className={`${isExistingClient ? 'text-emerald-400' : 'text-indigo-400'} mr-2`}>1 x {GLOBAL_BACKUP_SETUP_PRICE.toFixed(2)}€</span><span className={`font-bold ${isExistingClient ? 'text-emerald-800' : 'text-indigo-800'}`}>{GLOBAL_BACKUP_SETUP_PRICE.toFixed(2)} €</span></div></div></div>)}
                          {getTotalMigMail() > 0 && ( <div className="flex justify-between text-sm items-start text-orange-700 bg-orange-50 px-2 py-1 rounded border border-orange-200"><div><span className="font-bold mr-1">{getTotalMigMail()}x</span>Migration AvocatMail</div><span className="font-medium whitespace-nowrap">{(MIGRATION_MAIL_PRICE * getTotalMigMail()).toFixed(2)} €</span></div> )}
                          {getTotalMigCloud() > 0 && ( <div className="flex justify-between text-sm items-start text-sky-700 bg-sky-50 px-2 py-1 rounded border border-sky-200"><div><span className="font-bold mr-1">{getTotalMigCloud()}x</span>Migration OneDrive</div><span className="font-medium whitespace-nowrap">{(MIGRATION_CLOUD_PRICE * getTotalMigCloud()).toFixed(2)} €</span></div> )}
                          {OPTIONS.filter((o) => quantities[o.id] > 0).map((opt) => ( <div key={opt.id} className="flex justify-between text-sm items-start text-indigo-700 bg-indigo-50 px-2 py-1 rounded"><div><span className="font-bold mr-1">{quantities[opt.id]}x</span>{opt.name}</div><span className="font-medium whitespace-nowrap">{(opt.monthlyPrice * quantities[opt.id]).toFixed(2)} €</span></div> ))}
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
            
            {/* --- MODALE RECAPITULATIF --- */}
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
                                       <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">1. Bundles Matériel & Infrastructure</h4>
                                       {BASES.map(base => {
                                           const activeConfigs = base.configs.filter(c => quantities[c.id] > 0);
                                           if(activeConfigs.length === 0) return null;
                                           return activeConfigs.map(config => (
                                               <div key={config.id} className="flex justify-between text-sm py-1 border-b border-slate-50 last:border-0">
                                                   <span className="text-slate-700"><span className="font-bold">{quantities[config.id]}x</span> {config.name} ({base.name})</span>
                                                   <span className="font-mono text-slate-500">{(getPosteFullMonthlyPrice(base, config, includeBackup) * quantities[config.id]).toFixed(2)}€</span>
                                               </div>
                                           ));
                                       })}
                                       {OPTIONS.filter(o => !o.isService && quantities[o.id] > 0).map(opt => (
                                           <div key={opt.id} className="flex justify-between text-sm py-1 border-b border-slate-50 last:border-0 pl-4 border-l-2 border-slate-200">
                                               <span className="text-slate-700"><span className="font-bold">{quantities[opt.id]}x</span> {opt.name}</span>
                                               <span className="font-mono text-slate-500">{(opt.monthlyPrice * quantities[opt.id]).toFixed(2)}€</span>
                                           </div>
                                       ))}
                                       {quantities.dual_screen > 0 && <div className="flex justify-between text-sm py-1 pl-4 border-l-2 border-slate-200"><span className="text-slate-700"><span className="font-bold">{quantities.dual_screen}x</span> Dual Screen (2e écran)</span><span className="font-mono text-slate-500">{(quantities.dual_screen * DUAL_SCREEN_PRICE).toFixed(2)}€</span></div>}
                                       {quantities.fixed_screen > 0 && <div className="flex justify-between text-sm py-1 pl-4 border-l-2 border-slate-200"><span className="text-slate-700"><span className="font-bold">{quantities.fixed_screen}x</span> Ecran Fixe HP</span><span className="font-mono text-slate-500">{(quantities.fixed_screen * DUAL_SCREEN_PRICE).toFixed(2)}€</span></div>}
                                   </div>

                                   <div>
                                       <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 mt-4">2. Prestations & Services</h4>
                                       {getTotalMigMail() > 0 && <div className="flex justify-between text-sm py-1"><span className="text-slate-700"><span className="font-bold">{getTotalMigMail()}x</span> Migration AvocatMail</span><span className="font-mono text-slate-500">{(MIGRATION_MAIL_PRICE * getTotalMigMail()).toFixed(2)}€</span></div>}
                                       {getTotalMigCloud() > 0 && <div className="flex justify-between text-sm py-1"><span className="text-slate-700"><span className="font-bold">{getTotalMigCloud()}x</span> Migration OneDrive</span><span className="font-mono text-slate-500">{(getTotalMigCloud() * MIGRATION_CLOUD_PRICE).toFixed(2)}€</span></div>}
                                       {OPTIONS.filter(o => o.isService && quantities[o.id] > 0).map(opt => (
                                           <div key={opt.id} className="flex justify-between text-sm py-1 border-b border-slate-50 last:border-0">
                                               <span className="text-slate-700"><span className="font-bold">{quantities[opt.id]}x</span> {opt.name}</span>
                                               <span className="font-mono text-slate-500">{(opt.monthlyPrice * quantities[opt.id]).toFixed(2)}€</span>
                                           </div>
                                       ))}
                                       {isFraisTempoDue && <div className="flex justify-between text-sm py-1"><span className="text-slate-700"><span className="font-bold">1x</span> Frais Tempo (Logistique)</span><span className="font-mono text-slate-500">{FRAIS_TEMPO_PRICE.toFixed(2)}€</span></div>}
                                       {includeBackup && totalWorkstations > 0 && <div className="flex justify-between text-sm py-1"><span className="text-slate-700"><span className="font-bold">1x</span> Setup Sauvegarde</span><span className="font-mono text-slate-500">{GLOBAL_BACKUP_SETUP_PRICE.toFixed(2)}€</span></div>}
                                   </div>
                                   
                                   {isExistingClient && (
                                       <div>
                                           <h4 className="text-xs font-bold text-emerald-600 uppercase mb-2 mt-4">Upgrades (Client Existant)</h4>
                                           {BASES.map(base => {
                                                const upCollab = quantities[`${base.id}_upgrade_collab`] || 0;
                                                const upSecu = quantities[`${base.id}_upgrade_secu`] || 0;
                                                if(upCollab === 0 && upSecu === 0) return null;
                                                return (
                                                    <div key={`up-${base.id}`}>
                                                        {upCollab > 0 && <div className="flex justify-between text-sm py-1"><span className="text-emerald-700"><span className="font-bold">{upCollab}x</span> Pack Collab Premium ({base.name})</span><span className="font-mono text-slate-500">{(upCollab * OPTION_UPGRADE_COLLAB_PRICE).toFixed(2)}€</span></div>}
                                                        {upSecu > 0 && <div className="flex justify-between text-sm py-1"><span className="text-emerald-700"><span className="font-bold">{upSecu}x</span> Pack Sécurité ({base.name})</span><span className="font-mono text-slate-500">{(upSecu * OPTION_UPGRADE_SECU_PRICE).toFixed(2)}€</span></div>}
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
            <div className="w-full h-10 bg-slate-800 flex items-center justify-between px-4 border-b border-slate-700">
                <div className="flex items-center gap-2 text-white">
                    <Terminal size={14} className="text-green-400" />
                    <span className="text-xs font-mono">CONSOLE DEBUG : SNOWFLAKE DATA</span>
                    {snowflakeData && (
                        <span className={`px-2 py-0.5 rounded text-[10px] ${snowflakeData.error ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
                            {snowflakeData.error ? 'ERREUR API' : 'DONNÉES REÇUES'}
                        </span>
                    )}
                </div>
                <button onClick={() => setIsDebugOpen(!isDebugOpen)} className="text-slate-400 hover:text-white">
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
