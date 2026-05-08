// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Route Guards (LOCALSTORAGE BASED)
import ProtectedRoute from "./components/route/ProtectedRoute";
import PublicRoute from "./components/route/PublicRoute";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Layout
import DashboardLayout from "./components/layout/DashboardLayout";

// Pages
import MyTicket from "./pages/users/MyTicket";
import TicketMonitoring from "./pages/admin/TicketMonitoring";
import ProjectMonitoring from "./pages/admin/ProjectMonitoring";
import Report from "./pages/admin/Report";
import Master from "./pages/admin/Master";
import ProfilePage from "./pages/settings/profile";
import Assets from "./pages/admin/Assets";
import Locations from "./pages/admin/Locations";
import Departments from "./pages/admin/Departments";
import Users from "./pages/admin/Users";
import Categories from "./pages/admin/Categories";
import Feedback from "./pages/admin/Feedback";
import TeamPerformanceTracker from "./pages/admin/TeamPerformanceTracker";
import ProjectMonitoringQueue from "./pages/admin/ProjectMonitoringQueue";
// System
import Maintenance from "./pages/system/Maintenance";
import ErrorPage from "./pages/system/Error";
import NotFound from "./pages/errors/NotFound";
import ExecutiveTicketInsight from "./pages/admin/ExcecutiveTicketsInsight";
import ProjectPerformanceTracker from "./pages/admin/ProjectPerformanceTracker";
import SSOSuccess from "./pages/auth/SSOSuccess";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ROOT - Redirect ke dashboard */}
        <Route path="/" element={<Navigate to="/my-ticket" replace />} />

        {/* AUTH - Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        <Route 
          path="/sso-success" 
          element={<SSOSuccess />
          } 
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* DASHBOARD LAYOUT - Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/my-ticket" element={<MyTicket />} />
          {/* Profile - Semua role bisa akses */}
          <Route path="/profile" element={<ProfilePage />} />

          {/* ADMIN ONLY Routes */}
          <Route
            path="/ticket-monitoring"
            element={
              <ProtectedRoute requiredRole="admin">
                <TicketMonitoring />
              </ProtectedRoute>
            }
          />
          <Route
            path="/master"
            element={
              <ProtectedRoute requiredRole="admin">
                <Master />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute requiredRole="admin">
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/departments"
            element={
              <ProtectedRoute requiredRole="admin">
                <Departments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/excecutive-tickets-insight"
            element={
              <ProtectedRoute requiredRole="admin">
                <ExecutiveTicketInsight />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports/team-performance"
            element={
              <ProtectedRoute requiredRole="admin">
                <TeamPerformanceTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/project-performance"
            element={
              <ProtectedRoute requiredRole="admin">
                <ProjectPerformanceTracker/>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/project-monitoring"
            element={
              <ProtectedRoute requiredRole="admin">
                <ProjectMonitoringQueue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/locations"
            element={
              <ProtectedRoute requiredRole="admin">
                <Locations />
              </ProtectedRoute>
            }
          />

          <Route
            path="/categories"
            element={
              <ProtectedRoute requiredRole="admin">
                <Categories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedbacks"
            element={
              <ProtectedRoute requiredRole="admin">
                <Feedback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Assets"
            element={
              <ProtectedRoute requiredRole="admin">
                <Assets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project-monitoring"
            element={
              <ProtectedRoute requiredRole="admin">
                <ProjectMonitoring />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report"
            element={
              <ProtectedRoute requiredRole="admin">
                <Report />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* SYSTEM */}
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/error" element={<ErrorPage />} />

        {/* NOT FOUND */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
