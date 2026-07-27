import React, { useState, useMemo } from 'react';
import { LIBRAIRIE_CATEGORIES } from '../data';
import { EnrichedProduct, WarehouseCategory, WarehouseSupplier, StockMovement, PurchaseOrder, InventoryReport } from './warehouse/types';
import { DashboardTab } from './warehouse/DashboardTab';
import { ProductsTab } from './warehouse/ProductsTab';
import { CategoriesTab } from './warehouse/CategoriesTab';
import { SuppliersTab } from './warehouse/SuppliersTab';
import { StockStateTab } from './warehouse/StockStateTab';
import { ReceptionsTab } from './warehouse/ReceptionsTab';
import { MovementsTab } from './warehouse/MovementsTab';
import { InventoriesTab } from './warehouse/InventoriesTab';
import { ReportsTab } from './warehouse/ReportsTab';
import { ProfileTab } from './warehouse/ProfileTab';
import { SettingsTab } from './warehouse/SettingsTab';

interface WarehouseProps {
  products: any[];
  setProducts: React.Dispatch<React.SetStateAction<any[]>>;
  currentUser: { name: string; role: string; [key: string]: any };
  setCurrentUser?: (user: any) => void;
  onLogout: () => void;
  searchQuery: string;
  arrivals: any[];
  setArrivals: React.Dispatch<React.SetStateAction<any[]>>;
  activeTab?: string;
  setActiveTab?: (tab: any) => void;
  activeSubTab?: string;
  setActiveSubTab?: (subTab: string) => void;
  globallySelectedSku?: string | null;
  onClearGloballySelectedSku?: () => void;
  accounts?: any[];
  setAccounts?: React.Dispatch<React.SetStateAction<any[]>>;
}

export const Warehouse: React.FC<WarehouseProps> = ({
  products,
  setProducts,
  currentUser,
  setCurrentUser,
  onLogout,
  searchQuery,
  arrivals,
  setArrivals,
  activeTab: externalActiveTab,
  setActiveTab: externalSetActiveTab,
  activeSubTab: externalActiveSubTab,
  setActiveSubTab: externalSetActiveSubTab,
  globallySelectedSku,
  onClearGloballySelectedSku,
  accounts = [],
  setAccounts,
}) => {
  const [localActiveTab, localSetActiveTab] = useState<string>('dashboard');
  const [localActiveSubTab, localSetActiveSubTab] = useState<string>('overview');

  const activeTab = externalActiveTab || localActiveTab;
  const setActiveTab = (tab: any) => {
    if (externalSetActiveTab) {
      externalSetActiveTab(tab);
    } else {
      localSetActiveTab(tab);
    }
  };

  const activeSubTab = externalActiveSubTab || localActiveSubTab;
  const setActiveSubTab = (subTab: string) => {
    if (externalSetActiveSubTab) {
      externalSetActiveSubTab(subTab);
    } else {
      localSetActiveSubTab(subTab);
    }
  };

  // Pre-selected SKU for direct replenishment action
  const [preSelectedSku, setPreSelectedSku] = useState<string | undefined>(undefined);

  // --- Initial Data States ---
  const [categories, setCategories] = useState<WarehouseCategory[]>(() => {
    return LIBRAIRIE_CATEGORIES.map(cat => ({
      name: cat.name,
      description: cat.description,
      image: cat.image,
      active: true,
    }));
  });

  const [suppliers, setSuppliers] = useState<WarehouseSupplier[]>([
    {
      id: 'SUP-001',
      name: 'Global Tech Dist.',
      contact: 'Marc Amon',
      phone: '+225 07 08 09 10 21',
      email: 'contact@globaltech.ci',
      address: 'Abidjan, Boulevard de Marseille, Zone 4',
      notes: 'Importateur agréé d\'appareils électroniques et connectiques innovantes.',
      active: true,
      productsProvided: 4,
    },
    {
      id: 'SUP-002',
      name: 'Sodipal S.A.',
      contact: 'Fatou Diop',
      phone: '+221 33 849 11 22',
      email: 'f.diop@sodipal.sn',
      address: 'Dakar, Hann Bel-Air, Rue de l\'Industrie',
      notes: 'Leader sénégalais de distribution alimentaire de gros et demi-gros.',
      active: true,
      productsProvided: 2,
    },
    {
      id: 'SUP-003',
      name: 'ElectroPlus SARL',
      contact: 'Koffi Mensah',
      phone: '+228 22 21 44 55',
      email: 'koffi@electroplus.tg',
      address: 'Lomé, Grand Marché, Allée des Boutiques',
      notes: 'Centrale d\'achats spécialisée dans l\'équipement d\'électroménager premium.',
      active: true,
      productsProvided: 3,
    },
  ]);

  const [movements, setMovements] = useState<StockMovement[]>([
    {
      id: 'MOV-101',
      date: '2026-07-01',
      hour: '10:30',
      productSku: 'ELC-29381',
      productName: 'Smartphone Galaxy S24 Ultra',
      type: 'Entrée',
      quantity: 50,
      user: 'Directeur',
      observation: 'Saisie de stock initial pour ouverture de l\'entrepôt DC-01.',
    },
    {
      id: 'MOV-102',
      date: '2026-07-01',
      hour: '14:15',
      productSku: 'FRN-00214',
      productName: 'Cafetière Espresso Automatique',
      type: 'Sortie',
      quantity: -3,
      user: 'Caisse',
      observation: 'Vente Point de Vente - Ticket de caisse #TC-0192.',
    },
    {
      id: 'MOV-103',
      date: '2026-07-02',
      hour: '09:00',
      productSku: 'ALM-10293',
      productName: 'Riz Basmati Parfumé (5kg)',
      type: 'Entrée',
      quantity: 150,
      user: 'Gestionnaire de Stock',
      observation: 'Livraison bon de commande Sodipal S.A. #PO-301.',
    },
  ]);

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([
    {
      id: 'PO-301',
      supplier: 'Sodipal S.A.',
      date: '2026-07-01',
      status: 'Livré',
      totalAmount: 450000,
      itemsCount: 1,
      items: [{ sku: 'ALM-10293', name: 'Riz Basmati Parfumé (5kg)', quantity: 150 }],
    },
    {
      id: 'PO-302',
      supplier: 'Global Tech Dist.',
      date: '2026-06-28',
      status: 'Livré',
      totalAmount: 1850000,
      itemsCount: 2,
      items: [
        { sku: 'ELC-29381', name: 'Smartphone Galaxy S24 Ultra', quantity: 20 },
        { sku: 'ELC-38291', name: 'Écouteurs Sans Fil Pro', quantity: 50 },
      ],
    },
  ]);

  const [inventoryHistory, setInventoryHistory] = useState<InventoryReport[]>([
    {
      id: 'INV-201',
      date: '2026-06-30',
      title: 'Inventaire Physique Fin de Mois de Juin',
      manager: 'Gestionnaire de Stock',
      discrepanciesCount: 1,
      itemsAudited: 4,
      items: [
        {
          sku: 'ALM-10293',
          name: 'Riz Basmati Parfumé (5kg)',
          expected: 200,
          measured: 198,
          diff: -2,
        },
      ],
    },
  ]);

  // Enrich global products with minStock, maxStock and helper attributes
  const enrichedProducts: EnrichedProduct[] = useMemo(() => {
    return products.map((p) => {
      // Find minStock and maxStock based on SKU conventions
      const isElectronique = p.category === 'Électronique';
      const isAlimentation = p.category === 'Alimentation';

      const minStock = isElectronique ? 10 : isAlimentation ? 30 : 15;
      const maxStock = isElectronique ? 100 : isAlimentation ? 500 : 200;
      const purchasePrice = Math.round(p.price * 0.65);
      const supplierName = isElectronique
        ? 'Global Tech Dist.'
        : isAlimentation
        ? 'Sodipal S.A.'
        : 'ElectroPlus SARL';

      return {
        ...p,
        minStock,
        maxStock,
        purchasePrice,
        supplierName,
        active: p.active !== undefined ? p.active : true,
      };
    });
  }, [products]);

  // Handle direct movement callback from children
  const handleAddMovement = (newMov: StockMovement) => {
    setMovements((prev) => [newMov, ...prev]);
  };

  // Triggered when clicking "Réapprovisionner" on StockHealth view
  const triggerReplenishment = (productSku: string) => {
    setPreSelectedSku(productSku);
    setActiveTab('receptions');
  };

  return (
    <div className="pt-24 px-8 pb-12 w-full min-h-screen font-sans animate-fade-in bg-brand-bg">
      {/* Upper Module Info Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-brand-border pb-6 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-primary text-[28px]">warehouse</span>
            <h2 className="text-3xl font-extrabold text-brand-text tracking-tight font-sans">
              SmartStock ERP — Gestion de Stock
            </h2>
          </div>
          <p className="text-brand-muted text-xs mt-1.5 font-medium">
            Entrepôt Central (DC-01) • Mode : <span className="text-emerald-600 font-bold">Hors-ligne activé (Offline First)</span> • Opérateur : <span className="text-indigo-950 font-bold">{currentUser.name} ({currentUser.role})</span>
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full font-bold text-[10px] tracking-wide uppercase border border-indigo-100 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">cloud_done</span>
            Données Synchronisées (Supabase)
          </span>
        </div>
      </div>

      {/* Active Tab Screen Render */}
      {(() => {
        const resolvedActiveTab = (activeTab === 'products' && activeSubTab === 'categories')
          ? 'categories'
          : (activeTab === 'products' && activeSubTab === 'suppliers')
            ? 'suppliers'
            : activeTab;

        return (
          <div className="transition-all duration-300">
            {resolvedActiveTab === 'dashboard' && (
              <DashboardTab
                products={enrichedProducts}
                movements={movements}
                categories={categories}
                suppliers={suppliers}
                onNavigateToTab={(tabName) => setActiveTab(tabName as any)}
                activeSubTab={activeSubTab}
                setActiveSubTab={setActiveSubTab}
              />
            )}

            {resolvedActiveTab === 'products' && (
              <ProductsTab
                products={enrichedProducts}
                setProducts={setProducts}
                categories={categories}
                suppliers={suppliers}
                onAddMovement={handleAddMovement}
                currentUser={currentUser}
                globallySelectedSku={globallySelectedSku}
                onClearGloballySelectedSku={onClearGloballySelectedSku}
                activeSubTab={activeSubTab}
                setActiveSubTab={setActiveSubTab}
                movements={movements}
              />
            )}

            {resolvedActiveTab === 'categories' && (
              <CategoriesTab
                categories={categories}
                setCategories={setCategories}
                products={enrichedProducts}
              />
            )}

            {resolvedActiveTab === 'suppliers' && (
              <SuppliersTab
                suppliers={suppliers}
                setSuppliers={setSuppliers}
                products={enrichedProducts}
              />
            )}

            {resolvedActiveTab === 'health' && (
              <StockStateTab
                products={enrichedProducts}
                onTriggerReplenishment={triggerReplenishment}
              />
            )}

            {resolvedActiveTab === 'receptions' && (
              <ReceptionsTab
                suppliers={suppliers}
                products={enrichedProducts}
                setProducts={setProducts}
                purchaseOrders={purchaseOrders}
                setPurchaseOrders={setPurchaseOrders}
                onAddMovement={handleAddMovement}
                currentUser={currentUser}
                preSelectedSku={preSelectedSku}
                onClearPreSelectedSku={() => setPreSelectedSku(undefined)}
                activeSubTab={activeSubTab}
                setActiveSubTab={setActiveSubTab}
              />
            )}

            {resolvedActiveTab === 'movements' && (
              <MovementsTab
                movements={movements}
                activeSubTab={activeSubTab}
                setActiveSubTab={setActiveSubTab}
              />
            )}

            {resolvedActiveTab === 'inventories' && (
              <InventoriesTab
                products={enrichedProducts}
                setProducts={setProducts}
                inventoryHistory={inventoryHistory}
                setInventoryHistory={setInventoryHistory}
                onAddMovement={handleAddMovement}
                currentUser={currentUser}
                activeSubTab={activeSubTab}
                setActiveSubTab={setActiveSubTab}
              />
            )}

            {resolvedActiveTab === 'reports' && (
              <ReportsTab
                products={enrichedProducts}
                activeSubTab={activeSubTab}
                setActiveSubTab={setActiveSubTab}
              />
            )}

            {resolvedActiveTab === 'profile' && (
              <ProfileTab
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                accounts={accounts}
                setAccounts={setAccounts}
              />
            )}

            {resolvedActiveTab === 'settings' && (
              <SettingsTab
                currentUser={currentUser}
              />
            )}
          </div>
        );
      })()}
    </div>
  );
};
