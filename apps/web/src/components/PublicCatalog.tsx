import { useState, useEffect } from 'react';
import { useCatalog } from '@pos/core';
import type { Product } from '@pos/core';

interface CartItem extends Product {
  quantity: number;
}

interface PublicCatalogProps {
  onGoToLogin?: () => void;
}

export function PublicCatalog({ onGoToLogin }: PublicCatalogProps) {
  const { products, loading, error } = useCatalog();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  const WHATSAPP_NUMBER = "+2250714271333";

  // Capturer l'événement PWA 'beforeinstallprompt' pour l'installation autonome du catalogue
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Vérifier si déjà en mode standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Filtrage des produits par recherche et catégorie
  const categories: string[] = ['Tous', ...Array.from(new Set<string>(products.map((p: Product) => p.category || 'Général')))];
  const filteredProducts = products.filter((p: Product) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'Tous' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleWhatsAppOrder = () => {
    if (cart.length === 0) return;

    let message = `Bonjour, je souhaite passer une commande via le Catalogue :\n\n`;
    cart.forEach(item => {
      message += `- ${item.quantity}x ${item.name} (${(item.price * item.quantity).toLocaleString('fr-FR')} F CFA)\n`;
    });
    message += `\n*Total de la commande : ${total.toLocaleString('fr-FR')} F CFA*\n\n`;
    message += `Merci de me confirmer la disponibilité et le mode de livraison !`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="min-h-screen pb-24 md:pb-0 bg-slate-50 font-sans flex flex-col">
      {/* PWA Install Banner */}
      {deferredPrompt && !isInstalled && (
        <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white px-4 py-3 shadow-lg flex items-center justify-between gap-3 text-sm z-50 animate-in slide-in-from-top">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl text-xl">📱</div>
            <div>
              <p className="font-bold">Installer l'application Catalogue</p>
              <p className="text-xs text-purple-200">Ajoutez le catalogue à votre écran d'accueil pour y accéder à tout moment</p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="bg-white text-purple-800 font-bold px-4 py-2 rounded-xl hover:bg-purple-50 transition shadow-md whitespace-nowrap cursor-pointer"
          >
            Installer
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-purple-900 text-white sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-700 flex items-center justify-center font-black text-xl shadow-inner border border-purple-500/30">
              H
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">Hinov Catalogue</h1>
              <p className="text-xs text-purple-200">Commandez en un clic via WhatsApp</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onGoToLogin && (
              <button
                onClick={onGoToLogin}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold transition"
                title="Espace Caisse / Administration"
              >
                🔒 Caisse POS
              </button>
            )}
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-3 bg-white/15 hover:bg-white/25 rounded-2xl transition shadow-sm cursor-pointer"
              aria-label="Voir le panier"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-xs font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-purple-900 shadow-sm animate-pulse">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="max-w-7xl mx-auto px-4 pb-4 pt-1 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Rechercher un produit ou un code..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-purple-950/60 text-white placeholder-purple-300/70 border border-purple-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
            />
            <svg className="w-5 h-5 absolute left-3 top-3 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-purple-800/60 text-purple-200 hover:bg-purple-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 gap-3">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-bold animate-pulse text-base">Chargement du catalogue...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-center border border-red-200 max-w-lg mx-auto mt-10">
            <p className="font-bold text-lg mb-2">Erreur de chargement</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-bold text-lg text-gray-700">Aucun produit trouvé</p>
            <p className="text-sm">Essayez de modifier votre recherche ou la catégorie sélectionnée.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {filteredProducts.map((product: Product) => (
              <div 
                key={product.id} 
                className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200 flex flex-col hover:shadow-lg hover:border-purple-300 transition-all duration-300 group"
              >
                <div className="relative overflow-hidden bg-slate-100">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-36 md:h-44 object-cover group-hover:scale-105 transition-transform duration-500" 
                    onError={(e) => {
                      (e.target as HTMLElement).setAttribute('src', 'https://via.placeholder.com/300?text=Produit');
                    }}
                  />
                  <span className={`absolute top-2 right-2 text-[10px] font-black px-2 py-1 rounded-full shadow-sm ${
                    product.stock > 0 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {product.stock > 0 ? `${product.stock} en stock` : 'Rupture'}
                  </span>
                </div>
                
                <div className="p-3 md:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] text-purple-700 font-bold uppercase tracking-wider mb-1">
                      {product.category || 'Article'}
                    </p>
                    <h3 className="font-bold text-sm text-slate-800 leading-tight mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                  </div>

                  <div>
                    <p className="font-black text-purple-900 md:text-lg mb-3">
                      {product.price.toLocaleString('fr-FR')} <span className="text-xs font-normal">F CFA</span>
                    </p>

                    <button 
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                      className={`w-full py-2.5 font-bold text-xs md:text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        product.stock > 0 
                          ? 'bg-purple-100 text-purple-800 hover:bg-purple-700 hover:text-white active:scale-95' 
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {product.stock > 0 ? '🛒 Ajouter' : 'Indisponible'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-xs border-t border-slate-800">
        <p className="font-medium text-slate-300">Hinov POS & Catalogue Client</p>
        <p className="mt-1">Commandes en ligne sécurisées envoyées directement par WhatsApp.</p>
        {onGoToLogin && (
          <button 
            onClick={onGoToLogin}
            className="mt-3 text-purple-400 hover:underline font-semibold"
          >
            Accès Caisse & Administration POS
          </button>
        )}
      </footer>

      {/* Cart Drawer / Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:flex-row md:justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={() => setIsCartOpen(false)} />
          <div className="bg-white w-full md:w-[450px] rounded-t-3xl md:rounded-none md:rounded-l-3xl shadow-2xl relative z-10 max-h-[90vh] md:max-h-screen md:h-screen flex flex-col animate-in slide-in-from-bottom md:slide-in-from-right duration-300">
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-white md:rounded-tl-3xl">
              <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
                <span>🛍️</span> Votre Panier ({totalItems})
              </h2>
              <button 
                onClick={() => setIsCartOpen(false)} 
                className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto p-4 md:p-6 flex-1 bg-slate-50">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <span className="text-5xl block mb-3">🛒</span>
                  <p className="font-bold text-slate-600">Votre panier est vide</p>
                  <p className="text-xs mt-1">Ajoutez des produits depuis le catalogue pour passer commande.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center gap-3">
                      <div className="flex-1">
                        <p className="font-bold text-sm text-slate-800">{item.name}</p>
                        <p className="text-xs text-purple-700 font-semibold">{item.price.toLocaleString('fr-FR')} F CFA</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-slate-100 rounded-xl p-1">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-6 h-6 flex items-center justify-center font-bold text-slate-600 hover:bg-white rounded-lg transition"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 flex items-center justify-center font-bold text-slate-600 hover:bg-white rounded-lg transition"
                          >
                            +
                          </button>
                        </div>

                        <button 
                          onClick={() => removeFromCart(item.id)} 
                          className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 md:p-6 border-t border-slate-100 bg-white shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-600 font-medium">Total Commande</span>
                <span className="text-2xl font-black text-purple-900">{total.toLocaleString('fr-FR')} F CFA</span>
              </div>

              <button 
                onClick={handleWhatsAppOrder}
                disabled={cart.length === 0}
                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 text-base cursor-pointer ${
                  cart.length === 0 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/30'
                }`}
              >
                <span>💬</span> Commander via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
