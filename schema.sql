-- ============================================================================
-- SQL Schema & Row Level Security (RLS) - SmartStock ERP POS
-- Version: Production-Ready (PostgreSQL 14+)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create payment method enum type safely if it does not exist
DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM ('CASH', 'CARD', 'MOBILE_MONEY', 'MIXED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create stock movement type enum safely if it does not exist
DO $$ BEGIN
    CREATE TYPE movement_type_enum AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'RETURN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create reference type enum safely if it does not exist
DO $$ BEGIN
    CREATE TYPE reference_type_enum AS ENUM ('PRODUCT', 'SALE', 'RETURN', 'ADJUSTMENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create cash session status enum safely if it does not exist
DO $$ BEGIN
    CREATE TYPE cash_session_status_enum AS ENUM ('OPEN', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create return status enum safely if it does not exist
DO $$ BEGIN
    CREATE TYPE return_status_enum AS ENUM ('COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 1. TABLES DEFINITIONS
-- ============================================================================

-- 1.1 Branches (Points de Vente)
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1.2 Profiles (Utilisateurs / Personnel de caisse)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(150) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    first_name VARCHAR(100),
    phone VARCHAR(20),
    password_hash VARCHAR(255),
    activation_code VARCHAR(10),
    activated_at TIMESTAMP WITH TIME ZONE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Caissier', 'Directeur', 'Administrateur', 'Gestionnaire de Stock', 'CASHIER', 'DIRECTOR', 'ADMIN', 'STOCK_MANAGER')),
    avatar TEXT,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1.3 Products (Produits & Stocks)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barcode VARCHAR(100) UNIQUE NOT NULL,
    sku VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    purchase_price NUMERIC(12, 2) CHECK (purchase_price >= 0),
    selling_price NUMERIC(12, 2) CHECK (selling_price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    minimum_stock INTEGER DEFAULT 0 CHECK (minimum_stock >= 0),
    image_path TEXT,
    is_visible_catalog BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    last_stock_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1.4 Caisse Sessions (Gestion des Ouvertures/Fermetures de Caisse)
CREATE TABLE IF NOT EXISTS caisse_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cashier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    opening_balance NUMERIC(12, 2) NOT NULL CHECK (opening_balance >= 0),
    closing_balance NUMERIC(12, 2),
    difference NUMERIC(12, 2),
    status cash_session_status_enum NOT NULL DEFAULT 'OPEN',
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1.5 Sales (Ventes / En-têtes de Ticket)
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_number VARCHAR(30) UNIQUE NOT NULL,
    cash_session_id UUID NOT NULL REFERENCES caisse_sessions(id) ON DELETE RESTRICT,
    cashier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    discount NUMERIC(12, 2) DEFAULT 0 CHECK (discount >= 0),
    total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
    payment_method payment_method_enum NOT NULL,
    amount_received NUMERIC(12, 2) CHECK (amount_received >= 0),
    change_amount NUMERIC(12, 2) CHECK (change_amount >= 0),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1.6 Sale Items (Détails des Articles Vendus)
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    barcode VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    discount NUMERIC(12, 2) DEFAULT 0 CHECK (discount >= 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1.7 Suspended Sales (Ventes en Attente / Suspendues)
CREATE TABLE IF NOT EXISTS suspended_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_name VARCHAR(150) NOT NULL,
    caissier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    items_json JSONB NOT NULL, -- Contient le panier sérialisé
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1.8 Returns & Exchanges (Retours / Échanges de produits)
CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_number VARCHAR(30) UNIQUE NOT NULL,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    cash_session_id UUID REFERENCES caisse_sessions(id) ON DELETE SET NULL,
    cashier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    refund_amount NUMERIC(12, 2) NOT NULL CHECK (refund_amount >= 0),
    reason TEXT,
    status return_status_enum NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1.9 Stock Movements (Traçabilité des mouvements logistiques)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    movement_type movement_type_enum NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    stock_before INTEGER NOT NULL,
    stock_after INTEGER NOT NULL,
    reference_type reference_type_enum NOT NULL,
    reference_id UUID,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1.10 Audit Logs (Journal d'audit de gouvernance)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('access', 'error', 'policy', 'audit', 'success')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    code_reference VARCHAR(100),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);


-- ============================================================================
-- 2. INDEXES (Optimisation des performances)
-- ============================================================================

-- Recherche rapide par Code-Barres / SKU
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

-- Recherche de tickets (sale_number, cashier_id, cash_session_id, status, dates)
CREATE INDEX IF NOT EXISTS idx_sales_sale_number ON sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_sales_cashier_id ON sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_cash_session_id ON sales(cash_session_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);

-- Performance des clés étrangères et liaisons
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_created_at ON sale_items(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_movement_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference_type ON stock_movements(reference_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference_id ON stock_movements(reference_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_caisse_sessions_cashier_id ON caisse_sessions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_caisse_sessions_status ON caisse_sessions(status);
CREATE INDEX IF NOT EXISTS idx_caisse_sessions_opened_at ON caisse_sessions(opened_at);
CREATE INDEX IF NOT EXISTS idx_caisse_sessions_closed_at ON caisse_sessions(closed_at);

-- Index pour les retours (Phase 7)
CREATE INDEX IF NOT EXISTS idx_returns_return_number ON returns(return_number);
CREATE INDEX IF NOT EXISTS idx_returns_sale_id ON returns(sale_id);
CREATE INDEX IF NOT EXISTS idx_returns_product_id ON returns(product_id);
CREATE INDEX IF NOT EXISTS idx_returns_cashier_id ON returns(cashier_id);
CREATE INDEX IF NOT EXISTS idx_returns_created_at ON returns(created_at);


-- ============================================================================
-- 3. TRIGGERS (Automatisation des flux ERP : Gestion des Stocks)
-- ============================================================================

-- 3.1 Fonction de blocage des modifications directes de products.stock
CREATE OR REPLACE FUNCTION prevent_direct_stock_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Si la configuration app.skip_stock_movement_trigger n'est pas définie à 'true'
    -- et que la valeur de stock a été modifiée, on jette une erreur
    IF COALESCE(current_setting('app.skip_stock_movement_trigger', true), 'false') <> 'true' THEN
        IF NEW.stock IS DISTINCT FROM OLD.stock THEN
            RAISE EXCEPTION 'Modification directe de la colonne stock interdite. Veuillez passer par la table stock_movements.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_direct_stock_update
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION prevent_direct_stock_update();


-- 3.2 Trigger BEFORE INSERT sur stock_movements pour calculer les stocks
CREATE OR REPLACE FUNCTION handle_stock_movement_before_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_stock_before INTEGER;
BEGIN
    -- Verrouiller la ligne du produit pour éviter les accès concurrents
    SELECT stock INTO v_stock_before FROM products WHERE id = NEW.product_id FOR UPDATE;
    
    NEW.stock_before := COALESCE(v_stock_before, 0);

    IF NEW.reference_type = 'PRODUCT' AND NEW.movement_type = 'IN' THEN
        -- Pour l'initialisation du produit, le stock_before est 0 car le stock_after sera le stock_initial.
        -- Et la quantité est égale au stock initial.
        NEW.stock_before := 0;
        NEW.stock_after := NEW.quantity;
    ELSE
        -- Calcul du stock_after classique
        IF NEW.movement_type IN ('IN', 'RETURN') THEN
            NEW.stock_after := NEW.stock_before + NEW.quantity;
        ELSIF NEW.movement_type = 'OUT' THEN
            NEW.stock_after := NEW.stock_before - NEW.quantity;
        ELSIF NEW.movement_type = 'ADJUSTMENT' THEN
            IF NEW.stock_after IS NOT NULL THEN
                NEW.quantity := ABS(NEW.stock_after - NEW.stock_before);
            ELSE
                -- Si stock_after n'est pas passé, on assume que c'est NEW.quantity
                NEW.stock_after := NEW.stock_before + NEW.quantity;
            END IF;
        END IF;
    END IF;

    -- Vérification de non-négativité
    IF NEW.stock_after < 0 THEN
        RAISE EXCEPTION 'Le stock ne peut pas devenir négatif pour le produit (ID: %). Stock actuel: %, Tentative de retrait de %.', 
            NEW.product_id, NEW.stock_before, NEW.quantity;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stock_movement_before_insert
BEFORE INSERT ON stock_movements
FOR EACH ROW
EXECUTE FUNCTION handle_stock_movement_before_insert();


-- 3.3 Trigger AFTER INSERT sur stock_movements pour synchroniser le stock du produit
CREATE OR REPLACE FUNCTION handle_stock_movement_after_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- On force la variable locale de contournement pour pouvoir mettre à jour products.stock
    PERFORM set_config('app.skip_stock_movement_trigger', 'true', true);

    -- Mettre à jour le stock et le timestamp sur products
    UPDATE products
    SET stock = NEW.stock_after,
        last_stock_update = TIMEZONE('utc'::text, NOW())
    WHERE id = NEW.product_id;

    -- Réinitialiser la variable
    PERFORM set_config('app.skip_stock_movement_trigger', 'false', true);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_stock_movement_after_insert
AFTER INSERT ON stock_movements
FOR EACH ROW
EXECUTE FUNCTION handle_stock_movement_after_insert();


-- 3.4 Fonction de création d'un mouvement initial lors de la création d'un produit
CREATE OR REPLACE FUNCTION handle_product_initial_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock > 0 THEN
        INSERT INTO stock_movements (
            product_id,
            movement_type,
            quantity,
            stock_before,
            stock_after,
            reference_type,
            reference_id,
            created_by,
            notes
        ) VALUES (
            NEW.id,
            'IN',
            NEW.stock,
            0,
            NEW.stock,
            'PRODUCT',
            NEW.id,
            NEW.created_by,
            'Mouvement initial lors de la création du produit'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur la création d'un produit
CREATE TRIGGER trg_product_initial_stock_movement
AFTER INSERT ON products
FOR EACH ROW
EXECUTE FUNCTION handle_product_initial_stock_movement();


-- 3.5 Fonction automatique pour générer le mouvement de stock lors d'une vente
CREATE OR REPLACE FUNCTION handle_sale_stock_movement()
RETURNS TRIGGER AS $$
DECLARE
    v_cashier_id UUID;
BEGIN
    -- Récupérer l'ID du caissier depuis la vente
    SELECT cashier_id INTO v_cashier_id FROM sales WHERE id = NEW.sale_id;

    -- Créer le mouvement de stock négatif (OUT)
    INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity,
        reference_type,
        reference_id,
        created_by,
        notes
    ) VALUES (
        NEW.product_id,
        'OUT',
        NEW.quantity,
        'SALE',
        NEW.sale_id,
        v_cashier_id,
        'Sortie de stock automatique suite à une vente'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur l'ajout d'un article de vente
CREATE TRIGGER trg_sale_stock_movement
AFTER INSERT ON sale_items
FOR EACH ROW
EXECUTE FUNCTION handle_sale_stock_movement();


-- 3.6 Triggers et fonctions de validation et d'automatisation des retours (Phase 7)
-- 3.6.1 Validation avant insertion : vérification des quantités vendues et calcul automatique
CREATE OR REPLACE FUNCTION handle_returns_before_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_sold_qty INTEGER;
    v_returned_qty INTEGER;
    v_product_name VARCHAR(255);
BEGIN
    -- 1. Récupérer la quantité vendue pour ce produit dans cette vente
    SELECT quantity, product_name INTO v_sold_qty, v_product_name
    FROM sale_items
    WHERE sale_id = NEW.sale_id AND product_id = NEW.product_id;

    IF v_sold_qty IS NULL THEN
        RAISE EXCEPTION 'Le produit sélectionné n''existe pas dans la vente d''origine.';
    END IF;

    -- 2. Récupérer la somme déjà retournée pour ce produit et cette vente (hors retours annulés)
    SELECT COALESCE(SUM(quantity), 0) INTO v_returned_qty
    FROM returns
    WHERE sale_id = NEW.sale_id AND product_id = NEW.product_id AND status = 'COMPLETED';

    -- 3. Valider que la quantité totale retournée ne dépasse pas la quantité vendue
    IF (v_returned_qty + NEW.quantity) > v_sold_qty THEN
        RAISE EXCEPTION 'Impossible de retourner une quantité supérieure à celle vendue. Produit: %, Vendue: %, Déjà retournée: %, Demandée: %', 
            v_product_name, v_sold_qty, v_returned_qty, NEW.quantity;
    END IF;

    -- 4. Calculer automatiquement le refund_amount si non défini
    IF NEW.refund_amount IS NULL OR NEW.refund_amount = 0 THEN
        NEW.refund_amount := NEW.quantity * NEW.unit_price;
    END IF;

    -- 5. Générer automatiquement le return_number s'il est vide
    IF NEW.return_number IS NULL OR NEW.return_number = '' THEN
        NEW.return_number := 'RET-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(SUBSTRING(uuid_generate_v4()::text, 1, 8), 8, '0');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_returns_before_insert
BEFORE INSERT ON returns
FOR EACH ROW
EXECUTE FUNCTION handle_returns_before_insert();


-- 3.6.2 Automatisation post-validation : mouvement de stock et journal d'audit
CREATE OR REPLACE FUNCTION handle_returns_after_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_product_name VARCHAR(255);
BEGIN
    -- Récupérer le nom du produit pour enrichir les logs
    SELECT name INTO v_product_name FROM products WHERE id = NEW.product_id;

    -- 1. Création automatique du mouvement de stock positif (RETURN)
    INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity,
        reference_type,
        reference_id,
        created_by,
        notes
    ) VALUES (
        NEW.product_id,
        'RETURN',
        NEW.quantity,
        'RETURN',
        NEW.id,
        NEW.cashier_id,
        'Entrée de stock automatique suite au retour ' || NEW.return_number
    );

    -- 2. Enregistrement dans audit_logs
    INSERT INTO audit_logs (
        user_id,
        action_type,
        title,
        description,
        code_reference
    ) VALUES (
        NEW.cashier_id,
        'audit',
        'Retour produit validé',
        'Retour #' || NEW.return_number || ' validé pour le produit ' || COALESCE(v_product_name, NEW.product_id::text) || ' (Qté: ' || NEW.quantity || ', Remboursement: ' || NEW.refund_amount || ' FCFA). Motif: ' || COALESCE(NEW.reason, 'Non renseigné'),
        'returns'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_returns_after_insert
AFTER INSERT ON returns
FOR EACH ROW
EXECUTE FUNCTION handle_returns_after_insert();


-- 3.6.3 Gestion des annulations de retour : correction de stock et d'audit
CREATE OR REPLACE FUNCTION handle_returns_after_update()
RETURNS TRIGGER AS $$
DECLARE
    v_product_name VARCHAR(255);
BEGIN
    -- Détecter le passage de COMPLETED à CANCELLED
    IF OLD.status = 'COMPLETED' AND NEW.status = 'CANCELLED' THEN
        SELECT name INTO v_product_name FROM products WHERE id = NEW.product_id;

        -- Création d'un mouvement de stock inverse (OUT) pour annuler la réintégration de stock
        INSERT INTO stock_movements (
            product_id,
            movement_type,
            quantity,
            reference_type,
            reference_id,
            created_by,
            notes
        ) VALUES (
            NEW.product_id,
            'OUT',
            NEW.quantity,
            'RETURN',
            NEW.id,
            NEW.cashier_id,
            'Annulation du retour ' || NEW.return_number || ' : Sortie de stock corrective'
        );

        -- Enregistrement dans audit_logs
        INSERT INTO audit_logs (
            user_id,
            action_type,
            title,
            description,
            code_reference
        ) VALUES (
            NEW.cashier_id,
            'audit',
            'Retour produit annulé',
            'Retour #' || NEW.return_number || ' annulé pour le produit ' || COALESCE(v_product_name, NEW.product_id::text) || ' (Qté: ' || NEW.quantity || '). Annulation de la réintégration de stock.',
            'returns'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_returns_after_update
AFTER UPDATE ON returns
FOR EACH ROW
EXECUTE FUNCTION handle_returns_after_update();


-- ============================================================================
-- 3.8 GESTION DES IMAGES PRODUITS (SmartStock ERP)
-- ============================================================================

-- Fonction pour gérer les permissions et la journalisation des images produits
CREATE OR REPLACE FUNCTION handle_product_image_update()
RETURNS TRIGGER AS $$
DECLARE
    v_user_role VARCHAR;
    v_user_id UUID;
    v_action VARCHAR;
BEGIN
    -- Détecter si image_path est modifié (ajout, modification ou suppression)
    IF NEW.image_path IS DISTINCT FROM OLD.image_path THEN
        -- Récupérer le rôle de l'utilisateur actif
        v_user_role := COALESCE(current_setting('app.current_user_role', true), '');
        
        -- Si le rôle est défini, vérifier les permissions
        -- Rôles autorisés : ADMIN, STOCK_MANAGER (et leurs variantes)
        IF v_user_role <> '' AND v_user_role NOT IN ('Administrateur', 'Gestionnaire de Stock', 'ADMIN', 'STOCK_MANAGER') THEN
            RAISE EXCEPTION 'Seul un Administrateur ou un Gestionnaire de Stock est autorisé à modifier l''image d''un produit.';
        END IF;

        -- Mise à jour automatique de la date de modification
        NEW.updated_at := NOW();

        -- Déterminer le type d'action d'image
        IF (OLD.image_path IS NULL OR OLD.image_path = '') AND (NEW.image_path IS NOT NULL AND NEW.image_path <> '') THEN
            v_action := 'ajout d''image';
        ELSIF (OLD.image_path IS NOT NULL AND OLD.image_path <> '') AND (NEW.image_path IS NULL OR NEW.image_path = '') THEN
            v_action := 'suppression d''image';
        ELSE
            v_action := 'remplacement d''image';
        END IF;

        -- Récupérer l'UUID de l'utilisateur connecté s'il existe
        BEGIN
            v_user_id := NULLIF(current_setting('app.current_user_id', true), '')::UUID;
        EXCEPTION WHEN OTHERS THEN
            v_user_id := NULL;
        END;

        -- Journalisation automatique dans audit_logs
        INSERT INTO audit_logs (
            user_id,
            action_type,
            title,
            description,
            code_reference,
            old_data,
            new_data
        ) VALUES (
            v_user_id,
            'audit',
            'Modification d''image produit',
            'Action: ' || v_action || ' sur le produit ID: ' || NEW.id || ' (' || NEW.name || '). ' ||
            'Ancienne valeur: ' || COALESCE(OLD.image_path, 'aucune') || ', Nouvelle valeur: ' || COALESCE(NEW.image_path, 'aucune') || '.',
            'products',
            jsonb_build_object(
                'product_id', NEW.id,
                'sku', NEW.sku,
                'name', NEW.name,
                'image_path', OLD.image_path,
                'action', v_action,
                'date', NOW()
            ),
            jsonb_build_object(
                'product_id', NEW.id,
                'sku', NEW.sku,
                'name', NEW.name,
                'image_path', NEW.image_path,
                'action', v_action,
                'date', NOW()
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur la mise à jour d'un produit (exécuté avant)
CREATE TRIGGER trg_product_image_update
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION handle_product_image_update();


-- ============================================================================
-- 3.7 TRIGGERS & FONCTIONS : GESTION DE LA CAISSE (Phase 6)
-- ============================================================================

-- 3.7.1 Fonction pour calculer dynamiquement le montant attendu (expected_balance) d'une session
CREATE OR REPLACE FUNCTION get_caisse_session_expected_balance(p_session_id UUID)
RETURNS NUMERIC(12,2) AS $$
DECLARE
    v_opening NUMERIC(12,2);
    v_sales_cash NUMERIC(12,2);
    v_returns_cash NUMERIC(12,2);
BEGIN
    SELECT opening_balance INTO v_opening FROM caisse_sessions WHERE id = p_session_id;
    IF v_opening IS NULL THEN
        RETURN 0;
    END IF;

    -- Somme des ventes complétées payées en CASH ou MIXED de cette session
    SELECT COALESCE(SUM(
        CASE 
            WHEN payment_method = 'CASH' THEN total
            WHEN payment_method = 'MIXED' THEN COALESCE(amount_received - change_amount, total)
            ELSE 0
        END
    ), 0)
    INTO v_sales_cash
    FROM sales
    WHERE cash_session_id = p_session_id AND status = 'completed';

    -- Somme des remboursements de cette session (soit par cash_session_id direct, soit par session de la vente d'origine) pour les retours complétés
    SELECT COALESCE(SUM(refund_amount), 0)
    INTO v_returns_cash
    FROM returns r
    LEFT JOIN sales s ON r.sale_id = s.id
    WHERE (r.cash_session_id = p_session_id 
       OR (r.cash_session_id IS NULL AND s.cash_session_id = p_session_id))
       AND r.status = 'COMPLETED';

    RETURN v_opening + v_sales_cash - v_returns_cash;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- 3.7.2 Vue v_caisse_sessions pour une consultation simplifiée avec expected_balance et difference en temps réel
CREATE OR REPLACE VIEW v_caisse_sessions AS
SELECT 
    id,
    cashier_id,
    branch_id,
    opening_balance,
    closing_balance,
    get_caisse_session_expected_balance(id) AS expected_balance,
    CASE 
        WHEN status = 'CLOSED' THEN COALESCE(difference, closing_balance - get_caisse_session_expected_balance(id))
        ELSE closing_balance - get_caisse_session_expected_balance(id)
    END AS difference,
    status,
    opened_at,
    closed_at,
    notes,
    created_at
FROM caisse_sessions;


-- 3.7.3 Validation à l'ouverture : s'assurer qu'aucune autre session n'est ouverte pour ce caissier
CREATE OR REPLACE FUNCTION handle_caisse_session_before_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- S'assurer que le statut est 'OPEN' à l'insertion par défaut
    NEW.status := 'OPEN';
    NEW.opened_at := COALESCE(NEW.opened_at, TIMEZONE('utc'::text, NOW()));
    
    -- Vérifier s'il y a déjà une session ouverte pour ce caissier
    IF EXISTS (
        SELECT 1 FROM caisse_sessions
        WHERE cashier_id = NEW.cashier_id AND status = 'OPEN'
    ) THEN
        RAISE EXCEPTION 'Le caissier possède déjà une session de caisse ouverte (OPEN). Fermez-la d''abord.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_caisse_session_before_insert
BEFORE INSERT ON caisse_sessions
FOR EACH ROW
EXECUTE FUNCTION handle_caisse_session_before_insert();


-- 3.7.4 Calcul automatique de la différence à la fermeture et restriction des modifications ultérieures
CREATE OR REPLACE FUNCTION handle_caisse_session_before_update()
RETURNS TRIGGER AS $$
DECLARE
    v_expected NUMERIC(12,2);
BEGIN
    -- Si la session était déjà fermée, interdire toute mise à jour
    IF OLD.status = 'CLOSED' THEN
        RAISE EXCEPTION 'Une session de caisse fermée ne peut plus être modifiée (status = CLOSED).';
    END IF;

    -- Si passage à CLOSED
    IF NEW.status = 'CLOSED' AND OLD.status = 'OPEN' THEN
        NEW.closed_at := COALESCE(NEW.closed_at, TIMEZONE('utc'::text, NOW()));
        
        -- Calcul dynamique du solde attendu au moment de la fermeture pour figer l'écart
        v_expected := get_caisse_session_expected_balance(NEW.id);
        
        IF NEW.closing_balance IS NULL THEN
            NEW.closing_balance := v_expected;
        END IF;
        
        NEW.difference := NEW.closing_balance - v_expected;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_caisse_session_before_update
BEFORE UPDATE ON caisse_sessions
FOR EACH ROW
EXECUTE FUNCTION handle_caisse_session_before_update();


-- 3.7.5 Audit log automatique lors de l'ouverture et fermeture de la caisse
CREATE OR REPLACE FUNCTION handle_caisse_session_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_expected NUMERIC(12,2);
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_id, action_type, title, description, code_reference)
        VALUES (
            NEW.cashier_id,
            'audit',
            'Ouverture de caisse',
            'Session de caisse ouverte (ID: ' || NEW.id || ') avec un fonds de caisse de ' || NEW.opening_balance || ' FCFA.',
            'caisse_sessions'
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'OPEN' AND NEW.status = 'CLOSED' THEN
            v_expected := get_caisse_session_expected_balance(NEW.id);
            INSERT INTO audit_logs (user_id, action_type, title, description, code_reference)
            VALUES (
                NEW.cashier_id,
                'audit',
                'Fermeture de caisse',
                'Session de caisse fermée (ID: ' || NEW.id || '). Solde attendu: ' || v_expected || ' FCFA, Solde réel: ' || NEW.closing_balance || ' FCFA, Écart: ' || COALESCE(NEW.difference, 0) || ' FCFA.',
                'caisse_sessions'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_caisse_session_audit_log
AFTER INSERT OR UPDATE ON caisse_sessions
FOR EACH ROW
EXECUTE FUNCTION handle_caisse_session_audit_log();


-- 3.7.6 Validation de la vente : interdire la vente si la session de caisse n'est pas ouverte (OPEN)
CREATE OR REPLACE FUNCTION check_sales_caisse_session_open()
RETURNS TRIGGER AS $$
DECLARE
    v_session_status cash_session_status_enum;
BEGIN
    SELECT status INTO v_session_status
    FROM caisse_sessions
    WHERE id = NEW.cash_session_id;

    IF v_session_status IS NULL THEN
        RAISE EXCEPTION 'Session de caisse invalide ou inexistante.';
    ELSIF v_session_status <> 'OPEN' THEN
        RAISE EXCEPTION 'Impossible d''enregistrer une vente sur une session de caisse fermée (statut: %). Veuillez ouvrir une session active.', v_session_status;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_check_sales_caisse_session_open
BEFORE INSERT ON sales
FOR EACH ROW
EXECUTE FUNCTION check_sales_caisse_session_open();


-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Activation globale de la sécurité RLS sur toutes les tables sensibles
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE caisse_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspended_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Note sur le contexte de session:
-- Les règles suivantes utilisent `current_setting('app.current_user_role', true)`
-- et `current_setting('app.current_user_branch_id', true)` pour obtenir le rôle 
-- et l'identifiant de la boutique de l'utilisateur connecté dans la session PostgreSQL.
-- ----------------------------------------------------------------------------
-- 4.1 Règles pour les Branches
-- ----------------------------------------------------------------------------
-- Les Directeurs, Administrateurs et equivalents peuvent tout voir et modifier.
-- Les Caissiers et autres roles peuvent voir toutes les branches actives mais pas les éditer.
CREATE POLICY branch_view_policy ON branches
    FOR SELECT
    USING (is_active = TRUE OR current_setting('app.current_user_role', true) IN ('Directeur', 'Administrateur', 'DIRECTOR', 'ADMIN'));

CREATE POLICY branch_admin_policy ON branches
    FOR ALL
    USING (current_setting('app.current_user_role', true) IN ('Directeur', 'Administrateur', 'DIRECTOR', 'ADMIN'));

-- ----------------------------------------------------------------------------
-- 4.2 Règles pour les Profils d'utilisateurs
-- ----------------------------------------------------------------------------
-- Un utilisateur peut voir son propre profil.
-- Les Directeurs et Administrateurs ont un accès total aux profils.
CREATE POLICY profile_self_and_admin_view_policy ON profiles
    FOR SELECT
    USING (
        id::text = current_setting('app.current_user_id', true)
        OR current_setting('app.current_user_role', true) IN ('Directeur', 'Administrateur', 'DIRECTOR', 'ADMIN')
    );

CREATE POLICY profile_admin_modify_policy ON profiles
    FOR ALL
    USING (current_setting('app.current_user_role', true) IN ('Directeur', 'Administrateur', 'DIRECTOR', 'ADMIN'));

-- ----------------------------------------------------------------------------
-- 4.3 Règles pour le Catalogue de Produits (Products)
-- ----------------------------------------------------------------------------
-- Tout le personnel authentifié peut lire tout le catalogue.
-- Le catalogue public (sans role valide) n'accède qu'aux produits actifs et visibles.
-- Seuls les Directeurs, Administrateurs et Gestionnaires de Stock peuvent ajouter ou modifier des produits.
CREATE POLICY product_read_policy ON products
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) IN ('Administrateur', 'Directeur', 'Gestionnaire de Stock', 'Caissier', 'ADMIN', 'DIRECTOR', 'STOCK_MANAGER', 'CASHIER')
        OR (is_active = TRUE AND is_visible_catalog = TRUE)
    );

CREATE POLICY product_write_policy ON products
    FOR ALL
    USING (current_setting('app.current_user_role', true) IN ('Directeur', 'Administrateur', 'Gestionnaire de Stock', 'DIRECTOR', 'ADMIN', 'STOCK_MANAGER'));

-- ----------------------------------------------------------------------------
-- 4.4 Règles pour la Gestion de la Caisse (Caisse Sessions)
-- ----------------------------------------------------------------------------
-- Administrateur: Lecture complète, création, modification, suppression.
-- Directeur: Lecture uniquement.
-- Caissier: Création, lecture et fermeture uniquement de ses propres sessions.
CREATE POLICY caisse_session_select_policy ON caisse_sessions
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) IN ('Administrateur', 'Directeur', 'ADMIN', 'DIRECTOR')
        OR (current_setting('app.current_user_role', true) IN ('Caissier', 'CASHIER') AND cashier_id::text = current_setting('app.current_user_id', true))
    );

CREATE POLICY caisse_session_insert_policy ON caisse_sessions
    FOR INSERT
    WITH CHECK (
        current_setting('app.current_user_role', true) IN ('Administrateur', 'ADMIN')
        OR (current_setting('app.current_user_role', true) IN ('Caissier', 'CASHIER') AND cashier_id::text = current_setting('app.current_user_id', true))
    );

CREATE POLICY caisse_session_update_policy ON caisse_sessions
    FOR UPDATE
    USING (
        current_setting('app.current_user_role', true) IN ('Administrateur', 'ADMIN')
        OR (current_setting('app.current_user_role', true) IN ('Caissier', 'CASHIER') AND cashier_id::text = current_setting('app.current_user_id', true) AND status = 'OPEN')
    );

CREATE POLICY caisse_session_delete_policy ON caisse_sessions
    FOR DELETE
    USING (current_setting('app.current_user_role', true) IN ('Administrateur', 'ADMIN'));

-- ----------------------------------------------------------------------------
-- 4.5 Règles pour les Ventes (Sales & Sale Items)
-- ----------------------------------------------------------------------------
-- Administrateur/Directeur : accès lecture. Administrateur a l'écriture totale.
-- Caissier : création et lecture de ses propres ventes.
CREATE POLICY sales_select_policy ON sales
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) IN ('Directeur', 'Administrateur', 'DIRECTOR', 'ADMIN')
        OR (current_setting('app.current_user_role', true) IN ('Caissier', 'CASHIER') AND cashier_id::text = current_setting('app.current_user_id', true))
    );

CREATE POLICY sales_insert_policy ON sales
    FOR INSERT
    WITH CHECK (
        current_setting('app.current_user_role', true) IN ('Administrateur', 'ADMIN')
        OR (current_setting('app.current_user_role', true) IN ('Caissier', 'CASHIER') AND cashier_id::text = current_setting('app.current_user_id', true))
    );

CREATE POLICY sales_admin_modify_policy ON sales
    FOR ALL
    USING (current_setting('app.current_user_role', true) IN ('Administrateur', 'ADMIN'));

CREATE POLICY sale_items_select_policy ON sale_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sales s
            WHERE s.id = sale_items.sale_id
            AND (
                current_setting('app.current_user_role', true) IN ('Directeur', 'Administrateur', 'Gestionnaire de Stock', 'DIRECTOR', 'ADMIN', 'STOCK_MANAGER')
                OR (current_setting('app.current_user_role', true) IN ('Caissier', 'CASHIER') AND s.cashier_id::text = current_setting('app.current_user_id', true))
            )
        )
    );

CREATE POLICY sale_items_insert_policy ON sale_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sales s
            WHERE s.id = sale_items.sale_id
            AND (
                current_setting('app.current_user_role', true) IN ('Administrateur', 'ADMIN')
                OR (current_setting('app.current_user_role', true) IN ('Caissier', 'CASHIER') AND s.cashier_id::text = current_setting('app.current_user_id', true))
            )
        )
    );

-- ----------------------------------------------------------------------------
-- 4.6 Règles pour les Ventes Suspendues
-- ----------------------------------------------------------------------------
CREATE POLICY suspended_sales_policy ON suspended_sales
    FOR ALL
    USING (
        (current_setting('app.current_user_role', true) IN ('Caissier', 'CASHIER') AND caissier_id::text = current_setting('app.current_user_id', true))
        OR current_setting('app.current_user_role', true) IN ('Directeur', 'Administrateur', 'DIRECTOR', 'ADMIN')
    );

-- ----------------------------------------------------------------------------
-- 4.7 Règles pour les Retours et Échanges
-- ----------------------------------------------------------------------------
CREATE POLICY returns_select_policy ON returns
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) IN ('Administrateur', 'Directeur', 'Gestionnaire de Stock', 'ADMIN', 'DIRECTOR', 'STOCK_MANAGER')
        OR (current_setting('app.current_user_role', true) IN ('Caissier', 'CASHIER') AND cashier_id::text = current_setting('app.current_user_id', true))
    );

CREATE POLICY returns_insert_policy ON returns
    FOR INSERT
    WITH CHECK (
        current_setting('app.current_user_role', true) IN ('Administrateur', 'ADMIN')
        OR (current_setting('app.current_user_role', true) IN ('Caissier', 'CASHIER') AND cashier_id::text = current_setting('app.current_user_id', true))
    );

CREATE POLICY returns_update_policy ON returns
    FOR UPDATE
    USING (current_setting('app.current_user_role', true) IN ('Administrateur', 'ADMIN'));

CREATE POLICY returns_delete_policy ON returns
    FOR DELETE
    USING (current_setting('app.current_user_role', true) IN ('Administrateur', 'ADMIN'));

-- ----------------------------------------------------------------------------
-- 4.8 Règles pour la Traçabilité Logistique (Stock Movements)
-- ----------------------------------------------------------------------------
CREATE POLICY stock_movements_read_policy ON stock_movements
    FOR SELECT
    USING (TRUE);

CREATE POLICY stock_movements_write_policy ON stock_movements
    FOR ALL
    USING (current_setting('app.current_user_role', true) IN ('Directeur', 'Administrateur', 'Gestionnaire de Stock', 'DIRECTOR', 'ADMIN', 'STOCK_MANAGER'));

-- ----------------------------------------------------------------------------
-- 4.9 Règles pour le Journal d'Audit (Audit Logs)
-- ----------------------------------------------------------------------------
CREATE POLICY audit_logs_read_policy ON audit_logs
    FOR SELECT
    USING (current_setting('app.current_user_role', true) IN ('Directeur', 'Administrateur', 'DIRECTOR', 'ADMIN'));

CREATE POLICY audit_logs_insert_policy ON audit_logs
    FOR INSERT
    WITH CHECK (TRUE);


-- ============================================================================
-- 5. VUES OPTIMISÉES POUR LES DASHBOARDS (SmartStock ERP v2)
-- ============================================================================

-- 5.1 Vue Dashboard Administrateur
CREATE OR REPLACE VIEW v_dashboard_admin AS
SELECT
    (SELECT COUNT(*) FROM profiles WHERE is_active = TRUE) AS total_active_users,
    (SELECT COUNT(*) FROM branches WHERE is_active = TRUE) AS total_active_branches,
    (SELECT COALESCE(SUM(total), 0) FROM sales WHERE status = 'completed') AS total_completed_sales_revenue,
    (SELECT COUNT(*) FROM products WHERE stock <= minimum_stock AND is_active = TRUE) AS low_stock_count,
    (SELECT COUNT(*) FROM caisse_sessions WHERE status = 'OPEN') AS open_sessions_count,
    (SELECT COUNT(*) FROM audit_logs WHERE created_at >= NOW() - INTERVAL '24 hours') AS recent_audit_count;

-- 5.2 Vue Dashboard Directeur
CREATE OR REPLACE VIEW v_dashboard_director AS
SELECT
    b.id AS branch_id,
    b.name AS branch_name,
    COUNT(DISTINCT s.id) AS total_sales_count,
    COALESCE(SUM(s.total), 0) AS total_sales_revenue,
    COALESCE(SUM(r.refund_amount), 0) AS total_refunded_amount,
    COALESCE(SUM(s.total), 0) - COALESCE(SUM(r.refund_amount), 0) AS net_revenue
FROM branches b
LEFT JOIN caisse_sessions cs ON cs.branch_id = b.id
LEFT JOIN sales s ON s.cash_session_id = cs.id AND s.status = 'completed'
LEFT JOIN returns r ON r.sale_id = s.id AND r.status = 'COMPLETED'
GROUP BY b.id, b.name;

-- 5.3 Vue Dashboard Gestionnaire de Stock
CREATE OR REPLACE VIEW v_dashboard_stock_manager AS
SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.barcode,
    p.sku,
    p.stock,
    p.minimum_stock,
    p.category,
    CASE WHEN p.stock <= p.minimum_stock THEN TRUE ELSE FALSE END AS is_low_stock,
    COALESCE((
        SELECT SUM(quantity)
        FROM stock_movements sm
        WHERE sm.product_id = p.id AND sm.movement_type = 'IN'
    ), 0) AS total_received,
    COALESCE((
        SELECT SUM(quantity)
        FROM stock_movements sm
        WHERE sm.product_id = p.id AND sm.movement_type = 'OUT'
    ), 0) AS total_shipped
FROM products p
WHERE p.is_active = TRUE;

-- 5.4 Vue Dashboard Caissier
CREATE OR REPLACE VIEW v_dashboard_cashier AS
SELECT
    p.id AS cashier_id,
    p.name AS cashier_name,
    cs.id AS active_session_id,
    cs.opening_balance AS active_session_opening,
    COALESCE((
        SELECT SUM(s.total)
        FROM sales s
        WHERE s.cash_session_id = cs.id AND s.status = 'completed'
    ), 0) AS active_session_sales_total,
    COALESCE((
        SELECT COUNT(*)
        FROM sales s
        WHERE s.cash_session_id = cs.id
    ), 0) AS active_session_sales_count
FROM profiles p
LEFT JOIN caisse_sessions cs ON cs.cashier_id = p.id AND cs.status = 'OPEN';

-- 5.5 Vue Catalogue Public
CREATE OR REPLACE VIEW v_catalogue_public AS
SELECT
    id,
    barcode,
    sku,
    name,
    description,
    category,
    selling_price,
    stock,
    image_path,
    created_at
FROM products
WHERE is_active = TRUE AND is_visible_catalog = TRUE;


-- ============================================================================
-- 6. FONCTIONS RPC DE CENTRALISATION LOGIQUE (SmartStock ERP v2)
-- ============================================================================

-- 6.1 create_product
CREATE OR REPLACE FUNCTION create_product(
    p_barcode VARCHAR(100),
    p_sku VARCHAR(50),
    p_name VARCHAR(255),
    p_description TEXT,
    p_category VARCHAR(100),
    p_purchase_price NUMERIC(12, 2),
    p_selling_price NUMERIC(12, 2),
    p_stock INTEGER,
    p_minimum_stock INTEGER,
    p_image_path TEXT,
    p_is_visible_catalog BOOLEAN,
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_product_id UUID;
BEGIN
    INSERT INTO products (
        barcode, sku, name, description, category, 
        purchase_price, selling_price, stock, minimum_stock, 
        image_path, is_visible_catalog, created_by
    ) VALUES (
        p_barcode, p_sku, p_name, p_description, p_category, 
        p_purchase_price, p_selling_price, COALESCE(p_stock, 0), COALESCE(p_minimum_stock, 0), 
        p_image_path, COALESCE(p_is_visible_catalog, FALSE), p_created_by
    ) RETURNING id INTO v_product_id;
    
    RETURN v_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.2 update_product
CREATE OR REPLACE FUNCTION update_product(
    p_id UUID,
    p_barcode VARCHAR(100),
    p_sku VARCHAR(50),
    p_name VARCHAR(255),
    p_description TEXT,
    p_category VARCHAR(100),
    p_purchase_price NUMERIC(12, 2),
    p_selling_price NUMERIC(12, 2),
    p_minimum_stock INTEGER,
    p_image_path TEXT,
    p_is_visible_catalog BOOLEAN
) RETURNS BOOLEAN AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
BEGIN
    SELECT to_jsonb(p) INTO v_old_data FROM products p WHERE id = p_id;
    
    UPDATE products
    SET barcode = COALESCE(p_barcode, barcode),
        sku = COALESCE(p_sku, sku),
        name = COALESCE(p_name, name),
        description = COALESCE(p_description, description),
        category = COALESCE(p_category, category),
        purchase_price = COALESCE(p_purchase_price, purchase_price),
        selling_price = COALESCE(p_selling_price, selling_price),
        minimum_stock = COALESCE(p_minimum_stock, minimum_stock),
        image_path = COALESCE(p_image_path, image_path),
        is_visible_catalog = COALESCE(p_is_visible_catalog, is_visible_catalog),
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_id;
    
    SELECT to_jsonb(p) INTO v_new_data FROM products p WHERE id = p_id;
    
    -- Log audit avec snapshots
    INSERT INTO audit_logs (user_id, action_type, title, description, code_reference, old_data, new_data)
    VALUES (
        (SELECT created_by FROM products WHERE id = p_id),
        'audit',
        'Mise à jour produit',
        'Le produit ' || COALESCE(p_name, '') || ' (ID: ' || p_id || ') a été modifié.',
        'products',
        v_old_data,
        v_new_data
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.3 create_sale
CREATE OR REPLACE FUNCTION create_sale(
    p_sale_number VARCHAR(30),
    p_cash_session_id UUID,
    p_cashier_id UUID,
    p_subtotal NUMERIC(12, 2),
    p_discount NUMERIC(12, 2),
    p_total NUMERIC(12, 2),
    p_payment_method VARCHAR(20),
    p_amount_received NUMERIC(12, 2),
    p_change_amount NUMERIC(12, 2),
    p_items JSONB, -- Format: [{"product_id": "...", "product_name": "...", "barcode": "...", "quantity": 1, "unit_price": 100, "discount": 0, "subtotal": 100}]
    p_notes TEXT
) RETURNS UUID AS $$
DECLARE
    v_sale_id UUID;
    v_item JSONB;
BEGIN
    INSERT INTO sales (
        sale_number, cash_session_id, cashier_id, subtotal, discount, total, 
        payment_method, amount_received, change_amount, notes
    ) VALUES (
        p_sale_number, p_cash_session_id, p_cashier_id, p_subtotal, p_discount, p_total, 
        p_payment_method::payment_method_enum, p_amount_received, p_change_amount, p_notes
    ) RETURNING id INTO v_sale_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO sale_items (
            sale_id, product_id, product_name, barcode, quantity, unit_price, discount, subtotal
        ) VALUES (
            v_sale_id,
            (v_item->>'product_id')::UUID,
            v_item->>'product_name',
            v_item->>'barcode',
            (v_item->>'quantity')::INTEGER,
            (v_item->>'unit_price')::NUMERIC(12,2),
            COALESCE((v_item->>'discount')::NUMERIC(12,2), 0),
            (v_item->>'subtotal')::NUMERIC(12,2)
        );
    END LOOP;

    INSERT INTO audit_logs (user_id, action_type, title, description, code_reference, new_data)
    VALUES (
        p_cashier_id,
        'success',
        'Vente validée',
        'Vente #' || p_sale_number || ' complétée d''un montant de ' || p_total || ' FCFA.',
        'sales',
        jsonb_build_object('sale_id', v_sale_id, 'total', p_total, 'items_count', jsonb_array_length(p_items))
    );

    RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.4 create_return
CREATE OR REPLACE FUNCTION create_return(
    p_sale_id UUID,
    p_product_id UUID,
    p_cash_session_id UUID,
    p_cashier_id UUID,
    p_quantity INTEGER,
    p_unit_price NUMERIC(12, 2),
    p_refund_amount NUMERIC(12, 2),
    p_reason TEXT
) RETURNS UUID AS $$
DECLARE
    v_return_id UUID;
    v_return_number VARCHAR(30);
BEGIN
    v_return_number := 'RET-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(SUBSTRING(uuid_generate_v4()::text, 1, 8), 8, '0');
    
    INSERT INTO returns (
        return_number, sale_id, product_id, cash_session_id, cashier_id, quantity, unit_price, refund_amount, reason, status
    ) VALUES (
        v_return_number, p_sale_id, p_product_id, p_cash_session_id, p_cashier_id, p_quantity, p_unit_price, p_refund_amount, p_reason, 'COMPLETED'
    ) RETURNING id INTO v_return_id;

    RETURN v_return_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.5 adjust_stock
CREATE OR REPLACE FUNCTION adjust_stock(
    p_product_id UUID,
    p_new_stock INTEGER,
    p_created_by UUID,
    p_notes TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity,
        stock_after,
        reference_type,
        reference_id,
        created_by,
        notes
    ) VALUES (
        p_product_id,
        'ADJUSTMENT',
        1, -- Recalculé dynamiquement par le trigger BEFORE INSERT
        p_new_stock,
        'ADJUSTMENT',
        p_product_id,
        p_created_by,
        COALESCE(p_notes, 'Ajustement de stock ERP v2')
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.6 open_cash_session
CREATE OR REPLACE FUNCTION open_cash_session(
    p_cashier_id UUID,
    p_branch_id UUID,
    p_opening_balance NUMERIC(12, 2),
    p_notes TEXT
) RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
BEGIN
    INSERT INTO caisse_sessions (
        cashier_id, branch_id, opening_balance, notes, status
    ) VALUES (
        p_cashier_id, p_branch_id, p_opening_balance, p_notes, 'OPEN'
    ) RETURNING id INTO v_session_id;

    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.7 close_cash_session
CREATE OR REPLACE FUNCTION close_cash_session(
    p_session_id UUID,
    p_closing_balance NUMERIC(12, 2),
    p_notes TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE caisse_sessions
    SET closing_balance = p_closing_balance,
        status = 'CLOSED',
        notes = COALESCE(p_notes, notes),
        closed_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_session_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.8 publish_product
CREATE OR REPLACE FUNCTION publish_product(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE products
    SET is_visible_catalog = TRUE,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.9 unpublish_product
CREATE OR REPLACE FUNCTION unpublish_product(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE products
    SET is_visible_catalog = FALSE,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
