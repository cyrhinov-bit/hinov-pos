/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, Transaction, StockArrival, User, Director, GovernanceLog, Screen } from '../types';
import { DirectorFinance } from './DirectorFinance';

interface DirectorDashboardProps {
  screen: Screen;
  setScreen: (screen: Screen) => void;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  arrivals: StockArrival[];
  setArrivals: React.Dispatch<React.SetStateAction<StockArrival[]>>;
  searchQuery: string;
  currentUser: User;
  setCurrentUser: (u: User) => void;
  accounts: User[];
  setAccounts: React.Dispatch<React.SetStateAction<User[]>>;
  directors: Director[];
  setDirectors: React.Dispatch<React.SetStateAction<Director[]>>;
  logs: GovernanceLog[];
  setLogs: React.Dispatch<React.SetStateAction<GovernanceLog[]>>;
  triggerAlert: (msg: string, type?: 'success' | 'info') => void;
  onLogout: () => void;
}

export const DirectorDashboard: React.FC<DirectorDashboardProps> = ({
  screen,
  setScreen,
  products,
  setProducts,
  transactions,
  setTransactions,
  arrivals,
  setArrivals,
  searchQuery,
  currentUser,
  setCurrentUser,
  accounts,
  setAccounts,
  directors,
  setDirectors,
  logs,
  setLogs,
  triggerAlert,
  onLogout,
}) => {
  // --- LOCAL STATES ---
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedInventory, setSelectedInventory] = useState<any | null>(null);

  // Filters for Products/Stock/Sales
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'rupture' | 'faible' | 'normal'>('all');
  
  // Modals for User Management
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'Gestionnaire de stock', status: 'Active' });

  // Company Settings State
  const [companySettings, setCompanySettings] = useState({
    name: 'SmartStock ERP',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdyr1abw6RtNQI2HtN1lu893gBGhm3IV8oLn_rfsLPIRMTd6DxPhyy01wH_hP34ivPu8ANo4mrkgBDvx9lSq9tG_bHH-vT3uOP7Mh08O5x7s-vplvHDofZ3lvXafq0GrBRRFWNS4xzeK6kFuRtqraWkKAw98EtXO8s7exOrDUtLGOP0PUFkh2ero4JayDhzn4POKfAwYIlZplPv7Ebi8B61PK8jnUjFvgs_-Na3FJtSKgJD77q3buP5HavRmMCmlCUCNeKEVVoZBc',
    address: 'Avenue de la République, Dakar, Sénégal',
    phone: '+221 33 800 00 00',
    currency: 'F CFA',
    timezone: 'UTC/GMT +0',
    lowStockThreshold: 15,
  });

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name.split(' ')[0] || '',
    lastname: currentUser.name.split(' ').slice(1).join(' ') || 'Rivera',
    phone: '+221 77 450 12 34',
    avatar: currentUser.avatar,
    password: currentUser.password || 'director',
  });

  // --- HARDCODED ENRICHMENT DATA ---
  const suppliers = [
    { name: 'Global Tech Dist.', contact: '+221 33 824 15 15', city: 'Dakar', email: 'contact@globaltech.sn', productCount: 3 },
    { name: 'Modern Office Co.', contact: '+225 27 22 40 40 40', city: 'Abidjan', email: 'sales@modernoffice.ci', productCount: 2 },
    { name: 'Cotton Masters', contact: '+223 20 22 33 44', city: 'Bamako', email: 'cotton@masters.ml', productCount: 1 },
    { name: 'Safe Guard Ltd.', contact: '+228 22 21 00 11', city: 'Lomé', email: 'safeguard@tg.org', productCount: 1 },
  ];

  const inventories = [
    { id: 'INV-2026-01', title: 'Inventaire Mensuel Électronique', date: '2026-06-28', manager: 'Robert King', itemsAudited: 4, discrepanciesCount: 1, items: [
      { sku: 'SKU-119', name: 'SmartHub 2.0', expected: 615, measured: 615, diff: 0 },
      { sku: 'SKU-884', name: 'Casque Pro Sound Sans-Fil', expected: 12, measured: 10, diff: -2 },
      { sku: 'SKU-122', name: 'Montre Connectée Horizon', expected: 8, measured: 8, diff: 0 },
      { sku: 'SKU-901', name: 'Lunettes Rétro Solaires', expected: 4, measured: 4, diff: 0 },
    ]},
    { id: 'INV-2026-02', title: 'Audit Général de Mi-Année', date: '2026-06-15', manager: 'Robert King', itemsAudited: 3, discrepanciesCount: 0, items: [
      { sku: 'SKU-442', name: 'Moteur Pro-Fit X', expected: 842, measured: 842, diff: 0 },
      { sku: 'SKU-208', name: 'Alliage de Précision V4', expected: 588, measured: 588, diff: 0 },
      { sku: 'SKU-982', name: 'Caisse Standard 50L', expected: 433, measured: 433, diff: 0 },
    ]}
  ];

  // --- STATS COMPUTATIONS ---
  const todayTransactions = transactions.filter(t => t.date === '2026-07-02' || t.date === '2026-07-01');
  const dailyRevenue = todayTransactions.reduce((acc, t) => acc + t.value, 0);
  const monthlyRevenue = transactions.reduce((acc, t) => acc + t.value, 0);
  const totalStockValue = products.reduce((acc, p) => acc + p.price * p.stock, 0);
  const outOfStockProducts = products.filter(p => p.stock === 0);
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= companySettings.lowStockThreshold);

  // Users counts
  const stockManagers = accounts.filter(a => a.role.toLowerCase().includes('gestionnaire'));
  const cashiers = accounts.filter(a => a.role.toLowerCase().includes('caissier'));
  const activeStockManagers = stockManagers.length; // standard simplified
  const activeCashiers = cashiers.length;

  // --- ALERTS ---
  const systemAlerts = [
    ...outOfStockProducts.map(p => ({ type: 'rupture' as const, message: `Rupture critique : ${p.name}`, ref: p })),
    ...lowStockProducts.map(p => ({ type: 'faible' as const, message: `Stock faible : ${p.name} (${p.stock} restants)`, ref: p })),
    { type: 'inventaire' as const, message: 'Inventaire requis en Zone de stockage B-12', target: 'director-stock' },
    { type: 'caisse' as const, message: 'Caisse Principale ouverte par Alex Admin', target: 'director-sales' },
    ...accounts.filter(a => directors.find(d => d.email === a.email)?.status === 'Suspendu').map(a => ({ type: 'user' as const, message: `Collaborateur suspendu : ${a.name}`, ref: a })),
  ];

  // --- LOG GOVERNANCE ACTION ---
  const logDirectorAction = (title: string, description: string, type: 'access' | 'policy' | 'audit' | 'success' | 'error' = 'audit') => {
    const newLog: GovernanceLog = {
      id: `ID-${Math.floor(10000 + Math.random() * 90000)}`,
      type,
      title,
      description,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour12: false }),
      code: `DIR-${Math.floor(100 + Math.random() * 900)}`,
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // --- USER HANDLERS ---
  const handleOpenUserModal = (u: User | null = null) => {
    if (u) {
      setEditingUser(u);
      const associatedDir = directors.find(d => d.email === u.email);
      setUserForm({
        name: u.name,
        email: u.email || '',
        password: u.password || 'password123',
        role: u.role,
        status: associatedDir?.status || 'Actif',
      });
    } else {
      setEditingUser(null);
      setUserForm({ name: '', email: '', password: 'password123', role: 'Gestionnaire de stock', status: 'Actif' });
    }
    setShowUserModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email) {
      alert('Veuillez remplir les informations obligatoires');
      return;
    }

    if (editingUser) {
      // Edit User
      setAccounts(prev => prev.map(a => a.email === editingUser.email ? { ...a, name: userForm.name, role: userForm.role, password: userForm.password } : a));
      setDirectors(prev => prev.map(d => d.email === editingUser.email ? {
        ...d,
        name: userForm.name,
        department: userForm.role,
        status: userForm.status as any,
      } : d));
      triggerAlert(`Compte de ${userForm.name} modifié avec succès !`, 'success');
      logDirectorAction('Modification Utilisateur', `Le directeur a modifié le compte de ${userForm.name} (${userForm.email})`);
    } else {
      // Create User
      const newUser: User = {
        name: userForm.name,
        email: userForm.email,
        password: userForm.password,
        role: userForm.role,
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(userForm.name)}`,
        branch: 'Succursale active',
      };
      const newDir: Director = {
        id: `USR-${Date.now().toString().slice(-3)}`,
        name: userForm.name,
        email: userForm.email,
        department: userForm.role,
        lastActivity: 'Créé aujourd\'hui',
        status: userForm.status as any,
        initials: userForm.name.slice(0, 2).toUpperCase(),
        bgColor: 'bg-indigo-50 text-indigo-700',
      };
      setAccounts(prev => [...prev, newUser]);
      setDirectors(prev => [newDir, ...prev]);
      triggerAlert(`Nouveau compte créé pour ${userForm.name} (${userForm.role}) !`, 'success');
      logDirectorAction('Création Utilisateur', `Le directeur a créé le compte de ${userForm.name} (${userForm.email})`);
    }
    setShowUserModal(false);
  };

  const toggleUserStatus = (u: User) => {
    const associatedDir = directors.find(d => d.email === u.email);
    if (!associatedDir) return;
    const nextStatus = associatedDir.status === 'Actif' ? 'Suspendu' : 'Actif';
    setDirectors(prev => prev.map(d => d.email === u.email ? { ...d, status: nextStatus } : d));
    triggerAlert(`Statut de ${u.name} mis à jour : ${nextStatus}`, 'info');
    logDirectorAction('Changement de Statut', `Le directeur a passé le compte de ${u.name} à ${nextStatus}`);
  };

  const handleResetPassword = (u: User) => {
    const newPass = prompt(`Entrez le nouveau mot de passe pour ${u.name} :`, 'nouveauMdp2026');
    if (newPass === null) return;
    if (!newPass.trim()) {
      alert('Le mot de passe ne peut pas être vide.');
      return;
    }
    setAccounts(prev => prev.map(a => a.email === u.email ? { ...a, password: newPass } : a));
    triggerAlert(`Mot de passe réinitialisé pour ${u.name}`, 'success');
    logDirectorAction('Réinitialisation MDP', `Réinitialisation de mot de passe réussie pour ${u.name}`);
  };

  const handleResendActivation = (u: User) => {
    triggerAlert(`E-mail d'activation renvoyé à ${u.email}`, 'success');
    logDirectorAction('Renvoi Email Activation', `E-mail d'activation envoyé à ${u.email}`);
  };

  // --- SETTINGS HANDLER ---
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    triggerAlert('Paramètres de l\'entreprise enregistrés avec succès !', 'success');
    logDirectorAction('Mise à jour Paramètres', 'Modification des paramètres généraux de l\'entreprise.');
  };

  // --- PROFILE HANDLER ---
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser = {
      ...currentUser,
      name: `${profileForm.name} ${profileForm.lastname}`,
      password: profileForm.password,
    };
    setCurrentUser(updatedUser);
    // Sync inside accounts list too
    setAccounts(prev => prev.map(a => a.email === currentUser.email ? { ...a, name: updatedUser.name, password: updatedUser.password } : a));
    triggerAlert('Votre profil a été mis à jour !', 'success');
    logDirectorAction('Mise à jour Profil', 'Le Directeur a mis à jour ses informations de profil.');
  };

  // --- SEARCH AND FILTERS ---
  const q = searchQuery.toLowerCase();
  
  const filteredProducts = products.filter(p => {
    const matchesQuery = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    const matchesStock = 
      stockStatusFilter === 'all' ||
      (stockStatusFilter === 'rupture' && p.stock === 0) ||
      (stockStatusFilter === 'faible' && p.stock > 0 && p.stock <= companySettings.lowStockThreshold) ||
      (stockStatusFilter === 'normal' && p.stock > companySettings.lowStockThreshold);
    return matchesQuery && matchesCategory && matchesStock;
  });

  const filteredTransactions = transactions.filter(t => 
    t.id.toLowerCase().includes(q) || 
    t.asset.toLowerCase().includes(q) || 
    t.category.toLowerCase().includes(q) ||
    t.origin.toLowerCase().includes(q) ||
    t.destination.toLowerCase().includes(q)
  );

  const filteredAccounts = accounts.filter(a => {
    const isTeam = a.role.includes('Gestionnaire') || a.role.includes('Caissier');
    if (!isTeam) return false;
    return a.name.toLowerCase().includes(q) || (a.email && a.email.toLowerCase().includes(q)) || a.role.toLowerCase().includes(q);
  });

  // Export report helper
  const triggerExport = (reportName: string, format: 'PDF' | 'EXCEL' | 'CSV') => {
    triggerAlert(`Exportation du ${reportName} au format ${format} démarrée...`, 'success');
    logDirectorAction('Export de Rapport', `Export du ${reportName} au format ${format}`);
  };

  return (
    <div className="pt-20 px-8 pb-12 w-full animate-fade-in font-sans">
      
      {/* ------------------ TABLEAU DE BORD (SCREEN: director-dashboard) ------------------ */}
      {screen === 'director-dashboard' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-brand-text tracking-tight font-sans">Tableau de bord décisionnel</h2>
            <p className="text-brand-muted text-xs mt-1">Séparation stricte des rôles : consultation globale de SmartStock ERP en temps réel.</p>
          </div>

          {/* KPI CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. CA JOUR */}
            <div 
              onClick={() => setScreen('director-sales')} 
              className="group relative bg-brand-surface p-5 rounded-xl border border-brand-border shadow-xs cursor-pointer hover:border-brand-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-primary to-indigo-600"></div>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-brand-primary/5 group-hover:bg-brand-primary/10 transition-colors pointer-events-none blur-xl"></div>
              <div className="flex justify-between items-start">
                <div className="p-3 bg-brand-primary-light text-brand-primary rounded-xl border border-brand-primary/20 shadow-2xs group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-[22px]">payments</span>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>+12.4%
                </span>
              </div>
              <p className="text-brand-muted text-[10px] uppercase font-bold mt-4 tracking-wider">Chiffre d'Affaires (Jour)</p>
              <h3 className="text-2xl font-black text-brand-text mt-1 tracking-tight">{dailyRevenue.toLocaleString('fr-FR')} <span className="text-sm font-bold text-brand-muted">{companySettings.currency}</span></h3>
              <div className="flex items-center gap-1 text-brand-muted text-[11px] mt-2 font-medium">
                <span className="material-symbols-outlined text-xs">calendar_today</span>
                <span>Aujourd'hui, 2026-07-02</span>
              </div>
            </div>

            {/* 2. CA MOIS */}
            <div 
              onClick={() => setScreen('director-sales')} 
              className="group relative bg-brand-surface p-5 rounded-xl border border-brand-border shadow-xs cursor-pointer hover:border-violet-500/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-600"></div>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-violet-500/5 group-hover:bg-violet-500/10 transition-colors pointer-events-none blur-xl"></div>
              <div className="flex justify-between items-start">
                <div className="p-3 bg-violet-500/10 text-violet-600 rounded-xl border border-violet-500/20 shadow-2xs group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>+8.5%
                </span>
              </div>
              <p className="text-brand-muted text-[10px] uppercase font-bold mt-4 tracking-wider">Chiffre d'Affaires (Mois)</p>
              <h3 className="text-2xl font-black text-brand-text mt-1 tracking-tight">{monthlyRevenue.toLocaleString('fr-FR')} <span className="text-sm font-bold text-brand-muted">{companySettings.currency}</span></h3>
              <div className="flex items-center gap-1 text-brand-muted text-[11px] mt-2 font-medium">
                <span className="material-symbols-outlined text-xs">event_repeat</span>
                <span>Cumulé du mois de juillet</span>
              </div>
            </div>

            {/* 3. VENTES */}
            <div 
              onClick={() => setScreen('director-sales')} 
              className="group relative bg-brand-surface p-5 rounded-xl border border-brand-border shadow-xs cursor-pointer hover:border-sky-500/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-blue-600"></div>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-sky-500/5 group-hover:bg-sky-500/10 transition-colors pointer-events-none blur-xl"></div>
              <div className="flex justify-between items-start">
                <div className="p-3 bg-sky-500/10 text-sky-600 rounded-xl border border-sky-500/20 shadow-2xs group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-[22px]">shopping_cart</span>
                </div>
                <span className="text-[10px] font-extrabold text-sky-700 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">receipt_long</span>Volume
                </span>
              </div>
              <p className="text-brand-muted text-[10px] uppercase font-bold mt-4 tracking-wider font-sans">Nombre de Ventes</p>
              <h3 className="text-2xl font-black text-brand-text mt-1 tracking-tight">{transactions.length} <span className="text-sm font-bold text-brand-muted">Transactions</span></h3>
              <div className="flex items-center gap-1 text-brand-muted text-[11px] mt-2 font-medium">
                <span className="material-symbols-outlined text-xs">storefront</span>
                <span>Toutes entités d'envois</span>
              </div>
            </div>

            {/* 4. VALEUR DU STOCK */}
            <div 
              onClick={() => setScreen('director-stock')} 
              className="group relative bg-brand-surface p-5 rounded-xl border border-brand-border shadow-xs cursor-pointer hover:border-amber-500/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors pointer-events-none blur-xl"></div>
              <div className="flex justify-between items-start">
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-500/20 shadow-2xs group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-[22px]">inventory_2</span>
                </div>
                <span className="text-[10px] font-extrabold text-amber-700 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">verified</span>Actif
                </span>
              </div>
              <p className="text-brand-muted text-[10px] uppercase font-bold mt-4 tracking-wider">Valeur Totale du Stock</p>
              <h3 className="text-2xl font-black text-brand-text mt-1 tracking-tight">{totalStockValue.toLocaleString('fr-FR')} <span className="text-sm font-bold text-brand-muted">{companySettings.currency}</span></h3>
              <div className="flex items-center gap-1 text-brand-muted text-[11px] mt-2 font-medium">
                <span className="material-symbols-outlined text-xs">sell</span>
                <span>Valorisation au prix catalogue</span>
              </div>
            </div>

            {/* 5. NOMBRE DE PRODUITS */}
            <div 
              onClick={() => setScreen('director-products')} 
              className="group relative bg-brand-surface p-5 rounded-xl border border-brand-border shadow-xs cursor-pointer hover:border-emerald-500/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-600"></div>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors pointer-events-none blur-xl"></div>
              <div className="flex justify-between items-start">
                <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/20 shadow-2xs group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-[22px]">category</span>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">apps</span>Catalogue
                </span>
              </div>
              <p className="text-brand-muted text-[10px] uppercase font-bold mt-4 tracking-wider">Nombre de Produits</p>
              <h3 className="text-2xl font-black text-brand-text mt-1 tracking-tight">{products.length} <span className="text-sm font-bold text-brand-muted">Articles</span></h3>
              <div className="flex items-center gap-1 text-brand-muted text-[11px] mt-2 font-medium">
                <span className="material-symbols-outlined text-xs">list_alt</span>
                <span>Enregistrés au catalogue</span>
              </div>
            </div>

            {/* 6. PRODUITS EN RUPTURE */}
            <div 
              onClick={() => { setStockStatusFilter('rupture'); setScreen('director-stock'); }} 
              className="group relative bg-brand-surface p-5 rounded-xl border border-brand-border shadow-xs cursor-pointer hover:border-rose-500/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-600"></div>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-rose-500/5 group-hover:bg-rose-500/10 transition-colors pointer-events-none blur-xl"></div>
              <div className="flex justify-between items-start">
                <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl border border-rose-500/20 shadow-2xs group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-[22px]">error</span>
                </div>
                <span className="text-[10px] font-extrabold text-rose-700 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">warning</span>Alerte
                </span>
              </div>
              <p className="text-brand-muted text-[10px] uppercase font-bold mt-4 tracking-wider">Produits en Rupture</p>
              <h3 className={`text-2xl font-black mt-1 tracking-tight ${outOfStockProducts.length > 0 ? 'text-rose-600 animate-pulse' : 'text-brand-text'}`}>{outOfStockProducts.length} <span className="text-sm font-bold text-brand-muted">Réf</span></h3>
              <div className="flex items-center gap-1 text-brand-muted text-[11px] mt-2 font-medium">
                <span className="material-symbols-outlined text-xs">remove_shopping_cart</span>
                <span>Ruptures d'approvisionnement</span>
              </div>
            </div>

            {/* 7. PRODUITS STOCK FAIBLE */}
            <div 
              onClick={() => { setStockStatusFilter('faible'); setScreen('director-stock'); }} 
              className="group relative bg-brand-surface p-5 rounded-xl border border-brand-border shadow-xs cursor-pointer hover:border-amber-500/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors pointer-events-none blur-xl"></div>
              <div className="flex justify-between items-start">
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-500/20 shadow-2xs group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-[22px]">warning</span>
                </div>
                <span className="text-[10px] font-extrabold text-amber-700 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">readiness_score</span>Seuil
                </span>
              </div>
              <p className="text-brand-muted text-[10px] uppercase font-bold mt-4 tracking-wider">Produits Stock Faible</p>
              <h3 className="text-2xl font-black text-brand-text mt-1 tracking-tight">{lowStockProducts.length} <span className="text-sm font-bold text-brand-muted">Réf</span></h3>
              <div className="flex items-center gap-1 text-brand-muted text-[11px] mt-2 font-medium">
                <span className="material-symbols-outlined text-xs">low_priority</span>
                <span>Sous le seuil d'alerte ({companySettings.lowStockThreshold})</span>
              </div>
            </div>

            {/* 8. PERSONNEL RESPONSABLE */}
            <div 
              onClick={() => setScreen('director-users')} 
              className="group relative bg-brand-surface p-5 rounded-xl border border-brand-border shadow-xs cursor-pointer hover:border-teal-500/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-emerald-600"></div>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-teal-500/5 group-hover:bg-teal-500/10 transition-colors pointer-events-none blur-xl"></div>
              <div className="flex justify-between items-start">
                <div className="p-3 bg-teal-500/10 text-teal-600 rounded-xl border border-teal-500/20 shadow-2xs group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-[22px]">group</span>
                </div>
                <span className="text-[10px] font-extrabold text-teal-700 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">badge</span>Actifs
                </span>
              </div>
              <p className="text-brand-muted text-[10px] uppercase font-bold mt-4 tracking-wider">Personnel Responsable</p>
              <h3 className="text-2xl font-black text-brand-text mt-1 tracking-tight">{activeStockManagers + activeCashiers} <span className="text-sm font-bold text-brand-muted">Actifs</span></h3>
              <div className="flex items-center gap-1 text-brand-muted text-[11px] mt-2 font-medium">
                <span className="material-symbols-outlined text-xs">manage_accounts</span>
                <span>{activeStockManagers} Stock • {activeCashiers} Caisses</span>
              </div>
            </div>
          </div>

          {/* MAIN GRAPHICS & ALERTS CONTAINER */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* GRAPHS */}
            <div className="relative lg:col-span-2 bg-brand-surface p-6 pt-10 rounded-xl border border-brand-border shadow-xs space-y-6">
              <div className="absolute -top-5 left-6 right-6 p-4 card-header-gradient-primary text-white rounded-xl shadow-md glow-shadow-primary flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm">Évolution de l'Activité Commerciale</h4>
                  <p className="text-[11px] opacity-80">Comparatif des flux de ventes quotidiennes</p>
                </div>
                <button onClick={() => setScreen('director-analytics')} className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer">
                  Analyses BI
                </button>
              </div>

              {/* SIMULATED BAR CHART */}
              <div className="h-64 flex items-end justify-between gap-3 pb-2 border-b border-brand-border pt-4">
                {[
                  { day: 'Lun', sales: '40%', rev: '30%' },
                  { day: 'Mar', sales: '60%', rev: '50%' },
                  { day: 'Mer', sales: '80%', rev: '75%' },
                  { day: 'Jeu', sales: '55%', rev: '60%' },
                  { day: 'Ven', sales: '90%', rev: '95%' },
                  { day: 'Sam', sales: '45%', rev: '40%' },
                  { day: 'Dim', sales: '30%', rev: '25%' },
                ].map((bar, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-full max-w-[45px] flex items-end gap-1.5 h-44 relative">
                      <div className="flex-1 bg-brand-primary-light rounded-t-xs transition-all duration-500" style={{ height: bar.sales }} title={`Volume ventes: ${bar.sales}`}></div>
                      <div className="flex-1 bg-brand-primary rounded-t-xs transition-all duration-500 group-hover:brightness-110 shadow-xs" style={{ height: bar.rev }} title={`Revenus générés: ${bar.rev}`}></div>
                    </div>
                    <span className="text-[11px] text-brand-muted font-semibold">{bar.day}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-6 justify-center text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-primary-light"></span> Transactions</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-primary"></span> Chiffre d'affaires ({companySettings.currency})</span>
              </div>
            </div>

            {/* ALERTS CENTER */}
            <div className="relative bg-brand-surface p-6 pt-10 rounded-xl border border-brand-border shadow-xs flex flex-col h-full">
              <div className="absolute -top-5 left-6 right-6 p-4 card-header-warning text-white rounded-xl shadow-md glow-shadow-warning flex justify-between items-center">
                <h4 className="font-bold text-sm">Centre d'Alertes</h4>
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-white/20 text-white rounded-full">{systemAlerts.length} Messages</span>
              </div>
              
              <div className="flex-1 overflow-y-auto py-4 space-y-3 max-h-[280px] custom-scrollbar pt-4">
                {systemAlerts.map((alt, idx) => (
                  <div key={idx} 
                    onClick={() => {
                      if (alt.type === 'rupture' || alt.type === 'faible') {
                        setStockStatusFilter(alt.type);
                        setScreen('director-stock');
                      } else if (alt.type === 'user') {
                        setScreen('director-users');
                      } else if (alt.target) {
                        setScreen(alt.target as any);
                      }
                    }}
                    className="flex items-start gap-3 p-3 rounded-xl border border-brand-border bg-brand-surface-container-low hover:border-rose-200 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-rose-500 mt-0.5">
                      {alt.type === 'rupture' ? 'cancel' : alt.type === 'faible' ? 'warning' : alt.type === 'user' ? 'person_off' : 'info'}
                    </span>
                    <p className="text-xs text-brand-text font-medium leading-normal">{alt.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RECENT ACTIVITIES & QUICK ACTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* RECENT ACTIVITIES */}
            <div className="relative lg:col-span-2 bg-brand-surface p-6 pt-10 rounded-xl border border-brand-border shadow-xs space-y-6">
              <div className="absolute -top-5 left-6 right-6 p-4 card-header-gradient-secondary text-white rounded-xl shadow-md glow-shadow-secondary">
                <h4 className="font-bold text-sm">Activités Récentes</h4>
              </div>
              
              <div className="divide-y divide-brand-border max-h-[300px] overflow-y-auto custom-scrollbar pr-2 pt-2">
                <div className="py-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-text">Vente effectuée - Ticket #99018</p>
                      <p className="text-[10px] text-brand-muted">Par Caissier : Alex Admin • SmartHub 2.0 (Lot 5)</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-brand-muted">Aujourd'hui 15h32</span>
                </div>

                <div className="py-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-text">Réception stock validé - ARR-01</p>
                      <p className="text-[10px] text-brand-muted">Fournisseur : Global Tech Dist. • +450 Unités</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-brand-muted">Aujourd'hui 11h15</span>
                </div>

                <div className="py-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-text">Inventaire mensuel électronique validé</p>
                      <p className="text-[10px] text-brand-muted">Par Gestionnaire de stock : Robert King • 1 anomalie</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-brand-muted">Hier 18h00</span>
                </div>

                <div className="py-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">login</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-text">Connexion utilisateur de l'équipe</p>
                      <p className="text-[10px] text-brand-muted">Robert King (Gestionnaire de stock) s'est connecté</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-brand-muted">Hier 08h30</span>
                </div>
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="relative bg-brand-surface p-6 pt-10 rounded-xl border border-brand-border shadow-xs flex flex-col justify-between">
              <div className="absolute -top-5 left-6 right-6 p-4 card-header-info text-white rounded-xl shadow-md glow-shadow-info">
                <h4 className="font-bold text-sm">Actions Rapides</h4>
              </div>
              
              <div className="space-y-3 flex-1 flex flex-col justify-center pt-4">
                <button 
                  onClick={() => { handleOpenUserModal(); setUserForm(prev => ({ ...prev, role: 'Gestionnaire de stock' })); }}
                  className="w-full flex items-center justify-between p-3.5 bg-brand-surface-container-low hover:bg-brand-primary-light/50 border border-brand-border rounded-xl text-left text-xs font-bold text-brand-text transition-all cursor-pointer"
                >
                  <span>Créer un Gestionnaire de Stock</span>
                  <span className="material-symbols-outlined text-sm text-brand-primary">person_add</span>
                </button>

                <button 
                  onClick={() => { handleOpenUserModal(); setUserForm(prev => ({ ...prev, role: 'Caissier' })); }}
                  className="w-full flex items-center justify-between p-3.5 bg-brand-surface-container-low hover:bg-brand-primary-light/50 border border-brand-border rounded-xl text-left text-xs font-bold text-brand-text transition-all cursor-pointer"
                >
                  <span>Créer un Caissier</span>
                  <span className="material-symbols-outlined text-sm text-brand-primary">person_add</span>
                </button>

                <button 
                  onClick={() => setScreen('director-reports')}
                  className="w-full flex items-center justify-between p-3.5 bg-brand-surface-container-low hover:bg-brand-primary-light/50 border border-brand-border rounded-xl text-left text-xs font-bold text-brand-text transition-all cursor-pointer"
                >
                  <span>Consulter les Rapports ERP</span>
                  <span className="material-symbols-outlined text-sm text-brand-primary">analytics</span>
                </button>

                <button 
                  onClick={() => triggerExport('Rapport Statistiques BI', 'EXCEL')}
                  className="w-full flex items-center justify-between p-3.5 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-200 rounded-xl text-left text-xs font-bold text-emerald-800 transition-all cursor-pointer"
                >
                  <span>Exporter les Statistiques</span>
                  <span className="material-symbols-outlined text-sm text-emerald-600">download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ ANALYSE FINANCIÈRE (SCREEN: director-finance) ------------------ */}
      {screen === 'director-finance' && (
        <DirectorFinance
          products={products}
          transactions={transactions}
          accounts={accounts}
          triggerAlert={triggerAlert}
        />
      )}

      {/* ------------------ UTILISATEURS (SCREEN: director-users) ------------------ */}
      {screen === 'director-users' && (
        <div className="space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold text-brand-text tracking-tight font-sans">Gestion de l'Équipe ERP</h2>
              <p className="text-brand-muted text-xs mt-1">Gérez les comptes des Gestionnaires de Stock et Caissiers rattachés à votre autorité.</p>
            </div>
            <button 
              onClick={() => handleOpenUserModal()}
              className="px-4 py-2.5 bg-brand-primary text-white rounded-xl text-xs font-bold shadow-xs hover:bg-brand-primary-hover transition-all flex items-center gap-1.5 cursor-pointer glow-shadow-primary"
            >
              <span className="material-symbols-outlined text-sm">add</span> Nouveau Collaborateur
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* USERS LIST TABLE */}
            <div className="relative lg:col-span-2 bg-brand-surface p-6 pt-10 rounded-xl border border-brand-border shadow-xs overflow-hidden">
              <div className="absolute -top-5 left-6 right-6 p-4 card-header-gradient-primary text-white rounded-xl shadow-md glow-shadow-primary flex justify-between items-center">
                <span className="font-bold text-sm">Équipe Active ({filteredAccounts.length})</span>
                <span className="text-xs opacity-80">Contrôle des habilitations</span>
              </div>

              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-brand-surface-container-low text-brand-muted text-[10px] uppercase font-bold border-b border-brand-border">
                    <tr>
                      <th className="px-4 py-3">Nom / E-mail</th>
                      <th className="px-4 py-3">Rôle Métier</th>
                      <th className="px-4 py-3">Statut Compte</th>
                      <th className="px-4 py-3 text-right">Actions de Contrôle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {filteredAccounts.length > 0 ? (
                      filteredAccounts.map((u, idx) => {
                        const associatedDir = directors.find(d => d.email === u.email);
                        const isSuspended = associatedDir?.status === 'Suspendu';
                        return (
                          <tr key={idx} className="hover:bg-brand-surface-container-low/60 transition-colors">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <img src={u.avatar} className="w-8 h-8 rounded-full border border-brand-border object-cover" alt="" />
                                <div>
                                  <p className="font-bold text-xs text-brand-text">{u.name}</p>
                                  <p className="text-[11px] text-brand-muted">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${u.role.includes('Gestionnaire') ? 'bg-sky-50 text-sky-700' : 'bg-violet-50 text-violet-700'}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isSuspended ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {isSuspended ? 'Désactivé' : 'Actif'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right space-x-1">
                              <button 
                                onClick={() => handleOpenUserModal(u)}
                                className="p-1 text-brand-muted hover:text-brand-primary hover:bg-brand-primary-light/50 rounded-lg transition-all" 
                                title="Modifier"
                              >
                                <span className="material-symbols-outlined text-sm">edit</span>
                              </button>
                              <button 
                                onClick={() => toggleUserStatus(u)}
                                className={`p-1 rounded-lg transition-all ${isSuspended ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-500 hover:bg-red-50'}`} 
                                title={isSuspended ? 'Réactiver le compte' : 'Désactiver le compte'}
                              >
                                <span className="material-symbols-outlined text-sm">{isSuspended ? 'check_circle' : 'block'}</span>
                              </button>
                              <button 
                                onClick={() => handleResetPassword(u)}
                                className="p-1 text-brand-muted hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" 
                                title="Réinitialiser le mot de passe"
                              >
                                <span className="material-symbols-outlined text-sm">lock_reset</span>
                              </button>
                              <button 
                                onClick={() => handleResendActivation(u)}
                                className="p-1 text-brand-muted hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all" 
                                title="Renvoyer l'email d'activation"
                              >
                                <span className="material-symbols-outlined text-sm">mail</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-xs text-brand-muted">Aucun collaborateur trouvé</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AUDIT ACTIONS LOG (READ-ONLY) */}
            <div className="relative bg-brand-surface p-6 pt-10 rounded-xl border border-brand-border shadow-xs overflow-hidden flex flex-col h-[420px]">
              <div className="absolute -top-5 left-6 right-6 p-4 card-header-gradient-secondary text-white rounded-xl shadow-md glow-shadow-secondary">
                <span className="font-bold text-sm">Journal des Activités (Lecture seule)</span>
              </div>
              <div className="flex-1 overflow-y-auto pt-4 space-y-4 custom-scrollbar">
                {logs.filter(l => l.title.includes('Vente') || l.title.includes('Stock') || l.title.includes('Compte') || l.title.includes('Email') || l.title.includes('MDP')).map((l, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="mt-1">
                      <span className={`w-2 h-2 rounded-full block ${l.type === 'error' ? 'bg-rose-500' : l.type === 'success' ? 'bg-emerald-500' : 'bg-brand-primary'}`}></span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-text">{l.title}</p>
                      <p className="text-[11px] text-brand-muted mt-0.5 leading-normal">{l.description}</p>
                      <span className="text-[9px] text-brand-muted font-mono block mt-1">{l.timestamp} • {l.code}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ CATALOGUE PRODUITS (SCREEN: director-products) ------------------ */}
      {screen === 'director-products' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-brand-text tracking-tight font-sans">Catalogue des Produits (Consultation)</h2>
            <p className="text-brand-muted text-xs mt-1">Accès en lecture seule. Vous pouvez filtrer, rechercher et consulter l'historique d'un produit.</p>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2 border border-brand-border rounded-xl text-xs font-sans bg-brand-surface text-brand-text focus:outline-none"
            >
              <option value="">Toutes les catégories</option>
              <option value="Électronique">Électronique</option>
              <option value="Automobile">Automobile</option>
              <option value="Fabrication">Fabrication</option>
              <option value="Logistique">Logistique</option>
              <option value="Accessoires">Accessoires</option>
              <option value="Chaussures">Chaussures</option>
              <option value="Voyage">Voyage</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* PRODUCTS LIST */}
            <div className="relative lg:col-span-2 bg-brand-surface p-6 pt-10 rounded-xl border border-brand-border shadow-xs overflow-hidden">
              <div className="absolute -top-5 left-6 right-6 p-4 card-header-gradient-primary text-white rounded-xl shadow-md glow-shadow-primary flex justify-between items-center">
                <span className="font-bold text-sm">Catalogue ({filteredProducts.length})</span>
                <span className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-bold">Lecture Seule</span>
              </div>

              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-brand-surface-container-low text-brand-muted text-[10px] uppercase font-bold border-b border-brand-border">
                    <tr>
                      <th className="px-4 py-3">Produit</th>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3">Catégorie</th>
                      <th className="px-4 py-3">Prix de Vente</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {filteredProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-brand-surface-container-low/60 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <img src={p.image} className="w-9 h-9 rounded-lg border border-brand-border object-cover" alt="" />
                            <p className="font-bold text-xs text-brand-text">{p.name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-mono font-bold text-brand-muted">{p.sku}</td>
                        <td className="px-4 py-3.5 text-xs font-medium text-brand-muted">{p.category}</td>
                        <td className="px-4 py-3.5 text-xs font-bold text-brand-text">{p.price.toLocaleString('fr-FR')} {companySettings.currency}</td>
                        <td className="px-4 py-3.5 text-right">
                          <button 
                            onClick={() => setSelectedProduct(p)}
                            className="px-3 py-1.5 bg-brand-primary-light text-brand-primary hover:bg-brand-primary hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Consulter Fiche
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DETAILED PRODUCT SHEET */}
            <div className="relative bg-brand-surface p-6 pt-10 rounded-xl border border-brand-border shadow-xs h-fit space-y-6">
              <div className="absolute -top-5 left-6 right-6 p-4 card-header-gradient-secondary text-white rounded-xl shadow-md glow-shadow-secondary flex justify-between items-center">
                <h4 className="font-bold text-sm">Fiche Produit Détaillée</h4>
                {selectedProduct && (
                  <button onClick={() => setSelectedProduct(null)} className="text-white/80 hover:text-white">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </div>

              <div className="pt-2 space-y-6">
                {selectedProduct ? (
                  <div className="space-y-6">
                    <img src={selectedProduct.image} className="w-full h-40 object-cover rounded-xl border border-brand-border" alt="" />
                    
                    <div>
                      <h3 className="text-base font-bold text-brand-text leading-tight">{selectedProduct.name}</h3>
                      <p className="text-xs font-mono font-bold text-brand-muted mt-1">SKU: {selectedProduct.sku}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs border-y border-brand-border py-4">
                      <div>
                        <p className="text-brand-muted font-semibold uppercase text-[9px] tracking-wider">Catégorie</p>
                        <p className="font-bold text-brand-text mt-0.5">{selectedProduct.category}</p>
                      </div>
                      <div>
                        <p className="text-brand-muted font-semibold uppercase text-[9px] tracking-wider">Prix de Vente</p>
                        <p className="font-bold text-brand-primary mt-0.5">{selectedProduct.price.toLocaleString('fr-FR')} {companySettings.currency}</p>
                      </div>
                      <div>
                        <p className="text-brand-muted font-semibold uppercase text-[9px] tracking-wider">Stock Actuel</p>
                        <p className={`font-bold mt-0.5 ${selectedProduct.stock === 0 ? 'text-rose-600' : 'text-brand-text'}`}>{selectedProduct.stock} Unités</p>
                      </div>
                      <div>
                        <p className="text-brand-muted font-semibold uppercase text-[9px] tracking-wider">Rotation</p>
                        <p className="font-bold text-teal-600 mt-0.5">{selectedProduct.velocity || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Historique de Performance</p>
                      <p className="text-xs text-brand-muted leading-relaxed bg-brand-surface-container-low p-3 rounded-xl border border-brand-border">
                        Ce produit enregistre un volume de vente estimé à {selectedProduct.salesVolume || selectedProduct.stock + 120} unités ce mois-ci. Tendance : {selectedProduct.trend || 'Haute'}.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-brand-muted flex flex-col items-center justify-center gap-3">
                    <span className="material-symbols-outlined text-4xl text-brand-muted">find_in_page</span>
                    <span>Sélectionnez un produit pour afficher sa fiche technique et l'historique complet des flux.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ ÉTAT STOCKS (SCREEN: director-stock) ------------------ */}
      {screen === 'director-stock' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-brand-text tracking-tight">Supervision des Stocks (Lecture seule)</h2>
            <p className="text-brand-muted text-xs mt-1">Consultation en temps réel des quantités, mouvements d'arrivées et des rapports d'audits d'inventaires.</p>
          </div>

          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button 
                onClick={() => setStockStatusFilter('all')} 
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${stockStatusFilter === 'all' ? 'bg-brand-primary text-white shadow-xs' : 'bg-brand-surface-container text-brand-muted hover:bg-brand-surface-container-high'}`}
              >
                Tous les stocks
              </button>
              <button 
                onClick={() => setStockStatusFilter('rupture')} 
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${stockStatusFilter === 'rupture' ? 'bg-rose-600 text-white animate-pulse' : 'bg-brand-surface-container text-brand-muted hover:bg-brand-surface-container-high'}`}
              >
                Ruptures ({outOfStockProducts.length})
              </button>
              <button 
                onClick={() => setStockStatusFilter('faible')} 
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${stockStatusFilter === 'faible' ? 'bg-amber-600 text-white' : 'bg-brand-surface-container text-brand-muted hover:bg-brand-surface-container-high'}`}
              >
                Stock faible ({lowStockProducts.length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
            {/* STOCKS TABLE */}
            <div className="lg:col-span-2 relative bg-brand-surface rounded-xl border border-brand-border shadow-xs pt-10">
              <div className="absolute -top-5 left-6 right-6 p-4 card-header-gradient-primary text-white rounded-xl shadow-md glow-shadow-primary flex justify-between items-center">
                <span className="font-bold text-sm">État du stock ({filteredProducts.length} articles)</span>
                <span className="text-[10px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full">Vision globale</span>
              </div>

              <div className="overflow-x-auto pt-4">
                <table className="w-full text-left">
                  <thead className="bg-brand-surface-container-low text-brand-muted text-[10px] uppercase font-bold border-b border-brand-border">
                    <tr>
                      <th className="px-6 py-3">Produit</th>
                      <th className="px-6 py-3">SKU</th>
                      <th className="px-6 py-3">Quantité en Stock</th>
                      <th className="px-6 py-3">Seuil critique</th>
                      <th className="px-6 py-3 text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {filteredProducts.map((p, idx) => {
                      const isRupture = p.stock === 0;
                      const isLow = p.stock > 0 && p.stock <= companySettings.lowStockThreshold;
                      return (
                        <tr key={idx} className="hover:bg-brand-surface-container-low transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-sm text-brand-text leading-tight">{p.name}</p>
                            <p className="text-[11px] text-brand-muted font-medium">{p.category}</p>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-brand-muted font-bold">{p.sku}</td>
                          <td className="px-6 py-4">
                            <span className={`text-xs font-bold ${isRupture ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-brand-text'}`}>{p.stock} unités</span>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-brand-muted">{companySettings.lowStockThreshold} unités</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isRupture ? 'bg-rose-50 text-rose-600' : isLow ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {isRupture ? 'Rupture' : isLow ? 'Faible' : 'Sûr'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RECENT STOCK MOVEMENTS & INVENTORY REPORTS */}
            <div className="space-y-8 pt-4">
              {/* ARRIVALS */}
              <div className="relative bg-brand-surface p-6 pt-10 rounded-xl border border-brand-border shadow-xs space-y-4">
                <div className="absolute -top-5 left-6 right-6 p-4 card-header-info text-white rounded-xl shadow-md glow-shadow-info">
                  <h4 className="font-bold text-sm">Derniers Arrivages Reçus</h4>
                </div>
                <div className="space-y-3 max-h-[180px] overflow-y-auto custom-scrollbar pt-2">
                  {arrivals.map((arr, idx) => (
                    <div key={idx} className="p-3 bg-brand-surface-container-low border border-brand-border rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-brand-text">Code: {arr.sku}</p>
                        <p className="text-[10px] text-brand-muted">Fournisseur: {arr.supplier}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-emerald-600 block">{arr.quantity}</span>
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[9px] tracking-wide">{arr.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AUDITS REPORT LIST */}
              <div className="relative bg-brand-surface p-6 pt-10 rounded-xl border border-brand-border shadow-xs space-y-4">
                <div className="absolute -top-5 left-6 right-6 p-4 card-header-warning text-white rounded-xl shadow-md glow-shadow-warning">
                  <h4 className="font-bold text-sm">Rapports d'Inventaires validés</h4>
                </div>
                <div className="space-y-2 pt-2">
                  {inventories.map((inv, idx) => (
                    <div key={idx} onClick={() => setSelectedInventory(inv)} className="p-3 rounded-xl border border-brand-border hover:bg-brand-primary-light cursor-pointer transition-all text-xs flex justify-between items-center bg-brand-surface-container-low">
                      <div>
                        <p className="font-bold text-brand-text leading-tight">{inv.title}</p>
                        <p className="text-[10px] text-brand-muted mt-0.5">Le {inv.date} par {inv.manager}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${inv.discrepanciesCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {inv.discrepanciesCount > 0 ? `${inv.discrepanciesCount} Anomalie` : 'Conforme'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* INVENTORY REPORT DETAIL MODAL */}
          {selectedInventory && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-brand-surface rounded-xl w-full max-w-lg p-6 shadow-2xl relative border border-brand-border">
                <button onClick={() => setSelectedInventory(null)} className="absolute top-4 right-4 text-brand-muted hover:text-brand-text"><span className="material-symbols-outlined">close</span></button>
                <h3 className="text-lg font-bold text-brand-text mb-1">{selectedInventory.title}</h3>
                <p className="text-xs text-brand-muted mb-6">Validé le {selectedInventory.date} • Responsable audit: {selectedInventory.manager}</p>

                <div className="border border-brand-border rounded-xl overflow-hidden mb-6 text-xs">
                  <div className="grid grid-cols-4 bg-brand-surface-container-low font-bold p-3 text-brand-muted">
                    <span>Produit</span>
                    <span className="text-center">Théorique</span>
                    <span className="text-center">Physique</span>
                    <span className="text-right">Écart</span>
                  </div>
                  <div className="divide-y divide-brand-border">
                    {selectedInventory.items.map((item: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-4 p-3 items-center">
                        <div>
                          <p className="font-bold text-brand-text truncate">{item.name}</p>
                          <p className="text-[9px] text-brand-muted font-mono">{item.sku}</p>
                        </div>
                        <span className="text-center text-brand-text">{item.expected}</span>
                        <span className="text-center text-brand-text">{item.measured}</span>
                        <span className={`text-right font-extrabold ${item.diff < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{item.diff === 0 ? '-' : item.diff}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-brand-surface-container-low p-3.5 rounded-xl text-xs leading-normal text-brand-text border border-brand-border">
                  <p className="font-bold text-brand-text">Observation décisionnelle :</p>
                  <p className="mt-1 text-brand-muted">{selectedInventory.discrepanciesCount > 0 ? "Des écarts de stocks ont été identifiés dans les Électroniques de la Zone B. L'anomalie a été affectée au stock de sécurité." : "Aucune anomalie à déclarer. L'inventaire physique concorde parfaitement avec la base ERP."}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------ VENTES & FACTURES (SCREEN: director-sales) ------------------ */}
      {screen === 'director-sales' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-brand-text tracking-tight font-sans">Suivi des Ventes (Lecture seule)</h2>
            <p className="text-brand-muted text-xs mt-1">Consultez l'historique complet des transactions point de vente et les détails des tickets caisse émis.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
            {/* TRANSACTION HISTORY */}
            <div className="lg:col-span-2 relative bg-brand-surface rounded-xl border border-brand-border shadow-xs pt-10">
              <div className="absolute -top-5 left-6 right-6 p-4 card-header-gradient-primary text-white rounded-xl shadow-md glow-shadow-primary flex justify-between items-center">
                <span className="font-bold text-sm">Tickets émis ({filteredTransactions.length})</span>
                <span className="text-[10px] text-white font-bold bg-white/20 px-2.5 py-0.5 rounded-full">Lecture seule</span>
              </div>

              <div className="overflow-x-auto pt-4">
                <table className="w-full text-left">
                  <thead className="bg-brand-surface-container-low text-brand-muted text-[10px] uppercase font-bold border-b border-brand-border">
                    <tr>
                      <th className="px-6 py-3">ID Transaction</th>
                      <th className="px-6 py-3">Libellé</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Montant</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {filteredTransactions.map((t, idx) => (
                      <tr key={idx} className="hover:bg-brand-surface-container-low transition-colors">
                        <td className="px-6 py-4 text-xs font-mono font-bold text-brand-muted">{t.id}</td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-sm text-brand-text leading-tight">{t.asset}</p>
                          <p className="text-[10px] text-brand-muted mt-0.5">{t.category}</p>
                        </td>
                        <td className="px-6 py-4 text-xs text-brand-muted font-semibold">{t.date}</td>
                        <td className="px-6 py-4 text-xs font-bold text-brand-text">{t.value.toLocaleString('fr-FR')} {companySettings.currency}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setSelectedTransaction(t)}
                            className="px-3 py-1.5 bg-brand-primary-light hover:bg-brand-primary/20 text-brand-primary rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Détails Ticket
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PERFORMANCE CAISSIERS */}
            <div className="relative bg-brand-surface p-6 pt-10 rounded-xl border border-brand-border shadow-xs h-fit space-y-4 pt-4">
              <div className="absolute -top-5 left-6 right-6 p-4 card-header-gradient-secondary text-white rounded-xl shadow-md glow-shadow-secondary">
                <h4 className="font-bold text-sm">Performances des Caissiers</h4>
              </div>
              
              <div className="space-y-3 pt-4">
                {cashiers.map((c, idx) => {
                  const totalSum = transactions.filter(t => t.id).reduce((acc, t) => acc + (t.value / 3), 0); // simulated ratio
                  return (
                    <div key={idx} className="p-3 bg-brand-surface-container-low rounded-xl border border-brand-border flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <img src={c.avatar} className="w-8 h-8 rounded-full border border-brand-border" alt="" />
                        <div>
                          <p className="font-bold text-brand-text">{c.name}</p>
                          <p className="text-[10px] text-brand-muted">Succursale principale</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-brand-primary">{totalSum.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {companySettings.currency}</p>
                        <p className="text-[10px] text-brand-muted font-semibold">Activité : 96%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* DETAILED RECEIPT / TICKET MODAL */}
          {selectedTransaction && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-brand-surface rounded-xl w-full max-w-sm p-6 shadow-2xl relative font-sans border border-brand-border">
                <button onClick={() => setSelectedTransaction(null)} className="absolute top-4 right-4 text-brand-muted hover:text-brand-text"><span className="material-symbols-outlined">close</span></button>
                
                {/* Simulated Digital Invoice Ticket */}
                <div className="text-center pb-6 border-b border-dashed border-brand-border">
                  <h3 className="text-base font-bold text-brand-text">{companySettings.name}</h3>
                  <p className="text-[11px] text-brand-muted mt-1">{companySettings.address}</p>
                  <p className="text-[11px] text-brand-muted">{companySettings.phone}</p>
                </div>

                <div className="py-4 space-y-1 text-xs text-brand-muted border-b border-brand-border">
                  <p className="flex justify-between"><span>Date / Heure :</span> <span className="font-bold text-brand-text">{selectedTransaction.date} • 14:35</span></p>
                  <p className="flex justify-between"><span>N° Ticket :</span> <span className="font-mono font-bold text-brand-text">{selectedTransaction.id}</span></p>
                  <p className="flex justify-between"><span>Caissier :</span> <span className="font-bold text-brand-text">Alex Admin</span></p>
                </div>

                <div className="py-4 border-b border-brand-border text-xs">
                  <p className="font-bold text-brand-text mb-2">Détails des articles</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-brand-text font-medium">{selectedTransaction.asset} x 1</span>
                      <span className="font-bold text-brand-text">{selectedTransaction.value.toLocaleString('fr-FR')} F CFA</span>
                    </div>
                  </div>
                </div>

                <div className="py-4 space-y-1.5 text-xs text-brand-muted">
                  <p className="flex justify-between"><span>Sous-total HT :</span> <span className="font-bold text-brand-text">{(selectedTransaction.value * 0.82).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F CFA</span></p>
                  <p className="flex justify-between"><span>TVA (18%) :</span> <span className="font-bold text-brand-text">{(selectedTransaction.value * 0.18).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F CFA</span></p>
                  <p className="flex justify-between text-base font-bold text-brand-text pt-2 border-t border-dashed border-brand-border"><span>Montant Total :</span> <span>{selectedTransaction.value.toLocaleString('fr-FR')} F CFA</span></p>
                </div>

                <div className="bg-brand-surface-container-low p-3 rounded-lg text-center text-[11px] text-brand-muted font-medium border border-brand-border">
                  Mode de règlement : Mobile Money (Wave)<br />
                  Merci de votre confiance !
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------ ANALYSES / DÉCISION BI (SCREEN: director-analytics) ------------------ */}
      {screen === 'director-analytics' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-brand-text tracking-tight font-sans">Analyses BI & Performance</h2>
            <p className="text-brand-muted text-xs mt-1">Visualisez l'état analytique de vos revenus d'activité, votre valorisation de stocks et tendances de rotation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            {/* PRODUCT CATEGORIES BREAKDOWN */}
            <div className="relative bg-brand-surface p-6 pt-10 rounded-xl border border-brand-border shadow-xs space-y-6">
              <div className="absolute -top-5 left-6 right-6 p-4 card-header-gradient-primary text-white rounded-xl shadow-md glow-shadow-primary">
                <h4 className="font-bold text-sm">Répartition des Produits par Catégorie</h4>
              </div>
              <div className="space-y-4 pt-4">
                {[
                  { name: 'Électronique', count: 3, percentage: '30%' },
                  { name: 'Automobile', count: 1, percentage: '10%' },
                  { name: 'Accessoires', count: 2, percentage: '20%' },
                  { name: 'Chaussures', count: 1, percentage: '10%' },
                  { name: 'Voyage', count: 1, percentage: '10%' },
                  { name: 'Fabrication', count: 1, percentage: '10%' },
                  { name: 'Logistique', count: 1, percentage: '10%' },
                ].map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs text-brand-text font-semibold">
                      <span>{cat.name} ({cat.count} articles)</span>
                      <span className="text-brand-primary">{cat.percentage}</span>
                    </div>
                    <div className="w-full bg-brand-surface-container h-2 rounded-full overflow-hidden">
                      <div className="bg-brand-primary h-full rounded-full transition-all" style={{ width: cat.percentage }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PAYMENT METHODS REPARTITION */}
            <div className="relative bg-brand-surface p-6 pt-10 rounded-xl border border-brand-border shadow-xs space-y-6">
              <div className="absolute -top-5 left-6 right-6 p-4 card-header-gradient-secondary text-white rounded-xl shadow-md glow-shadow-secondary">
                <h4 className="font-bold text-sm">Répartition par Modes de Paiement</h4>
              </div>
              <div className="space-y-4 pt-4">
                {[
                  { mode: 'Wave Mobile Money', vol: '45.400.000 F CFA', ratio: '53%' },
                  { mode: 'Espèces (Cash)', vol: '25.600.000 F CFA', ratio: '30%' },
                  { mode: 'Carte Bancaire', vol: '14.500.000 F CFA', ratio: '17%' },
                ].map((pay, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs text-brand-text font-semibold">
                      <span>{pay.mode}</span>
                      <span className="text-emerald-600">{pay.ratio} ({pay.vol})</span>
                    </div>
                    <div className="w-full bg-brand-surface-container h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: pay.ratio }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MOST SOLD VS LEAST SOLD */}
            <div className="relative bg-brand-surface p-6 pt-10 rounded-xl border border-brand-border shadow-xs space-y-4">
              <div className="absolute -top-5 left-6 right-6 p-4 card-header-success text-white rounded-xl shadow-md glow-shadow-success">
                <h4 className="font-bold text-sm">Produits les Plus Vendus</h4>
              </div>
              <div className="divide-y divide-brand-border pt-4">
                {products.slice(0, 3).map((p, idx) => (
                  <div key={idx} className="py-3 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2.5">
                      <img src={p.image} className="w-8 h-8 rounded-lg object-cover" alt="" />
                      <p className="font-bold text-brand-text">{p.name}</p>
                    </div>
                    <span className="font-extrabold text-emerald-600">+{p.salesVolume || p.stock + 120} ventes</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative bg-brand-surface p-6 pt-10 rounded-xl border border-brand-border shadow-xs space-y-4">
              <div className="absolute -top-5 left-6 right-6 p-4 card-header-warning text-white rounded-xl shadow-md glow-shadow-warning">
                <h4 className="font-bold text-sm">Produits les Moins Vendus</h4>
              </div>
              <div className="divide-y divide-brand-border pt-4">
                {products.slice().reverse().slice(0, 3).map((p, idx) => (
                  <div key={idx} className="py-3 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2.5">
                      <img src={p.image} className="w-8 h-8 rounded-lg object-cover" alt="" />
                      <p className="font-bold text-brand-text">{p.name}</p>
                    </div>
                    <span className="font-extrabold text-rose-500">{p.stock <= 5 ? 'Rotation lente' : 'Stable'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ RAPPORTS (SCREEN: director-reports) ------------------ */}
      {screen === 'director-reports' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-brand-text tracking-tight font-sans">Génération de Rapports ERP</h2>
            <p className="text-brand-muted text-xs mt-1">Générez et téléchargez des rapports précis sous divers formats légaux (PDF, Excel, CSV).</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {[
              { title: 'Rapport Complet des Ventes', desc: 'Volume global, taxes collectées, répartition mensuelle.', icon: 'payments' },
              { title: 'Rapport d\'État des Stocks', desc: 'Valorisation du stock physique, seuils de sécurité.', icon: 'inventory_2' },
              { title: 'Rapport de Mouvements d\'Arrivées', desc: 'Historique des approvisionnements fournisseurs.', icon: 'local_shipping' },
              { title: 'Rapport des Audits d\'Inventaires', desc: 'Écarts physiques vs logiques, anomalies validées.', icon: 'assignment_turned_in' },
              { title: 'Rapport d\'Activités des Utilisateurs', desc: 'Suivi d\'audit d\'habilitation de l\'équipe active.', icon: 'group' },
              { title: 'Rapport de Performance Financière', desc: 'Chiffre d\'affaires par caisse, vitesse de rotation.', icon: 'analytics' },
            ].map((rep, idx) => (
              <div key={idx} className="bg-brand-surface p-6 rounded-xl border border-brand-border shadow-xs flex flex-col justify-between h-56 hover:border-brand-primary/50 transition-all">
                <div className="space-y-3">
                  <div className="p-2.5 bg-brand-primary-light text-brand-primary rounded-xl w-fit">
                    <span className="material-symbols-outlined text-[20px]">{rep.icon}</span>
                  </div>
                  <h4 className="font-bold text-brand-text text-sm leading-tight">{rep.title}</h4>
                  <p className="text-xs text-brand-muted leading-normal">{rep.desc}</p>
                </div>
                <div className="flex gap-2 pt-4 border-t border-brand-border">
                  <button onClick={() => triggerExport(rep.title, 'PDF')} className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer">PDF</button>
                  <button onClick={() => triggerExport(rep.title, 'EXCEL')} className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer">Excel</button>
                  <button onClick={() => triggerExport(rep.title, 'CSV')} className="flex-1 py-1.5 bg-brand-surface-container hover:bg-brand-surface-container-high text-brand-muted text-[10px] font-bold rounded-lg transition-all cursor-pointer">CSV</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------ PARAMÈTRES (SCREEN: director-settings) ------------------ */}
      {screen === 'director-settings' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-brand-text tracking-tight font-sans">Configuration de la Succursale</h2>
            <p className="text-brand-muted text-xs mt-1">Configurez les variables institutionnelles de votre entreprise pour l'ERP.</p>
          </div>

          <div className="relative bg-brand-surface p-8 pt-10 rounded-xl border border-brand-border shadow-xs max-w-2xl">
            <div className="absolute -top-5 left-6 right-6 p-4 card-header-gradient-primary text-white rounded-xl shadow-md glow-shadow-primary">
              <h4 className="font-bold text-sm">Paramètres Organisationnels</h4>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6 text-xs pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider">Nom de l'Entreprise</label>
                  <input 
                    type="text" 
                    value={companySettings.name}
                    onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-brand-border rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-primary bg-brand-surface text-brand-text"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider">Devise Monétaire</label>
                  <input 
                    type="text" 
                    value={companySettings.currency}
                    onChange={(e) => setCompanySettings({ ...companySettings, currency: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-brand-border rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-primary bg-brand-surface text-brand-text"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider">Adresse Institutionnelle</label>
                  <input 
                    type="text" 
                    value={companySettings.address}
                    onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-brand-border rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-primary bg-brand-surface text-brand-text"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider">Numéro de Téléphone</label>
                  <input 
                    type="text" 
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-brand-border rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-primary bg-brand-surface text-brand-text"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider">Fuseau Horaire</label>
                  <input 
                    type="text" 
                    value={companySettings.timezone}
                    onChange={(e) => setCompanySettings({ ...companySettings, timezone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-brand-border rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-primary bg-brand-surface text-brand-text"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider">Seuil de Stock Faible</label>
                  <input 
                    type="number" 
                    value={companySettings.lowStockThreshold}
                    onChange={(e) => setCompanySettings({ ...companySettings, lowStockThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 border border-brand-border rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-primary bg-brand-surface text-brand-text"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="px-5 py-3 bg-brand-primary text-white rounded-xl text-xs font-bold hover:bg-brand-primary-hover transition-all cursor-pointer shadow-xs glow-shadow-primary"
              >
                Sauvegarder les Paramètres
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ------------------ PROFIL DIRECTEUR (SCREEN: director-profile) ------------------ */}
      {screen === 'director-profile' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-brand-text tracking-tight font-sans">Mon Profil Administrateur</h2>
            <p className="text-brand-muted text-xs mt-1">Modifiez vos informations personnelles d'accès à la plateforme SmartStock.</p>
          </div>

          <div className="relative bg-brand-surface p-8 pt-10 rounded-xl border border-brand-border shadow-xs max-w-2xl">
            <div className="absolute -top-5 left-6 right-6 p-4 card-header-gradient-secondary text-white rounded-xl shadow-md glow-shadow-secondary">
              <h4 className="font-bold text-sm">Informations de Compte</h4>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6 text-xs pt-4">
              <div className="flex items-center gap-4 border-b border-brand-border pb-6 mb-6">
                <img src={profileForm.avatar} className="w-16 h-16 rounded-full border border-brand-border object-cover" alt="" />
                <div>
                  <h4 className="font-bold text-brand-text text-sm">{currentUser.name}</h4>
                  <p className="text-[11px] text-brand-muted mt-0.5">E-mail institutionnel : {currentUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider">Prénom</label>
                  <input 
                    type="text" 
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-brand-border rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-primary bg-brand-surface text-brand-text"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider">Nom</label>
                  <input 
                    type="text" 
                    value={profileForm.lastname}
                    onChange={(e) => setProfileForm({ ...profileForm, lastname: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-brand-border rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-primary bg-brand-surface text-brand-text"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider">Numéro de Téléphone</label>
                  <input 
                    type="text" 
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-brand-border rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-primary bg-brand-surface text-brand-text"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider">Mot de passe de Connexion</label>
                  <input 
                    type="text" 
                    value={profileForm.password}
                    onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-brand-border rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-primary bg-brand-surface text-brand-text font-mono"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="px-5 py-3 bg-brand-primary text-white rounded-xl text-xs font-bold hover:bg-brand-primary-hover transition-all cursor-pointer shadow-xs glow-shadow-primary"
              >
                Mettre à jour mon profil
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ------------------ USER PROVISION / EDIT MODAL ------------------ */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-surface rounded-xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-brand-border">
            <button 
              onClick={() => setShowUserModal(false)}
              className="absolute top-4 right-4 text-brand-muted hover:text-brand-text transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-base font-bold text-brand-text mb-4 font-sans">
              {editingUser ? "Modifier le Compte Équipe" : "Habiliter un Nouveau Collaborateur"}
            </h3>
            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider">Nom Complet</label>
                <input 
                  type="text" 
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="ex. Robert Diouf"
                  className="w-full px-3.5 py-2 border border-brand-border rounded-xl text-xs focus:outline-none focus:border-brand-primary bg-brand-surface text-brand-text"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider">Adresse E-mail</label>
                <input 
                  type="email" 
                  required
                  disabled={!!editingUser}
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="ex. r.diouf@entreprise.com"
                  className="w-full px-3.5 py-2 border border-brand-border rounded-xl text-xs focus:outline-none focus:border-brand-primary disabled:opacity-50 bg-brand-surface text-brand-text"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider">Mot de passe</label>
                <input 
                  type="text" 
                  required
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="Mot de passe"
                  className="w-full px-3.5 py-2 border border-brand-border rounded-xl text-xs focus:outline-none focus:border-brand-primary bg-brand-surface text-brand-text font-mono"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider">Rôle Équipe</label>
                  <select 
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full px-3.5 py-2 border border-brand-border rounded-xl text-xs bg-brand-surface text-brand-text focus:outline-none"
                  >
                    <option value="Gestionnaire de stock">Gestionnaire de stock</option>
                    <option value="Caissier">Caissier</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider">Statut Initial</label>
                  <select 
                    value={userForm.status}
                    onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                    className="w-full px-3.5 py-2 border border-brand-border rounded-xl text-xs bg-brand-surface text-brand-text focus:outline-none"
                  >
                    <option value="Actif">Actif</option>
                    <option value="Suspendu">Suspendu</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full mt-4 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs glow-shadow-primary"
              >
                Enregistrer le collaborateur
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
