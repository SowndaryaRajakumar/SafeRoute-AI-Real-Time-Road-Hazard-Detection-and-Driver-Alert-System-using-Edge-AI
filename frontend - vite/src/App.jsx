import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Header from "./components/layout/Header";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import HowItWorks from "./pages/HowItWorks";
import DistrictLookup from "./pages/DistrictLookup";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            {/* Public auth routes — no header */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected app routes — with header */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <div className="app-shell">
                    <Header />
                    <main className="app-main">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/how-it-works" element={<HowItWorks />} />
                        <Route path="/district-lookup" element={<DistrictLookup />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </main>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}
