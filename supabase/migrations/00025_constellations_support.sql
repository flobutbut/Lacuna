-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Support des constellations (IAU)
-- stellar_systems.constellation_abbr, table constellations, constellation_lines
-- ═══════════════════════════════════════════════════════════════════════════════

-- Étape 1 — Champ constellation sur stellar_systems
ALTER TABLE public.stellar_systems
  ADD COLUMN IF NOT EXISTS constellation_abbr text;

COMMENT ON COLUMN public.stellar_systems.constellation_abbr IS 'Code IAU 3 lettres : ORI, CEN, UMA, CYG, etc. NULL si non assignée. Source HYG colonne con.';

-- Étape 2 — Table constellations
CREATE TABLE IF NOT EXISTS public.constellations (
  abbr text PRIMARY KEY,
  name_latin text NOT NULL,
  name_fr text,
  genitive text,
  ra_center numeric,
  dec_center numeric,
  area_sq_deg numeric,
  stars_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.constellations IS '88 constellations IAU avec abbr, noms, genitif (Bayer), centre visuel.';
COMMENT ON COLUMN public.constellations.genitive IS 'Forme génitive pour désignations Bayer (Orionis, Centauri, etc.)';

-- Étape 3 — Table des lignes de constellation (stick figures)
CREATE TABLE IF NOT EXISTS public.constellation_lines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  constellation_abbr text NOT NULL,
  star_from text NOT NULL,
  star_to text NOT NULL,
  sort_order integer DEFAULT 0,
  CONSTRAINT constellation_lines_pkey PRIMARY KEY (id),
  CONSTRAINT constellation_lines_constellation_fkey
    FOREIGN KEY (constellation_abbr) REFERENCES public.constellations(abbr) ON DELETE CASCADE,
  CONSTRAINT constellation_lines_from_fkey
    FOREIGN KEY (star_from) REFERENCES public.stellar_systems(id) ON DELETE CASCADE,
  CONSTRAINT constellation_lines_to_fkey
    FOREIGN KEY (star_to) REFERENCES public.stellar_systems(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_constellation_lines_abbr ON public.constellation_lines(constellation_abbr);

COMMENT ON TABLE public.constellation_lines IS 'Segments stick-figure pour dessiner les constellations. star_from/star_to = stellar_systems.id.';
