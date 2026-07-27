import React, { useState, useMemo } from 'react';
import { EnrichedProduct, WarehouseCategory, WarehouseSupplier, StockMovement } from './types';
import { LIBRAIRIE_CATEGORIES } from '../../data';

interface ProductsTabProps {
  products: EnrichedProduct[];
  setProducts: React.Dispatch<React.SetStateAction<any[]>>;
  categories: WarehouseCategory[];
  suppliers: WarehouseSupplier[];
  movements: StockMovement[];
  onAddMovement: (newMov: StockMovement) => void;
  currentUser: any;
  globallySelectedSku?: string | null;
  onClearGloballySelectedSku?: () => void;
  activeSubTab?: string;
  setActiveSubTab?: (subTab: string) => void;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  setProducts,
  categories,
  suppliers,
  movements,
  onAddMovement,
  currentUser,
  globallySelectedSku,
  onClearGloballySelectedSku,
  activeSubTab,
  setActiveSubTab,
}) => {
  // Filters state
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('Tous');
  const [selectedSubCat, setSelectedSubCat] = useState('Tous');
  const [selectedSup, setSelectedSup] = useState('Tous');
  const [stockFilter, setStockFilter] = useState('Tous'); // Tous, Normal, Faible, Rupture
  const [statusFilter, setStatusFilter] = useState('Tous'); // Tous, Actif, Désactivé
  const [sortBy, setSortBy] = useState('name-asc');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProd, setSelectedProd] = useState<EnrichedProduct | null>(null);

  // States for professional product image management space
  const [viewModalTab, setViewModalTab] = useState<'details' | 'image'>('details');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [optimizedImage, setOptimizedImage] = useState<{
    blob: Blob;
    url: string;
    width: number;
    height: number;
    size: number;
    originalSize: number;
    format: string;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isEnlarged, setIsEnlarged] = useState(false);
  
  // Persistent local audit logs for image management
  const [imageAuditLogs, setImageAuditLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('smartstock_product_image_audit_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Sync products with the simulated Supabase storage bucket images on mount/update
  React.useEffect(() => {
    const storage = localStorage.getItem('supabase_storage_bucket');
    if (storage) {
      try {
        const bucket = JSON.parse(storage);
        let updated = false;
        const newProds = products.map((p) => {
          const path = `products/${p.id}/image.webp`;
          if (bucket[path] && p.image !== bucket[path]) {
            updated = true;
            return {
              ...p,
              image: bucket[path],
              image_path: path,
            };
          }
          return p;
        });
        if (updated) {
          setProducts(newProds);
        }
      } catch (e) {
        console.error("Erreur de synchronisation du bucket d'images :", e);
      }
    }
  }, []);

  const canManageImages = useMemo(() => {
    if (!currentUser || !currentUser.role) return false;
    const roleLower = currentUser.role.toLowerCase();
    return roleLower.includes('gouverneur') || roleLower.includes('gestionnaire');
  }, [currentUser]);

  const logImageAction = (productId: string, sku: string, name: string, action: string) => {
    const newLog = {
      id: `LOG-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`,
      user: `${currentUser.name} (${currentUser.role})`,
      productId,
      productSku: sku,
      productName: name,
      action,
      timestamp: new Date().toLocaleString('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    };
    const updated = [newLog, ...imageAuditLogs];
    setImageAuditLogs(updated);
    localStorage.setItem('smartstock_product_image_audit_logs', JSON.stringify(updated));
  };

  const processAndOptimizeImage = async (file: File): Promise<{ blob: Blob; mimeType: string; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        let width = img.width;
        let height = img.height;

        // Redimensionnement à maximum 1024x1024 px en conservant les proportions
        if (width > 1024 || height > 1024) {
          const ratio = Math.min(1024 / width, 1024 / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Impossible d'accéder au contexte 2D du canvas."));
          return;
        }

        // Le dessin sur le canvas supprime automatiquement les métadonnées (EXIF, GPS, etc.)
        // et le navigateur gère l'orientation automatique par défaut depuis l'image source.
        ctx.drawImage(img, 0, 0, width, height);

        // Compression adaptative intelligente
        let quality = 0.85;
        let finalBlob: Blob | null = null;
        let finalMime = 'image/webp';

        try {
          // Tentative principale de conversion au format WEBP
          finalBlob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', quality));
          
          // Si WEBP n'est pas supporté par le navigateur
          if (!finalBlob || finalBlob.type !== 'image/webp') {
            finalMime = 'image/jpeg';
            finalBlob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', quality));
          }
        } catch (e) {
          finalMime = file.type;
          finalBlob = file;
        }

        if (!finalBlob) {
          finalBlob = file;
          finalMime = file.type;
        }

        // Algorithme de compression adaptative intelligente pour cibler 80 Ko - 200 Ko
        if (finalMime === 'image/webp' || finalMime === 'image/jpeg') {
          const formatToUse = finalMime;
          
          // Si trop grand (> 200 Ko), réduire la qualité de façon itérative
          if (finalBlob.size > 200 * 1024) {
            for (let q = 0.75; q >= 0.15; q -= 0.1) {
              const compressed = await new Promise<Blob | null>((res) => canvas.toBlob(res, formatToUse, q));
              if (compressed) {
                finalBlob = compressed;
                if (compressed.size <= 200 * 1024) {
                  break;
                }
              }
            }
          } 
          // Si trop petit (< 80 Ko), augmenter la qualité pour optimiser la netteté de l'ERP/POS
          else if (finalBlob.size < 80 * 1024) {
            const highQuality = await new Promise<Blob | null>((res) => canvas.toBlob(res, formatToUse, 0.95));
            if (highQuality && highQuality.size <= 250 * 1024) {
              finalBlob = highQuality;
            }
          }
        }

        resolve({ blob: finalBlob, mimeType: finalMime, width, height });
      };

      img.onerror = () => reject(new Error("Impossible de charger le fichier d'image sélectionné."));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelected = async (file: File) => {
    if (!canManageImages) return;
    setUploadError('');
    
    // 1. Validation
    if (!file.type.startsWith('image/')) {
      setUploadError("Le fichier sélectionné n'est pas une image valide.");
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Format non autorisé. Formats acceptés : JPG, JPEG, PNG, WEBP.");
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5 Mo
    if (file.size > maxSize) {
      setUploadError("Taille maximale dépassée. La taille du fichier doit être inférieure à 5 Mo.");
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);

    try {
      // 2. Automatic processing (correction, resize, convert to WebP, compress)
      const result = await processAndOptimizeImage(file);
      
      const objectUrl = URL.createObjectURL(result.blob);
      setOptimizedImage({
        blob: result.blob,
        url: objectUrl,
        width: result.width,
        height: result.height,
        size: result.blob.size,
        originalSize: file.size,
        format: result.mimeType.split('/')[1].toUpperCase(),
      });
    } catch (err: any) {
      setUploadError(err.message || "Une erreur s'est produite lors du traitement de l'image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!canManageImages) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const uploadToSupabaseStorage = (productId: string, fileBlob: Blob, onProgress: (progress: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 18) + 12;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            let bucket: Record<string, string> = {};
            const existing = localStorage.getItem('supabase_storage_bucket');
            if (existing) {
              try {
                bucket = JSON.parse(existing);
              } catch (e) {
                console.error(e);
              }
            }
            
            const path = `products/${productId}/image.webp`;
            bucket[path] = base64data;
            localStorage.setItem('supabase_storage_bucket', JSON.stringify(bucket));
            resolve(base64data);
          };
          reader.onerror = () => {
            reject(new Error("Erreur de lecture du fichier optimisé."));
          };
          reader.readAsDataURL(fileBlob);
        } else {
          onProgress(progress);
        }
      }, 120);
    });
  };

  const deleteFromSupabaseStorage = (productId: string): void => {
    const existing = localStorage.getItem('supabase_storage_bucket');
    if (existing) {
      try {
        const bucket = JSON.parse(existing);
        const path = `products/${productId}/image.webp`;
        if (bucket[path]) {
          delete bucket[path];
          localStorage.setItem('supabase_storage_bucket', JSON.stringify(bucket));
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleUploadConfirm = async () => {
    if (!selectedProd || !optimizedImage || !canManageImages) return;
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');

    try {
      const originalImageExist = !!selectedProd.image_path;
      const base64Data = await uploadToSupabaseStorage(selectedProd.id, optimizedImage.blob, (progress) => {
        setUploadProgress(progress);
      });

      const imagePath = `products/${selectedProd.id}/image.webp`;
      const updatedAtStr = new Date().toISOString();
      
      const updatedProducts = products.map((p) => {
        if (p.id === selectedProd.id) {
          return {
            ...p,
            image: base64Data,
            image_path: imagePath,
            updated_at: updatedAtStr,
          };
        }
        return p;
      });

      setProducts(updatedProducts);

      const actionName = originalImageExist ? "Remplacement d'image" : "Ajout d'image";
      logImageAction(selectedProd.id, selectedProd.sku, selectedProd.name, actionName);

      setSelectedProd({
        ...selectedProd,
        image: base64Data,
        image_path: imagePath,
        updated_at: updatedAtStr,
      });

      setSelectedFile(null);
      setOptimizedImage(null);
    } catch (err: any) {
      setUploadError(err.message || "Échec du téléversement vers Supabase Storage.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadCancel = () => {
    setSelectedFile(null);
    setOptimizedImage(null);
    setUploadProgress(0);
    setUploadError('');
  };

  const handleDeleteImage = () => {
    if (!selectedProd || !canManageImages) return;
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer l'image de ce produit ? Cette action est irréversible et supprimera le fichier dans Supabase Storage.")) {
      return;
    }

    try {
      deleteFromSupabaseStorage(selectedProd.id);
      const defaultPlaceholder = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLkSkUr_zxl_INx_ctYzTQ86IOoC4k372lBmItxn-cXL-yya-eJctkTqKTeFsVDfiuLg_9fGK_YFtPsJImepDEvkN44sLzAXWLemdnv_-iuPIMscd01UfaBiCt7_tAaVjAI-ye1JnyOnGnW0ftDC3VZ1JjE3xCNU0nUi5DMIfhH0Y7ZY93J-C-PD0QH6xJ3--iPp1QVqu_frlfy2pOKzjweDJqSueXhp6pYJIcR_zFil6k5_S5nSzz2W3qXte7UVxeyZPZyKSLnOM';
      const updatedAtStr = new Date().toISOString();

      const updatedProducts = products.map((p) => {
        if (p.id === selectedProd.id) {
          return {
            ...p,
            image: defaultPlaceholder,
            image_path: null,
            updated_at: updatedAtStr,
          };
        }
        return p;
      });

      setProducts(updatedProducts);
      logImageAction(selectedProd.id, selectedProd.sku, selectedProd.name, "Suppression d'image");

      setSelectedProd({
        ...selectedProd,
        image: defaultPlaceholder,
        image_path: null,
        updated_at: updatedAtStr,
      });

      handleUploadCancel();
    } catch (err: any) {
      setUploadError("Erreur lors de la suppression de l'image.");
    }
  };

  // Reactive Effect for Global Search SKU view
  React.useEffect(() => {
    if (globallySelectedSku) {
      const prod = products.find((p) => p.sku === globallySelectedSku);
      if (prod) {
        setSelectedProd(prod);
        setShowViewModal(true);
      }
      if (onClearGloballySelectedSku) {
        onClearGloballySelectedSku();
      }
    }
  }, [globallySelectedSku, products, onClearGloballySelectedSku]);

  // Reactive Effect for Sidebar Add Product subtab action
  React.useEffect(() => {
    if (activeSubTab === 'add') {
      setShowAddModal(true);
      if (setActiveSubTab) {
        setActiveSubTab('list');
      }
    }
  }, [activeSubTab, setActiveSubTab]);

  // New Product Form State (Multi-section)
  const [formStep, setFormStep] = useState(1);
  const [newBarcode, setNewBarcode] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState(categories[0]?.name || 'Livres');
  const [newSubCat, setNewSubCat] = useState('');

  // Dynamic subcategory options for selected category
  const currentSubcategories = useMemo(() => {
    const catObj = LIBRAIRIE_CATEGORIES.find((c) => c.name === newCategory);
    if (catObj && catObj.subcategories.length > 0) {
      return catObj.subcategories;
    }
    return [];
  }, [newCategory]);

  const handleCategoryChange = (catName: string) => {
    setNewCategory(catName);
    const catObj = LIBRAIRIE_CATEGORIES.find((c) => c.name === catName);
    if (catObj && catObj.subcategories.length > 0) {
      setNewSubCat(catObj.subcategories[0]);
    } else {
      setNewSubCat('');
    }
  };
  const [newBrand, setNewBrand] = useState('');
  const [newSupplier, setNewSupplier] = useState('Global Tech Dist.');
  const [newPurchasePrice, setNewPurchasePrice] = useState<number>(0);
  const [newSalePrice, setNewSalePrice] = useState<number>(0);
  const [newInitialStock, setNewInitialStock] = useState<number>(0);
  const [newMinStock, setNewMinStock] = useState<number>(10);
  const [newMaxStock, setNewMaxStock] = useState<number>(500);
  const [newImage, setNewImage] = useState('');
  const [formError, setFormError] = useState('');

  // Barcode Scanner states
  const [useScannerMode, setUseScannerMode] = useState(true);
  const [scanState, setScanState] = useState<'scan_or_search' | 'new_product_form' | 'existing_product_actions'>('scan_or_search');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [qtyToAdd, setQtyToAdd] = useState<number>(1);
  const [successNotification, setSuccessNotification] = useState('');

  // DOM element Refs for Scanner
  const barcodeInputRef = React.useRef<HTMLInputElement | null>(null);
  const nameInputRef = React.useRef<HTMLInputElement | null>(null);
  const qtyInputRef = React.useRef<HTMLInputElement | null>(null);

  // Automatic focus handling for Scanner
  React.useEffect(() => {
    if (showAddModal) {
      if (useScannerMode) {
        if (scanState === 'scan_or_search') {
          const t = setTimeout(() => {
            barcodeInputRef.current?.focus();
          }, 150);
          return () => clearTimeout(t);
        } else if (scanState === 'new_product_form') {
          const t = setTimeout(() => {
            nameInputRef.current?.focus();
          }, 150);
          return () => clearTimeout(t);
        } else if (scanState === 'existing_product_actions') {
          const t = setTimeout(() => {
            qtyInputRef.current?.focus();
            qtyInputRef.current?.select();
          }, 150);
          return () => clearTimeout(t);
        }
      } else {
        // Standard step-by-step form step 1 focus
        const t = setTimeout(() => {
          const firstInput = document.getElementById('standard-product-name');
          if (firstInput) (firstInput as HTMLInputElement).focus();
        }, 150);
        return () => clearTimeout(t);
      }
    }
  }, [showAddModal, useScannerMode, scanState]);

  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanBarcode = barcodeInput.trim();
    if (!cleanBarcode) return;

    // Search for product with this barcode (case-insensitive)
    const existing = products.find(
      (p) => (p.barcode || '').toLowerCase() === cleanBarcode.toLowerCase()
    );

    if (existing) {
      // Barcode exists!
      setSelectedProd(existing);
      setScanState('existing_product_actions');
      setQtyToAdd(1);
      setFormError('');
    } else {
      // New barcode!
      setNewBarcode(cleanBarcode);
      // Auto-generate SKU
      const randomSuffix = Math.floor(100 + Math.random() * 900); // 3 digits
      const generatedSku = `SKU-${cleanBarcode.slice(-4) || 'GEN'}-${randomSuffix}`;
      setNewSku(generatedSku);

      // Reset form fields for new product
      setNewName('');
      setNewDesc('');
      const defaultCat = categories[0]?.name || 'Livres';
      handleCategoryChange(defaultCat);
      setNewBrand('SmartStock');
      setNewSupplier(suppliers[0]?.name || 'Global Tech Dist.');
      setNewPurchasePrice(0);
      setNewSalePrice(0);
      setNewInitialStock(1); // Default initial stock to 1
      setNewMinStock(5); // Default min stock to 5
      setNewMaxStock(100);

      setScanState('new_product_form');
      setFormError('');
    }
  };

  const handleAddStockFromScanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProd) return;
    if (qtyToAdd <= 0) {
      setFormError('La quantité doit être supérieure à 0.');
      return;
    }

    // Update product stock in local state
    setProducts((prev) =>
      prev.map((p) =>
        p.id === selectedProd.id ? { ...p, stock: p.stock + qtyToAdd } : p
      )
    );

    // Add a stock movement log
    onAddMovement({
      id: `MOV-${Date.now().toString().slice(-3)}`,
      date: new Date().toISOString().split('T')[0],
      hour: new Date().toLocaleTimeString('fr-FR', { hour12: false }).slice(0, 5),
      productSku: selectedProd.sku.toUpperCase(),
      productName: selectedProd.name,
      type: 'Entrée',
      quantity: qtyToAdd,
      user: currentUser.name,
      observation: `Réassort rapide via scanner pistolet (+${qtyToAdd} unités)`,
    });

    // Success notification
    const successMsg = `Stock mis à jour ! +${qtyToAdd} unités ajoutées à "${selectedProd.name}".`;
    setSuccessNotification(successMsg);
    
    // Clear notification after 3.5s
    setTimeout(() => {
      setSuccessNotification((current) => current === successMsg ? '' : current);
    }, 3500);

    // Reset scanner state to ready for next scan
    setScanState('scan_or_search');
    setBarcodeInput('');
    setQtyToAdd(1);
    setFormError('');
  };

  const handleCreateProductQuick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setFormError('Le nom du produit est obligatoire.');
      return;
    }
    if (!newSku.trim()) {
      setFormError('Le code SKU est obligatoire.');
      return;
    }
    if (products.some((p) => p.sku.toLowerCase() === newSku.toLowerCase())) {
      setFormError('Ce SKU existe déjà dans la base de données.');
      return;
    }
    if (newPurchasePrice <= 0) {
      setFormError("Le prix d'achat doit être supérieur à 0.");
      return;
    }
    if (newSalePrice < newPurchasePrice) {
      setFormError("Le prix de vente ne peut pas être inférieur au prix d'achat.");
      return;
    }
    if (newInitialStock < 0) {
      setFormError('La quantité initiale de stock ne peut pas être négative.');
      return;
    }
    if (newMinStock < 0) {
      setFormError('Le stock minimum doit être supérieur ou égal à 0.');
      return;
    }

    // Standard fallback values for quick creation
    const brandName = newBrand.trim() || 'SmartStock';
    const subCatName = newSubCat.trim() || 'Général';
    const imagePath = newImage.trim() || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLkSkUr_zxl_INx_ctYzTQ86IOoC4k372lBmItxn-cXL-yya-eJctkTqKTeFsVDfiuLg_9fGK_YFtPsJImepDEvkN44sLzAXWLemdnv_-iuPIMscd01UfaBiCt7_tAaVjAI-ye1JnyOnGnW0ftDC3VZ1JjE3xCNU0nUi5DMIfhH0Y7ZY93J-C-PD0QH6xJ3--iPp1QVqu_frlfy2pOKzjweDJqSueXhp6pYJIcR_zFil6k5_S5nSzz2W3qXte7UVxeyZPZyKSLnOM';

    const newProduct = {
      id: `PROD-${Date.now().toString().slice(-4)}`,
      sku: newSku.toUpperCase(),
      name: newName,
      category: newCategory as any,
      price: newSalePrice,
      stock: newInitialStock,
      image: imagePath,
      description: newDesc,
      brand: brandName,
      subCategory: subCatName,
      purchasePrice: newPurchasePrice,
      minStock: newMinStock,
      maxStock: newMaxStock || 500,
      barcode: newBarcode.trim(),
      isActive: true,
      supplierName: newSupplier,
    };

    setProducts((prev) => [newProduct, ...prev]);

    // Create stock movement if initial stock > 0
    if (newInitialStock > 0) {
      onAddMovement({
        id: `MOV-${Date.now().toString().slice(-3)}`,
        date: new Date().toISOString().split('T')[0],
        hour: new Date().toLocaleTimeString('fr-FR', { hour12: false }).slice(0, 5),
        productSku: newSku.toUpperCase(),
        productName: newName,
        type: 'Entrée',
        quantity: newInitialStock,
        user: currentUser.name,
        observation: 'Initialisation de stock via création rapide (pistolet)',
      });
    }

    const successMsg = `Produit "${newName}" créé avec succès !`;
    setSuccessNotification(successMsg);

    // Clear notification after 3.5s
    setTimeout(() => {
      setSuccessNotification((current) => current === successMsg ? '' : current);
    }, 3500);

    // Reset fields for the next scan
    setScanState('scan_or_search');
    setBarcodeInput('');
    setNewName('');
    setNewSku('');
    setNewBarcode('');
    setNewPurchasePrice(0);
    setNewSalePrice(0);
    setNewInitialStock(0);
    setNewMinStock(10);
    setFormError('');
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Real-time validations
  const validateForm = () => {
    if (!newName.trim()) return 'Le nom du produit est obligatoire.';
    if (!newSku.trim()) return 'La référence interne (SKU) est obligatoire.';
    if (products.some((p) => p.sku.toLowerCase() === newSku.toLowerCase() && p.id !== selectedProd?.id)) {
      return 'Cette référence SKU existe déjà dans la base de données.';
    }
    if (newPurchasePrice <= 0) return "Le prix d'achat doit être supérieur à 0.";
    if (newSalePrice < newPurchasePrice) return "Le prix de vente ne peut pas être inférieur au prix d'achat.";
    if (newInitialStock < 0) return 'La quantité de stock initiale ne peut pas être négative.';
    if (newMinStock < 0) return 'Le stock minimum doit être positif.';
    if (newMaxStock <= newMinStock) return 'Le stock maximum doit être supérieur au stock minimum.';
    return '';
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }

    const brandName = newBrand.trim() || 'SmartStock';
    const subCatName = newSubCat.trim() || 'Général';
    const barcodeStr = newBarcode.trim() || `370001${Math.floor(100000 + Math.random() * 900000)}`;
    const imagePath = newImage.trim() || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLkSkUr_zxl_INx_ctYzTQ86IOoC4k372lBmItxn-cXL-yya-eJctkTqKTeFsVDfiuLg_9fGK_YFtPsJImepDEvkN44sLzAXWLemdnv_-iuPIMscd01UfaBiCt7_tAaVjAI-ye1JnyOnGnW0ftDC3VZ1JjE3xCNU0nUi5DMIfhH0Y7ZY93J-C-PD0QH6xJ3--iPp1QVqu_frlfy2pOKzjweDJqSueXhp6pYJIcR_zFil6k5_S5nSzz2W3qXte7UVxeyZPZyKSLnOM';

    const newProduct = {
      id: `PROD-${Date.now().toString().slice(-4)}`,
      sku: newSku.toUpperCase(),
      name: newName,
      category: newCategory as any,
      price: newSalePrice,
      stock: newInitialStock,
      image: imagePath,
      description: newDesc,
      brand: brandName,
      subCategory: subCatName,
      purchasePrice: newPurchasePrice,
      minStock: newMinStock,
      maxStock: newMaxStock,
      barcode: barcodeStr,
      isActive: true,
      supplierName: newSupplier,
    };

    setProducts((prev) => [newProduct, ...prev]);

    // Automatically create a movement log for initial stock creation
    if (newInitialStock > 0) {
      onAddMovement({
        id: `MOV-${Date.now().toString().slice(-3)}`,
        date: new Date().toISOString().split('T')[0],
        hour: new Date().toLocaleTimeString('fr-FR', { hour12: false }).slice(0, 5),
        productSku: newSku.toUpperCase(),
        productName: newName,
        type: 'Entrée',
        quantity: newInitialStock,
        user: currentUser.name,
        observation: 'Quantité de stock initiale lors de la création de la fiche produit',
      });
    }

    // Reset Form
    resetForm();
    setShowAddModal(false);
  };

  const handleEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProd) return;
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }

    const updated = {
      ...selectedProd,
      sku: newSku.toUpperCase(),
      name: newName,
      category: newCategory as any,
      price: newSalePrice,
      description: newDesc,
      brand: newBrand || 'SmartStock',
      subCategory: newSubCat || 'Général',
      purchasePrice: newPurchasePrice,
      minStock: newMinStock,
      maxStock: newMaxStock,
      barcode: newBarcode || selectedProd.barcode,
      image: newImage || selectedProd.image,
      supplierName: newSupplier,
    };

    setProducts((prev) => prev.map((p) => (p.id === selectedProd.id ? updated : p)));
    setShowEditModal(false);
    resetForm();
  };

  const toggleProductActive = (prod: EnrichedProduct) => {
    const isNowActive = !(prod.isActive !== false);
    
    // Check if there are movements involving this product
    const hasHistory = movements.some((m) => m.productSku.toLowerCase() === prod.sku.toLowerCase());
    
    if (!isNowActive && hasHistory) {
      if (!confirm(`Note : Ce produit possède un historique de mouvements. Il ne sera pas supprimé mais uniquement désactivé dans tout le système ERP. Souhaitez-vous le désactiver ?`)) {
        return;
      }
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === prod.id ? { ...p, isActive: isNowActive } : p))
    );
  };

  const resetForm = () => {
    setFormStep(1);
    setNewBarcode('');
    setNewSku('');
    setNewName('');
    setNewDesc('');
    const defaultCat = categories[0]?.name || 'Livres';
    handleCategoryChange(defaultCat);
    setNewBrand('');
    setNewSupplier('Global Tech Dist.');
    setNewPurchasePrice(0);
    setNewSalePrice(0);
    setNewInitialStock(0);
    setNewMinStock(10);
    setNewMaxStock(500);
    setNewImage('');
    setFormError('');
    setSelectedProd(null);
    setScanState('scan_or_search');
    setBarcodeInput('');
    setQtyToAdd(1);
    setSuccessNotification('');
  };

  const openEditModal = (prod: EnrichedProduct) => {
    setSelectedProd(prod);
    setNewBarcode(prod.barcode || '');
    setNewSku(prod.sku);
    setNewName(prod.name);
    setNewDesc(prod.description || '');
    setNewCategory(prod.category);
    setNewSubCat(prod.subCategory || '');
    setNewBrand(prod.brand || '');
    setNewSupplier(prod.supplierName || 'Global Tech Dist.');
    setNewPurchasePrice(prod.purchasePrice || Math.round(prod.price * 0.65));
    setNewSalePrice(prod.price);
    setNewInitialStock(prod.stock);
    setNewMinStock(prod.minStock || 10);
    setNewMaxStock(prod.maxStock || 500);
    setNewImage(prod.image);
    setShowEditModal(true);
  };

  // Derived subcategories list based on selected category or all categories
  const availableSubCategories = useMemo(() => {
    if (selectedCat !== 'Tous') {
      const catObj = LIBRAIRIE_CATEGORIES.find((c) => c.name === selectedCat);
      if (catObj && catObj.subcategories.length > 0) {
        return catObj.subcategories;
      }
      const subcatsInProducts = Array.from(
        new Set(
          products
            .filter((p) => p.category === selectedCat)
            .map((p) => p.subCategory || p.subcategory)
            .filter(Boolean) as string[]
        )
      );
      return subcatsInProducts;
    } else {
      const allSubcats = new Set<string>();
      LIBRAIRIE_CATEGORIES.forEach((c) => {
        c.subcategories.forEach((s) => allSubcats.add(s));
      });
      products.forEach((p) => {
        const sub = p.subCategory || p.subcategory;
        if (sub) allSubcats.add(sub);
      });
      return Array.from(allSubcats).sort((a, b) => a.localeCompare(b));
    }
  }, [selectedCat, products]);

  const handleCategoryFilterChange = (catName: string) => {
    setSelectedCat(catName);
    setSelectedSubCat('Tous');
    setCurrentPage(1);
  };

  // Filter and Sort Logic
  const filteredProducts = useMemo(() => {
    return products
      .map((p) => ({
        ...p,
        minStock: p.minStock || 15,
        barcode: p.barcode || `370001200${p.sku.replace(/\D/g, '').padEnd(3, '0')}`,
        isActive: p.isActive !== false,
        supplierName: p.supplierName || 'Global Tech Dist.',
      }))
      .filter((p) => {
        // Search filter (Name, SKU, Barcode, Category, Subcategory)
        const q = search.toLowerCase().trim();
        const pSubCat = (p.subCategory || p.subcategory || '').toLowerCase();
        const matchSearch =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          pSubCat.includes(q);

        // Category filter
        const matchCat = selectedCat === 'Tous' || p.category === selectedCat;

        // Subcategory filter
        const productSubCat = p.subCategory || p.subcategory || '';
        const matchSubCat = selectedSubCat === 'Tous' || productSubCat === selectedSubCat;

        // Supplier filter
        const matchSup = selectedSup === 'Tous' || p.supplierName === selectedSup;

        // Stock filter
        let matchStock = true;
        if (stockFilter === 'Rupture') matchStock = p.stock === 0;
        else if (stockFilter === 'Faible') matchStock = p.stock > 0 && p.stock < p.minStock;
        else if (stockFilter === 'Normal') matchStock = p.stock >= p.minStock;

        // Active status filter
        let matchStatus = true;
        if (statusFilter === 'Actif') matchStatus = p.isActive === true;
        else if (statusFilter === 'Désactivé') matchStatus = p.isActive === false;

        return matchSearch && matchCat && matchSubCat && matchSup && matchStock && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
        if (sortBy === 'sku-asc') return a.sku.localeCompare(b.sku);
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'stock-desc') return b.stock - a.stock;
        if (sortBy === 'stock-asc') return a.stock - b.stock;
        return 0;
      });
  }, [products, search, selectedCat, selectedSubCat, selectedSup, stockFilter, statusFilter, sortBy]);

  // Paginated data
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const productMovements = useMemo(() => {
    if (!selectedProd) return [];
    return movements.filter(
      (m) => m.productSku.toLowerCase() === selectedProd.sku.toLowerCase()
    );
  }, [movements, selectedProd]);

  // --- Calculate Brands Summary ---
  const uniqueBrands = useMemo(() => {
    const brandsMap: { [key: string]: { name: string; count: number; stock: number; value: number } } = {};
    products.forEach((p) => {
      const brandName = p.brand || (p.name.toLowerCase().includes('logitech') ? 'Logitech' : p.name.toLowerCase().includes('hp') ? 'HP' : p.name.toLowerCase().includes('samsung') ? 'Samsung' : 'SmartStock');
      const stock = p.stock || 0;
      const value = stock * p.price;
      if (!brandsMap[brandName]) {
        brandsMap[brandName] = { name: brandName, count: 0, stock: 0, value: 0 };
      }
      brandsMap[brandName].count += 1;
      brandsMap[brandName].stock += stock;
      brandsMap[brandName].value += value;
    });
    return Object.values(brandsMap).sort((a, b) => b.value - a.value);
  }, [products]);

  // --- Calculate Units Summary ---
  const uniqueUnits = useMemo(() => {
    const unitsMap: { [key: string]: { name: string; count: number; stock: number; value: number } } = {
      "Pièce (U)": { name: "Pièce (U)", count: 0, stock: 0, value: 0 },
      "Carton (Ctn)": { name: "Carton (Ctn)", count: 0, stock: 0, value: 0 },
      "Sachet (Sct)": { name: "Sachet (Sct)", count: 0, stock: 0, value: 0 },
      "Boîte (Bte)": { name: "Boîte (Bte)", count: 0, stock: 0, value: 0 },
    };

    products.forEach((p) => {
      let unit = "Pièce (U)";
      if (p.category === 'Alimentation' || p.category === 'Boissons') unit = "Carton (Ctn)";
      else if (p.category === 'Entretien' || p.category === 'Beauté') unit = "Sachet (Sct)";
      else if (p.category === 'Bureau' || p.category === 'Fournitures') unit = "Boîte (Bte)";

      const stock = p.stock || 0;
      const value = stock * p.price;
      
      if (!unitsMap[unit]) {
        unitsMap[unit] = { name: unit, count: 0, stock: 0, value: 0 };
      }
      unitsMap[unit].count += 1;
      unitsMap[unit].stock += stock;
      unitsMap[unit].value += value;
    });
    return Object.values(unitsMap).filter(u => u.count > 0);
  }, [products]);

  // --- SUBTAB: BRANDS VIEW ---
  if (activeSubTab === 'brands') {
    const totalBrands = uniqueBrands.length;
    const topBrand = uniqueBrands[0]?.name || 'N/A';
    const averageItemsPerBrand = totalBrands > 0 ? Math.round(products.length / totalBrands) : 0;

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-gray-900">Marques Référencées</h3>
            <p className="text-xs text-gray-500">Répartition, volume d'unités et valorisation financière par marque d'article</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-[#c7c4d8]/40 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-[#3525cd] rounded-xl">
              <span className="material-symbols-outlined text-2xl">sell</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Marques actives</p>
              <h4 className="text-2xl font-black text-gray-900 mt-0.5">{totalBrands}</h4>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#c7c4d8]/40 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <span className="material-symbols-outlined text-2xl">workspace_premium</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Marque leader (Valeur)</p>
              <h4 className="text-xl font-black text-gray-900 mt-0.5">{topBrand}</h4>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#c7c4d8]/40 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
              <span className="material-symbols-outlined text-2xl">widgets</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Moyenne articles / marque</p>
              <h4 className="text-2xl font-black text-gray-900 mt-0.5">{averageItemsPerBrand}</h4>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#c7c4d8]/40 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h4 className="font-bold text-sm text-gray-900">Analyse de Rentabilité par Marque</h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-wider bg-gray-50/30">
                  <th className="py-3.5 px-6">Nom de la marque</th>
                  <th className="py-3.5 px-6 text-center">Fiches articles</th>
                  <th className="py-3.5 px-6 text-center">Unités en stock</th>
                  <th className="py-3.5 px-6 text-right">Valorisation revente (F)</th>
                  <th className="py-3.5 px-6 text-center">Densité stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {uniqueBrands.map((brand, i) => {
                  const maxVal = uniqueBrands[0]?.value || 1;
                  const ratio = Math.min(100, Math.max(8, (brand.value / maxVal) * 100));
                  return (
                    <tr key={brand.name} className="hover:bg-gray-50/50 transition-all">
                      <td className="py-4 px-6 font-bold text-gray-900">{brand.name}</td>
                      <td className="py-4 px-6 text-center font-semibold text-gray-700">{brand.count} refs</td>
                      <td className="py-4 px-6 text-center font-extrabold text-gray-900">{brand.stock.toLocaleString('fr-FR')} u</td>
                      <td className="py-4 px-6 text-right font-black text-gray-900">{brand.value.toLocaleString('fr-FR')} F</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3 justify-center">
                          <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#3525cd] rounded-full"
                              style={{ width: `${ratio}%`, opacity: 1 - i * 0.1 }}
                            ></div>
                          </div>
                          <span className="text-[10px] text-gray-400 font-bold">{Math.round(ratio)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // --- SUBTAB: UNITS OF MEASURE VIEW ---
  if (activeSubTab === 'units') {
    const totalUnitTypes = uniqueUnits.length;
    const topUnit = uniqueUnits.reduce((prev, current) => (prev.count > current.count ? prev : current), uniqueUnits[0])?.name || 'N/A';

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-gray-900">Unités de Mesure (UoM)</h3>
            <p className="text-xs text-gray-500">Typologies d'emballages, unités physiques et équivalences de stockage</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-[#c7c4d8]/40 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-[#3525cd] rounded-xl">
              <span className="material-symbols-outlined text-2xl">grid_view</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Typologies d'Unités</p>
              <h4 className="text-2xl font-black text-gray-900 mt-0.5">{totalUnitTypes} configurations</h4>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#c7c4d8]/40 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <span className="material-symbols-outlined text-2xl">inventory</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Unité prédominante</p>
              <h4 className="text-xl font-black text-gray-900 mt-0.5">{topUnit}</h4>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {uniqueUnits.map((u) => (
            <div key={u.name} className="bg-white p-6 rounded-3xl border border-[#c7c4d8]/40 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-xs font-black text-[#3525cd] bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                  {u.name}
                </span>
                <span className="material-symbols-outlined text-gray-400">package_2</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-2xl font-black text-gray-900">{u.stock.toLocaleString('fr-FR')}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Unités en stock</p>
              </div>
              <div className="pt-3 border-t border-gray-50 flex justify-between text-xs text-gray-500">
                <span>{u.count} fiches articles</span>
                <span className="font-extrabold text-gray-800">{u.value.toLocaleString('fr-FR')} F</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900">Catalogue des Produits</h3>
          <p className="text-xs text-gray-500">Gérez le référentiel des fiches articles, classifications et fiches tarifs</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-5 py-2.5 bg-[#3525cd] text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-[#4f46e5] transition-all flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Ajouter un Produit
        </button>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#c7c4d8]/40 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search bar */}
          <div className="lg:col-span-3 relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Nom, SKU, code-barres, catégorie..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
            />
          </div>

          {/* Category filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedCat}
              onChange={(e) => handleCategoryFilterChange(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#3525cd] bg-white font-semibold text-gray-800"
            >
              <option value="Tous">Toutes Catégories</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedSubCat}
              onChange={(e) => {
                setSelectedSubCat(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#3525cd] bg-white font-semibold text-gray-800"
            >
              <option value="Tous">Toutes Sous-catégories</option>
              {availableSubCategories.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedSup}
              onChange={(e) => {
                setSelectedSup(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#3525cd] bg-white font-semibold text-gray-800"
            >
              <option value="Tous">Tous Fournisseurs</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock level filter */}
          <div className="lg:col-span-1">
            <select
              value={stockFilter}
              onChange={(e) => {
                setStockFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#3525cd] bg-white font-semibold text-gray-800"
            >
              <option value="Tous">Stock</option>
              <option value="Normal">Normal</option>
              <option value="Faible">Faible</option>
              <option value="Rupture">Rupture</option>
            </select>
          </div>

          {/* Sort By selector */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#3525cd] bg-white font-semibold text-gray-800"
            >
              <option value="name-asc">Nom (A-Z)</option>
              <option value="name-desc">Nom (Z-A)</option>
              <option value="sku-asc">Réf SKU</option>
              <option value="price-desc">Prix (Décroissant)</option>
              <option value="price-asc">Prix (Croissant)</option>
              <option value="stock-desc">Quantité (Décroissant)</option>
              <option value="stock-asc">Quantité (Croissant)</option>
            </select>
          </div>
        </div>

        {/* secondary filters & active chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-gray-400 mr-1">Statut :</span>
            <div className="flex gap-1.5">
              {['Tous', 'Actif', 'Désactivé'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                    statusFilter === st ? 'bg-indigo-50 text-[#3525cd] border border-indigo-200' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Active filter badges */}
            {(selectedCat !== 'Tous' || selectedSubCat !== 'Tous' || search.trim() !== '' || selectedSup !== 'Tous' || stockFilter !== 'Tous' || statusFilter !== 'Tous') && (
              <div className="flex flex-wrap items-center gap-1.5 ml-2 border-l border-gray-200 pl-3">
                {selectedCat !== 'Tous' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-[#3525cd]">
                    Cat : {selectedCat}
                    <button onClick={() => handleCategoryFilterChange('Tous')} className="hover:text-red-600 font-black cursor-pointer">×</button>
                  </span>
                )}
                {selectedSubCat !== 'Tous' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                    Sous-cat : {selectedSubCat}
                    <button onClick={() => setSelectedSubCat('Tous')} className="hover:text-red-600 font-black cursor-pointer">×</button>
                  </span>
                )}
                {search.trim() !== '' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800">
                    "{search}"
                    <button onClick={() => setSearch('')} className="hover:text-red-600 font-black cursor-pointer">×</button>
                  </span>
                )}
                <button
                  onClick={() => {
                    handleCategoryFilterChange('Tous');
                    setSelectedSubCat('Tous');
                    setSelectedSup('Tous');
                    setStockFilter('Tous');
                    setStatusFilter('Tous');
                    setSearch('');
                  }}
                  className="text-[10px] font-bold text-red-600 hover:underline ml-1 cursor-pointer"
                >
                  Réinitialiser
                </button>
              </div>
            )}
          </div>

          <div className="text-[11px] font-bold text-gray-500">
            {filteredProducts.length} article{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Products list table */}
      <div className="bg-white rounded-2xl border border-[#c7c4d8]/40 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[#464555] text-[10px] uppercase tracking-wider font-bold">
              <tr className="border-b border-[#c7c4d8]/30">
                <th className="px-6 py-4">Visuel / Réf / Code-barres</th>
                <th className="px-6 py-4">Nom de l'Article</th>
                <th className="px-6 py-4">Catégorie / Marque</th>
                <th className="px-6 py-4">Fournisseur Principal</th>
                <th className="px-6 py-4 text-right">Tarif Achat / Vente</th>
                <th className="px-6 py-4 text-center">Qté en Stock</th>
                <th className="px-6 py-4 text-center">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((p) => {
                  const isLow = p.stock > 0 && p.stock < (p.minStock || 15);
                  const isOut = p.stock === 0;

                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-gray-100 hover:bg-indigo-50/10 transition-all ${
                        !p.isActive ? 'opacity-60 bg-gray-50/40' : ''
                      }`}
                    >
                      {/* Photo / SKU */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProd(p);
                              setViewModalTab('image');
                              setShowViewModal(true);
                            }}
                            className="relative group w-10 h-10 rounded-lg overflow-hidden border border-gray-200 shadow-sm shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3525cd] transition-all"
                            title={canManageImages ? "Gérer l'image du produit (Ajouter/Modifier/Supprimer)" : "Consulter l'image du produit"}
                          >
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
                              <span className="material-symbols-outlined text-white text-[16px] select-none">
                                {canManageImages ? 'photo_camera' : 'zoom_in'}
                              </span>
                            </div>
                          </button>
                          <div>
                            <span className="font-mono text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md block w-fit">
                              {p.sku}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                              {p.barcode}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900 block max-w-[200px] truncate">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                          {p.description || "Aucune description de l'article."}
                        </span>
                      </td>

                      {/* Classification */}
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-800 block">{p.category}</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          Marque : {p.brand || 'SmartStock'}
                        </span>
                      </td>

                      {/* Supplier */}
                      <td className="px-6 py-4">
                        <span className="text-gray-700 font-semibold">{p.supplierName}</span>
                      </td>

                      {/* Prices */}
                      <td className="px-6 py-4 text-right">
                        <div className="font-semibold text-gray-500 text-[10px]">
                          PA: {(p.purchasePrice || Math.round(p.price * 0.65)).toLocaleString('fr-FR')} F
                        </div>
                        <div className="font-bold text-gray-900 text-xs mt-0.5">
                          PV: {p.price.toLocaleString('fr-FR')} F
                        </div>
                      </td>

                      {/* Stock Level */}
                      <td className="px-6 py-4 text-center">
                        <div className={`font-extrabold text-sm ${isOut ? 'text-[#ba1a1a]' : isLow ? 'text-amber-600' : 'text-gray-900'}`}>
                          {p.stock}
                        </div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block">
                          Min: {p.minStock || 15}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        {isOut ? (
                          <span className="px-2 py-0.5 bg-red-50 text-[#ba1a1a] text-[9px] font-extrabold rounded-full uppercase tracking-wider">
                            Rupture
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-extrabold rounded-full uppercase tracking-wider">
                            Faible
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-extrabold rounded-full uppercase tracking-wider">
                            Normal
                          </span>
                        )}
                        {!p.isActive && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-extrabold rounded-full uppercase tracking-wider block mt-1 w-fit mx-auto">
                            Désactivé
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedProd(p);
                              setViewModalTab('details');
                              setShowViewModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-[#3525cd] hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Consulter"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProd(p);
                              setShowHistoryModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="Mouvements"
                          >
                            <span className="material-symbols-outlined text-[18px]">history</span>
                          </button>
                          <button
                            onClick={() => toggleProductActive(p)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              p.isActive ? 'text-emerald-500 hover:text-[#ba1a1a] hover:bg-red-50' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={p.isActive ? 'Désactiver' : 'Réactiver'}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {p.isActive ? 'toggle_on' : 'toggle_off'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-xs text-gray-400">
                    Aucun produit trouvé correspondant aux critères de filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-[#c7c4d8]/20 flex justify-between items-center text-xs">
            <span className="text-gray-500">
              Page <strong>{currentPage}</strong> sur <strong>{totalPages}</strong> ({filteredProducts.length} articles)
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-bold hover:bg-gray-100 disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-bold hover:bg-gray-100 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal (Scanner integrated) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 shadow-2xl relative border border-gray-100 animate-in zoom-in-95 duration-150 my-8">
            <button
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">Ajouter / Gérer des Produits</h3>
                <p className="text-xs text-gray-400">
                  {useScannerMode 
                    ? "Gérez votre stock et créez vos fiches produits instantanément avec votre pistolet code-barres." 
                    : "Saisie multisection pour création manuelle de fiches articles."}
                </p>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => {
                    setUseScannerMode(true);
                    resetForm();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    useScannerMode ? 'bg-[#3525cd] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">barcode_scanner</span>
                  Mode Scanner ⚡
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUseScannerMode(false);
                    resetForm();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    !useScannerMode ? 'bg-[#3525cd] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">edit_note</span>
                  Saisie Standard
                </button>
              </div>
            </div>

            {successNotification && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                {successNotification}
              </div>
            )}

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-[#ba1a1a] text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <span className="material-symbols-outlined text-sm">error</span>
                {formError}
              </div>
            )}

            {useScannerMode ? (
              // --- MODE SCANNER ---
              <div>
                {scanState === 'scan_or_search' && (
                  <div className="space-y-6 py-4 animate-in fade-in duration-200">
                    <div className="flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-[#c7c4d8]/60">
                      <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-[#3525cd] mb-4 animate-pulse">
                        <span className="material-symbols-outlined text-4xl">barcode_scanner</span>
                      </div>
                      <h4 className="text-sm font-extrabold text-gray-900">En attente du scan...</h4>
                      <p className="text-xs text-gray-400 mt-1 max-w-xs leading-snug">
                        Positionnez votre curseur ci-dessous et scannez le code-barres de l'article avec votre pistolet.
                      </p>
                    </div>

                    <form onSubmit={handleBarcodeSubmit} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                          Code-barres de l'article
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                            search
                          </span>
                          <input
                            ref={barcodeInputRef}
                            type="text"
                            required
                            placeholder="Scannez ou saisissez manuellement..."
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            className="w-full pl-10 pr-24 py-3 border-2 border-indigo-100 rounded-xl text-sm font-bold focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                          />
                          <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#3525cd] text-white font-bold text-xs rounded-lg hover:bg-[#4f46e5] transition-all cursor-pointer"
                          >
                            Valider
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}

                {scanState === 'existing_product_actions' && (
                  <div className="space-y-6 py-2 animate-in fade-in duration-200">
                    <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-center gap-3">
                      <span className="material-symbols-outlined text-amber-600 text-2xl">warning</span>
                      <div>
                        <h4 className="text-xs font-bold text-amber-800">Code-barres déjà enregistré</h4>
                        <p className="text-[11px] text-amber-600">Ce produit existe déjà dans le référentiel de votre ERP.</p>
                      </div>
                    </div>

                    {selectedProd && (
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
                        <img
                          src={selectedProd.image}
                          alt={selectedProd.name}
                          className="w-16 h-16 object-cover rounded-xl border border-gray-200 bg-white"
                          referrerPolicy="no-referrer"
                        />
                        <div className="space-y-1 min-w-0 flex-1">
                          <span className="text-[9px] font-black text-[#3525cd] bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md font-mono">
                            {selectedProd.sku}
                          </span>
                          <h4 className="text-sm font-extrabold text-gray-900 truncate">{selectedProd.name}</h4>
                          <div className="flex gap-4 text-[11px] text-gray-500 font-medium">
                            <span>Catégorie: <strong>{selectedProd.category}</strong></span>
                            <span>Stock Actuel: <strong className={selectedProd.stock === 0 ? 'text-red-600' : 'text-gray-900'}>{selectedProd.stock} u</strong></span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="border-t border-slate-100 pt-4 space-y-4">
                      {/* Action A: Ajouter du Stock */}
                      <form onSubmit={handleAddStockFromScanner} className="bg-white p-4 rounded-xl border border-[#c7c4d8]/30 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-emerald-600 text-lg">add_circle</span>
                            Option 1 : Ajouter du Stock (Entrée rapide)
                          </span>
                        </div>
                        <div className="flex gap-3">
                          <input
                            ref={qtyInputRef}
                            type="number"
                            required
                            min="1"
                            placeholder="Quantité à ajouter..."
                            value={qtyToAdd || ''}
                            onChange={(e) => setQtyToAdd(Number(e.target.value))}
                            className="flex-1 px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                          >
                            Valider (+{qtyToAdd})
                          </button>
                        </div>
                      </form>

                      {/* Action B & C: Modifier ou Annuler */}
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedProd) {
                              const p = selectedProd;
                              setShowAddModal(false);
                              openEditModal(p);
                            }
                          }}
                          className="flex-1 py-2.5 bg-indigo-50 text-[#3525cd] hover:bg-indigo-100 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                          Modifier le Produit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setScanState('scan_or_search');
                            setBarcodeInput('');
                            setTimeout(() => {
                              barcodeInputRef.current?.focus();
                            }, 100);
                          }}
                          className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          Annuler / Scan Suivant
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {scanState === 'new_product_form' && (
                  <form onSubmit={handleCreateProductQuick} className="space-y-4 py-2 animate-in fade-in duration-200">
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#3525cd] text-xl">add_circle</span>
                      <div>
                        <h4 className="text-xs font-bold text-indigo-800">Nouveau code-barres détecté !</h4>
                        <p className="text-[11px] text-[#3525cd]">Saisie rapide d'une nouvelle fiche article pour : <span className="font-mono font-bold">{newBarcode}</span></p>
                      </div>
                    </div>

                    {/* 1. Nom du Produit */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase">Nom du Produit *</label>
                      <input
                        ref={nameInputRef}
                        type="text"
                        required
                        placeholder="Saisissez le nom du produit..."
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                      />
                    </div>

                    {/* 2. Catégorie, Sous-catégorie & SKU */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-600 uppercase">Catégorie *</label>
                        <select
                          value={newCategory}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-[#3525cd] font-semibold text-gray-800"
                        >
                          {categories.map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-600 uppercase">Sous-catégorie</label>
                        {currentSubcategories.length > 0 ? (
                          <select
                            value={newSubCat}
                            onChange={(e) => setNewSubCat(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-[#3525cd] text-gray-800"
                          >
                            {currentSubcategories.map((sub) => (
                              <option key={sub} value={sub}>
                                {sub}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="Général"
                            value={newSubCat}
                            onChange={(e) => setNewSubCat(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                          />
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-600 uppercase">Code SKU *</label>
                        <input
                          type="text"
                          required
                          value={newSku}
                          onChange={(e) => setNewSku(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs uppercase focus:outline-none focus:border-[#3525cd]"
                        />
                      </div>
                    </div>

                    {/* 3. Prix Achat & Vente */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-600 uppercase">Prix d'Achat (Unitaire FCFA) *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="ex. 45000"
                          value={newPurchasePrice || ''}
                          onChange={(e) => setNewPurchasePrice(Number(e.target.value))}
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-600 uppercase">Prix de Vente (Unitaire FCFA) *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="ex. 75000"
                          value={newSalePrice || ''}
                          onChange={(e) => setNewSalePrice(Number(e.target.value))}
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                        />
                      </div>
                    </div>

                    {/* 4. Stock initial & Seuil min */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-600 uppercase">Stock Initial *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          placeholder="ex. 100"
                          value={newInitialStock}
                          onChange={(e) => setNewInitialStock(Number(e.target.value))}
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-600 uppercase">Stock Minimum (Alerte) *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          placeholder="ex. 10"
                          value={newMinStock}
                          onChange={(e) => setNewMinStock(Number(e.target.value))}
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                        />
                      </div>
                    </div>

                    {/* Actions buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => {
                          setScanState('scan_or_search');
                          setBarcodeInput('');
                          setTimeout(() => {
                            barcodeInputRef.current?.focus();
                          }, 100);
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 cursor-pointer"
                      >
                        Retour au scan
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#3525cd] text-white rounded-xl text-xs font-bold hover:bg-[#4f46e5] cursor-pointer"
                      >
                        Enregistrer le Produit ⚡
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              // --- MODE SAISIE STANDARD (Existing Multi-step form) ---
              <form onSubmit={handleCreateProduct} className="space-y-4">
                {/* Stepper indicator */}
                <div className="flex justify-between items-center mb-6 px-2">
                  {[
                    { step: 1, label: 'Général' },
                    { step: 2, label: 'Détails' },
                    { step: 3, label: 'Financier' },
                    { step: 4, label: 'Stock & Seuils' },
                  ].map((s) => (
                    <div key={s.step} className="flex items-center gap-1.5">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                          formStep === s.step
                            ? 'bg-[#3525cd] text-white ring-4 ring-indigo-100'
                            : formStep > s.step
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {formStep > s.step ? <span className="material-symbols-outlined text-[14px]">check</span> : s.step}
                      </span>
                      <span className={`text-[10px] font-bold ${formStep === s.step ? 'text-[#3525cd]' : 'text-gray-400'}`}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Step 1: Informations Générales */}
                {formStep === 1 && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase">Nom du Produit *</label>
                      <input
                        id="standard-product-name"
                        type="text"
                        required
                        placeholder="ex. Hub Centralisé Multi-Connecté"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                      />
                    </div>
                    {/* Catégorie ERP & Sous-catégorie (Visible dès l'étape 1) */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-600 uppercase">Catégorie ERP *</label>
                        <select
                          value={newCategory}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50 font-semibold text-gray-800"
                        >
                          {categories.map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-600 uppercase">Sous-catégorie</label>
                        {currentSubcategories.length > 0 ? (
                          <select
                            value={newSubCat}
                            onChange={(e) => setNewSubCat(e.target.value)}
                            className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50 text-gray-800"
                          >
                            {currentSubcategories.map((sub) => (
                              <option key={sub} value={sub}>
                                {sub}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="ex. Romans, Cahiers, Stylos..."
                            value={newSubCat}
                            onChange={(e) => setNewSubCat(e.target.value)}
                            className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                          />
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-600 uppercase">Code SKU (Réf Interne) *</label>
                        <input
                          type="text"
                          required
                          placeholder="ex. SKU-902"
                          value={newSku}
                          onChange={(e) => setNewSku(e.target.value)}
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs uppercase focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-600 uppercase">Code-barres (EAN13)</label>
                        <input
                          type="text"
                          placeholder="ex. 370001200902"
                          value={newBarcode}
                          onChange={(e) => setNewBarcode(e.target.value)}
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase">Description</label>
                      <textarea
                        placeholder="Description détaillée de l'article pour les bons logistiques..."
                        rows={2}
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                      ></textarea>
                    </div>
                  </div>
                )}

                {/* Step 2: Classification */}
                {formStep === 2 && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-600 uppercase">Catégorie ERP *</label>
                        <select
                          value={newCategory}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50 font-semibold text-gray-800"
                        >
                          {categories.map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-600 uppercase">Sous-catégorie</label>
                        {currentSubcategories.length > 0 ? (
                          <select
                            value={newSubCat}
                            onChange={(e) => setNewSubCat(e.target.value)}
                            className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50 text-gray-800"
                          >
                            {currentSubcategories.map((sub) => (
                              <option key={sub} value={sub}>
                                {sub}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="ex. Romans, Cahiers, Stylos..."
                            value={newSubCat}
                            onChange={(e) => setNewSubCat(e.target.value)}
                            className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                          />
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-600 uppercase">Marque de l'Article</label>
                        <input
                          type="text"
                          placeholder="ex. NexusTech"
                          value={newBrand}
                          onChange={(e) => setNewBrand(e.target.value)}
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-600 uppercase">Fournisseur Attitré</label>
                        <select
                          value={newSupplier}
                          onChange={(e) => setNewSupplier(e.target.value)}
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                        >
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Financier */}
                {formStep === 3 && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-600 uppercase">Prix d'Achat (Unitaire FCFA) *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="ex. 45000"
                          value={newPurchasePrice || ''}
                          onChange={(e) => {
                            setNewPurchasePrice(Number(e.target.value));
                            setFormError('');
                          }}
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-600 uppercase">Prix de Vente (Unitaire FCFA) *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="ex. 75000"
                          value={newSalePrice || ''}
                          onChange={(e) => {
                            setNewSalePrice(Number(e.target.value));
                            setFormError('');
                          }}
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                        />
                      </div>
                    </div>
                    <div className="p-3.5 bg-gray-50 rounded-xl">
                      <h5 className="text-[11px] font-bold text-gray-700 uppercase mb-1">Marge Estimée :</h5>
                      <div className="flex justify-between text-xs">
                        <span>Différence Brute :</span>
                        <span className="font-bold text-emerald-600">
                          {Math.max(0, newSalePrice - newPurchasePrice).toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span>Taux de Marge :</span>
                        <span className="font-bold text-emerald-600">
                          {newSalePrice > 0 ? Math.round(((newSalePrice - newPurchasePrice) / newSalePrice) * 100) : 0} %
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Stock & Médias */}
                {formStep === 4 && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-600 uppercase">Quantité Initiale *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          placeholder="ex. 100"
                          value={newInitialStock}
                          onChange={(e) => setNewInitialStock(Number(e.target.value))}
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-600 uppercase">Stock Min (Alerte) *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="ex. 10"
                          value={newMinStock}
                          onChange={(e) => setNewMinStock(Number(e.target.value))}
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-600 uppercase">Stock Maximum *</label>
                        <input
                          type="number"
                          required
                          min="10"
                          placeholder="ex. 1000"
                          value={newMaxStock}
                          onChange={(e) => setNewMaxStock(Number(e.target.value))}
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd] focus:ring-4 focus:ring-indigo-50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation button panel */}
                <div className="flex justify-between pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    disabled={formStep === 1}
                    onClick={() => {
                      setFormStep((s) => s - 1);
                      setFormError('');
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-gray-200"
                  >
                    Précédent
                  </button>

                  {formStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (formStep === 1 && (!newName || !newSku)) {
                          setFormError('Le nom et la référence interne (SKU) sont requis.');
                          return;
                        }
                        if (formStep === 3 && (newPurchasePrice <= 0 || newSalePrice <= 0)) {
                          setFormError("Les prix d'achat et de vente doivent être supérieurs à 0.");
                          return;
                        }
                        setFormStep((s) => s + 1);
                        setFormError('');
                      }}
                      className="px-4 py-2 bg-[#3525cd] text-white rounded-xl text-xs font-bold hover:bg-[#4f46e5]"
                    >
                      Suivant
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#3525cd] text-white rounded-xl text-xs font-bold hover:bg-[#4f46e5]"
                    >
                      Valider et Enregistrer
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProd && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 shadow-2xl relative border border-gray-100 animate-in zoom-in-95 duration-150 my-8">
            <button
              onClick={() => {
                setShowEditModal(false);
                resetForm();
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-lg font-extrabold text-gray-900 mb-2">Modifier l'Article</h3>
            <p className="text-xs text-gray-500 mb-6">Mise à jour des informations de {selectedProd.name}</p>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-[#ba1a1a] text-xs font-bold rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {formError}
              </div>
            )}

            <form onSubmit={handleEditProduct} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-600 uppercase">Nom du Produit *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Réf Interne SKU *</label>
                  <input
                    type="text"
                    required
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs uppercase focus:outline-none focus:border-[#3525cd]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Code-barres</label>
                  <input
                    type="text"
                    value={newBarcode}
                    onChange={(e) => setNewBarcode(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Catégorie *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-[#3525cd] font-semibold text-gray-800"
                  >
                    {categories.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Sous-catégorie</label>
                  {currentSubcategories.length > 0 ? (
                    <select
                      value={newSubCat}
                      onChange={(e) => setNewSubCat(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-[#3525cd] text-gray-800"
                    >
                      {currentSubcategories.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={newSubCat}
                      onChange={(e) => setNewSubCat(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Marque</label>
                  <input
                    type="text"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Fournisseur Principal</label>
                  <select
                    value={newSupplier}
                    onChange={(e) => setNewSupplier(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-[#3525cd]"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Prix d'Achat (FCFA) *</label>
                  <input
                    type="number"
                    required
                    value={newPurchasePrice}
                    onChange={(e) => setNewPurchasePrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Prix de Vente (FCFA) *</label>
                  <input
                    type="number"
                    required
                    value={newSalePrice}
                    onChange={(e) => setNewSalePrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Stock Minimum (Alerte) *</label>
                  <input
                    type="number"
                    required
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Stock Maximum *</label>
                  <input
                    type="number"
                    required
                    value={newMaxStock}
                    onChange={(e) => setNewMaxStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-600 uppercase">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#3525cd] text-white rounded-xl text-xs font-bold hover:bg-[#4f46e5]"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Product Details Modal */}
      {showViewModal && selectedProd && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 shadow-2xl relative border border-gray-100 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <button
              onClick={() => {
                setShowViewModal(false);
                setSelectedProd(null);
                setViewModalTab('details');
                handleUploadCancel();
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer z-10"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {/* Modal Header */}
            <div className="text-center pb-3 border-b border-gray-100 shrink-0">
              <span className="font-mono text-[10px] font-extrabold text-[#3525cd] bg-indigo-50 px-2.5 py-1 rounded-full inline-block">
                {selectedProd.sku}
              </span>
              <h4 className="text-lg font-bold text-gray-900 mt-2">{selectedProd.name}</h4>
              <p className="text-xs text-gray-400 font-semibold mt-0.5">{selectedProd.category} • {selectedProd.brand || 'SmartStock'}</p>
            </div>

            {/* Tab Selector */}
            <div className="flex border-b border-gray-100 mb-4 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setViewModalTab('details');
                  handleUploadCancel();
                }}
                className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  viewModalTab === 'details'
                    ? 'border-[#3525cd] text-[#3525cd]'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">info</span>
                Fiche Technique
              </button>
              <button
                type="button"
                onClick={() => setViewModalTab('image')}
                className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  viewModalTab === 'image'
                    ? 'border-[#3525cd] text-[#3525cd]'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">image</span>
                Image du Produit 📷
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto pr-1 py-2 custom-scrollbar">
              {viewModalTab === 'details' ? (
                <div className="space-y-4">
                  <div className="flex justify-center pb-2">
                    <img
                      src={selectedProd.image}
                      alt={selectedProd.name}
                      className="w-24 h-24 object-cover rounded-2xl border-2 border-indigo-100 shadow-md"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Code-barres :</span>
                      <span className="font-mono font-bold text-gray-900">{selectedProd.barcode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Sous-catégorie :</span>
                      <span className="font-bold text-gray-900">{selectedProd.subCategory || 'Non classé'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Fournisseur :</span>
                      <span className="font-bold text-gray-900">{selectedProd.supplierName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Prix de revient (Achat) :</span>
                      <span className="font-bold text-gray-900">
                        {(selectedProd.purchasePrice || Math.round(selectedProd.price * 0.65)).toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Tarif de vente public :</span>
                      <span className="font-bold text-[#3525cd]">{selectedProd.price.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Marge Brute :</span>
                      <span className="font-bold text-emerald-600">
                        {(selectedProd.price - (selectedProd.purchasePrice || Math.round(selectedProd.price * 0.65))).toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Seuil de stock bas :</span>
                      <span className="font-bold text-amber-600">{selectedProd.minStock || 15} unités</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-100 pt-3">
                      <span className="text-gray-500 font-medium">Description :</span>
                      <p className="text-[11px] text-gray-600 text-right max-w-[280px] leading-snug">
                        {selectedProd.description || 'Pas de description.'}
                      </p>
                    </div>
                  </div>

                  {/* Barcode representation */}
                  <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center border border-gray-100">
                    <div className="flex gap-0.5 h-10 items-stretch">
                      {[1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 4, 1, 2, 1, 3].map((w, i) => (
                        <div key={i} className={`bg-gray-900 ${i % 2 === 0 ? 'opacity-100' : 'opacity-0'}`} style={{ width: `${w * 1.5}px` }}></div>
                      ))}
                    </div>
                    <span className="font-mono text-[9px] text-gray-500 mt-2 font-extrabold uppercase tracking-widest">{selectedProd.barcode}</span>
                  </div>
                </div>
              ) : (
                /* Espace Gestion Image du Produit */
                <div className="space-y-4">
                  {/* Security Notification if read-only */}
                  {!canManageImages && (
                    <div className="bg-amber-50 border border-amber-100 text-amber-800 p-2.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 justify-center">
                      <span className="material-symbols-outlined text-sm">lock</span>
                      Mode consultation (Directeur) — Vous n'avez pas les droits requis pour modifier les images.
                    </div>
                  )}

                  {/* Display Errors if any */}
                  {uploadError && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">error</span>
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {/* If NO active file is being processed or previewed */}
                  {!selectedFile && (
                    <div className="space-y-4 text-center">
                      <div className="relative group max-w-xs mx-auto">
                        <img
                          src={selectedProd.image}
                          alt={selectedProd.name}
                          className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-2xl mx-auto border-2 border-indigo-100 shadow-md transition-all group-hover:brightness-95"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        
                        {/* Enlarged image button overlay */}
                        <button
                          type="button"
                          onClick={() => setIsEnlarged(true)}
                          className="absolute bottom-3 right-1/2 translate-x-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full flex items-center justify-center cursor-pointer shadow-lg backdrop-blur-xs transition-all opacity-90 hover:scale-105"
                          title="Agrandir l'image"
                        >
                          <span className="material-symbols-outlined text-sm">zoom_in</span>
                          <span className="text-[10px] font-bold ml-1 pr-1">Agrandir</span>
                        </button>
                      </div>

                      {/* Display image metadata path / cache status */}
                      <div className="flex flex-col items-center text-[10px] text-gray-400 font-semibold space-y-1">
                        {selectedProd.image_path ? (
                          <>
                            <div className="flex items-center gap-1 text-emerald-600 font-extrabold bg-emerald-50 px-2.5 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Stocké dans Supabase Storage (Optimisé WEBP)
                            </div>
                            <span className="font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{selectedProd.image_path}</span>
                            {selectedProd.updated_at && (
                              <span className="text-[9px]">Mis à jour le : {new Date(selectedProd.updated_at).toLocaleString('fr-FR')}</span>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-400 font-extrabold bg-gray-100 px-2.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                            Image système par défaut
                          </div>
                        )}
                      </div>

                      {/* Image Management Actions (Only if user has permissions) */}
                      {canManageImages && (
                        <div className="flex items-center justify-center gap-3 pt-1">
                          <label className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#3525cd] font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs border border-indigo-100">
                            <span className="material-symbols-outlined text-sm">sync</span>
                            {selectedProd.image_path ? 'Remplacer' : 'Ajouter une image'}
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.webp"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleFileSelected(e.target.files[0]);
                                }
                              }}
                            />
                          </label>

                          {selectedProd.image_path && (
                            <button
                              type="button"
                              onClick={handleDeleteImage}
                              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs border border-rose-100"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                              Supprimer
                            </button>
                          )}
                        </div>
                      )}

                      {/* Drag & Drop Area if permission allowed */}
                      {canManageImages && (
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all mt-4 ${
                            isDragging
                              ? 'border-[#3525cd] bg-indigo-50/40 text-[#3525cd]'
                              : 'border-gray-200 hover:border-indigo-300 text-gray-400 bg-gray-50/30'
                          }`}
                        >
                          <span className="material-symbols-outlined text-2xl mb-1.5">cloud_upload</span>
                          <p className="text-[11px] font-bold text-gray-600">Glissez-déposer une nouvelle image ici</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">Formats autorisés : JPG, JPEG, PNG, WEBP (Max 5 Mo)</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Processing / Resizing state spinner */}
                  {isProcessing && (
                    <div className="flex flex-col items-center justify-center py-10 space-y-3">
                      <div className="w-10 h-10 border-4 border-indigo-100 border-t-[#3525cd] rounded-full animate-spin"></div>
                      <p className="text-xs font-bold text-[#3525cd]">Optimisation intelligente de l'image...</p>
                      <p className="text-[10px] text-gray-400 text-center max-w-xs">
                        Correction d'orientation EXIF, nettoyage des métadonnées, redimensionnement à 1024px et conversion au format WEBP haute fidélité.
                      </p>
                    </div>
                  )}

                  {/* Optimized image preview card before upload */}
                  {selectedFile && optimizedImage && !isProcessing && (
                    <div className="bg-indigo-50/30 border border-indigo-100 p-4 rounded-2xl space-y-4 animate-in fade-in duration-200">
                      <div className="text-center font-extrabold text-[10px] text-[#3525cd] uppercase tracking-wider flex items-center justify-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3525cd] animate-pulse"></span>
                        Aperçu de l'image optimisée (WEBP)
                      </div>

                      <div className="flex flex-col md:flex-row items-center gap-4">
                        <img
                          src={optimizedImage.url}
                          alt="Optimized Preview"
                          className="w-32 h-32 object-cover rounded-xl border border-indigo-100 shadow-sm bg-white shrink-0"
                        />

                        {/* Compression Metrics comparison */}
                        <div className="flex-1 w-full space-y-2 text-[11px]">
                          <div className="flex justify-between border-b border-indigo-50/60 pb-1">
                            <span className="text-gray-500 font-medium">Résolution finale :</span>
                            <span className="font-bold font-mono text-gray-800">{optimizedImage.width} × {optimizedImage.height} px</span>
                          </div>
                          <div className="flex justify-between border-b border-indigo-50/60 pb-1">
                            <span className="text-gray-500 font-medium">Format converti :</span>
                            <span className="font-bold text-indigo-700 font-mono">{optimizedImage.format}</span>
                          </div>
                          <div className="flex justify-between border-b border-indigo-50/60 pb-1">
                            <span className="text-gray-500 font-medium">Taille d'origine :</span>
                            <span className="font-semibold text-gray-500 font-mono">{(optimizedImage.originalSize / (1024 * 1024)).toFixed(2)} Mo</span>
                          </div>
                          <div className="flex justify-between border-b border-indigo-50/60 pb-1">
                            <span className="text-gray-500 font-medium">Poids optimisé :</span>
                            <span className="font-bold text-emerald-600 font-mono">{(optimizedImage.size / 1024).toFixed(1)} Ko</span>
                          </div>
                          <div className="flex justify-between pt-0.5">
                            <span className="text-gray-500 font-medium">Taux d'économie :</span>
                            <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[9px] font-mono">
                              -{Math.max(0, Math.round((1 - optimizedImage.size / optimizedImage.originalSize) * 100))}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Upload confirmation buttons */}
                      {!isUploading ? (
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={handleUploadConfirm}
                            className="flex-1 py-2 bg-[#3525cd] hover:bg-[#4f46e5] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">cloud_upload</span>
                            Confirmer & Téléverser
                          </button>
                          <label className="flex-1 py-2 bg-white hover:bg-gray-50 text-gray-600 font-bold text-xs rounded-xl border border-gray-200 transition-all cursor-pointer text-center block">
                            Autre image
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.webp"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleFileSelected(e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={handleUploadCancel}
                            className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold text-xs rounded-xl transition-all cursor-pointer"
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        /* Televersement progress bar */
                        <div className="space-y-2 pt-2">
                          <div className="flex justify-between text-[11px] font-bold text-[#3525cd]">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#3525cd] animate-ping"></span>
                              Envoi vers Supabase Storage...
                            </span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#3525cd] transition-all duration-100" style={{ width: `${uploadProgress}%` }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feed containing image history / audits logs specifically for this product */}
                  <div className="border-t border-gray-100 pt-4 mt-2">
                    <h5 className="text-[11px] font-extrabold text-gray-800 uppercase tracking-wider mb-2.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">history</span>
                      Journal d'audit de l'image (Supabase)
                    </h5>

                    <div className="max-h-28 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-[10px]">
                      {imageAuditLogs.filter(l => l.productId === selectedProd.id).length > 0 ? (
                        imageAuditLogs.filter(l => l.productId === selectedProd.id).map((log) => (
                          <div key={log.id} className="p-2 bg-gray-50 rounded-lg flex justify-between items-start border border-gray-100 animate-fade-in">
                            <div>
                              <div className="font-bold text-gray-800">{log.action}</div>
                              <div className="text-gray-500 text-[9px] mt-0.5">Par : {log.user}</div>
                            </div>
                            <span className="text-[9px] text-gray-400 font-semibold">{log.timestamp}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-400 font-semibold text-[10px]">
                          Aucun mouvement enregistré pour l'image de ce produit.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Enlarged Image Modal popup */}
      {isEnlarged && selectedProd && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[99] p-4 animate-fade-in">
          <button
            onClick={() => setIsEnlarged(false)}
            className="absolute top-5 right-5 text-white/70 hover:text-white cursor-pointer bg-white/10 hover:bg-white/20 p-2 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-lg"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          
          <div className="text-center space-y-4 max-w-3xl w-full">
            <img
              src={selectedProd.image}
              alt={selectedProd.name}
              className="max-h-[80vh] max-w-full object-contain rounded-2xl mx-auto shadow-2xl border border-white/10"
              referrerPolicy="no-referrer"
            />
            <div>
              <p className="text-white text-sm font-bold font-sans">{selectedProd.name}</p>
              <p className="text-gray-400 text-xs font-mono mt-1 uppercase tracking-wider">{selectedProd.sku} • {selectedProd.category}</p>
            </div>
          </div>
        </div>
      )}

      {/* History Modal for specific Product */}
      {showHistoryModal && selectedProd && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl relative border border-gray-100 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setShowHistoryModal(false);
                setSelectedProd(null);
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h4 className="text-base font-extrabold text-gray-900 mb-1">Historique des Mouvements</h4>
            <p className="text-xs text-gray-500 mb-6">Traces d'audit pour : <span className="font-bold text-gray-800">{selectedProd.name}</span></p>

            <div className="max-h-72 overflow-y-auto space-y-3 pr-2">
              {productMovements.length > 0 ? (
                productMovements.map((mov) => (
                  <div key={mov.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className={mov.type === 'Entrée' ? 'text-emerald-600' : mov.type === 'Sortie' ? 'text-sky-500' : 'text-amber-600'}>
                        {mov.type} {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                      </span>
                      <span className="text-gray-400 text-[10px]">{mov.date} • {mov.hour}</span>
                    </div>
                    <p className="text-gray-600 leading-snug">{mov.observation}</p>
                    <div className="text-[10px] text-gray-400 font-medium">Validateur : {mov.user}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-gray-400">
                  Aucun mouvement de stock enregistré pour cet article.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
