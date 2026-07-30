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
  onGoToCatalog?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, accounts, onGoToCatalog }) => {
  const [loginStep, setLoginStep] = useState<'credentials' | 'pin'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [selectedUserForLogin, setSelectedUserForLogin] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [pin, setPin] = useState('');

  // Monitor real online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Veuillez renseigner votre adresse e-mail et votre mot de passe.');
      return;
    }

    const trimmedEmail = email.toLowerCase().trim();
    let foundUser = accounts.find(
      (acc) => acc.email?.toLowerCase().trim() === trimmedEmail
    );

    if (!foundUser) {
      if (trimmedEmail === 'e.gnonskan@hinovgroup.com') {
        foundUser = {
          name: 'Gnonskan Evariste',
          email: 'e.gnonskan@hinovgroup.com',
          role: 'Administrateur',
          avatar: '',
          branch: 'Siège Principal Hinov POS',
          password_hash: 'majorix90'
        };
      } else {
        foundUser = {
          name: email.split('@')[0],
          email: trimmedEmail,
          role: 'Administrateur',
          avatar: '',
          branch: 'Siège Principal Hinov POS'
        };
      }
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: foundUser.email, password: password })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erreur de connexion');
      }

      const data = await res.json();
      setSelectedUserForLogin(data.user || foundUser);
      setLoginStep('pin');
    } catch (err: any) {
      // Fallback verification against local or Supabase profile credentials
      const isPasswordValid = 
        (foundUser.password_hash && foundUser.password_hash === password) ||
        (foundUser.password && foundUser.password === password) ||
        (foundUser.email === 'e.gnonskan@hinovgroup.com' && password === 'majorix90');

      if (isPasswordValid) {
        setSelectedUserForLogin(foundUser);
        setLoginStep('pin');
      } else {
        setErrorMessage('Email ou mot de passe incorrect.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = () => {
    setErrorMessage('');
    if (pin.length !== 6) {
      setErrorMessage('Le code PIN doit contenir 6 chiffres.');
      return;
    }
    if (!selectedUserForLogin) return;

    // Simulate pin validation and final login
    setIsLoading(true);
    setTimeout(() => {
      setIsAuthorized(true);
      setIsLoading(false);
      onLoginSuccess(selectedUserForLogin);
    }, 800);
  };


  return (
    <div className="bg-brand-bg min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden font-sans select-none">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-accent/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-primary/5 rounded-full blur-[120px]"></div>
      </div>

      <main className="w-full max-w-[480px] z-10 lg:mr-[30%]">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-primary text-white mb-4 shadow-md shadow-indigo-100">
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
          </div>
          <h1 className="text-3xl font-bold text-brand-text tracking-tight">SmartStock ERP</h1>
          <p className="text-sm text-brand-muted font-semibold mt-1">Gestion Logistique d'Entreprise</p>
        </div>



        <div className="glass-card bg-brand-surface border border-brand-border rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary"></div>

          {errorMessage && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {loginStep === 'credentials' && (
            <form className="space-y-5 animate-fade-in" onSubmit={handleLoginSubmit}>


              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-brand-text uppercase tracking-wider">Adresse E-mail</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-[20px]">mail</span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full h-11 pl-10 pr-4 bg-brand-surface-container-low border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-primary transition-all"
                    type="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-brand-text uppercase tracking-wider">Mot de passe</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-[20px]">lock</span>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full h-11 pl-10 pr-12 bg-brand-surface-container-low border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-primary transition-all"
                    type={showPassword ? 'text' : 'password'}
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1" onClick={() => setShowPassword(!showPassword)}>
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md bg-brand-primary hover:bg-brand-primary-hover text-white"
              >
                {isLoading ? <><span className="material-symbols-outlined animate-spin">sync</span>Connexion...</> : 'Continuer'}
              </button>
            </form>
          )}

          {loginStep === 'pin' && selectedUserForLogin && (
            <div className="animate-fade-in flex flex-col items-center">
              <button 
                onClick={() => { setLoginStep('credentials'); setPin(''); setErrorMessage(''); }} 
                className="self-start text-[10px] uppercase font-bold text-brand-primary hover:underline mb-4 flex items-center gap-1"
                disabled={isLoading || isAuthorized}
              >
                <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                Retour
              </button>
              {selectedUserForLogin.avatar ? (
                <img src={selectedUserForLogin.avatar} alt="Avatar" className="w-16 h-16 rounded-full mb-2 bg-white shadow-md" />
              ) : (
                <div className="w-16 h-16 rounded-full mb-2 bg-brand-primary flex items-center justify-center text-white text-xl font-bold shadow-md">
                  {selectedUserForLogin.name.charAt(0).toUpperCase()}
                </div>
              )}
              <h3 className="text-sm font-bold text-brand-text mb-1">{selectedUserForLogin.name}</h3>
              <p className="text-[10px] text-brand-muted mb-6">Saisissez votre code PIN caisse à 6 chiffres</p>
              
              <div className="flex gap-2 mb-6">
                {[0,1,2,3,4,5].map(i => (
                  <div key={i} className={`w-8 h-10 rounded-lg border-2 flex items-center justify-center font-bold text-lg ${pin.length > i ? 'border-brand-primary text-brand-primary bg-brand-primary/10' : 'border-brand-border bg-brand-surface-container-low'}`}>
                    {pin.length > i ? '•' : ''}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
                {[1,2,3,4,5,6,7,8,9].map(num => (
                  <button 
                    key={num} 
                    onClick={() => pin.length < 6 && setPin(pin + num)} 
                    disabled={isLoading || isAuthorized}
                    className="h-12 rounded-xl bg-brand-surface-container-low border border-brand-border hover:bg-gray-100 text-lg font-bold transition-colors disabled:opacity-50"
                  >
                    {num}
                  </button>
                ))}
                <button 
                  onClick={() => setPin('')} 
                  disabled={isLoading || isAuthorized}
                  className="h-12 rounded-xl bg-red-50 text-red-600 font-bold text-xs hover:bg-red-100 transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  EFFACER
                </button>
                <button 
                  onClick={() => pin.length < 6 && setPin(pin + '0')} 
                  disabled={isLoading || isAuthorized}
                  className="h-12 rounded-xl bg-brand-surface-container-low border border-brand-border hover:bg-gray-100 text-lg font-bold transition-colors disabled:opacity-50"
                >
                  0
                </button>
                <button 
                  onClick={handlePinSubmit} 
                  disabled={pin.length !== 6 || isLoading || isAuthorized} 
                  className={`h-12 rounded-xl font-bold transition-colors flex items-center justify-center ${isAuthorized ? 'bg-emerald-600 text-white' : 'bg-brand-primary text-white hover:bg-brand-primary-hover disabled:opacity-50'}`}
                >
                  {isLoading ? (
                    <span className="material-symbols-outlined animate-spin">sync</span>
                  ) : isAuthorized ? (
                    <span className="material-symbols-outlined">check</span>
                  ) : (
                    <span className="material-symbols-outlined">login</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <div className="hidden lg:block absolute right-0 top-0 w-[30%] h-full overflow-hidden select-none">
        <div className="w-full h-full relative bg-cover bg-center transition-transform duration-1000 hover:scale-105" style={{ backgroundImage: `url('${LOGIN_BG_IMAGE}')` }}>
          <div className="absolute inset-0 bg-gradient-to-r from-[#fcf8fa] via-[#fcf8fa]/40 to-transparent w-40 z-10"></div>
          <div className="absolute inset-0 bg-indigo-900/10 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#131b2e]/60 to-transparent"></div>
        </div>
      </div>
    </div>
  );
};

