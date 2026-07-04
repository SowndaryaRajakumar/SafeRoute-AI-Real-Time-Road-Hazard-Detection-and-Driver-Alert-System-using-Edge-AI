import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RISK_COLORS, TN_DISTRICTS, TN_DISTRICT_COORDS } from "../../utils/constants";
import { api } from "../../services/api";

// Build a guaranteed static fallback dataset (risk level = Unknown for display)
const STATIC_DISTRICT_FALLBACK = TN_DISTRICTS.map((name) => ({
  district: name,
  lat: TN_DISTRICT_COORDS[name]?.lat || null,
  lng: TN_DISTRICT_COORDS[name]?.lng || null,
  risk_level: "Low",
  safety_score: 70,
}));

// Fix Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const TILE_DARK = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_LIGHT = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>';

export default function MapView({ routeData, selectedRouteId, theme, onSelectSource, onSelectDestination, simulating, simIdx }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const tileRef = useRef(null);
  const routeLayerRef = useRef(null);
  const routeMarkerLayerRef = useRef(null);
  const allDistrictsLayerRef = useRef(null);
  const simulatorLayerRef = useRef(null);
  
  const [allDistricts, setAllDistricts] = useState([]);

  // Bind global functions for popup buttons event handling
  useEffect(() => {
    window.setMapSource = (name) => {
      if (onSelectSource) onSelectSource(name);
    };
    window.setMapDestination = (name) => {
      if (onSelectDestination) onSelectDestination(name);
    };
    return () => {
      delete window.setMapSource;
      delete window.setMapDestination;
    };
  }, [onSelectSource, onSelectDestination]);

  // Init map
  useEffect(() => {
    if (mapInstance.current) return;
    
    mapInstance.current = L.map(mapRef.current, {
      center: [11.1271, 78.6569], // Tamil Nadu center
      zoom: 7,
      zoomControl: true,
      attributionControl: true,
    });

    tileRef.current = L.tileLayer(theme === "dark" ? TILE_DARK : TILE_LIGHT, {
      attribution: TILE_ATTR,
      maxZoom: 18,
    }).addTo(mapInstance.current);

    // Create layers
    allDistrictsLayerRef.current = L.layerGroup().addTo(mapInstance.current);
    routeLayerRef.current = L.layerGroup().addTo(mapInstance.current);
    routeMarkerLayerRef.current = L.layerGroup().addTo(mapInstance.current);
    simulatorLayerRef.current = L.layerGroup().addTo(mapInstance.current);

    // Event delegation on popupopen
    mapInstance.current.on("popupopen", (e) => {
      const container = e.popup._container;
      const setSrcBtn = container?.querySelector(".set-src-btn");
      const setDstBtn = container?.querySelector(".set-dst-btn");
      
      if (setSrcBtn) {
        setSrcBtn.onclick = () => {
          const name = setSrcBtn.getAttribute("data-name");
          window.setMapSource(name);
          mapInstance.current.closePopup();
        };
      }
      if (setDstBtn) {
        setDstBtn.onclick = () => {
          const name = setDstBtn.getAttribute("data-name");
          window.setMapDestination(name);
          mapInstance.current.closePopup();
        };
      }
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Switch theme
  useEffect(() => {
    if (!tileRef.current || !mapInstance.current) return;
    tileRef.current.setUrl(theme === "dark" ? TILE_DARK : TILE_LIGHT);
  }, [theme]);

  // Load all districts — fall back to static coords if API is unavailable
  useEffect(() => {
    api.getDistrictRisk()
      .then((data) => {
        if (data.districts && data.districts.length > 0) {
          setAllDistricts(data.districts);
        } else {
          setAllDistricts(STATIC_DISTRICT_FALLBACK);
        }
      })
      .catch(() => {
        // Use static Tamil Nadu district data so map is never empty
        setAllDistricts(STATIC_DISTRICT_FALLBACK);
      });
  }, []);

  // Draw background district exploration circles
  useEffect(() => {
    if (!mapInstance.current || !allDistricts.length) return;
    
    allDistrictsLayerRef.current.clearLayers();

    allDistricts.forEach((d) => {
      if (!d.lat || !d.lng) return;
      const color = RISK_COLORS[d.risk_level]?.hex || "#888";

      const marker = L.circleMarker([d.lat, d.lng], {
        radius: 6,
        fillColor: color,
        color: "#ffffff",
        weight: 1.5,
        opacity: 0.8,
        fillOpacity: 0.6,
      });

      const popupContent = `
        <div style="font-family:Inter,sans-serif;min-width:160px;padding:2px;">
          <b style="font-size:13px;display:block;margin-bottom:4px;color:var(--text-main);">${d.district}</b>
          <div style="font-size:11px;color:#888;margin-bottom:8px;">
            Risk Level: <span style="color:${color};font-weight:700;">${d.risk_level}</span><br>
            Safety Score: <b>${d.safety_score}/100</b>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="set-src-btn" data-name="${d.district}" style="
              flex:1;font-size:10px;padding:4px 6px;border:none;border-radius:4px;background:#6366f1;color:#fff;cursor:pointer;font-weight:600;
            ">Set Source</button>
            <button class="set-dst-btn" data-name="${d.district}" style="
              flex:1;font-size:10px;padding:4px 6px;border:1px solid #ddd;border-radius:4px;background:#fff;color:#333;cursor:pointer;font-weight:600;
            ">Set Dest</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.addTo(allDistrictsLayerRef.current);
    });
  }, [allDistricts]);

  // Draw routes
  useEffect(() => {
    if (!mapInstance.current) return;

    routeLayerRef.current.clearLayers();
    routeMarkerLayerRef.current.clearLayers();
    simulatorLayerRef.current.clearLayers();

    if (!routeData) return;

    const { routes } = routeData;
    if (!routes || !routes.length) return;

    const displayRoute = routes.find((r) => r.route_id === selectedRouteId) || routes[0];
    const allBounds = [];

    // Draw alternative paths faintly
    routes
      .filter((r) => r.route_id !== displayRoute.route_id)
      .forEach((route) => {
        const latlngs = route.districts
          .map((d) => d.lat && d.lng ? [d.lat, d.lng] : null)
          .filter(Boolean);
        if (latlngs.length > 1) {
          L.polyline(latlngs, {
            color: "#6b7280",
            weight: 3,
            opacity: 0.35,
            dashArray: "5, 8",
          }).addTo(routeLayerRef.current);
        }
      });

    // Draw active colored segments
    const districts = displayRoute.districts;
    for (let i = 0; i < districts.length - 1; i++) {
      const a = districts[i];
      const b = districts[i + 1];
      if (!a.lat || !b.lat) continue;
      const color = RISK_COLORS[a.risk_level]?.hex || "#888";
      const latlngs = [[a.lat, a.lng], [b.lat, b.lng]];
      allBounds.push(...latlngs);

      L.polyline(latlngs, {
        color,
        weight: 6,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(routeLayerRef.current);
    }

    // Active route checkpoint nodes
    districts.forEach((d, i) => {
      if (!d.lat || !d.lng) return;
      const color = RISK_COLORS[d.risk_level]?.hex || "#888";
      const isEndpoint = i === 0 || i === districts.length - 1;

      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:${isEndpoint ? 20 : 14}px;
          height:${isEndpoint ? 20 : 14}px;
          border-radius:50%;
          background:${color};
          border:3px solid #fff;
          box-shadow:0 0 8px rgba(0,0,0,0.3);
          display:flex;
          align-items:center;
          justify-content:center;
        ">
          ${isEndpoint ? `<div style="width:6px;height:6px;border-radius:50%;background:#fff;"></div>` : ""}
        </div>`,
        iconSize: [isEndpoint ? 20 : 14, isEndpoint ? 20 : 14],
        iconAnchor: [isEndpoint ? 10 : 7, isEndpoint ? 10 : 7],
      });

      const popupContent = `
        <div style="font-family:Inter,sans-serif;min-width:170px;padding:2px;">
          <b style="font-size:13px;display:block;margin-bottom:4px;color:var(--text-main);">${d.name}</b>
          <div style="font-size:11px;color:#555;line-height:1.4;margin-bottom:6px;">
            Predicted Risk: <span style="color:${color};font-weight:700;">${d.risk_level}</span><br>
            Safety Grade: <b>${d.safety_score}/100</b><br>
            Crime rate: <b>${d.crime_rate}</b>
          </div>
          <div style="display:flex;gap:4px;">
            <button class="set-src-btn" data-name="${d.name}" style="
              flex:1;font-size:10px;padding:4px;border:none;border-radius:4px;background:#6366f1;color:#fff;cursor:pointer;
            ">Set Source</button>
            <button class="set-dst-btn" data-name="${d.name}" style="
              flex:1;font-size:10px;padding:4px;border:1px solid #ddd;border-radius:4px;background:#fff;color:#333;cursor:pointer;
            ">Set Dest</button>
          </div>
        </div>
      `;

      L.marker([d.lat, d.lng], { icon })
        .addTo(routeMarkerLayerRef.current)
        .bindPopup(popupContent);
      
      allBounds.push([d.lat, d.lng]);
    });

    // Auto zoom fit
    if (allBounds.length > 1) {
      mapInstance.current.fitBounds(allBounds, { padding: [50, 50], maxZoom: 9 });
    }
  }, [routeData, selectedRouteId]);

  // Handle active navigation simulation step visualization (like Google Navigation pointer)
  useEffect(() => {
    if (!mapInstance.current || !simulatorLayerRef.current) return;
    simulatorLayerRef.current.clearLayers();

    if (!simulating || !routeData) return;
    const { routes } = routeData;
    const displayRoute = routes?.find((r) => r.route_id === selectedRouteId) || routes?.[0];
    const currentLoc = displayRoute?.districts?.[simIdx];

    if (currentLoc && currentLoc.lat && currentLoc.lng) {
      // Focus pan to the simulated vehicle location
      mapInstance.current.panTo([currentLoc.lat, currentLoc.lng], { animate: true });

      // Pulsing green navigation marker
      const pulseIcon = L.divIcon({
        className: "",
        html: `
          <div class="nav-pulse-marker">
            <div class="pulse-ring"></div>
            <div class="pulse-dot"></div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      L.marker([currentLoc.lat, currentLoc.lng], { icon: pulseIcon })
        .addTo(simulatorLayerRef.current)
        .bindPopup(
          `<div style="font-family:Inter,sans-serif;font-size:12px;text-align:center;">
             <b style="color:var(--primary);">Navigating Route</b><br>
             Current Location: <b>${currentLoc.name}</b>
           </div>`
        )
        .openPopup();
    }
  }, [simulating, simIdx, routeData, selectedRouteId]);

  return (
    <div className="map-container">
      <div ref={mapRef} className="map" />
      <div className="map-legend">
        <span className="legend-title">Risk Rating</span>
        {Object.entries(RISK_COLORS).map(([level, { hex }]) => (
          <div key={level} className="legend-item">
            <span className="legend-dot" style={{ background: hex }}></span>
            <span>{level}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
