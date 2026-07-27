import React, { useState } from 'react';
import { WarehouseSupplier, EnrichedProduct, StockMovement, PurchaseOrder } from './types';

interface ReceptionsTabProps {
  suppliers: WarehouseSupplier[];
  products: EnrichedProduct[];
  setProducts: React.Dispatch<React.SetStateAction<any[]>>;
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  onAddMovement: (newMov: StockMovement) => void;
  currentUser: any;
  preSelectedSku?: string;
  onClearPreSelectedSku?: () => void;
  activeSubTab?: string;
  setActiveSubTab?: (subTab: string) => void;
}

export const ReceptionsTab: React.FC<ReceptionsTabProps> = ({
  suppliers,
  products,
  setProducts,
  purchaseOrders,
  setPurchaseOrders,
  onAddMovement,
  currentUser,
  preSelectedSku,
  onClearPreSelectedSku,
  activeSubTab,
  setActiveSubTab,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [supplierName, setSupplierName] = useState('Global Tech Dist.');
  const [selectedItems, setSelectedItems] = useState<{ sku: string; quantity: number }[]>(() => {
    if (preSelectedSku) {
      return [{ sku: preSelectedSku, quantity: 50 }];
    }
    return [];
  });
  const [errorMsg, setErrorMsg] = useState('');

  // Handle activeSubTab 'new' trigger
  React.useEffect(() => {
    if (activeSubTab === 'new') {
      setSelectedItems([]);
      setShowCreateModal(true);
      if (setActiveSubTab) {
        setActiveSubTab('list');
      }
    }
  }, [activeSubTab, setActiveSubTab]);

  // Handle opening modal with pre-selection if applicable
  React.useEffect(() => {
    if (preSelectedSku) {
      setSupplierName('Global Tech Dist.');
      setSelectedItems([{ sku: preSelectedSku, quantity: 50 }]);
      setShowCreateModal(true);
      if (onClearPreSelectedSku) onClearPreSelectedSku();
    }
  }, [preSelectedSku]);

  const handleAddItem = () => {
    const firstProduct = products[0];
    if (firstProduct) {
      setSelectedItems((prev) => [...prev, { sku: firstProduct.sku, quantity: 10 }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'sku' | 'quantity', value: any) => {
    setSelectedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleValidateReception = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      setErrorMsg('Veuillez ajouter au moins un produit à la réception.');
      return;
    }

    if (selectedItems.some((item) => item.quantity <= 0)) {
      setErrorMsg('Toutes les quantités reçues doivent être supérieures à 0.');
      return;
    }

    // Process each item
    selectedItems.forEach((item) => {
      const prod = products.find((p) => p.sku === item.sku);
      if (prod) {
        // 1. Update available quantities in parent
        setProducts((prev) =>
          prev.map((p) => (p.sku === item.sku ? { ...p, stock: (p.stock || 0) + item.quantity } : p))
        );

        // 2. Generate stock movement
        onAddMovement({
          id: `MOV-${Date.now().toString().slice(-3)}-${Math.floor(Math.random() * 90 + 10)}`,
          date: new Date().toISOString().split('T')[0],
          hour: new Date().toLocaleTimeString('fr-FR', { hour12: false }).slice(0, 5),
          productSku: item.sku,
          productName: prod.name,
          type: 'Entrée',
          quantity: item.quantity,
          user: currentUser.name,
          observation: `Réception bon de livraison fournisseur - ${supplierName}`,
        });
      }
    });

    // Create a new purchase order representing this reception
    const totalCost = selectedItems.reduce((acc, item) => {
      const p = products.find((prod) => prod.sku === item.sku);
      const purchasePrice = p ? (p.purchasePrice || Math.round(p.price * 0.65)) : 1000;
      return acc + purchasePrice * item.quantity;
    }, 0);

    const newPO: PurchaseOrder = {
      id: `PO-${Date.now().toString().slice(-3)}`,
      supplier: supplierName,
      date: new Date().toISOString().split('T')[0],
      status: 'Livré',
      totalAmount: totalCost,
      itemsCount: selectedItems.length,
      items: selectedItems.map((item) => {
        const prod = products.find((p) => p.sku === item.sku);
        return {
          sku: item.sku,
          name: prod ? prod.name : 'Article inconnu',
          quantity: item.quantity,
        };
      }),
    };

    setPurchaseOrders((prev) => [newPO, ...prev]);

    // Reset and Close
    setSelectedItems([]);
    setErrorMsg('');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900 font-sans">Réceptions & Achats</h3>
          <p className="text-xs text-gray-500">Validez les bons de livraison fournisseurs et intégrez les colis en stock réel</p>
        </div>
        <button
          onClick={() => {
            setSelectedItems([{ sku: products[0]?.sku || '', quantity: 20 }]);
            setErrorMsg('');
            setShowCreateModal(true);
          }}
          className="px-5 py-2.5 bg-[#3525cd] text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-[#4f46e5] flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Nouvelle Réception Directe
        </button>
      </div>

      {/* Existing Orders Table */}
      <div className="bg-white rounded-3xl border border-[#c7c4d8]/40 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h4 className="font-bold text-sm text-gray-900">Historique des Bons d'Achats & Livraisons</h4>
          <span className="text-xs text-gray-400 font-semibold">{purchaseOrders.length} bons loggés</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
              <tr className="border-b border-[#c7c4d8]/20">
                <th className="px-6 py-4">ID Commande</th>
                <th className="px-6 py-4">Date de Réception</th>
                <th className="px-6 py-4">Fournisseur d'Origine</th>
                <th className="px-6 py-4">Articles reçus</th>
                <th className="px-6 py-4 text-right">Valeur Estimée</th>
                <th className="px-6 py-4 text-center">Statut Logistique</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {purchaseOrders.length > 0 ? (
                purchaseOrders.map((po) => (
                  <tr key={po.id} className="border-b border-gray-100 hover:bg-indigo-50/5 transition-all">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {po.id}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-500">{po.date}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{po.supplier}</td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="max-w-[280px] space-y-1">
                        <span className="font-bold text-gray-800 block text-[11px]">{po.itemsCount} références :</span>
                        {po.items.map((it, i) => (
                          <div key={i} className="text-[10px] truncate leading-tight">
                            • {it.name} <span className="font-bold text-gray-900">({it.quantity} unités)</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-gray-900 font-sans">
                      {po.totalAmount.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-extrabold rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">done</span>
                        Réceptionné
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-gray-400">
                    Aucun bon de réception trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 shadow-2xl relative border border-gray-100 animate-in zoom-in-95 duration-150 my-8">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-lg font-extrabold text-gray-900 mb-2">Saisie de Réception Directe</h3>
            <p className="text-xs text-gray-500 mb-6">Ajoutez les produits reçus pour mettre à jour instantanément les stocks de l'entrepôt</p>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 text-[#ba1a1a] text-xs font-bold rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleValidateReception} className="space-y-4">
              {/* Supplier Selector */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-600 uppercase">Sélectionner le Fournisseur d'Origine</label>
                <select
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-[#3525cd]"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Items Panel */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Produits Livrés & Quantités Reçues</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-[#3525cd] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    Ajouter une ligne
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-3 pr-2">
                  {selectedItems.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                      {/* Product select */}
                      <div className="flex-1">
                        <select
                          value={item.sku}
                          onChange={(e) => handleItemChange(idx, 'sku', e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
                        >
                          {products.map((p) => (
                            <option key={p.sku} value={p.sku}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity input */}
                      <div className="w-24">
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="Qté"
                          value={item.quantity || ''}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-center focus:outline-none focus:border-[#3525cd]"
                        />
                      </div>

                      {/* Remove action */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-gray-400 hover:text-[#ba1a1a] rounded hover:bg-red-50"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ))}
                  {selectedItems.length === 0 && (
                    <div className="text-center py-6 text-xs text-gray-400 italic">
                      Aucun produit configuré dans le panier de réception.
                    </div>
                  )}
                </div>
              </div>

              {/* Validate action */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#3525cd] text-white rounded-xl text-xs font-bold hover:bg-[#4f46e5]"
                >
                  Valider la Réception & Entrer en Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
