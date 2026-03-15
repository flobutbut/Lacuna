"""
Requête et normalisation des données NASA Exoplanet Archive.
API TAP — table Planetary Systems (ps).
"""
import io
from typing import Any, Optional
import pandas as pd
import requests

# Requête ADQL — format URL (+ pour espaces). pl_orbeccen (pas pl_ecc). Filtrage sy_dist côté client.
NASA_TAP_QUERY = (
    "select+pl_name,hostname,pl_letter,pl_orbper,pl_rade,pl_masse,pl_orbsmax,pl_orbeccen,"
    "pl_insol,pl_eqt,st_spectype,st_age,sy_dist,sy_pnum,pl_controv_flag+"
    "from+ps+where+default_flag=1"
)
MAX_DIST_PARSEC = 153  # Filtrer localement : 500 al

HZ_INSOL_MIN = 0.25
HZ_INSOL_MAX = 1.5


def fetch_nasa_planets() -> pd.DataFrame:
    """Récupère les planètes depuis l'API NASA Exoplanet Archive (dist < 500 al)."""
    url = f"https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query={NASA_TAP_QUERY}&format=csv"
    resp = requests.get(url, timeout=120)
    resp.raise_for_status()
    df = pd.read_csv(io.StringIO(resp.text))
    # Filtre sy_dist < 153 pc (500 al) côté client — API TAP rejette certains opérateurs
    if "sy_dist" in df.columns:
        df["sy_dist"] = pd.to_numeric(df["sy_dist"], errors="coerce")
        df = df[(df["sy_dist"].notna()) & (df["sy_dist"] > 0) & (df["sy_dist"] < MAX_DIST_PARSEC)]
    return df


def normalize_nasa_row(row: pd.Series) -> Optional[dict]:
    """
    Normalise une ligne NASA en dict pour system_objects (planète)
    et renvoie les données complémentaires pour stellar_systems.
    """
    hostname = str(row.get("hostname", "")).strip()
    pl_letter = str(row.get("pl_letter", "")).strip()
    if not hostname or not pl_letter:
        return None

    pl_insol = row.get("pl_insol")
    in_hz = False
    if pd.notna(pl_insol):
        try:
            ins = float(pl_insol)
            in_hz = HZ_INSOL_MIN < ins < HZ_INSOL_MAX
        except (TypeError, ValueError):
            pass

    controv = row.get("pl_controv_flag")
    confirmation = "CONFIRMED"
    if pd.notna(controv) and str(controv).strip() == "1":
        confirmation = "DEBATED"  # NASA n'a pas CONTROVERSIAL, on utilise DEBATED

    sort_order = ord(pl_letter.lower()) - ord("a") + 1 if pl_letter else 0

    planet = {
        "hostname": hostname,
        "designation": pl_letter.lower(),
        "name": str(row.get("pl_name", hostname + " " + pl_letter)).strip(),
        "orbital_period_days": _num(row, "pl_orbper"),
        "radius_earth": _num(row, "pl_rade"),
        "mass_earth": _num(row, "pl_masse"),
        "orbital_semi_major_axis_au": _num(row, "pl_orbsmax"),
        "orbital_eccentricity": _num(row, "pl_orbeccen"),
        "surface_temperature_k": _num(row, "pl_eqt"),
        "in_habitable_zone": in_hz,
        "type": "PLANET",
        "sort_order": sort_order,
        "confirmation_status": confirmation,
    }

    # Données à remonter pour stellar_systems
    planet["_stellar_update"] = {
        "spectral_type": _str(row, "st_spectype"),
        "age": _num(row, "st_age"),
        "planets": _int(row, "sy_pnum"),
        "distance": _num(row, "sy_dist"),
    }

    return planet


def _num(s: pd.Series, key: str) -> Optional[float]:
    v = s.get(key)
    if pd.isna(v) or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _int(s: pd.Series, key: str) -> Optional[int]:
    v = _num(s, key)
    return int(v) if v is not None else None


def _str(s: pd.Series, key: str) -> Optional[str]:
    v = s.get(key)
    if pd.isna(v) or str(v).strip() == "":
        return None
    return str(v).strip()
