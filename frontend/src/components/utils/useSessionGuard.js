import { useEffect, useRef } from 'react';

const POLL_INTERVAL = 5_000;
const STATUS_URL = `${import.meta.env.VITE_CENTRAL_PORTAL_API_URL || 'https://pilargroup.id'}/api/auth/status`;
const SSO_LOGIN_URL = import.meta.env.VITE_SSO_LOGIN_URL || 'https://pilargroup.id/login';

function getPilagroupToken() {
  // Ticket pakai Sanctum token sendiri, tapi kita butuh
  // pilargroup JWT untuk hit /api/auth/status
  // Simpan pg_token saat SSO success
  return localStorage.getItem('pg_token') || null;
}

function handleExpired() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('pg_token');
  window.location.href = SSO_LOGIN_URL;
}

export function useSessionGuard() {
  const intervalRef = useRef(null);

  useEffect(() => {
    const pgToken = getPilagroupToken();
    if (!pgToken) return; // Tidak ada pg_token, skip polling

    const check = async () => {
      try {
        const res = await fetch(STATUS_URL, {
          headers: { Authorization: `Bearer ${pgToken}` },
        });

        if (res.status === 401) {
          handleExpired();
          return;
        }

        if (!res.ok) return;

        const data = await res.json();

        if (!data.valid) {
          handleExpired();
          return;
        }

        // Cek cv
        const storedCv = localStorage.getItem('pg_cv');
        if (data.token_version !== undefined) {
          if (storedCv === null || Number(storedCv) !== Number(data.token_version)) {
            handleExpired();
          }
        }

      } catch {
        // network error sementara, skip
      }
    };

    check();
    intervalRef.current = setInterval(check, POLL_INTERVAL);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        check();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}