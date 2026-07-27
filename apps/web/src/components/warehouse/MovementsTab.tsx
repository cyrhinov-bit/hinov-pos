import React, { useState, useMemo } from 'react';
import { StockMovement } from './types';

interface MovementsTabProps {
  movements: StockMovement[];
  activeSubTab?: string;
  setActiveSubTab?: (subTab: string) => void;
}

export const MovementsTab: React.FC<MovementsTabProps> = ({
  movements,
  activeSubTab,
  setActiveSubTab,
}) => {
  const [period, setPeriod] = useState<'All' | 'Today' | 'Week' | 'Month'>('All');
  const [type, setType] = useState<'All' | 'Entrée' | 'Sortie' | 'Ajustement'>('All');
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState('Tous');

  // React to subtab clicks in sidebar
  React.useEffect(() => {
    if (!activeSubTab) return;
    if (activeSubTab === 'all') {
      setType('All');
    } else if (activeSubTab === 'in') {
      setType('Entrée');
    } else if (activeSubTab === 'out') {
      setType('Sortie');
    } else if (activeSubTab === 'adjustments') {
      setType('Ajustement');
    } else if (activeSubTab === 'history') {
      setType('All');
      setPeriod('All');
    }
  }, [activeSubTab]);

  // Find unique users to filter
  const uniqueUsers = useMemo(() => {
    const users = new Set<string>();
    movements.forEach((m) => {
      if (m.user) users.add(m.user);
    });
    return Array.from(users);
  }, [movements]);

  // Filters logic
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      // 1. Search filter
      const matchesSearch =
        m.productName.toLowerCase().includes(search.toLowerCase()) ||
        m.productSku.toLowerCase().includes(search.toLowerCase()) ||
        m.observation.toLowerCase().includes(search.toLowerCase());

      // 2. Type filter
      const matchesType = type === 'All' || m.type === type;

      // 3. User filter
      const matchesUser = userFilter === 'Tous' || m.user === userFilter;

      // 4. Period filter
      let matchesPeriod = true;
      if (period === 'Today') {
        matchesPeriod = m.date === new Date().toISOString().split('T')[0];
      } else if (period === 'Week') {
        const diff = Date.now() - new Date(m.date).getTime();
        matchesPeriod = diff <= 7 * 24 * 60 * 60 * 1000;
      } else if (period === 'Month') {
        const diff = Date.now() - new Date(m.date).getTime();
        matchesPeriod = diff <= 30 * 24 * 60 * 60 * 1000;
      }

      return matchesSearch && matchesType && matchesUser && matchesPeriod;
    });
  }, [movements, period, type, search, userFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header info */}
      <div>
        <h3 className="text-xl font-extrabold text-gray-900">Journal des Mouvements</h3>
        <p className="text-xs text-gray-500">Consultez l'historique complet et l'audit-trail de toutes les entrées, sorties et ajustements de stock</p>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#c7c4d8]/40 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Chercher par SKU, article, mémo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#3525cd]"
            />
          </div>

          {/* Period Filter */}
          <div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none bg-white font-semibold"
            >
              <option value="All">Toutes les périodes</option>
              <option value="Today">Aujourd'hui</option>
              <option value="Week">Cette semaine</option>
              <option value="Month">Ce mois-ci</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none bg-white font-semibold"
            >
              <option value="All">Tous types de mouvement</option>
              <option value="Entrée">Entrées (+) uniquement</option>
              <option value="Sortie">Sorties (-) uniquement</option>
              <option value="Ajustement">Ajustements d'Inventaires</option>
            </select>
          </div>

          {/* User Filter */}
          <div>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none bg-white font-semibold"
            >
              <option value="Tous">Tous les opérateurs</option>
              {uniqueUsers.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-3xl border border-[#c7c4d8]/40 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
              <tr className="border-b border-[#c7c4d8]/20">
                <th className="px-6 py-4">ID Log</th>
                <th className="px-6 py-4">Date / Heure</th>
                <th className="px-6 py-4">Produit concerné</th>
                <th className="px-6 py-4 text-center">Type</th>
                <th className="px-6 py-4 text-center">Quantité</th>
                <th className="px-6 py-4">Opérateur</th>
                <th className="px-6 py-4">Observation / Justification</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {filteredMovements.length > 0 ? (
                filteredMovements.map((mov) => (
                  <tr key={mov.id} className="border-b border-gray-100 hover:bg-indigo-50/5 transition-all">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold text-gray-500">{mov.id}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-semibold">
                      {mov.date} <span className="text-gray-400 font-normal ml-1">à {mov.hour}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{mov.productName}</span>
                        <span className="font-mono text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded mt-1 block w-fit font-extrabold">
                          {mov.productSku}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full uppercase ${
                          mov.type === 'Entrée'
                            ? 'bg-emerald-50 text-emerald-700'
                            : mov.type === 'Sortie'
                            ? 'bg-sky-50 text-sky-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {mov.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`font-extrabold text-sm ${
                          mov.type === 'Entrée'
                            ? 'text-emerald-600'
                            : mov.type === 'Sortie'
                            ? 'text-sky-500'
                            : mov.quantity > 0
                            ? 'text-emerald-600'
                            : 'text-[#ba1a1a]'
                        }`}
                      >
                        {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-700">{mov.user}</td>
                    <td className="px-6 py-4 text-gray-600 leading-snug">{mov.observation}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-gray-400">
                    Aucun mouvement enregistré pour cette période.
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
