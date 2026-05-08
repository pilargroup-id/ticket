import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { Ticket, Plus, ClipboardList, BarChart3, Settings } from "lucide-react";

import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";

import Swal from "sweetalert2";
import TicketService from "../../services/TicketService";

import authService from "../../services/AuthService";
import "../../styles/BottomNav.css";

/* =========================
   Floating Menu
   - NO setState in effect
   - open/close handled by props + CSS classes
   ========================= */
const FloatingMenu = ({ open, anchorEl, onClose, onGoReport, onGoMaster }) => {
  const menuRef = useRef(null);

  // close: click/touch outside + Esc (subscribe effect = allowed)
  useEffect(() => {
    if (!open) return;

    const onDown = (e) => {
      const t = e.target;

      // click in menu
      if (menuRef.current && menuRef.current.contains(t)) return;

      // click on anchor (settings)
      if (anchorEl && anchorEl.contains(t)) return;

      onClose();
    };

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("touchstart", onDown, true);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("touchstart", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorEl]);

  // kalau belum ada anchor, ga render
  if (!anchorEl) return null;

  const rect = anchorEl.getBoundingClientRect();
  const left = rect.left + rect.width / 2;
  const bottom = window.innerHeight - rect.top + 10;

  return createPortal(
    <div
      ref={menuRef}
      className={`bn-float ${open ? "open" : "closing"}`}
      data-open={open ? "1" : "0"}
      style={{ left, bottom, transform: "translateX(-50%)" }}
      role="menu"
      aria-label="Quick menu"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="bn-float-btn"
        style={{ "--i": 0 }}
        onClick={() => {
          onClose();
          onGoReport();
        }}
        type="button"
        aria-label="Report"
      >
        <InsertChartOutlinedIcon sx={{ fontSize: 20 }} />
      </button>

      <button
        className="bn-float-btn"
        style={{ "--i": 1 }}
        onClick={() => {
          onClose();
          onGoMaster();
        }}
        type="button"
        aria-label="Master Data"
      >
        <StorageRoundedIcon sx={{ fontSize: 20 }} />
      </button>
    </div>,
    document.body
  );
};

const BottomNav = ({ openModal }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const user = authService.getUser();
  const role = user?.role;

  const [menuOpen, setMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const anchorRef = useRef(null);

  // ✅ anti spam klik FAB
  const creatingRef = useRef(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const go = useCallback(
    (path) => {
      closeMenu();
      navigate(path);
    },
    [navigate, closeMenu]
  );

  const navItems = useMemo(
    () => [
      { key: "myTicket", path: "/my-ticket", icon: Ticket, roles: ["admin"] },
      { key: "ticketMonitoring", path: "/ticket-monitoring", icon: ClipboardList, roles: ["admin"] },
      { key: "fab", icon: Plus, isFab: true, roles: ["user", "admin"] },
      { key: "projectMonitoring", path: "/project-monitoring", icon: BarChart3, roles: ["admin"] },
      { key: "menu", icon: Settings, roles: ["admin"], isMenu: true },
    ],
    []
  );

  const filteredNavItems = useMemo(
    () => navItems.filter((item) => item.roles.includes(role)),
    [navItems, role]
  );

  const handleMenuToggle = useCallback((el) => {
    const same = anchorRef.current === el;
    anchorRef.current = el;
    setAnchorEl(el);
    setMenuOpen((prev) => (same ? !prev : true));
  }, []);

  // ✅ Guard + Swal + redirect
  const handleCreateTicketClick = useCallback(async () => {
    closeMenu();

    // admin boleh langsung
    if (role === "admin") {
      openModal?.();
      return;
    }

    if (creatingRef.current) return;
    creatingRef.current = true;

    try {
      // ✅ cek resolved murni (yang butuh feedback)
      const resolvedTickets = await TicketService.myTicketByFilter({ status: "resolved" });
      const needFeedback = (resolvedTickets || []).some(
        (t) => String(t?.status).toLowerCase() === "resolved"
      );

      if (needFeedback) {
        await Swal.fire({
          icon: "info",
          title: "Feedback Diperlukan",
          html: `
            <div style="line-height:1.6">
              <p style="margin-bottom:8px">
                Kamu masih punya <b>ticket resolved yang belum diberi feedback</b>.
              </p>
              <p style="color:#6b7280;font-size:14px">
                Kamu akan diarahkan ke <b>My Ticket</b>.
              </p>
            </div>
          `,
          confirmButtonText: "Oke",
          confirmButtonColor: "#2563eb",
          focusConfirm: false,
        });

        navigate("/my-ticket");
        return;
      }

      // ✅ aman -> buka modal create
      openModal?.();
    } catch (e) {
      console.error("Guard create ticket error:", e);

      // fallback: kalau guard error, tetap buka modal (biar user gak stuck)
      openModal?.();
    } finally {
      creatingRef.current = false;
    }
  }, [closeMenu, navigate, openModal, role]);

  return (
    <>
      <FloatingMenu
        open={menuOpen}
        anchorEl={anchorEl}
        onClose={closeMenu}
        onGoReport={() => go("/report")}
        onGoMaster={() => go("/master")}
      />

      <nav className={`bottom-nav ${role === "user" ? "center-only" : ""}`}>
        {filteredNavItems.map((item) => {
          const Icon = item.icon;

          const isActive = item.isMenu
            ? ["/report", "/master"].includes(location.pathname)
            : location.pathname === item.path;

          if (item.isFab) {
            return (
              <button
                key={item.key}
                className="bottom-nav-fab"
                onClick={handleCreateTicketClick}
                aria-label="Create new ticket"
                type="button"
              >
                <Icon size={28} strokeWidth={2.5} />
              </button>
            );
          }

          if (item.isMenu) {
            return (
              <button
                key={item.key}
                className={`bottom-nav-item ${isActive ? "active" : ""}`}
                onClick={(e) => handleMenuToggle(e.currentTarget)}
                aria-label="Open menu"
                type="button"
              >
                <Icon size={24} />
              </button>
            );
          }

          return (
            <button
              key={item.key}
              className={`bottom-nav-item ${isActive ? "active" : ""}`}
              onClick={() => go(item.path)}
              aria-label={item.path}
              type="button"
            >
              <Icon size={24} />
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default BottomNav;
