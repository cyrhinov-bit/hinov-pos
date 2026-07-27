import React, { useState, useMemo } from 'react';
import { EnrichedProduct, StockMovement, InventoryReport } from './types';

interface InventoriesTabProps {
  products: EnrichedProduct[];
  setProducts: React.Dispatch<React.SetStateAction<any[]>>;
  inventoryHistory: InventoryReport[];
  setInventoryHistory: React.Dispatch<React.SetStateAction<InventoryReport[]>>;
  onAddMovement: (newMov: StockMovement) => void;
  currentUser: any;
  activeSubTab?: string;
  setActiveSubTab?: (subTab: string) => void;
}

export const InventoriesTab: React.FC<InventoriesTabProps> = ({
  products,
  setProducts,
  inventoryHistory,
  setInventoryHistory,
  onAddMovement,
  currentUser,
  activeSubTab,
  setActiveSubTab,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [auditCategory, setAuditCategory] = useState('Tous');
  const [title, setTitle] = useState('');
  
  // Local state for current inventory items being counted
  const [countedItems, setCountedItems] = useState<{ [sku: string]: number }>({});

  // Handle activeSubTab side-clicks
  React.useEffect(() => {
    if (!activeSubTab) return;
    if (activeSubTab === 'new') {
      const counts: { [sku: string]: number } = {};
      products.forEach((p) => {
        counts[p.sku] = p.stock || 0;
      });
      setCountedItems(counts);
      setTitle(`Inventaire du ${new Date().toLocaleDateString('fr-FR')} - Tous`);
      setAuditCategory('Tous');
      setShowForm(true);
      if (setActiveSubTab) {
        setActiveSubTab('ongoing');
      }
    } else if (activeSubTab === 'completed' || activeSubTab === 'history') {
      setShowForm(false);
    }
  }, [activeSubTab, products, setActiveSubTab]);

  // Filter history based on activeSubTab ('completed' / 'discrepancies' / 'history')
  const displayedHistory = useMemo(() => {
    if (activeSubTab === 'discrepancies') {
      return inventoryHistory.filter((report) => report.discrepanciesCount > 0);
    }
    return inventoryHistory;
  }, [inventoryHistory, activeSubTab]);

  const categoriesList = useMemo(() => {
    const list = new Set<string>();
    products.forEach((p) => list.add(p.category));
    return Array.from(list);
  }, [products]);

  // Filter items for current active audit
  const activeAuditProducts = useMemo(() => {
    return products.filter((p) => auditCategory === 'Tous' || p.category === auditCategory);
  }, [products, auditCategory]);

  const handleStartInventory = () => {
    // Pre-populate measured counts with current theoretical quantities as default
    const counts: { [sku: string]: number } = {};
    products.forEach((p) => {
      counts[p.sku] = p.stock || 0;
    });
    setCountedItems(counts);
    setTitle(`Inventaire du ${new Date().toLocaleDateString('fr-FR')} - ${auditCategory}`);
    setShowForm(true);
  };

  const handleCountChange = (sku: string, value: number) => {
    setCountedItems((prev) => ({
      ...prev,
      [sku]: value,
    }));
  };

  const handleValidateInventory = (e: React.FormEvent) => {
    e.preventDefault();

    const adjustments: { sku: string; name: string; expected: number; measured: number; diff: number }[] = [];
    let absoluteDiscrepancyCount = 0;

    activeAuditProducts.forEach((p) => {
      const theoretical = p.stock || 0;
      const measured = countedItems[p.sku] ?? theoretical;
      const diff = measured - theoretical;

      adjustments.push({
        sku: p.sku,
        name: p.name,
        expected: theoretical,
        measured,
        diff,
      });

      if (diff !== 0) {
        absoluteDiscrepancyCount++;

        // 1. Update primary stocks
        setProducts((prev) =>
          prev.map((item) => (item.sku === p.sku ? { ...item, stock: measured } : item))
        );

        // 2. Generate and store adjustments in the traceability logs
        onAddMovement({
          id: `MOV-ADJ-${Date.now().toString().slice(-3)}-${Math.floor(Math.random() * 90 + 10)}`,
          date: new Date().toISOString().split('T')[0],
          hour: new Date().toLocaleTimeString('fr-FR', { hour12: false }).slice(0, 5),
          productSku: p.sku,
          productName: p.name,
          type: 'Ajustement',
          quantity: diff,
          user: currentUser.name,
          observation: `Ajustement inventaire physique - Constaté: ${measured} (Théorique: ${theoretical})`,
        });
      }
    });

    // Create persistent inventory report
    const newReport: InventoryReport = {
      id: `INV-${Date.now().toString().slice(-3)}`,
      date: new Date().toISOString().split('T')[0],
      title: title || 'Ajustement global de stock physique',
      manager: currentUser.name,
      discrepanciesCount: absoluteDiscrepancyCount,
      itemsAudited: activeAuditProducts.length,
      items: adjustments,
    };

    setInventoryHistory((prev) => [newReport, ...prev]);
    setShowForm(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900 font-sans">Inventaires & Ajustements</h3>
          <p className="text-xs text-gray-500">Menez des audits d'inventaire, confrontez le stock réel au stock théorique et appliquez les ajustements</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setAuditCategory('Tous');
              handleStartInventory();
            }}
            className="px-5 py-2.5 bg-[#3525cd] text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-[#4f46e5] flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">rule</span>
            Lancer un Inventaire Physique
          </button>
        )}
      </div>

      {/* Main active work screen or history list */}
      {showForm ? (
        <div className="bg-white rounded-3xl border border-[#c7c4d8]/40 shadow-lg p-6 space-y-6 animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-start pb-4 border-b border-gray-100">
            <div>
              <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider">Audit en Cours</span>
              <h4 className="text-lg font-bold text-gray-900 mt-1">Conduite de l'Inventaire de Terrain</h4>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs text-gray-400 hover:text-gray-600 font-bold"
            >
              Annuler
            </button>
          </div>

          <form onSubmit={handleValidateInventory} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-600 uppercase">Intitulé de l'Inventaire</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-600 uppercase">Filtrer par Catégorie</label>
                <select
                  value={auditCategory}
                  onChange={(e) => setAuditCategory(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-[#3525cd]"
                >
                  <option value="Tous">Toutes les Catégories</option>
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Verification Table */}
            <div className="border border-[#c7c4d8]/20 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                    <tr className="border-b border-[#c7c4d8]/10">
                      <th className="px-6 py-3">Article</th>
                      <th className="px-6 py-3">SKU</th>
                      <th className="px-6 py-3 text-center">Stock Théorique (Système)</th>
                      <th className="px-6 py-3 text-center w-40">Stock Physique Constaté</th>
                      <th className="px-6 py-3 text-center">Écart (Calculé)</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {activeAuditProducts.map((p) => {
                      const expected = p.stock || 0;
                      const measured = countedItems[p.sku] ?? expected;
                      const diff = measured - expected;

                      return (
                        <tr key={p.sku} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-8 h-8 object-cover rounded-lg"
                                referrerPolicy="no-referrer"
                              />
                              <span className="font-bold text-gray-800">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 font-mono text-gray-500">{p.sku}</td>
                          <td className="px-6 py-3 text-center font-extrabold text-gray-900">{expected}</td>
                          <td className="px-6 py-3 text-center">
                            <input
                              type="number"
                              required
                              min="0"
                              value={measured}
                              onChange={(e) => handleCountChange(p.sku, Number(e.target.value))}
                              className="w-24 px-2 py-1 text-xs border border-gray-200 rounded-lg text-center font-bold focus:outline-none focus:border-[#3525cd]"
                            />
                          </td>
                          <td className="px-6 py-3 text-center">
                            {diff === 0 ? (
                              <span className="text-gray-400 font-bold">-</span>
                            ) : diff > 0 ? (
                              <span className="text-emerald-600 font-extrabold">+{diff} (Excédent)</span>
                            ) : (
                              <span className="text-[#ba1a1a] font-extrabold">{diff} (Déficit)</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Validation */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#3525cd] text-white rounded-xl text-xs font-bold hover:bg-[#4f46e5]"
              >
                Valider l'ajustement & Corriger le Stock
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#c7c4d8]/40 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h4 className="font-bold text-sm text-gray-900">Historique des Audits Validés</h4>
            <span className="text-xs text-gray-400 font-semibold">{inventoryHistory.length} rapports clos</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                <tr className="border-b border-[#c7c4d8]/20">
                  <th className="px-6 py-4">Numéro d'Audit</th>
                  <th className="px-6 py-4">Date de Validation</th>
                  <th className="px-6 py-4">Intitulé de l'inventaire</th>
                  <th className="px-6 py-4">Responsable de l'Audit</th>
                  <th className="px-6 py-4 text-center">Lignes contrôlées</th>
                  <th className="px-6 py-4 text-center">Ajustements Appliqués</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {displayedHistory.length > 0 ? (
                  displayedHistory.map((report) => (
                    <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-all">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                          {report.id}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-semibold">{report.date}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{report.title}</td>
                      <td className="px-6 py-4 font-bold text-gray-700">{report.manager}</td>
                      <td className="px-6 py-4 text-center font-bold text-gray-600">{report.itemsAudited} items</td>
                      <td className="px-6 py-4 text-center">
                        {report.discrepanciesCount === 0 ? (
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-extrabold rounded-full uppercase tracking-wider">
                            Stock Parfait
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-extrabold rounded-full uppercase tracking-wider">
                            {report.discrepanciesCount} Corrections
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-xs text-gray-400">
                      Aucun historique d'inventaire enregistré.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
