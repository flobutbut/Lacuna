-- LACUNA — Colonne attributes sur stellar_systems (paramètres pulsars ATNF)
-- Mars 2026 — pulse_period_s, rotation_frequency_hz, magnetic_field_gauss, etc.

ALTER TABLE public.stellar_systems
ADD COLUMN IF NOT EXISTS attributes jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.stellar_systems.attributes IS 'Données extensibles (paramètres pulsars ATNF : pulse_period_s, magnetic_field_gauss, emission_width_w50_ms, etc.).';
