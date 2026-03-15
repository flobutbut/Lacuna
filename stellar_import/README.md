# Import données stellaires LACUNA

Import HYG Database + NASA Exoplanet Archive → Supabase.

## Prérequis

- Python 3.10+
- Fichier HYG : `Ressources/hyg_v42.csv` ou `resources/hyg.csv`
- `.env` avec `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`

## Installation

```sh
cd stellar_import
python3 -m venv .venv
source .venv/bin/activate   # ou .venv\Scripts\activate sur Windows
pip install -r requirements.txt
```

## Exécution

```sh
python main.py
```

Ou depuis la racine du projet :

```sh
yarn import:stellar
```

## Progression et reprise

- `import_progress.json` : progression (reprise automatique en cas d'interruption)
- `import_report.md` : rapport final
- `import_errors.log` : erreurs détaillées

## Sources

- HYG Database v3 : <https://github.com/astronexus/HYG-Database>
- NASA Exoplanet Archive TAP API : <https://exoplanetarchive.ipac.caltech.edu/>
