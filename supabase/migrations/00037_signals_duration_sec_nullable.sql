-- 00037_signals_duration_sec_nullable.sql
ALTER TABLE signals
ALTER COLUMN duration_sec DROP NOT NULL;

COMMENT ON COLUMN signals.duration_sec IS
'Durée du signal en secondes. NULL pour les sources
continues (pulsars, trous noirs X). Renseigné pour
les signaux discrets (bursts, événements ponctuels).';
