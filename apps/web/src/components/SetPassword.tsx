import React, { useState, useEffect } from 'react';

interface SetPasswordProps {
  onSuccess: () => void;
}

export const SetPassword: React.FC<SetPasswordProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    // Extract access_token from URL hash (Supabase default behavior)
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      const tokenMatch = hash.match(/access_token=([^&]+)/);
      if (tokenMatch) {
        setAccessToken(tokenMatch[1]);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3000/api/set-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ password })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la définition du mot de passe');
      }

      // Clear the hash from URL
      window.history.replaceState(null, '', window.location.pathname);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-surface-container flex flex-col items-center justify-center p-4 font-sans text-brand-text">
      <div className="w-full max-w-md bg-brand-surface rounded-2xl shadow-xl p-8 border border-brand-border">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-brand-primary">lock_reset</span>
          </div>
          <h2 className="text-2xl font-black text-brand-text">Configuration du compte</h2>
          <p className="text-sm text-brand-muted mt-2">
            Veuillez définir votre mot de passe d'accès. 
            <br/><br/>
            <span className="font-bold text-amber-600 bg-amber-50 p-2 rounded-lg inline-block text-xs border border-amber-200">
              <span className="material-symbols-outlined text-[14px] align-middle mr-1">info</span>
              Si vous êtes Caissier ou Magasinier, ce mot de passe servira de <b>code PIN</b>. Veuillez saisir exactement <b>6 chiffres</b> (ex: 123456).
            </span>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-semibold rounded-xl border border-red-100 flex items-center gap-2">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-brand-text">Nouveau mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-brand-surface-container-low border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
              placeholder="Min. 6 caractères"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-brand-text">Confirmer le mot de passe</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-brand-surface-container-low border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
              placeholder="Répéter le mot de passe"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !accessToken}
            className="w-full py-3 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? (
              <><span className="material-symbols-outlined animate-spin">sync</span> Enregistrement...</>
            ) : (
              'Enregistrer et se connecter'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
