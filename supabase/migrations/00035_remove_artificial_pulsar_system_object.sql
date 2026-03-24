-- Suppression de l'objet pulsar artificiel dans system_objects.
-- Les pulsars sont modélisés via stellar_systems.object_type (3918 en base).
-- system_objects reste dédié aux corps orbitaux (étoiles, planètes, lunes).

-- 1. Signaux référençant le pulsar : passer en UNKNOWN (source_object_id → NULL)
--    pour éviter violation du CHECK au DELETE (OBJECT requiert source_object_id NOT NULL)
UPDATE signals
SET source_type = 'UNKNOWN', source_object_id = NULL, source_event_id = NULL
WHERE source_type = 'OBJECT' AND source_object_id IN (
  SELECT id FROM system_objects
  WHERE system_id = 'PSR_B1919' AND type = 'PULSAR'
);

-- 2. Supprimer l'objet pulsar artificiel
DELETE FROM system_objects
WHERE system_id = 'PSR_B1919' AND type = 'PULSAR';

COMMENT ON TABLE system_objects IS 'Corps orbitaux (étoiles, planètes, lunes, disques). Les objets exotiques (pulsar, magnétar) sont dans stellar_systems.object_type.';
