// src/utils/mockAuth.js
/**
 * Mock Authentication untuk Development
 * Gunakan saat develop lokal tanpa perlu connect ke Pilargroup SSO
 * 
 * Credentials diambil dari .env.local:
 * - VITE_MOCK_AUTH=true/false
 * - VITE_MOCK_USERNAME=username
 * - VITE_MOCK_PASSWORD=password
 * - VITE_API_URL=http://localhost:8001/api
 * - VITE_PILARGROUP_LOCAL_URL=http://localhost:8000
 */

/**
 * Inject mock authentication dengan credentials dari .env.local
 * @param {string} username - username untuk mock login
 * @param {string} password - password untuk mock login
 * @returns {Promise<boolean>}
 */
export async function injectMockAuth(username, password) {
    console.log('[mockAuth] Attempting with:', username, password); // tambah ini
    try {
    const url = `${import.meta.env.VITE_API_URL}/dev/login`;
    console.log('[mockAuth] URL:', url);
    const response = await fetch(`${import.meta.env.VITE_API_URL}/dev/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    });

    console.log('[mockAuth] Response status:', response.status, response.ok);
    console.log('[mockAuth] URL hit:', `${import.meta.env.VITE_API_URL}/dev/login`);

    if (!response.ok) {
      console.error('[mockAuth] Login gagal');
      return false;
    }

    const data = await response.json();
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    console.log('[mockAuth] Login berhasil sebagai:', username);
    return true;

  } catch (e) {
    console.error('[mockAuth] Error:', e.message);
    return false;
  }
}

/**
 * Clear mock auth dari localStorage
 */
export function clearMockAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('pg_token');
  localStorage.removeItem('pg_cv');
}

/**
 * Auto-inject mock auth saat development
 * Gunakan untuk auto-login saat page load (opsional)
 */
export async function autoInjectMockAuth() {
  const username = import.meta.env.VITE_MOCK_USERNAME ?? 'user';
  const password = import.meta.env.VITE_MOCK_PASSWORD ?? 'password';
  
  console.log('[mockAuth] Auto-injecting as:', username);
  return injectMockAuth(username, password);
}

/**
 * Check apakah mock auth enabled
 */
export function isMockAuthEnabled() {
  return import.meta.env.VITE_MOCK_AUTH === 'true';
}

export default {
  injectMockAuth,
  autoInjectMockAuth,
  isMockAuthEnabled,
  clearMockAuth,
};
