import React, { useState, useMemo } from 'react';
import { EnrichedProduct } from './types';

interface StockStateTabProps {
  products: EnrichedProduct[];
  onTriggerReplenishment: (productSku: string) => void;
}

export const StockStateTab: React.FC<StockStateTabProps> = ({
  products,
  onTriggerReplenishment,
}) => {
  const [filter, setFilter] = useState<'All' | 'Normal' | 'Faible' | 'Rupture'>('All');
  const [search, setSearch] = useState('');

  const enrichedAndFiltered = useMemo(() => {
    return products
      .map((p) => {
        const minStock = p.minStock || 15;
        const maxStock = p.maxStock || 250;
        const stock = p.stock || 0;
        let status: 'Normal' | 'Faible' | 'Rupture' = 'Normal';
        if (stock === 0) status = 'Rupture';
        else if (stock < minStock) status = 'Faible';

        return {
          ...p,
          minStock,
          maxStock,
          status,
        };
      })
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'All' || p.status === filter;
        return matchesSearch && matchesFilter;
      });
  }, [products, filter, search]);

  // Statistics counters
  const stats = useMemo(() => {
    let normal = 0;
    let low = 0;
    let out = 0;
    products.forEach((p) => {
      const min = p.minStock || 15;
      const stock = p.stock || 0;
      if (stock === 0) out++;
      else if (stock < min) low++;
      else normal++;
    });
    return { normal, low, out, total: products.length };
  }, [products]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top statistics banners */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setFilter('All')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filter === 'All' ? 'bg-indigo-50 border-[#3525cd] text-[#3525cd]' : 'bg-white border-gray-200 text-gray-500'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block">Tous les articles</span>
          <span className="text-2xl font-extrabold block mt-1 text-gray-900">{stats.total}</span>
        </div>
        <div
          onClick={() => setFilter('Normal')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filter === 'Normal' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-gray-200 text-gray-500'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block">Niveau Normal</span>
          <span className="text-2xl font-extrabold block mt-1 text-emerald-600">{stats.normal}</span>
        </div>
        <div
          onClick={() => setFilter('Faible')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filter === 'Faible' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white border-gray-200 text-gray-500'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block">Alerte Stock Faible</span>
          <span className="text-2xl font-extrabold block mt-1 text-amber-600">{stats.low}</span>
        </div>
        <div
          onClick={() => setFilter('Rupture')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filter === 'Rupture' ? 'bg-red-50 border-red-500 text-[#ba1a1a]' : 'bg-white border-gray-200 text-gray-500'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block">Ruptures de Stock</span>
          <span className="text-2xl font-extrabold block mt-1 text-[#ba1a1a]">{stats.out}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#c7c4d8]/40 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative max-w-xs w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Rechercher par nom ou SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#3525cd]"
          />
        </div>
        <div className="flex gap-2">
          {['All', 'Normal', 'Faible', 'Rupture'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                filter === f
                  ? 'bg-gray-900 border-gray-900 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f === 'All' ? 'Tous' : f === 'Normal' ? 'Normal' : f === 'Faible' ? 'Stock Faible' : 'En Rupture'}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Health Grid / Table */}
      <div className="bg-white rounded-3xl border border-[#c7c4d8]/40 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
              <tr className="border-b border-[#c7c4d8]/20">
                <th className="px-6 py-4">Article</th>
                <th className="px-6 py-4">Réf SKU</th>
                <th className="px-6 py-4">Catégorie</th>
                <th className="px-6 py-4 text-center">Niveau de Stock actuel</th>
                <th className="px-6 py-4 text-center">Alertes Min / Max</th>
                <th className="px-6 py-4">Gabarit d'évaluation</th>
                <th className="px-6 py-4 text-center">Statut Santé</th>
                <th className="px-6 py-4 text-right">Action Logistique</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {enrichedAndFiltered.length > 0 ? (
                enrichedAndFiltered.map((p) => {
                  const stockRatio = Math.min(100, Math.round((p.stock / p.maxStock) * 100));
                  
                  return (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-indigo-50/10 transition-all">
                      {/* Product Image and Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-9 h-9 object-cover rounded-lg border border-gray-100 shadow-sm shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <span className="font-bold text-gray-900 max-w-[150px] truncate">{p.name}</span>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                          {p.sku}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <span className="text-gray-700 font-semibold">{p.category}</span>
                      </td>

                      {/* Available Qty */}
                      <td className="px-6 py-4 text-center">
                        <span className={`font-extrabold text-sm ${p.status === 'Rupture' ? 'text-[#ba1a1a]' : p.status === 'Faible' ? 'text-amber-600' : 'text-gray-900'}`}>
                          {p.stock} units
                        </span>
                      </td>

                      {/* Min / Max levels */}
                      <td className="px-6 py-4 text-center font-semibold text-gray-500 font-mono text-[11px]">
                        <span>{p.minStock}</span> / <span className="text-gray-900 font-bold">{p.maxStock}</span>
                      </td>

                      {/* Health progress bar */}
                      <td className="px-6 py-4 w-48">
                        <div>
                          <div className="flex justify-between text-[9px] text-gray-400 font-bold mb-1">
                            <span>Remplissage</span>
                            <span>{stockRatio}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                p.status === 'Rupture' ? 'bg-[#ba1a1a]' : p.status === 'Faible' ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${stockRatio}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Health Status badge */}
                      <td className="px-6 py-4 text-center">
                        {p.status === 'Rupture' ? (
                          <span className="px-2.5 py-0.5 bg-red-100 text-[#ba1a1a] text-[9px] font-extrabold rounded-full uppercase tracking-wider">
                            Rupture Critique
                          </span>
                        ) : p.status === 'Faible' ? (
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-extrabold rounded-full uppercase tracking-wider">
                            Seuil Faible
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-extrabold rounded-full uppercase tracking-wider">
                            Santé Optimale
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        {p.status !== 'Normal' ? (
                          <button
                            onClick={() => onTriggerReplenishment(p.sku)}
                            className="px-3 py-1.5 bg-[#3525cd] text-white text-[10px] font-bold rounded-lg shadow hover:bg-[#4f46e5] transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[12px]">local_shipping</span>
                            Réapprovisionner
                          </button>
                        ) : (
                          <span className="text-gray-400 text-[10px] font-semibold italic pr-2">Sécurisé</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-xs text-gray-400">
                    Aucun article trouvé pour ces critères de santé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
