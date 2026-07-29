import { useState, useEffect, useCallback } from 'react';
import type { Product } from '../types';
import { INITIAL_PRODUCTS } from '../data';

const API_URL = 'http://localhost:3000/api';

export function useCatalog() {
  const [products, setProducts] = (useState as any)([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = (useState as any)(null);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const updatePendingCount = () => {
    const queue = JSON.parse(localStorage.getItem('pos_sync_queue') || '[]');
    setPendingSyncCount(queue.length);
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/products`, {
        signal: AbortSignal.timeout(3000) // Timeout rapide pour détecter le mode hors-ligne
      });
      if (!res.ok) throw new Error('Erreur de récupération du catalogue');
      
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setProducts(data);
        localStorage.setItem('pos_catalog_cache', JSON.stringify(data));
      } else {
        // Si l'API renvoie un tableau vide, utiliser le cache ou les données initiales
        const cached = localStorage.getItem('pos_catalog_cache');
        const fallbackData = cached ? JSON.parse(cached) : INITIAL_PRODUCTS;
        setProducts(fallbackData);
      }
      setError(null);
      setIsOnline(true);
    } catch (err: any) {
      console.warn("Mode Hors-Ligne activé : Utilisation du cache ou des données initiales", err);
      setIsOnline(false);
      
      // Chargement depuis le cache local ou les données initiales du projet
      const cached = localStorage.getItem('pos_catalog_cache');
      if (cached) {
        setProducts(JSON.parse(cached));
      } else {
        setProducts(INITIAL_PRODUCTS);
      }
      setError(null); // Des données valides sont affichées
    } finally {
      setLoading(false);
      updatePendingCount();
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    
    // Écouter les changements de connexion du navigateur
    const handleOnline = () => { setIsOnline(true); syncPendingSales(); };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchProducts]);

  const checkoutCart = async (cart: any[], total: number) => {
    try {
      const res = await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart, total }),
        signal: AbortSignal.timeout(3000)
      });
      
      if (!res.ok) throw new Error('Erreur lors du checkout');
      
      setIsOnline(true);
      await fetchProducts(); // Rafraîchir les stocks
      return true;
    } catch (err) {
      console.warn("Checkout hors-ligne : mise en file d'attente", err);
      setIsOnline(false);
      
      // Mettre dans la file d'attente
      const queue = JSON.parse(localStorage.getItem('pos_sync_queue') || '[]');
      queue.push({ cart, total, timestamp: Date.now() });
      localStorage.setItem('pos_sync_queue', JSON.stringify(queue));
      
      // Décrémenter le stock dans le cache local (Optimistic update)
      const cached = localStorage.getItem('pos_catalog_cache');
      if (cached) {
        let cachedProducts: Product[] = JSON.parse(cached);
        cachedProducts = cachedProducts.map(p => {
          const item = cart.find(i => i.id === p.id);
          if (item) return { ...p, stock: Math.max(0, p.stock - item.quantity) };
          return p;
        });
        localStorage.setItem('pos_catalog_cache', JSON.stringify(cachedProducts));
        setProducts(cachedProducts);
      }
      
      updatePendingCount();
      return true; // Retourne true car la vente est validée localement
    }
  };

  const syncPendingSales = async () => {
    const queue = JSON.parse(localStorage.getItem('pos_sync_queue') || '[]');
    if (queue.length === 0) return;

    try {
      console.log(`Tentative de synchronisation de ${queue.length} ventes...`);
      const remainingQueue = [...queue];

      for (const sale of queue) {
        const res = await fetch(`${API_URL}/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cart: sale.cart, total: sale.total }),
        });

        if (!res.ok) throw new Error("Échec d'une synchronisation");

        // Retirer la vente synchronisée avec succès
        remainingQueue.shift();
        localStorage.setItem('pos_sync_queue', JSON.stringify(remainingQueue));
      }

      console.log("Synchronisation terminée avec succès !");
      setIsOnline(true);
      await fetchProducts(); // Rafraîchir les vrais stocks depuis le serveur
    } catch (err) {
      console.error("Échec de la synchronisation, réessai ultérieur pour la suite.", err);
      setIsOnline(false);
    }
    updatePendingCount();
  };

  return { 
    products, 
    loading, 
    error, 
    isOnline,
    pendingSyncCount,
    refreshCatalog: fetchProducts, 
    checkoutCart,
    syncPendingSales 
  };
}
