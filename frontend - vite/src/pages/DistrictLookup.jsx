import { useState, useEffect } from "react";
import { Search, ShieldCheck, AlertTriangle, AlertCircle, Loader2, BarChart2, Activity, MapPin, X } from "lucide-react";
import { api } from "../services/api";
import { TN_DISTRICTS } from "../utils/constants";
import { RISK_SCORE_COLOR, RISK_COLORS } from "../utils/constants";

function ScoreRing({ score, size = 80 }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = RISK_SCORE_COLOR(score);

  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        strokeDashoffset={circ * 0.25}
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
      <text x="40" y="44" textAnchor="middle" fontSize="14" fontWeight="700" fill={color} fontFamily="Inter">
        {score}
      </text>
    </svg>
  );
}

function BreakdownBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="bb-row">
      <span className="bb-label">{label}</span>
      <div className="bb-track">
        <div className="bb-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="bb-value" style={{ color }}>{value}</span>
    </div>
  );
}

function DistrictCard({ data, onClose }) {
  if (!data) return null;
  const { district, risk_level, safety_score, total_incidents, total_crime_rate, crime_breakdown, confidence } = data;
  const color = RISK_COLORS[risk_level]?.hex || "#888";
  const crimeEntries = Object.entries(crime_breakdown || {});
  const maxVal = Math.max(...crimeEntries.map(([, v]) => v), 1);

  const labelMap = {
    assault_modesty: "Assault (Modesty)",
    assault_women: "Assault on Women",
    sexual_harassment: "Sexual Harassment",
    disrobing: "Disrobing",
    voyeurism: "Voyeurism",
    stalking: "Stalking",
    rape: "Rape",
    attempt_rape: "Attempt to Rape",
  };

  return (
    <div className="district-card-result">
      <div className="dcr-header" style={{ borderColor: color + "44", background: color + "10" }}>
        <div className="dcr-header-left">
          <MapPin size={16} style={{ color }} />
          <div>
            <h3 className="dcr-name">{district}</h3>
            <p className="dcr-subtitle">Tamil Nadu District</p>
          </div>
        </div>
        <button className="dcr-close" onClick={onClose}><X size={16} /></button>
      </div>

      <div className="dcr-body">
        {/* Score + risk pill */}
        <div className="dcr-score-row">
          <ScoreRing score={safety_score} size={80} />
          <div className="dcr-score-meta">
            <span className="dcr-score-label">Safety Score</span>
            <span className={`risk-badge risk-${risk_level?.toLowerCase()}`}>{risk_level} Risk</span>
            <span className="dcr-confidence">AI Confidence: {Math.round((confidence || 0.78) * 100)}%</span>
          </div>
        </div>

        {/* Quick stats */}
        <div className="dcr-stats-grid">
          <div className="dcr-stat">
            <span className="dcr-stat-val">{total_incidents?.toLocaleString() ?? "—"}</span>
            <span className="dcr-stat-lbl">Total Incidents</span>
          </div>
          <div className="dcr-stat">
            <span className="dcr-stat-val">{total_crime_rate ?? "—"}</span>
            <span className="dcr-stat-lbl">Crime Rate</span>
          </div>
        </div>

        {/* Crime breakdown bars */}
        {crimeEntries.length > 0 && (
          <div className="dcr-breakdown">
            <p className="dcr-breakdown-title">Crime Category Breakdown</p>
            <div className="dcr-bars">
              {crimeEntries.map(([k, v]) => (
                <BreakdownBar
                  key={k}
                  label={labelMap[k] || k}
                  value={v}
                  max={maxVal}
                  color={color}
                />
              ))}
            </div>
          </div>
        )}

        {/* Risk level explanation */}
        <div className="dcr-tip" style={{ borderColor: color + "30", background: color + "0d" }}>
          {risk_level === "Low" && (
            <p>✅ <strong>{district}</strong> is classified as a <strong>Low Risk</strong> district. Standard safety precautions are sufficient. Generally safe for day and night travel.</p>
          )}
          {risk_level === "Medium" && (
            <p>⚠️ <strong>{district}</strong> has <strong>Moderate Crime Activity</strong>. Stay alert, keep valuables secure, and prefer main roads during night travel.</p>
          )}
          {risk_level === "High" && (
            <p>🚨 <strong>{district}</strong> is a <strong>High Risk</strong> district. Avoid traveling alone, especially at night. Keep doors locked and stay on major highways.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DistrictLookup() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareQuery, setCompareQuery] = useState("");
  const [compareSuggestions, setCompareSuggestions] = useState([]);
  const [compareResult, setCompareResult] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [allDistricts, setAllDistricts] = useState(TN_DISTRICTS);

  useEffect(() => {
    api.getDistricts()
      .then((d) => setAllDistricts(d.districts || TN_DISTRICTS))
      .catch(() => {});
  }, []);

  const filter = (q) =>
    allDistricts.filter((d) => d.toLowerCase().includes(q.toLowerCase())).slice(0, 8);

  const handleSearch = async (district) => {
    setQuery(district);
    setSuggestions([]);
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const data = await api.predictDistrict(district);
      setResult(data);
    } catch (e) {
      setError(e.message || "Failed to fetch district data.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async (district) => {
    setCompareQuery(district);
    setCompareSuggestions([]);
    setCompareLoading(true);
    setCompareResult(null);
    try {
      const data = await api.predictDistrict(district);
      setCompareResult(data);
    } catch (e) {
      setCompareResult(null);
    } finally {
      setCompareLoading(false);
    }
  };

  const allData = allDistricts
    .map((name) => ({ name }))
    .slice(0, 20);

  return (
    <div className="dl-page">
      {/* Hero */}
      <div className="dl-hero">
        <div className="dl-hero-icon-wrap">
          <Search size={28} />
        </div>
        <h1 className="dl-hero-title">District Safety Lookup</h1>
        <p className="dl-hero-desc">
          Instantly query the AI-predicted risk level, safety score, and crime breakdown for any Tamil Nadu district.
        </p>
      </div>

      {/* Search Controls */}
      <div className="dl-search-section">
        <div className="dl-search-row">
          {/* Primary Search */}
          <div className="dl-search-box">
            <div className="dl-search-label">
              <MapPin size={13} style={{ color: "var(--primary)" }} />
              <span>Search District</span>
            </div>
            <div className="dl-search-input-wrap">
              <Search size={16} className="dl-search-icon" />
              <input
                type="text"
                className="dl-search-input"
                placeholder="e.g. Chennai, Coimbatore..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSuggestions(e.target.value.length > 1 ? filter(e.target.value) : []);
                }}
                autoComplete="off"
              />
              {query && (
                <button className="dl-clear-btn" onClick={() => { setQuery(""); setResult(null); setSuggestions([]); }}>
                  <X size={14} />
                </button>
              )}
            </div>
            {suggestions.length > 0 && (
              <ul className="dl-suggestions">
                {suggestions.map((d) => (
                  <li key={d} onClick={() => handleSearch(d)}>{d}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Compare Toggle */}
          <div className="dl-compare-toggle-wrap">
            <button
              className={`dl-compare-toggle ${compareMode ? "active" : ""}`}
              onClick={() => { setCompareMode((v) => !v); setCompareResult(null); setCompareQuery(""); }}
            >
              <BarChart2 size={14} />
              {compareMode ? "Hide Compare" : "Compare Districts"}
            </button>
          </div>

          {/* Compare Search */}
          {compareMode && (
            <div className="dl-search-box">
              <div className="dl-search-label">
                <MapPin size={13} style={{ color: "#ec4899" }} />
                <span>Compare With</span>
              </div>
              <div className="dl-search-input-wrap">
                <Search size={16} className="dl-search-icon" />
                <input
                  type="text"
                  className="dl-search-input"
                  placeholder="Second district..."
                  value={compareQuery}
                  onChange={(e) => {
                    setCompareQuery(e.target.value);
                    setCompareSuggestions(e.target.value.length > 1 ? filter(e.target.value) : []);
                  }}
                  autoComplete="off"
                />
                {compareQuery && (
                  <button className="dl-clear-btn" onClick={() => { setCompareQuery(""); setCompareResult(null); setCompareSuggestions([]); }}>
                    <X size={14} />
                  </button>
                )}
              </div>
              {compareSuggestions.length > 0 && (
                <ul className="dl-suggestions">
                  {compareSuggestions.map((d) => (
                    <li key={d} onClick={() => handleCompare(d)}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Search Button */}
        <button
          className="dl-search-btn"
          disabled={!query || loading}
          onClick={() => handleSearch(query)}
        >
          {loading ? <Loader2 size={16} className="spin" /> : <Activity size={16} />}
          {loading ? "Analyzing..." : "Analyze District"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="dl-error">
          <AlertCircle size={16} />
          <span>{error}. Make sure the backend is running.</span>
        </div>
      )}

      {/* Results */}
      {(result || compareResult) && (
        <div className={`dl-results ${compareMode && compareResult ? "two-col" : ""}`}>
          {result && (
            <DistrictCard data={result} onClose={() => setResult(null)} />
          )}
          {compareMode && compareLoading && (
            <div className="dl-compare-loading">
              <Loader2 size={24} className="spin" />
              <p>Loading comparison...</p>
            </div>
          )}
          {compareMode && compareResult && !compareLoading && (
            <DistrictCard data={compareResult} onClose={() => setCompareResult(null)} />
          )}
        </div>
      )}

      {/* Quick Browse — top districts hint */}
      {!result && !loading && (
        <div className="dl-quick-browse">
          <p className="dl-qb-title">Quick Browse — Tap a district to look up</p>
          <div className="dl-qb-grid">
            {["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli", "Vellore", "Kancheepuram", "Erode", "Tirunelveli", "Tiruppur", "Namakkal", "Dharmapuri"].map((d) => (
              <button
                key={d}
                className="dl-qb-btn"
                onClick={() => handleSearch(d)}
              >
                <MapPin size={11} />
                {d}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
