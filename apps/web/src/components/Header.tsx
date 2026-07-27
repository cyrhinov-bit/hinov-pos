/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Screen, User } from '../types';
import { PROFILES } from '../data';

interface HeaderProps {
  currentScreen: Screen;
  currentUser: User;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onProfileClick: () => void;
  notificationCount: number;
  clearNotifications: () => void;
  products?: any[];
  onViewProduct?: (product: any) => void;
  isOnline?: boolean;
  pendingSyncCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  currentUser,
  searchQuery,
  setSearchQuery,
  onProfileClick,
  notificationCount,
  clearNotifications,
  products = [],
  onViewProduct,
  isOnline = true,
  pendingSyncCount = 0,
}) => {
  const [showApps, setShowApps] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(true);

  // Real-time ticking clock
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Scanner toggles (interactive simulator)
  const [scannerReady, setScannerReady] = useState(true);

  const formattedDateTime = time.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }) + ' ' + time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const profile = currentUser;

  const matchingProducts = searchQuery.trim().length > 1 && products
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5)
    : [];

  // Placeholder notifications based on current screen in French
  const getNotificationsForScreen = (screen: Screen) => {
    switch (screen) {
      case 'governance':
        return [
          'Alerte critique : Stock faible en Zone C-11',
          'Audit : Rapport semestriel exporté',
          'Politique : Calendrier de rotation des mots de passe mis à jour',
        ];
      case 'performance':
        return [
          'Haute priorité : Objectif de revenus dépassé de +12,5 % aujourd\'hui',
          'Système : Sauvegarde automatique quotidienne terminée avec succès',
          'Logistique : L\'expédition retardée #TRX-99015 nécessite une réorientation',
        ];
      case 'warehouse':
        return [
          'Alerte : La capacité de stockage de la Zone C (Électronique) atteint 94 %',
          'Arrivé : Le produit FRN-00214 de Modern Office Co. nécessite une INSPECTION',
          'Astuce : Conseil d\'optimisation généré pour les produits secs',
        ];
      case 'pos':
        return [
          'Alerte panier : Le casque Pro Sound Sans-Fil est populaire (Plus que 12 restants)',
          'Synchro : Le terminal de vente n°3 a synchronisé ses données hors ligne',
          'Notification : Un client de passage a effectué son paiement',
        ];
      default:
        return ['Bienvenue sur le terminal sécurisé de SmartStock ERP'];
    }
  };

  const notifications = getNotificationsForScreen(currentScreen);

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-280px)] h-16 bg-brand-surface border-b border-brand-border flex justify-between items-center px-8 z-20 select-none">
      {/* Left side: Branding & POS Terminal Meta */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white font-black text-sm shadow-sm">
            S
          </div>
          <div className="leading-tight">
            <h1 className="text-xs font-extrabold text-brand-text tracking-wide uppercase font-sans">
              SmartStock Boutique
            </h1>
            <p className="text-[10px] text-brand-muted font-semibold font-mono uppercase tracking-wider">
              Boutique Plateau • Caisse #1
            </p>
          </div>
        </div>

        {/* Real-Time Digital Clock */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-gray-500 font-semibold font-mono text-[10px]">
          <span className="material-symbols-outlined text-xs text-gray-400">schedule</span>
          <span className="capitalize">{formattedDateTime}</span>
        </div>
      </div>

      {/* Center: Search / Catalog Filter Input */}
      <div className="flex items-center gap-4 flex-1 max-w-sm mx-4">
        <div className="relative w-full group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-[18px] transition-colors group-focus-within:text-brand-primary">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            className="w-full h-9 pl-9 pr-4 bg-brand-primary-light/50 border border-transparent rounded-full font-sans text-xs text-brand-text placeholder-brand-muted focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-4 focus:ring-indigo-100 transition-all duration-200"
            placeholder={
              currentScreen === 'pos'
                ? 'Filtrer le catalogue...'
                : 'Rechercher...'
            }
            type="text"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 hover:text-gray-600 font-semibold cursor-pointer"
            >
              Effacer
            </button>
          )}

          {/* Autocomplete Dropdown */}
          {showSearchResults && matchingProducts.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
              <div className="p-3 bg-gray-50 border-b border-gray-100 text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                Fiches Produits Correspondantes
              </div>
              <div className="p-1 divide-y divide-gray-50">
                {matchingProducts.map((p) => (
                  <button
                    key={p.sku}
                    onClick={() => {
                      if (onViewProduct) onViewProduct(p);
                      setSearchQuery('');
                      setShowSearchResults(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 hover:bg-[#f0f3ff]/50 rounded-xl transition-all text-left cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-xs text-gray-900">{p.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                        SKU: {p.sku} | {p.brand} | {p.category}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end justify-center">
                      <div className="text-xs font-bold text-indigo-600">
                        {p.stock} {p.unit || 'pcs'}
                      </div>
                      <span className={`inline-block w-2 h-2 rounded-full mt-1 ${
                        p.stock === 0 
                          ? 'bg-red-500' 
                          : p.stock <= p.minStock 
                          ? 'bg-amber-500' 
                          : 'bg-emerald-500'
                      }`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Interactive states, Notifications, Profile */}
      <div className="flex items-center gap-4">
        {/* Connection Status indicator */}
        <div
          title={isOnline ? "Connexion serveur établie" : "Mode hors-ligne actif. Synchronisation en attente."}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full border shadow-sm transition-all ${
            isOnline 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
              : 'bg-rose-50 border-rose-100 text-rose-700'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full inline-block ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-ping'}`}></span>
          <span className="text-[9px] font-bold tracking-wide uppercase font-sans">
            {isOnline ? 'En Ligne' : 'Hors-ligne'}
          </span>
          {!isOnline && pendingSyncCount > 0 && (
            <span className="ml-1 text-[8px] bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded-full font-bold">
              {pendingSyncCount} en attente
            </span>
          )}
        </div>

        {/* Scanner connection badge with simulation toggle */}
        <button
          onClick={() => setScannerReady(!scannerReady)}
          title="Cliquez pour simuler une erreur scanner"
          className={`hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-full border shadow-sm cursor-pointer transition-all active:scale-95 ${
            scannerReady 
              ? 'bg-indigo-50 border-indigo-100 text-indigo-700' 
              : 'bg-amber-50 border-amber-100 text-amber-700'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full inline-block ${scannerReady ? 'bg-indigo-500' : 'bg-amber-500 animate-pulse'}`}></span>
          <span className="text-[9px] font-bold tracking-wide uppercase font-sans">
            {scannerReady ? 'Scanner : Prêt' : 'Scanner : Erreur'}
          </span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowApps(false);
            }}
            className="p-1.5 text-brand-muted hover:bg-brand-primary-light rounded-xl transition-all relative cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#ba1a1a] text-white text-[8px] font-bold flex items-center justify-center rounded-full border border-white">
                {notificationCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <span className="font-bold text-sm text-gray-800">Notifications ({notificationCount})</span>
                {notificationCount > 0 && (
                  <button
                    onClick={() => {
                      clearNotifications();
                      setShowNotifications(false);
                    }}
                    className="text-xs text-brand-primary hover:underline font-semibold"
                  >
                    Tout effacer
                  </button>
                )}
              </div>
              <div className="p-2 divide-y divide-gray-50 max-h-60 overflow-y-auto custom-scrollbar">
                {notificationCount > 0 ? (
                  notifications.map((notif, idx) => (
                    <div key={idx} className="p-3 text-xs text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span>{notif}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-gray-400">Aucune alerte</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Apps Grid Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowApps(!showApps);
              setShowNotifications(false);
            }}
            className="p-1.5 text-brand-muted hover:bg-brand-primary-light rounded-xl transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">apps</span>
          </button>

          {showApps && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 z-50 grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2 text-center hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                <span className="material-symbols-outlined text-indigo-600 text-xl mb-1">domain</span>
                <p className="text-[10px] font-semibold text-gray-700">Gouvernance</p>
              </div>
              <div className="p-2 text-center hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                <span className="material-symbols-outlined text-teal-600 text-xl mb-1">payments</span>
                <p className="text-[10px] font-semibold text-gray-700">Finance</p>
              </div>
              <div className="p-2 text-center hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                <span className="material-symbols-outlined text-sky-600 text-xl mb-1">local_shipping</span>
                <p className="text-[10px] font-semibold text-gray-700">Logistique</p>
              </div>
              <div className="p-2 text-center hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                <span className="material-symbols-outlined text-amber-600 text-xl mb-1">barcode_reader</span>
                <p className="text-[10px] font-semibold text-gray-700">Codes-barres</p>
              </div>
              <div className="p-2 text-center hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                <span className="material-symbols-outlined text-rose-600 text-xl mb-1">gavel</span>
                <p className="text-[10px] font-semibold text-gray-700">Conformité</p>
              </div>
              <div className="p-2 text-center hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                <span className="material-symbols-outlined text-purple-600 text-xl mb-1">monitoring</span>
                <p className="text-[10px] font-semibold text-gray-700">Analyses BI</p>
              </div>
            </div>
          )}
        </div>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-brand-border"></div>

        {/* User Profile Info */}
        <div
          onClick={onProfileClick}
          className="flex items-center gap-2 cursor-pointer hover:bg-brand-primary-light/80 rounded-xl p-1 transition-all duration-200 group"
        >
          <div className="text-right hidden lg:block">
            <p className="text-xs font-bold text-brand-text group-hover:text-brand-primary transition-colors font-sans leading-tight">
              {profile.name}
            </p>
            <p className="text-[9px] text-brand-muted font-semibold font-sans uppercase tracking-wider">
              {profile.role}
            </p>
          </div>
          <img
            className="w-8 h-8 rounded-full border border-indigo-100 group-hover:border-brand-primary transition-all object-cover shadow-xs"
            alt={profile.name}
            src={profile.avatar}
          />
        </div>
      </div>
    </header>
  );
};
