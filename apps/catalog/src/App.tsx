import { useState } from 'react';
import { useCatalog } from '@pos/core';
import type { Product } from '@pos/core';

interface CartItem extends Product {
  quantity: number;
}

function App() {
  const { products, loading, error } = useCatalog();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const WHATSAPP_NUMBER = "+2250714271333";

  const addToCart = (product: any) => {
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

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleWhatsAppOrder = () => {
    if (cart.length === 0) return;

    let message = `Bonjour, je souhaite passer une commande :\n\n`;
    cart.forEach(item => {
      message += `- ${item.quantity}x ${item.name} (${(item.price * item.quantity).toLocaleString('fr-FR')} F)\n`;
    });
    message += `\n*Total : ${total.toLocaleString('fr-FR')} F CFA*\n\n`;
    message += `Est-ce disponible ?`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="min-h-screen pb-24 md:pb-0 bg-gray-50 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-5 flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Mon Catalogue</h1>
            <p className="text-xs md:text-sm opacity-80 mt-0.5">Commandez en un clic via WhatsApp</p>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 md:p-3 bg-white/20 rounded-full hover:bg-white/30 transition shadow-sm cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 md:-top-1.5 md:-right-1.5 bg-red-500 text-white text-[10px] md:text-xs font-bold w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full border-2 border-primary shadow-sm">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Product Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500 font-bold animate-pulse text-lg">Chargement du catalogue...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-500 p-6 rounded-2xl text-center border border-red-100 max-w-lg mx-auto mt-10">
            <p className="font-bold text-lg mb-2">Erreur de connexion</p>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {products.map((product: Product) => (
              <div key={product.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 flex flex-col hover:shadow-md hover:border-primary/30 transition-all duration-300 group">
                <div className="relative overflow-hidden">
                  <img src={product.image} alt={product.name} className="w-full h-32 md:h-44 object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-3 md:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] text-primary font-bold uppercase mb-1">{product.category}</p>
                    <h3 className="font-bold text-sm text-gray-800 leading-tight mb-2">{product.name}</h3>
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-3 md:mb-4">
                      <p className="font-black text-primary md:text-lg">{product.price.toLocaleString('fr-FR')} F</p>
                      <p className={`text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full ${product.stock > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {product.stock > 0 ? `${product.stock} en stock` : 'Rupture'}
                      </p>
                    </div>
                    <button 
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                      className={`w-full py-2 md:py-2.5 font-bold text-xs md:text-sm rounded-xl transition-all cursor-pointer ${
                        product.stock > 0 
                          ? 'bg-primary/10 text-primary hover:bg-primary hover:text-white active:scale-95' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {product.stock > 0 ? '+ Ajouter' : 'Indisponible'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Cart Drawer / Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:flex-row md:justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
          <div className="bg-white w-full md:w-[450px] rounded-t-3xl md:rounded-none md:rounded-l-3xl shadow-2xl relative z-10 max-h-[85vh] md:max-h-screen md:h-screen flex flex-col animate-in slide-in-from-bottom md:slide-in-from-right duration-300">
            <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-white md:rounded-tl-3xl">
              <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
                Votre Panier
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto p-4 md:p-6 flex-1 bg-gray-50/50">
              {cart.length === 0 ? (
                <div className="text-center py-8 opacity-50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p>Votre panier est vide</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.quantity} x {item.price.toLocaleString('fr-FR')} F</p>
                      </div>
                      <div className="flex items-center gap-3 md:gap-4">
                        <p className="font-bold text-primary whitespace-nowrap">{(item.price * item.quantity).toLocaleString('fr-FR')} F</p>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded-xl transition-colors cursor-pointer" title="Retirer">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 md:p-6 border-t border-gray-100 bg-white md:bg-gray-50 rounded-t-3xl md:rounded-none shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:shadow-none">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <span className="text-gray-600 font-medium md:text-lg">Total</span>
                <span className="text-2xl md:text-3xl font-black text-gray-800">{total.toLocaleString('fr-FR')} F CFA</span>
              </div>
              <button 
                onClick={handleWhatsAppOrder}
                disabled={cart.length === 0}
                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 text-sm md:text-base cursor-pointer ${
                  cart.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#25D366] text-white hover:bg-[#128C7E] shadow-lg shadow-[#25D366]/30'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564c.173.087.289.129.332.202.043.073.043.423-.101.827z"/>
                </svg>
                Commander via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
