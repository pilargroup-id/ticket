import { Navigate } from "react-router-dom";
import authService from "../../services/AuthService";

const PublicRoute = ({ children }) => {
  const isAuth = authService.isAuthenticated();
  
  if (isAuth) {
    const user = authService.getUser();
    const role = user?.role || "user";
    
    // Redirect authenticated users to their dashboard
    if (role === "admin") {
      return <Navigate to="/ticket-monitoring" replace />;
    }
    return <Navigate to="/my-ticket" replace />;
  }

  // Not authenticated - allow access to public pages (login/register)
  return children;
};

export default PublicRoute;
