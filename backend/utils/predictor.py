import os
import csv

# ── Optional ML Imports ────────────────────────────────────────────────────────
HAS_ML = False
try:
    import joblib
    import numpy as np
    HAS_ML = True
except ImportError:
    pass

# ── Paths ──────────────────────────────────────────────────────────────────────
MODEL_PATH = os.environ.get("MODEL_PATH", r"D:\\Syed Sufyan\\safe_route_model.pkl")

# Prefer repo-local CSV (so analytics/report match the uploaded dataset in this project).
# Fallback to DATASET_PATH env var / default if repo-local is missing.
_REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
_REPO_DATASET_PATH = os.path.join(_REPO_ROOT, "crime_master_dataset.csv")

DATASET_PATH = os.environ.get(
    "DATASET_PATH",
    (_REPO_DATASET_PATH if os.path.exists(_REPO_DATASET_PATH) else r"D:\\Syed Sufyan\\crime_master_dataset.csv"),
)


FEATURE_COLUMNS = [
    "assault_on_women_with_intent_to_outrage_her_modesty_-_incidents_(i)",
    "assault_on_women_-_i",
    "sexual_harrassment_total_-_i",
    "assault_or_use_of_criminal_force_on_women_with_intent_to_disrobe_(sec.354b_ipc)_-_i",
    "voyeurism_-_i",
    "stalking_-_i",
    "rape_(sec_376)_-_i",
    "attempt_to_commit_rape_(sec.376/511)_-_i",
    "total_crime_rate",
]

RISK_LABELS = ["Low", "Medium", "High"]
RISK_SCORES = {"Low": 85, "Medium": 55, "High": 20}

_model = None


def _load_model():
    global _model
    if not HAS_ML:
        return None
    if _model is None:
        if os.path.exists(MODEL_PATH):
            try:
                _model = joblib.load(MODEL_PATH)
            except Exception:
                _model = None
    return _model


def _read_csv_dataset():
    """Read the CSV dataset using standard library csv module."""
    if not os.path.exists(DATASET_PATH):
        return []
    
    rows = []
    try:
        with open(DATASET_PATH, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Standardize column keys and values
                std_row = {k.strip(): v.strip() for k, v in row.items() if k}
                rows.append(std_row)
    except Exception as e:
        print(f"Error reading dataset: {e}")
    return rows


def _safe_float(val, default=0.0):
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def _safe_int(val, default=0):
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return default


def predict_district_risk(district_name: str) -> dict:
    """
    Predict risk level. Uses real RF model if packages and file exist,
    otherwise falls back to dataset lookup or mock prediction.
    """
    dataset = _read_csv_dataset()
    district_key = district_name.strip().lower()

    # Find matching row in dataset
    match = None
    for row in dataset:
        if row.get("districts/city", "").strip().lower() == district_key:
            match = row
            break

    if match:
        risk_level = match.get("risk_level", "Medium")
        safety_score = RISK_SCORES.get(risk_level, 50)
        total_incidents = _safe_int(match.get("total_crime_incidents", 0))
        severity_score = _safe_float(match.get("severity_score", 0))
        total_crime_rate = _safe_float(match.get("total_crime_rate", 0))

        # Try to use model if available
        model = _load_model()
        if model is not None and HAS_ML:
            try:
                features = []
                for col in FEATURE_COLUMNS:
                    features.append(_safe_float(match.get(col, 0.0)))
                X = np.array(features).reshape(1, -1)
                prediction = model.predict(X)[0]
                risk_level = str(prediction)
                safety_score = RISK_SCORES.get(risk_level, 50)
            except Exception:
                pass

        return {
            "district": district_name,
            "risk_level": risk_level,
            "safety_score": safety_score,
            "confidence": 0.92,
            "total_incidents": total_incidents,
            "severity_score": severity_score,
            "total_crime_rate": round(total_crime_rate, 2),
            "crime_breakdown": {
                "assault_modesty": _safe_int(match.get("assault_on_women_with_intent_to_outrage_her_modesty_-_incidents_(i)", 0)),
                "assault_women": _safe_int(match.get("assault_on_women_-_i", 0)),
                "sexual_harassment": _safe_int(match.get("sexual_harrassment_total_-_i", 0)),
                "disrobing": _safe_int(match.get("assault_or_use_of_criminal_force_on_women_with_intent_to_disrobe_(sec.354b_ipc)_-_i", 0)),
                "voyeurism": _safe_int(match.get("voyeurism_-_i", 0)),
                "stalking": _safe_int(match.get("stalking_-_i", 0)),
                "rape": _safe_int(match.get("rape_(sec_376)_-_i", 0)),
                "attempt_rape": _safe_int(match.get("attempt_to_commit_rape_(sec.376/511)_-_i", 0)),
            },
        }

    return _mock_predict(district_name)


def _mock_predict(district_name: str) -> dict:
    import random
    random.seed(hash(district_name.lower()) % 10000)
    levels = ["Low", "Medium", "High"]
    weights = [0.4, 0.4, 0.2]
    risk_level = random.choices(levels, weights=weights)[0]
    safety_score = RISK_SCORES[risk_level] + random.randint(-5, 5)
    return {
        "district": district_name,
        "risk_level": risk_level,
        "safety_score": safety_score,
        "confidence": 0.78,
        "total_incidents": random.randint(5, 200),
        "severity_score": round(random.uniform(50, 800), 1),
        "total_crime_rate": round(random.uniform(1, 15), 2),
        "crime_breakdown": {
            "assault_modesty": random.randint(0, 50),
            "assault_women": random.randint(0, 30),
            "sexual_harassment": random.randint(0, 20),
            "disrobing": random.randint(0, 5),
            "voyeurism": random.randint(0, 5),
            "stalking": random.randint(0, 15),
            "rape": random.randint(0, 30),
            "attempt_rape": random.randint(0, 5),
        },
    }


def get_all_district_risks() -> list:
    dataset = _read_csv_dataset()
    results = []
    
    # Load coordinates from JSON
    coords = {}
    try:
        dist_path = os.path.join(os.path.dirname(__file__), "..", "data", "tn_districts.json")
        with open(dist_path, encoding="utf-8") as f:
            import json
            d_graph = json.load(f)
            for d in d_graph.get("districts", []):
                coords[d["name"].lower()] = (d["lat"], d["lng"])
    except Exception:
        pass

    for row in dataset:
        district = row.get("districts/city", "Unknown")
        risk = row.get("risk_level", "Medium")
        lat, lng = coords.get(district.lower(), (11.0, 78.0))
        results.append({
            "district": district.title(),
            "risk_level": risk,
            "safety_score": RISK_SCORES.get(risk, 50),
            "total_incidents": _safe_int(row.get("total_crime_incidents", 0)),
            "severity_score": _safe_float(row.get("severity_score", 0)),
            "total_crime_rate": round(_safe_float(row.get("total_crime_rate", 0)), 2),
            "lat": lat,
            "lng": lng
        })
    return results


def get_crime_dashboard_data() -> dict:
    dataset = _read_csv_dataset()
    if not dataset:
        return {}

    crime_cols = [
        "assault_on_women_with_intent_to_outrage_her_modesty_-_incidents_(i)",
        "assault_on_women_-_i",
        "sexual_harrassment_total_-_i",
        "assault_or_use_of_criminal_force_on_women_with_intent_to_disrobe_(sec.354b_ipc)_-_i",
        "voyeurism_-_i",
        "stalking_-_i",
        "rape_(sec_376)_-_i",
        "attempt_to_commit_rape_(sec.376/511)_-_i",
    ]

    crime_labels = [
        "Assault (Modesty)",
        "Assault on Women",
        "Sexual Harassment",
        "Disrobing",
        "Voyeurism",
        "Stalking",
        "Rape",
        "Attempt to Rape",
    ]

    # Calculate totals for categories
    totals = []
    for col in crime_cols:
        col_total = sum(_safe_int(row.get(col, 0)) for row in dataset)
        totals.append(col_total)

    # Risk distribution
    risk_distribution = {}
    for row in dataset:
        risk = row.get("risk_level", "Medium")
        risk_distribution[risk] = risk_distribution.get(risk, 0) + 1

    # Sort districts by crime rate/incidents
    sorted_by_incidents = sorted(dataset, key=lambda r: _safe_int(r.get("total_crime_incidents", 0)), reverse=True)
    
    top_dangerous = sorted_by_incidents[:5]
    top_safe = sorted_by_incidents[-5:] if len(sorted_by_incidents) >= 5 else sorted_by_incidents

    # Sort all by crime rate for trends
    sorted_by_rate = sorted(dataset, key=lambda r: _safe_float(r.get("total_crime_rate", 0)), reverse=True)

    return {
        "crime_categories": {
            "labels": crime_labels,
            "data": totals,
        },
        "risk_distribution": risk_distribution,
        "top_dangerous_districts": [
            {
                "district": r["districts/city"].title(),
                "incidents": _safe_int(r.get("total_crime_incidents", 0)),
                "risk_level": r.get("risk_level", "Medium"),
                "crime_rate": round(_safe_float(r.get("total_crime_rate", 0)), 2),
            }
            for r in top_dangerous
        ],
        "top_safe_districts": [
            {
                "district": r["districts/city"].title(),
                "incidents": _safe_int(r.get("total_crime_incidents", 0)),
                "risk_level": r.get("risk_level", "Medium"),
                "crime_rate": round(_safe_float(r.get("total_crime_rate", 0)), 2),
            }
            for r in top_safe
        ],
        "district_crime_rates": [
            {
                "district": r["districts/city"].title(),
                "crime_rate": round(_safe_float(r.get("total_crime_rate", 0)), 2),
                "risk_level": r.get("risk_level", "Medium"),
            }
            for r in sorted_by_rate
        ],
        "total_districts": len(dataset),
        "total_incidents": sum(_safe_int(row.get("total_crime_incidents", 0)) for row in dataset),
    }
