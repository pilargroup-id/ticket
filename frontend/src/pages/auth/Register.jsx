import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Container,
  Alert,
  Select,
  FormControl,
    InputLabel,   // ✅ tambah ini
  MenuItem,    
} from "@mui/material";

import {
  Visibility,
  VisibilityOff,
  PersonAdd,
  ArrowForward,
} from "@mui/icons-material";

import DepartmentsService from "../../services/DepartmentsService";
import "../../styles/register.css";
import Logo from "../../images/Logo_Piagam.svg?react";

import authService from "../../services/AuthService";

const Register = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department_id, setDepartment_id] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);

  const fetchDepartments = async () => {
    try {
      const response = await DepartmentsService.show();
      return response;
    } catch (error) {
      console.error("Error fetching departments:", error);
      return [];
    }
  };

  useEffect(() => {
    const loadDepartments = async () => {
      const deptData = await fetchDepartments();
      console.log("Fetched departments:", deptData);
      setDepartments(deptData);
    };

    // Clear any stale auth data when entering register page
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    console.log("Register page - checking auth state:", { token: !!token, user: !!user });

    loadDepartments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitError("");
    setFieldErrors({});

    try {
      setSubmitting(true);

      await authService.register({
        name,
        username,
        email,
        password,
        department_id: department_id ? Number(department_id) : null,
      });

      // ✅ sukses
      alert(
        "Register berhasil! Akun kamu statusnya inactive, tunggu approval admin ya.",
      );
      navigate("/"); // balik ke login page kamu
    } catch (err) {
      // axios interceptor kamu biasanya lempar Error(message)
      // tapi kalau kamu masih punya response 422 di error asli, ini tetap aman:
      setSubmitError(err.message || "Register gagal.");

      // optional: kalau interceptor kamu nyimpen errors di err.errors
      if (err?.errors && typeof err.errors === "object") {
        setFieldErrors(err.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box className="register-container">
      <Box className="animated-bg">
        <Box className="circle circle-1" />
        <Box className="circle circle-2" />
        <Box className="circle circle-3" />
      </Box>

      <Box className="register-left">
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
              Join Our Ticketing System
            </Typography>
            <Typography variant="h6" className="hero-subtitle">
              Create your account and start managing IT support tickets
              efficiently with our comprehensive system
            </Typography>
          </Box>
        </Box>

        <Box className="footer-info">
          <Typography variant="body2" className="copyright">
            © 2025 PT. Pilar Niaga Makmur
          </Typography>
        </Box>
      </Box>

      <Box className="register-right">
        <Container maxWidth="sm">
          <Paper elevation={0} className="form-card">
            <Box className="form-header">
              <Typography variant="h3" className="form-title">
                Sign Up
              </Typography>
              <Typography variant="body1" className="form-subtitle">
                Create your account to get started
              </Typography>
            </Box>

            {!!submitError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {submitError}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit}
              className="register-form"
            >
              <Box className="input-group">
                <TextField
                  fullWidth
                  label="Full Name"
                  placeholder="Enter your full name"
                  variant="outlined"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="custom-input"
                  InputProps={{ className: "input-field" }}
                  error={!!fieldErrors?.name}
                  helperText={fieldErrors?.name?.[0] || ""}
                />
              </Box>

              <Box className="input-group">
                <TextField
                  fullWidth
                  label="Username"
                  placeholder="Enter your username"
                  variant="outlined"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="custom-input"
                  InputProps={{ className: "input-field" }}
                  error={!!fieldErrors?.username}
                  helperText={fieldErrors?.username?.[0] || ""}
                />
              </Box>

              <Box className="input-group">
                <TextField
                  fullWidth
                  label="Email Address"
                  placeholder="Enter your email"
                  variant="outlined"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="custom-input"
                  InputProps={{ className: "input-field" }}
                  error={!!fieldErrors?.email}
                  helperText={fieldErrors?.email?.[0] || ""}
                />
              </Box>

              <Box className="input-group">
                <TextField
                  fullWidth
                  label="Password"
                  placeholder="Enter your password"
                  variant="outlined"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="custom-input"
                  InputProps={{
                    className: "input-field",
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          className="visibility-btn"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  error={!!fieldErrors?.password}
                  helperText={fieldErrors?.password?.[0] || ""}
                />
              </Box>

              <Box className="input-group">
                <FormControl fullWidth error={!!fieldErrors?.department_id}>
                  <InputLabel id="department-label">Department</InputLabel>

                  <Select
                    labelId="department-label"
                    value={department_id}
                    label="Department"
                    onChange={(e) => setDepartment_id(e.target.value)}
                    className="custom-input"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>

                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>

                  {!!fieldErrors?.department_id && (
                    <Typography variant="caption" color="error">
                      {fieldErrors.department_id[0]}
                    </Typography>
                  )}
                </FormControl>
              </Box>

              <Button
                fullWidth
                size="large"
                variant="contained"
                className="submit-btn"
                type="submit"
                disabled={submitting}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                endIcon={
                  isHovered ? (
                    <ArrowForward className="arrow-icon" />
                  ) : (
                    <PersonAdd />
                  )
                }
              >
                {submitting ? "Creating..." : "Create Account"}
              </Button>

              <Typography
                variant="body2"
                className="signup-text"
                textAlign="center"
              >
                Already have an account?{" "}
                <Link
                  className="signup-link"
                  component="button"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/login");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Register;
