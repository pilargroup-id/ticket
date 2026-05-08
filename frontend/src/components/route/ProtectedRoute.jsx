import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../../services/AuthService';
import { useSessionGuard } from '../utils/useSessionGuard';

const ProtectedRoute = ({ children, requiredRole }) => {
  useSessionGuard();

  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated() && !redirecting) {
      setRedirecting(true);

      // Hit sso-url dulu untuk generate state
      fetch(`${import.meta.env.VITE_API_URL}/auth/sso-url`)
        .then(r => r.json())
        .then(data => {
          console.log('[ProtectedRoute] sso-url response:', data)
          if (data.url) {
            window.location.href = data.url;
          } else {
            window.location.href = import.meta.env.VITE_SSO_LOGIN_URL || 'https://pilargroup.id/login';
          }
        })
        .catch(() => {
          window.location.href = import.meta.env.VITE_SSO_LOGIN_URL || 'https://pilargroup.id/login';
        });
    }
  }, []);

  if (!authService.isAuthenticated()) {
    return null; // tunggu redirect
  }

  const user = authService.getUser();
  const role = user?.role;
  if (requiredRole && role !== requiredRole) {
    if (role === 'admin') {
      return <Navigate to="/ticket-monitoring" replace />;
    }
    return <Navigate to="/my-ticket" replace />;
  }

  return children;
};

export default ProtectedRoute;