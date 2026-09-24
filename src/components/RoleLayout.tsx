import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types";

function RoleLayout({ role }: { role: UserRole }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading">
        <p>Loading QueueCare…</p>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (profile.role !== role) {
    return (
      <Navigate
        to={profile.role === "doctor" ? "/doctor" : "/patient"}
        replace
      />
    );
  }

  return <Outlet />;
}

export default RoleLayout;
