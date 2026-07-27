import React, { useState } from 'react';

interface ProfileTabProps {
  currentUser: { name: string; role: string; [key: string]: any };
  setCurrentUser?: (user: any) => void;
  accounts: any[];
  setAccounts?: React.Dispatch<React.SetStateAction<any[]>>;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  currentUser,
  setCurrentUser,
  accounts,
  setAccounts,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || '+225 07 48 29 10 99');
  const [password, setPassword] = useState(currentUser.password || '123456');
  const [avatarUrl, setAvatarUrl] = useState(
    currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  );
  const [isSaved, setIsSaved] = useState(false);

  const avatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedUser = {
      ...currentUser,
      name,
      phone,
      password,
      avatar: avatarUrl,
    };

    // Update global current user
    if (setCurrentUser) {
      setCurrentUser(updatedUser);
    }

    // Update in global accounts list
    if (setAccounts) {
      setAccounts((prev) =>
        prev.map((acc) => (acc.username === currentUser.username ? updatedUser : acc))
      );
    }

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#c7c4d8]/40 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-[#3525cd] to-[#4f46e5]" />
        
        {/* Header Profile Photo */}
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 -mt-16 mb-6">
            <img
              referrerPolicy="no-referrer"
              src={avatarUrl}
              alt={name}
              className="w-28 h-28 rounded-2xl border-4 border-white object-cover shadow-md bg-white"
            />
            <div className="space-y-1 py-1">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">{name}</h3>
              <p className="text-xs font-bold text-[#3525cd] uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-lg inline-block">
                {currentUser.role}
              </p>
            </div>
          </div>

          {/* Alert Success */}
          {isSaved && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-800 animate-fade-in">
              <span className="material-symbols-outlined text-emerald-600">check_circle</span>
              <div className="text-xs font-semibold">
                Profil enregistré avec succès ! Vos modifications de session ont été appliquées.
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Nom complet</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full h-11 px-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-100 rounded-xl text-sm font-medium transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Téléphone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full h-11 px-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-100 rounded-xl text-sm font-medium transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Nom d'utilisateur (Identifiant)</label>
              <input
                type="text"
                value={currentUser.username}
                disabled
                className="w-full h-11 px-4 bg-gray-100 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-11 px-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-100 rounded-xl text-sm font-medium transition-all"
              />
            </div>

            {/* Avatar Selector */}
            <div className="md:col-span-2 space-y-3 pt-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">Choisir un avatar</label>
              <div className="flex gap-4">
                {avatars.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      avatarUrl === url ? 'border-[#3525cd] scale-105 shadow-md' : 'border-transparent hover:scale-105'
                    }`}
                  >
                    <img referrerPolicy="no-referrer" src={url} alt="Avatar option" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                className="bg-[#3525cd] hover:bg-[#4f46e5] text-white py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-100 active:scale-95 transition-all cursor-pointer"
              >
                Enregistrer le profil
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Security Info Panel */}
      <div className="bg-white rounded-3xl border border-[#c7c4d8]/40 shadow-sm p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl w-fit">
            <span className="material-symbols-outlined text-lg">shield_lock</span>
          </div>
          <h4 className="font-bold text-sm text-gray-900">Permissions et accès</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            Votre compte dispose des habilitations de niveau 2 (Gestionnaire). Vous pouvez éditer les articles, enregistrer les livraisons et effectuer des rapprochements physiques d'inventaires.
          </p>
        </div>

        <div className="space-y-2">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl w-fit">
            <span className="material-symbols-outlined text-lg">history</span>
          </div>
          <h4 className="font-bold text-sm text-gray-900">Dernière activité</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            Dernière connexion enregistrée aujourd'hui à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}. Aucune anomalie détectée sur votre session sécurisée par jeton local.
          </p>
        </div>

        <div className="space-y-2">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
            <span className="material-symbols-outlined text-lg">cloud_sync</span>
          </div>
          <h4 className="font-bold text-sm text-gray-900">Synchronisation active</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            Toutes les modifications apportées à vos fiches produits sont synchronisées en temps réel avec le grand livre de l'entreprise SmartStock ERP.
          </p>
        </div>
      </div>
    </div>
  );
};
