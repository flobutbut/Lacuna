#!/usr/bin/env python3
"""
Peuplement des tables constellations et constellation_lines.
Étape 5 : 88 constellations IAU
Étape 6 : lignes stick-figure depuis constellation.shapes.iau.txt (paires HR explicites → stellar_systems.id via HYG)
"""
import logging
import sys
from pathlib import Path
from typing import Any, Optional

import pandas as pd

from parse_hyg import build_system_id, parse_hyg_file, _valid_str
from supabase_client import get_supabase_client

ROOT = Path(__file__).resolve().parent.parent
HYG_PATHS = [
    ROOT / "Ressources" / "hyg_v42.csv",
    ROOT / "resources" / "hyg_v42.csv",
]
IAU_SHAPES_PATH = ROOT / "Ressources" / "constellation.shapes.iau.txt"

# 88 constellations IAU : abbr, name_latin, name_fr, genitive (Wikipedia / IAU)
IAU_88 = [
    ("And", "Andromeda", "Andromède", "Andromedae"),
    ("Ant", "Antlia", "Machine pneumatique", "Antliae"),
    ("Aps", "Apus", "Oiseau de paradis", "Apodis"),
    ("Aqr", "Aquarius", "Verseau", "Aquarii"),
    ("Aql", "Aquila", "Aigle", "Aquilae"),
    ("Ara", "Ara", "Autel", "Arae"),
    ("Ari", "Aries", "Bélier", "Arietis"),
    ("Aur", "Auriga", "Cocher", "Aurigae"),
    ("Boo", "Boötes", "Bouvier", "Boötis"),
    ("Cae", "Caelum", "Burin", "Caeli"),
    ("Cam", "Camelopardalis", "Girafe", "Camelopardalis"),
    ("Cnc", "Cancer", "Cancer", "Cancri"),
    ("CVn", "Canes Venatici", "Chiens de chasse", "Canum Venaticorum"),
    ("CMa", "Canis Major", "Grand Chien", "Canis Majoris"),
    ("CMi", "Canis Minor", "Petit Chien", "Canis Minoris"),
    ("Cap", "Capricornus", "Capricorne", "Capricorni"),
    ("Car", "Carina", "Carène", "Carinae"),
    ("Cas", "Cassiopeia", "Cassiopée", "Cassiopeiae"),
    ("Cen", "Centaurus", "Centaure", "Centauri"),
    ("Cep", "Cepheus", "Céphée", "Cephei"),
    ("Cet", "Cetus", "Baleine", "Ceti"),
    ("Cha", "Chamaeleon", "Caméléon", "Chamaeleontis"),
    ("Cir", "Circinus", "Compas", "Circini"),
    ("Col", "Columba", "Colombe", "Columbae"),
    ("Com", "Coma Berenices", "Chevelure de Bérénice", "Comae Berenices"),
    ("CrA", "Corona Australis", "Couronne australe", "Coronae Australis"),
    ("CrB", "Corona Borealis", "Couronne boréale", "Coronae Borealis"),
    ("Crv", "Corvus", "Corbeau", "Corvi"),
    ("Crt", "Crater", "Cratère", "Crateris"),
    ("Cru", "Crux", "Croix du Sud", "Crucis"),
    ("Cyg", "Cygnus", "Cygne", "Cygni"),
    ("Del", "Delphinus", "Dauphin", "Delphini"),
    ("Dor", "Dorado", "Dorade", "Doradus"),
    ("Dra", "Draco", "Dragon", "Draconis"),
    ("Equ", "Equuleus", "Petit Cheval", "Equulei"),
    ("Eri", "Eridanus", "Éridan", "Eridani"),
    ("For", "Fornax", "Fourneau", "Fornacis"),
    ("Gem", "Gemini", "Gémeaux", "Geminorum"),
    ("Gru", "Grus", "Grue", "Gruis"),
    ("Her", "Hercules", "Hercule", "Herculis"),
    ("Hor", "Horologium", "Horloge", "Horologii"),
    ("Hya", "Hydra", "Hydre", "Hydrae"),
    ("Hyi", "Hydrus", "Hydre mâle", "Hydri"),
    ("Ind", "Indus", "Indien", "Indi"),
    ("Lac", "Lacerta", "Lézard", "Lacertae"),
    ("Leo", "Leo", "Lion", "Leonis"),
    ("LMi", "Leo Minor", "Petit Lion", "Leonis Minoris"),
    ("Lep", "Lepus", "Lièvre", "Leporis"),
    ("Lib", "Libra", "Balance", "Librae"),
    ("Lup", "Lupus", "Loup", "Lupi"),
    ("Lyn", "Lynx", "Lynx", "Lyncis"),
    ("Lyr", "Lyra", "Lyre", "Lyrae"),
    ("Men", "Mensa", "Table", "Mensae"),
    ("Mic", "Microscopium", "Microscope", "Microscopii"),
    ("Mon", "Monoceros", "Licorne", "Monocerotis"),
    ("Mus", "Musca", "Mouche", "Muscae"),
    ("Nor", "Norma", "Règle", "Normae"),
    ("Oct", "Octans", "Octant", "Octantis"),
    ("Oph", "Ophiuchus", "Ophiuchus", "Ophiuchi"),
    ("Ori", "Orion", "Orion", "Orionis"),
    ("Pav", "Pavo", "Paon", "Pavonis"),
    ("Peg", "Pegasus", "Pégase", "Pegasi"),
    ("Per", "Perseus", "Persée", "Persei"),
    ("Phe", "Phoenix", "Phénix", "Phoenicis"),
    ("Pic", "Pictor", "Peintre", "Pictoris"),
    ("Psc", "Pisces", "Poissons", "Piscium"),
    ("PsA", "Piscis Austrinus", "Poisson austral", "Piscis Austrini"),
    ("Pup", "Puppis", "Poupe", "Puppis"),
    ("Pyx", "Pyxis", "Boussole", "Pyxidis"),
    ("Ret", "Reticulum", "Réticule", "Reticuli"),
    ("Sge", "Sagitta", "Flèche", "Sagittae"),
    ("Sgr", "Sagittarius", "Sagittaire", "Sagittarii"),
    ("Sco", "Scorpius", "Scorpion", "Scorpii"),
    ("Scl", "Sculptor", "Sculpteur", "Sculptoris"),
    ("Sct", "Scutum", "Écu", "Scuti"),
    ("Ser", "Serpens", "Serpent", "Serpentis"),
    ("Sex", "Sextans", "Sextant", "Sextantis"),
    ("Tau", "Taurus", "Taureau", "Tauri"),
    ("Tel", "Telescopium", "Télescope", "Telescopii"),
    ("Tri", "Triangulum", "Triangle", "Trianguli"),
    ("TrA", "Triangulum Australe", "Triangle austral", "Trianguli Australis"),
    ("Tuc", "Tucana", "Toucan", "Tucanae"),
    ("UMa", "Ursa Major", "Grande Ourse", "Ursae Majoris"),
    ("UMi", "Ursa Minor", "Petite Ourse", "Ursae Minoris"),
    ("Vel", "Vela", "Voiles", "Velorum"),
    ("Vir", "Virgo", "Vierge", "Virginis"),
    ("Vol", "Volans", "Poisson volant", "Volantis"),
    ("Vul", "Vulpecula", "Petit Renard", "Vulpeculae"),
]


def _build_hr_to_stellar_id(df_hyg: pd.DataFrame) -> dict[int, str]:
    """
    Construit le mapping HR (Yale Bright Star) → stellar_systems.id.
    Utilise le même filtrage que parse_hyg (dist < 153.4 pc).
    """
    hr_to_id = {}
    for _, row in df_hyg.iterrows():
        hr_val = row.get("hr")
        if not _valid_str(hr_val):
            continue
        try:
            hr = int(float(hr_val))
        except (ValueError, TypeError):
            continue
        sid = build_system_id(row)
        if sid:
            hr_to_id[hr] = sid
    return hr_to_id


def _parse_iau_segments(path: Path) -> list[tuple[str, int, int]]:
    """
    Parse constellation.shapes.iau.txt (tab-delimited).
    Retourne [(abbr, hr1, hr2), ...] pour chaque segment défini.
    """
    segments = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split("\t")
            if len(parts) < 8:
                continue
            con = parts[0].strip()
            try:
                hr1 = int(float(parts[1]))
                hr2 = int(float(parts[7]))
            except (ValueError, TypeError):
                continue
            if con not in {a for a, _, _, _ in IAU_88}:
                continue
            segments.append((con, hr1, hr2))
    return segments


def run_constellations(client: Any) -> int:
    """Étape 5 : insérer les 88 constellations IAU."""
    rows = [
        {"abbr": abbr, "name_latin": lat, "name_fr": fr or None, "genitive": gen}
        for abbr, lat, fr, gen in IAU_88
    ]
    try:
        client.table("constellations").upsert(rows, on_conflict="abbr", ignore_duplicates=False).execute()
        logging.info("88 constellations insérées.")
        return len(rows)
    except Exception as e:
        logging.exception("Erreur insert constellations: %s", e)
        return 0


def run_constellation_lines(client: Any, only_abbr: Optional[str] = None) -> int:
    """
    Étape 6 : parser constellation.shapes.iau.txt (paires HR explicites).
    Pour chaque segment (CON, HR1, HR2) : HR → stellar_systems.id via HYG.
    """
    if not IAU_SHAPES_PATH.exists():
        raise FileNotFoundError(f"Fichier IAU non trouvé : {IAU_SHAPES_PATH}")

    df = parse_hyg_file()
    hr_to_id = _build_hr_to_stellar_id(df)
    logging.info("HYG : %d étoiles avec HR → stellar_systems.id", len(hr_to_id))

    existing_ids = set()
    offset = 0
    while True:
        resp = client.table("stellar_systems").select("id").range(offset, offset + 999).execute()
        rows = resp.data or []
        if not rows:
            break
        existing_ids.update(r["id"] for r in rows)
        offset += 1000
        if len(rows) < 1000:
            break
    logging.info("stellar_systems : %d ids existants", len(existing_ids))

    raw_segments = _parse_iau_segments(IAU_SHAPES_PATH)
    if only_abbr:
        raw_segments = [(a, h1, h2) for a, h1, h2 in raw_segments if a == only_abbr]

    segments = []
    seen_pairs: set[tuple[str, frozenset]] = set()
    hr_not_found: set[int] = set()
    id_not_in_db: set[str] = set()
    sort_order = 0

    for abbr, hr1, hr2 in raw_segments:
        id1 = hr_to_id.get(hr1)
        id2 = hr_to_id.get(hr2)
        if id1 is None:
            hr_not_found.add(hr1)
        if id2 is None:
            hr_not_found.add(hr2)
        if id1 is None or id2 is None:
            continue
        if id1 not in existing_ids:
            id_not_in_db.add(id1)
        if id2 not in existing_ids:
            id_not_in_db.add(id2)
        if id1 not in existing_ids or id2 not in existing_ids:
            continue
        if id1 == id2:
            continue
        pair = (abbr, frozenset({id1, id2}))
        if pair in seen_pairs:
            continue
        seen_pairs.add(pair)
        segments.append({
            "constellation_abbr": abbr,
            "star_from": id1,
            "star_to": id2,
            "sort_order": sort_order,
        })
        sort_order += 1

    if hr_not_found and only_abbr:
        logging.warning("[%s] HR non trouvés dans HYG (dist<500al) : %s", only_abbr, sorted(hr_not_found)[:20])
    if id_not_in_db and only_abbr:
        logging.warning("[%s] Id HYG absents de stellar_systems : %s", only_abbr, list(id_not_in_db)[:10])

    if not segments:
        logging.warning(
            "Aucun segment constellation_lines trouvé%s.",
            f" pour {only_abbr}" if only_abbr else "",
        )
        return 0

    try:
        if only_abbr:
            client.table("constellation_lines").delete().eq(
                "constellation_abbr", only_abbr
            ).execute()
            logging.info("[%s] Anciens segments supprimés.", only_abbr)
        client.table("constellation_lines").insert(segments).execute()
        logging.info(
            "%d segments constellation_lines insérés%s.",
            len(segments),
            f" pour {only_abbr}" if only_abbr else "",
        )
        return len(segments)
    except Exception as e:
        logging.exception("Erreur insert constellation_lines: %s", e)
        return 0


def main() -> int:
    import argparse
    parser = argparse.ArgumentParser(description="Peupler constellations et constellation_lines")
    parser.add_argument("--lines-only", metavar="ABBR", help="Exécuter uniquement constellation_lines pour ABBR (ex: UMi)")
    parser.add_argument("--truncate", action="store_true", help="TRUNCATE constellation_lines avant peuplement complet")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[logging.StreamHandler(sys.stderr)],
    )
    try:
        client = get_supabase_client()
    except RuntimeError as e:
        logging.error("%s", e)
        return 1

    if args.lines_only:
        n2 = run_constellation_lines(client, only_abbr=args.lines_only)
        logging.info("=== Terminé : %d segments pour %s ===", n2, args.lines_only)
        return 0

    if args.truncate:
        for abbr, _, _, _ in IAU_88:
            client.table("constellation_lines").delete().eq("constellation_abbr", abbr).execute()
        logging.info("constellation_lines vidée (DELETE par constellation).")

    n1 = run_constellations(client)
    n2 = run_constellation_lines(client)
    logging.info("=== Terminé : %d constellations, %d segments ===", n1, n2)
    return 0


if __name__ == "__main__":
    sys.exit(main())
