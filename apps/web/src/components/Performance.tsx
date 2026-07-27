/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, Transaction } from '../types';

interface PerformanceProps {
  products: Product[];
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  searchQuery: string;
}

export const Performance: React.FC<PerformanceProps> = ({
  products,
  transactions,
  setTransactions,
  searchQuery,
}) => {
  const [dateRange, setDateRange] = useState<'30days' | '7days' | 'today'>('30days');

  // Filter transactions based on search query
  const filteredTransactions = transactions.filter((tx) => {
    const q = searchQuery.toLowerCase();
    return (
      tx.id.toLowerCase().includes(q) ||
      tx.asset.toLowerCase().includes(q) ||
      tx.category.toLowerCase().includes(q) ||
      tx.origin.toLowerCase().includes(q) ||
      tx.destination.toLowerCase().includes(q)
    );
  });

  // Dynamic KPI values based on chosen date range in CFA Francs
  const getKPIs = () => {
    switch (dateRange) {
      case 'today':
        return {
          revenue: '7 440 000 F CFA',
          revTrend: '+1.5%',
          stock: '1,69 Md F CFA',
          stockTrend: 'Stable',
          alerts: '1 Action en Attente',
          alertText: 'Stock faible : SKU-901',
        };
      case '7days':
        return {
          revenue: '50 580 000 F CFA',
          revTrend: '+8.4%',
          stock: '1,69 Md F CFA',
          stockTrend: 'Stable',
          alerts: '2 Actions en Attente',
          alertText: 'Stock faible : SKU-122, SKU-901',
        };
      case '30days':
      default:
        return {
          revenue: '85 500 000 F CFA',
          revTrend: '+12.5%',
          stock: '1,70 Md F CFA',
          stockTrend: 'Stable',
          alerts: '3 Actions en Attente',
          alertText: 'Stock faible : SKU-884, SKU-122, SKU-901',
        };
    }
  };

  const kpis = getKPIs();

  // Cycle date range
  const handleCycleDateRange = () => {
    if (dateRange === '30days') setDateRange('7days');
    else if (dateRange === '7days') setDateRange('today');
    else setDateRange('30days');
  };

  // Click on transaction row to cycle state
  const handleCycleTxStatus = (id: string) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === id) {
          const nextStatus =
            tx.status === 'En transit'
              ? 'Livré'
              : tx.status === 'Livré'
              ? 'Retardé'
              : 'En transit';
          return { ...tx, status: nextStatus };
        }
        return tx;
      })
    );
  };

  return (
    <div className="pt-24 px-8 pb-12 w-full animate-fade-in font-sans">
      {/* Hero Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight font-sans">
            Aperçu des Performances
          </h2>
          <p className="text-[#464555] text-sm mt-1">
            Ravi de vous revoir, Directeur. Voici le résumé de votre entreprise pour aujourd'hui.
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleCycleDateRange}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-gray-200 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            {dateRange === '30days' ? '30 derniers jours' : dateRange === '7days' ? '7 derniers jours' : "Aujourd'hui"}
          </button>
          <button
            onClick={() => alert('Exportation du rapport dynamique sous forme de tableur Excel...')}
            className="px-5 py-2.5 bg-brand-primary text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-100 hover:bg-brand-primary-hover transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            Exporter le Rapport
          </button>
        </div>
      </div>

      {/* Bento Grid KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        {/* Daily Revenue KPI Card */}
        <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-xs col-span-1 hover:border-indigo-300 transition-colors duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-brand-primary-light text-brand-primary rounded-xl">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                payments
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] font-bold">trending_up</span>
              {kpis.revTrend}
            </span>
          </div>
          <p className="text-brand-muted text-[11px] uppercase tracking-wider font-bold">
            Revenus de la période
          </p>
          <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-1">
            {kpis.revenue}
          </h3>
        </div>

        {/* Total Stock Value KPI Card */}
        <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-xs col-span-1 hover:border-sky-300 transition-colors duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-sky-50 text-brand-secondary rounded-xl">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                inventory_2
              </span>
            </div>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">horizontal_rule</span>
              {kpis.stockTrend}
            </span>
          </div>
          <p className="text-brand-muted text-[11px] uppercase tracking-wider font-bold">
            Valeur Totale du Stock
          </p>
          <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-1">
            {kpis.stock}
          </h3>
        </div>

        {/* Critical Alerts KPI Card */}
        <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-xs col-span-1 md:col-span-1 lg:col-span-2 relative overflow-hidden hover:border-red-300 transition-colors duration-300">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-rose-50 text-[#ba1a1a] rounded-xl">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                warning
              </span>
            </div>
            <button
              onClick={() => alert('Navigation vers le centre de contrôle de conformité...')}
              className="text-[#ba1a1a] font-bold text-xs hover:underline cursor-pointer"
            >
              Tout voir
            </button>
          </div>
          <div className="relative z-10">
            <p className="text-brand-muted text-[11px] uppercase tracking-wider font-bold">
              Alertes Critiques
            </p>
            <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-1">
              {kpis.alerts}
            </h3>
            <p className="text-xs text-[#ba1a1a] mt-2 flex items-center gap-2 font-semibold">
              <span className="w-2 h-2 bg-[#ba1a1a] rounded-full animate-pulse"></span>
              {kpis.alertText}
            </p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-[120px] translate-y-8 translate-x-8">
              error_outline
            </span>
          </div>
        </div>
      </div>

      {/* Charts & Lists layout container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Trend Chart Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-brand-border shadow-xs">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h4 className="font-bold text-base text-gray-900 font-sans">
                Évolution des Revenus
              </h4>
              <p className="text-brand-muted text-xs font-sans mt-0.5">
                Revenus Prévus vs Réels
              </p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-primary"></span>
                <span className="text-[11px] text-brand-muted font-bold">Réel</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-200"></span>
                <span className="text-[11px] text-brand-muted font-bold">Objectif</span>
              </div>
            </div>
          </div>

          {/* Simulated Bar Chart */}
          <div className="h-64 w-full flex items-end justify-between gap-4 pb-4 border-b border-gray-100">
            {[
              { day: 'Lun', target: '60%', actual: '45%' },
              { day: 'Mar', target: '70%', actual: '65%' },
              { day: 'Mer', target: '65%', actual: '80%' },
              { day: 'Jeu', target: '85%', actual: '75%' },
              { day: 'Ven', target: '60%', actual: '90%' },
              { day: 'Sam', target: '40%', actual: '35%' },
              { day: 'Dim', target: '30%', actual: '25%' },
            ].map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-3 group cursor-pointer">
                <div className="w-full max-w-[40px] flex items-end gap-1 h-44 relative">
                  <div
                    className="flex-1 bg-indigo-100 rounded-t-md transition-all duration-700"
                    style={{ height: bar.target }}
                    title={`Objectif: ${bar.target}`}
                  ></div>
                  <div
                    className="flex-1 bg-brand-primary rounded-t-md transition-all duration-700 shadow-md group-hover:brightness-110"
                    style={{ height: bar.actual }}
                    title={`Réel: ${bar.actual}`}
                  ></div>
                </div>
                <span className="text-[11px] text-brand-muted font-bold font-sans">
                  {bar.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Product Velocity Card */}
        <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-xs">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-base text-gray-900 font-sans">
              Vitesse de Rotation
            </h4>
            <span className="material-symbols-outlined text-gray-400 cursor-pointer">
              more_vert
            </span>
          </div>

          <div className="space-y-4">
            {products.slice(0, 4).map((p, index) => {
              // Map mock custom items
              const iconColors = [
                'bg-emerald-50 text-emerald-700 border border-emerald-100',
                'bg-indigo-50 text-indigo-700 border border-indigo-100',
                'bg-sky-50 text-sky-700 border border-sky-100',
                'bg-gray-50 text-gray-700 border border-gray-100',
              ];
              const randomIconColor = iconColors[index % iconColors.length];
              const icons = ['bolt', 'devices', 'architecture', 'inventory'];

              return (
                <div
                  key={p.id}
                  onClick={() => alert(`Examen du suivi d'entrepôt pour le SKU ${p.sku}...`)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-all cursor-pointer border border-transparent hover:border-gray-100"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${randomIconColor}`}>
                    <span className="material-symbols-outlined text-lg">
                      {icons[index % icons.length]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-gray-900 truncate font-sans">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">
                      {p.category} / {p.sku}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-900 font-sans">
                      {p.velocity || '450 unités'}
                    </p>
                    <p
                      className={`text-[9px] font-bold uppercase ${
                        p.trend?.includes('-') ? 'text-red-500' : 'text-emerald-600'
                      }`}
                    >
                      {p.trend || 'HAUSSE MAX'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => alert('Accès aux registres de rapports logistiques sécurisés...')}
            className="w-full mt-6 py-2 bg-brand-primary-light hover:bg-brand-primary-light/80 text-brand-primary font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Rapport Complet de Vitesse de Rotation
          </button>
        </div>
      </div>

      {/* Enterprise Logistics Stream Table Section */}
      <div className="mt-8 bg-white rounded-2xl border border-brand-border shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-brand-border flex justify-between items-center">
          <div>
            <h4 className="font-bold text-base text-gray-900 font-sans">
              Flux Logistique de l'Entreprise
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Cliquez sur n'importe quelle ligne de transaction pour basculer son statut de transit en direct (simulé).
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => alert('Options de filtrage...')}
              className="p-2 border border-[#c7c4d8]/40 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">filter_list</span>
            </button>
            <button
              onClick={() => {
                // Shuffle transaction values slightly
                setTransactions((prev) =>
                  prev.map((t) => ({
                    ...t,
                    value: t.value + Math.floor((Math.random() - 0.5) * 50000),
                  }))
                );
              }}
              className="p-2 border border-brand-border rounded-xl hover:bg-gray-50 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
            </button>
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-[11px] font-bold tracking-wider uppercase">
            <tr>
              <th className="p-4 pl-6">ID DE TRANSACTION</th>
              <th className="p-4">ACTIF / PRODUIT</th>
              <th className="p-4">ORIGINE</th>
              <th className="p-4">DESTINATION</th>
              <th className="p-4">STATUT</th>
              <th className="p-4 text-right pr-6">VALEUR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => handleCycleTxStatus(tx.id)}
                  className="hover:bg-brand-primary-light/40 transition-all duration-150 cursor-pointer"
                  title="Cliquer pour changer le statut"
                >
                  <td className="p-4 pl-6 font-bold text-xs text-brand-primary">
                    {tx.id}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-gray-900">{tx.asset}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                        {tx.category}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-xs font-semibold text-gray-700">{tx.origin}</td>
                  <td className="p-4 text-xs font-semibold text-gray-700">{tx.destination}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 text-[9px] font-bold rounded-full uppercase ${
                        tx.status === 'En transit'
                          ? 'bg-sky-50 text-sky-700'
                          : tx.status === 'Livré'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold text-xs text-gray-900 pr-6 font-mono">
                    {tx.value.toLocaleString('fr-FR')} F CFA
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-gray-400">
                  Aucun flux logistique ne correspond aux filtres actuels
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="p-4 bg-gray-50/30 border-t border-gray-100 flex justify-center">
          <button
            onClick={() => alert('Accès au flux de base de données du grand livre persistant...')}
            className="text-xs text-brand-primary font-bold hover:underline"
          >
            Voir Toute l'Activité de l'Entreprise
          </button>
        </div>
      </div>
    </div>
  );
};
