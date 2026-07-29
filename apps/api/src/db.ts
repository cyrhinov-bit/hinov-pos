import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

export const supabaseUrl = process.env.SUPABASE_URL || '';
export const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ ATTENTION : Les variables d'environnement SUPABASE_URL et SUPABASE_KEY sont manquantes.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : supabase;

// La fonction initDB vérifie simplement la connexion à présent
export const initDB = async () => {
  try {
    const { error } = await supabase.from('products').select('id').limit(1);
    if (error) {
      console.error("Erreur de connexion à Supabase :", error.message);
    } else {
      console.log("✅ Connecté avec succès à Supabase PostgreSQL !");
    }
  } catch (err) {
    console.error("Impossible de joindre Supabase :", err);
  }
};
