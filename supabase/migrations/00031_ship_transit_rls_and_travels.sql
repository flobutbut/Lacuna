-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Transit : RLS pour mise à jour BDD (anon prototype) + table ship_travels
-- Sans cette migration, les UPDATE sur ships (startTransit/completeTransit) sont
-- refusés par RLS et l'historique ship_travels ne peut pas être écrit.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Anon peut mettre à jour le vaisseau prototype (transit, voyage)
CREATE POLICY "Anon can update prototype ship" ON public.ships
  FOR UPDATE
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);

-- 2. Table historique des voyages (idempotent)
CREATE TABLE IF NOT EXISTS public.ship_travels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ship_id uuid NOT NULL REFERENCES public.ships(id) ON DELETE CASCADE,
  voyage_number integer NOT NULL,
  origin_system_id text NOT NULL REFERENCES public.stellar_systems(id),
  destination_system_id text NOT NULL REFERENCES public.stellar_systems(id),
  departure_at timestamptz NOT NULL,
  arrival_at timestamptz NOT NULL,
  distance_al double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ship_travels IS 'Historique des trajets : un enregistrement par voyage terminé, pour retracer la route.';

ALTER TABLE public.ship_travels ENABLE ROW LEVEL SECURITY;

-- 3. Anon peut insérer et lire les voyages du vaisseau prototype
CREATE POLICY "Anon can insert prototype ship travels" ON public.ship_travels
  FOR INSERT
  WITH CHECK (
    ship_id IN (SELECT id FROM public.ships WHERE user_id IS NULL)
  );

CREATE POLICY "Anon can read prototype ship travels" ON public.ship_travels
  FOR SELECT
  USING (
    ship_id IN (SELECT id FROM public.ships WHERE user_id IS NULL)
  );

-- Utilisateurs authentifiés : gestion de leurs propres voyages
CREATE POLICY "Users can manage own ship travels" ON public.ship_travels
  FOR ALL
  USING (
    ship_id IN (SELECT id FROM public.ships WHERE user_id = auth.uid())
  )
  WITH CHECK (
    ship_id IN (SELECT id FROM public.ships WHERE user_id = auth.uid())
  );
