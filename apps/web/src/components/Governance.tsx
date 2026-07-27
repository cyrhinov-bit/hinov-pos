/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Director, GovernanceLog, User } from '../types';

interface GovernanceProps {
  directors: Director[];
  setDirectors: React.Dispatch<React.SetStateAction<Director[]>>;
  logs: GovernanceLog[];
  setLogs: React.Dispatch<React.SetStateAction<GovernanceLog[]>>;
  searchQuery: string;
  currentUser: User;
  accounts: User[];
  onCreateUser: (newUser: User, newDirector: Director) => void;
}

export const Governance: React.FC<GovernanceProps> = ({
  directors,
  setDirectors,
  logs,
  setLogs,
  searchQuery,
  currentUser,
  accounts,
  onCreateUser,
}) => {
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDirector, setSelectedDirector] = useState<Director | null>(null);

  const isDirectorUser = currentUser.role.includes('Directeur');

  // New account creation state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('password123');
  const [newDept, setNewDept] = useState(isDirectorUser ? 'Opérations d\'entrepôt' : 'Approvisionnement');
  const [newStatus, setNewStatus] = useState<'Actif' | 'Suspendu' | 'En révision'>('Actif');
  const [newRole, setNewRole] = useState<'Directeur' | 'Gestionnaire de stock' | 'Caissier'>(
    isDirectorUser ? 'Gestionnaire de stock' : 'Directeur'
  );

  // Filter accounts and directors according to active role:
  // Admin sees and manages Directors only.
  // Director sees and manages Stock Managers & Cashiers only.
  const filteredDirectors = directors.filter((dir) => {
    const matchedAccount = accounts.find((acc) => acc.email?.toLowerCase() === dir.email.toLowerCase());
    const accountRole = matchedAccount?.role || '';
    
    if (isDirectorUser) {
      // Show only Stock Managers & Cashiers
      if (!accountRole.includes('Gestionnaire') && !accountRole.includes('Caissier')) {
        return false;
      }
    } else {
      // Admin: Show only Directors
      if (!accountRole.includes('Directeur')) {
        return false;
      }
    }

    const q = searchQuery.toLowerCase();
    return (
      dir.name.toLowerCase().includes(q) ||
      dir.email.toLowerCase().includes(q) ||
      dir.department.toLowerCase().includes(q)
    );
  });

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleProvisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const initials = getInitials(newName);
    const bgColors = [
      'bg-indigo-100 text-indigo-700',
      'bg-teal-100 text-teal-700',
      'bg-sky-100 text-sky-700',
      'bg-rose-100 text-rose-700',
      'bg-amber-100 text-amber-700',
    ];
    const randomBg = bgColors[Math.floor(Math.random() * bgColors.length)];

    const finalRole = isDirectorUser ? newRole : 'Directeur';

    // 1. Create Director/Team member object
    const newDir: Director = {
      id: `USR-${Date.now().toString().slice(-3)}`,
      name: newName,
      email: newEmail,
      department: finalRole === 'Directeur' ? newDept : finalRole,
      lastActivity: 'Actif maintenant',
      status: newStatus,
      initials,
      bgColor: randomBg,
    };

    // 2. Create Login User Object
    const newUser: User = {
      name: newName,
      role: finalRole,
      email: newEmail,
      password: newPassword,
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(newName)}`,
      branch: finalRole === 'Directeur' ? newDept : 'Succursale active'
    };

    // Call the unified creation handler
    onCreateUser(newUser, newDir);

    // Add activity log
    const newLog: GovernanceLog = {
      id: `ID-${Math.floor(10000 + Math.random() * 90000)}`,
      type: 'access',
      title: `${finalRole} Habilité`,
      description: `Le compte ${finalRole} a été créé pour ${newName} (Email: ${newEmail}).`,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour12: false }),
      code: `PR-${Math.floor(100 + Math.random() * 900)}`,
    };
    setLogs([newLog, ...logs]);

    // Reset Form
    setNewName('');
    setNewEmail('');
    setNewPassword('password123');
    setNewDept(isDirectorUser ? 'Opérations d\'entrepôt' : 'Approvisionnement');
    setNewStatus('Actif');
    setShowProvisionModal(false);
  };

  const handleEditClick = (dir: Director) => {
    setSelectedDirector(dir);
    setNewName(dir.name);
    setNewEmail(dir.email);
    setNewDept(dir.department);
    setNewStatus(dir.status);
    
    const matchedAccount = accounts.find((acc) => acc.email?.toLowerCase() === dir.email.toLowerCase());
    setNewPassword(matchedAccount?.password || 'password123');
    setNewRole((matchedAccount?.role as any) || 'Gestionnaire de stock');
    
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDirector) return;

    setDirectors(
      directors.map((dir) =>
        dir.id === selectedDirector.id
          ? {
              ...dir,
              name: newName,
              email: newEmail,
              department: isDirectorUser ? newRole : newDept,
              status: newStatus,
              initials: getInitials(newName),
            }
          : dir
      )
    );

    // Add change log
    const newLog: GovernanceLog = {
      id: `ID-${Math.floor(10000 + Math.random() * 90000)}`,
      type: 'policy',
      title: 'Compte Mis à Jour',
      description: `Les informations de ${newName} ont été mises à jour avec succès.`,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour12: false }),
      code: `UP-${Math.floor(100 + Math.random() * 900)}`,
    };
    setLogs([newLog, ...logs]);

    setShowEditModal(false);
    setSelectedDirector(null);
  };

  const handleDeleteDirector = (id: string, name: string) => {
    if (confirm(`Êtes-vous sûr de vouloir suspendre/supprimer le directeur ${name} ?`)) {
      setDirectors(directors.filter((dir) => dir.id !== id));

      const newLog: GovernanceLog = {
        id: `ID-${Math.floor(10000 + Math.random() * 90000)}`,
        type: 'error',
        title: 'Directeur Suspendu/Supprimé',
        description: `Le directeur ${name} a été suspendu et ses identifiants de base de données ont été invalidés.`,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour12: false }),
        code: `DL-${Math.floor(100 + Math.random() * 900)}`,
      };
      setLogs([newLog, ...logs]);
    }
  };

  return (
    <div className="pt-24 px-8 pb-12 w-full animate-fade-in font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-light text-brand-text tracking-tight font-sans">
            {isDirectorUser ? "Gestion de l'Équipe" : "Gouvernance et Contrôle"}
          </h2>
          <p className="text-brand-muted text-sm mt-1 max-w-2xl">
            {isDirectorUser 
              ? "Surveillance et attribution des accès pour les gestionnaires de stock et caissiers de votre succursale." 
              : "Surveillance de la santé du système et des autorisations de niveau directeur dans toute l'entreprise."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              alert('Journaux exportés ! Le rapport d\'audit est en cours de téléchargement en arrière-plan.');
              const newLog: GovernanceLog = {
                id: `ID-${Math.floor(10000 + Math.random() * 90000)}`,
                type: 'audit',
                title: 'Rapport d\'Audit Exporté',
                description: `Exportation manuelle des journaux par le ${currentUser.role}.`,
                timestamp: new Date().toLocaleTimeString('fr-FR', { hour12: false }),
                code: 'AU-EX',
              };
              setLogs([newLog, ...logs]);
            }}
            className="px-5 py-2.5 bg-white border border-brand-primary text-brand-primary rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-brand-primary-light transition-all shadow-xs cursor-pointer flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">file_download</span>
            Exporter les Journaux
          </button>
          <button
            onClick={() => setShowProvisionModal(true)}
            className="px-5 py-2.5 bg-brand-primary text-white rounded-lg font-bold text-xs uppercase tracking-wider glow-shadow-primary hover:bg-brand-primary-hover transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            {isDirectorUser ? "Créer un Compte Équipe" : "Habiliter un Directeur"}
          </button>
        </div>
      </div>

      {/* Stats Bento Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Governance Health Score Card */}
        <div className="bg-white rounded-xl shadow-xs p-5 relative mt-5 border border-brand-border">
          <div className="absolute -top-5 left-4 w-14 h-14 rounded-xl card-header-gradient-4 flex items-center justify-center glow-shadow-info">
            <span className="material-symbols-outlined text-white text-3xl">verified_user</span>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase text-brand-muted tracking-wider">Score de Santé</p>
            <h3 className="text-3xl font-extrabold text-brand-text mt-0.5">98,4%</h3>
          </div>
          <div className="mt-6 border-t border-brand-border pt-4">
            <div className="w-full bg-brand-surface-container rounded-full h-1.5 mb-2 overflow-hidden">
              <div className="bg-brand-accent h-1.5 rounded-full" style={{ width: '98.4%' }}></div>
            </div>
            <p className="text-xs text-brand-muted flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-emerald-600">trending_up</span>
              <span className="text-emerald-600 font-bold">+0,2%</span> depuis le dernier audit
            </p>
          </div>
        </div>

        {/* Active Directors count Card */}
        <div className="bg-white rounded-xl shadow-xs p-5 relative mt-5 border border-brand-border">
          <div className="absolute -top-5 left-4 w-14 h-14 rounded-xl card-header-gradient-primary flex items-center justify-center glow-shadow-primary">
            <span className="material-symbols-outlined text-white text-3xl">supervisor_account</span>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase text-brand-muted tracking-wider">
              {isDirectorUser ? "Membres d'Équipe" : "Directeurs Actifs"}
            </p>
            <h3 className="text-3xl font-extrabold text-brand-text mt-0.5">
              {filteredDirectors.length}
            </h3>
          </div>
          <div className="mt-6 border-t border-brand-border pt-4">
            <p className="text-xs text-brand-muted flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-brand-primary">update</span>
              {isDirectorUser ? "Personnel rattaché à votre succursale" : "4 nouvelles habilitations ce mois"}
            </p>
          </div>
        </div>

        {/* Security Alerts Card */}
        <div className="bg-white rounded-xl shadow-xs p-5 relative mt-5 border border-brand-border">
          <div className="absolute -top-5 left-4 w-14 h-14 rounded-xl card-header-gradient-3 flex items-center justify-center glow-shadow-success">
            <span className="material-symbols-outlined text-white text-3xl">security</span>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase text-brand-muted tracking-wider">Alertes Sécurité</p>
            <h3 className="text-3xl font-extrabold text-brand-text mt-0.5">00</h3>
          </div>
          <div className="mt-6 border-t border-brand-border pt-4">
            <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Système entièrement conforme
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Annuaire des Directeurs Card (Large Column) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-xs border border-brand-border mt-5 relative">
          {/* Floating Header Banner */}
          <div className="relative -top-5 mx-4 p-4 rounded-xl card-header-gradient-primary glow-shadow-primary text-white flex justify-between items-center">
            <div>
              <h4 className="font-bold text-base tracking-wide text-white font-sans">
                {isDirectorUser ? "Annuaire de l'Équipe" : "Annuaire des Directeurs"}
              </h4>
              <p className="text-xs text-white/80 font-medium">
                Gestion des droits et statuts de conformité en temps réel
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => alert('Exportation de l\'annuaire au format CSV...')}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
                title="Exporter l'annuaire"
              >
                <span className="material-symbols-outlined text-[20px]">download</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto px-4 pb-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-brand-primary font-bold text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-3">{isDirectorUser ? "Collaborateur" : "Directeur d'Entité"}</th>
                  <th className="py-3.5 px-3">{isDirectorUser ? "Poste / Rôle" : "Département"}</th>
                  <th className="py-3.5 px-3">Dernière Activité</th>
                  <th className="py-3.5 px-3">Statut</th>
                  <th className="py-3.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-sm">
                {filteredDirectors.length > 0 ? (
                  filteredDirectors.map((dir) => (
                    <tr key={dir.id} className="hover:bg-brand-surface-container-low/60 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full ${dir.bgColor} flex items-center justify-center font-bold text-xs shadow-xs`}
                          >
                            {dir.initials}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-brand-text font-sans leading-tight">
                              {dir.name}
                            </p>
                            <p className="text-[11px] text-brand-muted font-medium">{dir.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-xs font-semibold text-brand-text">
                        {dir.department}
                      </td>
                      <td className="py-3.5 px-3 text-xs text-brand-muted">
                        {dir.lastActivity === 'Active Now' ? 'Actif maintenant' : dir.lastActivity}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1.5 ${
                            dir.status === 'Actif'
                              ? 'bg-emerald-100 text-emerald-800'
                              : dir.status === 'Suspendu'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              dir.status === 'Actif'
                                ? 'bg-emerald-600'
                                : dir.status === 'Suspendu'
                                ? 'bg-rose-600'
                                : 'bg-amber-600'
                            }`}
                          ></span>
                          {dir.status === 'Actif' ? 'Actif' : dir.status === 'Suspendu' ? 'Suspendu' : 'En révision'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right space-x-1">
                        <button
                          onClick={() => handleEditClick(dir)}
                          className="p-1.5 text-brand-primary hover:bg-brand-primary-light rounded-lg transition-colors inline-flex items-center"
                          title="Modifier"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteDirector(dir.id, dir.name)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center"
                          title="Suspendre / Supprimer"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-brand-muted">
                      Aucun compte correspondant trouvé dans l'annuaire actif
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-brand-surface-container-low/40 border-t border-brand-border flex justify-between items-center text-xs text-brand-muted rounded-b-xl">
            <span>Affichage de {filteredDirectors.length} sur {directors.length} entrées</span>
            <div className="flex gap-1">
              <button
                disabled
                className="p-1.5 border border-brand-border rounded-md bg-white text-gray-300 disabled:opacity-50 cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button className="px-2.5 py-1 bg-brand-primary text-white text-xs font-bold rounded-md shadow-xs">
                1
              </button>
              <button
                onClick={() => alert('La pagination est configurée pour la démonstration.')}
                className="p-1.5 border border-brand-border rounded-md bg-white hover:bg-brand-primary-light transition-colors"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Journaux d'Audit Card (Narrow Column) */}
        <div className="bg-white rounded-xl shadow-xs border border-brand-border mt-5 flex flex-col h-[520px] relative">
          {/* Floating Header Banner */}
          <div className="relative -top-5 mx-4 p-4 rounded-xl card-header-gradient-secondary glow-shadow-secondary text-white flex justify-between items-center">
            <div>
              <h4 className="font-bold text-base tracking-wide text-white font-sans">
                Journaux d'Audit
              </h4>
              <p className="text-xs text-white/80 font-medium">Temps réel & Sécurité</p>
            </div>
            <button
              onClick={() => {
                const manualLog: GovernanceLog = {
                  id: `ID-${Math.floor(10000 + Math.random() * 90000)}`,
                  type: 'success',
                  title: 'Ping Manuel Déclenché',
                  description: 'Le Gouverneur du Système a déclenché une vérification manuelle de la boucle de sécurité.',
                  timestamp: new Date().toLocaleTimeString('fr-FR', { hour12: false }),
                  code: 'PN-OK',
                };
                setLogs([manualLog, ...logs]);
              }}
              className="text-[11px] font-bold text-white underline hover:opacity-90 bg-white/10 px-2 py-1 rounded cursor-pointer"
            >
              Ping Audit
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-2 custom-scrollbar space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 group">
                <div className="mt-1 flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full border-2 border-white shadow-xs ${
                      log.type === 'error'
                        ? 'bg-rose-500'
                        : log.type === 'access'
                        ? 'bg-emerald-500'
                        : log.type === 'success'
                        ? 'bg-sky-500'
                        : 'bg-brand-primary'
                    }`}
                  ></div>
                  <div className="w-[1px] h-10 bg-brand-border mt-1"></div>
                </div>
                <div className="flex-1 bg-brand-surface-container-low/40 p-3 rounded-lg border border-brand-border group-hover:bg-brand-primary-light/30 transition-colors">
                  <p className="text-xs font-bold text-brand-text leading-tight">
                    {log.title}
                  </p>
                  <p className="text-xs text-brand-muted mt-1 font-sans">{log.description}</p>
                  <p className="text-[10px] text-brand-muted font-bold mt-2 tracking-wide font-mono uppercase">
                    {log.timestamp} • {log.code}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 text-center border-t border-brand-border">
            <button
              onClick={() => alert(`Examen de l'historique complet : Total de ${logs.length} opérations enregistrées.`)}
              className="w-full py-2 text-xs font-bold text-brand-primary uppercase tracking-wider hover:bg-brand-primary-light transition-all rounded-lg"
            >
              Voir tout l'historique
            </button>
          </div>
        </div>
      </div>

      {/* Provision Director / Team Modal */}
      {showProvisionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-brand-border">
            <button
              onClick={() => setShowProvisionModal(false)}
              className="absolute top-4 right-4 text-brand-muted hover:text-brand-text transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-lg font-bold text-brand-text mb-4 font-sans">
              {isDirectorUser ? "Créer un Nouveau Compte Collaborateur" : "Habiliter un Nouveau Directeur"}
            </h3>
            <form onSubmit={handleProvisionSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-brand-muted uppercase">
                  Nom Complet
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="ex. Jean Dupont"
                  className="w-full px-3.5 py-2 border border-brand-border rounded-lg text-sm font-sans focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary-light transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-brand-muted uppercase">
                  Adresse E-mail
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="nom@entreprise.com"
                  className="w-full px-3.5 py-2 border border-brand-border rounded-lg text-sm font-sans focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary-light transition-all"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-brand-muted uppercase">
                  Mot de passe de connexion
                </label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mot de passe"
                  className="w-full px-3.5 py-2 border border-brand-border rounded-lg text-sm font-sans focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary-light transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {isDirectorUser ? (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-brand-muted uppercase">
                      Rôle Équipe
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full px-3.5 py-2 border border-brand-border rounded-lg text-sm font-sans bg-white focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary-light transition-all"
                    >
                      <option value="Gestionnaire de stock">Gestionnaire de stock</option>
                      <option value="Caissier">Caissier (POS)</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-brand-muted uppercase">
                      Département
                    </label>
                    <select
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      className="w-full px-3.5 py-2 border border-brand-border rounded-lg text-sm font-sans bg-white focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary-light transition-all"
                    >
                      <option value="Approvisionnement">Approvisionnement</option>
                      <option value="Opérations d'entrepôt">Opérations d'entrepôt</option>
                      <option value="Ventes mondiales">Ventes mondiales</option>
                      <option value="Logistique">Logistique</option>
                      <option value="Assurance qualité">Assurance qualité</option>
                    </select>
                  </div>
                )}
                
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-brand-muted uppercase">
                    Statut Initial
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 border border-brand-border rounded-lg text-sm font-sans bg-white focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary-light transition-all"
                  >
                    <option value="Actif">Actif</option>
                    <option value="En révision">En révision</option>
                    <option value="Suspendu">Suspendu</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full mt-6 py-3 bg-brand-primary text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-brand-primary-hover transition-all cursor-pointer glow-shadow-primary"
              >
                Créer les Identifiants d'Accès
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Director / Team Modal */}
      {showEditModal && selectedDirector && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-brand-border">
            <button
              onClick={() => {
                setShowEditModal(false);
                setSelectedDirector(null);
              }}
              className="absolute top-4 right-4 text-brand-muted hover:text-brand-text transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-lg font-bold text-brand-text mb-4 font-sans">
              {isDirectorUser ? "Modifier le Compte Collaborateur" : "Modifier les Identifiants du Directeur"}
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-brand-muted uppercase">
                  Nom Complet
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-brand-border rounded-lg text-sm font-sans focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary-light transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-brand-muted uppercase">
                  Adresse E-mail
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2 border border-brand-border rounded-lg text-sm font-sans focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary-light transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {isDirectorUser ? (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-brand-muted uppercase">
                      Rôle Équipe
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full px-3.5 py-2 border border-brand-border rounded-lg text-sm font-sans bg-white focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary-light transition-all"
                    >
                      <option value="Gestionnaire de stock">Gestionnaire de stock</option>
                      <option value="Caissier">Caissier (POS)</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-brand-muted uppercase">
                      Département
                    </label>
                    <select
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      className="w-full px-3.5 py-2 border border-brand-border rounded-lg text-sm font-sans bg-white focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary-light transition-all"
                    >
                      <option value="Approvisionnement">Approvisionnement</option>
                      <option value="Opérations d'entrepôt">Opérations d'entrepôt</option>
                      <option value="Ventes mondiales">Ventes mondiales</option>
                      <option value="Logistique">Logistique</option>
                      <option value="Assurance qualité">Assurance qualité</option>
                    </select>
                  </div>
                )}
                
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-brand-muted uppercase">
                    Statut de Conformité
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 border border-brand-border rounded-lg text-sm font-sans bg-white focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary-light transition-all"
                  >
                    <option value="Actif">Actif</option>
                    <option value="En révision">En révision</option>
                    <option value="Suspendu">Suspendu</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full mt-6 py-3 bg-brand-primary text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-brand-primary-hover transition-all cursor-pointer glow-shadow-primary"
              >
                Mettre à Jour le Compte Équipe
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
