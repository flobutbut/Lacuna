"""
Logique upsert system_objects (planètes).
- Résolution hostname NASA → system_id
- Champs protégés : attributes, emits_signals, emission_*, atmosphere_composition,
  magnetic_field_detected, created_at
"""
import logging
import uuid
from typing import Any, Optional

from supabase import Client

from upsert_systems import fetch_existing_systems, resolve_hostname_to_system_id

PROTECTED_FIELDS = {
    "attributes",
    "emits_signals",
    "emission_support",
    "emission_pattern",
    "emission_frequency_hz",
    "emission_direction",
    "atmosphere_composition",
    "magnetic_field_detected",
    "created_at",
}


def upsert_planets_batch(
    client: Client,
    planets: list[dict[str, Any]],
    existing_systems: dict[str, dict],
    existing_planets: dict[tuple[str, str], dict],
    stats: dict[str, int],
    corrections: list[str],
    unresolved_hosts: Optional[set] = None,
) -> None:
    """
    Upsert un lot de planètes (system_objects type PLANET).
    existing_planets: {(system_id, designation): row}
    """
    to_upsert = []

    for p in planets:
        hostname = p.get("hostname")
        designation = p.get("designation")
        if not hostname or not designation:
            continue

        system_id = resolve_hostname_to_system_id(hostname, existing_systems, unresolved_hosts)
        if not system_id:
            logging.warning("[SKIP] planète %s : hôte %s non trouvé", p.get("name"), hostname)
            continue

        key = (system_id, designation.lower())
        existing = existing_planets.get(key)

        try:
            payload = _build_planet_payload(p, system_id)
            if not payload:
                continue

            if existing:
                merged = _merge_planet(existing, payload, key, stats, corrections)
                if merged:
                    to_upsert.append(merged)
            else:
                payload["id"] = str(uuid.uuid4())
                to_upsert.append(payload)
                stats["inserted"] += 1

        except Exception as e:
            stats["errors"] += 1
            logging.exception("[ERREUR] planète %s : %s", p.get("name"), e)

    to_upsert = [r for r in to_upsert if r.get("system_id")]
    if to_upsert:
        client.table("system_objects").upsert(
            to_upsert,
            on_conflict="id",
            ignore_duplicates=False,
        ).execute()


def _build_planet_payload(p: dict, system_id: str) -> Optional[dict]:
    out = {
        "system_id": system_id,
        "type": "PLANET",
        "designation": p.get("designation"),
        "name": p.get("name"),
        "sort_order": p.get("sort_order", 0),
        "orbital_period_days": p.get("orbital_period_days"),
        "radius_earth": p.get("radius_earth"),
        "mass_earth": p.get("mass_earth"),
        "orbital_semi_major_axis_au": p.get("orbital_semi_major_axis_au"),
        "orbital_eccentricity": p.get("orbital_eccentricity"),
        "surface_temperature_k": p.get("surface_temperature_k"),
        "in_habitable_zone": p.get("in_habitable_zone", False),
        "confirmation_status": p.get("confirmation_status", "CONFIRMED"),
    }
    return {k: v for k, v in out.items() if v is not None or k in ("in_habitable_zone",)}


def _merge_planet(
    existing: dict,
    incoming: dict,
    key: tuple[str, str],
    stats: dict,
    corrections: list,
) -> Optional[dict]:
    payload = {"id": existing.get("id")}
    changed = False

    for k, v in incoming.items():
        if k in PROTECTED_FIELDS or k == "id":
            continue
        ev = existing.get(k)
        if ev != v and v is not None:
            payload[k] = v
            changed = True
            corrections.append(
                f"[CORRECTION] planète: {key[0]}/{key[1]} | champ: {k} | ancien: {ev} | nouveau: {v}"
            )

    if not changed:
        stats["ignored"] += 1
        return None

    stats["corrected"] += 1
    return payload


def fetch_existing_planets(client: Client) -> dict[tuple[str, str], dict]:
    """Récupère les planètes existantes indexées par (system_id, designation)."""
    resp = client.table("system_objects").select("id,system_id,designation,*").eq("type", "PLANET").execute()
    out = {}
    for row in resp.data or []:
        sid = row.get("system_id")
        des = (row.get("designation") or "").strip().lower()
        if sid and des:
            out[(sid, des)] = row
    return out


def update_habitable_zone_from_planets(client: Client) -> int:
    """
    Met à jour stellar_systems.habitable_zone = true si au moins une planète
    du système a in_habitable_zone = true. Retourne le nombre de systèmes mis à jour.
    """
    planets = client.table("system_objects").select("system_id").eq("type", "PLANET").eq("in_habitable_zone", True).execute()
    system_ids = {p["system_id"] for p in (planets.data or []) if p.get("system_id")}
    if not system_ids:
        return 0
    count = 0
    for sid in system_ids:
        r = client.table("stellar_systems").update({"habitable_zone": True}).eq("id", sid).execute()
        if r.data:
            count += 1
    return count
