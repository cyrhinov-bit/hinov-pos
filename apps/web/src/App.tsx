/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Screen, Director, GovernanceLog, Product, Transaction, StockArrival, CartItem, User } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './components/Login';
import { Governance } from './components/Governance';
import { Performance } from './components/Performance';
import { Warehouse } from './components/Warehouse';
import { POS } from './components/POS';
import { DirectorDashboard } from './components/DirectorDashboard';
import { SetPassword } from './components/SetPassword';
import { PublicCatalog } from './components/PublicCatalog';
import {
  INITIAL_STOCK_ARRIVALS,
} from './data';
import { useCatalog, useBackend } from '@pos/core';

export default function App() {
  const [isCatalogView, setIsCatalogView] = useState(() => {
    const hash = window.location.hash;
    const path = window.location.pathname;
    return hash.includes('catalog') || path.includes('/catalog');
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentScreen, setScreen] = useState<Screen>('performance');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      if (hash.includes('catalog') || path.includes('/catalog')) {
        setIsCatalogView(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [warehouseTab, setWarehouseTab] = useState('dashboard');
  const [warehouseSubTab, setWarehouseSubTab] = useState('overview');
  const [posTab, setPosTab] = useState<'sale' | 'suspended' | 'returns' | 'history' | 'caisse' | 'stats' | 'profile' | 'settings'>('sale');
  const [posSubTab, setPosSubTab] = useState<string>('default');
  const [globallySelectedSku, setGloballySelectedSku] = useState<string | null>(null);
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  useEffect(() => {
    // Check if we are in a password setup/reset flow from Supabase invite
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=') && (hash.includes('type=invite') || hash.includes('type=recovery'))) {
      setIsSettingPassword(true);
    }
  }, []);

  const { profiles, sales, logs: backendLogs, loading: backendLoading } = useBackend();

  // Authentication & accounts database state
  const [accounts, setAccounts] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Core global state shared across all dashboards
  const [directors, setDirectors] = useState<Director[]>([]);
  const [logs, setLogs] = useState<GovernanceLog[]>([]);

  useEffect(() => {
    if (profiles && profiles.length > 0) {
      setAccounts(profiles);
      setDirectors(profiles.map(p => ({
        id: p.id,
        name: p.name || p.first_name || 'Utilisateur',
        email: p.email,
        department: p.role,
        lastActivity: 'Récemment',
        status: p.is_active !== false ? 'Actif' : 'Suspendu',
        initials: (p.name || p.first_name || 'U').slice(0, 2).toUpperCase(),
        bgColor: 'bg-indigo-50 text-indigo-700'
      })));
    }
  }, [profiles]);

  useEffect(() => {
    if (backendLogs && backendLogs.length > 0) {
      setLogs(backendLogs);
    }
  }, [backendLogs]);
  
  // Database catalog integration
  const { products: apiProducts, isOnline, pendingSyncCount, syncPendingSales } = useCatalog();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setProducts(apiProducts || []);
  }, [apiProducts]);

  // Auto-sync offline sales every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingSyncCount > 0) {
        syncPendingSales();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [pendingSyncCount, syncPendingSales]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [arrivals, setArrivals] = useState<StockArrival[]>(INITIAL_STOCK_ARRIVALS);

  useEffect(() => {
    if (sales && sales.length > 0) {
      setTransactions(sales as any);
    }
  }, [sales]);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Notification alerts state
  const [notificationCount, setNotificationCount] = useState(3);
  const [activeAlert, setActiveAlert] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    if (user.role.toLowerCase().includes('directeur')) {
      setScreen('director-dashboard');
    } else if (user.role.toLowerCase().includes('gestionnaire')) {
      setScreen('warehouse');
      setWarehouseTab('dashboard');
      setWarehouseSubTab('overview');
    } else if (user.role.toLowerCase().includes('caissier')) {
      setScreen('pos');
      setPosTab('sale');
      setPosSubTab('default');
    } else {
      setScreen('performance');
    }
    triggerAlert(`Connexion réussie : bienvenue ${user.name} (${user.role}).`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCart([]);
    triggerAlert('Session déconnectée avec succès.', 'info');
  };

  const triggerAlert = (message: string, type: 'success' | 'info' = 'success') => {
    setActiveAlert({ message, type });
    setNotificationCount((prev) => prev + 1);
    setTimeout(() => {
      setActiveAlert(null);
    }, 4000);
  };

  // Switch to POS when clicking "New Transaction"
  const handleOpenNewTransaction = () => {
    setScreen('pos');
    setSearchQuery('');
    triggerAlert('Terminal Point de Vente (PDV) chargé.', 'info');
  };

  // Handle successful POS Checkout integration
  const handleCheckoutSuccess = (totalAmount: number, details: string) => {
    // 1. Create a dynamic logistics stream transaction
    const transactionId = `#TRX-${Math.floor(10000 + Math.random() * 90000)}`;
    const newTx: Transaction = {
      id: transactionId,
      asset: 'Achat Client PDV',
      category: 'VENTES POINT DE VENTE',
      origin: 'Centre DC-01',
      destination: 'Envoi Terminal Client',
      status: 'Livré',
      value: totalAmount,
      date: new Date().toISOString().split('T')[0],
    };

    setTransactions([newTx, ...transactions]);

    // 2. Add an audit log entry in Governance
    const newLog: GovernanceLog = {
      id: `ID-${Math.floor(10000 + Math.random() * 90000)}`,
      type: 'success',
      title: 'Vente PDV Exécutée',
      description: `Facture de vente de ${totalAmount.toLocaleString('fr-FR')} F CFA finalisée. ${details}`,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour12: false }),
      code: `TX-${Math.floor(100 + Math.random() * 900)}`,
    };

    setLogs([newLog, ...logs]);

    // 3. Trigger alert toast
    triggerAlert(`Transaction terminée : ${transactionId} de ${totalAmount.toLocaleString('fr-FR')} F CFA finalisée !`, 'success');
  };

  // Public Catalog route check (standalone or unauthenticated client access)
  if (isCatalogView) {
    return (
      <PublicCatalog 
        onGoToLogin={() => {
          setIsCatalogView(false);
          if (window.location.hash.includes('catalog')) {
            window.location.hash = '';
          }
        }} 
      />
    );
  }

  // If not authenticated, render Login Page
  if (isSettingPassword) {
    return (
      <SetPassword 
        onSuccess={() => {
          setIsSettingPassword(false);
          triggerAlert('Mot de passe défini avec succès. Vous pouvez maintenant vous connecter.', 'success');
        }} 
      />
    );
  }

  if (!isAuthenticated) {
    return <Login accounts={accounts} onLoginSuccess={handleLoginSuccess} onGoToCatalog={() => {
      setIsCatalogView(true);
      window.location.hash = '#catalog';
    }} />;
  }

  return (
    <div className="bg-brand-bg min-h-screen relative antialiased text-brand-text">
      {/* Toast Alert Notification */}
      {activeAlert && (
        <div className="fixed top-20 right-8 z-[100] max-w-sm bg-white border border-gray-200 p-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-in slide-in-from-right duration-300">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              activeAlert.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {activeAlert.type === 'success' ? 'check' : 'info'}
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900">Notification Système</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{activeAlert.message}</p>
          </div>
          <button onClick={() => setActiveAlert(null)} className="text-gray-400 hover:text-gray-600 p-0.5 ml-auto">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Persistent Navigation Sidebar */}
      <Sidebar
        currentUser={currentUser!}
        currentScreen={currentScreen}
        setScreen={(scr) => {
          setScreen(scr);
          setSearchQuery(''); // Reset search when switching screens
        }}
        onLogout={handleLogout}
        openNewTransaction={handleOpenNewTransaction}
        warehouseTab={warehouseTab}
        setWarehouseTab={setWarehouseTab}
        warehouseSubTab={warehouseSubTab}
        setWarehouseSubTab={setWarehouseSubTab}
        posTab={posTab}
        setPosTab={setPosTab}
        posSubTab={posSubTab}
        setPosSubTab={setPosSubTab}
      />

      {/* Main Content Area Layout Container */}
      <div className="pl-[280px]">
        {/* Dynamic Header */}
        <Header
          currentUser={currentUser!}
          currentScreen={currentScreen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onProfileClick={() => {
            if (currentUser?.role.toLowerCase().includes('gestionnaire')) {
              setScreen('warehouse');
              setWarehouseTab('profile');
              setWarehouseSubTab('default');
            } else {
              alert(`Profil actif : ${currentUser?.name} (${currentUser?.role})`);
            }
          }}
          notificationCount={notificationCount}
          clearNotifications={() => setNotificationCount(0)}
          isOnline={isOnline}
          pendingSyncCount={pendingSyncCount}
          products={products}
          onViewProduct={(product) => {
            if (currentUser?.role.toLowerCase().includes('gestionnaire')) {
              setScreen('warehouse');
              setWarehouseTab('products');
              setWarehouseSubTab('list');
              setGloballySelectedSku(product.sku);
            } else {
              triggerAlert(`Fiche Produit : ${product.name} (SKU: ${product.sku}) - Stock: ${product.stock}`, 'info');
            }
          }}
        />

        {/* Dashboards Wrapper */}
        <main className="min-h-[calc(100vh-64px)] w-full">
          {currentScreen === 'performance' && (
            <Performance
              products={products}
              transactions={transactions}
              setTransactions={setTransactions}
              searchQuery={searchQuery}
            />
          )}

          {currentScreen === 'warehouse' && (
            <Warehouse
              arrivals={arrivals}
              setArrivals={setArrivals}
              searchQuery={searchQuery}
              products={products}
              setProducts={setProducts}
              currentUser={currentUser!}
              setCurrentUser={setCurrentUser}
              onLogout={handleLogout}
              activeTab={warehouseTab}
              setActiveTab={setWarehouseTab}
              activeSubTab={warehouseSubTab}
              setActiveSubTab={setWarehouseSubTab}
              globallySelectedSku={globallySelectedSku}
              onClearGloballySelectedSku={() => setGloballySelectedSku(null)}
              accounts={accounts}
              setAccounts={setAccounts}
            />
          )}

          {currentScreen === 'governance' && (
            <Governance
              directors={directors}
              setDirectors={setDirectors}
              logs={logs}
              setLogs={setLogs}
              searchQuery={searchQuery}
              currentUser={currentUser!}
              accounts={accounts}
              onCreateUser={(newUser, newDirector) => {
                setAccounts((prev) => [...prev, newUser]);
                setDirectors((prev) => [newDirector, ...prev]);
                triggerAlert(`Compte créé pour ${newUser.name} (${newUser.role}) !`, 'success');
              }}
            />
          )}

          {currentScreen === 'pos' && (
            <POS
              products={products}
              setProducts={setProducts}
              cart={cart}
              setCart={setCart}
              searchQuery={searchQuery}
              onCheckoutSuccess={handleCheckoutSuccess}
              currentUser={currentUser!}
              setCurrentUser={setCurrentUser}
              onLogout={handleLogout}
              activeTab={posTab}
              setActiveTab={setPosTab}
              activeSubTab={posSubTab}
              setActiveSubTab={setPosSubTab}
              accounts={accounts}
              setAccounts={setAccounts}
              logs={logs}
              setLogs={setLogs}
            />
          )}

          {currentScreen.startsWith('director-') && (
            <DirectorDashboard
              screen={currentScreen}
              setScreen={setScreen}
              products={products}
              setProducts={setProducts}
              transactions={transactions}
              setTransactions={setTransactions}
              arrivals={arrivals}
              setArrivals={setArrivals}
              searchQuery={searchQuery}
              currentUser={currentUser!}
              setCurrentUser={setCurrentUser}
              accounts={accounts}
              setAccounts={setAccounts}
              directors={directors}
              setDirectors={setDirectors}
              logs={logs}
              setLogs={setLogs}
              triggerAlert={triggerAlert}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>
    </div>
  );
}
