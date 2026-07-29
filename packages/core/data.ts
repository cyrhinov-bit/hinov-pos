/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Director, GovernanceLog, Product, Transaction, StockArrival, User } from './types';

// Image de connexion et profils de l'application
export const LOGIN_BG_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdyr1abw6RtNQI2HtN1lu893gBGhm3IV8oLn_rfsLPIRMTd6DxPhyy01wH_hP34ivPu8ANo4mrkgBDvx9lSq9tG_bHH-vT3uOP7Mh08O5x7s-vplvHDofZ3lvXafq0GrBRRFWNS4xzeK6kFuRtqraWkKAw98EtXO8s7exOrDUtLGOP0PUFkh2ero4JayDhzn4POKfAwYIlZplPv7Ebi8B61PK8jnUjFvgs_-Na3FJtSKgJD77q3buP5HavRmMCmlCUCNeKEVVoZBc';

export const PROFILES: Record<string, User> = {
  admin: {
    name: 'Gnonskan Evariste',
    role: 'Administrateur',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOdppZHu4vnd4ojMQyqe41O9EEITkldMUdMiFQ0r3goyuTa8poFopFgMTunWMrpvMuR1ZAdEcHE4VjQAqQ475CHkMlk0TW_M__zkJg6xgC7XUg2UzMheh7IqgCdSG_UTn4BhcPEapm0iU4x3Gvy1SqCl7XOwX0fUHCQpFWwL_4Sul8cdB9fUcFZ9yqHBLyqLBmEgI5APy7omq30bNPApKZHXur_9lAlCPZXCMwXzJuoZf6aPOjeRxbUPic6D4300pzcnUQ-rgZg94',
    branch: 'Siège Principal Hinov POS',
    email: 'e.gnonskan@hinovgroup.com',
    password: 'majorix90',
    password_hash: 'majorix90',
  }
};

// DONNÉES DE PRODUCTION INITIALES (VIDES / RÉELLES)
export const INITIAL_DIRECTORS: Director[] = [];
export const INITIAL_GOVERNANCE_LOGS: GovernanceLog[] = [];
export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_STOCK_ARRIVALS: StockArrival[] = [];

export const LIBRAIRIE_CATEGORIES = [
  { name: 'Papeterie', icon: '📄', description: 'Cahiers, blocs, registres et papier.', image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&auto=format&fit=crop&q=60', subcategories: ['Cahiers', 'Papier A4', 'Enveloppes'] },
  { name: 'Écriture & Correcteurs', icon: '✏️', description: 'Stylos, feutres, crayons, surligneurs.', image: 'https://images.unsplash.com/photo-1585336261026-8f578639b921?w=500&auto=format&fit=crop&q=60', subcategories: ['Stylos', 'Crayons', 'Surligneurs'] },
  { name: 'Informatique & Consommables', icon: '💻', description: 'Périphériques, clés USB, consommables.', image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&auto=format&fit=crop&q=60', subcategories: ['Clés USB', 'Souris', 'Accessoires'] },
  { name: 'Fournitures de Bureau', icon: '🖇️', description: 'Agrafeuses, ciseaux, colles, calculatrices.', image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60', subcategories: ['Agrafeuses', 'Calculatrices', 'Ciseaux'] }
];
