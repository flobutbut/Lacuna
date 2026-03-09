-- LACUNA — Autoriser la suppression des interprétations
-- Pour l'instant : suppression ouverte (à restreindre avec auth plus tard)
CREATE POLICY "Allow delete interpretations" ON interpretations
  FOR DELETE USING (true);
