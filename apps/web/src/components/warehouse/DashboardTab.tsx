import React from 'react';
import { EnrichedProduct, StockMovement } from './types';

interface DashboardTabProps {
  products: EnrichedProduct[];
  movements: StockMovement[];
  onCardClick?: (tabName: 'products' | 'categories' | 'suppliers' | 'stock' | 'receptions' | 'movements' | 'inventories' | 'reports') => void;
  onNavigateToTab?: (tabName: 'products' | 'categories' | 'suppliers' | 'stock' | 'receptions' | 'movements' | 'inventories' | 'reports' | 'dashboard' | 'health') => void;
  todayReceptionsCount?: number;
  activeSubTab?: string;
  setActiveSubTab?: (subTab: string) => void;
  categories?: any[];
  suppliers?: any[];
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  products,
  movements,
  onCardClick,
  onNavigateToTab,
  todayReceptionsCount = 0,
  activeSubTab = 'overview',
  setActiveSubTab,
  categories = [],
  suppliers = [],
}) => {
  const handleNavigate = (tab: any) => {
    if (onNavigateToTab) onNavigateToTab(tab);
    else if (onCardClick) onCardClick(tab);
  };

  const totalProductsCount = products.length;
  const totalStockQuantity = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const totalStockValue = products.reduce((acc, p) => acc + ((p.stock || 0) * (p.purchasePrice || p.price * 0.6)), 0);
  
  const outOfStockCount = products.filter((p) => (p.stock || 0) === 0).length;
  const lowStockCount = products.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) < (p.minStock || 15)).length;
  const todayMovementsCount = movements.filter(
    (m) => m.date === new Date().toISOString().split('T')[0]
  ).length;

  const actualTodayReceptionsCount = todayReceptionsCount || movements.filter(
    (m) => m.type === 'Entrée' && m.date === new Date().toISOString().split('T')[0]
  ).length;

  // Static chart data helper
  const months = ['Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'];
  const trendData = [12000, 15000, 14200, 18500, 19400, totalStockQuantity];
  const insOutsData = [
    { in: 140, out: 120 },
    { in: 180, out: 150 },
    { in: 110, out: 160 },
    { in: 220, out: 190 },
    { in: 240, out: 170 },
    { in: 310, out: 240 },
  ];

  // Calculate product distribution per category
  const categoriesMap: { [key: string]: number } = {};
  products.forEach((p) => {
    categoriesMap[p.category] = (categoriesMap[p.category] || 0) + 1;
  });
  const categorySummary = Object.entries(categoriesMap).map(([name, count]) => ({
    name,
    count,
    percentage: Math.round((count / (products.length || 1)) * 100),
  })).sort((a, b) => b.count - a.count);

  // --- SUBTAB: ALERTS VIEW ---
  if (activeSubTab === 'alerts') {
    const alertedProducts = products.filter(
      (p) => (p.stock || 0) === 0 || (p.stock || 0) < (p.minStock || 15)
    );

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900">Alertes & Seuils de Stock</h3>
          <p className="text-xs text-gray-500">Articles en rupture de stock ou ayant franchi leur seuil critique d'approvisionnement</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <span className="material-symbols-outlined text-2xl">cancel</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Ruptures Totales</p>
              <h4 className="text-2xl font-black text-gray-900 mt-0.5">{outOfStockCount}</h4>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Stocks Faibles</p>
              <h4 className="text-2xl font-black text-gray-900 mt-0.5">{lowStockCount}</h4>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-[#3525cd] rounded-xl">
              <span className="material-symbols-outlined text-2xl">gpp_maybe</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Taux de Disponibilité</p>
              <h4 className="text-2xl font-black text-gray-900 mt-0.5">
                {Math.round(((products.length - outOfStockCount) / (products.length || 1)) * 100)}%
              </h4>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#c7c4d8]/40 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h4 className="font-bold text-sm text-gray-900">Liste des Articles sous Alerte</h4>
            <span className="px-3 py-1 bg-amber-50 border border-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
              {alertedProducts.length} articles à réapprovisionner
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-wider bg-gray-50/30">
                  <th className="py-3 px-6">Réf SKU</th>
                  <th className="py-3 px-6">Désignation</th>
                  <th className="py-3 px-6">Catégorie</th>
                  <th className="py-3 px-6 text-center">Stock Actuel</th>
                  <th className="py-3 px-6 text-center">Seuil Min</th>
                  <th className="py-3 px-6 text-center">Statut</th>
                  <th className="py-3 px-6 text-center">Action rapide</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {alertedProducts.map((p) => {
                  const isRupture = (p.stock || 0) === 0;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-all">
                      <td className="py-3 px-6 font-mono font-bold text-gray-900">{p.sku}</td>
                      <td className="py-3 px-6 font-semibold text-gray-800">{p.name}</td>
                      <td className="py-3 px-6 text-gray-500">{p.category}</td>
                      <td className="py-3 px-6 text-center font-extrabold text-gray-900">
                        <span className={isRupture ? 'text-red-600' : 'text-amber-600'}>
                          {p.stock || 0}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center text-gray-500">{p.minStock || 15}</td>
                      <td className="py-3 px-6 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                          isRupture ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {isRupture ? 'Rupture' : 'Stock Faible'}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <button
                          onClick={() => handleNavigate('receptions')}
                          className="px-3 py-1.5 bg-[#3525cd] hover:bg-[#4f46e5] text-white rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all cursor-pointer"
                        >
                          Commander
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {alertedProducts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400 font-semibold">
                      <span className="material-symbols-outlined text-4xl block mb-2 text-emerald-400">check_circle</span>
                      Aucune alerte en cours ! Tous les stocks sont au-dessus de leur seuil minimal.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // --- SUBTAB: KPIS VIEW ---
  if (activeSubTab === 'kpis') {
    const averageValue = totalProductsCount > 0 ? totalStockValue / totalProductsCount : 0;
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900">Analyses & Ratios Opérationnels</h3>
          <p className="text-xs text-gray-500">Indicateurs clés de performance logistique et valorisation globale</p>
        </div>

        {/* Primary KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#c7c4d8]/40 shadow-sm">
            <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">Valeur d'Achat du Stock</p>
            <h4 className="text-2xl font-black text-gray-900 mt-1">{totalStockValue.toLocaleString('fr-FR')} F</h4>
            <p className="text-[10px] text-gray-500 mt-2">Valorisation financière active</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#c7c4d8]/40 shadow-sm">
            <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">Valeur Moyenne par Référence</p>
            <h4 className="text-2xl font-black text-[#3525cd] mt-1">{Math.round(averageValue).toLocaleString('fr-FR')} F</h4>
            <p className="text-[10px] text-gray-500 mt-2">Calculé sur {totalProductsCount} fiches produits</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#c7c4d8]/40 shadow-sm">
            <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">Unités Totales</p>
            <h4 className="text-2xl font-black text-gray-900 mt-1">{totalStockQuantity.toLocaleString('fr-FR')}</h4>
            <p className="text-[10px] text-gray-500 mt-2">Unités physiques entreposées</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#c7c4d8]/40 shadow-sm">
            <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">Couverture de Stock Moyenne</p>
            <h4 className="text-2xl font-black text-emerald-600 mt-1">45 Jours</h4>
            <p className="text-[10px] text-gray-500 mt-2">Projection basée sur la rotation</p>
          </div>
        </div>

        {/* Detailed KPI Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-[#c7c4d8]/40 shadow-sm">
            <h4 className="font-bold text-sm text-gray-900 mb-4">Analyse de Rentabilité & Occupation</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-5 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl space-y-2">
                <h5 className="text-xs font-bold text-[#3525cd]">Taux de rotation annuel</h5>
                <p className="text-2xl font-black text-indigo-950">8.2x</p>
                <p className="text-[11px] text-gray-500">Moyenne de renouvellement complet de nos stocks par an (cible ERP : {'>'} 6.0x).</p>
              </div>

              <div className="p-5 bg-sky-50/50 border border-sky-100/50 rounded-2xl space-y-2">
                <h5 className="text-xs font-bold text-sky-700">Taux d'occupation de l'entrepôt</h5>
                <p className="text-2xl font-black text-sky-950">64.5%</p>
                <p className="text-[11px] text-gray-500">Occupation volumétrique de la zone de picking centralisée DC-01 (Seuil critique : 85%).</p>
              </div>

              <div className="p-5 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl space-y-2">
                <h5 className="text-xs font-bold text-emerald-700">Fiabilité d'inventaire</h5>
                <p className="text-2xl font-black text-emerald-950">99.4%</p>
                <p className="text-[11px] text-gray-500">Écart constaté lors du dernier rapprochement d'audit physique de stock.</p>
              </div>

              <div className="p-5 bg-purple-50/50 border border-purple-100/50 rounded-2xl space-y-2">
                <h5 className="text-xs font-bold text-purple-700">Taux de Service Client</h5>
                <p className="text-2xl font-black text-purple-950">97.8%</p>
                <p className="text-[11px] text-gray-500">Commandes de vente honorées sans retard dû à une rupture de stock interne.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-[#c7c4d8]/40 shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm text-gray-900 mb-1">Qualité Globale</h4>
              <p className="text-xs text-gray-500 mb-6">Score de conformité logistique</p>
            </div>
            
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-gray-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-[#3525cd]" strokeWidth="3.2" strokeDasharray="95, 100" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="text-center">
                  <span className="text-2xl font-black text-gray-900">A+</span>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">95% score</p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 text-center italic">
              "L'entrepôt maintient des performances excellentes ce mois-ci."
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- SUBTAB: ACTIVITIES VIEW ---
  if (activeSubTab === 'activities') {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900">Flux d'activités & Traçabilité</h3>
          <p className="text-xs text-gray-500">Journal d'audit-trail continu de toutes les actions d'inventaire physique</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#c7c4d8]/40 shadow-sm overflow-hidden p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-sm text-gray-900">Historique Complet de Session</h4>
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-[#3525cd] rounded-full text-[10px] font-bold">
              {movements.length} opérations au total
            </span>
          </div>

          <div className="space-y-6 relative before:content-[''] before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-gray-100">
            {movements.map((mov) => (
              <div key={mov.id} className="flex gap-4 items-start pl-8 relative group">
                <div
                  className={`w-3 h-3 rounded-full absolute left-2 top-1.5 border-2 border-white ring-2 transition-all group-hover:scale-125 ${
                    mov.type === 'Entrée'
                      ? 'bg-emerald-500 ring-emerald-100'
                      : mov.type === 'Sortie'
                      ? 'bg-sky-400 ring-sky-100'
                      : 'bg-amber-500 ring-amber-100'
                  }`}
                ></div>
                <div className="flex-1 bg-gray-50/50 hover:bg-gray-50 p-4 rounded-2xl border border-gray-100/40 transition-all">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide ${
                      mov.type === 'Entrée' ? 'bg-emerald-50 text-emerald-700' : mov.type === 'Sortie' ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {mov.type}
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold">{mov.date} • {mov.hour}</span>
                  </div>
                  <h5 className="text-xs font-extrabold text-gray-900 mt-2">
                    {mov.productName} <span className="text-[10px] text-gray-400 font-mono font-bold">({mov.productSku})</span>
                  </h5>
                  <p className="text-xs text-gray-600 mt-1 leading-snug">
                    {mov.observation}. <span className="font-bold text-gray-900">Quantité impactée : {mov.type === 'Entrée' ? '+' : '-'}{mov.quantity}</span>.
                  </p>
                  <p className="text-[10px] text-gray-400 mt-2 font-medium">Opérateur : {mov.user}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- SUBTAB: ACTIONS VIEW ---
  if (activeSubTab === 'actions') {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900">Actions Rapides & Opérations</h3>
          <p className="text-xs text-gray-500">Raccourcis intelligents pour exécuter les tâches logistiques quotidiennes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            onClick={() => handleNavigate('products')}
            className="bg-white p-6 rounded-3xl border border-[#c7c4d8]/40 shadow-sm hover:border-[#3525cd] transition-all cursor-pointer group"
          >
            <div className="p-3 bg-indigo-50 text-[#3525cd] rounded-xl w-fit mb-4">
              <span className="material-symbols-outlined text-2xl">add</span>
            </div>
            <h4 className="font-bold text-sm text-gray-900 group-hover:text-[#3525cd] transition-all">Ajouter un nouveau produit</h4>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Enregistrez une nouvelle fiche article avec prix d'achat, seuils d'alerte, codes-barres et distributeur principal.
            </p>
          </div>

          <div
            onClick={() => handleNavigate('receptions')}
            className="bg-white p-6 rounded-3xl border border-[#c7c4d8]/40 shadow-sm hover:border-[#3525cd] transition-all cursor-pointer group"
          >
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit mb-4">
              <span className="material-symbols-outlined text-2xl">local_shipping</span>
            </div>
            <h4 className="font-bold text-sm text-gray-900 group-hover:text-[#3525cd] transition-all">Nouvelle livraison fournisseur</h4>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Enregistrez un bon de livraison, mettez à jour les stocks et générez automatiquement les logs d'entrées.
            </p>
          </div>

          <div
            onClick={() => handleNavigate('inventories')}
            className="bg-white p-6 rounded-3xl border border-[#c7c4d8]/40 shadow-sm hover:border-[#3525cd] transition-all cursor-pointer group"
          >
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl w-fit mb-4">
              <span className="material-symbols-outlined text-2xl">fact_check</span>
            </div>
            <h4 className="font-bold text-sm text-gray-900 group-hover:text-[#3525cd] transition-all">Démarrer un audit physique</h4>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Comparez les quantités théoriques avec les comptages réels, ajustez le grand livre et enregistrez les écarts de stock.
            </p>
          </div>

          <div
            onClick={() => handleNavigate('reports')}
            className="bg-white p-6 rounded-3xl border border-[#c7c4d8]/40 shadow-sm hover:border-[#3525cd] transition-all cursor-pointer group"
          >
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl w-fit mb-4">
              <span className="material-symbols-outlined text-2xl">analytics</span>
            </div>
            <h4 className="font-bold text-sm text-gray-900 group-hover:text-[#3525cd] transition-all">Valorisation de stock</h4>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Consultez les bilans financiers d'achats, estimez la marge bénéficiaire théorique et téléchargez un tableur d'audit.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- SUBTAB: OVERVIEW VIEW (DEFAULT) ---
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {/* Total Products */}
        <div
          onClick={() => handleNavigate('products')}
          className="bg-white p-5 rounded-2xl border border-[#c7c4d8]/40 shadow-sm cursor-pointer hover:border-[#3525cd] transition-all group"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-indigo-50 text-[#3525cd] rounded-xl">
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            </div>
            <span className="text-gray-400 text-[10px] font-bold">ERP-01</span>
          </div>
          <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">Produits</p>
          <h4 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-none mt-1 group-hover:text-[#3525cd]">
            {totalProductsCount}
          </h4>
          <p className="text-[10px] text-gray-500 mt-2 font-medium">Fiches actives</p>
        </div>

        {/* Total Stock Qty */}
        <div
          onClick={() => handleNavigate('products')}
          className="bg-white p-5 rounded-2xl border border-[#c7c4d8]/40 shadow-sm cursor-pointer hover:border-[#3525cd] transition-all group"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <span className="material-symbols-outlined text-[18px]">widgets</span>
            </div>
            <span className="text-emerald-600 text-[10px] font-bold flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[12px]">trending_up</span>
              +5%
            </span>
          </div>
          <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">Qté Stock</p>
          <h4 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-none mt-1">
            {totalStockQuantity.toLocaleString('fr-FR')}
          </h4>
          <p className="text-[10px] text-gray-500 mt-2 font-medium">Unités stockées</p>
        </div>

        {/* Total Stock Value */}
        <div
          onClick={() => handleNavigate('reports')}
          className="bg-white p-5 rounded-2xl border border-[#c7c4d8]/40 shadow-sm cursor-pointer hover:border-[#3525cd] transition-all group"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </div>
            <span className="text-gray-400 text-[10px] font-bold">Valorisé</span>
          </div>
          <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">Valeur Stock</p>
          <h4 className="text-xl font-extrabold text-gray-900 tracking-tight leading-none mt-1 truncate">
            {totalStockValue.toLocaleString('fr-FR')} <span className="text-xs">F</span>
          </h4>
          <p className="text-[10px] text-gray-500 mt-2 font-medium">Coût de revient d'achat</p>
        </div>

        {/* Out of Stock */}
        <div
          onClick={() => {
            if (setActiveSubTab) {
              setActiveSubTab('alerts');
            } else {
              handleNavigate('products');
            }
          }}
          className={`p-5 rounded-2xl border shadow-sm cursor-pointer transition-all group ${
            outOfStockCount > 0 ? 'bg-red-50/40 border-red-200 hover:border-red-400' : 'bg-white border-[#c7c4d8]/40'
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <div className={`p-2.5 rounded-xl ${outOfStockCount > 0 ? 'bg-red-100 text-[#ba1a1a]' : 'bg-gray-50 text-gray-500'}`}>
              <span className="material-symbols-outlined text-[18px]">cancel</span>
            </div>
            {outOfStockCount > 0 && (
              <span className="text-[#ba1a1a] text-[9px] font-extrabold uppercase tracking-widest">Alerte</span>
            )}
          </div>
          <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">En Rupture</p>
          <h4 className={`text-2xl font-extrabold mt-1 leading-none ${outOfStockCount > 0 ? 'text-[#ba1a1a]' : 'text-gray-900'}`}>
            {outOfStockCount}
          </h4>
          <p className="text-[10px] text-gray-500 mt-2 font-medium">Articles indisponibles</p>
        </div>

        {/* Low Stock Alert */}
        <div
          onClick={() => {
            if (setActiveSubTab) {
              setActiveSubTab('alerts');
            } else {
              handleNavigate('products');
            }
          }}
          className={`p-5 rounded-2xl border shadow-sm cursor-pointer transition-all group ${
            lowStockCount > 0 ? 'bg-amber-50/40 border-amber-200 hover:border-amber-400' : 'bg-white border-[#c7c4d8]/40'
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <div className={`p-2.5 rounded-xl ${lowStockCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-50 text-gray-500'}`}>
              <span className="material-symbols-outlined text-[18px]">warning</span>
            </div>
            {lowStockCount > 0 && (
              <span className="text-amber-700 text-[9px] font-extrabold uppercase tracking-widest">Faible</span>
            )}
          </div>
          <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">Stock Faible</p>
          <h4 className={`text-2xl font-extrabold mt-1 leading-none ${lowStockCount > 0 ? 'text-amber-700' : 'text-gray-900'}`}>
            {lowStockCount}
          </h4>
          <p className="text-[10px] text-gray-500 mt-2 font-medium">Sous le seuil min</p>
        </div>

        {/* Receptions of Day */}
        <div
          onClick={() => handleNavigate('receptions')}
          className="bg-white p-5 rounded-2xl border border-[#c7c4d8]/40 shadow-sm cursor-pointer hover:border-[#3525cd] transition-all group"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
              <span className="material-symbols-outlined text-[18px]">local_shipping</span>
            </div>
            <span className="text-gray-400 text-[10px] font-bold">Jour</span>
          </div>
          <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">Réceptions</p>
          <h4 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-none mt-1">
            {actualTodayReceptionsCount}
          </h4>
          <p className="text-[10px] text-gray-500 mt-2 font-medium">Livraisons du jour</p>
        </div>

        {/* Movements of Day */}
        <div
          onClick={() => handleNavigate('movements')}
          className="bg-white p-5 rounded-2xl border border-[#c7c4d8]/40 shadow-sm cursor-pointer hover:border-[#3525cd] transition-all group"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <span className="material-symbols-outlined text-[18px]">sync_alt</span>
            </div>
            <span className="text-gray-400 text-[10px] font-bold">Logs</span>
          </div>
          <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">Mouvements</p>
          <h4 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-none mt-1">
            {todayMovementsCount}
          </h4>
          <p className="text-[10px] text-gray-500 mt-2 font-medium">Opérations du jour</p>
        </div>
      </div>

      {/* Graphs Layout Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Trend Area Chart (SVG based for high rendering reliability) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-[#c7c4d8]/40 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h4 className="font-bold text-base text-gray-900">Évolution Globale du Stock</h4>
              <span className="text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full font-semibold">Semestriel</span>
            </div>
            <p className="text-xs text-gray-500 mb-6">Volume total d'unités stockées en temps réel</p>
          </div>

          <div className="relative h-48 w-full mt-4">
            <svg viewBox="0 0 500 180" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3525cd" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#3525cd" stopOpacity="0.0"/>
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f0f7" strokeWidth="1" strokeDasharray="3"/>
              <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f0f7" strokeWidth="1" strokeDasharray="3"/>
              <line x1="0" y1="130" x2="500" y2="130" stroke="#f1f0f7" strokeWidth="1" strokeDasharray="3"/>

              {/* Area path */}
              <path
                d={`M 10 160 Q 100 120, 100 120 T 190 130 T 280 80 T 370 60 T 490 30 L 490 160 Z`}
                fill="url(#gradient-area)"
              />

              {/* Line path */}
              <path
                d={`M 10 160 Q 100 120, 100 120 T 190 130 T 280 80 T 370 60 T 490 30`}
                fill="none"
                stroke="#3525cd"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Data points */}
              <circle cx="10" cy="160" r="5" fill="#3525cd" stroke="#fff" strokeWidth="1.5" />
              <circle cx="100" cy="120" r="5" fill="#3525cd" stroke="#fff" strokeWidth="1.5" />
              <circle cx="190" cy="130" r="5" fill="#3525cd" stroke="#fff" strokeWidth="1.5" />
              <circle cx="280" cy="80" r="5" fill="#3525cd" stroke="#fff" strokeWidth="1.5" />
              <circle cx="370" cy="60" r="5" fill="#3525cd" stroke="#fff" strokeWidth="1.5" />
              <circle cx="490" cy="30" r="5" fill="#3525cd" stroke="#fff" strokeWidth="1.5" />
            </svg>
          </div>

          <div className="flex justify-between text-[11px] text-gray-500 font-bold uppercase mt-4 px-2 tracking-wider">
            {months.map((m, idx) => (
              <span key={idx}>{m}</span>
            ))}
          </div>
        </div>

        {/* Ins vs Outs Grouped Bar Chart */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-[#c7c4d8]/40 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h4 className="font-bold text-base text-gray-900">Entrées vs Sorties</h4>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#3525cd]">
                  <span className="w-2 h-2 bg-[#3525cd] rounded-full"></span> Entrées
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-sky-400">
                  <span className="w-2 h-2 bg-sky-400 rounded-full"></span> Sorties
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-6">Mouvements comparatifs de marchandises</p>
          </div>

          <div className="flex items-end justify-between h-48 gap-4 pt-2">
            {insOutsData.map((data, index) => (
              <div key={index} className="flex-1 flex items-end justify-center gap-1.5 h-full relative group">
                <div
                  className="w-3.5 bg-indigo-100 rounded-t-sm transition-all duration-300 hover:bg-[#3525cd]"
                  style={{ height: `${(data.in / 350) * 100}%` }}
                  title={`Entrées: ${data.in}`}
                ></div>
                <div
                  className="w-3.5 bg-sky-100 rounded-t-sm transition-all duration-300 hover:bg-sky-400"
                  style={{ height: `${(data.out / 350) * 100}%` }}
                  title={`Sorties: ${data.out}`}
                ></div>
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 font-semibold uppercase">
                  {months[index]}
                </span>
              </div>
            ))}
          </div>
          <div className="h-4"></div>
        </div>
      </div>

      {/* Row with Categories & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Categories Share Progress Bars */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#c7c4d8]/40 shadow-sm">
          <h4 className="font-bold text-base text-gray-900 mb-1">Répartition par Catégorie</h4>
          <p className="text-xs text-gray-500 mb-6">Densité de références par classification ERP</p>

          <div className="space-y-4">
            {categorySummary.slice(0, 5).map((cat, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-gray-800">{cat.name}</span>
                  <span className="text-gray-500 font-bold">{cat.count} réf ({cat.percentage}%)</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#3525cd] rounded-full transition-all duration-1000"
                    style={{
                      width: `${cat.percentage}%`,
                      opacity: 1 - idx * 0.15,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities Timeline */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#c7c4d8]/40 shadow-sm">
          <h4 className="font-bold text-base text-gray-900 mb-1">Activités de Stock Récentes</h4>
          <p className="text-xs text-gray-500 mb-6">Événements opérationnels enregistrés en temps réel</p>

          <div className="space-y-5 relative before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-gray-100">
            {movements.slice(0, 4).map((mov) => (
              <div key={mov.id} className="flex gap-4 items-start pl-7 relative">
                {/* Marker circle */}
                <div
                  className={`w-2.5 h-2.5 rounded-full absolute left-1.5 top-1.5 border-2 border-white ring-2 ${
                    mov.type === 'Entrée'
                      ? 'bg-emerald-500 ring-emerald-100'
                      : mov.type === 'Sortie'
                      ? 'bg-sky-400 ring-sky-100'
                      : 'bg-amber-500 ring-amber-100'
                  }`}
                ></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h5 className="text-xs font-bold text-gray-800">
                      {mov.type === 'Entrée' ? 'Arrivée de Marchandises' : mov.type === 'Sortie' ? 'Expédition Stock' : 'Ajustement Manuel'}
                    </h5>
                    <span className="text-[10px] text-gray-400 font-semibold">{mov.date} • {mov.hour}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 leading-snug">
                    <span className="font-semibold text-gray-800">{mov.productName}</span> : {mov.observation}.
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Opérateur : {mov.user}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
