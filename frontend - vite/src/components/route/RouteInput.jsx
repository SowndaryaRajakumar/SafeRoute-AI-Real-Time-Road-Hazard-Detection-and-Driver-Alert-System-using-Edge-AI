import { useState, useEffect, useRef } from "react";
import { Search, Navigation, Loader2, AlertCircle, Sun, Moon, Car, Footprints, User, ShieldAlert, Plus, X } from "lucide-react";
import { api } from "../../services/api";
import { TN_DISTRICTS } from "../../utils/constants";

export default function RouteInput({ source, setSource, destination, setDestination, stopover, setStopover, onRouteResult, onLoading }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showStopover, setShowStopover] = useState(false);
  
  // Custom travel preferences
  const [timeOfDay, setTimeOfDay] = useState("day");
  const [travelMode, setTravelMode] = useState("driving");
  const [travelerType, setTravelerType] = useState("standard");
  const [avoidHighRisk, setAvoidHighRisk] = useState(false);

  const [srcSuggestions, setSrcSuggestions] = useState([]);
  const [dstSuggestions, setDstSuggestions] = useState([]);
  const [stopSuggestions, setStopSuggestions] = useState([]);
  const [districts, setDistricts] = useState(TN_DISTRICTS);
  
  const srcRef = useRef(null);
  const dstRef = useRef(null);
  const stopRef = useRef(null);

  useEffect(() => {
    api.getDistricts()
      .then((data) => setDistricts(data.districts || TN_DISTRICTS))
      .catch(() => {});

    // Close suggestions on outside click
    const handleClickOutside = (e) => {
      if (srcRef.current && !srcRef.current.contains(e.target)) {
        setSrcSuggestions([]);
      }
      if (dstRef.current && !dstRef.current.contains(e.target)) {
        setDstSuggestions([]);
      }
      if (stopRef.current && !stopRef.current.contains(e.target)) {
        setStopSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filterDistricts = (query) =>
    districts
      .filter((d) => d.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 6);

  const handleSrcChange = (val) => {
    setSource(val);
    setSrcSuggestions(val.length > 1 ? filterDistricts(val) : []);
  };

  const handleDstChange = (val) => {
    setDestination(val);
    setDstSuggestions(val.length > 1 ? filterDistricts(val) : []);
  };

  const handleStopChange = (val) => {
    setStopover(val);
    setStopSuggestions(val.length > 1 ? filterDistricts(val) : []);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!source || !destination) {
      setError("Please enter both source and destination.");
      return;
    }
    if (source.toLowerCase() === destination.toLowerCase()) {
      setError("Source and destination cannot be the same.");
      return;
    }
    if (showStopover && stopover && (stopover.toLowerCase() === source.toLowerCase() || stopover.toLowerCase() === destination.toLowerCase())) {
      setError("Waypoint cannot be equal to source or destination.");
      return;
    }
    setError(null);
    setLoading(true);
    onLoading(true);
    setSrcSuggestions([]);
    setDstSuggestions([]);
    setStopSuggestions([]);
    try {
      const result = await api.findSafeRoute(source, destination, {
        time_of_day: timeOfDay,
        travel_mode: travelMode,
        traveler_type: travelerType,
        avoid_high_risk: avoidHighRisk,
        stopover: showStopover ? stopover : null
      });
      onRouteResult(result);
    } catch (err) {
      setError(err.message || "Failed to find route. Is the backend running?");
      onRouteResult(null);
    } finally {
      setLoading(false);
      onLoading(false);
    }
  };

  // Trigger search when preferences or locations change
  useEffect(() => {
    if (source && destination && !loading) {
      const isValidSrc = districts.some(d => d.toLowerCase() === source.toLowerCase());
      const isValidDst = districts.some(d => d.toLowerCase() === destination.toLowerCase());
      const isValidStop = !showStopover || !stopover || districts.some(d => d.toLowerCase() === stopover.toLowerCase());
      if (isValidSrc && isValidDst && isValidStop) {
        handleSubmit();
      }
    }
  }, [source, destination, stopover, showStopover, timeOfDay, travelMode, travelerType, avoidHighRisk]);

  const swapLocations = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
  };

  return (
    <div className="route-input-panel">
      <div className="panel-header">
        <Navigation size={18} className="panel-icon" />
        <div>
          <h2 className="panel-title">Find Safe Route</h2>
          <p className="panel-subtitle">Tamil Nadu Districts</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="route-form">
        {/* Source */}
        <div className="input-group" ref={srcRef}>
          <label className="input-label">
            <span className="dot dot-src"></span>
            Source
          </label>
          <div className="input-wrapper">
            <Search size={15} className="input-icon" />
            <input
              type="text"
              className="route-input"
              placeholder="From (district)..."
              value={source}
              onChange={(e) => handleSrcChange(e.target.value)}
              onFocus={() => source.length > 1 && setSrcSuggestions(filterDistricts(source))}
              autoComplete="off"
            />
          </div>
          {srcSuggestions.length > 0 && (
            <ul className="suggestions">
              {srcSuggestions.map((d) => (
                <li key={d} onClick={() => { setSource(d); setSrcSuggestions([]); }}>
                  {d}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Swap button */}
        <button type="button" className="swap-btn" onClick={swapLocations} title="Swap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>

        {/* Stopover (Optional Waypoint) */}
        {showStopover ? (
          <div className="input-group" ref={stopRef}>
            <label className="input-label">
              <span className="dot" style={{ backgroundColor: "#8b5cf6" }}></span>
              Stopover (Waypoint)
              <button
                type="button"
                className="remove-waypoint-btn"
                onClick={() => { setShowStopover(false); setStopover(""); }}
                title="Remove Stopover"
              >
                <X size={12} />
              </button>
            </label>
            <div className="input-wrapper">
              <Search size={15} className="input-icon" />
              <input
                type="text"
                className="route-input"
                placeholder="Pass through (district)..."
                value={stopover}
                onChange={(e) => handleStopChange(e.target.value)}
                onFocus={() => stopover.length > 1 && setStopSuggestions(filterDistricts(stopover))}
                autoComplete="off"
              />
            </div>
            {stopSuggestions.length > 0 && (
              <ul className="suggestions">
                {stopSuggestions.map((d) => (
                  <li key={d} onClick={() => { setStopover(d); setStopSuggestions([]); }}>
                    {d}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="add-waypoint-btn"
            onClick={() => setShowStopover(true)}
          >
            <Plus size={12} />
            <span>Add Waypoint</span>
          </button>
        )}

        {/* Destination */}
        <div className="input-group" ref={dstRef}>
          <label className="input-label">
            <span className="dot dot-dst"></span>
            Destination
          </label>
          <div className="input-wrapper">
            <Search size={15} className="input-icon" />
            <input
              type="text"
              className="route-input"
              placeholder="To (district)..."
              value={destination}
              onChange={(e) => handleDstChange(e.target.value)}
              onFocus={() => destination.length > 1 && setDstSuggestions(filterDistricts(destination))}
              autoComplete="off"
            />
          </div>
          {dstSuggestions.length > 0 && (
            <ul className="suggestions">
              {dstSuggestions.map((d) => (
                <li key={d} onClick={() => { setDestination(d); setDstSuggestions([]); }}>
                  {d}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Travel Preferences Controls ──── */}
        <div className="preferences-section">
          <label className="preferences-section-title">Routing Preferences</label>
          
          <div className="pref-row">
            {/* Travel Mode Toggle */}
            <div className="pref-item">
              <span className="pref-label">Travel Mode</span>
              <div className="segmented-control">
                <button
                  type="button"
                  className={travelMode === "driving" ? "active" : ""}
                  onClick={() => setTravelMode("driving")}
                  title="Driving Mode"
                >
                  <Car size={14} />
                  <span>Drive</span>
                </button>
                <button
                  type="button"
                  className={travelMode === "walking" ? "active" : ""}
                  onClick={() => setTravelMode("walking")}
                  title="Walking Mode"
                >
                  <Footprints size={14} />
                  <span>Walk</span>
                </button>
              </div>
            </div>

            {/* Time of Day Toggle */}
            <div className="pref-item">
              <span className="pref-label">Time of Day</span>
              <div className="segmented-control">
                <button
                  type="button"
                  className={timeOfDay === "day" ? "active" : ""}
                  onClick={() => setTimeOfDay("day")}
                  title="Daytime Travel"
                >
                  <Sun size={14} />
                  <span>Day</span>
                </button>
                <button
                  type="button"
                  className={timeOfDay === "night" ? "active" : ""}
                  onClick={() => setTimeOfDay("night")}
                  title="Nighttime Travel"
                >
                  <Moon size={14} />
                  <span>Night</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pref-row">
            {/* Traveler Profile */}
            <div className="pref-item fill">
              <span className="pref-label">Traveler Profile</span>
              <div className="segmented-control">
                <button
                  type="button"
                  className={travelerType === "standard" ? "active" : ""}
                  onClick={() => setTravelerType("standard")}
                >
                  <User size={14} />
                  <span>Standard Profile</span>
                </button>
                <button
                  type="button"
                  className={travelerType === "solo_female" ? "active" : ""}
                  onClick={() => setTravelerType("solo_female")}
                >
                  <ShieldAlert size={14} />
                  <span>Solo Female Traveler</span>
                </button>
              </div>
            </div>
          </div>

          {/* Safety-First Checkbox */}
          <div className="pref-checkbox-wrapper">
            <label className="pref-checkbox-label">
              <input
                type="checkbox"
                checked={avoidHighRisk}
                onChange={(e) => setAvoidHighRisk(e.target.checked)}
              />
              <span className="checkbox-text">Avoid High-Risk Districts Entirely</span>
            </label>
          </div>
        </div>

        {error && (
          <div className="error-msg">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="find-btn" disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={16} className="spin" />
              Recalculating Safe Path...
            </>
          ) : (
            <>
              <Navigation size={16} />
              Calculate Safest Path
            </>
          )}
        </button>
      </form>
    </div>
  );
}
