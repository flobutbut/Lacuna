/**
 * Génère le SQL d'insertion pour les systèmes stellaires étendus
 * Usage: node scripts/generateExtendedSeed.js
 */

import { extendedSystems } from './starSystemsData.js';

const escape = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  return "'" + String(v).replace(/'/g, "''") + "'";
};

const systemsValues = extendedSystems.map((s) => {
  const coords = `'{"ra": ${s.ra}, "dec": ${s.dec}}'`;
  return `  ('${s.id}', ${escape(s.name)}, ${escape(s.spec)}, ${s.dist}, ${escape(s.age)}, ${s.pnum}, ${s.hz}, ${s.anom}, ${coords})`;
});

const objectsParts = [];
extendedSystems.forEach((s) => {
  // Étoile
  const stellarActivity = s.spec?.startsWith('M') ? (s.anom > 0 ? "'ACTIVE'" : "'CALM'") : 'NULL';
  objectsParts.push(
    `INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('${s.id}', 'STAR', 'a', ${escape(s.name)}, 0, ${escape(s.spec)}, ${stellarActivity}, ${s.starMass ?? 'NULL'});`
  );
  // Planètes
  (s.planets || []).forEach((p, i) => {
    const hzType = p.hz ? (p.mass < 3 ? "'TEMPERATE'" : "'INTERNAL'") : 'NULL';
    objectsParts.push(
      `INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('${s.id}', 'PLANET', '${p.des}', ${escape(p.name)}, ${i + 1}, ${p.period}, ${p.mass}, ${p.hz}, ${hzType});`
    );
  });
});

const sql = `-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Systèmes stellaires étendus (~100 systèmes, données scientifiques)
-- Généré par scripts/generateExtendedSeed.js — Mars 2026
-- Sources : NASA Exoplanet Archive, Wikipedia, catalogues Gliese/HD
-- ═══════════════════════════════════════════════════════════════════════════════

-- Systèmes stellaires
INSERT INTO stellar_systems (id, name, spectral_type, distance, age, planets, habitable_zone, anomaly_level, coordinates)
VALUES
${systemsValues.join(',\n')}
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  spectral_type = EXCLUDED.spectral_type,
  distance = EXCLUDED.distance,
  age = EXCLUDED.age,
  planets = EXCLUDED.planets,
  habitable_zone = EXCLUDED.habitable_zone,
  anomaly_level = EXCLUDED.anomaly_level,
  coordinates = EXCLUDED.coordinates;

-- Objets des systèmes (étoiles + planètes)
${objectsParts.join('\n')}
`;

console.log(sql);
