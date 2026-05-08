import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, LogOut, Settings, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/AuthService";
import "../../styles/HeaderCard.css";

const HeaderCard = ({ title = null, showBack = false }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const user = authService.getUser();

  // ✅ Hook HARUS di atas return condition
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 11) return "Good morning";
    if (h < 15) return "Good afternoon";
    if (h < 19) return "Good evening";
    return "Good night";
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // ❗ BARU BOLEH conditional return
  if (!user) return null;

  const name = user.username || user.name || "User";

  return (
    <>
      {open && (
        <div className="header-card-overlay" onClick={() => setOpen(false)} />
      )}

      <div className="header-card-wrapper" ref={dropdownRef}>
        <div className="header-card">
          {/* LEFT */}
          <div className="header-left">
            {showBack && (
              <button
                className="header-back-btn"
                onClick={() => navigate(-1)}
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            {title && <div className="header-page-title">{title}</div>}
          </div>

          {/* RIGHT */}
          <div
            className="header-card-profile"
            onClick={() => setOpen((v) => !v)}
          >
            <div className="header-card-text">
              <span className="header-card-greeting">{greeting}</span>
              <span className="header-card-name">{name}</span>
            </div>

            <ChevronDown
              size={18}
              className={`header-card-chevron ${open ? "open" : ""}`}
            />
          </div>
        </div>

        {open && (
          <div className="header-dropdown">
            <button className="header-dropdown-item" onClick={() => navigate("/profile")}>
              <Settings size={16} />
              Settings
            </button>

            <button
              className="header-dropdown-item danger"
              onClick={() => authService.logout()}
            >
              <LogOut size={16} />
              Back to Pilargroup
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default HeaderCard;
