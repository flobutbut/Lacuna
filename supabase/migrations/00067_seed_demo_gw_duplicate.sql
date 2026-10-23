-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Signaux modèles de départ : doublon du sursaut gravitationnel
--
-- Le lot copié par start_new_game (session_id = 'seed-demo', ship_id nul) contenait deux fois le même
-- sursaut gravitationnel : l'événement GW-2341-A et l'objet BNS GW-2341 (mêmes direction, durée, fréquence).
-- On garde l'événement, on retire l'objet. Les parties déjà créées gardent leur copie.
-- ═══════════════════════════════════════════════════════════════════════════════

DELETE FROM public.signals
WHERE session_id = 'seed-demo'
  AND ship_id IS NULL
  AND source_type = 'OBJECT'
  AND support = 'GRAVITATIONNEL'
  AND attributes->>'sourceName' = 'BNS GW-2341';
