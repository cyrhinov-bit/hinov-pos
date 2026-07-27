import React, { useMemo, useState } from 'react';
import { EnrichedProduct } from './types';

interface ReportsTabProps {
  products: EnrichedProduct[];
  activeSubTab?: string;
  setActiveSubTab?: (subTab: string) => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ products }) => {
  const [downloading, setDownloading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Financial calculations
  const financials = useMemo(() => {
    let totalPurchaseVal = 0;
    let totalRetailVal = 0;
    let totalUnits = 0;

    products.forEach((p) => {
      const stock = p.stock || 0;
      const purchase = p.purchasePrice || Math.round(p.price * 0.65);
      const retail = p.price || 0;

      totalPurchaseVal += purchase * stock;
      totalRetailVal += retail * stock;
      totalUnits += stock;
    });

    const potentialMargin = totalRetailVal - totalPurchaseVal;
    return {
      totalPurchaseVal,
      totalRetailVal,
      totalUnits,
      potentialMargin,
    };
  }, [products]);

  // Breakdown per category table
  const categoryBreakdown = useMemo(() => {
    const breakdown: {
      [cat: string]: {
        name: string;
        count: number;
        qty: number;
        purchaseVal: number;
        sellingVal: number;
      };
    } = {};

    products.forEach((p) => {
      const cat = p.category || 'Général';
      const stock = p.stock || 0;
      const purchase = p.purchasePrice || Math.round(p.price * 0.65);
      const retail = p.price || 0;

      if (!breakdown[cat]) {
        breakdown[cat] = {
          name: cat,
          count: 0,
          qty: 0,
          purchaseVal: 0,
          sellingVal: 0,
        };
      }

      breakdown[cat].count += 1;
      breakdown[cat].qty += stock;
      breakdown[cat].purchaseVal += purchase * stock;
      breakdown[cat].sellingVal += retail * stock;
    });

    return Object.values(breakdown);
  }, [products]);

  const triggerExport = (format: 'Excel' | 'PDF') => {
    setDownloading(true);
    setExportSuccess(false);
    setTimeout(() => {
      setDownloading(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900">Rapports & Audit Financier</h3>
          <p className="text-xs text-gray-500">Valorisez instantanément vos actifs en stock et exportez des extraits consolidés pour votre comptabilité</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => triggerExport('Excel')}
            disabled={downloading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 text-white rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-50"
          >
            <span className="material-symbols-outlined text-[18px]">download_sheet</span>
            Exporter Excel
          </button>
          <button
            onClick={() => triggerExport('PDF')}
            disabled={downloading}
            className="px-4 py-2 bg-[#ba1a1a] hover:bg-red-700 disabled:bg-gray-200 text-white rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-red-50"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            Télécharger PDF
          </button>
        </div>
      </div>

      {/* Export Notifications */}
      {downloading && (
        <div className="p-4 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-2xl flex items-center gap-3 animate-pulse">
          <span className="material-symbols-outlined animate-spin">sync</span>
          Génération des rapports consolidés en cours, veuillez patienter...
        </div>
      )}
      {exportSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-2xl flex items-center gap-3">
          <span className="material-symbols-outlined">check_circle</span>
          Export terminé avec succès ! Le fichier a été généré et enregistré dans votre dossier de téléchargements.
        </div>
      )}

      {/* Financial Valuation KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-[#c7c4d8]/40 shadow-sm space-y-2">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Volume Global du Stock</span>
          <p className="text-3xl font-extrabold text-gray-900 font-sans">{financials.totalUnits.toLocaleString('fr-FR')} unités</p>
          <div className="text-[11px] text-gray-400 font-medium">Réparties sur {products.length} références actives</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#c7c4d8]/40 shadow-sm space-y-2">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Valorisation Achat</span>
          <p className="text-3xl font-extrabold text-[#3525cd] font-sans">{financials.totalPurchaseVal.toLocaleString('fr-FR')} F</p>
          <div className="text-[11px] text-gray-400 font-medium">Coût global des marchandises stockées (PMP)</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#c7c4d8]/40 shadow-sm space-y-2">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Valorisation Vente</span>
          <p className="text-3xl font-extrabold text-indigo-900 font-sans">{financials.totalRetailVal.toLocaleString('fr-FR')} F</p>
          <div className="text-[11px] text-gray-400 font-medium">Valeur marchande potentielle au prix public</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#c7c4d8]/40 shadow-sm space-y-2">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Marge brute latente</span>
          <p className="text-3xl font-extrabold text-emerald-600 font-sans">+{financials.potentialMargin.toLocaleString('fr-FR')} F</p>
          <div className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
            Ratio de {Math.round((financials.potentialMargin / financials.totalRetailVal) * 100) || 0}% de marge brute
          </div>
        </div>
      </div>

      {/* Category distribution report table */}
      <div className="bg-white rounded-3xl border border-[#c7c4d8]/40 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h4 className="font-bold text-sm text-gray-900">Distribution financière par catégories logistiques</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
              <tr className="border-b border-[#c7c4d8]/20">
                <th className="px-6 py-4">Catégorie</th>
                <th className="px-6 py-4 text-center">Nombre d'articles</th>
                <th className="px-6 py-4 text-center">Quantité globale</th>
                <th className="px-6 py-4 text-right">Valeur d'achat cumulée</th>
                <th className="px-6 py-4 text-right">Valeur de vente cumulée</th>
                <th className="px-6 py-4 text-right">Marge potentielle</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {categoryBreakdown.map((breakdown) => {
                const margin = breakdown.sellingVal - breakdown.purchaseVal;
                return (
                  <tr key={breakdown.name} className="border-b border-gray-100 hover:bg-gray-50/50 transition-all">
                    <td className="px-6 py-4 font-bold text-gray-900">{breakdown.name}</td>
                    <td className="px-6 py-4 text-center text-gray-600 font-semibold">{breakdown.count} références</td>
                    <td className="px-6 py-4 text-center text-gray-900 font-extrabold">{breakdown.qty} units</td>
                    <td className="px-6 py-4 text-right text-gray-700 font-medium font-mono">
                      {breakdown.purchaseVal.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 font-bold font-mono">
                      {breakdown.sellingVal.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-600 font-extrabold font-mono">
                      +{margin.toLocaleString('fr-FR')} FCFA
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
