import { useState } from "react";
import {
  Brain, Database, Network, ShieldCheck, Route,
  ChevronDown, ChevronUp, Activity, Cpu,
  GitBranch, BarChart2, AlertTriangle, Layers,
  ArrowRight, ArrowDown, Zap, Users, Map, Clock
} from "lucide-react";

const PIPELINE_STEPS = [
  {
    id: 1,
    icon: Database,
    color: "#6366f1",
    title: "Data Ingestion",
    subtitle: "Crime Dataset (NCRB 2022)",
    description:
      "Real-world crime statistics for all 46 Tamil Nadu districts are loaded from the National Crime Records Bureau dataset. Each record contains 8+ crime categories: assault, sexual harassment, stalking, rape, voyeurism, disrobing, and more.",
    details: [
      "46 Tamil Nadu districts covered",
      "8 crime sub-categories per district",
      "Total crime incidents + crime rate per lakh",
      "Severity scoring via weighted aggregation",
    ],
    badge: "CSV → Pandas",
  },
  {
    id: 2,
    icon: Brain,
    color: "#8b5cf6",
    title: "ML Risk Classifier",
    subtitle: "Random Forest Model",
    description:
      "A trained Random Forest classifier predicts each district's risk level (Low / Medium / High) based on the crime feature vector. When the model is unavailable, a deterministic rule-based fallback uses pre-computed risk labels from the CSV.",
    details: [
      "9 input features (crime columns + crime rate)",
      "3-class output: Low, Medium, High",
      "~92% confidence on dataset districts",
      "Deterministic fallback via rule engine",
    ],
    badge: "scikit-learn RF",
  },
  {
    id: 3,
    icon: Cpu,
    color: "#ec4899",
    title: "Score Adjustment Engine",
    subtitle: "Context-Aware Safety Scoring",
    description:
      "Base safety scores (Low=85, Medium=55, High=20) are dynamically adjusted based on travel context. Night travel, walking mode, and solo female traveler profiles all reduce the adjusted score, updating the district's dynamic risk tier.",
    details: [
      "Night penalty: −2 to −10 points",
      "Walking penalty: −3 to −12 points",
      "Solo female: stalking/harassment weighted",
      "Clamped to [0, 100] range",
    ],
    badge: "Rule-based adjuster",
  },
  {
    id: 4,
    icon: GitBranch,
    color: "#f59e0b",
    title: "BFS Path Finder",
    subtitle: "Graph Traversal on TN District Graph",
    description:
      "All 46 districts are represented as nodes in an adjacency graph with real geographic neighbors. Breadth-First Search finds up to 3 distinct paths from source to destination, respecting the avoid-high-risk preference when set.",
    details: [
      "Adjacency graph: 46 nodes, ~90 edges",
      "BFS discovers up to 3 candidate paths",
      "Max path depth: 12 districts",
      "Stopover support: merges two BFS segments",
    ],
    badge: "BFS Graph Search",
  },
  {
    id: 5,
    icon: Route,
    color: "#10b981",
    title: "Route Ranking",
    subtitle: "Safety-Weighted Scoring",
    description:
      "Each candidate path is scored by aggregating adjusted district safety scores, applying heavy penalties for High-risk zones (−12 pts each) and mild penalties for Medium zones (−4 pts). Routes are then sorted descending by adjusted safety score.",
    details: [
      "High-risk penalty: −12 pts/district",
      "Medium-risk penalty: −4 pts/district",
      "Haversine distance calculation (km)",
      "Travel time: distance ÷ speed (60/5 km·h⁻¹)",
    ],
    badge: "Safety-first sort",
  },
  {
    id: 6,
    icon: ShieldCheck,
    color: "#06b6d4",
    title: "Advisory Generator",
    subtitle: "Localized Safety Guidance",
    description:
      "Per-district advisories are generated from the risk context. Stalking/harassment thresholds trigger solo-female-specific warnings, night travel triggers lighting/patrol advisories, and walking mode triggers pedestrian-safety alerts.",
    details: [
      "Stalking > 10: solo-female warning",
      "Night + High/Medium: low-patrol alert",
      "Walking + High: pedestrian theft warning",
      "Low risk: positive confirmation message",
    ],
    badge: "Template rules",
  },
];

const ALGORITHMS = [
  {
    title: "Haversine Distance",
    icon: Map,
    color: "#6366f1",
    formula: "d = 2R · arcsin(√(sin²(Δφ/2) + cos φ₁ · cos φ₂ · sin²(Δλ/2)))",
    description: "Calculates great-circle distance between two geographic coordinates in km, used to compute route length across district centroids.",
  },
  {
    title: "Safety Score Formula",
    icon: Activity,
    color: "#10b981",
    formula: "S_adj = clamp(S_base − P_night − P_mode − P_traveler, 0, 100)",
    description: "Each district's base ML safety score is penalized based on travel conditions. The aggregate route score subtracts High/Medium district penalties.",
  },
  {
    title: "Route Ranking Score",
    icon: BarChart2,
    color: "#f59e0b",
    formula: "R_score = avg(S_adj) − 12·n_high − 4·n_medium",
    description: "The final route score favors paths that minimize high-risk segments. Up to 3 routes are ranked, and the highest scorer is labeled 'Recommended Safest Route'.",
  },
];

const TECH_STACK = [
  { name: "React + Vite", role: "Frontend SPA", color: "#61dafb", icon: Layers },
  { name: "Flask", role: "REST API Backend", color: "#10b981", icon: Zap },
  { name: "scikit-learn", role: "Random Forest Model", color: "#f59e0b", icon: Brain },
  { name: "Leaflet.js", role: "Interactive Map", color: "#6366f1", icon: Map },
  { name: "Chart.js", role: "Analytics Charts", color: "#ec4899", icon: BarChart2 },
  { name: "NCRB Dataset", role: "Crime Statistics", color: "#ef4444", icon: Database },
  { name: "BFS Graph", role: "Route Discovery", color: "#8b5cf6", icon: GitBranch },
  { name: "Web Speech API", role: "Voice Navigation", color: "#06b6d4", icon: Users },
];

function PipelineCard({ step, index, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = step.icon;

  return (
    <div className="pipeline-wrapper">
      <div
        className={`pipeline-card ${expanded ? "expanded" : ""}`}
        style={{ "--step-color": step.color }}
      >
        <div className="pipeline-card-main" onClick={() => setExpanded((v) => !v)}>
          <div className="pipeline-step-num" style={{ background: step.color + "22", color: step.color }}>
            {index + 1}
          </div>
          <div className="pipeline-icon-wrap" style={{ background: step.color + "20" }}>
            <Icon size={20} style={{ color: step.color }} />
          </div>
          <div className="pipeline-card-info">
            <div className="pipeline-card-title">{step.title}</div>
            <div className="pipeline-card-subtitle">{step.subtitle}</div>
          </div>
          <span className="pipeline-badge" style={{ background: step.color + "22", color: step.color }}>
            {step.badge}
          </span>
          <button className="pipeline-expand-btn">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {expanded && (
          <div className="pipeline-card-details">
            <p className="pipeline-desc">{step.description}</p>
            <ul className="pipeline-detail-list">
              {step.details.map((d, i) => (
                <li key={i}>
                  <span className="detail-bullet" style={{ background: step.color }} />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {!isLast && (
        <div className="pipeline-connector">
          <ArrowDown size={18} className="connector-arrow" />
        </div>
      )}
    </div>
  );
}

function AlgoCard({ algo }) {
  const Icon = algo.icon;
  return (
    <div className="algo-card" style={{ "--algo-color": algo.color }}>
      <div className="algo-icon-wrap" style={{ background: algo.color + "20" }}>
        <Icon size={18} style={{ color: algo.color }} />
      </div>
      <h4 className="algo-title">{algo.title}</h4>
      <div className="algo-formula">{algo.formula}</div>
      <p className="algo-desc">{algo.description}</p>
    </div>
  );
}

function TechCard({ tech }) {
  const Icon = tech.icon;
  return (
    <div className="tech-card" style={{ "--tech-color": tech.color }}>
      <div className="tech-icon-wrap" style={{ background: tech.color + "20" }}>
        <Icon size={16} style={{ color: tech.color }} />
      </div>
      <div>
        <div className="tech-name">{tech.name}</div>
        <div className="tech-role">{tech.role}</div>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <div className="hiw-page">
      {/* Hero Banner */}
      <div className="hiw-hero">
        <div className="hiw-hero-content">
          <div className="hiw-hero-badge">
            <Brain size={14} />
            <span>AI Architecture</span>
          </div>
          <h1 className="hiw-hero-title">How SafeRoute AI Works</h1>
          <p className="hiw-hero-subtitle">
            End-to-end pipeline from raw crime data to an intelligent, context-aware safe-route recommendation —
            powered by a Random Forest classifier, BFS graph traversal, and real-time advisory generation.
          </p>
          <div className="hiw-hero-stats">
            <div className="hiw-hero-stat">
              <span className="hs-value">46</span>
              <span className="hs-label">Districts Modeled</span>
            </div>
            <div className="hiw-stat-divider" />
            <div className="hiw-hero-stat">
              <span className="hs-value">8</span>
              <span className="hs-label">Crime Categories</span>
            </div>
            <div className="hiw-stat-divider" />
            <div className="hiw-hero-stat">
              <span className="hs-value">3</span>
              <span className="hs-label">Route Alternatives</span>
            </div>
            <div className="hiw-stat-divider" />
            <div className="hiw-hero-stat">
              <span className="hs-value">92%</span>
              <span className="hs-label">Model Confidence</span>
            </div>
          </div>
        </div>
        <div className="hiw-hero-visual">
          <div className="hiw-orb hiw-orb-1" />
          <div className="hiw-orb hiw-orb-2" />
          <div className="hiw-orb hiw-orb-3" />
          <Network size={120} className="hiw-hero-icon" />
        </div>
      </div>

      <div className="hiw-body">
        {/* Pipeline Section */}
        <section className="hiw-section">
          <div className="hiw-section-header">
            <div className="hiw-section-badge" style={{ background: "var(--primary-glow)", color: "var(--primary)" }}>
              <Cpu size={14} /> Processing Pipeline
            </div>
            <h2 className="hiw-section-title">6-Stage AI Processing Pipeline</h2>
            <p className="hiw-section-desc">
              Each route query is processed through six distinct stages — from data ingestion to scored, ranked, and advisory-enriched results.
              Click any stage to expand details.
            </p>
          </div>
          <div className="pipeline-list">
            {PIPELINE_STEPS.map((step, i) => (
              <PipelineCard key={step.id} step={step} index={i} isLast={i === PIPELINE_STEPS.length - 1} />
            ))}
          </div>
        </section>

        {/* Algorithms Section */}
        <section className="hiw-section">
          <div className="hiw-section-header">
            <div className="hiw-section-badge" style={{ background: "rgba(16,185,129,0.12)", color: "var(--risk-low)" }}>
              <Activity size={14} /> Core Algorithms
            </div>
            <h2 className="hiw-section-title">Mathematical Foundations</h2>
            <p className="hiw-section-desc">
              Three core mathematical models power the route safety computation.
            </p>
          </div>
          <div className="algo-grid">
            {ALGORITHMS.map((a) => (
              <AlgoCard key={a.title} algo={a} />
            ))}
          </div>
        </section>

        {/* Graph Visualization / District Graph Explanation */}
        <section className="hiw-section">
          <div className="hiw-section-header">
            <div className="hiw-section-badge" style={{ background: "rgba(245,158,11,0.12)", color: "var(--risk-medium)" }}>
              <GitBranch size={14} /> District Graph
            </div>
            <h2 className="hiw-section-title">Tamil Nadu District Adjacency Graph</h2>
            <p className="hiw-section-desc">
              The route engine uses a hand-crafted, geographically accurate adjacency graph covering all 46 Tamil Nadu districts.
            </p>
          </div>
          <div className="graph-info-grid">
            <div className="graph-info-card primary">
              <Network size={32} className="gi-icon" />
              <div className="gi-stat">46</div>
              <div className="gi-label">District Nodes</div>
              <p className="gi-desc">Each node represents a Tamil Nadu district with real lat/lng centroid coordinates and a list of bordering neighbors.</p>
            </div>
            <div className="graph-info-card green">
              <GitBranch size={32} className="gi-icon green" />
              <div className="gi-stat">~90</div>
              <div className="gi-label">Adjacency Edges</div>
              <p className="gi-desc">Edges connect geographically bordering districts. BFS traverses these edges to discover candidate paths.</p>
            </div>
            <div className="graph-info-card amber">
              <Route size={32} className="gi-icon amber" />
              <div className="gi-stat">≤ 3</div>
              <div className="gi-label">Route Candidates</div>
              <p className="gi-desc">BFS stops when up to 3 distinct paths are found. Each path is then scored independently by the safety engine.</p>
            </div>
            <div className="graph-info-card red">
              <AlertTriangle size={32} className="gi-icon red" />
              <div className="gi-stat">Max 12</div>
              <div className="gi-label">Max Path Depth</div>
              <p className="gi-desc">Paths longer than 12 districts are pruned to avoid unrealistic routes. A fallback direct edge is used if BFS finds no valid paths.</p>
            </div>
          </div>
        </section>

        {/* Risk Parameters Table */}
        <section className="hiw-section">
          <div className="hiw-section-header">
            <div className="hiw-section-badge" style={{ background: "rgba(239,68,68,0.12)", color: "var(--risk-high)" }}>
              <AlertTriangle size={14} /> Risk Parameters
            </div>
            <h2 className="hiw-section-title">Context-Aware Penalty Matrix</h2>
            <p className="hiw-section-desc">
              Every query provides travel context that dynamically adjusts the base safety score before route ranking.
            </p>
          </div>
          <div className="penalty-table-wrapper">
            <table className="penalty-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Condition</th>
                  <th>Effect on Score</th>
                  <th>Applies To</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="param-badge time"><Clock size={12} /> Time of Day</span></td>
                  <td>Night</td>
                  <td className="penalty-val red">−2 to −10 pts</td>
                  <td>All districts (risk-scaled)</td>
                </tr>
                <tr>
                  <td><span className="param-badge mode">🚶 Travel Mode</span></td>
                  <td>Walking</td>
                  <td className="penalty-val red">−3 to −12 pts</td>
                  <td>High/Medium/Low risk districts</td>
                </tr>
                <tr>
                  <td><span className="param-badge traveler">👤 Traveler Type</span></td>
                  <td>Solo Female</td>
                  <td className="penalty-val red">−0 to −15 pts</td>
                  <td>Districts with high stalking/harassment</td>
                </tr>
                <tr>
                  <td><span className="param-badge route">🛣️ Route Risk</span></td>
                  <td>High-risk district on path</td>
                  <td className="penalty-val red">−12 pts</td>
                  <td>Per High-risk district in path</td>
                </tr>
                <tr>
                  <td><span className="param-badge route">🟡 Medium Risk</span></td>
                  <td>Medium-risk district on path</td>
                  <td className="penalty-val amber">−4 pts</td>
                  <td>Per Medium-risk district in path</td>
                </tr>
                <tr>
                  <td><span className="param-badge safe">✅ Low Risk</span></td>
                  <td>Low-risk district on path</td>
                  <td className="penalty-val green">No penalty</td>
                  <td>Baseline safety</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Technology Stack */}
        <section className="hiw-section">
          <div className="hiw-section-header">
            <div className="hiw-section-badge" style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6" }}>
              <Layers size={14} /> Technology Stack
            </div>
            <h2 className="hiw-section-title">Built With</h2>
            <p className="hiw-section-desc">
              SafeRoute AI is built with a modern, full-stack Python + React architecture for the Tata Innovert Hackathon 2026.
            </p>
          </div>
          <div className="tech-grid">
            {TECH_STACK.map((t) => (
              <TechCard key={t.name} tech={t} />
            ))}
          </div>
        </section>

        {/* Data Flow Diagram (text-based visual) */}
        <section className="hiw-section">
          <div className="hiw-section-header">
            <div className="hiw-section-badge" style={{ background: "rgba(6,182,212,0.12)", color: "#06b6d4" }}>
              <ArrowRight size={14} /> Data Flow
            </div>
            <h2 className="hiw-section-title">End-to-End Request Flow</h2>
            <p className="hiw-section-desc">
              How a single user query flows from the UI through the AI engine to the result rendered on the map.
            </p>
          </div>
          <div className="dataflow-diagram">
            {[
              { label: "User inputs Source + Destination + Preferences", color: "#6366f1", icon: "👤" },
              { label: "React → POST /api/safe-route (Flask)", color: "#8b5cf6", icon: "🔗" },
              { label: "Route Engine: BFS finds candidate paths", color: "#f59e0b", icon: "🔍" },
              { label: "Predictor: ML model or CSV lookup per district", color: "#ec4899", icon: "🧠" },
              { label: "Score Adjuster: apply travel context penalties", color: "#ef4444", icon: "⚖️" },
              { label: "Advisory Generator: per-district safety tips", color: "#10b981", icon: "📋" },
              { label: "Routes ranked & returned as JSON", color: "#06b6d4", icon: "📊" },
              { label: "Map rendered with color-coded risk segments", color: "#6366f1", icon: "🗺️" },
            ].map((step, i, arr) => (
              <div key={i} className="df-step-wrapper">
                <div className="df-step" style={{ borderColor: step.color + "40", background: step.color + "0d" }}>
                  <span className="df-emoji">{step.icon}</span>
                  <span className="df-label">{step.label}</span>
                  <span className="df-num" style={{ color: step.color }}>0{i + 1}</span>
                </div>
                {i < arr.length - 1 && (
                  <ArrowDown size={14} className="df-arrow" style={{ color: step.color }} />
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
