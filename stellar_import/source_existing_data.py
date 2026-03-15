#!/usr/bin/env python3
"""
Remplit field_sources pour les lignes déjà en base (stellar_systems, system_objects).
Réf. docs/LACUNA_PROCEDURAL_DATA_MODEL.md — règle absolue : ne jamais écraser une source existante.
"""
import json
import logging
import sys
from pathlib import Path
from typing import Any, Optional

from supabase_client import get_supabase_client

ROOT = Path(__file__).resolve().parent.parent

# Hiérarchie des sources (doc §4)
SOURCE_PRIORITY = {
    "JWST": 100,
    "GAIA": 100,
    "NASA": 100,
    "SIMBAD": 80,
    "HYG": 80,
    "MANUAL": 60,
    "EXTRAPOLATED": 30,
    "PROCEDURAL": 10,
}

# Systèmes narratifs (seed avant import HYG) → champs non-HYG sourcés MANUAL
NARRATIVE_SYSTEM_IDS = frozenset({
    "SOL",
    "PROXIMA",
    "BARNARD",
    "ROSS128",
    "TAU_CETI",
    "EPSILON_ERIDANI",
    "GLIESE667",
    "HD44594",
})

# Champs sourcés HYG quand valeur non NULL
STELLAR_HYG_FIELDS = (
    "spectral_type",
    "luminosity",
    "apparent_magnitude",
    "color_index",
    "distance",
    "coordinates",
)

# Champs sourcés NASA (si le système a des planètes data_source='NASA')
STELLAR_NASA_FIELDS = ("age", "spectral_type")

# Champs NASA sur system_objects (planètes)
OBJECT_NASA_FIELDS = (
    "orbital_semi_major_axis_au",
    "orbital_period_days",
    "orbital_eccentricity",
    "orbital_inclination_deg",
    "mass_earth",
    "radius_earth",
    "surface_temperature_k",
    "in_habitable_zone",
    "confirmation_status",
    "atmosphere_composition",
    "atmosphere_pressure_bar",
)

PAGE_SIZE = 1000


def _is_null(val: Any) -> bool:
    """Vrai si la valeur est considérée comme vide (NULL, chaîne vide, dict vide)."""
    if val is None:
        return True
    if isinstance(val, (dict, list)) and len(val) == 0:
        return True
    if isinstance(val, str) and val.strip() == "":
        return True
    return False


def can_write_field(
    field_name: str,
    current_value: Any,
    field_sources: dict,
    incoming_source: str,
) -> bool:
    """
    Retourne True si on peut écrire la source pour ce champ.
    Cas 1 : trou — pas de source existante → écrire
    Cas 2 : MANUAL jamais écrasé par un script
    Cas 3 : source entrante strictement plus fiable → écrire
    """
    existing_source = field_sources.get(field_name) if field_sources else None

    # Cas 1 — trou (pas de source)
    if existing_source is None:
        return True

    # MANUAL intouchable par script automatique
    if existing_source == "MANUAL":
        return False

    # Cas 2 — mise à jour par source plus fiable
    return SOURCE_PRIORITY.get(incoming_source, 0) > SOURCE_PRIORITY.get(
        existing_source, 0
    )


def _nasa_spectral_more_precise_than_hyg(current_value: Any) -> bool:
    """True si spectral_type a plus de précision qu'un type HYG court (ex. G2V = 3 car)."""
    if current_value is None or not isinstance(current_value, str):
        return False
    return len(current_value.strip()) > 3


def _get_field_sources(row: dict) -> dict:
    """Retourne le dict field_sources (jamais None)."""
    fs = row.get("field_sources")
    if fs is None:
        return {}
    if isinstance(fs, str):
        try:
            return json.loads(fs) if fs.strip() else {}
        except json.JSONDecodeError:
            return {}
    return dict(fs) if fs else {}


def _build_stellar_field_sources(
    row: dict,
    system_has_nasa_planets: bool,
    field_sources: dict,
) -> dict:
    """Construit le nouveau field_sources pour une ligne stellar_systems."""
    new_fs = dict(field_sources)
    row_id = row.get("id", "")
    is_narrative = row_id in NARRATIVE_SYSTEM_IDS

    # 1) HYG — champs non NULL
    for field in STELLAR_HYG_FIELDS:
        val = row.get(field)
        if _is_null(val):
            continue
        if can_write_field(field, val, new_fs, "HYG"):
            new_fs[field] = "HYG"

    # 2) NASA — age, spectral_type (si système a planètes NASA ; spectral_type si plus précis)
    if system_has_nasa_planets:
        for field in STELLAR_NASA_FIELDS:
            val = row.get(field)
            if _is_null(val):
                continue
            if field == "spectral_type" and new_fs.get(field) == "HYG":
                if not _nasa_spectral_more_precise_than_hyg(val):
                    continue
            if can_write_field(field, val, new_fs, "NASA"):
                new_fs[field] = "NASA"

    # 3) MANUAL — systèmes narratifs : tous les champs non NULL non déjà sourcés (sauf HYG)
    if is_narrative:
        # Colonnes susceptibles d'être renseignées sur un système (hors HYG)
        manual_candidates = (
            "name",
            "age",
            "planets",
            "habitable_zone",
            "anomaly_level",
            "constellation_abbr",
            "has_magnetic_field",
        )
        for field in manual_candidates:
            if field in STELLAR_HYG_FIELDS:
                continue
            val = row.get(field)
            if _is_null(val):
                continue
            if can_write_field(field, val, new_fs, "MANUAL"):
                new_fs[field] = "MANUAL"

    return new_fs


def _build_object_field_sources(row: dict, field_sources: dict) -> dict:
    """Construit le nouveau field_sources pour une ligne system_objects."""
    new_fs = dict(field_sources)
    data_source = (row.get("data_source") or "").strip().upper() or "PROCEDURAL"

    if data_source == "NASA":
        for field in OBJECT_NASA_FIELDS:
            val = row.get(field)
            if _is_null(val):
                continue
            if can_write_field(field, val, new_fs, "NASA"):
                new_fs[field] = "NASA"
        return new_fs

    if data_source == "PROCEDURAL":
        # Tous les champs non NULL → PROCEDURAL (sauf métadonnées)
        skip = {"id", "system_id", "parent_id", "created_at", "field_sources", "data_source"}
        for key, val in row.items():
            if key in skip or _is_null(val):
                continue
            if can_write_field(key, val, new_fs, "PROCEDURAL"):
                new_fs[key] = "PROCEDURAL"
        return new_fs

    return new_fs


def _fetch_all(client: Any, table: str, select_cols: str) -> list[dict]:
    """Récupère toutes les lignes d'une table (pagination)."""
    out = []
    offset = 0
    while True:
        resp = (
            client.table(table)
            .select(select_cols)
            .range(offset, offset + PAGE_SIZE - 1)
            .execute()
        )
        rows = resp.data or []
        if not rows:
            break
        out.extend(rows)
        offset += len(rows)
        if len(rows) < PAGE_SIZE:
            break
    return out


def run(client: Any) -> dict:
    """
    Remplit field_sources pour stellar_systems et system_objects.
    Retourne des stats : systems_updated, objects_updated, fields_sourced, narrative_ids, errors.
    """
    stats = {
        "systems_updated": 0,
        "objects_updated": 0,
        "fields_sourced": 0,
        "narrative_ids": [],
        "errors": [],
    }

    # Colonnes stellar_systems (avec field_sources)
    stellar_cols = (
        "id,name,spectral_type,distance,age,planets,habitable_zone,anomaly_level,"
        "coordinates,luminosity,color_index,apparent_magnitude,has_magnetic_field,"
        "constellation_abbr,field_sources"
    )

    # Systèmes ayant au moins une planète NASA
    try:
        resp_planets = (
            client.table("system_objects")
            .select("system_id, data_source")
            .eq("type", "PLANET")
            .execute()
        )
        rows_p = resp_planets.data or []
        system_has_nasa = frozenset(
            r["system_id"] for r in rows_p if (r.get("data_source") or "").upper() == "NASA"
        )
    except Exception as e:
        logging.exception("Erreur fetch planètes NASA")
        stats["errors"].append(f"fetch NASA planets: {e}")
        system_has_nasa = frozenset()

    # stellar_systems
    try:
        systems = _fetch_all(client, "stellar_systems", stellar_cols)
    except Exception as e:
        logging.exception("Erreur fetch stellar_systems")
        stats["errors"].append(f"fetch stellar_systems: {e}")
        systems = []

    for i, row in enumerate(systems):
        row_id = row.get("id")
        if not row_id:
            continue
        if (i + 1) % 500 == 0:
            logging.info("stellar_systems traité : %d / %d", i + 1, len(systems))
        fs = _get_field_sources(row)
        new_fs = _build_stellar_field_sources(
            row, row_id in system_has_nasa, fs
        )
        if row_id in NARRATIVE_SYSTEM_IDS:
            stats["narrative_ids"].append(row_id)
        if new_fs != fs:
            stats["fields_sourced"] += len(new_fs)
            try:
                client.table("stellar_systems").update(
                    {"field_sources": new_fs}
                ).eq("id", row_id).execute()
                stats["systems_updated"] += 1
            except Exception as e:
                stats["errors"].append(f"stellar_systems {row_id}: {e}")

    # system_objects — toutes les colonnes pour PROCEDURAL (tous champs non NULL)
    try:
        objects = _fetch_all(client, "system_objects", "*")
    except Exception as e:
        logging.exception("Erreur fetch system_objects")
        stats["errors"].append(f"fetch system_objects: {e}")
        objects = []

    for i, row in enumerate(objects):
        oid = row.get("id")
        if not oid:
            continue
        if (i + 1) % 200 == 0:
            logging.info("system_objects traité : %d / %d", i + 1, len(objects))
        fs = _get_field_sources(row)
        new_fs = _build_object_field_sources(row, fs)
        if new_fs != fs:
            stats["fields_sourced"] += len(new_fs)
            try:
                client.table("system_objects").update(
                    {"field_sources": new_fs}
                ).eq("id", oid).execute()
                stats["objects_updated"] += 1
            except Exception as e:
                stats["errors"].append(f"system_objects {oid}: {e}")

    stats["narrative_ids"] = list(dict.fromkeys(stats["narrative_ids"]))
    return stats


def main() -> int:
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

    logging.info("Remplissage field_sources (règle absolue : ne pas écraser une source existante)")
    stats = run(client)

    logging.info("=== Rapport final ===")
    logging.info("stellar_systems mis à jour : %d", stats["systems_updated"])
    logging.info("system_objects mis à jour : %d", stats["objects_updated"])
    logging.info("Champs sourcés au total (entrées field_sources) : %d", stats["fields_sourced"])
    logging.info("Systèmes narratifs MANUAL identifiés : %s", stats["narrative_ids"])
    if stats["errors"]:
        for err in stats["errors"]:
            logging.error("Erreur : %s", err)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
