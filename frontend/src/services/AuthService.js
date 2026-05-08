import api from "./api";

const authService = {

  async login(username, password) {
    if (!username || !password) {
      throw new Error("Username dan password harus diisi");
    }

    try {
      const res = await api.post("/login", { username, password });

      if (!res?.access_token)
        throw new Error("Token tidak ditemukan di response");
      if (!res?.user) throw new Error("Data user tidak ditemukan di response");

      localStorage.setItem("token", res.access_token);
      localStorage.setItem("user", JSON.stringify(res.user));

      return res;
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || "Login gagal";
      throw new Error(message);
    }
  },

  async profile() {
    if (!this.isAuthenticated()) {
      throw new Error("Token tidak ditemukan. Silakan login.");
    }

    const res = await api.get("/profile"); // res = { message, data }

    if (!res?.data) throw new Error("Data profile tidak ditemukan");

    const user = res.data;
    localStorage.setItem("user", JSON.stringify(user));

    return user;
  },

  logout() {
    this.clearStorage();
    // Redirect to central auth (SSO) logout
    const ssoLoginUrl = import.meta.env.VITE_SSO_LOGIN_URL || "https://pilargroup.id/login";
    window.location.href = ssoLoginUrl;
  },

  isAuthenticated() {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    return !!(token && user);
  },

  getUser() {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error(e);
      this.clearStorage();
      return null;
    }
  },

  getUserRole() {
    return this.getUser()?.role || null;
  },

  getToken() {
    return localStorage.getItem("token");
  },

  clearStorage() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem('pg_token');
    localStorage.removeItem('pg_cv'); 
  },

  updateUserData(userData) {
    if (!userData) throw new Error("User data tidak boleh kosong");
    localStorage.setItem("user", JSON.stringify(userData));
    return userData;
  },

  hasRole(requiredRole) {
    const role = this.getUserRole();
    if (!role) return false;

    if (Array.isArray(requiredRole)) return requiredRole.includes(role);
    return role === requiredRole;
  },

  isAdmin() {
    return this.hasRole("admin");
  },

  isUser() {
    return this.hasRole("user");
  },

  async register(payload) {
    if (
      !payload?.name ||
      !payload?.username ||
      !payload?.email ||
      !payload?.password
    ) {
      throw new Error("Name, username, email, dan password wajib diisi");
    }

    try {
      const body = {
        name: payload.name,
        username: payload.username,
        email: payload.email,
        password: payload.password,
        department_id: payload.department_id || null,
      };

      const res = await api.post("/register", body);
      return res;
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || "Register gagal";
      throw new Error(message);
    }
  },
};

export default authService;
