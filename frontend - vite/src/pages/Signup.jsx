import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Shield, Eye, EyeOff, Mail, Lock, User, ArrowRight,
  MapPin, ShieldAlert, Check, AlertCircle, Loader2, ShieldCheck
} from "lucide-react";

const FLOATING_PINS = [
  { label: "Kanyakumari", top: "90%", left: "45%", delay: "0s" },
  { label: "Chennai", top: "10%", left: "75%", delay: "0.7s" },
  { label: "Nilgiris", top: "40%", left: "10%", delay: "1.2s" },
  { label: "Thanjavur", top: "65%", left: "65%", delay: "1.8s" },
  { label: "Ramanathapuram", top: "80%", left: "25%", delay: "2.4s" },
  { label: "Dharmapuri", top: "25%", left: "30%", delay: "0.4s" },
];

const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, label: "At least 8 characters" },
  { test: (p) => /[A-Z]/.test(p), label: "One uppercase letter" },
  { test: (p) => /[0-9]/.test(p), label: "One number" },
];

const TRAVELER_TYPES = [
  {
    id: "standard",
    icon: <User size={20} />,
    label: "Standard",
    desc: "General route safety scoring",
  },
  {
    id: "solo_female",
    icon: <ShieldAlert size={20} />,
    label: "Solo Female Traveler",
    desc: "Enhanced safety weighting for women traveling alone",
  },
];

export default function Signup() {
  const { signup, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [travelerType, setTravelerType] = useState("standard");
  const [localError, setLocalError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [step, setStep] = useState(1); // 1=account, 2=profile

  useEffect(() => {
    clearError();
  }, []);

  const validate = () => {
    if (!name.trim()) return "Full name is required.";
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return "Enter a valid email address.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    if (!agreed) return "Please agree to the Terms of Service.";
    return "";
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!name.trim()) { setLocalError("Full name is required."); return; }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setLocalError("Enter a valid email."); return; }
    if (password.length < 8) { setLocalError("Password must be at least 8 characters."); return; }
    if (password !== confirmPassword) { setLocalError("Passwords do not match."); return; }
    setLocalError("");
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) { setLocalError("Please agree to the Terms of Service to continue."); return; }
    const err = validate();
    if (err) { setLocalError(err); return; }
    setLocalError("");

    const ok = await signup({ name, email, password, travelerType });
    if (ok) navigate("/", { replace: true });
  };

  const pwStrength = PASSWORD_RULES.filter((r) => r.test(password)).length;
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
        <div className="auth-ring auth-ring-1" />
        <div className="auth-ring auth-ring-2" />
        <div className="auth-ring auth-ring-3" />
      </div>

      <div className="auth-layout">
        {/* Left — Hero Panel */}
        <div className="auth-hero-panel">
          <div className="auth-hero-content">
            <div className="auth-hero-logo">
              <div className="auth-logo-icon">
                <Shield size={36} strokeWidth={2} />
              </div>
              <div>
                <h1 className="auth-hero-title">SafeRoute AI</h1>
                <p className="auth-hero-tagline">Tata Innovert Challenge 2026</p>
              </div>
            </div>

            <div className="auth-hero-text">
              <h2 className="auth-hero-headline">
                Join the Safety<br />
                <span className="auth-hero-highlight">Revolution</span>
              </h2>
              <p className="auth-hero-desc">
                Create your free SafeRoute account and get instant access to AI-powered
                crime risk analysis, safe route recommendations, and real-time district
                safety scores for all of Tamil Nadu.
              </p>
            </div>

            <div className="auth-signup-benefits">
              {[
                "Free access to all 46 district risk profiles",
                "Personalized route recommendations for your traveler profile",
                "Real-time navigation alerts with voice assistance",
                "Crime analytics dashboard with trend charts",
                "Solo female traveler enhanced safety mode",
              ].map((b, i) => (
                <div key={i} className="auth-benefit-item">
                  <div className="auth-benefit-check">
                    <Check size={12} />
                  </div>
                  <span>{b}</span>
                </div>
              ))}
            </div>

            {/* Step indicator */}
            <div className="auth-step-indicator">
              <div className={`auth-step-dot ${step >= 1 ? "active" : ""}`}>
                <span>1</span>
                <label>Account</label>
              </div>
              <div className="auth-step-line" />
              <div className={`auth-step-dot ${step >= 2 ? "active" : ""}`}>
                <span>2</span>
                <label>Profile</label>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Signup Card */}
        <div className="auth-card-panel">
          <div className="auth-card">
            {step === 1 ? (
              <>
                <div className="auth-card-header">
                  <h2 className="auth-card-title">Create your account</h2>
                  <p className="auth-card-subtitle">Step 1 of 2 — Account details</p>
                </div>

                <form className="auth-form" onSubmit={handleNext} noValidate>
                  {/* Full Name */}
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="signup-name">Full Name</label>
                    <div className="auth-input-wrap">
                      <User size={16} className="auth-input-icon" />
                      <input
                        id="signup-name"
                        type="text"
                        className="auth-input"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setLocalError(""); }}
                        autoComplete="name"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="signup-email">Email Address</label>
                    <div className="auth-input-wrap">
                      <Mail size={16} className="auth-input-icon" />
                      <input
                        id="signup-email"
                        type="email"
                        className="auth-input"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setLocalError(""); clearError(); }}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="signup-password">Password</label>
                    <div className="auth-input-wrap">
                      <Lock size={16} className="auth-input-icon" />
                      <input
                        id="signup-password"
                        type={showPass ? "text" : "password"}
                        className="auth-input"
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setLocalError(""); }}
                        autoComplete="new-password"
                      />
                      <button type="button" className="auth-eye-btn" onClick={() => setShowPass((v) => !v)} tabIndex={-1}>
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Password strength */}
                    {password.length > 0 && (
                      <div className="auth-pw-strength">
                        <div className="auth-pw-bars">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className={`auth-pw-bar ${
                                i < pwStrength
                                  ? pwStrength === 1 ? "weak" : pwStrength === 2 ? "medium" : "strong"
                                  : ""
                              }`}
                            />
                          ))}
                        </div>
                        <span className={`auth-pw-label ${pwStrength === 1 ? "weak" : pwStrength === 2 ? "medium" : pwStrength === 3 ? "strong" : ""}`}>
                          {pwStrength === 0 ? "" : pwStrength === 1 ? "Weak" : pwStrength === 2 ? "Good" : "Strong"}
                        </span>
                      </div>
                    )}

                    {/* Rules */}
                    {password.length > 0 && (
                      <div className="auth-pw-rules">
                        {PASSWORD_RULES.map((r) => (
                          <div key={r.label} className={`auth-pw-rule ${r.test(password) ? "pass" : ""}`}>
                            <Check size={10} />
                            <span>{r.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="signup-confirm">Confirm Password</label>
                    <div className="auth-input-wrap">
                      <Lock size={16} className="auth-input-icon" />
                      <input
                        id="signup-confirm"
                        type={showConfirm ? "text" : "password"}
                        className={`auth-input ${confirmPassword && password !== confirmPassword ? "input-error" : confirmPassword && password === confirmPassword ? "input-success" : ""}`}
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setLocalError(""); }}
                        autoComplete="new-password"
                      />
                      <button type="button" className="auth-eye-btn" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1}>
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="auth-field-error">Passwords don't match</p>
                    )}
                  </div>

                  {displayError && (
                    <div className="auth-error-msg">
                      <AlertCircle size={15} />
                      <span>{displayError}</span>
                    </div>
                  )}

                  <button type="submit" className="auth-submit-btn" id="signup-next-btn">
                    <span>Continue</span>
                    <ArrowRight size={18} />
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="auth-card-header">
                  <h2 className="auth-card-title">Your Traveler Profile</h2>
                  <p className="auth-card-subtitle">Step 2 of 2 — Personalize your experience</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                  {/* Traveler type */}
                  <div className="auth-field">
                    <label className="auth-label">Traveler Profile</label>
                    <p className="auth-field-hint">
                      This helps us personalize your safety recommendations and route scoring.
                    </p>
                    <div className="auth-traveler-grid">
                      {TRAVELER_TYPES.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className={`auth-traveler-card ${travelerType === t.id ? "selected" : ""}`}
                          onClick={() => setTravelerType(t.id)}
                        >
                          <div className="auth-traveler-icon">{t.icon}</div>
                          <div className="auth-traveler-text">
                            <span className="auth-traveler-label">{t.label}</span>
                            <span className="auth-traveler-desc">{t.desc}</span>
                          </div>
                          {travelerType === t.id && (
                            <div className="auth-traveler-check">
                              <Check size={12} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Welcome summary */}
                  <div className="auth-profile-summary">
                    <ShieldCheck size={16} className="auth-summary-icon" />
                    <div>
                      <p className="auth-summary-name">Welcome, {name || "User"}!</p>
                      <p className="auth-summary-email">{email}</p>
                    </div>
                  </div>

                  {/* Terms */}
                  <label className="auth-checkbox-label auth-tos-label">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => { setAgreed(e.target.checked); setLocalError(""); }}
                      className="auth-checkbox"
                    />
                    <span>
                      I agree to the{" "}
                      <span className="auth-link-text">Terms of Service</span> and{" "}
                      <span className="auth-link-text">Privacy Policy</span>
                    </span>
                  </label>

                  {displayError && (
                    <div className="auth-error-msg">
                      <AlertCircle size={15} />
                      <span>{displayError}</span>
                    </div>
                  )}

                  <div className="auth-btn-row">
                    <button
                      type="button"
                      className="auth-back-btn"
                      onClick={() => { setStep(1); setLocalError(""); }}
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      className="auth-submit-btn flex-1"
                      disabled={loading}
                      id="signup-submit-btn"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={18} className="spin" />
                          <span>Creating account...</span>
                        </>
                      ) : (
                        <>
                          <span>Create Account</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}

            <p className="auth-switch-text">
              Already have an account?{" "}
              <Link to="/login" className="auth-switch-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
