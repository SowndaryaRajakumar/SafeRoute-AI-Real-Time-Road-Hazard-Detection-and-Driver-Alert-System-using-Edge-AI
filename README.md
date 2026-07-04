# AI-Powered Safe Route Recommendation System
## Tata Innovert Challenge Hackathon 2026

An intelligent, full-stack navigation and data analytics platform designed to solve the critical gap in current routing systems: **safety and crime prevention**. By utilizing historical crime data for Tamil Nadu's 46 districts and cities, the system predicts risk levels along routes and recommends the safest path.

---

## 🚀 Key Features

1. **Intelligent Safe Route Recommendation**:
   - Computes alternative routes using BFS on the Tamil Nadu district graph.
   - Evaluates each route using a **Random Forest Classifier** trained on crime features.
   - Outputs an **Overall Safety Score** (0-100) and color-coded path segments (Low/Medium/High risk).

2. **Interactive Map Visualization (Leaflet.js)**:
   - Visualizes paths dynamically with risk segments (Green = Safe/Low Risk, Yellow = Warning/Medium Risk, Red = Danger/High Risk).
   - Clickable district-level markers containing details on safety indicators, total incidents, and crime rates.
   - Supports seamless transitions between **Light and Dark modes** matching system theme preference.

3. **Advanced Crime Analytics Dashboard**:
   - Visualizes overall crime categories across all Tamil Nadu districts using Chart.js.
   - Displays risk distribution breakdowns and lists of safest vs. high-risk districts.
   - Includes a searchable data grid for checking all district statistics.

---

## 🛠️ Technology Stack & Model Details

- **ML Classifier**: Random Forest Classifier (`safe_route_model.pkl`)
- **Features Used**:
  - Assault on women with intent to outrage modesty (incidents)
  - Assault on women
  - Sexual harassment (total)
  - Assault/criminal force with intent to disrobe (sec 354B IPC)
  - Voyeurism
  - Stalking
  - Rape (sec 376)
  - Attempt to commit rape (sec 376/511)
  - Total crime rate
- **Backend**: Python Flask REST API
- **Frontend**: React.js (Vite) + Leaflet.js + Chart.js + CSS Variables (Light/Dark themes)

---

## 📂 Project Structure

```
Tata Hackathon/
├── backend/
│   ├── app.py                  # Main Flask API
│   ├── data/
│   │   └── tn_districts.json   # TN district geographical graph
│   ├── utils/
│   │   ├── predictor.py        # ML Prediction Engine loading .pkl
│   │   └── route_engine.py     # BFS routing and safety scoring engine
│   └── requirements.txt        # Backend dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   ├── contexts/           # Light/Dark Theme state
│   │   ├── pages/              # Dashboard and Analytics views
│   │   ├── services/           # Axios-based API service calls
│   │   ├── utils/              # Application constants
│   │   └── main.jsx            # Application mount point
│   ├── index.html
│   └── vite.config.js
│
├── run.bat                     # Full-system single-click startup script
└── README.md                   # Documentation
```

---

## ⚙️ How to Setup & Run

### The Easiest Way (Windows)
Double-click `run.bat` in the project root directory. The script will automatically:
1. Create a Python virtual environment (`venv`).
2. Activate the environment and install backend requirements.
3. Launch the Python Flask server (`http://localhost:5000`).
4. Launch the React frontend in your default browser (`http://localhost:3000`).

---

## 📊 API Reference

| Endpoint | Method | Payload / Response |
| :--- | :---: | :--- |
| `/api/predict` | `POST` | `{"district": "Chennai"}` → Predicts individual district risk. |
| `/api/safe-route` | `POST` | `{"source": "Chennai", "destination": "Coimbatore"}` → Returns ranked routes. |
| `/api/district-risk` | `GET` | Returns list of all districts with their current predicted risk levels. |
| `/api/crime-dashboard`| `GET` | Aggregated datasets for charts and maps. |
| `/api/districts` | `GET` | Returns an autocomplete-friendly list of districts. |
| `/api/health` | `GET` | API Healthcheck. |
