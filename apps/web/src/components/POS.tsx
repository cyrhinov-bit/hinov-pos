/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Product, CartItem, User, GovernanceLog, Transaction } from '../types';
import { useBarcodeScanner, useCatalog } from '@pos/core';

declare global {
  interface Window {
    hardwareAPI?: {
      printReceipt: (content: any) => Promise<boolean>;
      openCashDrawer: () => Promise<boolean>;
    };
  }
}


interface POSProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  searchQuery: string;
  onCheckoutSuccess: (amount: number, details: string) => void;
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  onLogout: () => void;
  activeTab: 'sale' | 'suspended' | 'returns' | 'history' | 'caisse' | 'stats' | 'profile' | 'settings';
  setActiveTab: (tab: any) => void;
  activeSubTab: string;
  setActiveSubTab: (subTab: string) => void;
  accounts: User[];
  setAccounts: React.Dispatch<React.SetStateAction<User[]>>;
  logs: GovernanceLog[];
  setLogs: React.Dispatch<React.SetStateAction<GovernanceLog[]>>;
}

interface SuspendedSale {
  id: string;
  date: string;
  time: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  customerType: string;
}

interface CaisseSession {
  id: string;
  cashier: string;
  openedAtDate: string;
  openedAtTime: string;
  closedAtDate?: string;
  closedAtTime?: string;
  initialCash: number;
  salesCash: number;
  salesCard: number;
  salesMobileMoney: number;
  salesMixed: number;
  theoreticalCash: number;
  realCash?: number;
  discrepancy?: number;
  status: 'Open' | 'Closed';
  observation?: string;
}

export const POS: React.FC<POSProps> = ({
  products,
  setProducts,
  cart,
  setCart,
  searchQuery,
  onCheckoutSuccess,
  currentUser,
  setCurrentUser,
  onLogout,
  activeTab,
  setActiveTab,
  activeSubTab,
  setActiveSubTab,
  accounts,
  setAccounts,
  logs,
  setLogs,
}) => {
  // Catalog API
  const { checkoutCart } = useCatalog();

  // Settings & Sound engine states
  const [audioEnabled, setAudioEnabled] = useState<boolean>(() => {
    return localStorage.getItem('pos_setting_sound') !== 'false';
  });
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('pos_setting_display') as 'grid' | 'list') || 'grid';
  });
  const [receiptPrinter, setReceiptPrinter] = useState<string>(() => {
    return localStorage.getItem('pos_setting_printer') || 'Ticket Thermique 80mm';
  });
  const [lowStockAlert, setLowStockAlert] = useState<number>(() => {
    return Number(localStorage.getItem('pos_setting_lowstock') || '5');
  });

  // Physical Barcode Scanner Hook
  const scannedBarcode = useBarcodeScanner();
  
  useEffect(() => {
    if (scannedBarcode && activeTab === 'sale') {
      processBarcodeScan(scannedBarcode);
    }
  }, [scannedBarcode]);

  // Caisse Session States
  const [caisseOpen, setCaisseOpen] = useState<boolean>(() => {
    return localStorage.getItem('pos_caisse_open') === 'true';
  });
  const [caisseInitial, setCaisseInitial] = useState<number>(() => {
    return Number(localStorage.getItem('pos_caisse_initial') || '50000');
  });
  const [caisseOpenDate, setCaisseOpenDate] = useState<string>(() => {
    return localStorage.getItem('pos_caisse_open_date') || '';
  });
  const [caisseOpenTime, setCaisseOpenTime] = useState<string>(() => {
    return localStorage.getItem('pos_caisse_open_time') || '';
  });
  const [caisseSessionId, setCaisseSessionId] = useState<string>(() => {
    return localStorage.getItem('pos_caisse_session_id') || '';
  });

  const [companySettings] = useState(() => {
    const saved = localStorage.getItem('pos_company_settings');
    if (saved) return JSON.parse(saved);
    return {
      name: 'SUPERMARCHÉ MODERNE',
      logo: '',
      address: 'SmartStock ERP • Point de Vente',
      phone: ''
    };
  });

  // Form states for caisse opening & closing
  const [openFormCash, setOpenFormCash] = useState<string>('50000');
  const [openFormObs, setOpenFormObs] = useState<string>('');
  const [closeFormRealCash, setCloseFormRealCash] = useState<string>('');
  const [closeFormObs, setCloseFormObs] = useState<string>('');

  // Suspended Sales state
  const [suspendedSales, setSuspendedSales] = useState<SuspendedSale[]>(() => {
    const saved = localStorage.getItem('pos_suspended_sales');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'SUSP-8172',
        date: new Date().toLocaleDateString('fr-FR'),
        time: '10:42',
        items: [
          { product: products[0] || {} as Product, quantity: 2 }
        ],
        subtotal: (products[0]?.price || 0) * 2,
        total: Math.round(((products[0]?.price || 0) * 2) * 1.08),
        customerType: 'walkin',
      }
    ].filter(s => s.items[0]?.product?.id); // filter invalid mock templates
  });

  // Sales sessions / Opening closure logs state
  const [caisseSessions, setCaisseSessions] = useState<CaisseSession[]>(() => {
    const saved = localStorage.getItem('pos_caisse_sessions');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'SESS-2026-07-01',
        cashier: currentUser.name,
        openedAtDate: '2026-07-01',
        openedAtTime: '08:00',
        closedAtDate: '2026-07-01',
        closedAtTime: '18:15',
        initialCash: 50000,
        salesCash: 125000,
        salesCard: 80000,
        salesMobileMoney: 45000,
        salesMixed: 0,
        theoreticalCash: 175000,
        realCash: 175000,
        discrepancy: 0,
        status: 'Closed',
        observation: 'Caisse fermée sans aucun écart constaté. Fin de service.',
      }
    ];
  });

  // Completed Sales History
  const [completedSales, setCompletedSales] = useState<any[]>(() => {
    const saved = localStorage.getItem('pos_completed_sales');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'TX-0192',
        date: new Date().toISOString().split('T')[0],
        time: '14:15',
        cashier: currentUser.name,
        customerType: 'Client de passage',
        payMethod: 'ESPÈCES',
        subtotal: 150000,
        tax: 12000,
        total: 162000,
        items: [
          {
            product: { sku: 'FRN-00214', name: 'Cafetière Espresso Automatique', price: 150000 },
            quantity: 1
          }
        ],
        status: 'Valid',
      }
    ];
  });

  // Profile modifications state
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profilePhone, setProfilePhone] = useState('');
  const [profilePassword, setProfilePassword] = useState('');

  // Sale Checkout input fields states
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [payMethod, setPayMethod] = useState<'cash' | 'card' | 'mobile' | 'cheque' | 'mixed'>('cash');
  const [customer, setCustomer] = useState<'walkin' | 'corporate' | 'vip'>('walkin');
  
  // Cash details
  const [cashReceived, setCashReceived] = useState<string>('');
  
  // Mobile money details
  const [mmOperator, setMmOperator] = useState<string>('Wave');
  const [mmPhone, setMmPhone] = useState<string>('');
  const [mmRef, setMmRef] = useState<string>('');

  // Mixed details
  const [mixedCash, setMixedCash] = useState<string>('');
  const [mixedCard, setMixedCard] = useState<string>('');
  const [mixedMobile, setMixedMobile] = useState<string>('');

  // Cheque details
  const [chequeBank, setChequeBank] = useState<string>('');
  const [chequeNumber, setChequeNumber] = useState<string>('');

  // Global Cart Discount State
  const [globalDiscountType, setGlobalDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [globalDiscountValue, setGlobalDiscountValue] = useState<string>('0');

  // Returns Search State
  const [returnSearchId, setReturnSearchId] = useState('');
  const [foundReturnTx, setFoundReturnTx] = useState<any | null>(null);
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState('');
  const [returnActionType, setReturnActionType] = useState<'refund' | 'exchange'>('refund');
  const [exchangeProductSku, setExchangeProductSku] = useState('');

  // Payment & Receipt Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [recentReceipt, setRecentReceipt] = useState<any | null>(null);

  // Synchronize localStorage
  useEffect(() => {
    localStorage.setItem('pos_setting_sound', String(audioEnabled));
  }, [audioEnabled]);

  useEffect(() => {
    localStorage.setItem('pos_setting_display', displayMode);
  }, [displayMode]);

  useEffect(() => {
    localStorage.setItem('pos_setting_printer', receiptPrinter);
  }, [receiptPrinter]);

  useEffect(() => {
    localStorage.setItem('pos_setting_lowstock', String(lowStockAlert));
  }, [lowStockAlert]);

  useEffect(() => {
    localStorage.setItem('pos_suspended_sales', JSON.stringify(suspendedSales));
  }, [suspendedSales]);

  useEffect(() => {
    localStorage.setItem('pos_caisse_sessions', JSON.stringify(caisseSessions));
  }, [caisseSessions]);

  useEffect(() => {
    localStorage.setItem('pos_completed_sales', JSON.stringify(completedSales));
  }, [completedSales]);

  // Dynamic sound effects engine (Beep on scan, cash register chime)
  const playSound = (type: 'beep' | 'cash') => {
    if (!audioEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (type === 'beep') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'cash') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, ctx.currentTime);
        osc1.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1320, ctx.currentTime);
        osc2.frequency.setValueAtTime(1650, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.4);
        osc2.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn('AudioContext failed to load due to iframe permission limits: ', e);
    }
  };

  // Barcode Scanner states
  const [scanInput, setScanInput] = useState<string>('');
  const [scanToast, setScanToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-focus barcode scan field when in sale tab and caisse is open
  useEffect(() => {
    if (activeTab === 'sale' && caisseOpen) {
      const timer = setTimeout(() => {
        const field = document.getElementById('pos-scan-field');
        if (field) field.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, caisseOpen, cart.length]);

  // Keyboard Shortcuts listener (F1-F6, Entrée, Suppr, Échap)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT'
      );

      // Function keys (F1-F6) are ALWAYS captured to navigate the POS
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('sale');
        setTimeout(() => {
          const cashInput = document.getElementById('pos-cash-input') || document.getElementById('pos-scan-field');
          if (cashInput) (cashInput as HTMLElement).focus();
        }, 150);
      } else if (e.key === 'F2') {
        e.preventDefault();
        handleSuspendSale();
      } else if (e.key === 'F3') {
        e.preventDefault();
        if (cart.length > 0 && window.confirm('Voulez-vous vraiment annuler la vente et vider le panier ?')) {
          handleClearCart();
        }
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) {
          const lastItem = cart[cart.length - 1];
          const newQtyStr = window.prompt(`[F4] Modifier la quantité de "${lastItem.product.name}" (en stock: ${lastItem.product.stock}) :`, String(lastItem.quantity));
          if (newQtyStr !== null) {
            const val = parseInt(newQtyStr, 10);
            if (!isNaN(val) && val > 0) {
              if (val > lastItem.product.stock) {
                alert(`Stock maximum disponible dépassé (${lastItem.product.stock}).`);
              } else {
                const updatedCart = [...cart];
                updatedCart[cart.length - 1].quantity = val;
                setCart(updatedCart);
                playSound('beep');
              }
            } else if (val === 0) {
              setCart(cart.filter(item => item.product.id !== lastItem.product.id));
            }
          }
        } else {
          alert('Le panier est vide.');
        }
      } else if (e.key === 'F5') {
        e.preventDefault();
        const nextCust = customer === 'walkin' ? 'corporate' : customer === 'corporate' ? 'vip' : 'walkin';
        setCustomer(nextCust);
      } else if (e.key === 'F6') {
        e.preventDefault();
        setActiveTab('history');
      } else if (e.key === 'Enter') {
        // If the user hits enter outside of an input, and the cart is filled, trigger checkout
        if (activeTab === 'sale' && !isInput && cart.length > 0) {
          e.preventDefault();
          handleCheckout();
        }
      } else if (e.key === 'Delete' || e.key === 'Del') {
        // Supprimer le dernier article du panier
        if (activeTab === 'sale' && !isInput && cart.length > 0) {
          e.preventDefault();
          const lastItem = cart[cart.length - 1];
          if (window.confirm(`Supprimer ${lastItem.product.name} du panier ?`)) {
            setCart(cart.slice(0, -1));
          }
        }
      } else if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        if (showPaymentModal) {
          setShowPaymentModal(false);
        } else if (showReceipt) {
          setShowReceipt(false);
        } else {
          setActiveTab('sale');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, customer, activeTab, showReceipt, payMethod, cashReceived, mixedCash, mixedCard, mixedMobile, caisseOpen, showPaymentModal]);

  // Barcode Scanner core lookup logic
  const processBarcodeScan = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    if (!caisseOpen) {
      alert("Veuillez d'abord ouvrir la caisse dans l'onglet 'Gestion de la caisse'.");
      setActiveTab('caisse');
      return;
    }

    // Match by SKU/Barcode (exact, case-insensitive) or by Name
    const found = products.find(
      p => p.sku.toLowerCase() === trimmed.toLowerCase() || p.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (found) {
      if (found.isActive === false) {
        setScanToast({ message: `L'article "${found.name}" est désactivé et ne peut pas être vendu.`, type: 'error' });
        setTimeout(() => setScanToast(null), 3500);
        setScanInput('');
        return;
      }

      if (found.stock <= 0) {
        setScanToast({ message: `Rupture de stock pour "${found.name}" (SKU: ${found.sku})`, type: 'error' });
        setTimeout(() => setScanToast(null), 3500);
        setScanInput('');
        return;
      }

      // Add to cart
      handleAddToCart(found);

      // Show confirmation visual feedback
      setScanToast({
        message: `✔ Article détecté : ${found.name} (${found.price.toLocaleString('fr-FR')} F CFA) - Ajouté au panier !`,
        type: 'success'
      });
      setTimeout(() => setScanToast(null), 3000);
    } else {
      // Inconnu
      setScanToast({
        message: `⚠ Code-barres inconnu : "${trimmed}". Aucun article correspondant trouvé dans l'ERP.`,
        type: 'error'
      });
      setTimeout(() => setScanToast(null), 4000);
    }

    setScanInput('');
    // Recenter cursor automatically
    setTimeout(() => {
      const field = document.getElementById('pos-scan-field');
      if (field) field.focus();
    }, 50);
  };

  const handleScanInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      processBarcodeScan(scanInput);
    }
  };

  const handleManualScanSubmit = () => {
    processBarcodeScan(scanInput);
  };

  // Categories helper
  const categories = useMemo(() => {
    return ['Tous', ...Array.from(new Set(products.map((p) => p.category)))];
  }, [products]);

  // Filtered Products Catalog
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Must be active to be displayed in the POS catalog
      const isProductActive = p.isActive !== false;
      if (!isProductActive) return false;

      const matchesCategory = selectedCategory === 'Tous' || p.category === selectedCategory;
      const pSubCat = (p.subCategory || p.subcategory || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        pSubCat.includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart actions with beep
  const handleAddToCart = (product: Product) => {
    if (!caisseOpen) {
      alert("La caisse est actuellement fermée. Vous devez ouvrir la caisse dans l'onglet 'Gestion de la caisse' avant de pouvoir faire une vente.");
      setActiveTab('caisse');
      return;
    }
    if (product.stock <= 0) {
      alert('Ce produit est actuellement en rupture de stock.');
      return;
    }

    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty >= product.stock) {
        alert(`Impossible d'ajouter plus. Seulement ${product.stock} unités disponibles en stock.`);
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    playSound('beep');
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    const itemIndex = cart.findIndex((item) => item.product.id === productId);
    if (itemIndex === -1) return;

    const item = cart[itemIndex];
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      setCart(cart.filter((i) => i.product.id !== productId));
    } else {
      if (newQty > item.product.stock) {
        alert(`Stock maximum disponible dépassé (${item.product.stock}).`);
        return;
      }
      const updatedCart = [...cart];
      updatedCart[itemIndex].quantity = newQty;
      setCart(updatedCart);
    }
    playSound('beep');
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setGlobalDiscountValue('0');
  };

  const handleSetItemDiscount = (productId: string, type: 'percent' | 'fixed', value: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        return {
          ...item,
          discountType: type,
          discountValue: Math.max(0, value),
        };
      }
      return item;
    }));
  };

  const handleClearItemDiscount = (productId: string) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const { discountType, discountValue, ...rest } = item;
        return rest;
      }
      return item;
    }));
  };

  // Comprehensive pricing math with item discounts & global cart discount
  const cartTotals = useMemo(() => {
    let subtotalGross = 0;
    let totalItemDiscounts = 0;

    const itemsCalculated = cart.map((item) => {
      const lineGross = item.product.price * item.quantity;
      let lineDiscount = 0;

      if (item.discountType === 'percent' && item.discountValue && item.discountValue > 0) {
        const pct = Math.min(100, Math.max(0, item.discountValue));
        lineDiscount = Math.round(lineGross * (pct / 100));
      } else if (item.discountType === 'fixed' && item.discountValue && item.discountValue > 0) {
        lineDiscount = Math.min(lineGross, Math.max(0, item.discountValue));
      }

      const lineNet = lineGross - lineDiscount;
      subtotalGross += lineGross;
      totalItemDiscounts += lineDiscount;

      return {
        ...item,
        lineGross,
        lineDiscount,
        lineNet,
      };
    });

    const subtotalAfterItemDiscounts = subtotalGross - totalItemDiscounts;

    let globalDiscount = 0;
    const gVal = Math.max(0, Number(globalDiscountValue) || 0);
    if (globalDiscountType === 'percent' && gVal > 0) {
      globalDiscount = Math.round(subtotalAfterItemDiscounts * (Math.min(100, gVal) / 100));
    } else if (globalDiscountType === 'fixed' && gVal > 0) {
      globalDiscount = Math.min(subtotalAfterItemDiscounts, gVal);
    }

    const totalDiscounts = totalItemDiscounts + globalDiscount;
    const subtotalNet = Math.max(0, subtotalAfterItemDiscounts - globalDiscount);
    const taxRate = 0; // 0% TVA
    const tax = Math.round(subtotalNet * taxRate);
    const total = subtotalNet + tax;

    return {
      itemsCalculated,
      subtotalGross,
      totalItemDiscounts,
      subtotalAfterItemDiscounts,
      globalDiscount,
      totalDiscounts,
      subtotalNet,
      taxRate,
      tax,
      total,
    };
  }, [cart, globalDiscountType, globalDiscountValue]);

  const {
    itemsCalculated,
    subtotalGross,
    totalItemDiscounts,
    subtotalAfterItemDiscounts,
    globalDiscount,
    totalDiscounts,
    subtotalNet,
    tax,
    total,
  } = cartTotals;

  const subtotal = subtotalGross;

  // Change calculator for Cash Payment
  const monnaieARendre = useMemo(() => {
    if (payMethod !== 'cash') return 0;
    const received = Number(cashReceived) || 0;
    if (received < total) return 0;
    return received - total;
  }, [cashReceived, total, payMethod]);

  const cashIsSufficient = useMemo(() => {
    if (payMethod !== 'cash') return true;
    const received = Number(cashReceived) || 0;
    return received >= total;
  }, [cashReceived, total, payMethod]);

  // Mixed splits validations
  const mixedAmountsSum = useMemo(() => {
    if (payMethod !== 'mixed') return 0;
    const cash = Number(mixedCash) || 0;
    const card = Number(mixedCard) || 0;
    const mm = Number(mixedMobile) || 0;
    return cash + card + mm;
  }, [payMethod, mixedCash, mixedCard, mixedMobile]);

  const mixedRemaining = useMemo(() => {
    return Math.max(0, total - mixedAmountsSum);
  }, [total, mixedAmountsSum]);

  const mixedIsMatched = useMemo(() => {
    return mixedRemaining === 0;
  }, [mixedRemaining]);

  // Simulated scan tool
  const triggerSimulatedBarcodeScan = () => {
    if (!caisseOpen) {
      setScanToast({ message: "Veuillez d'abord ouvrir la caisse.", type: 'error' });
      setTimeout(() => setScanToast(null), 3000);
      setActiveTab('caisse');
      return;
    }
    const eligible = products.filter(p => p.stock > 0);
    if (eligible.length === 0) {
      setScanToast({ message: 'Tous les produits du stock sont actuellement en rupture.', type: 'error' });
      setTimeout(() => setScanToast(null), 3000);
      return;
    }
    const randomProduct = eligible[Math.floor(Math.random() * eligible.length)];
    handleAddToCart(randomProduct);
    
    setScanToast({
      message: `✔ [Simulateur] SKU ${randomProduct.sku} (${randomProduct.name}) scanné !`,
      type: 'success'
    });
    setTimeout(() => setScanToast(null), 3000);
  };

  // Caisse Session Operations
  const handleOpenCaisse = (e: React.FormEvent) => {
    e.preventDefault();
    const initialAmt = Number(openFormCash) || 0;
    if (initialAmt < 0) {
      alert('Le montant de départ doit être supérieur ou égal à 0.');
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const sId = `SESS-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${now.getTime().toString().slice(-4)}`;

    setCaisseOpen(true);
    setCaisseInitial(initialAmt);
    setCaisseOpenDate(dateStr);
    setCaisseOpenTime(timeStr);
    setCaisseSessionId(sId);

    localStorage.setItem('pos_caisse_open', 'true');
    localStorage.setItem('pos_caisse_initial', String(initialAmt));
    localStorage.setItem('pos_caisse_open_date', dateStr);
    localStorage.setItem('pos_caisse_open_time', timeStr);
    localStorage.setItem('pos_caisse_session_id', sId);

    // Create a new session record
    const newSession: CaisseSession = {
      id: sId,
      cashier: currentUser.name,
      openedAtDate: dateStr,
      openedAtTime: timeStr,
      initialCash: initialAmt,
      salesCash: 0,
      salesCard: 0,
      salesMobileMoney: 0,
      salesMixed: 0,
      theoreticalCash: initialAmt,
      status: 'Open',
      observation: openFormObs,
    };

    setCaisseSessions(prev => [newSession, ...prev]);

    // Governance log entry
    const newLog: GovernanceLog = {
      id: `GOV-${Math.floor(10000 + Math.random() * 90000)}`,
      type: 'audit',
      title: 'Ouverture de Caisse Enregistrée',
      description: `Session ${sId} ouverte par ${currentUser.name} avec un fond de caisse initial de ${initialAmt.toLocaleString('fr-FR')} F CFA.`,
      timestamp: timeStr,
      code: 'PDV-OP',
    };
    setLogs([newLog, ...logs]);

    alert(`Caisse ouverte avec succès ! Fond initial : ${initialAmt.toLocaleString('fr-FR')} F CFA.`);
    setActiveTab('sale');
  };

  const handleCloseCaisse = (e: React.FormEvent) => {
    e.preventDefault();
    const counted = Number(closeFormRealCash);
    if (closeFormRealCash === '') {
      alert('Veuillez compter et saisir le montant réel en espèces.');
      return;
    }

    // Find active open session
    const updatedSessions = caisseSessions.map(sess => {
      if (sess.id === caisseSessionId && sess.status === 'Open') {
        const discrepancy = counted - sess.theoreticalCash;
        const now = new Date();
        return {
          ...sess,
          closedAtDate: now.toISOString().split('T')[0],
          closedAtTime: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          realCash: counted,
          discrepancy,
          status: 'Closed' as const,
          observation: closeFormObs,
        };
      }
      return sess;
    });

    setCaisseSessions(updatedSessions);

    // Lock local storage
    setCaisseOpen(false);
    setCaisseInitial(0);
    setCaisseOpenDate('');
    setCaisseOpenTime('');
    setCaisseSessionId('');

    localStorage.setItem('pos_caisse_open', 'false');
    localStorage.setItem('pos_caisse_initial', '0');
    localStorage.setItem('pos_caisse_open_date', '');
    localStorage.setItem('pos_caisse_open_time', '');
    localStorage.setItem('pos_caisse_session_id', '');

    // Log closure
    const newLog: GovernanceLog = {
      id: `GOV-${Math.floor(10000 + Math.random() * 90000)}`,
      type: counted === 0 ? 'audit' : 'success',
      title: 'Fermeture de Caisse Enregistrée',
      description: `Session fermée par ${currentUser.name}. Espèces comptées: ${counted.toLocaleString('fr-FR')} F CFA.`,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour12: false }),
      code: 'PDV-CL',
    };
    setLogs([newLog, ...logs]);

    alert('Caisse fermée et rapport de session sauvegardé avec succès.');
    setActiveTab('caisse');
  };

  // Suspend sale cart
  const handleSuspendSale = () => {
    if (cart.length === 0) {
      alert('Impossible de suspendre un panier vide.');
      return;
    }
    const now = new Date();
    const newSuspended: SuspendedSale = {
      id: `SUSP-${Math.floor(1000 + Math.random() * 9000)}`,
      date: now.toLocaleDateString('fr-FR'),
      time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      items: [...cart],
      subtotal,
      total,
      customerType: customer,
    };

    setSuspendedSales(prev => [newSuspended, ...prev]);
    setCart([]);
    alert(`La vente a été suspendue avec succès sous la référence ${newSuspended.id}.`);
  };

  // Resume suspended sale
  const handleResumeSuspended = (sale: SuspendedSale) => {
    if (cart.length > 0) {
      if (!window.confirm("Votre panier actif n'est pas vide. Voulez-vous fusionner les articles de la vente suspendue dans le panier actif ?")) {
        return;
      }
    }
    
    // Merge or set
    const merged = [...cart];
    sale.items.forEach(item => {
      const matchIdx = merged.findIndex(i => i.product.id === item.product.id);
      if (matchIdx > -1) {
        merged[matchIdx].quantity = Math.min(merged[matchIdx].product.stock, merged[matchIdx].quantity + item.quantity);
      } else {
        merged.push(item);
      }
    });

    setCart(merged);
    setSuspendedSales(prev => prev.filter(s => s.id !== sale.id));
    alert(`Vente suspendue ${sale.id} restaurée !`);
    setActiveTab('sale');
  };

  const handleDeleteSuspended = (id: string) => {
    if (window.confirm('Voulez-vous vraiment détruire définitivement cette vente suspendue ?')) {
      setSuspendedSales(prev => prev.filter(s => s.id !== id));
    }
  };

  // Complete Transaction Checkout process
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Le panier est vide.');
      return;
    }

    if (payMethod === 'cash' && !cashIsSufficient) {
      alert("Le montant remis est inférieur au montant total de la facture.");
      return;
    }

    if (payMethod === 'mixed' && !mixedIsMatched) {
      alert(`Le montant cumulé de la répartition mixte (${mixedAmountsSum.toLocaleString('fr-FR')} F CFA) ne correspond pas au total de la facture (${total.toLocaleString('fr-FR')} F CFA).`);
      return;
    }

    // API Call to deduct stock in Database
    checkoutCart(cart, total).catch(err => console.error("API Checkout error:", err));

    // Deduct stock levels in global products state
    const updatedProducts = products.map((p) => {
      const cartItem = cart.find((item) => item.product.id === p.id);
      if (cartItem) {
        return {
          ...p,
          stock: Math.max(0, p.stock - cartItem.quantity),
        };
      }
      return p;
    });
    setProducts(updatedProducts);

    // Calculate billing details
    const receiptId = `TX-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const ticketNumber = `TK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(100000 + Math.random() * 900000))}`;
    const customerLabel = customer === 'walkin' ? 'Client de passage' : customer === 'corporate' ? 'Compte Entreprise' : 'Client VIP';
    
    let payMethodStr = '';
    let detailsLog = '';
    let cashPaidVal = 0;
    let cardPaidVal = 0;
    let mobilePaidVal = 0;
    let chequePaidVal = 0;
    let changeGivenVal = 0;

    if (payMethod === 'cash') {
      payMethodStr = 'ESPÈCES';
      cashPaidVal = Number(cashReceived) || total;
      changeGivenVal = monnaieARendre;
      detailsLog = `Remis: ${cashPaidVal.toLocaleString('fr-FR')} F CFA, Monnaie: ${monnaieARendre.toLocaleString('fr-FR')} F CFA`;
    } else if (payMethod === 'card') {
      payMethodStr = 'CARTE BANCAIRE';
      cardPaidVal = total;
      detailsLog = `Terminal de Caisse Certifié`;
    } else if (payMethod === 'mobile') {
      payMethodStr = `MOBILE MONEY (${mmOperator})`;
      mobilePaidVal = total;
      detailsLog = `Tél: ${mmPhone}, Réf: ${mmRef}`;
    } else if (payMethod === 'cheque') {
      payMethodStr = 'CHÈQUE';
      chequePaidVal = total;
      detailsLog = `Banque: ${chequeBank || 'N/A'}, N° Chèque: ${chequeNumber || 'N/A'}`;
    } else if (payMethod === 'mixed') {
      payMethodStr = 'PAIEMENT MIXTE';
      cashPaidVal = Number(mixedCash) || 0;
      cardPaidVal = Number(mixedCard) || 0;
      mobilePaidVal = Number(mixedMobile) || 0;
      detailsLog = `Répartition - Espèces: ${cashPaidVal.toLocaleString('fr-FR')} F, Carte: ${cardPaidVal.toLocaleString('fr-FR')} F, Mobile: ${mobilePaidVal.toLocaleString('fr-FR')} F`;
    }

    const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    const finalReceipt = {
      id: receiptId,
      ticketNumber: ticketNumber,
      date: dateFormatted,
      time: timeFormatted,
      cashier: currentUser.name,
      caisse: 'POS-01',
      items: itemsCalculated,
      totalItemsCount,
      subtotalGross,
      totalItemDiscounts,
      globalDiscount,
      totalDiscounts,
      subtotal: subtotalNet,
      tax: 0,
      total,
      payMethod: payMethodStr,
      cashPaid: cashPaidVal,
      cardPaid: cardPaidVal,
      mobilePaid: mobilePaidVal,
      chequePaid: chequePaidVal,
      changeGiven: changeGivenVal,
      customer: customerLabel,
      customerType: customerLabel,
      details: detailsLog,
      status: 'Valid',
    };

    // Save to history
    setCompletedSales(prev => [finalReceipt, ...prev]);

    // Update current active caisse session stats
    const updatedSessions = caisseSessions.map(sess => {
      if (sess.id === caisseSessionId && sess.status === 'Open') {
        const salesCashAdd = payMethod === 'cash' ? total : payMethod === 'mixed' ? (Number(mixedCash) || 0) : 0;
        const salesCardAdd = payMethod === 'card' ? total : payMethod === 'mixed' ? (Number(mixedCard) || 0) : 0;
        const salesMobileAdd = payMethod === 'mobile' ? total : payMethod === 'mixed' ? (Number(mixedMobile) || 0) : 0;
        const salesMixedAdd = payMethod === 'mixed' ? total : 0;

        const nextTheoretical = sess.theoreticalCash + salesCashAdd;

        return {
          ...sess,
          salesCash: sess.salesCash + salesCashAdd,
          salesCard: sess.salesCard + salesCardAdd,
          salesMobileMoney: sess.salesMobileMoney + salesMobileAdd,
          salesMixed: sess.salesMixed + salesMixedAdd,
          theoreticalCash: nextTheoretical,
        };
      }
      return sess;
    });
    setCaisseSessions(updatedSessions);

    // Show receipt dialog
    setRecentReceipt(finalReceipt);
    setShowReceipt(true);
    playSound('cash');
    
    // Trigger Hardware Integration if available in Electron
    if (window.hardwareAPI) {
      if (payMethod === 'cash' || payMethod === 'mixed') {
        window.hardwareAPI.openCashDrawer().catch(console.error);
      }
      // Envoyer l'impression du ticket
      window.hardwareAPI.printReceipt(finalReceipt).catch(console.error);
    }

    // Trigger success callback to update Performance stats and add governance logs
    const itemSummaries = cart.map((i) => `${i.quantity}x ${i.product.name}`).join(', ');
    onCheckoutSuccess(total, `Reçu ${receiptId} complété pour ${customerLabel} (Articles : ${itemSummaries}). ${detailsLog}`);

    // Reset checkout form fields
    setCart([]);
    setGlobalDiscountValue('0');
    setCashReceived('');
    setMmPhone('');
    setMmRef('');
    setMixedCash('');
    setMixedCard('');
    setMixedMobile('');
    setChequeBank('');
    setChequeNumber('');
  };

  // Profile Modification Submit
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      alert('Le nom est requis.');
      return;
    }

    const updatedUser = {
      ...currentUser,
      name: profileName,
      phone: profilePhone,
    };
    if (profilePassword) {
      updatedUser.password = profilePassword;
    }

    setCurrentUser(updatedUser);

    // Save to global accounts state
    const updatedAccounts = accounts.map(acc => acc.email === currentUser.email ? { ...acc, ...updatedUser } : acc);
    setAccounts(updatedAccounts);

    alert('Votre profil de caissier a été mis à jour avec succès.');
    setProfilePassword('');
  };

  // Returns / Refund lookup & confirmation
  const handleSearchReturnTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnSearchId.trim()) return;

    // Find in local completed sales history first, or construct from template
    const match = completedSales.find(sale => sale.id.toLowerCase() === returnSearchId.trim().toLowerCase());
    if (match) {
      setFoundReturnTx(match);
      // Initialize return quantities to 0
      const initQtys: Record<string, number> = {};
      match.items.forEach((item: any) => {
        initQtys[item.product.id || item.product.sku] = 0;
      });
      setReturnQuantities(initQtys);
    } else {
      alert("Aucune transaction correspondante trouvée dans l'historique de ce terminal.");
      setFoundReturnTx(null);
    }
  };

  const handleReturnQtyChange = (itemId: string, maxQty: number, val: number) => {
    setReturnQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, Math.min(maxQty, val))
    }));
  };

  const handleProcessReturn = () => {
    if (!foundReturnTx) return;
    const itemsToReturn = foundReturnTx.items.filter((item: any) => {
      const id = item.product.id || item.product.sku;
      return returnQuantities[id] > 0;
    });

    if (itemsToReturn.length === 0) {
      alert('Veuillez sélectionner au moins un article avec une quantité à retourner.');
      return;
    }

    if (!returnReason.trim()) {
      alert('Veuillez saisir le motif du retour.');
      return;
    }

    // 1. Process Stock Adjustment back into products
    const updatedProducts = products.map(p => {
      const returnItem = itemsToReturn.find((ri: any) => ri.product.id === p.id);
      if (returnItem) {
        const id = returnItem.product.id || returnItem.product.sku;
        const qtyReturned = returnQuantities[id];
        return {
          ...p,
          stock: p.stock + qtyReturned,
        };
      }
      return p;
    });
    setProducts(updatedProducts);

    // 2. Adjust complete status or mark as returned in local history
    const updatedHistory = completedSales.map(sale => {
      if (sale.id === foundReturnTx.id) {
        return {
          ...sale,
          status: returnActionType === 'refund' ? 'Refunded' : 'Exchanged',
          details: `Retour traité : ${returnReason}. Type: ${returnActionType === 'refund' ? 'Remboursement' : 'Échange'}`
        };
      }
      return sale;
    });
    setCompletedSales(updatedHistory);

    // 3. Log into governance audit trail
    const auditLogId = `RET-${Math.floor(10000 + Math.random() * 90000)}`;
    const details = itemsToReturn.map((ri: any) => {
      const id = ri.product.id || ri.product.sku;
      return `${returnQuantities[id]}x ${ri.product.name}`;
    }).join(', ');

    const newLog: GovernanceLog = {
      id: auditLogId,
      type: 'audit',
      title: returnActionType === 'refund' ? 'Retour & Remboursement' : 'Retour & Échange',
      description: `Ticket ${foundReturnTx.id} - ${details}. Motif: ${returnReason}. Traité par ${currentUser.name}.`,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour12: false }),
      code: 'PDV-RET',
    };
    setLogs([newLog, ...logs]);

    alert(`Retour enregistré avec succès ! Reçu d'annulation ${auditLogId} généré.`);
    
    // Reset form
    setFoundReturnTx(null);
    setReturnSearchId('');
    setReturnReason('');
  };


  // TAB RENDERING BLOCKS

  // 1. Nouvelle vente Tab (sale)
  const renderSaleTab = () => {
    if (!caisseOpen) {
      return (
        <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl border border-[#c7c4d8]/40 p-8 shadow-xl text-center select-none animate-fade-in">
          <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-100">
            <span className="material-symbols-outlined text-4xl">lock</span>
          </div>
          <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight font-sans">
            La caisse est fermée
          </h3>
          <p className="text-gray-500 text-sm mt-3 leading-relaxed max-w-md mx-auto font-sans">
            Pour commencer à enregistrer des ventes, encaisser des paiements et imprimer des tickets, vous devez ouvrir une session de caisse en indiquant le fonds initial disponible dans le tiroir.
          </p>
          <div className="mt-8 border-t border-gray-100 pt-8 max-w-sm mx-auto">
            <button
              onClick={() => setActiveTab('caisse')}
              className="w-full py-3.5 bg-[#8e24aa] text-white font-bold text-xs rounded-xl hover:bg-[#7b1fa2] shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
              Ouvrir la session de caisse
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
        {/* Left Column: Catalog */}
        <div className="lg:col-span-8 space-y-6">
          {/* Real Barcode Scanner Saisie & Visual feedback Toast */}
          <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#8e24aa]"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 space-y-1">
                <label htmlFor="pos-scan-field" className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wider font-sans flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Pistolet Scanner ou Code-Barres (Toujours actif)
                </label>
                <div className="relative">
                  <input
                    id="pos-scan-field"
                    type="text"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    onKeyDown={handleScanInputKeyDown}
                    placeholder="Scannez un article ou saisissez SKU (ex: ELE-00101, CHS-00302) et Entrée..."
                    className="w-full h-10 pl-9 pr-24 bg-[#fbf4fc]/40 border border-gray-200 focus:border-[#8e24aa] focus:ring-2 focus:ring-purple-100 rounded-xl font-mono text-xs text-[#8e24aa] font-bold outline-none transition-all"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-sm">
                    barcode_reader
                  </span>
                  <button
                    onClick={handleManualScanSubmit}
                    className="absolute right-1.5 top-1.5 bottom-1.5 bg-[#8e24aa] hover:bg-[#7b1fa2] text-white text-[10px] font-bold px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                  >
                    Valider
                  </button>
                </div>
              </div>

              {/* Instant Simulator Control */}
              <div className="flex-shrink-0 flex flex-col gap-1.5">
                <span className="text-[9px] font-extrabold text-[#777587] uppercase tracking-wider text-right block pr-1">Démonstration</span>
                <button
                  onClick={triggerSimulatedBarcodeScan}
                  className="px-4 py-2 bg-purple-50 hover:bg-[#8e24aa] text-[#8e24aa] hover:text-white rounded-xl text-xs font-bold transition-all border border-purple-100 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                  Simuler Scan Aléatoire (Bip)
                </button>
              </div>
            </div>

            {/* In-page Scan Toast Confirmation / Unknown Warning */}
            {scanToast && (
              <div className={`p-3 rounded-xl flex items-center gap-2.5 text-xs font-bold border animate-in slide-in-from-top-1 duration-200 ${
                scanToast.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                  : 'bg-amber-50 border-amber-100 text-amber-800'
              }`}>
                <span className="material-symbols-outlined text-base">
                  {scanToast.type === 'success' ? 'check_circle' : 'warning'}
                </span>
                <p className="font-sans leading-tight">{scanToast.message}</p>
              </div>
            )}
          </div>

          {/* Horizontal Category selector */}
          <div className="flex gap-2 overflow-x-auto pb-1.5 custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all border cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#8e24aa] text-white border-transparent shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Catalog grid */}
          {displayMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredProducts.map((p) => {
                const isLow = p.stock > 0 && p.stock <= lowStockAlert;
                return (
                  <div
                    key={p.id}
                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col h-[320px] select-none"
                  >
                    <div className="relative h-32 bg-gray-100 overflow-hidden">
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        src={p.image}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-gray-700">
                        {p.category}
                      </span>
                      <span className="absolute bottom-3 right-3 bg-purple-950 text-white px-2.5 py-1 rounded-lg text-xs font-bold font-mono">
                        {p.price.toLocaleString('fr-FR')} F CFA
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h5 className="font-bold text-sm text-gray-900 group-hover:text-[#8e24aa] transition-colors truncate font-sans">
                          {p.name}
                        </h5>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono mt-0.5">
                          {p.sku}
                        </p>
                        <p className={`text-[11px] font-semibold mt-2 flex items-center gap-1 ${p.stock <= 0 ? 'text-red-500' : isLow ? 'text-amber-500 font-bold' : 'text-gray-500'}`}>
                          {p.stock <= 0 ? (
                            <>Rupture de stock</>
                          ) : isLow ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-ping"></span>
                              Alerte : {p.stock} restant(s)
                            </>
                          ) : (
                            <>{p.stock} unités disponibles</>
                          )}
                        </p>
                      </div>

                      <button
                        onClick={() => handleAddToCart(p)}
                        disabled={p.stock <= 0}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          p.stock <= 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-purple-50 text-[#8e24aa] hover:bg-[#8e24aa] hover:text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                        Ajouter au Panier
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="col-span-3 text-center py-16 bg-white rounded-2xl border border-gray-100 p-8">
                  <span className="material-symbols-outlined text-gray-300 text-4xl mb-2">search_off</span>
                  <p className="text-gray-400 text-sm font-semibold">Aucun produit ne correspond au filtre</p>
                </div>
              )}
            </div>
          ) : (
            // Compact list display mode
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm divide-y divide-gray-100">
              {filteredProducts.map((p) => {
                const isLow = p.stock > 0 && p.stock <= lowStockAlert;
                return (
                  <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-50/55 transition-colors gap-4 text-xs">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                        <img className="w-full h-full object-cover" src={p.image} alt={p.name} referrerPolicy="no-referrer" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate font-sans">{p.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono font-bold mt-0.5">{p.sku} • {p.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <p className={`font-semibold ${p.stock <= 0 ? 'text-red-500' : isLow ? 'text-amber-500 font-bold animate-pulse' : 'text-gray-500'}`}>
                        {p.stock <= 0 ? 'Rupture' : `${p.stock} en stock`}
                      </p>
                      <p className="font-bold font-mono text-gray-900 w-24 text-right">
                        {p.price.toLocaleString('fr-FR')} F CFA
                      </p>
                      <button
                        onClick={() => handleAddToCart(p)}
                        disabled={p.stock <= 0}
                        className={`p-2 rounded-lg cursor-pointer transition-all ${
                          p.stock <= 0 ? 'bg-gray-50 text-gray-300' : 'bg-purple-50 text-[#8e24aa] hover:bg-[#8e24aa] hover:text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Checkout cart - Fixed & Sticky, unaffected by page scroll */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#c7c4d8]/40 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-100px)] sticky top-20 z-10">
          <div className="p-3.5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#8e24aa]">shopping_cart</span>
              <span className="font-bold text-sm text-gray-800">Panier Courant ({cart.length})</span>
            </div>
            {cart.length > 0 && (
              <button onClick={handleClearCart} className="text-xs text-[#ba1a1a] hover:underline font-bold cursor-pointer">
                Vider
              </button>
            )}
          </div>

          {/* Cart items list - Scrollable inside fixed cart container */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar min-h-0">
            {itemsCalculated.length > 0 ? (
              itemsCalculated.map((item, idx) => {
                const cardColors = [
                  'bg-purple-50/60 border-purple-200/80 hover:bg-purple-50/90',
                  'bg-blue-50/60 border-blue-200/80 hover:bg-blue-50/90',
                  'bg-emerald-50/60 border-emerald-200/80 hover:bg-emerald-50/90',
                  'bg-amber-50/60 border-amber-200/80 hover:bg-amber-50/90',
                  'bg-rose-50/60 border-rose-200/80 hover:bg-rose-50/90',
                  'bg-indigo-50/60 border-indigo-200/80 hover:bg-indigo-50/90',
                  'bg-teal-50/60 border-teal-200/80 hover:bg-teal-50/90',
                  'bg-orange-50/60 border-orange-200/80 hover:bg-orange-50/90',
                  'bg-cyan-50/60 border-cyan-200/80 hover:bg-cyan-50/90',
                  'bg-fuchsia-50/60 border-fuchsia-200/80 hover:bg-fuchsia-50/90',
                ];
                const colorStyle = cardColors[idx % cardColors.length];

                return (
                  <div
                    key={item.product.id}
                    className={`p-2.5 border rounded-xl transition-all shadow-2xs space-y-1.5 ${colorStyle}`}
                  >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-bold text-xs text-gray-800 truncate font-sans">{item.product.name}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#777587] font-semibold mt-0.5">
                        <span>{item.quantity} × {item.product.price.toLocaleString('fr-FR')} F</span>
                        {item.lineDiscount > 0 && (
                          <>
                            <span className="line-through text-gray-400">
                              {item.lineGross.toLocaleString('fr-FR')} F
                            </span>
                            <span className="text-amber-700 font-bold bg-amber-50 px-1 rounded border border-amber-200 text-[9px]">
                              -{item.lineDiscount.toLocaleString('fr-FR')} F
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#8e24aa]">
                        {item.lineNet.toLocaleString('fr-FR')} F
                      </span>
                      <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-2xs">
                        <button
                          onClick={() => handleUpdateQty(item.product.id, -1)}
                          className="p-1 px-1.5 text-[#464555] hover:bg-gray-50 text-xs font-bold rounded-l-lg cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-1 text-xs font-bold text-gray-800 font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQty(item.product.id, 1)}
                          className="p-1 px-1.5 text-[#464555] hover:bg-gray-50 text-xs font-bold rounded-r-lg cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveFromCart(item.product.id)}
                        className="p-1 text-gray-400 hover:text-red-500 active:scale-90 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  </div>

                  {/* Item level discount row */}
                  <div className="flex items-center justify-between pt-1 border-t border-dashed border-gray-200/80 text-[10px]">
                    <span className="text-amber-800 font-extrabold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-amber-700">loyalty</span>
                      Remise art.:
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="inline-flex bg-white border border-amber-200 rounded-md p-0.5 shadow-2xs">
                        <button
                          onClick={() => handleSetItemDiscount(item.product.id, 'percent', item.discountValue || 0)}
                          className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded cursor-pointer ${
                            item.discountType !== 'fixed' ? 'bg-amber-600 text-white shadow-xs' : 'text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          %
                        </button>
                        <button
                          onClick={() => handleSetItemDiscount(item.product.id, 'fixed', item.discountValue || 0)}
                          className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded cursor-pointer ${
                            item.discountType === 'fixed' ? 'bg-amber-600 text-white shadow-xs' : 'text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          F CFA
                        </button>
                      </div>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={item.discountValue ?? ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          handleSetItemDiscount(item.product.id, item.discountType || 'percent', val);
                        }}
                        className="w-16 px-1.5 py-0.5 bg-white border border-amber-300 rounded text-right font-mono font-bold text-[10px] text-amber-800 outline-none focus:ring-2 focus:ring-amber-200"
                      />
                      {item.discountValue ? (
                        <button
                          onClick={() => handleClearItemDiscount(item.product.id)}
                          className="text-gray-400 hover:text-red-500 px-0.5 font-bold cursor-pointer"
                          title="Effacer remise article"
                        >
                          ×
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400 select-none">
                <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">shopping_bag</span>
                <p className="text-xs font-semibold">Le panier est vide</p>
                <p className="text-[10px] text-gray-400 mt-1">Sélectionnez des articles</p>
              </div>
            )}
          </div>

          {/* Totals & checkout controls */}
          <div className="p-3 border-t border-gray-100 bg-gray-50/55 space-y-2.5 overflow-y-auto shrink-0 max-h-[55%]">
            {/* Global Discount input block */}
            <div className="p-2 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-1">
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-700">
                <span className="flex items-center gap-1 text-amber-800 font-extrabold">
                  <span className="material-symbols-outlined text-xs text-amber-700">sell</span>
                  Remise globale (sur panier)
                </span>
                {globalDiscount > 0 && (
                  <span className="text-amber-800 font-mono text-[10px] font-extrabold bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-300">
                    -{globalDiscount.toLocaleString('fr-FR')} F CFA
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="inline-flex bg-white border border-amber-300/80 rounded-lg p-0.5 shadow-2xs">
                  <button
                    onClick={() => setGlobalDiscountType('percent')}
                    className={`px-2 py-0.5 text-[9px] font-extrabold rounded cursor-pointer ${
                      globalDiscountType === 'percent' ? 'bg-amber-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    %
                  </button>
                  <button
                    onClick={() => setGlobalDiscountType('fixed')}
                    className={`px-2 py-0.5 text-[9px] font-extrabold rounded cursor-pointer ${
                      globalDiscountType === 'fixed' ? 'bg-amber-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    F CFA
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  value={globalDiscountValue}
                  onChange={(e) => setGlobalDiscountValue(e.target.value)}
                  placeholder="0"
                  className="flex-1 px-2 py-0.5 bg-white border border-amber-300 rounded-lg text-right font-mono font-bold text-xs text-amber-800 outline-none focus:ring-2 focus:ring-amber-200"
                />
                {Number(globalDiscountValue) > 0 && (
                  <button
                    onClick={() => setGlobalDiscountValue('0')}
                    className="text-gray-400 hover:text-red-500 font-bold px-1 cursor-pointer"
                    title="Réinitialiser"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="flex gap-1 justify-end pt-0.5">
                {[5, 10, 15, 20].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setGlobalDiscountType('percent');
                      setGlobalDiscountValue(String(preset));
                    }}
                    className="px-1.5 py-0.5 bg-white border border-amber-200 hover:bg-amber-100 text-[9px] font-bold rounded text-amber-800 cursor-pointer transition-colors"
                  >
                    -{preset}%
                  </button>
                ))}
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="space-y-1 text-xs pt-1 border-t border-gray-200">
              <div className="flex justify-between text-gray-500 font-semibold text-[11px]">
                <span>Sous-total brut :</span>
                <span className="font-mono">{subtotalGross.toLocaleString('fr-FR')} F CFA</span>
              </div>
              {totalDiscounts > 0 && (
                <div className="flex justify-between text-amber-700 font-bold text-[11px]">
                  <span>Total remises (-) :</span>
                  <span className="font-mono font-bold">-{totalDiscounts.toLocaleString('fr-FR')} F CFA</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500 font-semibold text-[11px]">
                <span>TVA (0%) :</span>
                <span className="font-mono font-bold text-gray-600">0 F CFA</span>
              </div>
              <div className="flex justify-between font-black text-sm text-gray-900 pt-1.5 border-t border-gray-200">
                <span>Total Net à Payer :</span>
                <span className="font-mono text-[#8e24aa] text-base">{total.toLocaleString('fr-FR')} F CFA</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => {
                if (!caisseOpen) {
                  alert("La caisse est fermée. Veuillez ouvrir la caisse dans l'onglet 'Gestion de la caisse'.");
                  return;
                }
                setShowPaymentModal(true);
              }}
              disabled={cart.length === 0}
              className="w-full py-3 bg-[#8e24aa] hover:bg-[#7b1fa2] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 group"
            >
              <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">
                point_of_sale
              </span>
              Payer ({total.toLocaleString('fr-FR')} F CFA)
            </button>
          </div>
        </div>

        {/* Bottom Keyboard Shortcuts Legend */}
        <div className="lg:col-span-12 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold text-gray-800 uppercase tracking-wider">
            <span className="material-symbols-outlined text-[#8e24aa] text-base">keyboard</span>
            <span>Raccourcis Clavier POS</span>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px]">
            {[
              { key: 'F1', desc: 'Vente / Focus' },
              { key: 'F2', desc: 'Suspendre' },
              { key: 'F3', desc: 'Vider Panier' },
              { key: 'F4', desc: 'Quantité' },
              { key: 'F5', desc: 'Type Client' },
              { key: 'F6', desc: 'Historique' },
              { key: 'Entrée', desc: 'Valider' },
              { key: 'Suppr', desc: 'Suppr. Dernier' },
              { key: 'Échap', desc: 'Fermer Reçu' }
            ].map((sc) => (
              <div key={sc.key} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-2 py-1 rounded-xl">
                <kbd className="bg-white px-1.5 py-0.5 rounded-md border border-gray-200 shadow-xs font-mono font-bold text-[#8e24aa]">{sc.key}</kbd>
                <span className="text-gray-500 font-semibold">{sc.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 2. Ventes suspendues Tab (suspended)
  const renderSuspendedTab = () => {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-extrabold text-gray-900 tracking-tight font-sans">
            Ventes Suspendues en Attente ({suspendedSales.length})
          </h3>
          <p className="text-[#646375] text-xs mt-1">
            Liste des transactions mises en pause sur ce terminal. Vous pouvez les recharger à tout moment.
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {suspendedSales.map((sale) => (
            <div key={sale.id} className="p-4 flex flex-col md:flex-row justify-between md:items-center gap-4 text-xs font-semibold">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold font-mono rounded text-[10px]">
                    {sale.id}
                  </span>
                  <span className="text-gray-400">Suspendue le {sale.date} à {sale.time}</span>
                </div>
                <p className="text-gray-800 mt-1.5">
                  Client : <span className="font-bold text-purple-950">{sale.customerType === 'vip' ? 'Client VIP' : sale.customerType === 'corporate' ? 'Compte Entreprise' : 'Client de passage'}</span> • {sale.items.length} article(s)
                </p>
                <div className="text-[10px] text-gray-400 font-medium mt-1 truncate max-w-lg">
                  Articles : {sale.items.map(i => `${i.quantity}x ${i.product?.name}`).join(', ')}
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-6">
                <p className="font-extrabold font-mono text-gray-900 text-sm">
                  {sale.total.toLocaleString('fr-FR')} F CFA
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleResumeSuspended(sale)}
                    className="px-3 py-1.5 bg-purple-50 hover:bg-[#8e24aa] text-[#8e24aa] hover:text-white rounded-lg transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">play_arrow</span>
                    Restaurer
                  </button>
                  <button
                    onClick={() => handleDeleteSuspended(sale.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {suspendedSales.length === 0 && (
            <div className="text-center py-16 text-gray-400 p-8">
              <span className="material-symbols-outlined text-gray-300 text-5xl mb-2">pause_circle</span>
              <p className="text-sm font-semibold">Aucune vente suspendue en attente</p>
              <p className="text-xs text-gray-400 mt-1">Vous pouvez suspendre une vente active à l'aide du bouton 'Suspendre' du panier.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 3. Retours / Échanges Tab (returns)
  const renderReturnsTab = () => {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-extrabold text-gray-900 tracking-tight font-sans mb-1">
            Traitement des Retours & Échanges
          </h3>
          <p className="text-[#646375] text-xs mb-6">
            Saisissez le numéro de ticket de la facture originale pour lancer une demande de retour en stock ou d'échange standard.
          </p>

          <form onSubmit={handleSearchReturnTx} className="flex gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined text-gray-400 absolute left-3 top-2.5 text-lg">search</span>
              <input
                type="text"
                placeholder="Exemple: TX-0192 ou TX-981273..."
                value={returnSearchId}
                onChange={(e) => setReturnSearchId(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#8e24aa] font-mono font-bold"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#8e24aa] text-white rounded-xl text-xs font-bold hover:bg-[#7b1fa2] cursor-pointer"
            >
              Rechercher
            </button>
          </form>
        </div>

        {foundReturnTx && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6 animate-fade-in text-xs font-semibold">
            {/* Header Transaction Info */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Facture Originale Retrouvée</p>
                <h4 className="text-base font-extrabold text-purple-950 font-mono mt-1">{foundReturnTx.id}</h4>
                <p className="text-gray-500 mt-1 font-sans">Encaissée par {foundReturnTx.cashier} le {foundReturnTx.date} ({foundReturnTx.payMethod})</p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold font-mono rounded-lg text-[10px]">
                {foundReturnTx.status === 'Valid' ? 'VALIDE' : foundReturnTx.status === 'Refunded' ? 'REMBOURSÉ' : 'ÉCHANGÉ'}
              </span>
            </div>

            {/* Return Type Selection */}
            <div>
              <label className="block text-gray-700 font-bold mb-2">Type de retour :</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReturnActionType('refund')}
                  className={`py-3 rounded-xl border flex items-center justify-center gap-2 transition-all font-bold ${
                    returnActionType === 'refund'
                      ? 'bg-purple-50 border-[#8e24aa] text-[#8e24aa]'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">refund</span>
                  Remboursement / Avoir standard
                </button>
                <button
                  type="button"
                  onClick={() => setReturnActionType('exchange')}
                  className={`py-3 rounded-xl border flex items-center justify-center gap-2 transition-all font-bold ${
                    returnActionType === 'exchange'
                      ? 'bg-purple-50 border-[#8e24aa] text-[#8e24aa]'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">published_with_changes</span>
                  Échange contre autre article
                </button>
              </div>
            </div>

            {/* List items to adjust */}
            <div className="space-y-3">
              <label className="block text-gray-700 font-bold">Sélectionner la quantité à retourner :</label>
              <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                {foundReturnTx.items.map((item: any) => {
                  const id = item.product.id || item.product.sku;
                  const qtyToReturn = returnQuantities[id] || 0;
                  return (
                    <div key={id} className="p-3 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-900 truncate font-sans">{item.product.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{item.product.sku} • Facturé: {item.quantity} unités</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-[10px] font-bold">Retourner :</span>
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={qtyToReturn}
                          onChange={(e) => handleReturnQtyChange(id, item.quantity, Number(e.target.value))}
                          className="w-16 bg-gray-50 border border-gray-200 p-1.5 rounded text-center font-bold font-mono outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {returnActionType === 'exchange' && (
              <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 space-y-2">
                <label className="block text-amber-900 font-extrabold text-xs">Informations d'Échange :</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <span className="text-[10px] text-gray-500 font-bold block mb-1">SKU Produit de Remplacement :</span>
                    <input
                      type="text"
                      placeholder="Ex: ELC-29381..."
                      value={exchangeProductSku}
                      onChange={(e) => setExchangeProductSku(e.target.value)}
                      className="w-full bg-white border border-gray-200 p-2 rounded-lg font-mono text-xs outline-none"
                    />
                  </div>
                  <div className="sm:w-48">
                    <span className="text-[10px] text-gray-500 font-bold block mb-1">Ajustement tarifaire :</span>
                    <div className="p-2.5 bg-white border border-gray-200 rounded-lg text-center font-mono font-bold text-gray-700">
                      Calcul automatique
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Motif textarea */}
            <div>
              <label className="block text-gray-700 font-bold mb-1.5">Motif détaillé du retour :</label>
              <textarea
                placeholder="Saisissez la raison du retour (ex: Produit défectueux, Erreur de taille, etc.)..."
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#8e24aa] resize-none"
              />
            </div>

            {/* Confirm action */}
            <div className="border-t border-gray-100 pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFoundReturnTx(null)}
                className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl font-bold cursor-pointer text-gray-600"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleProcessReturn}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow cursor-pointer"
              >
                Valider et Re-créditer le stock
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 4. Historique des ventes Tab (history)
  const renderHistoryTab = () => {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in text-xs font-semibold">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-extrabold text-gray-900 tracking-tight font-sans">
            Historique Global des Ventes Terminal #1
          </h3>
          <p className="text-[#646375] text-xs mt-1">
            Liste complète de toutes les ventes validées sur cette caisse. Vous pouvez cliquer sur un ticket pour le réimprimer.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans">
            <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px] tracking-wide border-b border-gray-100 select-none">
              <tr>
                <th className="py-3.5 px-6">Réf Ticket</th>
                <th className="py-3.5 px-4">Date / Heure</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Mode Paiement</th>
                <th className="py-3.5 px-4">Montant Total</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {completedSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 font-bold font-mono text-purple-950">{sale.id}</td>
                  <td className="py-4 px-4 text-gray-500">{sale.date} à {sale.time}</td>
                  <td className="py-4 px-4 text-gray-700">{sale.customer || sale.customerType}</td>
                  <td className="py-4 px-4 font-bold text-[#8e24aa]">{sale.payMethod}</td>
                  <td className="py-4 px-4 font-bold font-mono">{sale.total.toLocaleString('fr-FR')} F CFA</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      sale.status === 'Valid' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                    }`}>
                      {sale.status === 'Valid' ? 'VALIDE' : sale.status === 'Refunded' ? 'RETOURNÉ' : 'ANNULÉ'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => {
                        setRecentReceipt(sale);
                        setShowReceipt(true);
                      }}
                      className="px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ml-auto"
                    >
                      <span className="material-symbols-outlined text-xs">print</span>
                      Ticket
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {completedSales.length === 0 && (
            <div className="text-center py-16 text-gray-400 p-8">
              <span className="material-symbols-outlined text-gray-300 text-5xl mb-2">receipt_long</span>
              <p className="text-sm font-semibold">Aucune vente enregistrée pour le moment</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 5. Gestion de la caisse Tab (caisse)
  const renderCaisseTab = () => {
    const activeSession = caisseSessions.find(s => s.id === caisseSessionId && s.status === 'Open');

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in text-xs font-semibold">
        {/* Main interactive form */}
        <div className="lg:col-span-7 space-y-6">
          {!caisseOpen ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                <span className="material-symbols-outlined text-[#8e24aa]">lock_open</span>
                <h4 className="text-base font-extrabold text-purple-950 font-sans">
                  Ouvrir une Nouvelle Session de Caisse
                </h4>
              </div>
              <form onSubmit={handleOpenCaisse} className="space-y-4">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Montant initial en espèces (F CFA) :</label>
                  <input
                    type="number"
                    value={openFormCash}
                    onChange={(e) => setOpenFormCash(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#8e24aa] font-mono font-bold text-sm text-[#8e24aa]"
                    required
                  />
                  <p className="text-[10px] text-gray-400 font-medium mt-1">Fonds de roulement espèces pré-chargé dans le tiroir ce matin.</p>
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Observations d'ouverture :</label>
                  <textarea
                    placeholder="Saisissez une note optionnelle (ex: Prêt de caisse de secours...)"
                    value={openFormObs}
                    onChange={(e) => setOpenFormObs(e.target.value)}
                    rows={3}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#8e24aa] resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">vpn_key</span>
                  Valider l'Ouverture et Débloquer la Caisse
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-600">lock</span>
                  <h4 className="text-base font-extrabold text-purple-950 font-sans">
                    Fermeture & Bilan de Session de Caisse
                  </h4>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-bold font-mono text-[10px] animate-pulse">
                  EN COURS (OUVERTE)
                </span>
              </div>

              {activeSession && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Ouvert par</p>
                    <p className="font-bold text-gray-800 mt-1 truncate">{activeSession.cashier}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Ouvert le</p>
                    <p className="font-bold text-gray-800 mt-1">{activeSession.openedAtDate}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Heure d'ouverture</p>
                    <p className="font-bold text-gray-800 mt-1">{activeSession.openedAtTime}</p>
                  </div>
                  <div className="p-3 bg-purple-50 text-[#8e24aa] rounded-xl border border-purple-100">
                    <p className="text-[9px] text-purple-600 font-bold uppercase">Fond de caisse</p>
                    <p className="font-extrabold font-mono mt-1 text-xs">{activeSession.initialCash.toLocaleString('fr-FR')} F</p>
                  </div>
                </div>
              )}

              {/* Closure calculation outputs */}
              {activeSession && (
                <div className="space-y-2 p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
                  <h5 className="font-extrabold text-gray-900 border-b border-gray-200/60 pb-1.5 mb-2">Synthèse financière temps réel :</h5>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Montant d'Ouverture :</span>
                    <span className="font-mono">{activeSession.initialCash.toLocaleString('fr-FR')} F CFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Recettes Espèces :</span>
                    <span className="font-mono text-emerald-600">+{activeSession.salesCash.toLocaleString('fr-FR')} F CFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Recettes Cartes :</span>
                    <span className="font-mono">+{activeSession.salesCard.toLocaleString('fr-FR')} F CFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Recettes Mobile Money :</span>
                    <span className="font-mono">+{activeSession.salesMobileMoney.toLocaleString('fr-FR')} F CFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Recettes Mixtes :</span>
                    <span className="font-mono">+{activeSession.salesMixed.toLocaleString('fr-FR')} F CFA</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-dashed border-gray-200 font-bold text-sm text-gray-800">
                    <span>Espèces Théoriques Attendues :</span>
                    <span className="font-mono text-[#8e24aa]">{activeSession.theoreticalCash.toLocaleString('fr-FR')} F CFA</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleCloseCaisse} className="space-y-4">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Montant réel compté en espèces (F CFA) :</label>
                  <input
                    type="number"
                    value={closeFormRealCash}
                    onChange={(e) => setCloseFormRealCash(e.target.value)}
                    placeholder="Saisissez les espèces comptées dans le tiroir..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#8e24aa] font-mono font-bold text-sm text-[#ba1a1a]"
                    required
                  />
                  {closeFormRealCash !== '' && activeSession && (
                    <div className="mt-2 text-xs flex justify-between items-center">
                      <span>Écart de Caisse calculé :</span>
                      <span className={`font-mono font-bold p-1 rounded ${
                        Number(closeFormRealCash) - activeSession.theoreticalCash === 0
                          ? 'bg-emerald-50 text-emerald-600'
                          : Number(closeFormRealCash) - activeSession.theoreticalCash > 0
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-red-50 text-red-600'
                      }`}>
                        {(Number(closeFormRealCash) - activeSession.theoreticalCash).toLocaleString('fr-FR')} F CFA
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Observations de fermeture :</label>
                  <textarea
                    placeholder="Saisissez un commentaire de fin de shift (ex: Aucun écart, Écart de 500F inexpliqué...)"
                    value={closeFormObs}
                    onChange={(e) => setCloseFormObs(e.target.value)}
                    rows={2}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#8e24aa] resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">lock</span>
                  Valider la Fermeture de Caisse & Clôturer Session
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Previous shifts summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-extrabold text-purple-950 font-sans border-b border-gray-100 pb-2">
              Sessions de Caisse Récentes (Historique)
            </h4>
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
              {caisseSessions.map((sess) => (
                <div key={sess.id} className="p-3 bg-gray-50 border border-gray-200/60 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-mono font-bold text-purple-950">{sess.id}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      sess.status === 'Open' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {sess.status === 'Open' ? 'ACTIF' : 'FERMÉ'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600">
                    Caissier: <span className="font-bold text-gray-800">{sess.cashier}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                    <div>
                      Fond d'Ouverture: <span className="font-mono font-bold text-gray-700">{sess.initialCash.toLocaleString('fr-FR')} F</span>
                    </div>
                    <div>
                      Theoretical Cash: <span className="font-mono font-bold text-gray-700">{sess.theoreticalCash.toLocaleString('fr-FR')} F</span>
                    </div>
                    {sess.realCash !== undefined && (
                      <div className="col-span-2 pt-1 border-t border-dotted border-gray-100 flex justify-between items-center">
                        <span>Espèces comptées:</span>
                        <span className="font-mono font-bold text-[#ba1a1a]">{sess.realCash.toLocaleString('fr-FR')} F CFA</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 6. Mes statistiques Tab (stats)
  const renderStatsTab = () => {
    // Math for metrics
    const statsCA = completedSales.reduce((sum, s) => sum + s.total, 0);
    const statsCount = completedSales.length;
    const statsAverage = statsCount > 0 ? Math.round(statsCA / statsCount) : 0;

    return (
      <div className="space-y-6 animate-fade-in text-xs font-semibold">
        {/* KPI metrics row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Chiffre d'Affaires Encaissé</span>
            <span className="text-2xl font-extrabold font-mono text-purple-950 block mt-2">
              {statsCA.toLocaleString('fr-FR')} F CFA
            </span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Tickets Enregistrés</span>
            <span className="text-2xl font-extrabold font-mono text-purple-950 block mt-2">
              {statsCount} ventes
            </span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Panier Moyen Caissier</span>
            <span className="text-2xl font-extrabold font-mono text-purple-950 block mt-2">
              {statsAverage.toLocaleString('fr-FR')} F CFA
            </span>
          </div>
        </div>

        {/* Hourly split simulated */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h4 className="text-sm font-extrabold text-purple-950 font-sans mb-4">Répartition des ventes du jour par mode de paiement</h4>
          <div className="space-y-4">
            {[
              { label: 'Espèces', color: 'bg-emerald-500', count: completedSales.filter(s => s.payMethod.includes('ESPÈCES')).length, sum: completedSales.filter(s => s.payMethod.includes('ESPÈCES')).reduce((acc, s) => acc + s.total, 0) },
              { label: 'Cartes Bancaires', color: 'bg-[#8e24aa]', count: completedSales.filter(s => s.payMethod.includes('CARTE')).length, sum: completedSales.filter(s => s.payMethod.includes('CARTE')).reduce((acc, s) => acc + s.total, 0) },
              { label: 'Mobile Money', color: 'bg-amber-500', count: completedSales.filter(s => s.payMethod.includes('MOBILE') || s.payMethod.includes('Wave')).length, sum: completedSales.filter(s => s.payMethod.includes('MOBILE') || s.payMethod.includes('Wave')).reduce((acc, s) => acc + s.total, 0) },
            ].map((method, idx) => {
              const pct = statsCA > 0 ? Math.round((method.sum / statsCA) * 100) : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-gray-700">
                    <span>{method.label} ({method.count} tickets)</span>
                    <span className="font-mono">{method.sum.toLocaleString('fr-FR')} F CFA ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className={`${method.color} h-full`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // 7. Mon Profil Tab (profile)
  const renderProfileTab = () => {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-fade-in text-xs font-semibold">
        <h3 className="text-base font-extrabold text-purple-950 font-sans border-b border-gray-100 pb-3 mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined">person</span>
          Mon Profil de Caissier
        </h3>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-gray-500 mb-1 font-bold">Adresse Email de Connexion :</label>
            <input
              type="email"
              value={currentUser.email}
              disabled
              className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed font-mono"
            />
          </div>
          <div>
            <label className="block text-gray-500 mb-1 font-bold">Rôle dans le Système :</label>
            <input
              type="text"
              value={currentUser.role}
              disabled
              className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed uppercase font-bold"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1 font-bold">Nom Complet :</label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#8e24aa]"
              required
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1 font-bold">Numéro de Téléphone :</label>
            <input
              type="text"
              value={profilePhone}
              onChange={(e) => setProfilePhone(e.target.value)}
              placeholder="Ex: 01 02 03 04 05..."
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#8e24aa] font-mono"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1 font-bold">Changer le mot de passe (Laisser vide si inchangé) :</label>
            <input
              type="password"
              placeholder="Saisissez un nouveau mot de passe sécurisé..."
              value={profilePassword}
              onChange={(e) => setProfilePassword(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#8e24aa]"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-[#8e24aa] hover:bg-[#7b1fa2] text-white font-bold rounded-lg cursor-pointer shadow transition-all mt-4"
          >
            Sauvegarder les modifications du profil
          </button>
        </form>
      </div>
    );
  };

  // 8. Paramètres Tab (settings)
  const renderSettingsTab = () => {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-fade-in text-xs font-semibold">
        <h3 className="text-base font-extrabold text-purple-950 font-sans border-b border-gray-100 pb-3 mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#8e24aa]">settings</span>
          Paramètres du Terminal Point de Vente (PDV)
        </h3>

        <div className="space-y-6">
          {/* Audio toggle */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <h5 className="font-bold text-gray-900">Bips Sonores & Effets Audio</h5>
              <p className="text-[10px] text-gray-500 mt-0.5">Produit des sons physiques réalistes lors du scan barcode et de l'encaissement de caisse.</p>
            </div>
            <button
              onClick={() => {
                setAudioEnabled(!audioEnabled);
                playSound('beep');
              }}
              className={`px-4 py-1.5 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                audioEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {audioEnabled ? 'ACTIVÉS' : 'DÉSACTIVÉS'}
            </button>
          </div>

          {/* Display Mode Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <h5 className="font-bold text-gray-900">Format d'Affichage du Catalogue</h5>
              <p className="text-[10px] text-gray-500 mt-0.5">Affiche le catalogue de produits sous forme de bento grid ou de liste compacte.</p>
            </div>
            <div className="flex gap-1.5 bg-white p-1 rounded-lg border border-gray-200">
              <button
                onClick={() => setDisplayMode('grid')}
                className={`px-3 py-1 text-[9px] font-extrabold rounded ${
                  displayMode === 'grid' ? 'bg-[#8e24aa] text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                Grille
              </button>
              <button
                onClick={() => setDisplayMode('list')}
                className={`px-3 py-1 text-[9px] font-extrabold rounded ${
                  displayMode === 'list' ? 'bg-[#8e24aa] text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                Liste
              </button>
            </div>
          </div>

          {/* Low Stock alerting */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <h5 className="font-bold text-gray-900">Seuil d'Alerte de Stock Bas</h5>
              <p className="text-[10px] text-gray-500 mt-0.5">Affiche un avertissement orange sur les fiches produits lorsque la quantité descend en dessous de ce seuil.</p>
            </div>
            <input
              type="number"
              value={lowStockAlert}
              onChange={(e) => setLowStockAlert(Number(e.target.value))}
              className="w-20 px-2 py-1.5 bg-white border border-gray-200 rounded text-center font-mono font-bold text-purple-950"
            />
          </div>

          {/* Printer format choice */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <h5 className="font-bold text-gray-900">Imprimante de Ticket Thermique</h5>
              <p className="text-[10px] text-gray-500 mt-0.5">Format par défaut envoyé à l'imprimante après la finalisation de la transaction.</p>
            </div>
            <select
              value={receiptPrinter}
              onChange={(e) => setReceiptPrinter(e.target.value)}
              className="bg-white border border-gray-200 p-1.5 rounded-lg outline-none font-bold text-gray-700"
            >
              <option value="Ticket Thermique 80mm">Ticket 80mm (Standard)</option>
              <option value="Ticket Thermique 58mm">Ticket 58mm (Étroit)</option>
              <option value="Format A4 PDF">Format Facture A4 (PDF)</option>
            </select>
          </div>

          {/* Sync mode status */}
          <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl flex gap-3 items-start">
            <span className="material-symbols-outlined text-lg mt-0.5">cloud_done</span>
            <div>
              <h6 className="font-extrabold">Synchronisation Automatique Hors-Ligne (Offline First)</h6>
              <p className="text-[10px] leading-relaxed mt-1 text-emerald-800/80">
                La caisse enregistre les données de manière persistante et sécurisée dans votre navigateur. En cas de coupure réseau ou internet, le terminal continue de fonctionner à 100%. Une synchronisation asynchrone avec le serveur central de Supabase est déclenchée toutes les 15 secondes.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pt-24 px-8 pb-12 w-full animate-fade-in font-sans">
      {/* Header Info Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight font-sans capitalize">
            {activeTab === 'sale' ? '🛒 Nouvelle vente' :
             activeTab === 'suspended' ? '🕒 Ventes suspendues' :
             activeTab === 'returns' ? '🔄 Retours / Échanges' :
             activeTab === 'history' ? '🧾 Historique des ventes' :
             activeTab === 'caisse' ? '💰 Gestion de la caisse' :
             activeTab === 'stats' ? '📊 Mes statistiques' :
             activeTab === 'profile' ? '👤 Mon Profil' :
             activeTab === 'settings' ? '⚙️ Paramètres Caisse' : 'Terminal Point de Vente (POS)'}
          </h2>
          <p className="text-[#464555] text-xs mt-1 font-medium">
            Terminal de Caisse #1 • Mode Caissier • Statut : <span className={`font-bold ${caisseOpen ? 'text-emerald-600' : 'text-amber-500'}`}>{caisseOpen ? 'Caisse Active et Débloquée' : 'Caisse Fermée'}</span>
          </p>
        </div>

        {/* Client type profile switcher - only visible in sale tab */}
        {activeTab === 'sale' && caisseOpen && (
          <div className="flex gap-1.5 p-1.5 bg-gray-100 rounded-xl border border-gray-200">
            <button
              onClick={() => setCustomer('walkin')}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                customer === 'walkin' ? 'bg-[#8e24aa] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200/50'
              }`}
            >
              Passage
            </button>
            <button
              onClick={() => setCustomer('corporate')}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                customer === 'corporate' ? 'bg-[#8e24aa] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200/50'
              }`}
            >
              Entreprise
            </button>
            <button
              onClick={() => setCustomer('vip')}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                customer === 'vip' ? 'bg-[#8e24aa] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200/50'
              }`}
            >
              VIP
            </button>
          </div>
        )}
      </div>

      {/* POS Sub-tab Render Body */}
      <div className="transition-all duration-150">
        {activeTab === 'sale' && renderSaleTab()}
        {activeTab === 'suspended' && renderSuspendedTab()}
        {activeTab === 'returns' && renderReturnsTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'caisse' && renderCaisseTab()}
        {activeTab === 'stats' && renderStatsTab()}
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>

      {/* Payment Checkout Modal Dialog */}
      {showPaymentModal && cart.length > 0 && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl relative border border-purple-100 flex flex-col max-h-[92vh] overflow-y-auto custom-scrollbar">
            {/* Close Button */}
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1 rounded-full hover:bg-gray-100"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#8e24aa] flex items-center justify-center border border-purple-100 font-extrabold shadow-2xs">
                <span className="material-symbols-outlined text-2xl">point_of_sale</span>
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 font-sans tracking-tight">
                  Règlement & Encaissement
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Sélectionnez le moyen de paiement et renseignez la somme remise
                </p>
              </div>
            </div>

            {/* Total Summary Display */}
            <div className="mt-4 p-4 bg-gradient-to-br from-[#fbf4fc] to-purple-50/60 rounded-2xl border border-purple-100/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block">Total Net à Payer</span>
                <span className="text-2xl font-black font-mono text-[#8e24aa]">
                  {total.toLocaleString('fr-FR')} F CFA
                </span>
              </div>
              <div className="text-right text-xs text-gray-500 font-semibold space-y-0.5">
                <p>Articles : <span className="font-bold text-gray-800">{cart.reduce((acc, i) => acc + i.quantity, 0)}</span></p>
                <p>Brut : <span className="font-mono text-gray-700">{subtotalGross.toLocaleString('fr-FR')} F</span></p>
                {totalDiscounts > 0 && (
                  <p className="text-amber-700 font-bold">Remises : -{totalDiscounts.toLocaleString('fr-FR')} F</p>
                )}
              </div>
            </div>

            {/* Moyen de Paiement Tabs */}
            <div className="mt-5 space-y-2">
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider font-sans">
                Moyen de paiement
              </label>
              <div className="grid grid-cols-5 gap-1.5 p-1.5 bg-gray-100/80 rounded-2xl border border-gray-200/80">
                {(['cash', 'card', 'mobile', 'cheque', 'mixed'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setPayMethod(mode)}
                    className={`py-2 px-1 text-[11px] font-extrabold rounded-xl capitalize transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      payMethod === mode
                        ? 'bg-[#8e24aa] text-white shadow-md scale-[1.02]'
                        : 'text-gray-600 hover:bg-gray-200/60'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {mode === 'cash' ? 'payments' : mode === 'card' ? 'credit_card' : mode === 'mobile' ? 'smartphone' : mode === 'cheque' ? 'badge' : 'tune'}
                    </span>
                    <span className="text-[10px]">
                      {mode === 'cash' ? 'Espèces' : mode === 'card' ? 'Carte' : mode === 'mobile' ? 'Mobile' : mode === 'cheque' ? 'Chèque' : 'Mixte'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields according to Payment Mode */}
            <div className="mt-4">
              {payMethod === 'cash' && (
                <div className="space-y-3 p-4 bg-purple-50/50 border border-purple-100 rounded-2xl text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label htmlFor="modal-cash-received" className="font-bold text-gray-800 text-xs">Somme remise (Espèces reçues) :</label>
                    <div className="relative">
                      <input
                        id="modal-cash-received"
                        type="number"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        placeholder="0"
                        autoFocus
                        className="w-40 px-3 py-2 bg-white border border-purple-200 rounded-xl text-right font-mono font-extrabold text-sm text-[#8e24aa] outline-none focus:ring-2 focus:ring-purple-300 shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Preset Cash Quick Buttons */}
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {[total, 1000, 2000, 5000, 10000, 20000, 50000].map((amt, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCashReceived(String(amt))}
                        className="px-2.5 py-1 bg-white border border-gray-200 hover:bg-purple-100 hover:border-purple-300 text-[11px] font-extrabold rounded-lg text-gray-700 shadow-2xs transition-all cursor-pointer"
                      >
                        {amt === total ? 'Exact' : `${amt.toLocaleString('fr-FR')} F`}
                      </button>
                    ))}
                  </div>

                  {/* Calculated Change Box */}
                  <div className="p-3 bg-white rounded-xl border border-purple-100/80 shadow-2xs flex justify-between items-center mt-2">
                    <span className="font-extrabold text-gray-800 text-xs flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-emerald-600 text-lg">currency_exchange</span>
                      Monnaie à rendre calculée :
                    </span>
                    <span className={`font-mono text-lg font-black ${monnaieARendre > 0 ? 'text-emerald-600' : Number(cashReceived) >= total ? 'text-gray-900' : 'text-amber-600'}`}>
                      {monnaieARendre.toLocaleString('fr-FR')} F CFA
                    </span>
                  </div>

                  {Number(cashReceived) > 0 && Number(cashReceived) < total && (
                    <p className="text-[11px] font-bold text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      Somme insuffisante (il manque {(total - Number(cashReceived)).toLocaleString('fr-FR')} F CFA)
                    </p>
                  )}
                </div>
              )}

              {payMethod === 'card' && (
                <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl text-xs space-y-2 text-center">
                  <span className="material-symbols-outlined text-3xl text-[#8e24aa]">contactless</span>
                  <p className="font-bold text-gray-800">Paiement par Carte Bancaire / TPE</p>
                  <p className="text-[11px] text-gray-500">Insérez ou présentez la carte bancaire sur le terminal de paiement.</p>
                </div>
              )}

              {payMethod === 'mobile' && (
                <div className="space-y-3 p-4 bg-purple-50/50 border border-purple-100 rounded-2xl text-xs font-semibold">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-gray-700">Opérateur Mobile Money :</span>
                    <select
                      value={mmOperator}
                      onChange={(e) => setMmOperator(e.target.value)}
                      className="bg-white border border-gray-200 p-2 rounded-xl font-extrabold text-xs outline-none focus:ring-2 focus:ring-purple-200"
                    >
                      <option value="Wave">Wave 🌊</option>
                      <option value="Orange Money">Orange Money 🍊</option>
                      <option value="MTN Mobile Money">MTN MoMo 🟡</option>
                      <option value="Moov Money">Moov Money 🟢</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-gray-700">N° Téléphone Client :</span>
                    <input
                      type="text"
                      placeholder="07 00 00 00 00"
                      value={mmPhone}
                      onChange={(e) => setMmPhone(e.target.value)}
                      className="w-40 bg-white border border-gray-200 p-2 rounded-xl text-right outline-none font-mono text-xs font-bold"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-gray-700">Référence Transaction :</span>
                    <input
                      type="text"
                      placeholder="Réf. W-9018273"
                      value={mmRef}
                      onChange={(e) => setMmRef(e.target.value)}
                      className="w-40 bg-white border border-gray-200 p-2 rounded-xl text-right outline-none font-mono text-xs font-bold"
                    />
                  </div>
                </div>
              )}

              {payMethod === 'cheque' && (
                <div className="space-y-3 p-4 bg-purple-50/50 border border-purple-100 rounded-2xl text-xs font-semibold">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-gray-700">Nom de la Banque :</span>
                    <input
                      type="text"
                      placeholder="SGCI, Ecobank, BOA..."
                      value={chequeBank}
                      onChange={(e) => setChequeBank(e.target.value)}
                      className="w-48 bg-white border border-gray-200 p-2 rounded-xl text-right outline-none font-sans text-xs font-bold"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-gray-700">N° de Chèque :</span>
                    <input
                      type="text"
                      placeholder="CHQ-0019283"
                      value={chequeNumber}
                      onChange={(e) => setChequeNumber(e.target.value)}
                      className="w-48 bg-white border border-gray-200 p-2 rounded-xl text-right outline-none font-mono text-xs font-bold"
                    />
                  </div>
                </div>
              )}

              {payMethod === 'mixed' && (
                <div className="space-y-3 p-4 bg-purple-50/50 border border-purple-100 rounded-2xl text-xs font-semibold">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <label className="block text-gray-600 mb-1 font-extrabold text-[11px]">Espèces</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={mixedCash}
                        onChange={(e) => setMixedCash(e.target.value)}
                        className="w-full bg-white border border-gray-200 p-2 rounded-xl text-center outline-none font-mono text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1 font-extrabold text-[11px]">Carte</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={mixedCard}
                        onChange={(e) => setMixedCard(e.target.value)}
                        className="w-full bg-white border border-gray-200 p-2 rounded-xl text-center outline-none font-mono text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1 font-extrabold text-[11px]">Mobile</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={mixedMobile}
                        onChange={(e) => setMixedMobile(e.target.value)}
                        className="w-full bg-white border border-gray-200 p-2 rounded-xl text-center outline-none font-mono text-xs font-bold"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-purple-100 font-bold text-xs">
                    <span>Reste à répartir :</span>
                    <span className={`font-mono text-sm font-extrabold ${mixedIsMatched ? 'text-emerald-600' : 'text-red-500'}`}>
                      {mixedRemaining.toLocaleString('fr-FR')} F CFA
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons: Suspendre & Encaisser et valider */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => {
                  handleSuspendSale();
                  setShowPaymentModal(false);
                }}
                className="py-3 px-4 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl font-bold text-xs border border-amber-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">pause</span>
                Suspendre
              </button>

              <button
                onClick={() => {
                  handleCheckout();
                  setShowPaymentModal(false);
                }}
                disabled={payMethod === 'cash' && !cashIsSufficient}
                className="flex-1 py-3 px-4 bg-[#8e24aa] hover:bg-[#7b1fa2] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">point_of_sale</span>
                Encaisser et Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Receipt Print Preview Modal Dialog */}
      {showReceipt && recentReceipt && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative border border-purple-100 flex flex-col max-h-[92vh] overflow-y-auto custom-scrollbar">
            {/* Close Button */}
            <button
              onClick={() => setShowReceipt(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1 rounded-full hover:bg-gray-100 z-10"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            {/* Ticket Card Container */}
            <div className="font-sans text-xs text-gray-900 bg-white p-6 rounded-2xl border border-gray-200 shadow-md divide-y divide-dashed divide-gray-300 space-y-4">
              
              {/* Header with Logo */}
              <div className="text-center space-y-1 pb-2">
                {companySettings.logo && !companySettings.logo.startsWith('http') ? (
                  <img src={companySettings.logo} alt="Logo" className="w-16 h-16 mx-auto rounded-2xl object-contain mb-2" />
                ) : (
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-[#8e24aa] text-white flex items-center justify-center shadow-md mb-2">
                    <span className="material-symbols-outlined text-2xl">storefront</span>
                  </div>
                )}
                <h2 className="font-black text-base text-gray-950 uppercase tracking-wide">
                  {companySettings.name}
                </h2>
                <p className="text-[11px] text-gray-500 font-medium">{companySettings.address} {companySettings.phone ? `• ${companySettings.phone}` : ''}</p>
                
                <div className="pt-2 text-[11px] text-gray-600 space-y-0.5 text-left bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-500">Ticket :</span>
                    <span className="font-mono font-bold text-gray-900">{recentReceipt.ticketNumber || recentReceipt.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-500">Date :</span>
                    <span className="font-medium text-gray-800">{recentReceipt.date} {recentReceipt.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-500">Caissier :</span>
                    <span className="font-medium text-gray-800">{recentReceipt.cashier}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="pt-3 space-y-2">
                <div className="grid grid-cols-12 font-extrabold text-[11px] uppercase tracking-wider text-gray-500 pb-1 border-b border-gray-200">
                  <span className="col-span-2">Qté</span>
                  <span className="col-span-6">Produit</span>
                  <span className="col-span-4 text-right">Total</span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {recentReceipt.items.map((item: any, idx: number) => {
                    const qty = item.quantity;
                    const name = item.product?.name || item.name || 'Article';
                    const price = item.product?.price || item.unitPrice || 0;
                    const totalLine = qty * price;
                    return (
                      <div key={idx} className="grid grid-cols-12 items-baseline text-xs">
                        <span className="col-span-2 font-mono font-bold text-purple-900">{qty}</span>
                        <span className="col-span-6 font-medium text-gray-800 truncate pr-1" title={name}>{name}</span>
                        <span className="col-span-4 text-right font-mono font-bold text-gray-900">
                          {totalLine.toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totals Block */}
              <div className="pt-3 space-y-1 text-xs font-semibold">
                <div className="flex justify-between text-gray-600">
                  <span>TOTAL :</span>
                  <span className="font-mono font-bold">{(recentReceipt.subtotalGross || recentReceipt.subtotal).toLocaleString('fr-FR')} FCFA</span>
                </div>
                {(recentReceipt.totalDiscounts || 0) > 0 && (
                  <div className="flex justify-between text-amber-700 font-bold">
                    <span>Remise :</span>
                    <span className="font-mono font-bold">-{recentReceipt.totalDiscounts.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-gray-950 pt-1.5 border-t border-gray-200">
                  <span>À PAYER :</span>
                  <span className="font-mono text-base text-[#8e24aa]">
                    {recentReceipt.total.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="pt-3 space-y-1 text-xs text-gray-700">
                <div className="flex justify-between font-bold">
                  <span>Paiement :</span>
                  <span className="text-[#8e24aa] font-extrabold">{recentReceipt.payMethod}</span>
                </div>
                {recentReceipt.cashPaid > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Espèces :</span>
                    <span className="font-mono font-bold">{recentReceipt.cashPaid.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}
                {recentReceipt.mobilePaid > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Mobile :</span>
                    <span className="font-mono font-bold">{recentReceipt.mobilePaid.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}
                {recentReceipt.cardPaid > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Carte :</span>
                    <span className="font-mono font-bold">{recentReceipt.cardPaid.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}
                {recentReceipt.chequePaid > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Chèque :</span>
                    <span className="font-mono font-bold">{recentReceipt.chequePaid.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}
                {recentReceipt.changeGiven > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold pt-1">
                    <span>Monnaie rendue :</span>
                    <span className="font-mono">{recentReceipt.changeGiven.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}
              </div>

              {/* QR Code & Footer */}
              <div className="pt-4 text-center space-y-3">
                <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-xl border border-gray-100 max-w-[140px] mx-auto">
                  {/* Decorative QR Code SVG */}
                  <svg className="w-20 h-20 text-gray-900" viewBox="0 0 100 100" fill="currentColor">
                    <rect x="0" y="0" width="30" height="30" rx="4" />
                    <rect x="5" y="5" width="20" height="20" fill="white" rx="2" />
                    <rect x="10" y="10" width="10" height="10" fill="currentColor" rx="1" />

                    <rect x="70" y="0" width="30" height="30" rx="4" />
                    <rect x="75" y="5" width="20" height="20" fill="white" rx="2" />
                    <rect x="80" y="10" width="10" height="10" fill="currentColor" rx="1" />

                    <rect x="0" y="70" width="30" height="30" rx="4" />
                    <rect x="5" y="75" width="20" height="20" fill="white" rx="2" />
                    <rect x="10" y="80" width="10" height="10" fill="currentColor" rx="1" />

                    <rect x="40" y="10" width="15" height="15" rx="1" />
                    <rect x="40" y="40" width="20" height="20" rx="2" />
                    <rect x="10" y="40" width="15" height="15" rx="1" />
                    <rect x="70" y="40" width="15" height="20" rx="1" />
                    <rect x="40" y="70" width="20" height="20" rx="2" />
                    <rect x="70" y="70" width="20" height="10" rx="1" />
                  </svg>
                  <span className="text-[9px] font-mono text-gray-500 font-bold mt-1">
                    {recentReceipt.ticketNumber || recentReceipt.id}
                  </span>
                </div>

                <p className="font-extrabold text-xs text-gray-900">
                  Merci de votre visite !
                </p>
              </div>

            </div>

            {/* Action buttons */}
            <div className="mt-4 flex gap-2.5">
              <button
                onClick={() => {
                  const printWin = window.open('', '_blank');
                  if (printWin) {
                    printWin.document.write(`
                      <html>
                        <head>
                          <title>Ticket ${recentReceipt.ticketNumber || recentReceipt.id}</title>
                          <style>
                            body { font-family: sans-serif; font-size: 11px; width: 280px; margin: 0 auto; padding: 15px; color: #000; }
                            .center { text-align: center; }
                            .bold { font-weight: bold; }
                            .flex { display: flex; justify-content: space-between; }
                            table { width: 100%; border-collapse: collapse; margin: 8px 0; }
                            th, td { text-align: left; padding: 3px 0; font-size: 11px; }
                            .right { text-align: right; }
                            .divider { border-top: 1px dashed #000; margin: 8px 0; }
                            .double { border-top: 2px solid #000; margin: 8px 0; }
                            .title { font-size: 14px; font-weight: 900; text-transform: uppercase; margin-bottom: 2px; }
                          </style>
                        </head>
                        <body>
                          <div class="center">
                            ${companySettings.logo && !companySettings.logo.startsWith('http') ? `<img src="${companySettings.logo}" style="width:50px; height:auto; margin-bottom: 5px;" />` : ''}
                            <div class="title">${companySettings.name}</div>
                            <div style="font-size:10px; color:#555;">${companySettings.address} ${companySettings.phone ? `<br/>${companySettings.phone}` : ''}</div>
                          </div>
                          <div class="divider"></div>
                          <div>
                            <div class="flex"><span>Ticket :</span><b>${recentReceipt.ticketNumber || recentReceipt.id}</b></div>
                            <div class="flex"><span>Date :</span><span>${recentReceipt.date} ${recentReceipt.time}</span></div>
                            <div class="flex"><span>Caissier :</span><span>${recentReceipt.cashier}</span></div>
                          </div>
                          <div class="divider"></div>
                          <table>
                            <thead>
                              <tr><th>Qté</th><th>Produit</th><th class="right">Total</th></tr>
                            </thead>
                            <tbody>
                              ${recentReceipt.items.map((i: any) => `
                                <tr>
                                  <td>${i.quantity}</td>
                                  <td>${i.product?.name || i.name || 'Article'}</td>
                                  <td class="right">${(i.quantity * (i.product?.price || i.unitPrice || 0)).toLocaleString('fr-FR')} FCFA</td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                          <div class="divider"></div>
                          <div class="flex"><span>TOTAL :</span><span>${(recentReceipt.subtotalGross || recentReceipt.subtotal).toLocaleString('fr-FR')} FCFA</span></div>
                          ${(recentReceipt.totalDiscounts || 0) > 0 ? `<div class="flex"><span>Remise :</span><span>-${recentReceipt.totalDiscounts.toLocaleString('fr-FR')} FCFA</span></div>` : ''}
                          <div class="double"></div>
                          <div class="flex bold" style="font-size:13px"><span>À PAYER :</span><span>${recentReceipt.total.toLocaleString('fr-FR')} FCFA</span></div>
                          <div class="double"></div>
                          <br/>
                          <div class="flex"><span>Paiement :</span><b>${recentReceipt.payMethod}</b></div>
                          ${recentReceipt.cashPaid > 0 ? `<div class="flex"><span>Espèces :</span><span>${recentReceipt.cashPaid.toLocaleString('fr-FR')} FCFA</span></div>` : ''}
                          ${recentReceipt.mobilePaid > 0 ? `<div class="flex"><span>Mobile :</span><span>${recentReceipt.mobilePaid.toLocaleString('fr-FR')} FCFA</span></div>` : ''}
                          ${recentReceipt.cardPaid > 0 ? `<div class="flex"><span>Carte :</span><span>${recentReceipt.cardPaid.toLocaleString('fr-FR')} FCFA</span></div>` : ''}
                          ${recentReceipt.chequePaid > 0 ? `<div class="flex"><span>Chèque :</span><span>${recentReceipt.chequePaid.toLocaleString('fr-FR')} FCFA</span></div>` : ''}
                          <div class="divider"></div>
                          <div class="center" style="margin-top:15px">
                            <p class="bold">Merci de votre visite !</p>
                          </div>
                        </body>
                      </html>
                    `);
                    printWin.document.close();
                    printWin.focus();
                    setTimeout(() => {
                      printWin.print();
                    }, 250);
                  }
                }}
                className="flex-1 py-3 bg-[#8e24aa] hover:bg-[#7b1fa2] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">print</span>
                Imprimer le Ticket
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="px-5 py-3 border border-gray-200 hover:bg-gray-100 text-gray-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
