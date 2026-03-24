-- 00038_signals_source_check_update.sql

ALTER TABLE signals DROP CONSTRAINT signals_source_check;

ALTER TABLE signals ADD CONSTRAINT signals_source_check CHECK (
  (
    -- OBJECT : objet orbital (system_objects)
    source_type = 'OBJECT'
    AND source_object_id IS NOT NULL
    AND source_event_id IS NULL
    AND source_system_id IS NULL
  ) OR (
    -- EVENT : événement (signal_events)
    source_type = 'EVENT'
    AND source_event_id IS NOT NULL
    AND source_object_id IS NULL
    AND source_system_id IS NULL
  ) OR (
    -- PULSAR : astre émetteur (stellar_systems)
    source_type = 'PULSAR'
    AND source_system_id IS NOT NULL
    AND source_object_id IS NULL
    AND source_event_id IS NULL
  ) OR (
    -- UNKNOWN : trace narrative, seed, origine inconnue
    source_type = 'UNKNOWN'
    AND source_object_id IS NULL
    AND source_event_id IS NULL
    AND source_system_id IS NULL
  )
);

COMMENT ON CONSTRAINT signals_source_check ON signals IS
'Exactement une source par signal selon source_type.
OBJECT → source_object_id (system_objects, artefacts futurs)
EVENT  → source_event_id (signal_events)
PULSAR → source_system_id (stellar_systems)
UNKNOWN → aucune source (traces narratives)';
