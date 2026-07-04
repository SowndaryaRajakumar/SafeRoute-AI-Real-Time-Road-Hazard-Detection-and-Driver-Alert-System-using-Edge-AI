import datetime
from typing import Any, Dict, List

from .predictor import get_crime_dashboard_data


def build_crime_report_from_csv() -> str:
    """Generate a human-readable report strictly from the CSV-derived analytics."""
    data = get_crime_dashboard_data()
    if not data:
        return "No crime data available. Ensure crime_master_dataset.csv is present and readable by the backend."

    # Summary stats
    total_incidents = data.get("total_incidents", 0)
    total_districts = data.get("total_districts", 0)

    # Top categories
    cat_labels = data.get("crime_categories", {}).get("labels", [])
    cat_values = data.get("crime_categories", {}).get("data", [])
    categories = list(zip(cat_labels, cat_values))
    categories.sort(key=lambda x: x[1], reverse=True)

    # Risk distribution
    risk_dist: Dict[str, Any] = data.get("risk_distribution", {})

    # Top dangerous districts
    dangerous: List[Dict[str, Any]] = data.get("top_dangerous_districts", [])
    safest: List[Dict[str, Any]] = data.get("top_safe_districts", [])

    today = datetime.datetime.now().strftime("%Y-%m-%d")

    lines: List[str] = []
    lines.append("# Crime Risk Analysis Report (CSV-Derived)\n")
    lines.append(f"Generated on: {today}\n")
    lines.append(f"Total districts analysed: **{total_districts}**\n")
    lines.append(f"Total incidents (sum across dataset): **{total_incidents:,}**\n")

    lines.append("## 1) Crime category totals\n")
    for name, val in categories[:10]:
        lines.append(f"- {name}: **{val:,}**")
    if not categories:
        lines.append("- (No category data found)")
    lines.append("")

    lines.append("## 2) Risk distribution (district counts)\n")
    for risk in ["Low", "Medium", "High"]:
        lines.append(f"- {risk}: **{risk_dist.get(risk, 0)}** districts")
    lines.append("")

    lines.append("## 3) Most dangerous districts\n")
    if dangerous:
        for i, d in enumerate(dangerous, start=1):
            lines.append(
                f"- {i}. {d.get('district')}: **{d.get('incidents', 0)}** incidents | risk: **{d.get('risk_level')}** | crime rate: **{d.get('crime_rate', 0)}**"
            )
    else:
        lines.append("- (No dangerous district data found)")
    lines.append("")

    lines.append("## 4) Safest districts\n")
    if safest:
        for i, d in enumerate(safest, start=1):
            lines.append(
                f"- {i}. {d.get('district')}: **{d.get('incidents', 0)}** incidents | risk: **{d.get('risk_level')}** | crime rate: **{d.get('crime_rate', 0)}**"
            )
    else:
        lines.append("- (No safe district data found)")
    lines.append("")

    # Add a simple interpretation section
    high_count = risk_dist.get("High", 0)
    med_count = risk_dist.get("Medium", 0)
    low_count = risk_dist.get("Low", 0)
    total = max(low_count + med_count + high_count, 1)

    high_pct = round((high_count / total) * 100, 1)
    med_pct = round((med_count / total) * 100, 1)
    low_pct = round((low_count / total) * 100, 1)

    lines.append("## 5) Interpretation\n")
    lines.append(
        f"Approximately **{high_pct}%** of districts are **High risk**, **{med_pct}%** are **Medium risk**, and **{low_pct}%** are **Low risk** based on the CSV-derived risk labels."
    )

    return "\n".join(lines)

