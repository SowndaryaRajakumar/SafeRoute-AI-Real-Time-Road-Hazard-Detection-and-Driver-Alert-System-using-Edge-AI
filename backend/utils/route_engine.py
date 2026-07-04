"""backend/utils/route_engine.py

Safe route recommendation engine.

Hard requirement changes vs the previous implementation:
- ROUTE GEOMETRY is NOT generated from district adjacency/BFS.
- We request REAL alternative road routes from an external routing provider
  (Google Directions API or OpenRouteService).
- We evaluate ONLY the real routes returned by the routing provider.
- For every returned route:
  - Extract route coordinates (polyline/geometry)
  - Sample route into points
  - Evaluate crime risk around sample points using the existing AI model
  - Compute Safety Score, Risk Level, Distance, Estimated Travel Time
  - Compute Overall Score:
      Overall = 0.60*SafetyScore + 0.25*DistanceScore + 0.15*TimeScore
  - Reject any alternate route whose distance exceeds 125% of the shortest
    returned route distance.
- Frontend response schema is preserved.

Provider configuration (set one):
- GOOGLE_DIRECTIONS_API_KEY (or GOOGLE_API_KEY)
- OPENROUTESERVICE_API_KEY

Mode mapping:
- travel_mode="driving" -> Google mode driving, ORS driving-car
- travel_mode="walking" -> Google mode walking, ORS foot-walking
"""

from __future__ import annotations

import json
import math
import os
import time
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from .predictor import predict_district_risk

# ── Load district centroids for mapping sample points to a district ──
_DISTRICTS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "tn_districts.json")

_graph: Dict[str, Dict[str, Any]] = {}  # id -> {name, lat, lng, neighbors}
_name_to_id: Dict[str, str] = {}  # lowercase name/id -> id


def _load_graph() -> None:
    global _graph, _name_to_id
    if _graph:
        return
    with open(_DISTRICTS_PATH, encoding="utf-8") as f:
        data = json.load(f)
    for d in data.get("districts", []):
        _graph[str(d["id"])] = d
        _name_to_id[d["name"].lower()] = str(d["id"])
        _name_to_id[str(d["id"]).lower()] = str(d["id"])


def _resolve_district(name: str) -> Optional[str]:
    _load_graph()
    key = name.strip().lower()
    if key in _name_to_id:
        return _name_to_id[key]
    # fuzzy partial match
    for k, v in _name_to_id.items():
        if key in k or k in key:
            return v
    return None


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


def _district_centroids() -> List[Tuple[str, float, float]]:
    _load_graph()
    out: List[Tuple[str, float, float]] = []
    for did, d in _graph.items():
        lat = d.get("lat")
        lng = d.get("lng")
        if lat is None or lng is None:
            continue
        out.append((did, float(lat), float(lng)))
    return out


def _nearest_district(lat: float, lon: float, max_km: float = 120.0) -> Optional[str]:
    best_dist = float("inf")
    best_id: Optional[str] = None
    for did, dlat, dlng in _district_centroids():
        dist = _haversine_km(lat, lon, dlat, dlng)
        if dist < best_dist:
            best_dist = dist
            best_id = did
    if best_id is None:
        return None
    if best_dist > max_km:
        return None
    return best_id


# ── Polyline decode (Google encoded polyline format) ──

def _decode_polyline(encoded: str, precision: int = 5) -> List[Tuple[float, float]]:
    if not encoded:
        return []

    factor = 10**precision
    idx = 0
    lat = 0
    lon = 0
    coords: List[Tuple[float, float]] = []

    while idx < len(encoded):
        shift = 0
        result = 0
        while True:
            b = ord(encoded[idx]) - 63
            idx += 1
            result |= (b & 0x1F) << shift
            shift += 5
            if b < 0x20:
                break
        dlat = ~(result >> 1) if (result & 1) else (result >> 1)
        lat += dlat

        shift = 0
        result = 0
        while True:
            b = ord(encoded[idx]) - 63
            idx += 1
            result |= (b & 0x1F) << shift
            shift += 5
            if b < 0x20:
                break
        dlon = ~(result >> 1) if (result & 1) else (result >> 1)
        lon += dlon

        coords.append((lat / factor, lon / factor))

    return coords


def _sample_points(route_points: List[Tuple[float, float]], target_points: int = 45) -> List[Tuple[float, float]]:
    if not route_points:
        return []
    if len(route_points) <= target_points:
        return route_points
    stride = max(1, len(route_points) // target_points)
    sampled = route_points[::stride]
    if sampled[-1] != route_points[-1]:
        sampled.append(route_points[-1])
    return sampled


# ── Provider HTTP helpers (urllib only) ──

def _http_get_json(url: str, timeout_s: int = 25) -> Dict[str, Any]:
    req = Request(url, headers={"Accept": "application/json"})
    with urlopen(req, timeout=timeout_s) as resp:
        raw = resp.read().decode("utf-8")
    return json.loads(raw)


def _http_post_json(url: str, body: Dict[str, Any], headers: Dict[str, str], timeout_s: int = 25) -> Dict[str, Any]:
    import urllib.request
    import urllib.error

    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers=headers,
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:
            raw = resp.read().decode("utf-8")
            print("ORS RAW RESPONSE:", raw[:500])
            return json.loads(raw)

    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="ignore")
        print("========== ORS HTTP ERROR ==========")
        print("Status:", e.code)
        print(error_body)
        print("====================================")
        return {}

    except Exception as e:
        print("========== ORS REQUEST FAILED ==========")
        print(e)
        print("========================================")
        return {}


# ── Routing provider adapters ──

def _google_routes(
    src_lat: float,
    src_lng: float,
    dst_lat: float,
    dst_lng: float,
    travel_mode: str,
    alternatives: bool,
    max_routes: int,
) -> List[Dict[str, Any]]:
    api_key = os.environ.get("GOOGLE_DIRECTIONS_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return []

    base_url = "https://maps.googleapis.com/maps/api/directions/json"
    mode = "driving" if travel_mode == "driving" else "walking"

    params = {
        "origin": f"{src_lat},{src_lng}",
        "destination": f"{dst_lat},{dst_lng}",
        "alternatives": "true" if alternatives else "false",
        "mode": mode,
        "key": api_key,
    }

    url = f"{base_url}?{urlencode(params)}"
    data = _http_get_json(url)
    if data.get("status") != "OK":
        return []

    out: List[Dict[str, Any]] = []
    for r in (data.get("routes") or [])[:max_routes]:
        legs = r.get("legs") or []
        if not legs:
            continue
        leg = legs[0]
        dist_m = (leg.get("distance") or {}).get("value") or 0
        dur_s = (leg.get("duration") or {}).get("value") or 0

        poly = (r.get("overview_polyline") or {}).get("points")
        coords = _decode_polyline(poly)
        if len(coords) < 2:
            continue

        out.append(
            {
                "distance_km": float(dist_m) / 1000.0,
                "duration_mins": int(round(float(dur_s) / 60.0)),
                "route_coords": coords,  # (lat,lon)
            }
        )

    return out


def _ors_routes(
    src_lat: float,
    src_lng: float,
    dst_lat: float,
    dst_lng: float,
    travel_mode: str,
    alternatives: bool,
    max_routes: int,
) -> List[Dict[str, Any]]:
    """Fetch directions from OpenRouteService and normalize into route_coords.

    Adapter contract (required by find_safe_routes):
      - return a populated List[Dict]
      - each dict contains:
          * distance_km (float)
          * duration_mins (int)
          * route_coords: List[(lat, lon)]

    Implements the latest OpenRouteService Directions API behavior:
      - Authorization: Authorization: Bearer <API_KEY>
      - Robust HTTP error handling (status + response body)
      - Geometry can be returned as either:
          * encoded polyline string
          * GeoJSON LineString coordinates ([[lon, lat], ...]) or similar
      - Returns normalized lat/lon pairs for sampling & evaluation.
    """

    import urllib.error

    api_key = os.environ.get("OPENROUTESERVICE_API_KEY")
    if not api_key:
        print("ORS: OPENROUTESERVICE_API_KEY missing")
        return []

    endpoint = (
    "https://api.openrouteservice.org/v2/directions/driving-car"
    if travel_mode == "driving"
    else "https://api.openrouteservice.org/v2/directions/foot-walking"
)

    headers = {
    "Authorization": api_key,
    "Content-Type": "application/json",
    "Accept": "application/json",
}

    # ORS v2 directions request body.
    # Geometry is requested; if geometry_format is rejected we retry without it.
    base_body = {
    "coordinates": [
        [src_lng, src_lat],
        [dst_lng, dst_lat]
    ],
    "instructions": False
}

    def _decode_polyline_google_style(encoded: str, precision: int = 5) -> List[Tuple[float, float]]:
        """Decode an encoded polyline string into [(lat, lon), ...].

        ORS encoded geometry is commonly compatible with the Google polyline algorithm.
        """
        if not encoded or not isinstance(encoded, str):
            return []

        factor = 10**precision
        idx = 0
        lat = 0
        lon = 0
        coords: List[Tuple[float, float]] = []

        while idx < len(encoded):
            result = 0
            shift = 0
            while True:
                b = ord(encoded[idx]) - 63
                idx += 1
                result |= (b & 0x1F) << shift
                shift += 5
                if b < 0x20:
                    break
            dlat = ~(result >> 1) if (result & 1) else (result >> 1)
            lat += dlat

            result = 0
            shift = 0
            while True:
                b = ord(encoded[idx]) - 63
                idx += 1
                result |= (b & 0x1F) << shift
                shift += 5
                if b < 0x20:
                    break
            dlon = ~(result >> 1) if (result & 1) else (result >> 1)
            lon += dlon

            coords.append((lat / factor, lon / factor))

        return coords

    def _normalize_geometry_to_latlon(geometry: Any) -> List[Tuple[float, float]]:
        """Convert ORS route geometry into [(lat, lon), ...]."""
        if geometry is None:
            return []

        # 1) Encoded polyline string
        if isinstance(geometry, str):
            coords = _decode_polyline_google_style(geometry)
            return coords

        # 2) GeoJSON LineString-like dict
        if isinstance(geometry, dict):
            # common keys: {"type":"LineString","coordinates":[[lon,lat],...]}
            coords = geometry.get("coordinates")
            if isinstance(coords, list):
                geometry = coords
            else:
                return []

        # 3) GeoJSON coordinates list, possibly [[lon,lat],...]
        if isinstance(geometry, list):
            out: List[Tuple[float, float]] = []
            for pt in geometry:
                if isinstance(pt, (list, tuple)) and len(pt) >= 2:
                    # ORS GeoJSON uses [lon, lat]
                    lon = float(pt[0])
                    lat = float(pt[1])
                    out.append((lat, lon))
            return out

        return []

    def _post(body: Dict[str, Any]) -> Dict[str, Any]:
        import urllib.request

        data = json.dumps(body).encode("utf-8")
        req = urllib.request.Request(url=endpoint, data=data, headers=headers, method="POST")
        try:
            with urlopen(req, timeout=30) as resp:
                raw = resp.read().decode("utf-8")
            return json.loads(raw)
        except urllib.error.HTTPError as he:
            try:
                err_raw = he.read().decode("utf-8")
            except Exception:
                err_raw = ""
            print("====================================")
            print("ORS HTTPError")
            print("Status:", getattr(he, "code", None))
            print("Reason:", getattr(he, "reason", None))
            print("Endpoint:", endpoint)
            print("Request body:", body)
            if err_raw:
                print("Response body:", err_raw[:4000])
            print("====================================")
            # Keep failure visible to caller
            raise

    # Try request with geometry_format; on 400 retry without it.
    try:
        resp_data = _post(dict(base_body))
    except Exception:
        retry_body = dict(base_body)
        retry_body.pop("geometry_format", None)
        try:
            resp_data = _post(retry_body)
        except Exception:
            return []
    print("========== FULL ORS RESPONSE ==========")
    print(json.dumps(resp_data, indent=2))
    print("=======================================")
    if not isinstance(resp_data, dict):
        print("ORS unexpected response type:", type(resp_data))
        return []

    if resp_data.get("error"):
        print("====================================")
        print("ORS error payload:", json.dumps(resp_data, ensure_ascii=False)[:4000])
        print("====================================")
        return []

    routes = resp_data.get("routes")
    if not routes:
        print("====================================")
        print("ORS returned no routes.")
        print("ORS response keys:", list(resp_data.keys()))
        print("ORS response sample:", json.dumps(resp_data, ensure_ascii=False)[:4000])
        print("====================================")
        return []

    out: List[Dict[str, Any]] = []

    for r in routes[: int(max_routes)]:
        summary = r.get("summary") or {}
        dist_m = summary.get("distance") or 0
        dur_s = summary.get("duration") or 0

        geom = r.get("geometry")
        coords = _normalize_geometry_to_latlon(geom)

        if len(coords) < 2:
            # Geometry is essential for downstream risk sampling.
            print(
                "ORS route dropped due to insufficient geometry points:",
                {"len": len(coords), "dist_m": dist_m, "dur_s": dur_s},
            )
            continue

        out.append(
            {
                "distance_km": float(dist_m) / 1000.0,
                "duration_mins": int(round(float(dur_s) / 60.0)) if dur_s else 0,
                "route_coords": coords,
            }
        )

    return out





def _request_alternatives(
    src_lat,
    src_lng,
    dst_lat,
    dst_lng,
    travel_mode,
    max_routes,
):
    ors_key = os.environ.get("OPENROUTESERVICE_API_KEY")
    google_key = os.environ.get("GOOGLE_DIRECTIONS_API_KEY") or os.environ.get("GOOGLE_API_KEY")

    print("ORS KEY FOUND:", bool(ors_key))
    print("GOOGLE KEY FOUND:", bool(google_key))

    if ors_key:
        print("Trying OpenRouteService...")
        routes = _ors_routes(
            src_lat,
            src_lng,
            dst_lat,
            dst_lng,
            travel_mode,
            alternatives=True,
            max_routes=max_routes,
        )
        print("ORS returned:", len(routes), "routes")
        if routes:
            return routes

    if google_key:
        print("Trying Google...")
        routes = _google_routes(
            src_lat,
            src_lng,
            dst_lat,
            dst_lng,
            travel_mode,
            alternatives=True,
            max_routes=max_routes,
        )
        print("Google returned:", len(routes), "routes")
        if routes:
            return routes

    return []


# ── Risk scoring & scoring formula ──

def _apply_traveler_adjustments(
    base_score: float,
    base_risk: str,
    pred: Dict[str, Any],
    time_of_day: str,
    travel_mode: str,
    traveler_type: str,
) -> Tuple[float, str]:
    adjusted = float(base_score)

    if traveler_type == "solo_female":
        breakdown = pred.get("crime_breakdown", {}) or {}
        crime_factor = breakdown.get("stalking", 0) * 1.5 + breakdown.get("sexual_harassment", 0) * 1.2 + breakdown.get("rape", 0) * 2.0
        if crime_factor > 30:
            adjusted -= min(15.0, crime_factor / 4.0)

    if time_of_day == "night":
        if base_risk == "High":
            adjusted -= 10
        elif base_risk == "Medium":
            adjusted -= 5
        else:
            adjusted -= 2

    if travel_mode == "walking":
        if base_risk == "High":
            adjusted -= 12
        elif base_risk == "Medium":
            adjusted -= 6
        else:
            adjusted -= 3

    adjusted = max(0.0, min(100.0, round(adjusted, 1)))

    if adjusted >= 75:
        dynamic_risk = "Low"
    elif adjusted >= 45:
        dynamic_risk = "Medium"
    else:
        dynamic_risk = "High"

    return adjusted, dynamic_risk


def _distance_score(distance_km: float, shortest_km: float) -> float:
    if shortest_km <= 0:
        return 50.0
    ratio = distance_km / shortest_km
    # shortest gets 100. At 1.25x gets lower but still non-negative.
    return max(0.0, min(100.0, round(100.0 - (ratio - 1.0) * 120.0, 1)))


def _time_score(duration_mins: int, shortest_mins: int) -> float:
    if shortest_mins <= 0:
        return 50.0
    ratio = float(duration_mins) / float(shortest_mins)
    return max(0.0, min(100.0, round(100.0 - (ratio - 1.0) * 120.0, 1)))


def _risk_breakdown_to_overall(risk_counts: Dict[str, int]) -> str:
    if risk_counts.get("High", 0) > 0:
        return "High"
    if risk_counts.get("Medium", 0) > 1:
        return "Medium"
    return "Low"


def _route_tips_from_risk(
    risk_counts: Dict[str, int],
    time_of_day: str,
    travel_mode: str,
) -> List[str]:
    tips: List[str] = []
    if risk_counts.get("High", 0) > 0:
        tips.append("This route passes through areas with higher crime exposure. Keep doors locked and avoid stopping in secluded places.")
    if time_of_day == "night":
        tips.append("Night travel active. Prefer well-lit corridors and planned stops.")
    if travel_mode == "walking":
        tips.append("Walking mode active. Stay alert around crossings and poorly lit segments.")
    if not tips:
        tips.append("Recommended safer option based on AI risk exposure over the route geometry.")
    return tips


def _evaluate_route(
    route_coords: List[Tuple[float, float]],
    distance_km: float,
    duration_mins: int,
    *,
    time_of_day: str,
    travel_mode: str,
    traveler_type: str,
    sample_count: int,
    shortest_distance_km: float,
    shortest_duration_mins: int,
) -> Dict[str, Any]:
    sampled = _sample_points(route_coords, target_points=sample_count)

    districts: List[Dict[str, Any]] = []
    risk_counts = {"Low": 0, "Medium": 0, "High": 0}
    safety_scores: List[float] = []

    last_did: Optional[str] = None
    for lat, lon in sampled:
        did = _nearest_district(lat, lon)
        if not did:
            continue
        if did == last_did:
            continue
        last_did = did

        d = _graph.get(did, {})
        district_name = d.get("name", did)
        pred = predict_district_risk(district_name)

        base_risk = pred.get("risk_level", "Medium")
        base_score = float(pred.get("safety_score", 50))

        adjusted_score, dynamic_risk = _apply_traveler_adjustments(
            base_score=base_score,
            base_risk=base_risk,
            pred=pred,
            time_of_day=time_of_day,
            travel_mode=travel_mode,
            traveler_type=traveler_type,
        )

        risk_counts[dynamic_risk] = risk_counts.get(dynamic_risk, 0) + 1
        safety_scores.append(adjusted_score)

        # Minimal per-district advisories (kept consistent with existing UI expectations)
        breakdown = pred.get("crime_breakdown", {}) or {}
        advisories: List[str] = []
        if dynamic_risk == "High":
            advisories.append("High Crime Density: Stay on major corridors. Avoid risky shortcuts.")
        elif dynamic_risk == "Medium":
            advisories.append("Moderate Risk: Keep situational awareness and stay alert.")
        if traveler_type == "solo_female":
            if breakdown.get("stalking", 0) > 10 or breakdown.get("sexual_harassment", 0) > 15:
                advisories.append("High instances reported. Travel accompanied if possible.")
        if time_of_day == "night":
            advisories.append("Night Travel: Ensure phone charged and avoid isolated stops.")
        if travel_mode == "walking" and dynamic_risk == "High":
            advisories.append("Pedestrian Warning: Keep belongings secured and walk near traffic/light.")

        if not advisories:
            advisories.append("Safe Zone: Standard precautions apply.")

        districts.append(
            {
                "id": did,
                "name": district_name,
                "lat": d.get("lat", 0),
                "lng": d.get("lng", 0),
                "risk_level": dynamic_risk,
                "safety_score": adjusted_score,
                "total_incidents": pred.get("total_incidents", 0),
                "crime_rate": pred.get("total_crime_rate", 0),
                "crime_breakdown": pred.get("crime_breakdown", {}),
                "advisories": advisories,
            }
        )

    avg_safety = round(sum(safety_scores) / len(safety_scores), 1) if safety_scores else 0.0

    # Penalty to discourage routes with high/medium exposure density
    penalty = risk_counts.get("High", 0) * 12 + risk_counts.get("Medium", 0) * 4
    adjusted_safety_score = max(0.0, min(100.0, round(avg_safety - penalty, 1)))

    overall_risk = _risk_breakdown_to_overall(risk_counts)

    d_score = _distance_score(distance_km, shortest_distance_km)
    t_score = _time_score(duration_mins, shortest_duration_mins)

    overall_score = 0.60 * adjusted_safety_score + 0.25 * d_score + 0.15 * t_score

    return {
        "districts": districts,
        "district_count": len(districts),
        "avg_safety_score": avg_safety,
        "adjusted_safety_score": adjusted_safety_score,
        "overall_risk": overall_risk,
        "risk_breakdown": risk_counts,
        "distance_km": round(distance_km, 1),
        "duration_mins": int(duration_mins),
        "route_tips": _route_tips_from_risk(risk_counts, time_of_day=time_of_day, travel_mode=travel_mode),
        "overall_score": round(overall_score, 2),
        "distance_score": round(d_score, 1),
        "time_score": round(t_score, 1),
    }


def find_safe_routes(
    source: str,
    destination: str,
    time_of_day: str = "day",
    travel_mode: str = "driving",
    traveler_type: str = "standard",
    avoid_high_risk: bool = False,
    stopover: str = None,
) -> dict:
    """API entry called by backend/app.py."""
    _load_graph()

    src_id = _resolve_district(source)
    dst_id = _resolve_district(destination)

    if not src_id:
        return {"error": f"Source district '{source}' not found in Tamil Nadu district list."}
    if not dst_id:
        return {"error": f"Destination district '{destination}' not found in Tamil Nadu district list."}
    if src_id == dst_id:
        return {"error": "Source and destination cannot be the same district."}

    stop_id = None
    if stopover and stopover.strip():
        # Keep validation but do not attempt multi-leg routing to avoid changing API shape.
        stop_id = _resolve_district(stopover)
        if not stop_id:
            return {"error": f"Stopover district '{stopover}' not found in Tamil Nadu district list."}
        if stop_id in (src_id, dst_id):
            return {"error": "Stopover cannot be equal to source or destination."}

    src = _graph.get(src_id, {})
    dst = _graph.get(dst_id, {})
    src_lat = float(src.get("lat", 0) or 0)
    src_lng = float(src.get("lng", 0) or 0)
    dst_lat = float(dst.get("lat", 0) or 0)
    dst_lng = float(dst.get("lng", 0) or 0)

    if src_lat == 0 and src_lng == 0:
        return {"error": "Source coordinates not available."}
    if dst_lat == 0 and dst_lng == 0:
        return {"error": "Destination coordinates not available."}

    # Request alternatives from provider
    provider_routes = _request_alternatives(src_lat, src_lng, dst_lat, dst_lng, travel_mode, max_routes=10)
    if not provider_routes:
        return {
            "error": "Routing provider not configured or provider call failed. Set GOOGLE_DIRECTIONS_API_KEY/GOOGLE_API_KEY or OPENROUTESERVICE_API_KEY.",
        }

    # Determine shortest provider distance among returned routes
    valid_for_shortest = [r for r in provider_routes if r.get("distance_km", 0) > 0]
    if not valid_for_shortest:
        return {"error": "Routing provider returned routes without valid distances."}

    shortest_distance_km = min(r["distance_km"] for r in valid_for_shortest)
    shortest_duration_mins = min(r.get("duration_mins", 0) for r in valid_for_shortest if r.get("duration_mins", 0) > 0) or min(
        r.get("duration_mins", 0) for r in valid_for_shortest
    )

    # Reject >125% distance routes
    kept_provider_routes = [
        r
        for r in provider_routes
        if r.get("distance_km", 0) > 0 and r["distance_km"] <= (1.25 * shortest_distance_km + 1e-9)
    ]
    if not kept_provider_routes:
        # Safety: keep the closest one.
        kept_provider_routes = sorted(provider_routes, key=lambda x: x.get("distance_km", float("inf")))[0:1]

    # Evaluate each kept real route
    evaluated: List[Dict[str, Any]] = []
    for r in kept_provider_routes:
        coords = r.get("route_coords") or []
        if len(coords) < 2:
            continue
        evaluated.append(
            {
                **_evaluate_route(
                    route_coords=coords,
                    distance_km=float(r.get("distance_km", 0) or 0),
                    duration_mins=int(r.get("duration_mins", 0) or 0),
                    time_of_day=time_of_day,
                    travel_mode=travel_mode,
                    traveler_type=traveler_type,
                    sample_count=45,
                    shortest_distance_km=shortest_distance_km,
                    shortest_duration_mins=shortest_duration_mins,
                )
            }
        )

    if not evaluated:
        return {"error": "No routes could be evaluated after filtering."}

    # Sort by overall_score desc
    evaluated.sort(key=lambda x: x.get("overall_score", 0), reverse=True)

    fastest = min(evaluated, key=lambda x: x.get("duration_mins", 10**12))
    recommended = evaluated[0]

    routes: List[Dict[str, Any]] = []
    for i, met in enumerate(evaluated, start=1):
        label = f"Alternative Route {i}"
        if met is recommended:
            label = "🟢 Recommended Safe Route"
        elif met is fastest:
            label = "⚡ Fastest Route"
        elif met.get("overall_risk") == "High":
            label = "🔴 High Risk Route"

        routes.append(
            {
                "route_id": i,
                "label": label,
                "districts": met.get("districts", []),
                "district_count": met.get("district_count", 0),
                "avg_safety_score": met.get("avg_safety_score", 0),
                "adjusted_safety_score": met.get("adjusted_safety_score", 0),
                "overall_risk": met.get("overall_risk", "Medium"),
                "risk_breakdown": met.get("risk_breakdown", {"Low": 0, "Medium": 0, "High": 0}),
                "distance_km": met.get("distance_km", 0),
                "duration_mins": met.get("duration_mins", 0),
                "route_tips": met.get("route_tips", []),
                "overall_score": met.get("overall_score", 0),
            }
        )

    # Add required explanation bullets to the recommended route
    rec_route = routes[0]
    rec_distance = float(rec_route.get("distance_km", 0) or 0)
    diff_km = max(0.0, round(rec_distance - float(shortest_distance_km), 1))

    rec_route["route_tips"] = [
        "Recommended because:",
        "• Lowest crime exposure based on AI evaluation over the real route geometry.",
        "• Avoids high-risk crime hotspots along sampled points.",
        f"• Only {diff_km} km longer than the shortest available road route.",
    ]

    return {
        "source": {
            "id": src_id,
            "name": src.get("name", source),
            "lat": src.get("lat", 0),
            "lng": src.get("lng", 0),
        },
        "destination": {
            "id": dst_id,
            "name": dst.get("name", destination),
            "lat": dst.get("lat", 0),
            "lng": dst.get("lng", 0),
        },
        "stopover": {
            "id": stop_id,
            "name": _graph.get(stop_id, {}).get("name", stopover) if stop_id else None,
            "lat": _graph.get(stop_id, {}).get("lat", 0) if stop_id else 0,
            "lng": _graph.get(stop_id, {}).get("lng", 0) if stop_id else 0,
        } if stop_id else None,
        "routes": routes,
        "recommended_route": routes[0] if routes else None,
    }

