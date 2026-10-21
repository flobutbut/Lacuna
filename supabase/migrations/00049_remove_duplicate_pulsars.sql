-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Catalogue : suppression des 16 pulsars en double
--
-- DESTRUCTIF : supprime 16 lignes de stellar_systems et les signaux qui en proviennent.
-- Sauvegarde obligatoire avant.
--
-- L'import du catalogue a créé 16 pulsars en double : même position, même période et mêmes
-- attributs, sous deux noms (désignation B tronquée « B1749-28.3 », double nom B / J, préfixe
-- de catalogue « [KKL2015] »…). Le radar recevait alors deux fois le même pulsar.
-- On garde la désignation canonique ; J1825-33 et J1953+30, de même période mais à des
-- positions différentes, sont deux pulsars distincts et restent.
--
-- Chaque suppression n'a lieu que si le pulsar gardé existe, à la même position et avec la même
-- période : la migration ne supprime rien si le catalogue a changé entre-temps.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TEMP TABLE duplicate_pulsars (duplicate_id TEXT PRIMARY KEY, kept_id TEXT NOT NULL);

INSERT INTO duplicate_pulsars (duplicate_id, kept_id) VALUES
  ('psr-b1913+16-7',   'psr-j1915+1606'),
  ('psr-j1717-4043b',  'psr-j1717-4043a'),
  ('psr-b1913+10-5',   'psr-b1913+10'),
  ('psr-b1855+02-1',   'psr-b1855+02'),
  ('psr-b1925+18-8',   'psr-j1927+1852'),
  ('psr-b1749-28-3',   'psr-b1749-28'),
  ('psr-b1844-04-6',   'psr-b1844-04'),
  ('psr-b1911+11-6',   'psr-b1911+11'),
  ('psr-b1737-30-8',   'psr-b1737-30-2'),
  ('psr-b1647-52-8',   'psr-b1647-52'),
  ('psr-b1906+09-1',   'psr-b1906+09'),
  ('psr-j1746-2850i',  'psr-j1746-2850'),
  ('kkl2015-j1332-03', 'psr-j1332-03'),
  ('psr-b1530-53-9',   'psr-b1530-53'),
  ('psr-b1839-04-3',   'psr-b1839-04'),
  ('psr-b1740-31-8',   'psr-b1740-31');

-- Seulement les vrais doublons : pulsar gardé présent, même position, même période
DELETE FROM duplicate_pulsars d
WHERE NOT EXISTS (
  SELECT 1
  FROM public.stellar_systems dup
  JOIN public.stellar_systems kept ON kept.id = d.kept_id
  WHERE dup.id = d.duplicate_id
    AND dup.object_type = 'PULSAR'
    AND kept.object_type = 'PULSAR'
    AND dup.coordinates = kept.coordinates
    AND dup.attributes->>'pulse_period_s' = kept.attributes->>'pulse_period_s'
);

-- Signaux issus des doublons (la clé étrangère les garderait sans source)
DELETE FROM public.signals s
USING duplicate_pulsars d
WHERE s.source_system_id = d.duplicate_id
   OR s.attributes->>'source_system_id' = d.duplicate_id;

DELETE FROM public.stellar_systems ss
USING duplicate_pulsars d
WHERE ss.id = d.duplicate_id;

DROP TABLE duplicate_pulsars;
