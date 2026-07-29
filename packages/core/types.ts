/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Screen =
  | 'performance'
  | 'warehouse'
  | 'governance'
  | 'pos'
  | 'director-dashboard'
  | 'director-finance'
  | 'director-users'
  | 'director-products'
  | 'director-stock'
  | 'director-sales'
  | 'director-analytics'
  | 'director-reports'
  | 'director-settings'
  | 'director-profile';

export interface User {
  id?: string;
  name: string;
  role: string;
  avatar: string;
  branch: string;
  email?: string;
  password?: string;
  password_hash?: string;
}

export interface Director {
  id: string;
  name: string;
  email: string;
  department: string;
  lastActivity: string;
  status: 'Actif' | 'Suspendu' | 'En révision';
  initials: string;
  bgColor: string;
}

export interface GovernanceLog {
  id: string;
  type: 'access' | 'error' | 'policy' | 'audit' | 'success';
  title: string;
  description: string;
  timestamp: string;
  code: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  subcategory?: string;
  subCategory?: string;
  price: number;
  purchasePrice?: number;
  stock: number;
  image: string;
  image_path?: string | null;
  updated_at?: string;
  velocity?: string;
  salesVolume?: number;
  trend?: string;
  isActive?: boolean;
}

export interface Transaction {
  id: string;
  asset: string;
  category: string;
  origin: string;
  destination: string;
  status: 'En transit' | 'Livré' | 'Retardé';
  value: number;
  date: string;
  paymentMethod?: 'espèces' | 'Mobile Money' | 'Carte bancaire';
  cashierName?: string;
  items?: { productId: string; name: string; quantity: number; price: number; purchasePrice: number; category: string }[];
  difference?: number; // cashier difference (écart de caisse)
}

export interface StockArrival {
  id: string;
  sku: string;
  supplier: string;
  quantity: string;
  location: string;
  status: 'VÉRIFIÉ' | 'INSPECTION' | 'TRAITEMENT';
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountType?: 'fixed' | 'percent';
  discountValue?: number;
}
