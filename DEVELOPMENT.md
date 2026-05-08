# Development Setup Guide

Panduan setup development lokal untuk Ticketing System dengan support mock authentication.

## 📋 Overview

Project ini menggunakan **SSO (Single Sign-On)** via Pilargroup untuk authentication di production. Untuk development lokal, tersedia dua opsi:

1. **Mock Authentication** (Recommended) - Tidak perlu Pilargroup running
2. **Real SSO** - Menggunakan Pilargroup yang running lokal

## 🚀 Quick Start - Mock Authentication

### Prerequisites
- Node.js & npm (frontend)
- PHP 8.2+ & Composer (backend)
- MySQL 8.0+

### Setup Steps

#### 1. Backend Setup
```bash
cd backend

# Install dependencies
composer install

# Setup database
cp .env.example .env
# Edit .env sesuaikan DB config

php artisan key:generate
php artisan migrate
php artisan seed:all  # optional

# Run server (port 8001)
php artisan serve --port=8001
```

#### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create .env.local dari template
cp .env.local.example .env.local

# Edit .env.local sesuai setup lokal:
# VITE_API_URL=http://localhost:8001/api
# VITE_MOCK_AUTH=true
# VITE_MOCK_USERNAME=azi
# VITE_MOCK_PASSWORD=password123

# Run dev server (port 5173 - Vite default)
npm run dev
```

#### 3. Access Application
Buka browser ke: **http://localhost:5173**

### Login dengan Mock Credentials

Di `.env.local` kamu sudah set:
```
VITE_MOCK_USERNAME=azi
VITE_MOCK_PASSWORD=password123
```

**Login Page** akan menampilkan info mode development:
- Ketik username: `azi`
- Ketik password: `password123`
- Click Sign In

---

## 🔧 Environment Configuration

### `.env.development` (Committed)
Default values untuk semua developer:
```env
VITE_API_URL=http://localhost:8001/api
VITE_MOCK_AUTH=true
VITE_MOCK_USERNAME=user
VITE_MOCK_PASSWORD=password
```

### `.env.local` (NOT Committed)
Per-developer overrides:
```env
VITE_API_URL=http://localhost:8001/api
VITE_MOCK_AUTH=true
VITE_MOCK_USERNAME=azi
VITE_MOCK_PASSWORD=password123
VITE_PILARGROUP_LOCAL_URL=http://localhost:8000
```

**PENTING:** `.env.local` tidak boleh di-commit ke git! Sudah di-exclude di `.gitignore`.

---

## 📁 Port Configuration

Default ports untuk development:

| Service | Port | URL |
|---------|------|-----|
| **Pilargroup SSO** | 8000 | http://localhost:8000 |
| **Backend API** | 8001 | http://localhost:8001 |
| **Frontend (Vite)** | 5173 | http://localhost:5173 |

Jika port sudah terpakai, bisa disesuaikan di `.env.local`:
```env
VITE_API_URL=http://localhost:8002/api  # sesuaikan port
```

---

## 🔐 How Mock Authentication Works

1. **User input username & password** di login form
2. **AuthService.login()** check `VITE_MOCK_AUTH`
3. Jika `true` → gunakan `mockAuth.injectMockAuth()`
4. Mock auth process:
   - Validate password match `VITE_MOCK_PASSWORD`
   - Generate fake token
   - Save ke localStorage
5. **Redirect** ke dashboard

### Customize Mock Credentials

Edit `.env.local`:
```env
VITE_MOCK_USERNAME=my_username
VITE_MOCK_PASSWORD=my_password
```

Credentials bisa apa saja, tidak ada validasi khusus di backend.

---

## 🔄 Real SSO Authentication (Advanced)

Jika mau test dengan real SSO flow:

### Setup Pilargroup Lokal

```bash
# Terminal terpisah
# Dari project pilargroup
cd pilargroup
php artisan serve --port=8000
```

### Update .env.local

```env
VITE_MOCK_AUTH=false
VITE_API_URL=http://localhost:8001/api
VITE_PILARGROUP_LOCAL_URL=http://localhost:8000
```

### Update Backend .env

```env
APP_URL=http://localhost:8001
SSO_PILARGROUP_URL=http://localhost:8000
SSO_REDIRECT_URI=http://localhost:5173/auth/sso-success
```

---

## 📝 Troubleshooting

### "Username atau password salah"
- Check `.env.local` credentials
- Validate `VITE_MOCK_PASSWORD` match password yang diketik
- Check `VITE_MOCK_AUTH=true`

### "Cannot GET /api/login"
- Backend API belum running
- Check port di `VITE_API_URL` correct
- Run: `php artisan serve --port=8001`

### "API 401 Unauthorized"
- Token expired
- Login ulang
- Check localStorage di browser DevTools

### CORS error
- Check backend allowing CORS dari http://localhost:5173
- Verify `VITE_API_URL` correct
- Check request URL di Network tab

### .env.local tidak ter-load
- Pastikan file ada di `frontend/.env.local`
- Restart dev server: `npm run dev`
- Check env values di `import.meta.env`

---

## 🚀 Quick Commands

```bash
# Terminal 1: Backend
cd backend
php artisan serve --port=8001

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3 (optional): Pilargroup SSO
cd pilargroup
php artisan serve --port=8000
```

Buka: http://localhost:5173

---

## 🛠️ File Structure

```
frontend/
├── .env.development        # Default config (committed)
├── .env.local.example      # Template untuk .env.local
├── .env.local              # Per-developer config (NOT committed)
└── src/
    ├── utils/
    │   └── mockAuth.js     # Mock authentication logic
    ├── services/
    │   ├── AuthService.js  # Updated dengan mock support
    │   └── api.js
    └── pages/
        └── auth/
            └── Login.jsx   # Updated dengan mock auth UI
```

---

## 💡 Tips

1. **Copy template ke .env.local:**
   ```bash
   cp frontend/.env.local.example frontend/.env.local
   ```

2. **Debug environment variables:**
   ```javascript
   console.log(import.meta.env.VITE_MOCK_AUTH)
   console.log(import.meta.env.VITE_API_URL)
   ```

3. **Test multiple users:**
   - Buka 3 private browser windows
   - Login dengan username berbeda di masing-masing (jika simulate multi-user)

4. **Switch auth modes:**
   - Edit `.env.local`
   - Set `VITE_MOCK_AUTH=true/false`
   - Restart dev server

---

## 📚 References

- [Vite Env Documentation](https://vitejs.dev/guide/env-and-mode.html)
- [React Documentation](https://react.dev)
- [Laravel Documentation](https://laravel.com)
- [Axios Documentation](https://axios-http.com)

---

**Last Updated:** May 8, 2026  
**Version:** 2.0.0
