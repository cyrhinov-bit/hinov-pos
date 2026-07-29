import express from 'express';
import cors from 'cors';
import { supabase, supabaseAdmin, initDB, supabaseUrl, supabaseKey } from './db';
import { createClient } from '@supabase/supabase-js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Vérifier la connexion à Supabase
initDB();

// -- Routes --

// 1. Récupérer tous les produits (et leur stock avec mapping de colonnes)
app.get('/api/products', async (req, res) => {
  const { data, error } = await supabase.from('products').select('*');
  
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const mappedData = (data || []).map((p: any) => ({
    id: p.id,
    sku: p.sku || p.barcode || `SKU-${p.id}`,
    barcode: p.barcode,
    name: p.name,
    category: p.category || 'Général',
    price: Number(p.selling_price ?? p.price ?? 0),
    purchasePrice: Number(p.purchase_price ?? 0),
    stock: Number(p.stock ?? 0),
    image: p.image_path || p.image || 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&auto=format&fit=crop&q=60',
    isActive: p.is_active ?? true,
    updated_at: p.updated_at
  }));

  res.json(mappedData);
});

// 2. Valider une vente (Réduire le stock)
app.post('/api/checkout', async (req, res) => {
  const { cart, total, cashier_id, branch_id } = req.body;
  
  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: 'Panier invalide ou vide' });
  }

  try {
    // Décrémenter le stock pour chaque article dans Supabase
    for (const item of cart) {
      const productId = item.product?.id || item.id;
      const quantity = item.quantity || 1;
      if (productId) {
        const { data: prod } = await supabase.from('products').select('stock').eq('id', productId).single();
        if (prod) {
          const newStock = Math.max(0, prod.stock - quantity);
          await supabase.from('products').update({ stock: newStock, updated_at: new Date().toISOString() }).eq('id', productId);
        }
      }
    }

    res.json({ success: true, message: 'Vente enregistrée et stock mis à jour avec succès' });
  } catch (error: any) {
    console.error('Erreur lors du checkout:', error);
    res.status(500).json({ error: 'Erreur de transaction base de données', details: error.message });
  }
});

// 3. Récupérer les profils
app.get('/api/profiles', async (req, res) => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 4. Récupérer l'historique des ventes
app.get('/api/sales', async (req, res) => {
  const { data, error } = await supabase.from('sales').select('*, sale_items(*)').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 5. Récupérer les journaux de gouvernance
app.get('/api/governance_logs', async (req, res) => {
  const { data, error } = await supabase.from('governance_logs').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 6. Inviter un utilisateur
app.post('/api/invite-user', async (req, res) => {
  const { email, name, role } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Email et nom requis' });
  }

  try {
    // Envoyer l'email d'invitation
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
    if (authError) throw authError;

    // Créer ou mettre à jour le profil (utiliser un rôle valide par rapport au CHECK constraint)
    const validRole = role && ['Caissier', 'Directeur', 'Administrateur', 'Gestionnaire de Stock'].includes(role) ? role : 'Caissier';

    if (authData.user) {
      const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: authData.user.id,
        email: email,
        first_name: name,
        role: validRole,
        is_active: true
      });
      if (profileError) throw profileError;
    }

    res.json({ success: true, message: 'Invitation envoyée avec succès' });
  } catch (err: any) {
    console.error("Erreur lors de l'invitation :", err);
    res.status(500).json({ error: err.message });
  }
});

// 7. Définir le mot de passe
app.post('/api/set-password', async (req, res) => {
  const { password } = req.body;
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token d\'accès manquant' });
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    const { error } = await userClient.auth.updateUser({ password });
    if (error) throw error;
    
    res.json({ success: true, message: 'Mot de passe mis à jour' });
  } catch (err: any) {
    console.error("Erreur set-password :", err);
    res.status(500).json({ error: err.message });
  }
});

// 8. Connexion (Login)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  try {
    // Tenter de se connecter avec Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Récupérer le profil associé
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) throw profileError;

    res.json({ success: true, user: profile, session: data.session });
  } catch (err: any) {
    console.error("Erreur de connexion :", err);
    res.status(401).json({ error: err.message || 'Identifiants incorrects' });
  }
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`✅ Backend Central (API) démarré sur http://localhost:${port}`);
  console.log(`📦 Connecté à Supabase Postgres.`);
});
