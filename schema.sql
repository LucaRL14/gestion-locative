-- ==========================================
-- SCRIPT SQL POUR SUPABASE
-- À exécuter dans l'éditeur SQL (SQL Editor)
-- ==========================================

-- 1. Création de la table des propriétés
CREATE TABLE public.properties (
    id text PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    provision_charges numeric DEFAULT 0,
    tenants jsonb DEFAULT '[]'::jsonb,
    fixed_expenses jsonb DEFAULT '[]'::jsonb,
    variable_expenses jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Création de la table des statuts mensuels (pour remplacer monthly_status_YYYY-MM)
CREATE TABLE public.monthly_status (
    id text PRIMARY KEY, -- Concaténation de user_id et month_key (ex: uuid_2026-05)
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month_key text NOT NULL,
    status_data jsonb DEFAULT '{}'::jsonb,
    updated_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- POLITIQUES DE SÉCURITÉ (RLS - Row Level Security)
-- ==========================================

-- Activer la sécurité au niveau des lignes pour les deux tables
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_status ENABLE ROW LEVEL SECURITY;

-- Explications des Policies (Politiques) :
-- Ces règles vérifient que `auth.uid()` (l'ID de l'utilisateur connecté)
-- correspond au `user_id` de la ligne qu'il essaie de lire ou modifier.

-- Policies pour "properties"
CREATE POLICY "Les utilisateurs peuvent lire leurs propres biens" 
ON public.properties FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent insérer leurs propres biens" 
ON public.properties FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres biens" 
ON public.properties FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres biens" 
ON public.properties FOR DELETE 
USING (auth.uid() = user_id);

-- Policies pour "monthly_status"
CREATE POLICY "Les utilisateurs peuvent lire leurs statuts mensuels" 
ON public.monthly_status FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent insérer leurs statuts" 
ON public.monthly_status FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs statuts" 
ON public.monthly_status FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs statuts" 
ON public.monthly_status FOR DELETE 
USING (auth.uid() = user_id);
