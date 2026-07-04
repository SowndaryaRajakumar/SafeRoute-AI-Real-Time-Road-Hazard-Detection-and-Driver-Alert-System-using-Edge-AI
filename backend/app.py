"""
app.py - Flask API for AI-Powered Safe Route Recommendation System
Tata Innovert Hackathon 2026
"""
import os
from pathlib import Path
from unittest import result
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")
print("OPENROUTESERVICE_API_KEY =", os.getenv("OPENROUTESERVICE_API_KEY"))

from flask import Flask, request, jsonify
from flask_cors import CORS

from utils.predictor import (
    predict_district_risk,
    get_all_district_risks,
    get_crime_dashboard_data,
)
from utils.route_engine import find_safe_routes
from utils.reporting import build_crime_report_from_csv

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


# ─────────────────────────────────────────────────────────────────────────────
# Health check
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "SafeRoute API v1.0"})


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/predict
# Body: { "district": "Chennai" }
# Returns: risk_level, safety_score, crime_breakdown
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/predict", methods=["POST"])
def predict():
    body = request.get_json(silent=True) or {}
    district = body.get("district", "").strip()
    if not district:
        return jsonify({"error": "district field is required"}), 400

    result = predict_district_risk(district)
    return jsonify(result)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/safe-route
# Body: { "source": "Chennai", "destination": "Coimbatore" }
# Returns: ranked routes with safety scores and district breakdowns
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/safe-route", methods=["POST"])
def safe_route():
    body = request.get_json(silent=True) or {}
    source = body.get("source", "").strip()
    destination = body.get("destination", "").strip()

    if not source or not destination:
        return jsonify({"error": "Both 'source' and 'destination' are required."}), 400

    # Extract additional preferences
    time_of_day = body.get("time_of_day", "day")
    travel_mode = body.get("travel_mode", "driving")
    traveler_type = body.get("traveler_type", "standard")
    avoid_high_risk = body.get("avoid_high_risk", False)
    stopover = body.get("stopover", None)

    result = find_safe_routes(
        source,
        destination,
        time_of_day=time_of_day,
        travel_mode=travel_mode,
        traveler_type=traveler_type,
        avoid_high_risk=avoid_high_risk,
        stopover=stopover
    )

    print("SAFE ROUTE RESULT:", result)

    if "error" in result:
        return jsonify(result), 404
    return jsonify(result)

# ─────────────────────────────────────────────────────────────────────────────
# GET /api/district-risk
# Returns: risk level for all 46 Tamil Nadu districts
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/district-risk", methods=["GET"])
def district_risk():
    results = get_all_district_risks()
    return jsonify({"districts": results, "count": len(results)})


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/crime-dashboard
# Returns: crime analytics for charts (categories, risk distribution, top districts)
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/crime-dashboard", methods=["GET"])
def crime_dashboard():
    data = get_crime_dashboard_data()
    return jsonify(data)


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/crime-report
# Returns: generated markdown report derived from the same CSV dataset
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/crime-report", methods=["GET"])
def crime_report():
    report_md = build_crime_report_from_csv()
    return jsonify({"report": report_md})



# ─────────────────────────────────────────────────────────────────────────────
# GET /api/districts
# Returns: list of all district names (for autocomplete)
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/districts", methods=["GET"])
def list_districts():
    risks = get_all_district_risks()
    names = [r["district"] for r in risks]
    return jsonify({"districts": names})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
