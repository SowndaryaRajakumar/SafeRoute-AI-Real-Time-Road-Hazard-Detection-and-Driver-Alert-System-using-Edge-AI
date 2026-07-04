import { useMemo } from "react";
import { RISK_SCORE_COLOR } from "../../utils/constants";
import { ShieldCheck, ShieldAlert, Shield } from "lucide-react";

const CIRCUMFERENCE = 2 * Math.PI * 52;

export default function SafetyScore({ score, riskLevel, label = "Overall Safety" }) {
  const color = RISK_SCORE_COLOR(score);
  const offset = useMemo(
    () => CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE,
    [score]
  );

  const Icon =
    riskLevel === "Low" ? ShieldCheck :
    riskLevel === "High" ? ShieldAlert :
    Shield;

  const isRecommended = label?.toLowerCase().includes("recommended");

  return (
    <div className="safety-score-card" style={{ borderColor: color + "30", background: color + "08" }}>
      {isRecommended && (
        <div className="score-recommended-badge" style={{ background: color + "22", color }}>
          <ShieldCheck size={11} />
          <span>Recommended Safest Route</span>
        </div>
      )}
      <div className="score-gauge-wrapper">
        <svg className="score-ring" viewBox="0 0 120 120" width="100" height="100">
          {/* Glow filter */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Background ring */}
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="10" />
          {/* Progress ring */}
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
            style={{ transition: "stroke-dashoffset 1s ease" }}
            filter="url(#glow)"
          />
        </svg>
        <div className="score-center">
          <span className="score-value" style={{ color }}>{score}</span>
          <span className="score-unit">/100</span>
        </div>
      </div>

      <div className="score-meta">
        <p className="score-label">{isRecommended ? "Safety Score" : label}</p>
        <div className={`risk-badge risk-${riskLevel?.toLowerCase()}`}>
          <Icon size={13} />
          <span>{riskLevel} Risk</span>
        </div>
      </div>
    </div>
  );
}
