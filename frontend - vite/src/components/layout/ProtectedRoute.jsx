import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Loader2, Shield } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-inner">
          <div className="auth-loading-logo">
            <Shield size={32} strokeWidth={2.5} />
          </div>
          <Loader2 size={24} className="spin" />
          <p>Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
