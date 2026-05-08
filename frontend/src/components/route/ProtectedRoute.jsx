import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../../services/AuthService';
import mockAuth from '../../utils/mockAuth';
import { useSessionGuard } from '../utils/useSessionGuard';

const ProtectedRoute = ({ children, requiredRole }) => {
  useSessionGuard();

  const [ready, setReady] = useState(false);

  useEffect(() => {
      if (authService.isAuthenticated()) {
        console.log('[ProtectedRoute] Already authenticated');
        setReady(true);
        return;
      }

      if (mockAuth.isMockAuthEnabled()) {
        console.log('[ProtectedRoute] Mock auth enabled, injecting...');
        mockAuth.autoInjectMockAuth().then((success) => {
          console.log('[ProtectedRoute] Inject result:', success);
          console.log('[ProtectedRoute] Token after inject:', localStorage.getItem('token'));
          setReady(true);
        });
        return;
      }

    // SSO flow (production)
    fetch(`${import.meta.env.VITE_API_URL}/auth/sso-url`)
      .then(r => r.json())
      .then(data => {
        if (data.url) window.location.href = data.url;
        else window.location.href = 'https://pilargroup.id/login';
      })
      .catch(() => {
        window.location.href = 'https://pilargroup.id/login';
      });
  }, []);

  if (!ready) return null; // tunggu inject selesai

  const user = authService.getUser();
  const role = user?.role;

  if (requiredRole && role !== requiredRole) {
    if (role === 'admin') return <Navigate to="/ticket-monitoring" replace />;
    return <Navigate to="/my-ticket" replace />;
  }

  return children;
};

export default ProtectedRoute;