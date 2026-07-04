import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { api } from "../services/api";
import { Loader2, BarChart2, PieChart, TrendingUp, AlertTriangle, ShieldCheck } from "lucide-react";
import { CHART_COLORS, RISK_COLORS } from "../utils/constants";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
);

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: "var(--text-secondary)", font: { family: "Inter" } } },
  },
  scales: {
    x: { ticks: { color: "var(--text-secondary)" }, grid: { color: "var(--border)" } },
    y: { ticks: { color: "var(--text-secondary)" }, grid: { color: "var(--border)" } },
  },
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);

  useEffect(() => {
    api.getCrimeDashboard()
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  const fetchReport = async () => {
    setReportError(null);
    setReportLoading(true);
    try {
      const r = await api.getCrimeReport();
      setReport(r?.report || "");
    } catch (e) {
      setReportError(e.message);
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <Loader2 size={36} className="spin" />
        <p>Loading Analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-error">
        <AlertTriangle size={32} />
        <p>Failed to load analytics: {error}</p>
        <p className="hint">Make sure the backend is running on port 5000.</p>
      </div>
    );
  }

  const crimeCategoryChart = {
    labels: data?.crime_categories?.labels || [],
    datasets: [{
      label: "Total Incidents",
      data: data?.crime_categories?.data || [],
      backgroundColor: CHART_COLORS.map((c) => c + "cc"),
      borderColor: CHART_COLORS,
      borderWidth: 1,
      borderRadius: 6,
    }],
  };

  const riskDist = data?.risk_distribution || {};
  const riskDonut = {
    labels: Object.keys(riskDist),
    datasets: [{
      data: Object.values(riskDist),
      backgroundColor: [
        RISK_COLORS.Low.hex + "cc",
        RISK_COLORS.Medium.hex + "cc",
        RISK_COLORS.High.hex + "cc",
      ],
      borderColor: [RISK_COLORS.Low.hex, RISK_COLORS.Medium.hex, RISK_COLORS.High.hex],
      borderWidth: 2,
    }],
  };

  const crimeRates = data?.district_crime_rates || [];
  const crimeRateChart = {
    labels: crimeRates.slice(0, 15).map((d) => d.district),
    datasets: [{
      label: "Crime Rate",
      data: crimeRates.slice(0, 15).map((d) => d.crime_rate),
      borderColor: "#6366f1",
      backgroundColor: "rgba(99,102,241,0.15)",
      pointBackgroundColor: crimeRates.slice(0, 15).map((d) =>
        RISK_COLORS[d.risk_level]?.hex || "#888"
      ),
      fill: true,
      tension: 0.4,
      pointRadius: 5,
    }],
  };

  return (
    <div className="analytics-page">
      {/* Summary cards */}
      <div className="analytics-summary">
        <div className="summary-card">
          <BarChart2 size={22} className="summary-icon indigo" />
          <div>
            <p className="summary-value">{data?.total_incidents?.toLocaleString()}</p>
            <p className="summary-label">Total Incidents</p>
          </div>
        </div>
        <div className="summary-card">
          <PieChart size={22} className="summary-icon amber" />
          <div>
            <p className="summary-value">{data?.total_districts}</p>
            <p className="summary-label">Districts Analyzed</p>
          </div>
        </div>
        <div className="summary-card">
          <AlertTriangle size={22} className="summary-icon red" />
          <div>
            <p className="summary-value">{riskDist?.High || 0}</p>
            <p className="summary-label">High-Risk Districts</p>
          </div>
        </div>
        <div className="summary-card">
          <ShieldCheck size={22} className="summary-icon green" />
          <div>
            <p className="summary-value">{riskDist?.Low || 0}</p>
            <p className="summary-label">Low-Risk Districts</p>
          </div>
        </div>
      </div>

      {/* Report generator */}
      <div className="analytics-report-bar">
        <div className="report-bar-left">
          <h2>Crime Analysis Report</h2>
          <p className="muted">Generated from <strong>crime_master_dataset.csv</strong> on the backend.</p>
        </div>
        <div className="report-bar-right">
          <button className="report-btn" type="button" onClick={fetchReport} disabled={reportLoading}>
            {reportLoading ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </div>

      {reportError && (
        <div className="analytics-error report-error-inline">
          <AlertTriangle size={28} />
          <p>Failed to generate report: {reportError}</p>
        </div>
      )}

      {report && (
        <div className="report-card">
          <div className="report-card-header">
            <h3>CSV-Based Report (Markdown)</h3>
          </div>
          <pre className="report-pre">{report}</pre>
        </div>
      )}

      <div className="analytics-grid">
        {/* Crime categories bar chart */}
        <div className="chart-card span-2">
          <div className="chart-card-header">
            <BarChart2 size={16} />
            <h3>Crime Categories (All Districts)</h3>
          </div>
          <div className="chart-area">
            <Bar data={crimeCategoryChart} options={{ ...chartDefaults, plugins: { ...chartDefaults.plugins, title: { display: false } } }} />
          </div>
        </div>

        {/* Risk distribution donut */}
        <div className="chart-card">
          <div className="chart-card-header">
            <PieChart size={16} />
            <h3>Risk Distribution</h3>
          </div>
          <div className="chart-area donut-area">
            <Doughnut
              data={riskDonut}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "bottom", labels: { color: "var(--text-secondary)", font: { family: "Inter" } } },
                },
                cutout: "65%",
              }}
            />
          </div>
        </div>

        {/* Crime rate trend chart */}
        <div className="chart-card span-2">
          <div className="chart-card-header">
            <TrendingUp size={16} />
            <h3>Crime Rate by District (Top 15)</h3>
          </div>
          <div className="chart-area">
            <Line data={crimeRateChart} options={{
              ...chartDefaults,
              plugins: {
                ...chartDefaults.plugins,
                legend: { display: false },
              },
            }} />
          </div>
        </div>

        {/* Top dangerous districts */}
        <div className="chart-card">
          <div className="chart-card-header">
            <AlertTriangle size={16} />
            <h3>Most Dangerous Districts</h3>
          </div>
          <div className="district-list">
            {(data?.top_dangerous_districts || []).map((d, i) => (
              <div key={i} className="district-list-item">
                <span className="dl-rank">{i + 1}</span>
                <span className="dl-name">{d.district}</span>
                <span className={`risk-badge risk-${d.risk_level?.toLowerCase()}`}>{d.risk_level}</span>
                <span className="dl-stat">{d.incidents} incidents</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top safe districts */}
        <div className="chart-card">
          <div className="chart-card-header">
            <ShieldCheck size={16} />
            <h3>Safest Districts</h3>
          </div>
          <div className="district-list">
            {(data?.top_safe_districts || []).map((d, i) => (
              <div key={i} className="district-list-item">
                <span className="dl-rank safe">{i + 1}</span>
                <span className="dl-name">{d.district}</span>
                <span className={`risk-badge risk-${d.risk_level?.toLowerCase()}`}>{d.risk_level}</span>
                <span className="dl-stat safe">{d.incidents} incidents</span>
              </div>
            ))}
          </div>
        </div>

        {/* Full district crime rate table */}
        <div className="chart-card span-3">
          <div className="chart-card-header">
            <BarChart2 size={16} />
            <h3>All Districts — Crime Rate &amp; Risk Level</h3>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>District</th>
                  <th>Crime Rate</th>
                  <th>Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {(data?.district_crime_rates || []).map((d, i) => (
                  <tr key={i}>
                    <td className="td-rank">{i + 1}</td>
                    <td>{d.district}</td>
                    <td>{d.crime_rate}</td>
                    <td>
                      <span className={`risk-badge risk-${d.risk_level?.toLowerCase()}`}>
                        {d.risk_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
