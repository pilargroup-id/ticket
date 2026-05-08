// ==========================================
// FILE: src/components/navigation/Header.jsx
// ==========================================
import React, { useState, useRef, useEffect } from "react";
import { Settings, LogOut, ChevronDown, Menu, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/AuthService";
import "../../styles/Header.css";

const Header = ({ sidebarCollapsed, toggleSidebar, title = null }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // 🔥 AMBIL USER LANGSUNG DARI AUTHSERVICE
  const user = authService.getUser();

  // Close dropdown kalau klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  const handleSettings = () => {
    setDropdownOpen(false);
    navigate("/profile");
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    authService.logout();
  };

  if (!user) {
    console.warn("⚠️ Header: User not found");
    return null;
  }

  return (
    <header
      className={`desktop-header ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
    >
      <div className="header-content">
        {/* LEFT SECTION */}
        <div className="header-left">
          <button
            className="header-toggle-btn"
            onClick={toggleSidebar}
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            type="button"
          >
            <Menu size={22} />
          </button>

          <span className="header-logo-text">
            {title || "Ticketing System"}
          </span>
        </div>

        {/* RIGHT SECTION */}
        <div className="header-profile" ref={dropdownRef}>
          <button
            className="header-profile-btn"
            onClick={toggleDropdown}
            type="button"
          >
            <div className="header-user-info">
              <span className="header-user-name">
                Welcome Back, {user.username || user.name || "User"}
              </span>
            </div>

            <ChevronDown
              size={20}
              className={`header-chevron ${dropdownOpen ? "open" : ""}`}
            />
          </button>

          {dropdownOpen && (
            <div className="header-dropdown">
              <button className="header-dropdown-item" onClick={handleSettings}>
                <Settings size={18} />
                <span>Settings</span>
              </button>
              <div className="header-dropdown-divider" />
              <button
                className="header-dropdown-item logout danger"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                <span>Back to Pilargroup</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
