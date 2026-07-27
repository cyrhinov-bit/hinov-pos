import React, { useState } from 'react';

interface SettingsTabProps {
  currentUser: { name: string; role: string; [key: string]: any };
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ currentUser }) => {
  const [offlineMode, setOfflineMode] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(15);
  const [syncInterval, setSyncInterval] = useState('30s');
  const [emailAlerts, setEmailAlerts] = useState('daily');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      <div>
        <h3 className="text-xl font-extrabold text-gray-900">Paramètres de l'Entrepôt</h3>
        <p className="text-xs text-gray-500 mt-1">Configurez les options locales de gestion de stock, de synchronisation et d'alertes.</p>
      </div>

      <div className="bg-white rounded-3xl border border-[#c7c4d8]/40 shadow-sm overflow-hidden p-8">
        {isSaved && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs font-semibold animate-fade-in">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            <span>Les paramètres ont été sauvegardés avec succès et appliqués à votre session locale.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* Section: Réseau & Synchronisation */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Réseau & Synchronisation</h4>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-900">Mode Hors-ligne (Offline-First)</p>
                <p className="text-xs text-gray-500">Autorise SmartStock à sauvegarder toutes les réceptions et mouvements en local en cas de perte de connexion, puis à synchroniser automatiquement.</p>
              </div>
              <button
                type="button"
                onClick={() => setOfflineMode(!offlineMode)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${offlineMode ? 'bg-[#3525cd]' : 'bg-gray-200'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${offlineMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Fréquence de synchronisation cloud</label>
                <select
                  value={syncInterval}
                  onChange={(e) => setSyncInterval(e.target.value)}
                  className="w-full h-11 px-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-100 rounded-xl text-sm font-medium transition-all"
                >
                  <option value="realtime">Temps réel (Dès chaque action)</option>
                  <option value="30s">Toutes les 30 secondes</option>
                  <option value="5m">Toutes les 5 minutes</option>
                  <option value="manual">Manuelle uniquement</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Statut de la base de données</label>
                <div className="h-11 px-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Réplication PostgreSQL connectée</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">ONLINE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Alertes de Stock */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Alertes & Approvisionnements</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Seuil par défaut de stock faible (unités)</label>
                <input
                  type="number"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-full h-11 px-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-100 rounded-xl text-sm font-medium transition-all"
                />
                <p className="text-[10px] text-gray-400">Les fiches articles dont la quantité restante descend en dessous de ce seuil seront signalées "Stock Faible".</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Rapports d'écarts d'inventaires</label>
                <select
                  value={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.value)}
                  className="w-full h-11 px-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-100 rounded-xl text-sm font-medium transition-all"
                >
                  <option value="instant">Immédiat (E-mail à chaque écart)</option>
                  <option value="daily">Résumé quotidien par e-mail</option>
                  <option value="weekly">Résumé hebdomadaire</option>
                  <option value="none">Désactivé</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Interface utilisateur */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Interface utilisateur & Notifications</h4>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-900">Effets sonores & Alertes sonores</p>
                <p className="text-xs text-gray-500">Émettre un signal sonore lors de la lecture d'un code-barres ou de la détection d'une anomalie.</p>
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${soundEnabled ? 'bg-[#3525cd]' : 'bg-gray-200'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${soundEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="submit"
              className="px-6 h-11 bg-[#3525cd] hover:bg-[#4f46e5] text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-100 cursor-pointer"
            >
              Enregistrer les modifications
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
