const normalizeApiBase = (value) => {
  if (!value) return "http://localhost:5000/api";
  const trimmed = String(value).trim();

  // If user configured just host (e.g. http://localhost:5000), append /api
  if (!trimmed.endsWith("/api") && !trimmed.endsWith("/api/")) {
    if (trimmed.endsWith("/")) return `${trimmed.slice(0, -1)}/api`;
    return `${trimmed}/api`;
  }

  return trimmed.endsWith("/api/") ? trimmed.slice(0, -1) : trimmed;
};

// Prefer VITE_API_URL if provided.
// Also support legacy VITE_BACKEND_URL (host only) if present.
const API_BASE = normalizeApiBase(
  import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL
);


const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "API Error");
  return data;
};

export const api = {
  health: () => fetch(`${API_BASE}/health`).then(handleResponse),

  getDistricts: () => fetch(`${API_BASE}/districts`).then(handleResponse),

  predictDistrict: (district) =>
    fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ district }),
    }).then(handleResponse),

  findSafeRoute: (source, destination, preferences = {}) =>
    fetch(`${API_BASE}/safe-route`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, destination, ...preferences }),
    }).then(handleResponse),

  getDistrictRisk: () =>
    fetch(`${API_BASE}/district-risk`).then(handleResponse),

  getCrimeDashboard: () =>
    fetch(`${API_BASE}/crime-dashboard`).then(handleResponse),

  getCrimeReport: () =>
    fetch(`${API_BASE}/crime-report`).then(handleResponse),
};
