-- LACUNA — Table lab_reports (rapports d'analyse persistés)
-- Mars 2026

CREATE TABLE IF NOT EXISTS lab_reports (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  observation_id UUID NOT NULL REFERENCES observations(id) ON DELETE CASCADE,
  instrument_id TEXT NOT NULL,
  instrument TEXT NOT NULL,
  fiability INT NOT NULL,
  date TEXT,
  duration TEXT,
  duration_sec INT,
  anomalous BOOLEAN DEFAULT false,
  results TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_reports_observation ON lab_reports(observation_id);

ALTER TABLE lab_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all lab_reports for prototype" ON lab_reports FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE lab_reports IS 'Rapports d''analyse des instruments du Laboratoire';
