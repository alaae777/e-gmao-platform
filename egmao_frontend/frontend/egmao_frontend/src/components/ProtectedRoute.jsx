import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function normalizeRole(role) {
  return (role || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // enlève les accents
    .replace(/EMPLOYE$/, "EMPLOYEE"); // EMPLOYE → EMPLOYEE
}

export default function ProtectedRoute({ role, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = normalizeRole(user.role);
  const expectedRole = normalizeRole(role);

  if (role && userRole !== expectedRole) {
    return <Navigate to={userRole === "ADMIN" ? "/admin" : "/app"} replace />;
  }

  return children;
}