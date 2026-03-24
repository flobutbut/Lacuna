-- Migration 00036 — Ajout source_system_id dans signals
-- Permet de référencer stellar_systems directement
-- pour les pulsars, astres et futures sources non-orbitales.
-- source_system_id et source_object_id sont mutuellement
-- exclusifs selon la nature de la source.

ALTER TABLE signals
ADD COLUMN IF NOT EXISTS source_system_id TEXT
REFERENCES stellar_systems(id) ON DELETE SET NULL;

-- Index pour les lookups par système source
CREATE INDEX IF NOT EXISTS idx_signals_source_system_id
ON signals(source_system_id)
WHERE source_system_id IS NOT NULL;

-- Index pour la déduplication dans compute_pulsar_signals
CREATE INDEX IF NOT EXISTS idx_signals_session_source_system
ON signals(session_id, source_system_id)
WHERE source_system_id IS NOT NULL;

-- Commentaire de documentation
COMMENT ON COLUMN signals.source_system_id IS
'Référence vers stellar_systems pour les sources qui sont
des astres (pulsars, étoiles à neutrons, etc.).
Mutuellement exclusif avec source_object_id.
source_object_id → system_objects (objets orbitaux, artefacts futurs)
source_system_id → stellar_systems (astres émetteurs)';
