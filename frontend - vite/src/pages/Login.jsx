import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Shield, Eye, EyeOff, Mail, Lock, ArrowRight,
  MapPin, ShieldCheck, Navigation, AlertCircle, Loader2
} from "lucide-react";

// Floating district pins for animated background
const FLOATING_PINS = [
  { label: "Chennai", top: "12%", left: "78%", delay: "0s" },
  { label: "Coimbatore", top: "58%", left: "8%", delay: "0.5s" },
  { label: "Madurai", top: "72%", left: "52%", delay: "1s" },
  { label: "Salem", top: "28%", left: "20%", delay: "1.5s" },
  { label: "Tiruchirappalli", top: "55%", left: "38%", delay: "2s" },
  { label: "Vellore", top: "18%", left: "55%", delay: "2.5s" },
  { label: "Tirunelveli", top: "88%", left: "40%", delay: "0.8s" },
  { label: "Erode", top: "40%", left: "14%", delay: "1.8s" },
];

const STATS = [
  { value: "46", label: "Districts Covered" },
  { value: "98.2%", label: "AI Accuracy" },
  { value: "1.2M+", label: "Routes Analyzed" },
  { value: "24/7", label: "Live Monitoring" },
];

export default function Login() {
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [localError, setLocalError] = useState("");

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    clearError();
    setLocalError("");
  }, []);

  const validate = () => {
    if (!email.trim()) return "Email is required.";
    if (!/\S+@\S+\.\S+/.test(email)) return "Enter a valid email address.";
    if (!password) return "Password is required.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setLocalError(err); return; }
    setLocalError("");

    const ok = await login(email, password, remember);
    if (ok) navigate(from, { replace: true });
  };

  const fillDemo = () => {
    setEmail("demo@saferoute.ai");
    setPassword("demo1234");
    setLocalError("");
    clearError();
  };

  const displayError = localError || error;

  return (
    <div className="auth-page">
      {/* Animated background */}
      <div className="auth-bg">
        <div className="auth-bg-gradient" />
        <div className="auth-grid-pattern" />
        {FLOATING_PINS.map((pin) => (
          <div
            key={pin.label}
            className="auth-floating-pin"
            style={{ top: pin.top, left: pin.left, animationDelay: pin.delay }}
          >
            <MapPin size={12} />
            <span>{pin.label}</span>
          </div>
        ))}
        {/* Animated rings */}
        <div className="auth-ring auth-ring-1" />
        <div className="auth-ring auth-ring-2" />
        <div className="auth-ring auth-ring-3" />
      </div>

      <div className="auth-layout">
        {/* Left — Hero Panel */}
        <div className="auth-hero-panel">
          <div className="auth-hero-content">
            {/* Logo */}
            <div className="auth-hero-logo">
              <div className="auth-logo-icon">
                <Shield size={36} strokeWidth={2} />
              </div>
              <div>
                <h1 className="auth-hero-title">SafeRoute AI</h1>
                <p className="auth-hero-tagline">Tata Innovert Challenge 2026</p>
              </div>
            </div>

            {/* Hero text */}
            <div className="auth-hero-text">
              <h2 className="auth-hero-headline">
                Navigate Tamil Nadu<br />
                <span className="auth-hero-highlight">Safely & Intelligently</span>
              </h2>
              <p className="auth-hero-desc">
                AI-powered real-time crime risk prediction and safe route recommendations
                across all 46 districts of Tamil Nadu. Powered by machine learning and
                live crime data analytics.
              </p>
            </div>

            {/* Stats */}
            <div className="auth-stats-grid">
              {STATS.map((s) => (
                <div key={s.label} className="auth-stat">
                  <span className="auth-stat-value">{s.value}</span>
                  <span className="auth-stat-label">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Features */}
            <div className="auth-features">
              {[
                { icon: <ShieldCheck size={16} />, text: "AI crime risk prediction per district" },
                { icon: <Navigation size={16} />, text: "Safest route recommendations with live alerts" },
                { icon: <MapPin size={16} />, text: "Interactive Tamil Nadu safety heatmap" },
              ].map((f, i) => (
                <div key={i} className="auth-feature-item">
                  <span className="auth-feature-icon">{f.icon}</span>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Login Card */}
        <div className="auth-card-panel">
          <div className="auth-card">
            <div className="auth-card-header">
              <h2 className="auth-card-title">Welcome back</h2>
              <p className="auth-card-subtitle">Sign in to your SafeRoute account</p>
            </div>

            {/* Demo banner */}
            <button className="auth-demo-banner" onClick={fillDemo} type="button">
              <span className="auth-demo-dot" />
              <span>
                <strong>Demo account:</strong> demo@saferoute.ai / demo1234
              </span>
              <span className="auth-demo-fill">Click to fill →</span>
            </button>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="login-email">Email Address</label>
                <div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    id="login-email"
                    type="email"
                    className="auth-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setLocalError(""); clearError(); }}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="login-password">
                  Password
                </label>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    id="login-password"
                    type={showPass ? "text" : "password"}
                    className="auth-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setLocalError(""); clearError(); }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPass((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="auth-row-flex">
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="auth-checkbox"
                  />
                  <span>Remember me</span>
                </label>
                <button type="button" className="auth-forgot-link">
                  Forgot password?
                </button>
              </div>

              {/* Error */}
              {displayError && (
                <div className="auth-error-msg">
                  <AlertCircle size={15} />
                  <span>{displayError}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
                id="login-submit-btn"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="auth-divider">
                <span />
                <span className="auth-divider-text">or continue with</span>
                <span />
              </div>

              {/* Google SSO (UI only) */}
              <button type="button" className="auth-google-btn" id="google-sso-btn">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            </form>

            <p className="auth-switch-text">
              Don't have an account?{" "}
              <Link to="/signup" className="auth-switch-link">
                Create account
              </Link>
            </p>

            <p className="auth-tos">
              By signing in you agree to our{" "}
              <span className="auth-link-text">Terms of Service</span> and{" "}
              <span className="auth-link-text">Privacy Policy</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
