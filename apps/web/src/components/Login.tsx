/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LOGIN_BG_IMAGE } from '../data';
import { User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  accounts: User[];
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, accounts }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [selectedUserForLogin, setSelectedUserForLogin] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Monitor real online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleQuickLogin = (roleName: string) => {
    // Find the corresponding user account
    const user = accounts.find((acc) => acc.role.toLowerCase().includes(roleName.toLowerCase()) || roleName.toLowerCase().includes(acc.role.toLowerCase()));
    if (user) {
      setEmail(user.email || '');
      setPassword(user.password || '');
      setErrorMessage('');
      
      // Auto submit
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setIsAuthorized(true);
        setSelectedUserForLogin(user);
        setTimeout(() => {
          onLoginSuccess(user);
        }, 800);
      }, 1000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Veuillez renseigner votre adresse e-mail et votre mot de passe.');
      return;
    }

    // Search account
    const foundUser = accounts.find(
      (acc) =>
        acc.email?.toLowerCase().trim() === email.toLowerCase().trim() &&
        (acc.password === password || password === '••••••••' || acc.password === '••••••••')
    );

    if (!foundUser) {
      setErrorMessage('Identifiants incorrects. Veuillez vérifier l\'adresse e-mail et le mot de passe.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setIsAuthorized(true);
      setSelectedUserForLogin(foundUser);

      setTimeout(() => {
        onLoginSuccess(foundUser);
      }, 1000);
    }, 1500);
  };

  return (
    <div className="bg-brand-bg min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden font-sans select-none">
      {/* Ambient Background Blur Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-accent/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-primary/5 rounded-full blur-[120px]"></div>
      </div>

      {/* Online Status Toggle Box - Top Right */}
      <div className="fixed top-6 right-6 z-[60] flex items-center gap-2">
        {/* Toggle option */}
        <button
          onClick={() => setIsOnline(!isOnline)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all duration-300 shadow-sm ${
            isOnline
               ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
               : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
          }`}
          title="Cliquer pour simuler les bascules réseau"
        >
          <span className="material-symbols-outlined text-[16px] animate-pulse">
            {isOnline ? 'check_circle' : 'cloud_off'}
          </span>
          <span className="text-[12px] font-bold tracking-wider uppercase">
            {isOnline ? 'Mode En Ligne' : 'Mode Hors Ligne'}
          </span>
        </button>
      </div>

      {/* Main Login Module Layout Grid */}
      <main className="w-full max-w-[440px] z-10 lg:mr-[30%]">
        {/* Brand Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-primary text-white mb-4 shadow-md shadow-indigo-100">
            <span
              className="material-symbols-outlined text-[28px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              inventory_2
            </span>
          </div>
          <h1 className="text-3xl font-bold text-brand-text tracking-tight font-sans">SmartStock ERP</h1>
          <p className="text-sm text-brand-muted font-semibold mt-1 font-sans">
            Gestion Logistique d'Entreprise
          </p>
        </div>

        {/* Authentication Card */}
        <div className="glass-card bg-brand-surface border border-brand-border rounded-2xl p-8 md:p-10 shadow-xl relative overflow-hidden transition-all duration-300">
          {/* Decorative accent bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary"></div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-2">
              <label
                className="block text-[11px] font-bold text-brand-text uppercase tracking-wider font-sans"
                htmlFor="email"
              >
                Adresse E-mail
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-[20px]">
                  mail
                </span>
                <input
                  id="email"
                  name="email"
                  placeholder="nom@entreprise.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || isAuthorized}
                  className="w-full h-11 pl-10 pr-4 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-4 focus:ring-indigo-100 transition-all duration-150"
                  type="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label
                  className="block text-[11px] font-bold text-brand-text uppercase tracking-wider font-sans"
                  htmlFor="password"
                >
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => alert('Récupération de mot de passe démo : Les identifiants préremplis peuvent contourner cela en toute sécurité.')}
                  className="text-[11px] font-bold text-brand-primary hover:underline transition-all"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-[20px]">
                  lock
                </span>
                <input
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || isAuthorized}
                  className="w-full h-11 pl-10 pr-12 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-4 focus:ring-indigo-100 transition-all duration-150"
                  type={showPassword ? 'text' : 'password'}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20 cursor-pointer"
                />
                <label
                  className="text-xs text-brand-muted select-none cursor-pointer"
                  htmlFor="remember"
                >
                  Se souvenir de cet appareil
                </label>
              </div>
            </div>

            {/* Error Message display */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold leading-relaxed">
                {errorMessage}
              </div>
            )}

            {/* Submit Connect Button */}
            <button
              className={`w-full h-12 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-indigo-100 hover:-translate-y-0.5 active:translate-y-0 ${
                isAuthorized
                  ? 'bg-emerald-600 text-white'
                  : 'bg-brand-primary hover:bg-brand-primary-hover text-white'
              }`}
              type="submit"
              disabled={isLoading || isAuthorized}
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  Connexion...
                </>
              ) : isAuthorized ? (
                <>
                  <span className="material-symbols-outlined">verified_user</span>
                  Autorisé : {selectedUserForLogin?.role}
                </>
              ) : (
                <>
                  Se Connecter
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>

            {/* Accès Rapide Roles Grid */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                Rôles d'accès rapide (Démo)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Gouverneur')}
                  className="p-2 border border-indigo-50 hover:border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50 rounded-xl text-left text-xs transition-all flex flex-col justify-between"
                >
                  <span className="font-bold text-brand-primary">Admin</span>
                  <span className="text-[9px] text-gray-400 mt-0.5 truncate">admin@company.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Directeur')}
                  className="p-2 border border-sky-50 hover:border-sky-100 bg-sky-50/30 hover:bg-sky-50 rounded-xl text-left text-xs transition-all flex flex-col justify-between"
                >
                  <span className="font-bold text-brand-secondary">Directeur</span>
                  <span className="text-[9px] text-gray-400 mt-0.5 truncate">director@company.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Gestionnaire')}
                  className="p-2 border border-emerald-50 hover:border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50 rounded-xl text-left text-xs transition-all flex flex-col justify-between"
                >
                  <span className="font-bold text-emerald-700">Stock Manager</span>
                  <span className="text-[9px] text-gray-400 mt-0.5 truncate">inventory@company.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Caissier')}
                  className="p-2 border border-amber-50 hover:border-amber-100 bg-amber-50/30 hover:bg-amber-50 rounded-xl text-left text-xs transition-all flex flex-col justify-between"
                >
                  <span className="font-bold text-amber-700">Caissier (POS)</span>
                  <span className="text-[9px] text-gray-400 mt-0.5 truncate">cashier@company.com</span>
                </button>
              </div>
            </div>
          </form>

          {/* SSO Options */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest text-gray-400 font-bold bg-white px-3">
              Accès Autorisé Uniquement
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                handleQuickLogin('Gouverneur');
              }}
              className="flex items-center justify-center gap-2 h-10 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-brand-accent">key</span>
              Connexion SSO
            </button>
            <button
              onClick={() => {
                const code = prompt('Veuillez saisir votre jeton d\'authentification mobile à 6 chiffres (Simulé : 481023) :');
                if (code) {
                  handleQuickLogin('Gouverneur');
                }
              }}
              className="flex items-center justify-center gap-2 h-10 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-brand-accent">qr_code_2</span>
              Validation Mobile
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-gray-400 font-sans">
          <p>© 2026 SmartStock ERP. Tous les systèmes sont opérationnels.</p>
          <div className="flex justify-center gap-6 mt-3 font-semibold text-gray-500">
            <button onClick={() => alert('Certification d\'audit de sécurité : conformité SOC2 Type II vérifiée.')} className="hover:text-gray-800 transition-colors">
              Politique de Sécurité
            </button>
            <span>•</span>
            <button onClick={() => alert('Lignes d\'assistance technique : support@smartstock-erp.com')} className="hover:text-gray-800 transition-colors">
              Assistance Technique
            </button>
          </div>
        </footer>
      </main>

      {/* Side Image Section (Desktop Only) */}
      <div className="hidden lg:block absolute right-0 top-0 w-[30%] h-full overflow-hidden select-none">
        <div
          className="w-full h-full relative bg-cover bg-center transition-transform duration-1000 hover:scale-105"
          style={{ backgroundImage: `url('${LOGIN_BG_IMAGE}')` }}
        >
          {/* Gradients overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#fcf8fa] via-[#fcf8fa]/40 to-transparent w-40 z-10"></div>
          <div className="absolute inset-0 bg-indigo-900/10 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#131b2e]/60 to-transparent"></div>

          {/* Slogan */}
          <div className="absolute bottom-12 left-12 right-12 text-white z-20">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 inline-block">
              Centre d'Automatisation
            </span>
            <h3 className="text-xl font-bold leading-tight font-sans text-white">
              Systèmes de stockage automatisés avec gestion commerciale haute densité.
            </h3>
            <p className="text-xs text-gray-200 font-sans mt-2">
              Les opérateurs autorisés peuvent sécuriser les boucles de connexion directement avec un accès SSO.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
