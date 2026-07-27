import { Product } from '../../types';

export interface WarehouseCategory {
  name: string;
  image: string;
  description: string;
  active: boolean;
}

export interface WarehouseSupplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  active: boolean;
  productsProvided: number;
}

export interface StockMovement {
  id: string;
  date: string;
  hour: string;
  productSku: string;
  productName: string;
  type: 'Entrée' | 'Sortie' | 'Ajustement';
  quantity: number;
  user: string;
  observation: string;
}

export interface InventoryItem {
  sku: string;
  name: string;
  theoretical: number;
  counted: number;
  discrepancy: number;
}

export interface PhysicalInventory {
  id: string;
  date: string;
  createdBy: string;
  status: 'Clôturé' | 'En cours';
  totalProducts: number;
  totalTheoretical: number;
  totalCounted: number;
  totalDiscrepancy: number;
  items: InventoryItem[];
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
  date: string;
  status: 'Livré' | 'En attente';
  totalAmount: number;
  itemsCount: number;
  items: { sku: string; name: string; quantity: number }[];
}

export interface InventoryReport {
  id: string;
  date: string;
  title: string;
  manager: string;
  discrepanciesCount: number;
  itemsAudited: number;
  items: { sku: string; name: string; expected: number; measured: number; diff: number }[];
}

export interface EnrichedProduct extends Product {
  description?: string;
  brand?: string;
  subCategory?: string;
  purchasePrice?: number;
  minStock?: number;
  maxStock?: number;
  supplierName?: string;
  barcode?: string;
  isActive?: boolean;
}
