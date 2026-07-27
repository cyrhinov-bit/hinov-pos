/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Screen, User } from '../types';

interface SidebarProps {
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;
  onLogout: () => void;
  openNewTransaction: () => void;
  currentUser: User;
  warehouseTab?: string;
  setWarehouseTab?: (tab: string) => void;
  warehouseSubTab?: string;
  setWarehouseSubTab?: (subTab: string) => void;
  posTab?: string;
  setPosTab?: (tab: any) => void;
  posSubTab?: string;
  setPosSubTab?: (subTab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  setScreen,
  onLogout,
  openNewTransaction,
  currentUser,
  warehouseTab = 'dashboard',
  setWarehouseTab,
  warehouseSubTab = 'overview',
  setWarehouseSubTab,
  posTab = 'sale',
  setPosTab,
  posSubTab = 'default',
  setPosSubTab,
}) => {
  const role = currentUser.role;
  const isDirector = role.toLowerCase().includes('directeur');
  const isWarehouseManager = role.toLowerCase().includes('gestionnaire');
  const isCaissier = role.toLowerCase().includes('caissier');

  const isSettingsActive = currentScreen === 'director-settings' || 
    (currentScreen === 'warehouse' && warehouseTab === 'settings') ||
    (currentScreen === 'pos' && posTab === 'settings');

  const handleSettingsClick = () => {
    if (isDirector) {
      setScreen('director-settings');
    } else if (isWarehouseManager) {
      setScreen('warehouse');
      if (setWarehouseTab) setWarehouseTab('settings');
      if (setWarehouseSubTab) setWarehouseSubTab('default');
    } else if (isCaissier) {
      setScreen('pos');
      if (setPosTab) setPosTab('settings');
      if (setPosSubTab) setPosSubTab('default');
    } else {
      alert('Paramètres SmartStock : politiques de contrôle d\'accès, identifiants de terminaux et synchronisation hors-ligne configurés avec succès.');
    }
  };

  const [expandedMenus, setExpandedMenus] = React.useState<Record<string, boolean>>({
    dashboard: true,
    products: false,
    receptions: false,
    movements: false,
    inventories: false,
    reports: false,
  });

  // Sync expanded menus when tab changes
  React.useEffect(() => {
    if (warehouseTab) {
      setExpandedMenus((prev) => ({
        ...prev,
        [warehouseTab]: true,
      }));
    }
  }, [warehouseTab]);

  const toggleMenu = (menu: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const handleWarehouseTabClick = (tab: string, defaultSub: string) => {
    setScreen('warehouse');
    if (setWarehouseTab) setWarehouseTab(tab);
    if (setWarehouseSubTab) setWarehouseSubTab(defaultSub);
    toggleMenu(tab);
  };

  const handleWarehouseSubTabClick = (tab: string, subTab: string) => {
    setScreen('warehouse');
    if (setWarehouseTab) setWarehouseTab(tab);
    if (setWarehouseSubTab) setWarehouseSubTab(subTab);
  };

  const isScreenAllowed = (screen: Screen): boolean => {
    if (role.includes('Gouverneur')) {
      return screen === 'governance';
    }
    if (isDirector) {
      return screen.startsWith('director-');
    }
    if (isWarehouseManager) {
      return screen === 'warehouse';
    }
    if (role.includes('Caissier')) {
      return screen === 'pos';
    }
    return false;
  };

  // Hide sales option for the Director, show only for Caissier
  const showNewTransactionButton = role.includes('Caissier');

  return (
    <aside className="w-[280px] h-screen fixed left-0 top-0 bg-slate-950 text-slate-100 border-r border-slate-800 flex flex-col py-6 px-4 shadow-xl z-30 select-none">
      {/* Brand Header */}
      <div className="mb-8 px-2 flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-950">
          <span className="material-symbols-outlined !text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            inventory_2
          </span>
        </div>
        <div>
          <h1 className="font-sans font-bold text-lg text-white tracking-tight">SmartStock</h1>
          <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold font-sans leading-none">
            ERP d'Entreprise
          </p>
        </div>
      </div>

      {/* Action Button */}
      {showNewTransactionButton && (
        <button
          onClick={openNewTransaction}
          className="mb-8 w-full bg-brand-primary text-white py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-indigo-950 hover:bg-brand-primary-hover transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Nouvelle Transaction
        </button>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)] custom-scrollbar pr-1">
        {isDirector ? (
          <>
            <button
              onClick={() => setScreen('director-dashboard')}
              className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-left font-sans text-xs font-semibold transition-all duration-150 cursor-pointer ${
                currentScreen === 'director-dashboard'
                  ? 'text-white bg-[#8e24aa] font-bold shadow-sm shadow-purple-900/40 relative after:content-[""] after:absolute after:left-0 after:top-1/4 after:h-1/2 after:w-1 after:bg-white after:rounded-full'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">dashboard</span>
              <span>Tableau de Bord</span>
            </button>

            <button
              onClick={() => setScreen('director-finance')}
              className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-left font-sans text-xs font-semibold transition-all duration-150 cursor-pointer ${
                currentScreen === 'director-finance'
                  ? 'text-white bg-[#8e24aa] font-bold shadow-sm shadow-purple-900/40 relative after:content-[""] after:absolute after:left-0 after:top-1/4 after:h-1/2 after:w-1 after:bg-white after:rounded-full'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span className={`material-symbols-outlined text-lg ${currentScreen === 'director-finance' ? 'text-white' : 'text-amber-400'}`}>payments</span>
              <span>Analyse Financière</span>
            </button>

            <button
              onClick={() => setScreen('director-users')}
              className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-left font-sans text-xs font-semibold transition-all duration-150 cursor-pointer ${
                currentScreen === 'director-users'
                  ? 'text-white bg-[#8e24aa] font-bold shadow-sm shadow-purple-900/40 relative after:content-[""] after:absolute after:left-0 after:top-1/4 after:h-1/2 after:w-1 after:bg-white after:rounded-full'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">groups</span>
              <span>Utilisateurs</span>
            </button>

            <button
              onClick={() => setScreen('director-products')}
              className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-left font-sans text-xs font-semibold transition-all duration-150 cursor-pointer ${
                currentScreen === 'director-products'
                  ? 'text-white bg-[#8e24aa] font-bold shadow-sm shadow-purple-900/40 relative after:content-[""] after:absolute after:left-0 after:top-1/4 after:h-1/2 after:w-1 after:bg-white after:rounded-full'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">category</span>
              <span>Produits (Consultation)</span>
            </button>

            <button
              onClick={() => setScreen('director-stock')}
              className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-left font-sans text-xs font-semibold transition-all duration-150 cursor-pointer ${
                currentScreen === 'director-stock'
                  ? 'text-white bg-[#8e24aa] font-bold shadow-sm shadow-purple-900/40 relative after:content-[""] after:absolute after:left-0 after:top-1/4 after:h-1/2 after:w-1 after:bg-white after:rounded-full'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">warehouse</span>
              <span>Stock (Consultation)</span>
            </button>

            <button
              onClick={() => setScreen('director-sales')}
              className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-left font-sans text-xs font-semibold transition-all duration-150 cursor-pointer ${
                currentScreen === 'director-sales'
                  ? 'text-white bg-[#8e24aa] font-bold shadow-sm shadow-purple-900/40 relative after:content-[""] after:absolute after:left-0 after:top-1/4 after:h-1/2 after:w-1 after:bg-white after:rounded-full'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">sell</span>
              <span>Ventes (Consultation)</span>
            </button>

            <button
              onClick={() => setScreen('director-analytics')}
              className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-left font-sans text-xs font-semibold transition-all duration-150 cursor-pointer ${
                currentScreen === 'director-analytics'
                  ? 'text-white bg-[#8e24aa] font-bold shadow-sm shadow-purple-900/40 relative after:content-[""] after:absolute after:left-0 after:top-1/4 after:h-1/2 after:w-1 after:bg-white after:rounded-full'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">analytics</span>
              <span>Analyses</span>
            </button>

            <button
              onClick={() => setScreen('director-reports')}
              className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-left font-sans text-xs font-semibold transition-all duration-150 cursor-pointer ${
                currentScreen === 'director-reports'
                  ? 'text-white bg-[#8e24aa] font-bold shadow-sm shadow-purple-900/40 relative after:content-[""] after:absolute after:left-0 after:top-1/4 after:h-1/2 after:w-1 after:bg-white after:rounded-full'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">description</span>
              <span>Rapports</span>
            </button>

            <button
              onClick={() => setScreen('director-settings')}
              className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-left font-sans text-xs font-semibold transition-all duration-150 cursor-pointer ${
                currentScreen === 'director-settings'
                  ? 'text-white bg-[#8e24aa] font-bold shadow-sm shadow-purple-900/40 relative after:content-[""] after:absolute after:left-0 after:top-1/4 after:h-1/2 after:w-1 after:bg-white after:rounded-full'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">settings</span>
              <span>Paramètres</span>
            </button>

            <button
              onClick={() => setScreen('director-profile')}
              className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-left font-sans text-xs font-semibold transition-all duration-150 cursor-pointer ${
                currentScreen === 'director-profile'
                  ? 'text-white bg-[#8e24aa] font-bold shadow-sm shadow-purple-900/40 relative after:content-[""] after:absolute after:left-0 after:top-1/4 after:h-1/2 after:w-1 after:bg-white after:rounded-full'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">person</span>
              <span>Mon Profil</span>
            </button>
          </>
        ) : isWarehouseManager ? (
          <>
            {/* 📊 Tableau de bord */}
            <div className="w-full">
              <button
                onClick={() => handleWarehouseTabClick('dashboard', 'overview')}
                className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-left font-sans text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  warehouseTab === 'dashboard'
                    ? 'text-white bg-[#8e24aa] font-bold shadow-sm shadow-purple-900/40'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">dashboard</span>
                  <span>Tableau de bord</span>
                </div>
                <span className="material-symbols-outlined text-sm transition-transform duration-150" style={{ transform: expandedMenus.dashboard ? 'rotate(180deg)' : 'rotate(0)' }}>
                  expand_more
                </span>
              </button>
              {expandedMenus.dashboard && (
                <div className="pl-5 pr-1 mt-1 space-y-0.5 border-l border-slate-800 ml-4.5">
                  {[
                    { key: 'overview', label: "Vue d'ensemble" },
                    { key: 'kpis', label: 'KPI' },
                    { key: 'alerts', label: 'Alertes' },
                    { key: 'activities', label: 'Activités récentes' },
                    { key: 'actions', label: 'Actions rapides' },
                  ].map((sub) => (
                    <button
                      key={sub.key}
                      onClick={() => handleWarehouseSubTabClick('dashboard', sub.key)}
                      className={`w-full text-left py-1 px-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                        warehouseTab === 'dashboard' && warehouseSubTab === sub.key
                          ? 'text-white bg-[#8e24aa] font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 📦 Produits */}
            <div className="w-full mt-2">
              <button
                onClick={() => handleWarehouseTabClick('products', 'list')}
                className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-left font-sans text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  warehouseTab === 'products'
                    ? 'text-white bg-[#8e24aa] font-bold shadow-sm shadow-purple-900/40'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                  <span>Produits</span>
                </div>
                <span className="material-symbols-outlined text-sm transition-transform duration-150" style={{ transform: expandedMenus.products ? 'rotate(180deg)' : 'rotate(0)' }}>
                  expand_more
                </span>
              </button>
              {expandedMenus.products && (
                <div className="pl-5 pr-1 mt-1 space-y-0.5 border-l border-slate-800 ml-4.5">
                  {[
                    { key: 'list', label: 'Liste des produits' },
                    { key: 'add', label: 'Ajouter un produit' },
                    { key: 'categories', label: 'Catégories' },
                    { key: 'brands', label: 'Marques' },
                    { key: 'units', label: 'Unités de mesure' },
                    { key: 'suppliers', label: 'Fournisseurs' },
                  ].map((sub) => (
                    <button
                      key={sub.key}
                      onClick={() => handleWarehouseSubTabClick('products', sub.key)}
                      className={`w-full text-left py-1 px-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                        warehouseTab === 'products' && warehouseSubTab === sub.key
                          ? 'text-white bg-[#8e24aa] font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 📥 Réceptions */}
            <div className="w-full mt-2">
              <button
                onClick={() => handleWarehouseTabClick('receptions', 'new')}
                className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-left font-sans text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  warehouseTab === 'receptions'
                    ? 'text-white bg-[#8e24aa] font-bold shadow-sm shadow-purple-900/40'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                  <span>Réceptions</span>
                </div>
                <span className="material-symbols-outlined text-sm transition-transform duration-150" style={{ transform: expandedMenus.receptions ? 'rotate(180deg)' : 'rotate(0)' }}>
                  expand_more
                </span>
              </button>
              {expandedMenus.receptions && (
                <div className="pl-5 pr-1 mt-1 space-y-0.5 border-l border-slate-800 ml-4.5">
                  {[
                    { key: 'new', label: 'Nouvelle réception' },
                    { key: 'list', label: 'Liste des réceptions' },
                    { key: 'details', label: "Détails d'une réception" },
                    { key: 'history', label: 'Historique' },
                  ].map((sub) => (
                    <button
                      key={sub.key}
                      onClick={() => handleWarehouseSubTabClick('receptions', sub.key)}
                      className={`w-full text-left py-1 px-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                        warehouseTab === 'receptions' && warehouseSubTab === sub.key
                          ? 'text-white bg-[#8e24aa] font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 🔄 Mouvements */}
            <div className="w-full mt-2">
              <button
                onClick={() => handleWarehouseTabClick('movements', 'all')}
                className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-left font-sans text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  warehouseTab === 'movements'
                    ? 'text-white bg-[#8e24aa] font-bold shadow-sm shadow-purple-900/40'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                  <span>Mouvements</span>
                </div>
                <span className="material-symbols-outlined text-sm transition-transform duration-150" style={{ transform: expandedMenus.movements ? 'rotate(180deg)' : 'rotate(0)' }}>
                  expand_more
                </span>
              </button>
              {expandedMenus.movements && (
                <div className="pl-5 pr-1 mt-1 space-y-0.5 border-l border-slate-800 ml-4.5">
                  {[
                    { key: 'all', label: 'Tous les mouvements' },
                    { key: 'in', label: 'Entrées' },
                    { key: 'out', label: 'Sorties' },
                    { key: 'adjustments', label: 'Ajustements' },
                    { key: 'history', label: 'Historique' },
                  ].map((sub) => (
                    <button
                      key={sub.key}
                      onClick={() => handleWarehouseSubTabClick('movements', sub.key)}
                      className={`w-full text-left py-1 px-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                        warehouseTab === 'movements' && warehouseSubTab === sub.key
                          ? 'text-white bg-[#8e24aa] font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 📋 Inventaires */}
            <div className="w-full mt-2">
              <button
                onClick={() => handleWarehouseTabClick('inventories', 'new')}
                className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-left font-sans text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  warehouseTab === 'inventories'
                    ? 'text-white bg-[#8e24aa] font-bold shadow-sm shadow-purple-900/40'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">fact_check</span>
                  <span>Inventaires</span>
                </div>
                <span className="material-symbols-outlined text-sm transition-transform duration-150" style={{ transform: expandedMenus.inventories ? 'rotate(180deg)' : 'rotate(0)' }}>
                  expand_more
                </span>
              </button>
              {expandedMenus.inventories && (
                <div className="pl-5 pr-1 mt-1 space-y-0.5 border-l border-slate-800 ml-4.5">
                  {[
                    { key: 'new', label: 'Nouvel inventaire' },
                    { key: 'ongoing', label: 'Inventaires en cours' },
                    { key: 'completed', label: 'Inventaires terminés' },
                    { key: 'discrepancies', label: 'Écarts' },
                    { key: 'history', label: 'Historique' },
                  ].map((sub) => (
                    <button
                      key={sub.key}
                      onClick={() => handleWarehouseSubTabClick('inventories', sub.key)}
                      className={`w-full text-left py-1 px-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                        warehouseTab === 'inventories' && warehouseSubTab === sub.key
                          ? 'text-white bg-[#8e24aa] font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 📊 Rapports */}
            <div className="w-full mt-2">
              <button
                onClick={() => handleWarehouseTabClick('reports', 'stock')}
                className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-left font-sans text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  warehouseTab === 'reports'
                    ? 'text-white bg-[#8e24aa] font-bold shadow-sm shadow-purple-900/40'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">analytics</span>
                  <span>Rapports</span>
                </div>
                <span className="material-symbols-outlined text-sm transition-transform duration-150" style={{ transform: expandedMenus.reports ? 'rotate(180deg)' : 'rotate(0)' }}>
                  expand_more
                </span>
              </button>
              {expandedMenus.reports && (
                <div className="pl-5 pr-1 mt-1 space-y-0.5 border-l border-slate-800 ml-4.5">
                  {[
                    { key: 'stock', label: 'Rapport du stock' },
                    { key: 'products', label: 'Rapport des produits' },
                    { key: 'receptions', label: 'Rapport des réceptions' },
                    { key: 'inventories', label: 'Rapport des inventaires' },
                    { key: 'movements', label: 'Rapport des mouvements' },
                    { key: 'valorisation', label: 'Rapport de valorisation' },
                  ].map((sub) => (
                    <button
                      key={sub.key}
                      onClick={() => handleWarehouseSubTabClick('reports', sub.key)}
                      className={`w-full text-left py-1 px-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                        warehouseTab === 'reports' && warehouseSubTab === sub.key
                          ? 'text-white bg-[#8e24aa] font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 👤 Mon Profil */}
            <button
              onClick={() => handleWarehouseSubTabClick('profile', 'default')}
              className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-left font-sans text-xs font-semibold mt-2 transition-all duration-150 cursor-pointer ${
                warehouseTab === 'profile'
                  ? 'text-white bg-[#8e24aa] font-bold shadow-sm shadow-purple-900/40 relative after:content-[""] after:absolute after:left-0 after:top-1/4 after:h-1/2 after:w-1 after:bg-white after:rounded-full'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">person</span>
              <span>Mon Profil</span>
            </button>
          </>
        ) : isCaissier ? (
          <>
            {/* 🛒 Nouvelle vente */}
            <button
              onClick={() => {
                setScreen('pos');
                if (setPosTab) setPosTab('sale');
              }}
              className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-left font-sans text-xs font-semibold transition-all duration-150 cursor-pointer ${
                currentScreen === 'pos' && posTab === 'sale'
                  ? 'text-white bg-[#8e24aa] font-bold shadow-sm shadow-purple-900/40 relative after:content-[""] after:absolute after:left-0 after:top-1/4 after:h-1/2 after:w-1 after:bg-white after:rounded-full'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
              <span>Nouvelle vente</span>
            </button>

            {/* 🕒 Ventes suspendues */}
            <button
              onClick={() => {
                setScreen('pos');
                if (setPosTab) setPosTab('suspended');
              }}
              className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-left font-sans text-xs font-semibold transition-all duration-150 cursor-pointer ${
                currentScreen === 'pos' && posTab === 'suspended'
                  ? 'text-white bg-[#8e24aa] font-bold shadow-sm shadow-purple-900/40 relative after:content-[""] after:absolute after:left-0 after:top-1/4 after:h-1/2 after:w-1 after:bg-white after:rounded-full'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">pause_circle</span>
              <span>Ventes suspendues</span>
            </button>

            {/* 🔄 Retours / Échanges */}
            <button
              onClick={() => {
                setScreen('pos');
                if (setPosTab) setPosTab('returns');
              }}
              className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-left font-sans text-xs font-semibold transition-all duration-150 cursor-pointer ${
                currentScreen === 'pos' && posTab === 'returns'
                  ? 'text-white bg-[#8e24aa] font-bold shadow-sm shadow-purple-900/40 relative after:content-[""] after:absolute after:left-0 after:top-1/4 after:h-1/2 after:w-1 after:bg-white after:rounded-full'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">sync_alt</span>
              <span>Retours / Échanges</span>
            </button>

            {/* 🧾 Historique des ventes */}
            <button
              onClick={() => {
                setScreen('pos');
                if (setPosTab) setPosTab('history');
              }}
              className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-left font-sans text-xs font-semibold transition-all duration-150 cursor-pointer ${
                currentScreen === 'pos' && posTab === 'history'
                  ? 'text-white bg-[#8e24aa] font-bold shadow-sm shadow-purple-900/40 relative after:content-[""] after:absolute after:left-0 after:top-1/4 after:h-1/2 after:w-1 after:bg-white after:rounded-full'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">receipt_long</span>
              <span>Historique des ventes</span>
            </button>

            {/* 💰 Gestion de la caisse */}
            <button
              onClick={() => {
                setScreen('pos');
                if (setPosTab) setPosTab('caisse');
              }}
              className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-left font-sans text-xs font-semibold transition-all duration-150 cursor-pointer ${
                currentScreen === 'pos' && posTab === 'caisse'
                  ? 'text-white bg-[#8e24aa] font-bold shadow-sm shadow-purple-900/40 relative after:content-[""] after:absolute after:left-0 after:top-1/4 after:h-1/2 after:w-1 after:bg-white after:rounded-full'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
              <span>Gestion de la caisse</span>
            </button>

            {/* 📊 Mes statistiques */}
            <button
              onClick={() => {
                setScreen('pos');
                if (setPosTab) setPosTab('stats');
              }}
              className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-left font-sans text-xs font-semibold transition-all duration-150 cursor-pointer ${
                currentScreen === 'pos' && posTab === 'stats'
                  ? 'text-white bg-[#8e24aa] font-bold shadow-sm shadow-purple-900/40 relative after:content-[""] after:absolute after:left-0 after:top-1/4 after:h-1/2 after:w-1 after:bg-white after:rounded-full'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">bar_chart</span>
              <span>Mes statistiques</span>
            </button>

            {/* 👤 Mon Profil */}
            <button
              onClick={() => {
                setScreen('pos');
                if (setPosTab) setPosTab('profile');
              }}
              className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-left font-sans text-xs font-semibold transition-all duration-150 cursor-pointer ${
                currentScreen === 'pos' && posTab === 'profile'
                  ? 'text-white bg-[#8e24aa] font-bold shadow-sm shadow-purple-900/40 relative after:content-[""] after:absolute after:left-0 after:top-1/4 after:h-1/2 after:w-1 after:bg-white after:rounded-full'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">person</span>
              <span>Mon Profil</span>
            </button>
          </>
        ) : (
          <>
            {/* Performance / Dashboard */}
            {isScreenAllowed('performance') && (
              <button
                onClick={() => setScreen('performance')}
                className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-left font-sans text-sm transition-all duration-150 cursor-pointer ${
                  currentScreen === 'performance'
                    ? 'text-white bg-[#8e24aa] font-semibold shadow-sm shadow-purple-900/40 relative after:content-[""] after:absolute after:left-0 after:top-1/4 after:h-1/2 after:w-1 after:bg-white after:rounded-full'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-xl">dashboard</span>
                <span>Tableau de Bord</span>
              </button>
            )}

            {/* Warehouse / Inventory */}
            {isScreenAllowed('warehouse') && (
              <button
                onClick={() => setScreen('warehouse')}
                className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-left font-sans text-sm transition-all duration-150 cursor-pointer ${
                  currentScreen === 'warehouse'
                    ? 'text-white bg-[#8e24aa] font-semibold shadow-sm shadow-purple-900/40 relative after:content-[""] after:absolute after:left-0 after:top-1/4 after:h-1/2 after:w-1 after:bg-white after:rounded-full'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-xl">warehouse</span>
                <span>Entrepôt & Stocks</span>
              </button>
            )}

            {/* Governance / Procurement */}
            {isScreenAllowed('governance') && (
              <button
                onClick={() => setScreen('governance')}
                className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-left font-sans text-sm transition-all duration-150 cursor-pointer ${
                  currentScreen === 'governance'
                    ? 'text-white bg-[#8e24aa] font-semibold shadow-sm shadow-purple-900/40 relative after:content-[""] after:absolute after:left-0 after:top-1/4 after:h-1/2 after:w-1 after:bg-white after:rounded-full'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-xl">gavel</span>
                <span>Gouvernance & Accès</span>
              </button>
            )}

            {/* Point of Sale / Sales */}
            {isScreenAllowed('pos') && (
              <button
                onClick={() => setScreen('pos')}
                className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-left font-sans text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  currentScreen === 'pos'
                    ? 'text-white bg-[#8e24aa] font-semibold shadow-sm shadow-purple-900/40 relative after:content-[""] after:absolute after:left-0 after:top-1/4 after:h-1/2 after:w-1 after:bg-white after:rounded-full'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-xl">sell</span>
                <span>Point de Vente (PDV)</span>
              </button>
            )}
          </>
        )}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto space-y-1 pt-4 border-t border-slate-800">
        <button
          onClick={handleSettingsClick}
          className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-left text-sm transition-all cursor-pointer ${
            isSettingsActive
              ? 'text-white bg-[#8e24aa] font-bold shadow-sm shadow-purple-900/40 relative after:content-[""] after:absolute after:left-0 after:top-1/4 after:h-1/2 after:w-1 after:bg-white after:rounded-full'
              : 'text-slate-300 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-xl">settings</span>
          <span>Paramètres</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-left text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl text-rose-400">logout</span>
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};
