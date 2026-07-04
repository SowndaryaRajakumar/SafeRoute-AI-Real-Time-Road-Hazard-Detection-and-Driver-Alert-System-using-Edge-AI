import SafetyScore from "./SafetyScore";
import { MapPin, ArrowRight, ChevronDown, ChevronUp, AlertCircle, Info, Clock, Route } from "lucide-react";
import { useState } from "react";
import { RISK_COLORS, RISK_SCORE_COLOR } from "../../utils/constants";

function DistrictChip({ district }) {
  const [open, setOpen] = useState(false);
  const color = RISK_COLORS[district.risk_level]?.hex || "#888";

  return (
    <div className="district-chip-wrapper">
      <button
        className="district-chip"
        onClick={() => setOpen((v) => !v)}
        style={{ "--chip-color": color }}
      >
        <span className="chip-dot" style={{ background: color }}></span>
        <span className="chip-name">{district.name}</span>
        <span className="chip-risk" style={{ color }}>{district.risk_level}</span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {open && (
        <div className="district-detail-popup">
          <div className="detail-row">
            <span>Safety Score</span>
            <span style={{ color: RISK_SCORE_COLOR(district.safety_score), fontWeight: 600 }}>
              {district.safety_score}/100
            </span>
          </div>
          <div className="detail-row">
            <span>Crime Rate</span>
            <span>{district.crime_rate}</span>
          </div>
          <div className="detail-row">
            <span>Total Incidents</span>
            <span>{district.total_incidents}</span>
          </div>

          {/* Localized Safety Advisories */}
          {district.advisories && district.advisories.length > 0 && (
            <div className="advisories-box">
              <span className="adv-header">Safety Advisories</span>
              <ul className="adv-list">
                {district.advisories.map((adv, idx) => (
                  <li key={idx} className="adv-item">
                    <AlertCircle size={10} style={{ color: RISK_SCORE_COLOR(district.safety_score) }} />
                    <span>{adv}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {district.crime_breakdown && (
            <div className="crime-mini-grid">
              {Object.entries(district.crime_breakdown).map(([k, v]) => (
                <div key={k} className="crime-mini-item">
                  <span>{k.replace(/_/g, " ")}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RouteResults({ routeData, selectedRouteId, onSelectRoute }) {
  if (!routeData) return null;

  const { source, destination, routes } = routeData;
  const activeRoute = routes.find((r) => r.route_id === selectedRouteId) || routes[0];

  const formatDuration = (mins) => {
    if (!mins) return "--";
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return hrs > 0 ? `${hrs}h ${m}m` : `${m}m`;
  };

  return (
    <div className="route-results">
      {/* Journey header */}
      <div className="journey-header">
        <div className="journey-point">
          <MapPin size={14} className="journey-icon-src" />
          <span>{source?.name}</span>
        </div>
        <ArrowRight size={14} className="journey-arrow" />
        <div className="journey-point">
          <MapPin size={14} className="journey-icon-dst" />
          <span>{destination?.name}</span>
        </div>
      </div>

      {/* Route Info Cards */}
      {activeRoute && (
        <div className="recommended-score">
          <SafetyScore
            score={activeRoute.adjusted_safety_score}
            riskLevel={activeRoute.overall_risk}
            label={activeRoute.label}
          />
          
          {/* Distance and Duration Metrics */}
          <div className="route-metrics-bar">
            <div className="metric-chip">
              <Clock size={14} />
              <span>{formatDuration(activeRoute.duration_mins)}</span>
            </div>
            <div className="metric-chip">
              <Route size={14} />
              <span>{activeRoute.distance_km} km</span>
            </div>
          </div>

          <div className="route-stats-row">
            <div className="stat-item">
              <span className="stat-label">Districts</span>
              <span className="stat-value">{activeRoute.district_count}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Low Risk</span>
              <span className="stat-value safe">{activeRoute.risk_breakdown?.Low || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">High Risk</span>
              <span className="stat-value danger">{activeRoute.risk_breakdown?.High || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Safety advisories and guidelines for the route */}
      {activeRoute?.route_tips && activeRoute.route_tips.length > 0 && (
        <div className="route-tips-box">
          <div className="tips-title">
            <Info size={14} />
            <span>Route Travel Advice</span>
          </div>
          <ul className="tips-list">
            {activeRoute.route_tips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* District breakdown */}
      {activeRoute && (
        <div className="district-breakdown">
          <p className="breakdown-title">District-by-District Safety Breakdown</p>
          <div className="district-chips">
            {activeRoute.districts.map((d, i) => (
              <DistrictChip key={i} district={d} />
            ))}
          </div>
        </div>
      )}

      {/* Alternative routes */}
      {routes?.length > 1 && (
        <div className="alternatives">
          <p className="alternatives-title">Alternative Routes</p>
          {routes.map((route) => {
            if (route.route_id === selectedRouteId) return null;
            return (
              <button
                key={route.route_id}
                className="alt-route-card"
                onClick={() => onSelectRoute(route.route_id)}
              >
                <div className="alt-route-header">
                  <span className="alt-route-label">{route.label}</span>
                  <span className={`risk-badge risk-${route.overall_risk?.toLowerCase()}`}>
                    {route.overall_risk}
                  </span>
                </div>
                <div className="alt-route-meta">
                  <span>{route.district_count} districts • {route.distance_km} km</span>
                  <span>Score: <strong style={{ color: RISK_SCORE_COLOR(route.adjusted_safety_score) }}>
                    {route.adjusted_safety_score}
                  </strong></span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
