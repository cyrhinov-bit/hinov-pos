import express from 'express';
import cors from 'cors';
import { db, initDB } from './db';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialiser SQLite
initDB();

// -- Routes --

// 1. Récupérer tous les produits (et leur stock)
app.get('/api/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products').all();
  res.json(products);
});

// 2. Valider une vente (Réduire le stock)
app.post('/api/checkout', (req, res) => {
  const { cart, total } = req.body;
  
  if (!cart || !Array.isArray(cart)) {
    return res.status(400).json({ error: 'Panier invalide' });
  }

  const reduceStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
  const recordSale = db.prepare('INSERT INTO sales (id, total, date, items) VALUES (?, ?, ?, ?)');

  try {
    const processTransaction = db.transaction((items) => {
      // 1. Diminuer le stock
      for (const item of items) {
        reduceStock.run(item.quantity, item.id);
      }
      
      // 2. Enregistrer la vente (Historique simple)
      const saleId = `SALE-${Date.now()}`;
      recordSale.run(saleId, total, new Date().toISOString(), JSON.stringify(items));
    });

    processTransaction(cart);
    res.json({ success: true, message: 'Stock mis à jour avec succès' });
  } catch (error: any) {
    console.error('Erreur lors du checkout:', error);
    res.status(500).json({ error: 'Erreur de transaction base de données', details: error.message });
  }
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`✅ Backend Central (API) démarré sur http://localhost:${port}`);
  console.log(`📦 Base de données SQLite prête.`);
});
