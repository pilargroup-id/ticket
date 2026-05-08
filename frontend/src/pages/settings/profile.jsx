// src/pages/settings/Profile.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/AuthService";
import PageTransition from "../../components/animation/Transition";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Calendar,
  ArrowLeft,
  Edit,
  Lock,
  LogOut,
} from "lucide-react";
import "../../styles/Profile.css";

const ProfilePage = () => {
  const navigate = useNavigate();
  const user = authService.getUser();

  // Kalau user ga ada, redirect ke login
  if (!user) {
    authService.logout();
    return null;
  }

  // Helper: Get initials
  const getInitials = (name) => {
    if (!name) return "U";
    const words = name.trim().split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Helper: Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Helper: Format role
  const formatRole = (role) => {
    if (!role) return "User";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Handlers
  const handleBack = () => {
    navigate(-1);
  };



  return (
    <PageTransition>
    <div className="profile-page-standalone">
      {/* Top Navigation Bar */}
      <div className="profile-top-nav">
        <button className="profile-back-btn" onClick={handleBack}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1 className="profile-page-title">My Profile</h1>
        <div style={{ width: "80px" }}></div> {/* Spacer for centering */}
      </div>

      {/* Main Content */}
      <div className="profile-content-wrapper">
        <div className="profile-container">
          {/* Profile Card */}
          <div className="profile-card">
            {/* Avatar & Basic Info */}
            <div className="profile-header">
              <div className="profile-avatar">
                {getInitials(user.username || user.name)}
              </div>
              <div className="profile-basic-info">
                <h2 className="profile-name">{user.name || "User"}</h2>
                <p className="profile-username">
                  @{user.username || user.email}
                </p>
                <span className="profile-role-badge">
                  {formatRole(user.role)}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="profile-divider"></div>

            {/* Information Grid */}
            <div className="profile-info-grid">
              {/* Email */}
              <div className="profile-info-item">
                <Mail size={18} className="profile-info-icon" />
                <div className="profile-info-content">
                  <label>Email Address</label>
                  <p>{user.email || "-"}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="profile-info-item">
                <Phone size={18} className="profile-info-icon" />
                <div className="profile-info-content">
                  <label>Phone Number</label>
                  <p>{user.phone || "-"}</p>
                </div>
              </div>

              {/* Job Position */}
              {user.job_position && (
                <div className="profile-info-item">
                  <Briefcase size={18} className="profile-info-icon" />
                  <div className="profile-info-content">
                    <label>Job Position</label>
                    <p>{user.job_position}</p>
                  </div>
                </div>
              )}

              {/* Department */}
              {user.department_name && (
                <div className="profile-info-item">
                  <User size={18} className="profile-info-icon" />
                  <div className="profile-info-content">
                    <label>Department</label>
                    <p>{user.department_name}</p>
                  </div>
                </div>
              )}

              {/* Location */}
              {user.location_name && (
                <div className="profile-info-item">
                  <MapPin size={18} className="profile-info-icon" />
                  <div className="profile-info-content">
                    <label>Location</label>
                    <p>{user.location_name}</p>
                  </div>
                </div>
              )}

              {/* Member Since */}
              <div className="profile-info-item">
                <Calendar size={18} className="profile-info-icon" />
                <div className="profile-info-content">
                  <label>Member Since</label>
                  <p>{formatDate(user.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="profile-divider"></div>

            {/* Action Buttons */}
            <div className="profile-actions">
              <button className="profile-btn profile-btn-disabled" disabled>
                <Edit size={18} />
                Edit Profile
              </button>
              <button className="profile-btn profile-btn-disabled" disabled>
                <Lock size={18} />
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  );
};

export default ProfilePage;