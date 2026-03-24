-- LACUNA — Colonne object_type sur stellar_systems (objets exotiques SIMBAD)
-- Mars 2026 — Types : STAR (défaut), WHITE_DWARF, NEUTRON_STAR, PULSAR, MAGNETAR, BLACK_HOLE

ALTER TABLE public.stellar_systems
ADD COLUMN IF NOT EXISTS object_type text DEFAULT 'STAR';

ALTER TABLE public.stellar_systems
DROP CONSTRAINT IF EXISTS stellar_systems_object_type_check;

ALTER TABLE public.stellar_systems
ADD CONSTRAINT stellar_systems_object_type_check
CHECK (object_type IN (
  'STAR', 'WHITE_DWARF', 'NEUTRON_STAR',
  'PULSAR', 'MAGNETAR', 'BLACK_HOLE'
));

COMMENT ON COLUMN public.stellar_systems.object_type IS 'Type de l''objet principal (STAR par défaut). WHITE_DWARF, NEUTRON_STAR, PULSAR, MAGNETAR, BLACK_HOLE via import SIMBAD.';

-- Mettre à jour les systèmes existants (tous à STAR par défaut)
UPDATE public.stellar_systems
SET object_type = 'STAR'
WHERE object_type IS NULL;
