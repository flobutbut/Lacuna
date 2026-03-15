-- Correction SOL : origine référentiel galactique (x,y,z = 0), magnitude et luminosité
-- Sol exclu de l'import HYG (dist=0) ; ces valeurs sont nécessaires pour get_visible_systems
-- quand le joueur stationne ailleurs (ex. PROXIMA) et voit Sol dans le ciel.
UPDATE stellar_systems
SET
  coordinates = COALESCE(coordinates, '{}'::jsonb) || '{"x": 0, "y": 0, "z": 0}'::jsonb,
  apparent_magnitude = -26.74,
  luminosity = 1.0
WHERE id = 'SOL';

COMMENT ON COLUMN public.stellar_systems.coordinates IS 'x,y,z en al (référentiel galactique, Sol à l''origine). Sol = (0,0,0).';
