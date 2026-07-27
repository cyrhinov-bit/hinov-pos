/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Director, GovernanceLog, Product, Transaction, StockArrival, User } from './types';

// Image de connexion et profils de l'application
export const LOGIN_BG_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdyr1abw6RtNQI2HtN1lu893gBGhm3IV8oLn_rfsLPIRMTd6DxPhyy01wH_hP34ivPu8ANo4mrkgBDvx9lSq9tG_bHH-vT3uOP7Mh08O5x7s-vplvHDofZ3lvXafq0GrBRRFWNS4xzeK6kFuRtqraWkKAw98EtXO8s7exOrDUtLGOP0PUFkh2ero4JayDhzn4POKfAwYIlZplPv7Ebi8B61PK8jnUjFvgs_-Na3FJtSKgJD77q3buP5HavRmMCmlCUCNeKEVVoZBc';

export const PROFILES: Record<string, User> = {
  governor: {
    name: 'Admin Système',
    role: 'Gouverneur du Système',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOdppZHu4vnd4ojMQyqe41O9EEITkldMUdMiFQ0r3goyuTa8poFopFgMTunWMrpvMuR1ZAdEcHE4VjQAqQ475CHkMlk0TW_M__zkJg6xgC7XUg2UzMheh7IqgCdSG_UTn4BhcPEapm0iU4x3Gvy1SqCl7XOwX0fUHCQpFWwL_4Sul8cdB9fUcFZ9yqHBLyqLBmEgI5APy7omq30bNPApKZHXur_9lAlCPZXCMwXzJuoZf6aPOjeRxbUPic6D4300pzcnUQ-rgZg94',
    branch: 'Centre de Sécurité QG',
    email: 'admin@company.com',
    password: 'admin',
  },
  director: {
    name: 'Alex Rivera',
    role: 'Directeur',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsnmKkwVIg_dLy_4meeh7cT_qrwIYLP6s8wR-kMfe33RiCcyEE2tXoWiTEf2f_wsb6bOcDKZc_G9_Hgib607pdoO3t6K69YcU8n_FMXIUtuKrjuhpKkr00anEk06jCW1z3ghZtRZZz85cK-Tx6efkLh-UiAfXUved3N2ln2G3DCGU_PM-4HWVzc6YaRHHkbwfw1W1LYaCAlteGVMU47wbTuYMRQIHFun84fCZga6XUHVPfcDY1XQW_Or94Ds_FsD6MgyRn0VTGctw',
    branch: 'Opérations Globales',
    email: 'director@company.com',
    password: 'director',
  },
  inventory: {
    name: 'Robert King',
    role: 'Gestionnaire de stock',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD76ZwVVPm-rFd30TfjPVCRx40SyYz5Gl_9GT_z9AU3EAFQCYbZnA0QC5XxdzWR4PFTui-cDbUBDGfsNtUx2kVyke1Xslak4u7HjXqwr4YSyHtVgTYtcacvqPNWwaalstqURRQdeC8A02ip9bcrvI1iCF0vPb3e4SdSJRT_RVcrwFaPUh9dUrdNZpluX_6gwSoBcCYrpc9Iuau383uK27S9D9wr9IeEgVpAVQuKDAJQYqdEFljgc_2Xcgnu0FwmiZ92IZL90M3dzlQ',
    branch: 'Centre DC-01',
    email: 'inventory@company.com',
    password: 'inventory',
  },
  sales: {
    name: 'Alex Admin',
    role: 'Caissier',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTsavjSFjJ0krutZCZlItFbSccT9B6zjvfSu7h7CHdkz6hW1M2Rk4hQjTZRwR8wz7Q_mkk_GJ3oNLQFPfFjGS6AT8HLtMFCWTQ_Tj1DmUZZu3Qm4aZEgw8o98SibrPpEJRGwV6rti4op_eF2z00VY0fGVAexXBWlKB662Oqz4ma_xAx-m30DyOsOjvKZQzybn1frh7VprBB29LYLWPmLlyP39Cql9C0FGDz6_1ZSm5vjqhi0e3i8NQi33B3mKeEthF8C2hrOmySkE',
    branch: 'Succursale Principale',
    email: 'cashier@company.com',
    password: 'cashier',
  },
};

// JEUX DE DONNÉES INITIAUX MOCKÉS

export const INITIAL_DIRECTORS: Director[] = [
  {
    id: 'DIR-01',
    name: 'Sarah Mitchell',
    email: 's.mitchell@smartstock.com',
    department: 'Approvisionnement',
    lastActivity: 'Il y a 12 min',
    status: 'Actif',
    initials: 'SM',
    bgColor: 'bg-[#e2dfff] text-[#3525cd]',
  },
  {
    id: 'DIR-02',
    name: 'Robert King',
    email: 'r.king@smartstock.com',
    department: 'Gestion de l\'Entrepôt',
    lastActivity: 'Il y a 2 heures',
    status: 'Actif',
    initials: 'RK',
    bgColor: 'bg-[#c9e6ff] text-[#006591]',
  },
  {
    id: 'DIR-03',
    name: 'Amina Lopez',
    email: 'a.lopez@smartstock.com',
    department: 'Ventes Globales',
    lastActivity: 'Hors ligne',
    status: 'Suspendu',
    initials: 'AL',
    bgColor: 'bg-[#e1e0ff] text-[#3130c0]',
  },
  {
    id: 'DIR-04',
    name: 'David Wu',
    email: 'd.wu@smartstock.com',
    department: 'Logistique',
    lastActivity: 'Actif maintenant',
    status: 'En révision',
    initials: 'DW',
    bgColor: 'bg-[#dae2fd] text-[#131b2e]',
  },
];

export const INITIAL_GOVERNANCE_LOGS: GovernanceLog[] = [
  {
    id: 'ID-99823',
    type: 'access',
    title: 'Niveau d\'Accès Accordé',
    description: "Sarah Mitchell a obtenu un accès administrateur pour 'Financier Q4'.",
    timestamp: '14:23:05',
    code: 'SM-99823',
  },
  {
    id: 'ID-99821',
    type: 'error',
    title: 'Échec de Tentative de Connexion',
    description: 'Plusieurs tentatives de connexion échouées détectées depuis l\'IP : 192.168.1.104.',
    timestamp: '14:15:22',
    code: 'IP-99821',
  },
  {
    id: 'ID-99815',
    type: 'policy',
    title: 'Politique Système Mise à Jour',
    description: 'La politique de rotation des mots de passe est fixée à 90 jours pour tous les rôles de directeurs.',
    timestamp: '13:58:10',
    code: 'PO-99815',
  },
  {
    id: 'ID-99801',
    type: 'audit',
    title: 'Exportation d\'Audit Terminée',
    description: 'Rapport d\'audit de gouvernance semestriel généré par le Gouverneur du Système.',
    timestamp: '13:45:00',
    code: 'AU-99801',
  },
];

export const LIBRAIRIE_CATEGORIES = [
  {
    name: 'Livres',
    icon: '📚',
    subcategories: [
      'Romans', 'Bandes dessinées', 'Mangas', 'Livres scolaires', 'Parascolaires',
      'Dictionnaires', 'Encyclopédies', 'Livres universitaires', 'Livres religieux',
      'Livres pour enfants', 'Livres de cuisine', 'Livres de développement personnel', 'Livres professionnels'
    ],
    description: 'Romans, BD, Mangas, livres scolaires, dictionnaires et guides.',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=60'
  },
  {
    name: 'Fournitures scolaires',
    icon: '🎒',
    subcategories: [
      'Cahiers', 'Ramettes de papier', 'Protège-cahiers', 'Classeurs', 'Intercalaires',
      'Chemises', 'Feuilles simples', 'Feuilles doubles', 'Copies', 'Carnets', 'Agendas'
    ],
    description: 'Cahiers, classeurs, copies, feuillets et agendas scolaires.',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=500&auto=format&fit=crop&q=60'
  },
  {
    name: 'Écriture',
    icon: '✏️',
    subcategories: [
      'Stylos bille', 'Stylos gel', 'Stylos plume', 'Crayons à papier', 'Porte-mines',
      'Mines', 'Marqueurs', 'Surligneurs', 'Feutres', 'Correcteurs'
    ],
    description: 'Stylos, feutres, crayons, surligneurs et correcteurs.',
    image: 'https://images.unsplash.com/photo-1585336261026-8f578639b921?w=500&auto=format&fit=crop&q=60'
  },
  {
    name: 'Dessin & Beaux-Arts',
    icon: '🎨',
    subcategories: [
      'Crayons de couleur', 'Pastels', 'Peinture', 'Pinceaux', 'Toiles',
      'Chevalets', 'Papier dessin', 'Gommes mie de pain', 'Fusains'
    ],
    description: 'Matériel artistique, crayons de couleur, toiles et pinceaux.',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&auto=format&fit=crop&q=60'
  },
  {
    name: 'Bureau',
    icon: '🖇️',
    subcategories: [
      'Agrafeuses', 'Agrafes', 'Perforatrices', 'Ciseaux', 'Règles',
      'Équerres', 'Rapporteurs', 'Colles', 'Rubans adhésifs', 'Dévidoirs', 'Calculatrices'
    ],
    description: 'Agrafeuses, perforatrices, ciseaux, colles et petit matériel.',
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60'
  },
  {
    name: 'Impression & Papier',
    icon: '📄',
    subcategories: [
      'Papier A4', 'Papier A3', 'Papier photo', 'Papier cartonné', 'Papier couleur',
      'Enveloppes', 'Étiquettes', 'Papier autocollant'
    ],
    description: 'Papiers de reproduction A4/A3, enveloppes et étiquettes.',
    image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&auto=format&fit=crop&q=60'
  },
  {
    name: 'Informatique',
    icon: '💻',
    subcategories: [
      'Clés USB', 'Cartes mémoire', 'Souris', 'Claviers', 'Casques',
      'Webcams', 'Tapis de souris', 'Adaptateurs'
    ],
    description: 'Périphériques informatiques, clés USB, souris et accessoires.',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&auto=format&fit=crop&q=60'
  },
  {
    name: 'Consommables imprimantes',
    icon: '🖨️',
    subcategories: [
      'Cartouches d\'encre', 'Toners', 'Tambours', 'Rubans'
    ],
    description: 'Cartouches d\'encre, toners laser et tambours.',
    image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&auto=format&fit=crop&q=60'
  },
  {
    name: 'Classement & Archivage',
    icon: '📂',
    subcategories: [
      'Boîtes archives', 'Classeurs', 'Porte-documents', 'Trieurs', 'Pochettes plastiques', 'Reliures'
    ],
    description: 'Boîtes archives, chemises, trieurs et classeurs.',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60'
  },
  {
    name: 'Sacs & Cartables',
    icon: '🎒',
    subcategories: [
      'Sacs scolaires', 'Cartables', 'Trousses', 'Sacs à dos', 'Valises scolaires'
    ],
    description: 'Cartables, sacs à dos scolaires et trousses.',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=60'
  },
  {
    name: 'Cadeaux & Loisirs',
    icon: '🎁',
    subcategories: [
      'Cartes de vœux', 'Emballages cadeaux', 'Jeux éducatifs', 'Puzzles', 'Jouets éducatifs'
    ],
    description: 'Cartes de vœux, jeux éducatifs, puzzles et emballages.',
    image: 'https://images.unsplash.com/photo-151388504200d-89e781622d14?w=500&auto=format&fit=crop&q=60'
  },
  {
    name: 'Fournitures artistiques',
    icon: '🖌️',
    subcategories: [
      'Gouache', 'Aquarelle', 'Acrylique', 'Vernis', 'Palettes', 'Spatules'
    ],
    description: 'Peintures gouache, aquarelle, acrylique, pinceaux et palettes.',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=60'
  },
  {
    name: 'Articles divers',
    icon: '📦',
    subcategories: [
      'Piles', 'Horloges', 'Calculatrices scientifiques', 'Lampes de bureau', 'Parapluies', 'Bouteilles d\'eau'
    ],
    description: 'Calculatrices scientifiques, piles, lampes et divers.',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=60'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  // 1. Livres 📚
  {
    id: 'PROD-101',
    sku: 'LIV-ROM-01',
    name: 'Roman "L\'Étranger" - Albert Camus',
    category: 'Livres',
    subcategory: 'Romans',
    price: 4500,
    purchasePrice: 2800,
    stock: 120,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60',
    velocity: '120 unités',
    trend: 'HAUSSE',
    salesVolume: 120,
  },
  {
    id: 'PROD-102',
    sku: 'LIV-MNG-02',
    name: 'Manga "One Piece Tome 100"',
    category: 'Livres',
    subcategory: 'Mangas',
    price: 3900,
    purchasePrice: 2400,
    stock: 85,
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=60',
    velocity: '85 unités',
    trend: '+12%',
    salesVolume: 85,
  },
  {
    id: 'PROD-103',
    sku: 'LIV-DIC-03',
    name: 'Le Petit Larousse Illustré 2026',
    category: 'Livres',
    subcategory: 'Dictionnaires',
    price: 24500,
    purchasePrice: 16500,
    stock: 35,
    image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500&auto=format&fit=crop&q=60',
    velocity: '35 unités',
    trend: 'Stable',
    salesVolume: 35,
  },

  // 2. Fournitures scolaires 🎒
  {
    id: 'PROD-201',
    sku: 'FSC-CAH-01',
    name: 'Cahier Clairefontaine 200p 21x29.7 Grands Carreaux',
    category: 'Fournitures scolaires',
    subcategory: 'Cahiers',
    price: 1800,
    purchasePrice: 1050,
    stock: 450,
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60',
    velocity: '450 unités',
    trend: 'HAUSSE MAX',
    salesVolume: 450,
  },
  {
    id: 'PROD-202',
    sku: 'FSC-RAM-02',
    name: 'Ramette Papier Double A A4 80g (500 feuilles)',
    category: 'Fournitures scolaires',
    subcategory: 'Ramettes de papier',
    price: 3500,
    purchasePrice: 2300,
    stock: 320,
    image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&auto=format&fit=crop&q=60',
    velocity: '320 unités',
    trend: '+8%',
    salesVolume: 320,
  },
  {
    id: 'PROD-203',
    sku: 'FSC-AGD-03',
    name: 'Agenda Scolaire Oxford 2026-2027',
    category: 'Fournitures scolaires',
    subcategory: 'Agendas',
    price: 4200,
    purchasePrice: 2600,
    stock: 140,
    image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500&auto=format&fit=crop&q=60',
    velocity: '140 unités',
    trend: '+15%',
    salesVolume: 140,
  },

  // 3. Écriture ✏️
  {
    id: 'PROD-301',
    sku: 'ECR-BIC-01',
    name: 'Boîte de 50 Stylos BIC Cristal Bleu 1.0mm',
    category: 'Écriture',
    subcategory: 'Stylos bille',
    price: 6500,
    purchasePrice: 3900,
    stock: 210,
    image: 'https://images.unsplash.com/photo-1585336261026-8f578639b921?w=500&auto=format&fit=crop&q=60',
    velocity: '210 unités',
    trend: '+5%',
    salesVolume: 210,
  },
  {
    id: 'PROD-302',
    sku: 'ECR-SUR-02',
    name: 'Pochette 4 Surligneurs Stabilo Boss Original',
    category: 'Écriture',
    subcategory: 'Surligneurs',
    price: 2800,
    purchasePrice: 1650,
    stock: 180,
    image: 'https://images.unsplash.com/photo-1585336261026-8f578639b921?w=500&auto=format&fit=crop&q=60',
    velocity: '180 unités',
    trend: '+10%',
    salesVolume: 180,
  },
  {
    id: 'PROD-303',
    sku: 'ECR-PLM-03',
    name: 'Stylo Plume Waterman Allure Métal Chrome',
    category: 'Écriture',
    subcategory: 'Stylos plume',
    price: 14500,
    purchasePrice: 9200,
    stock: 25,
    image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=60',
    velocity: '25 unités',
    trend: 'Stable',
    salesVolume: 25,
  },

  // 4. Dessin & Beaux-Arts 🎨
  {
    id: 'PROD-401',
    sku: 'DES-CRA-01',
    name: 'Coffret 36 Crayons de couleur Prismacolor Premier',
    category: 'Dessin & Beaux-Arts',
    subcategory: 'Crayons de couleur',
    price: 18500,
    purchasePrice: 11500,
    stock: 60,
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&auto=format&fit=crop&q=60',
    velocity: '60 unités',
    trend: '+4%',
    salesVolume: 60,
  },
  {
    id: 'PROD-402',
    sku: 'DES-CHV-02',
    name: 'Chevalet d\'Atelier en Hêtre Massif Pliable',
    category: 'Dessin & Beaux-Arts',
    subcategory: 'Chevalets',
    price: 32000,
    purchasePrice: 20000,
    stock: 12,
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=60',
    velocity: '12 unités',
    trend: 'Stable',
    salesVolume: 12,
  },

  // 5. Bureau 🖇️
  {
    id: 'PROD-501',
    sku: 'BUR-AGR-01',
    name: 'Agrafeuse Métal Heavy Duty Maped 100 Feuilles',
    category: 'Bureau',
    subcategory: 'Agrafeuses',
    price: 9500,
    purchasePrice: 5800,
    stock: 45,
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60',
    velocity: '45 unités',
    trend: 'Stable',
    salesVolume: 45,
  },
  {
    id: 'PROD-502',
    sku: 'BUR-PER-02',
    name: 'Perforatrice 2 Trous Capacité 30 Feuilles',
    category: 'Bureau',
    subcategory: 'Perforatrices',
    price: 4800,
    purchasePrice: 2900,
    stock: 70,
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60',
    velocity: '70 unités',
    trend: '+2%',
    salesVolume: 70,
  },

  // 6. Impression & Papier 📄
  {
    id: 'PROD-601',
    sku: 'IMP-PHT-01',
    name: 'Papier Photo Glossy A4 200g (50 feuilles)',
    category: 'Impression & Papier',
    subcategory: 'Papier photo',
    price: 6800,
    purchasePrice: 4200,
    stock: 95,
    image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&auto=format&fit=crop&q=60',
    velocity: '95 unités',
    trend: '+6%',
    salesVolume: 95,
  },
  {
    id: 'PROD-602',
    sku: 'IMP-ENV-02',
    name: 'Boîte de 100 Enveloppes Auto-Adhésives C5',
    category: 'Impression & Papier',
    subcategory: 'Enveloppes',
    price: 3200,
    purchasePrice: 1900,
    stock: 130,
    image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&auto=format&fit=crop&q=60',
    velocity: '130 unités',
    trend: 'Stable',
    salesVolume: 130,
  },

  // 7. Informatique 💻
  {
    id: 'PROD-701',
    sku: 'INF-USB-01',
    name: 'Clé USB 3.2 SanDisk Ultra 64 Go',
    category: 'Informatique',
    subcategory: 'Clés USB',
    price: 6500,
    purchasePrice: 4000,
    stock: 110,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&auto=format&fit=crop&q=60',
    velocity: '110 unités',
    trend: '+10%',
    salesVolume: 110,
  },
  {
    id: 'PROD-702',
    sku: 'INF-SOU-02',
    name: 'Souris Sans Fil Logitech M185 Ergonomique',
    category: 'Informatique',
    subcategory: 'Souris',
    price: 8900,
    purchasePrice: 5500,
    stock: 75,
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60',
    velocity: '75 unités',
    trend: '+3%',
    salesVolume: 75,
  },

  // 8. Consommables imprimantes 🖨️
  {
    id: 'PROD-801',
    sku: 'CON-HP-01',
    name: 'Cartouche d\'Encre HP 305XL Noir Haute Capacité',
    category: 'Consommables imprimantes',
    subcategory: 'Cartouches d\'encre',
    price: 16500,
    purchasePrice: 11000,
    stock: 40,
    image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&auto=format&fit=crop&q=60',
    velocity: '40 unités',
    trend: 'HAUSSE',
    salesVolume: 40,
  },
  {
    id: 'PROD-802',
    sku: 'CON-CAN-02',
    name: 'Toner Laser Canon CRG-054 Noir',
    category: 'Consommables imprimantes',
    subcategory: 'Toners',
    price: 38000,
    purchasePrice: 26000,
    stock: 18,
    image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&auto=format&fit=crop&q=60',
    velocity: '18 unités',
    trend: 'Stable',
    salesVolume: 18,
  },

  // 9. Classement & Archivage 📂
  {
    id: 'PROD-901',
    sku: 'CLA-ARC-01',
    name: 'Lot de 5 Boîtes d\'Archivage Dos 10cm',
    category: 'Classement & Archivage',
    subcategory: 'Boîtes archives',
    price: 4500,
    purchasePrice: 2700,
    stock: 160,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60',
    velocity: '160 unités',
    trend: '+5%',
    salesVolume: 160,
  },
  {
    id: 'PROD-902',
    sku: 'CLA-TRI-02',
    name: 'Trieur Valisette 12 Positions Accordéon Pro',
    category: 'Classement & Archivage',
    subcategory: 'Trieurs',
    price: 3800,
    purchasePrice: 2200,
    stock: 90,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60',
    velocity: '90 unités',
    trend: '+1%',
    salesVolume: 90,
  },

  // 10. Sacs & Cartables 🎒
  {
    id: 'PROD-1001',
    sku: 'SAC-EST-01',
    name: 'Sac à Dos Eastpak Padded Pak\'r Noir 24L',
    category: 'Sacs & Cartables',
    subcategory: 'Sacs à dos',
    price: 26500,
    purchasePrice: 16500,
    stock: 50,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=60',
    velocity: '50 unités',
    trend: 'HAUSSE',
    salesVolume: 50,
  },
  {
    id: 'PROD-1002',
    sku: 'SAC-TRS-02',
    name: 'Trousse Scolaire Double Compartiment Maped',
    category: 'Sacs & Cartables',
    subcategory: 'Trousses',
    price: 3200,
    purchasePrice: 1800,
    stock: 140,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=60',
    velocity: '140 unités',
    trend: '+8%',
    salesVolume: 140,
  },

  // 11. Cadeaux & Loisirs 🎁
  {
    id: 'PROD-1101',
    sku: 'CAD-SCR-01',
    name: 'Jeu Éducatif Scrabble Édition Originale',
    category: 'Cadeaux & Loisirs',
    subcategory: 'Jeux éducatifs',
    price: 15500,
    purchasePrice: 9500,
    stock: 30,
    image: 'https://images.unsplash.com/photo-151388504200d-89e781622d14?w=500&auto=format&fit=crop&q=60',
    velocity: '30 unités',
    trend: 'Stable',
    salesVolume: 30,
  },
  {
    id: 'PROD-1102',
    sku: 'CAD-PUZ-02',
    name: 'Puzzle Ravensburger 1000 Pièces Carte du Monde',
    category: 'Cadeaux & Loisirs',
    subcategory: 'Puzzles',
    price: 11000,
    purchasePrice: 6800,
    stock: 22,
    image: 'https://images.unsplash.com/photo-151388504200d-89e781622d14?w=500&auto=format&fit=crop&q=60',
    velocity: '22 unités',
    trend: '+4%',
    salesVolume: 22,
  },

  // 12. Fournitures artistiques 🖌️
  {
    id: 'PROD-1201',
    sku: 'ART-ACR-01',
    name: 'Coffret Peinture Aquarelle Winsor & Newton 12 demi-godets',
    category: 'Fournitures artistiques',
    subcategory: 'Aquarelle',
    price: 22000,
    purchasePrice: 13500,
    stock: 28,
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=60',
    velocity: '28 unités',
    trend: '+6%',
    salesVolume: 28,
  },
  {
    id: 'PROD-1202',
    sku: 'ART-PEB-02',
    name: 'Set Peinture Acrylique Pebeo 12 Tube x 12ml',
    category: 'Fournitures artistiques',
    subcategory: 'Acrylique',
    price: 9800,
    purchasePrice: 5900,
    stock: 45,
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=60',
    velocity: '45 unités',
    trend: '+2%',
    salesVolume: 45,
  },

  // 13. Articles divers 📦
  {
    id: 'PROD-1301',
    sku: 'DIV-CAS-01',
    name: 'Calculatrice Scientifique Casio fx-991ES Plus II',
    category: 'Articles divers',
    subcategory: 'Calculatrices scientifiques',
    price: 18500,
    purchasePrice: 11800,
    stock: 80,
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=60',
    velocity: '80 unités',
    trend: 'HAUSSE MAX',
    salesVolume: 80,
  },
  {
    id: 'PROD-1302',
    sku: 'DIV-PIL-02',
    name: 'Pack 8 Piles Duracell Ultra AA LR6',
    category: 'Articles divers',
    subcategory: 'Piles',
    price: 5200,
    purchasePrice: 3200,
    stock: 150,
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=60',
    velocity: '150 unités',
    trend: '+7%',
    salesVolume: 150,
  },
  {
    id: 'PROD-1303',
    sku: 'DIV-LMP-03',
    name: 'Lampe de Bureau LED Tactile Rechargeable USB',
    category: 'Articles divers',
    subcategory: 'Lampes de bureau',
    price: 12500,
    purchasePrice: 7800,
    stock: 35,
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=60',
    velocity: '35 unités',
    trend: 'Stable',
    salesVolume: 35,
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // Ventes du jour (2026-07-03)
  {
    id: '#TRX-1001',
    asset: 'Vente Directe PDV',
    category: 'VENTES POINT DE VENTE',
    origin: 'Succursale Principale',
    destination: 'Client',
    status: 'Livré',
    value: 391800,
    date: '2026-07-03',
    paymentMethod: 'espèces',
    cashierName: 'Alex Admin',
    items: [
      { productId: 'PROD-02', name: 'SmartHub 2.0', quantity: 2, price: 149400, purchasePrice: 97110, category: 'Électronique' },
      { productId: 'PROD-10', name: 'Sac à Dos de Voyage Nomad', quantity: 1, price: 51000, purchasePrice: 33150, category: 'Voyage' },
      { productId: 'PROD-07', name: 'Lunettes Rétro Solaires', quantity: 1, price: 45000, purchasePrice: 29250, category: 'Accessoires' }
    ],
    difference: 0
  },
  {
    id: '#TRX-1002',
    asset: 'Vente Directe PDV',
    category: 'VENTES POINT DE VENTE',
    origin: 'Succursale Principale',
    destination: 'Client',
    status: 'Livré',
    value: 288000,
    date: '2026-07-03',
    paymentMethod: 'Carte bancaire',
    cashierName: 'Alex Admin',
    items: [
      { productId: 'PROD-08', name: 'Chaussures Course Velocity', quantity: 4, price: 72000, purchasePrice: 46800, category: 'Chaussures' }
    ],
    difference: 0
  },
  {
    id: '#TRX-1003',
    asset: 'Vente Directe PDV',
    category: 'VENTES POINT DE VENTE',
    origin: 'Succursale Principale',
    destination: 'Client',
    status: 'Livré',
    value: 179400,
    date: '2026-07-03',
    paymentMethod: 'Mobile Money',
    cashierName: 'Alex Admin',
    items: [
      { productId: 'PROD-05', name: 'Casque Pro Sound Sans-Fil', quantity: 1, price: 179400, purchasePrice: 116610, category: 'Électronique' }
    ],
    difference: -500 // variance caisse
  },
  // Ventes d'hier (2026-07-02)
  {
    id: '#TRX-1004',
    asset: 'Vente Directe PDV',
    category: 'VENTES POINT DE VENTE',
    origin: 'Succursale Principale',
    destination: 'Client',
    status: 'Livré',
    value: 420000,
    date: '2026-07-02',
    paymentMethod: 'espèces',
    cashierName: 'Alex Admin',
    items: [
      { productId: 'PROD-01', name: 'Moteur Pro-Fit X', quantity: 2, price: 210000, purchasePrice: 136500, category: 'Automobile' }
    ],
    difference: 1500
  },
  {
    id: '#TRX-1005',
    asset: 'Vente Directe PDV',
    category: 'VENTES POINT DE VENTE',
    origin: 'Succursale Principale',
    destination: 'Client',
    status: 'Livré',
    value: 324000,
    date: '2026-07-02',
    paymentMethod: 'Carte bancaire',
    cashierName: 'Robert King',
    items: [
      { productId: 'PROD-09', name: 'Objectif Photo X-Lens 50mm', quantity: 1, price: 324000, purchasePrice: 210600, category: 'Accessoires' }
    ],
    difference: 0
  },
  // Ventes de la semaine (2026-06-28 à 2026-07-01)
  {
    id: '#TRX-1006',
    asset: 'Vente Directe PDV',
    category: 'VENTES POINT DE VENTE',
    origin: 'Succursale Principale',
    destination: 'Client',
    status: 'Livré',
    value: 648000,
    date: '2026-06-30',
    paymentMethod: 'Mobile Money',
    cashierName: 'Robert King',
    items: [
      { productId: 'PROD-09', name: 'Objectif Photo X-Lens 50mm', quantity: 2, price: 324000, purchasePrice: 210600, category: 'Accessoires' }
    ],
    difference: 0
  },
  {
    id: '#TRX-1007',
    asset: 'Vente Directe PDV',
    category: 'VENTES POINT DE VENTE',
    origin: 'Succursale Principale',
    destination: 'Client',
    status: 'Livré',
    value: 510000,
    date: '2026-06-29',
    paymentMethod: 'espèces',
    cashierName: 'Alex Admin',
    items: [
      { productId: 'PROD-10', name: 'Sac à Dos de Voyage Nomad', quantity: 10, price: 51000, purchasePrice: 33150, category: 'Voyage' }
    ],
    difference: 0
  },
  // Ventes du mois dernier (Juin 2026, hors cette semaine)
  {
    id: '#TRX-1008',
    asset: 'Vente Directe PDV',
    category: 'VENTES POINT DE VENTE',
    origin: 'Succursale Principale',
    destination: 'Client',
    status: 'Livré',
    value: 1200000,
    date: '2026-06-15',
    paymentMethod: 'Carte bancaire',
    cashierName: 'Alex Admin',
    items: [
      { productId: 'PROD-01', name: 'Moteur Pro-Fit X', quantity: 5, price: 210000, purchasePrice: 136500, category: 'Automobile' },
      { productId: 'PROD-03', name: 'Alliage de Précision V4', quantity: 16, price: 9000, purchasePrice: 5850, category: 'Fabrication' }
    ],
    difference: -2000
  },
  {
    id: '#TRX-1009',
    asset: 'Vente Directe PDV',
    category: 'VENTES POINT DE VENTE',
    origin: 'Succursale Principale',
    destination: 'Client',
    status: 'Livré',
    value: 896400,
    date: '2026-06-10',
    paymentMethod: 'espèces',
    cashierName: 'Alex Rivera',
    items: [
      { productId: 'PROD-02', name: 'SmartHub 2.0', quantity: 6, price: 149400, purchasePrice: 97110, category: 'Électronique' }
    ],
    difference: 0
  },
  // Ventes de l'année (plus anciennes en 2026)
  {
    id: '#TRX-1010',
    asset: 'Vente Directe PDV',
    category: 'VENTES POINT DE VENTE',
    origin: 'Succursale Principale',
    destination: 'Client',
    status: 'Livré',
    value: 3000000,
    date: '2026-04-12',
    paymentMethod: 'espèces',
    cashierName: 'Alex Admin',
    items: [
      { productId: 'PROD-01', name: 'Moteur Pro-Fit X', quantity: 12, price: 210000, purchasePrice: 136500, category: 'Automobile' },
      { productId: 'PROD-06', name: 'Montre Connectée Horizon', quantity: 4, price: 108000, purchasePrice: 70200, category: 'Électronique' }
    ],
    difference: 0
  },
  // Ventes de l'année précédente (2025)
  {
    id: '#TRX-1011',
    asset: 'Vente Directe PDV',
    category: 'VENTES POINT DE VENTE',
    origin: 'Succursale Principale',
    destination: 'Client',
    status: 'Livré',
    value: 4500000,
    date: '2025-10-24',
    paymentMethod: 'Carte bancaire',
    cashierName: 'Alex Admin',
    items: [
      { productId: 'PROD-01', name: 'Moteur Pro-Fit X', quantity: 20, price: 210000, purchasePrice: 136500, category: 'Automobile' },
      { productId: 'PROD-02', name: 'SmartHub 2.0', quantity: 2, price: 149400, purchasePrice: 97110, category: 'Électronique' }
    ],
    difference: 0
  },
  // Anciennes transactions logistiques conservées
  {
    id: '#TRX-99021',
    asset: 'Acier de Qualité Industrielle',
    category: 'MATIÈRE PREMIÈRE EN VRAC',
    origin: 'Entrepôt Chicago 1',
    destination: 'Usine de Fabrication A',
    status: 'En transit',
    value: 25290000,
    date: '2026-07-01',
  },
  {
    id: '#TRX-99018',
    asset: 'SmartHub 2.0 (Lot 5)',
    category: 'ÉLECTRONIQUE GRAND PUBLIC',
    origin: 'Centre de Guangzhou',
    destination: 'Distribution de Détail B',
    status: 'Livré',
    value: 7440000,
    date: '2026-07-02',
  },
  {
    id: '#TRX-99015',
    asset: 'Composants de Turbine d\'Aviation',
    category: 'PIÈCES DE PRÉCISION',
    origin: 'Centre Logistique de Berlin',
    destination: 'Assemblage de Munich',
    status: 'Retardé',
    value: 93600000,
    date: '2026-06-30',
  },
];

export const INITIAL_STOCK_ARRIVALS: StockArrival[] = [
  {
    id: 'ARR-01',
    sku: 'ELC-29381',
    supplier: 'Global Tech Dist.',
    quantity: '+450 Unités',
    location: 'Zone B-12',
    status: 'VÉRIFIÉ',
  },
  {
    id: 'ARR-02',
    sku: 'FRN-00214',
    supplier: 'Modern Office Co.',
    quantity: '+120 Unités',
    location: 'Zone D-04',
    status: 'INSPECTION',
  },
  {
    id: 'ARR-03',
    sku: 'SFT-99120',
    supplier: 'Safe Guard Ltd.',
    quantity: '+2 000 Unités',
    location: 'Zone A-01',
    status: 'VÉRIFIÉ',
  },
  {
    id: 'ARR-04',
    sku: 'TEX-88219',
    supplier: 'Cotton Masters',
    quantity: '+85 Unités',
    location: 'Zone C-11',
    status: 'TRAITEMENT',
  },
  {
    id: 'ARR-05',
    sku: 'ELC-29382',
    supplier: 'Global Tech Dist.',
    quantity: '+150 Unités',
    location: 'Zone B-12',
    status: 'VÉRIFIÉ',
  },
];
