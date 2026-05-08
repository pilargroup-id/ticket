// ==========================================
// FILE: src/components/navigation/Sidebar.jsx
// ==========================================
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  TrendingUp,
  Wallet,
  PieChart,
  ClipboardList,
  ChevronDown,
} from "lucide-react";
import authService from "../../services/AuthService";
import "../../styles/Sidebar.css";

const Sidebar = ({ collapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const user = authService.getUser();
  const role = user?.role;

  const isPathActive = (path) => location.pathname === path;

  const isPathInTree = (paths = []) =>
    paths.some(
      (p) => location.pathname === p || location.pathname.startsWith(p + "/")
    );

  // ====== MENU CONFIG (WITH CHILDREN) ======
  const menuItems = useMemo(
    () => [
      {
        type: "link",
        path: "/my-ticket",
        icon: Home,
        label: "My Ticket",
        roles: ["admin", "user"],
      },
      {
        type: "link",
        path: "/ticket-monitoring",
        icon: TrendingUp,
        label: "Ticket Overview",
        roles: ["admin"],
      },
      {
        type: "link",
        path: "/project-monitoring",
        icon: Wallet,
        label: "Project Overview",
        roles: ["admin"],
      },

      // ====== REPORT DROPDOWN ======
      {
        type: "group",
        path: "/report",
        icon: PieChart,
        label: "Report",
        roles: ["admin"],
        children: [
          { path: "/reports/team-performance", label: "Team Performance" },
          { path: "/excecutive-tickets-insight", label: "Executive Insight" },
          { path: "/reports/project-performance", label: "Project Performance" },
          { path: "/reports/project-monitoring", label: "Project Queue" },
        ],
      },

      // ====== MASTER DROPDOWN ======
      {
        type: "group",
        path: "/master",
        icon: ClipboardList,
        label: "Master Data",
        roles: ["admin"],
        children: [
          { path: "/assets", label: "Asset" },
          { path: "/users", label: "Users" },
          { path: "/departments", label: "Department" },
          { path: "/locations", label: "Location" },
          { path: "/categories", label: "Category" },
          { path: "/feedbacks", label: "Feedback" },
        ],
      },
    ],
    []
  );

  // Filter menu berdasarkan role user
  const filteredMenuItems = useMemo(() => {
    if (!role) return [];
    return menuItems.filter((item) => item.roles?.includes(role));
  }, [menuItems, role]);

  // ====== DROPDOWN STATE ======
  const [open, setOpen] = useState({ report: false, master: false });

  // Auto-open/close berdasarkan current path
  useEffect(() => {
    if (!filteredMenuItems.length) return;

    const reportItem = filteredMenuItems.find((x) => x.path === "/report");
    const masterItem = filteredMenuItems.find((x) => x.path === "/master");

    const reportPaths = reportItem?.children?.map((c) => c.path) ?? [];
    const masterPaths = masterItem?.children?.map((c) => c.path) ?? [];

    const shouldOpenReport = isPathInTree(["/report", ...reportPaths]);
    const shouldOpenMaster = isPathInTree(["/master", ...masterPaths]);

    setOpen({
      report: shouldOpenReport,
      master: shouldOpenMaster,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, filteredMenuItems.length]);

  // kalau sidebar collapsed -> tutup dropdown biar aman
  useEffect(() => {
    if (collapsed) {
      setOpen({ report: false, master: false });
    }
  }, [collapsed]);

  const toggleGroup = (key, fallbackPath) => {
    // kalau collapsed: klik parent langsung navigate (simple UX)
    if (collapsed) {
      navigate(fallbackPath);
      return;
    }
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderLinkItem = (item) => {
    const Icon = item.icon;
    const active = isPathActive(item.path);

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`sidebar-item ${active ? "active" : ""}`}
        data-tooltip={item.label}
        aria-label={item.label}
      >
        <div className="sidebar-item-icon">
          <Icon size={22} strokeWidth={2} />
        </div>

        {!collapsed && <span className="sidebar-item-label">{item.label}</span>}
      </Link>
    );
  };

  const renderGroupItem = (item) => {
    const Icon = item.icon;
    const key = item.path === "/report" ? "report" : "master";

    const childPaths = item.children?.map((c) => c.path) ?? [];
    const groupActive = isPathInTree([item.path, ...childPaths]);
    const isOpen = open[key];

    return (
      <div
        key={item.path}
        className={`sidebar-group ${isOpen ? "" : "closed"} ${
          groupActive ? "active" : ""
        }`}
      >
        <button
          type="button"
          className={`sidebar-item sidebar-item-btn ${
            groupActive ? "active" : ""
          }`}
          onClick={() => toggleGroup(key, item.path)}
          data-tooltip={item.label}
          aria-label={item.label}
          aria-expanded={isOpen}
        >
          <div className="sidebar-item-icon">
            <Icon size={22} strokeWidth={2} />
          </div>

          {!collapsed && (
            <>
              <span className="sidebar-item-label">{item.label}</span>
              <span className={`sidebar-item-chevron ${isOpen ? "open" : ""}`}>
                <ChevronDown size={18} strokeWidth={2} />
              </span>
            </>
          )}
        </button>

        {/* ✅ SELALU render, biar ga loncat — animasi via class "closed" */}
        {!collapsed && (
          <div className="sidebar-submenu">
            {item.children.map((c) => {
              const active = isPathActive(c.path);
              return (
                <Link
                  key={c.path}
                  to={c.path}
                  className={`sidebar-subitem ${active ? "active" : ""}`}
                  aria-label={c.label}
                >
                  <span className="sidebar-subitem-dot" />
                  <span className="sidebar-subitem-label">{c.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (!user) return null;

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <nav className="sidebar-nav">
        {filteredMenuItems.map((item) => {
          if (item.type === "group") return renderGroupItem(item);
          return renderLinkItem(item);
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
