"""
Génération du rapport final d'import.
"""
from datetime import datetime
from pathlib import Path


def write_report(
    output_path: Path,
    stats_systems: dict,
    stats_objects: dict,
    lacuna_modified: dict[str, list[str]],
    corrections: list[str],
    unmapped_columns: list[str],
    hyg_batches: tuple[int, int],
    nasa_status: str,
    errors: list[str],
) -> None:
    """Écrit import_report.md."""
    lines = [
        "# Rapport d'import stellaires LACUNA",
        f"Généré le {datetime.utcnow().isoformat()}Z",
        "",
        "## Stellar Systems",
        f"- Insérés (nouveaux)     : {stats_systems.get('inserted', 0)}",
        f"- Complétés (NULL → val) : {stats_systems.get('completed', 0)}",
        f"- Corrigés (val → val)   : {stats_systems.get('corrected', 0)}",
        f"- Ignorés (déjà exacts)  : {stats_systems.get('ignored', 0)}",
        f"- Erreurs                : {stats_systems.get('errors', 0)}",
        "",
        "## System Objects (planètes)",
        f"- Insérés (nouveaux)     : {stats_objects.get('inserted', 0)}",
        f"- Complétés (NULL → val) : {stats_objects.get('completed', 0)}",
        f"- Corrigés (val → val)   : {stats_objects.get('corrected', 0)}",
        f"- Ignorés (déjà exacts)  : {stats_objects.get('ignored', 0)}",
        f"- Erreurs                : {stats_objects.get('errors', 0)}",
        "",
        "## Systèmes LACUNA modifiés",
    ]

    for sys_id, fields in lacuna_modified.items():
        lines.append(f"- {sys_id} : {', '.join(fields) if fields else 'aucun'}")

    lines.extend([
        "",
        "## Corrections effectuées",
    ])
    for c in corrections:
        lines.append(c)

    lines.extend([
        "",
        "## Champs non mappés",
        ", ".join(unmapped_columns) if unmapped_columns else "(aucun)",
        "",
        "## Progression",
        f"- Lots HYG traités   : {hyg_batches[0]} / {hyg_batches[1]}",
        f"- Import NASA        : {nasa_status}",
        "",
        "## Erreurs détaillées",
    ])
    for e in errors:
        lines.append(e)

    output_path.write_text("\n".join(lines), encoding="utf-8")
