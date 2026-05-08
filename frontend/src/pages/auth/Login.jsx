// src/pages/Auth/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/AuthService";
import api from "../../services/api";

import {
  Box, TextField, Button, Typography, IconButton,
  InputAdornment, Link, Paper, Container, Alert,
  CircularProgress, Divider,
} from "@mui/material";

import {
  Visibility, VisibilityOff,
  Login as LoginIcon, ArrowForward,
} from "@mui/icons-material";

import "../../styles/Login.css";
import Logo from "../../images/Logo_Piagam.svg?react";

const LoginPage = () => {
  const [username, setUsername]         = useState("")
  const [password, setPassword]         = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isHovered, setIsHovered]       = useState(false)
  const [error, setError]               = useState("")
  const [loading, setLoading]           = useState(false)
  const [ssoLoading, setSsoLoading]     = useState(false) // ← tambah

  const navigate = useNavigate()

  // Login biasa — tidak diubah
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await authService.login(username, password)
      const userRole = response.user?.role || "user"

      if (userRole === "admin") {
        navigate("/ticket-monitoring", { replace: true })
      } else {
        navigate("/my-ticket", { replace: true })
      }
    } catch (err) {
      setError(err.message || "Login gagal. Periksa username dan password.")
    } finally {
      setLoading(false)
    }
  }

  // ─── SSO handler ────────────────────────────────────────────
  const handleSSOLogin = async () => {
    setSsoLoading(true)
    setError('')
    try {
      const res = await api.get('/auth/sso-url')
      window.location.href = res.url
    } catch (err) {
      setError('Gagal menghubungi SSO. Coba lagi.')
      setSsoLoading(false)
    }
  }
  // ────────────────────────────────────────────────────────────

  return (
    <Box className="login-container">
      <Box className="animated-bg">
        <Box className="circle circle-1" />
        <Box className="circle circle-2" />
        <Box className="circle circle-3" />
      </Box>

      <Box className="login-left">
        <Box className="hero-content">
          <Box className="logo-wrapper">
            <Box className="brand-logo-main">
              <Logo width={50} height={50} />
            </Box>
            <Typography variant="h4" className="brand-name">
              PT. Pilar Niaga Makmur
            </Typography>
          </Box>
          <Box className="hero-text">
            <Typography variant="h2" className="hero-title">
              Welcome Back To Ticketing System
            </Typography>
            <Typography variant="h6" className="hero-subtitle">
              Manage, track, and resolve IT issues efficiently through a
              centralized support system
            </Typography>
          </Box>
        </Box>
        <Box className="footer-info">
          <Typography variant="body2" className="copyright">
            © 2025 PT. Pilar Niaga Makmur
          </Typography>
        </Box>
      </Box>

      <Box className="login-right">
        <Container maxWidth="sm">
          <Box className="mobile-hero">
            <Typography className="mobile-hero-title">
              Welcome Back To Ticketing System
            </Typography>
          </Box>

          <Paper elevation={0} className="form-card">
            <Box className="form-header">
              <Typography variant="h3" className="form-title">Sign In</Typography>
              <Typography variant="body1" className="form-subtitle">
                Welcome back! Please enter your details
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} className="login-form">
              <Box className="input-group">
                <TextField
                  fullWidth label="Username" placeholder="Enter Your Username"
                  variant="outlined" value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="custom-input" required
                  disabled={loading || ssoLoading}
                  autoComplete="username"
                  InputProps={{ className: "input-field" }}
                />
              </Box>

              <Box className="input-group">
                <TextField
                  fullWidth label="Password" placeholder="Enter your password"
                  variant="outlined" type={showPassword ? "text" : "password"}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="custom-input" required
                  disabled={loading || ssoLoading}
                  autoComplete="current-password"
                  InputProps={{
                    className: "input-field",
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton edge="end" className="visibility-btn"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading || ssoLoading}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Button fullWidth size="large" variant="contained"
                className="submit-btn" type="submit"
                disabled={loading || ssoLoading || !username || !password}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                endIcon={
                  loading ? <CircularProgress size={20} color="inherit" /> :
                  isHovered ? <ArrowForward /> : <LoginIcon />
                }
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              {/* ─── Divider + SSO Button ─────────────────────── */}
              <Divider sx={{ my: 1 }}>
                <Typography variant="caption" color="text.secondary">atau</Typography>
              </Divider>

              <Button fullWidth size="large" variant="outlined"
                onClick={handleSSOLogin}
                disabled={loading || ssoLoading}
                endIcon={ssoLoading ? <CircularProgress size={20} /> : null}
              >
                {ssoLoading ? "Mengarahkan..." : "Login via Pilargroup"}
              </Button>
              {/* ─────────────────────────────────────────────── */}

              <Typography variant="body2" className="signup-text" textAlign="center">
                Don't have an account?{" "}
                <Link className="signup-link" component="button" type="button"
                  onClick={(e) => { e.preventDefault(); if (!loading) navigate("/register") }}
                  style={{ cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1 }}
                >
                  Sign up for free
                </Link>
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  )
}

export default LoginPage