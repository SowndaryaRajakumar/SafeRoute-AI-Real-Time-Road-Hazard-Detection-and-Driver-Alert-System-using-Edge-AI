import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  Sun, Moon, Shield, BarChart3, Map, Brain, Search,
  LogOut, User, ChevronDown, ShieldAlert, Activity
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="user-menu-wrap" ref={menuRef}>
      <button
        className="user-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        id="user-menu-btn"
      >
        <div className="user-avatar">
          <span>{initials}</span>
        </div>
        <div className="user-info">
          <span className="user-name">{user?.name || "User"}</span>
          <span className="user-role">
            {user?.travelerType === "solo_female" ? (
              <><ShieldAlert size={10} /> Solo Female</>
            ) : (
              <><User size={10} /> Standard</>
            )}
          </span>
        </div>
        <ChevronDown size={14} className={`chevron ${open ? "open" : ""}`} />
      </button>

      {open && (
        <div className="user-dropdown">
          <div className="user-dropdown-header">
            <div className="user-avatar large">
              <span>{initials}</span>
            </div>
            <div>
              <p className="dropdown-name">{user?.name}</p>
              <p className="dropdown-email">{user?.email}</p>
            </div>
          </div>
          <div className="user-dropdown-divider" />
          <div className="user-dropdown-body">
            <div className="dropdown-meta">
              <span className="dropdown-meta-label">Member since</span>
              <span className="dropdown-meta-value">{user?.createdAt || "2026"}</span>
            </div>
            <div className="dropdown-meta">
              <span className="dropdown-meta-label">Traveler Profile</span>
              <span className="dropdown-meta-value">
                {user?.travelerType === "solo_female" ? "Solo Female" : "Standard"}
              </span>
            </div>
          </div>
          <div className="user-dropdown-divider" />
          <button className="dropdown-logout-btn" onClick={onLogout} id="logout-btn">
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [backendStatus, setBackendStatus] = useState("checking"); // checking | online | offline

  // Check backend health
  useEffect(() => {
    const check = () => {
      fetch("http://localhost:5000/api/health", { signal: AbortSignal.timeout(3000) })
        .then((r) => r.ok ? setBackendStatus("online") : setBackendStatus("offline"))
        .catch(() => setBackendStatus("offline"));
    };
    check();
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="header">
      <div className="header-brand">
        <div className="header-logo">
          <Shield size={22} strokeWidth={2.5} />
        </div>
        <div className="header-title-group">
          <span className="header-title">SafeRoute AI</span>
          <span className="header-subtitle">Tata Innovert Challenge 2026</span>
        </div>
      </div>

      <nav className="header-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          <Map size={16} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          <BarChart3 size={16} />
          <span>Analytics</span>
        </NavLink>
        <NavLink to="/district-lookup" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          <Search size={16} />
          <span>District Lookup</span>
        </NavLink>
        <NavLink to="/how-it-works" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          <Brain size={16} />
          <span>How It Works</span>
        </NavLink>
      </nav>

      <div className="header-actions">
        {/* Backend status */}
        <div className={`header-status-badge status-${backendStatus}`} title={`Backend ${backendStatus}`}>
          <Activity size={12} />
          <span className="status-label">
            {backendStatus === "checking" ? "Connecting..." : backendStatus === "online" ? "API Online" : "API Offline"}
          </span>
          <span className={`badge-dot ${backendStatus === "online" ? "pulse" : ""}`} />
        </div>

        {/* Districts count */}
        <div className="header-badge">
          <span className="badge-dot pulse" />
          <span>46 Districts</span>
        </div>

        {/* Theme toggle */}
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme" id="theme-toggle-btn">
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User menu */}
        {user && <UserMenu user={user} onLogout={handleLogout} />}
      </div>
    </header>
  );
}
