#!/usr/bin/env python3
"""
Résolution des conflits (catégorie B) — analyse NASA vs base LACUNA.

Pour chaque système en conflit :
- Requête NASA TAP (pl_name, hostname, pl_letter, pl_orbper, pl_masse, pl_rade,
  pl_controv_flag, default_flag)
- Identifie les désignations officielles (default_flag=1)
- Compare avec les entrées system_objects en base
- Génère resolv_conflicts_report.md : officiels NASA, correspondances base,
  orphelines, action recommandée (GARDER / SUPPRIMER / RENOMMER)

Dry-run uniquement — aucune modification en base.
"""
import argparse
import logging
import sys
from pathlib import Path
from typing import Optional

import requests

from supabase_client import get_supabase_client

ROOT = Path(__file__).resolve().parent.parent
NASA_TAP = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
REPORT_PATH = Path(__file__).resolve().parent / "resolv_conflicts_report.md"
PAGE_SIZE = 2000

# IDs à supprimer (rapport SUPPRIMER) — généré depuis resolv_conflicts_report.md
IDS_TO_DELETE = [
    "05c5a5ce-a486-4d75-a21a-1d31d8dfa046",
    "216aa076-d62f-4e2f-92c6-4009df0de1eb",
    "d202c83a-6c0d-459c-b197-ee8058bd9b94",
    "ff0d14ed-5b82-4728-bb36-cb0494529668",  # k2-25
    "89972bdb-19d1-433d-b9cf-b66c1746c7e0",
    "c4f8bb6c-1622-4654-8045-655b9571362e",
    "dbd83b92-ea40-4fc7-8b0a-02d8ec502338",
    "6c2ebc21-9693-4878-85f4-dfb6b3968902",
    "8636eada-32a6-496b-8338-494608b19637",
    "4ffaa7dd-7793-4eb9-8a48-660c2332f4d5",  # k2-3
    "3df5702f-c4b9-4735-9c93-742e28167444",  # kepler-1649
    "f4bcbe51-19bc-4524-8967-097f15e998df",
    "552e00fa-5b51-42f2-83f3-2d96971063b5",
    "06fc17e6-604b-4f6b-94ff-f90910d9911f",
    "7f74306b-7c51-461f-9068-d5a3308e69e7",  # kepler-37
    "c7d0d88d-5c4b-4830-84f7-4cf881acdb25",
    "7021cd86-e828-4414-bc6a-88e0a457fad9",  # toi-1224
    "e83c8883-aad6-46fa-b0ef-c2b1a0454faf",
    "6a130e9a-5628-437c-adf5-dc627547a118",
    "cccd170d-39ea-42df-bcba-7b8e8fd0110b",  # toi-178
    "58eca021-c5fb-4a2a-835b-bc924fcdca8c",
    "aa3c6775-0e5f-4b4e-9f09-36c390a82035",
    "40d34d52-2d51-4514-98be-296c27fe99d6",
    "e3e2ca29-92a0-4690-a0f4-5e3610d65799",  # toi-2015
    "24272182-f49f-4b14-8a4c-534158cb42e8",  # toi-2068
    "a730bdd1-0a31-469c-8bf8-94481f3051ad",
    "71b96644-970e-412d-b3a2-4e973007cdd7",
    "ca735d50-9f59-4747-9eeb-47425e94a1fc",  # toi-244
    "2e2121c5-aeb7-44c3-b0e9-1a0b7618734d",  # toi-6223
]

# Systèmes en conflit (catégorie B) à analyser
CONFLICT_SYSTEMS = [
    "hd-3", "hd-5", "hd-17", "hd-21", "hd-28", "hd-41004", "hd-63", "hd-70",
    "hd-85", "hd-122", "hd-133131", "hd-156", "hd-199", "hd-200", "hd-222",
    "hip-6", "k2-3", "k2-25", "kepler-1649", "kepler-37",
    "toi-1224", "toi-178", "toi-2015", "toi-2068", "toi-244", "toi-6223",
    "wasp-8",
]

# Alias manuels : hostnames NASA supplémentaires pour certains systèmes
# (verify_hd_aliases.py + ps table)
HOSTNAME_OVERRIDES: dict[str, list[str]] = {
    "hip-6": ["HD 224930"],
    "hd-41004": ["HD 41004 A", "HD 41004 B", "HIP 28393 A", "HIP 28393 B"],
    "hd-133131": ["HD 133131 A", "HD 133131 B", "HIP 73674 A", "HIP 73674 B"],
}


def lacuna_id_to_nasa_hostname(system_id: str) -> list[str]:
    """
    Retourne les hostnames NASA possibles pour un ID LACUNA.
    Plusieurs variantes car NASA peut utiliser des formats différents.
    """
    # hd-3 → ["HD 3", "HD3"]
    # hd-122 → ["HD 122", "HD122"]
    # hip-6 → ["HIP 6", "HIP6"]  (+ alias HD 224930 via HOSTNAME_OVERRIDES)
    # k2-3 → ["K2-3"]  ← déjà correct
    # wasp-8 → ["WASP-8"]  ← déjà correct
    if not system_id or not str(system_id).strip():
        return []
    s = str(system_id).strip().upper()

    if s.startswith("HD-"):
        num = s[3:]
        return [f"HD {num}", f"HD{num}"]

    if s.startswith("HIP-"):
        num = s[4:]
        return [f"HIP {num}", f"HIP{num}"]

    if s.startswith("TOI-"):
        num = s[4:]
        return [f"TOI-{num}", f"TOI {num}"]

    # Formats déjà corrects : K2-, WASP-, KEPLER- (NASA utilise Kepler- pas KEPLER-)
    if s.startswith("KEPLER-"):
        num = s[7:]
        return [f"Kepler-{num}", f"KEPLER-{num}", f"Kepler {num}"]
    if s.startswith("K2-"):
        num = s[3:]
        return [f"K2-{num}", f"K2 {num}"]
    if s.startswith("WASP-"):
        num = s[5:]
        return [f"WASP-{num}", f"WASP {num}"]
    return [s.replace("-", " ", 1), s]


def _escape_sql(s: str) -> str:
    return s.replace("'", "''")


def _make_in_clause(values: list[str]) -> str:
    if not values:
        return "NULL"  # IN (NULL) ne matche rien, évite clause vide
    return ", ".join(f"'{_escape_sql(v)}'" for v in values)


def fetch_nasa_planets(
    hostnames: list[str],
    hd_names: list[str],
    hip_names: list[str],
) -> list[dict]:
    """Requête NASA TAP : hostname, hd_name ou hip_name."""
    has_host = bool(hostnames)
    has_hd = bool(hd_names)
    has_hip = bool(hip_names)
    if not (has_host or has_hd or has_hip):
        return []

    parts = []
    if has_host:
        parts.append(f"hostname IN ({_make_in_clause(hostnames)})")
    if has_hd:
        parts.append(f"hd_name IN ({_make_in_clause(hd_names)})")
    if has_hip:
        parts.append(f"hip_name IN ({_make_in_clause(hip_names)})")

    where_clause = " OR ".join(parts)
    query = f"""
        SELECT pl_name, hostname, pl_letter, pl_orbper, pl_masse, pl_rade,
               default_flag, hd_name, hip_name
        FROM ps
        WHERE default_flag = 1
          AND ({where_clause})
        ORDER BY hostname, pl_letter, pl_orbper
    """
    params = {"query": query.strip(), "format": "json"}
    resp = requests.get(NASA_TAP, params=params, timeout=120)
    resp.raise_for_status()
    return resp.json()


def fetch_system_objects_for_systems(sb, system_ids: list[str]) -> list[dict]:
    """Récupère les system_objects (PLANET) pour les system_ids donnés."""
    all_rows = []
    for sid in system_ids:
        offset = 0
        while True:
            resp = (
                sb.table("system_objects")
                .select("id,system_id,designation,name,orbital_period_days,type")
                .eq("system_id", sid)
                .eq("type", "PLANET")
                .range(offset, offset + PAGE_SIZE - 1)
                .execute()
            )
            rows = resp.data or []
            if not rows:
                break
            all_rows.extend(rows)
            offset += len(rows)
            if len(rows) < PAGE_SIZE:
                break
    return all_rows


def _delete_orphan_object(sb, obj_id: str, log: logging.Logger) -> bool:
    """Supprime un system_object orphelin. Gère signals et parent_id. Retourne True si OK."""
    try:
        sig = sb.table("signals").select("id").eq("source_object_id", obj_id).execute()
        if (sig.data or []):
            sb.table("signals").delete().eq("source_object_id", obj_id).execute()
            log.debug("  signals supprimés : %d", len(sig.data))
        children = sb.table("system_objects").select("id").eq("parent_id", obj_id).execute()
        if (children.data or []):
            sb.table("system_objects").update({"parent_id": None}).eq("parent_id", obj_id).execute()
            log.debug("  enfants orphelins : %d", len(children.data))
        sb.table("system_objects").delete().eq("id", obj_id).execute()
        return True
    except Exception as e:
        log.error("  Erreur suppression %s : %s", obj_id[:8], e)
        return False


def _apply_deletions(sb, log: logging.Logger) -> int:
    """Exécute les suppressions recommandées. Retourne le nombre de suppressions effectuées."""
    deleted = 0
    for obj_id in IDS_TO_DELETE:
        if _delete_orphan_object(sb, obj_id, log):
            deleted += 1
            log.info("Supprimé : %s", obj_id)
    return deleted


def _period_match(db_period: Optional[float], nasa_period: Optional[float], tolerance: float = 0.02) -> bool:
    """Vérifie si les périodes correspondent (tolérance 2% ou NULL des deux côtés)."""
    if db_period is None and nasa_period is None:
        return True
    if db_period is None or nasa_period is None or nasa_period <= 0:
        return False
    ratio = db_period / nasa_period
    return abs(ratio - 1.0) <= tolerance


def run(dry_run: bool = True, apply: bool = False) -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[logging.StreamHandler(sys.stderr)],
    )
    log = logging.getLogger(__name__)
    log.info("=== Resolve Conflicts — LACUNA (%s) ===", "APPLY" if apply else "dry-run")

    try:
        sb = get_supabase_client()
    except RuntimeError as e:
        log.error("%s", e)
        return 1

    # 1. Construire hostnames, hd_names, hip_names et le mapping valeur → system_id
    hostnames: list[str] = []
    hd_names: list[str] = []
    hip_names: list[str] = []
    value_to_system_id: dict[str, str] = {}

    for sid in CONFLICT_SYSTEMS:
        s = str(sid).strip().upper()
        if s.startswith("HD-"):
            num = s[3:]  # HD-41004 → 41004
            hd = f"HD {num}"
            if hd not in value_to_system_id:
                hd_names.append(hd)
                value_to_system_id[hd] = sid
            # Aliases NASA (ex. HD 41004 A/B pour système binaire)
            for alias in HOSTNAME_OVERRIDES.get(sid, []):
                if alias and alias not in value_to_system_id:
                    value_to_system_id[alias] = sid
                    hostnames.append(alias)
        elif s.startswith("HIP-"):
            num = s[4:]
            hip = f"HIP {num}"
            if hip not in value_to_system_id:
                hip_names.append(hip)
                value_to_system_id[hip] = sid
            for alias in HOSTNAME_OVERRIDES.get(sid, []):
                if alias and alias not in value_to_system_id:
                    value_to_system_id[alias] = sid
                    if alias.upper().replace(" ", "").startswith("HD"):
                        hd_names.append(alias)
                    elif alias.upper().replace(" ", "").startswith("HIP"):
                        hip_names.append(alias)
                    else:
                        hostnames.append(alias)
        else:
            for hn in lacuna_id_to_nasa_hostname(sid):
                if hn and hn not in value_to_system_id:
                    hostnames.append(hn)
                    value_to_system_id[hn] = sid

    log.info(
        "Requête NASA : %d hostnames, %d hd_names, %d hip_names",
        len(hostnames), len(hd_names), len(hip_names),
    )

    # 2. Requête NASA TAP (une requête avec hostname OR hd_name OR hip_name)
    nasa_rows = fetch_nasa_planets(hostnames, hd_names, hip_names)
    log.info("Total lignes NASA (default_flag=1) : %d", len(nasa_rows))

    # 3. Charger system_objects pour ces systèmes
    db_objects = fetch_system_objects_for_systems(sb, CONFLICT_SYSTEMS)
    log.info("Objets en base : %d", len(db_objects))

    # 4. Grouper NASA par system_id (match via hostname, hd_name ou hip_name)
    nasa_by_host: dict[str, list[dict]] = {}
    for row in nasa_rows:
        sid = None
        for col in ("hostname", "hd_name", "hip_name"):
            val = str(row.get(col, "") or "").strip()
            if val and val in value_to_system_id:
                sid = value_to_system_id[val]
                break
        if not sid:
            continue
        if sid not in nasa_by_host:
            nasa_by_host[sid] = []
        nasa_by_host[sid].append(row)

    # 5. Grouper DB par system_id
    db_by_system: dict[str, list[dict]] = {}
    for obj in db_objects:
        sid = obj.get("system_id")
        if sid:
            db_by_system.setdefault(sid, []).append(obj)

    # 6. Pour chaque système, analyser et construire le rapport
    report_lines: list[str] = []
    report_lines.append("# Rapport Résolution Conflits — LACUNA")
    report_lines.append("")
    report_lines.append("**Source :** NASA Exoplanet Archive TAP (table `ps`)")
    report_lines.append("**Référence officielle :** `default_flag=1`")
    report_lines.append("**Mode :** Dry-run (aucune modification en base)")
    report_lines.append("")
    report_lines.append("---")
    report_lines.append("")

    for sid in sorted(CONFLICT_SYSTEMS):
        nasa_planets = nasa_by_host.get(sid, [])
        db_planets = db_by_system.get(sid, [])

        official_nasa = [p for p in nasa_planets if p.get("default_flag") == 1]
        non_official_nasa = [p for p in nasa_planets if p.get("default_flag") != 1]

        report_lines.append(f"## {sid}")
        if sid in ("hd-41004", "hd-133131") and sid in HOSTNAME_OVERRIDES:
            report_lines.append(f"*Résolution forcée via aliases NASA : {', '.join(HOSTNAME_OVERRIDES[sid])}*")
        report_lines.append("")

        # Désignations officielles NASA (default_flag=1)
        report_lines.append("### Désignations officielles NASA (default_flag=1)")
        if not official_nasa:
            report_lines.append("- *Aucune entrée NASA avec default_flag=1 pour ce hostname*")
        else:
            for p in sorted(official_nasa, key=lambda x: (x.get("pl_letter") or "", x.get("pl_orbper") or 0)):
                pl_letter = p.get("pl_letter", "?")
                pl_orbper = p.get("pl_orbper")
                pl_name = p.get("pl_name", "")
                orb_str = f"{pl_orbper:.2f}j" if pl_orbper is not None else "?"
                report_lines.append(f"- **{pl_letter}** : {orb_str} — {pl_name}")
        report_lines.append("")

        # Entrées en base correspondantes
        report_lines.append("### Entrées en base correspondantes")
        matched_db = []
        for db in db_planets:
            des = (db.get("designation") or "").strip().lower()
            db_per = db.get("orbital_period_days")
            for nasa in official_nasa:
                nasa_letter = (str(nasa.get("pl_letter", "")).strip().lower() or "")
                nasa_per = nasa.get("pl_orbper")
                if nasa_per is not None and isinstance(nasa_per, str):
                    try:
                        nasa_per = float(nasa_per)
                    except (TypeError, ValueError):
                        nasa_per = None
                if des == nasa_letter and _period_match(db_per, nasa_per):
                    matched_db.append((db, nasa))
                    break

        matched_ids = {m[0].get("id") for m in matched_db}
        if matched_db:
            for db, _ in matched_db:
                orb = db.get("orbital_period_days")
                orb_str = f"{orb:.2f}j" if orb is not None else "?"
                report_lines.append(f"- `{db.get('designation')}` : {orb_str} (id: {db.get('id')}) ✓")
        else:
            report_lines.append("- *Aucune correspondance exacte*")
        report_lines.append("")

        # Entrées orphelines (sans correspondance NASA)
        orphans = [db for db in db_planets if db.get("id") not in matched_ids]
        report_lines.append("### Entrées orphelines (sans correspondance NASA)")
        if not orphans:
            report_lines.append("- *Aucune*")
        else:
            for db in sorted(orphans, key=lambda x: (x.get("designation") or "", x.get("orbital_period_days") or 0)):
                orb = db.get("orbital_period_days")
                orb_str = f"{orb:.2f}j" if orb is not None else "?"
                report_lines.append(f"- `{db.get('designation')}` : {orb_str} (id: {db.get('id')})")
        report_lines.append("")

        # NASA non-officiel (default_flag≠1) — info
        if non_official_nasa:
            report_lines.append("### Entrées NASA non officielles (default_flag≠1)")
            for p in non_official_nasa[:10]:  # Limiter l’affichage
                pl_letter = p.get("pl_letter", "?")
                pl_orbper = p.get("pl_orbper")
                orb_str = f"{pl_orbper:.2f}j" if pl_orbper is not None else "?"
                report_lines.append(f"- {pl_letter} : {orb_str}")
            if len(non_official_nasa) > 10:
                report_lines.append(f"- *... et {len(non_official_nasa) - 10} autres*")
            report_lines.append("")

        # Action recommandée
        report_lines.append("### Action recommandée")
        if not official_nasa:
            if db_planets:
                report_lines.append("- **VÉRIFIER** : Aucune désignation officielle NASA — vérifier hostname (alias ?)")
            else:
                report_lines.append("- **IGNORER** : Système vide en base, rien à faire")
        elif not orphans:
            report_lines.append("- **GARDER** : Toutes les entrées correspondent aux officiels NASA")
        else:
            # Orphelines : suggérer SUPPRIMER ou RENOMMER selon le cas
            actions = []
            for o in orphans:
                des = o.get("designation", "?")
                # Si une planète NASA a une lettre proche ou période proche → RENOMMER
                suggested = None
                for nasa in official_nasa:
                    nasa_letter = (str(nasa.get("pl_letter", "")).strip().lower() or "")
                    nasa_per = nasa.get("pl_orbper")
                    if nasa_per is not None and isinstance(nasa_per, str):
                        try:
                            nasa_per = float(nasa_per)
                        except (TypeError, ValueError):
                            nasa_per = None
                    if _period_match(o.get("orbital_period_days"), nasa_per):
                        suggested = nasa_letter
                        break
                if suggested and suggested != des:
                    actions.append(f"RENOMMER `{des}` → `{suggested}` (id: {o.get('id')})")
                else:
                    actions.append(f"SUPPRIMER `{des}` (id: {o.get('id')}) — pas de correspondance NASA")
            for a in actions:
                report_lines.append(f"- {a}")
        report_lines.append("")
        report_lines.append("---")
        report_lines.append("")

    # Écrire le rapport
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text("\n".join(report_lines), encoding="utf-8")
    log.info("Rapport écrit : %s", REPORT_PATH)

    # --apply : exécuter les suppressions recommandées
    if apply and sb:
        log.info("Exécution des suppressions (%d IDs)...", len(IDS_TO_DELETE))
        n = _apply_deletions(sb, log)
        log.info("Suppressions effectuées : %d", n)

    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Analyse conflits NASA vs base, appliquer suppressions orphelines"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Mode simulation (défaut)",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Exécuter les suppressions recommandées (IDs du rapport)",
    )
    args = parser.parse_args()
    apply = args.apply
    return run(dry_run=not apply, apply=apply)


if __name__ == "__main__":
    sys.exit(main())
