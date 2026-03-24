#!/usr/bin/env python3
"""
Enrichit les pulsars (stellar_systems.object_type = PULSAR) avec le flux 1400 MHz
et un indice spectral type SPINDX, via VizieR TAP (catalogue ATNF « B/psr/psr »).

Colonnes VizieR utilisées : PSRJ, Name, S1400, S400.
La table ne contient pas de colonne SPINDX ; on calcule α = ln(S1400/S400) / ln(1400/400)
lorsque S400 et S1400 sont strictement positifs (géométrie S ∝ ν^α).

Ne pas écraser field_sources / attributs si attributes est marqué MANUAL (même règle
que atnf_pulsar_patch.py).

Les lignes qui ont déjà attributes.s1400_mjy ne sont pas requêtées sur VizieR et ne sont
pas réécrites (idempotence). En cas d’échec TAP sur un lot (timeout, DNS…), jusqu’à
TAP_MAX_RETRIES tentatives avec backoff ; puis passage au lot suivant sans arrêter le run.

Usage :
  python atnf_flux_patch.py              # dry-run
  python atnf_flux_patch.py --apply        # écritures Supabase
  python atnf_flux_patch.py --apply --limit 50
  python atnf_flux_patch.py --pulsar <uuid>
"""
from __future__ import annotations

import argparse
import json
import logging
import math
import re
import sys
import time
from typing import Any, Optional

import requests

from supabase_client import get_supabase_client

VIZIER_TAP_URL = "https://tapvizier.cds.unistra.fr/TAPVizieR/tap/sync"
VIZIER_TABLE = '"B/psr/psr"'
# Courtoisie envers le service TAP CDS
TAP_SLEEP_SEC = 0.25
# Taille des lots de noms pour une requête IN (évite requêtes trop lourdes)
BATCH_TOKENS = 55
# Nouvelles tentatives TAP après timeout / erreur réseau
TAP_MAX_RETRIES = 4
TAP_RETRY_BASE_SEC = 0.75


def _already_has_s1400(attributes: Any) -> bool:
    """True si s1400_mjy est déjà renseigné (pas de requête VizieR ni réécriture)."""
    if not attributes or not isinstance(attributes, dict):
        return False
    v = attributes.get("s1400_mjy")
    if v is None:
        return False
    if isinstance(v, str) and not v.strip():
        return False
    return True


def sql_string_literal(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def vizier_tokens_from_db_name(name: str) -> list[str]:
    """
    Déduit les identifiants utilisables pour PSRJ / Name dans VizieR
    à partir du nom Lacuna (ex. « PSR B0538-75 », « PSR J1015-5359 »).
    """
    raw = (name or "").strip()
    if not raw:
        return []
    tokens: list[str] = []

    stripped = re.sub(r"^psr\s+", "", raw, flags=re.IGNORECASE).strip()
    if stripped:
        tokens.append(stripped)
        tokens.append(stripped.replace(" ", ""))

    m = re.search(r"[jb]\d{4}[+-]\d{2,4}", raw, re.IGNORECASE)
    if m:
        compact = re.sub(r"\s+", "", m.group(0))
        tokens.append(compact)

    seen: set[str] = set()
    out: list[str] = []
    for t in tokens:
        t = t.strip()
        if t and t not in seen:
            seen.add(t)
            out.append(t)
    return out


def compute_spindx_from_fluxes(s400: Any, s1400: Any) -> Optional[float]:
    """Indice spectral α (même convention que SPINDX ATNF quand dérivé de deux flux)."""
    try:
        f400 = float(s400)
        f14 = float(s1400)
        if f400 <= 0 or f14 <= 0:
            return None
        return math.log(f14 / f400) / math.log(1400.0 / 400.0)
    except (TypeError, ValueError):
        return None


def _tap_rows_to_dicts(data: dict[str, Any]) -> list[dict[str, Any]]:
    meta = data.get("metadata") or []
    rows = data.get("data") or []
    colnames = [m.get("name") for m in meta]
    out: list[dict[str, Any]] = []
    for row in rows:
        if len(row) != len(colnames):
            continue
        out.append(dict(zip(colnames, row)))
    return out


def fetch_flux_from_vizier(name_tokens: list[str]) -> list[dict[str, Any]]:
    """
    Récupère S1400, S400 depuis VizieR TAP pour une liste de noms (PSRJ ou Name ATNF).

    name_tokens : ex. ['J1015-5359', 'B0538-75', 'B0538-75']
    """
    uniq = []
    seen: set[str] = set()
    for t in name_tokens:
        t = (t or "").strip()
        if t and t not in seen:
            seen.add(t)
            uniq.append(t)
    if not uniq:
        return []

    in_list = ", ".join(sql_string_literal(t) for t in uniq)
    query = f"""
        SELECT "PSRJ", "Name", "S1400", "S400"
        FROM {VIZIER_TABLE}
        WHERE "PSRJ" IN ({in_list})
           OR "Name" IN ({in_list})
    """
    last_err: Optional[BaseException] = None
    payload: Any = None
    for attempt in range(TAP_MAX_RETRIES):
        try:
            resp = requests.post(
                VIZIER_TAP_URL,
                data={
                    "REQUEST": "doQuery",
                    "LANG": "ADQL",
                    "FORMAT": "json",
                    "QUERY": query.strip(),
                },
                timeout=90,
            )
            resp.raise_for_status()
            payload = resp.json()
            break
        except (requests.RequestException, json.JSONDecodeError, ValueError) as e:
            last_err = e
            if attempt + 1 < TAP_MAX_RETRIES:
                time.sleep(TAP_RETRY_BASE_SEC * (2**attempt))
    if payload is None:
        logging.getLogger("atnf_flux").warning(
            "VizieR TAP : abandon du lot après %d tentatives (%s)",
            TAP_MAX_RETRIES,
            last_err or "erreur inconnue",
        )
        return []
    if not isinstance(payload, dict):
        return []
    # Erreur TAP renvoie parfois un corps JSON minimal ou XML selon FORMAT
    if payload.get("metadata") is None and not payload.get("data"):
        return []
    return _tap_rows_to_dicts(payload)


def _find_vizier_row_for_tokens(
    tokens: list[str], by_psrj: dict[str, dict], by_name: dict[str, dict]
) -> Optional[dict[str, Any]]:
    for t in tokens:
        t = t.strip()
        if not t:
            continue
        r = by_psrj.get(t) or by_name.get(t)
        if r:
            return r
        # VizieR Name sans espaces
        r = by_name.get(t.replace(" ", ""))
        if r:
            return r
    return None


def _can_write_attributes(field_sources: dict) -> bool:
    return field_sources.get("attributes") != "MANUAL"


def _merge_flux_attrs(
    existing: dict, s1400: Optional[float], spindx: Optional[float]
) -> dict[str, Any]:
    merged = dict(existing or {})
    if s1400 is not None:
        merged["s1400_mjy"] = round(s1400, 6)
    if spindx is not None:
        merged["spindx"] = round(spindx, 6)
    return merged


def run(
    *,
    apply: bool = False,
    limit: Optional[int] = None,
    pulsar_ids: Optional[list[str]] = None,
) -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
    )
    log = logging.getLogger("atnf_flux")

    try:
        sb = get_supabase_client()
    except RuntimeError as e:
        log.error("%s", e)
        return 1

    base = sb.table("stellar_systems").select("id,name,attributes,field_sources").eq(
        "object_type", "PULSAR"
    )
    if pulsar_ids:
        ids = [p.strip() for p in pulsar_ids if p and str(p).strip()]
        if ids:
            base = base.in_("id", ids)
        resp = base.execute()
        pulsars = list(resp.data or [])
    else:
        pulsars = []
        fetch_batch = 1000
        offset = 0
        while True:
            resp = base.range(offset, offset + fetch_batch - 1).execute()
            chunk = resp.data or []
            if not chunk:
                break
            pulsars.extend(chunk)
            if len(chunk) < fetch_batch:
                break
            offset += fetch_batch
    if limit is not None:
        pulsars = pulsars[: max(0, limit)]

    log.info("Pulsars à traiter : %d", len(pulsars))
    if not pulsars:
        return 0

    pulsars_sans_s1400 = [p for p in pulsars if not _already_has_s1400(p.get("attributes"))]
    deja_ok = len(pulsars) - len(pulsars_sans_s1400)
    log.info("Déjà avec s1400_mjy (ignorés, pas d’appel VizieR) : %d", deja_ok)
    log.info("Pulsars encore sans s1400_mjy : %d", len(pulsars_sans_s1400))

    # Regrouper les tokens uniquement pour ceux qui manquent encore de flux
    id_to_tokens: dict[str, list[str]] = {}
    all_tokens: list[str] = []
    for row in pulsars_sans_s1400:
        toks = vizier_tokens_from_db_name(row.get("name") or "")
        id_to_tokens[row["id"]] = toks
        all_tokens.extend(toks)

    unique_tokens: list[str] = []
    seen_t: set[str] = set()
    for t in all_tokens:
        if t not in seen_t:
            seen_t.add(t)
            unique_tokens.append(t)

    log.info("Requêtes VizieR (tokens uniques) : %d en lots de %d", len(unique_tokens), BATCH_TOKENS)

    by_psrj: dict[str, dict] = {}
    by_name: dict[str, dict] = {}

    for i in range(0, len(unique_tokens), BATCH_TOKENS):
        chunk = unique_tokens[i : i + BATCH_TOKENS]
        try:
            rows = fetch_flux_from_vizier(chunk)
        except Exception as e:
            log.exception("Échec TAP VizieR pour le lot %d-%d : %s", i, i + len(chunk), e)
            time.sleep(TAP_SLEEP_SEC)
            continue
        for r in rows:
            psrj = (r.get("PSRJ") or "").strip()
            nm = (r.get("Name") or "").strip()
            if psrj:
                by_psrj[psrj] = r
            if nm:
                by_name[nm] = r
        time.sleep(TAP_SLEEP_SEC)

    would_update = 0
    updates: list[tuple[str, dict, dict]] = []

    for row in pulsars_sans_s1400:
        fs = row.get("field_sources") or {}
        if isinstance(fs, str):
            try:
                fs = json.loads(fs) if fs.strip() else {}
            except json.JSONDecodeError:
                fs = {}

        if not _can_write_attributes(fs):
            continue

        tokens = id_to_tokens.get(row["id"], [])
        vr = _find_vizier_row_for_tokens(tokens, by_psrj, by_name)
        if not vr:
            continue

        s1400_raw = vr.get("S1400")
        s400_raw = vr.get("S400")
        s1400: Optional[float] = None
        try:
            if s1400_raw is not None and str(s1400_raw).strip() != "":
                v = float(s1400_raw)
                if v >= 0:
                    s1400 = v
        except (TypeError, ValueError):
            pass

        spindx = compute_spindx_from_fluxes(s400_raw, s1400_raw)

        if s1400 is None and spindx is None:
            continue

        existing_attrs = dict(row.get("attributes") or {})
        new_attrs = _merge_flux_attrs(existing_attrs, s1400, spindx)
        if new_attrs == existing_attrs:
            continue

        would_update += 1
        new_fs = dict(fs)
        prev_src = fs.get("attributes")
        if prev_src not in (None, "", "MANUAL"):
            new_fs["attributes"] = prev_src
        else:
            new_fs["attributes"] = "VIZIER_ATNF"
        updates.append((row["id"], new_attrs, new_fs))

    log.info("Lignes à mettre à jour (s1400_mjy / spindx) : %d", would_update)

    if not apply:
        log.info("Dry-run — aucune écriture. Utiliser --apply pour enregistrer.")
        return 0

    ok = 0
    for sid, attrs, fs in updates:
        try:
            sb.table("stellar_systems").update({"attributes": attrs, "field_sources": fs}).eq(
                "id", sid
            ).execute()
            ok += 1
        except Exception as e:
            log.error("Update %s : %s", sid, e)

    log.info("Mises à jour réussies : %d / %d", ok, len(updates))
    return 0 if ok == len(updates) else 1


def main() -> int:
    p = argparse.ArgumentParser(description="Patch flux S1400 / spindx depuis VizieR TAP")
    p.add_argument("--apply", action="store_true", help="Appliquer les mises à jour Supabase")
    p.add_argument("--limit", type=int, default=None, help="Limiter le nombre de pulsars (test)")
    p.add_argument(
        "--pulsar",
        type=str,
        action="append",
        default=None,
        help="Restreindre à un ou plusieurs id stellar_systems (répéter l'option)",
    )
    args = p.parse_args()
    return run(apply=args.apply, limit=args.limit, pulsar_ids=args.pulsar)


if __name__ == "__main__":
    sys.exit(main())
