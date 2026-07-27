import Database from 'better-sqlite3';
import path from 'path';

// Utiliser un fichier local dans le dossier apps/api
const dbPath = path.resolve(__dirname, '../../pos_database.db');
export const db = new Database(dbPath, { verbose: console.log });

// Initialisation de la base de données
export const initDB = () => {
  // Table des produits
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      category TEXT NOT NULL,
      image TEXT,
      stock INTEGER NOT NULL,
      sku TEXT
    )
  `);

  // Table de l'historique des ventes
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      total INTEGER NOT NULL,
      date TEXT NOT NULL,
      items TEXT NOT NULL
    )
  `);

  // Peupler avec quelques produits initiaux si la table est vide
  const count = db.prepare("SELECT count(*) as count FROM products").get() as { count: number };
  
  if (count.count === 0) {
    const insert = db.prepare('INSERT INTO products (id, name, price, category, image, stock, sku) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const MOCK_PRODUCTS = [
      { id: '1', name: 'Câble USB-C Rapide', price: 5000, category: 'Accessoires', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=400&q=80', stock: 50, sku: 'ACC-001' },
      { id: '2', name: 'Coque Silicone iPhone 13', price: 2500, category: 'Accessoires', image: 'https://images.unsplash.com/photo-1603313011101-320f26a4f6f6?auto=format&fit=crop&w=400&q=80', stock: 120, sku: 'ACC-002' },
      { id: '3', name: 'Écouteurs Sans Fil', price: 15000, category: 'Audio', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=400&q=80', stock: 30, sku: 'AUD-001' },
      { id: '4', name: 'Batterie Externe 10000mAh', price: 12000, category: 'Accessoires', image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=400&q=80', stock: 15, sku: 'ACC-004' }
    ];

    const insertMany = db.transaction((products) => {
      for (const p of products) {
        insert.run(p.id, p.name, p.price, p.category, p.image, p.stock, p.sku);
      }
    });

    insertMany(MOCK_PRODUCTS);
    console.log("Catalogue initial inséré en base de données !");
  }
};
