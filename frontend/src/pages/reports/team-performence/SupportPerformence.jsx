import React, { useState, useEffect } from "react";
import CreateButton from "../../../components/button/CreateButton.jsx";
import { ChevronDown } from "../../../components/template/TemplateIcons.jsx";
import DataTableDetailTP from "./DataTableDetailTP.jsx";
import SupportReports from "../../../services/reports/SupportReports.js";
import ButtonFilterPreset from "../../../components/button/ButtonFilterPreset.jsx";

const styles = {
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxWidth: "100%",
    margin: "0",
  },
  card: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#f1f5f9",
    borderTopLeftRadius: "14px",
    borderTopRightRadius: "14px",
    borderBottomLeftRadius: "14px",
    borderBottomRightRadius: "14px",
    padding: "16px 20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
    transition: "all 0.2s ease",
    cursor: "default",
  },
  cardHover: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
    transform: "translateY(-1px)",
  },
  cardBody: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  name: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: "-0.01em",
  },
  pills: {
    display: "flex",
    flexWrap: "wrap",
    gap: "7px",
    alignItems: "center",
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    backgroundColor: "#f1f5f9",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#dde3ec",
    borderRadius: "999px",
    padding: "3px 10px",
    fontSize: "11px",
    color: "#334155",
    fontWeight: "500",
    whiteSpace: "nowrap",
  },
  pillLate: {
    backgroundColor: "#fff7ed",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#fdba74",
    color: "#9a3412",
  },
  pillLabel: {
    fontWeight: "700",
    color: "#0f172a",
  },
  pillLateLabel: {
    fontWeight: "700",
    color: "#9a3412",
  },
};

const Pill = ({ label, value, isLate }) => (
  <span style={{ ...styles.pill, ...(isLate ? styles.pillLate : {}) }}>
    <span style={isLate ? styles.pillLateLabel : styles.pillLabel}>
      {label}:
    </span>
    {value}
  </span>
);

const AgentCard = ({ agent, isExpanded, onToggle }) => {
  const [hovered, setHovered] = useState(false);

  // Helper to format minutes to human readable time
  const formatTime = (minutes) => {
    if (!minutes) return "0m";
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    if (h > 0) return `${h}j ${m}m`;
    return `${m}m`;
  };

  return (
    <div
      style={{ 
        ...styles.card, 
        ...(hovered ? styles.cardHover : {}),
        ...(isExpanded ? { borderColor: '#e2e8f0', backgroundColor: '#f8fafc', borderBottomLeftRadius: '0', borderBottomRightRadius: '0', marginBottom: '0' } : {}) 
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.cardBody}>
        <h3 style={styles.name}>{agent.support_name}</h3>
        <div style={styles.pills}>
          <Pill label="Total" value={agent.total_tickets} />
          <Pill label="Resolved" value={agent.resolved_tickets} />
          <Pill label="Open" value={agent.open_tickets} />
          <Pill label="Late" value={agent.late_tickets} isLate={agent.late_tickets > 0} />
          <Pill label="Total Time" value={formatTime(agent.total_minutes)} />
          <Pill label="Avg" value={`${Math.round(agent.total_minutes / (agent.total_tickets || 1))}m`} />
        </div>
      </div>
      <CreateButton
        variant="detail"
        onClick={onToggle}
        title={isExpanded ? "Hide Detail" : "View Detail"}
      >
        <span>Detail</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`users-table__detail-icon${isExpanded ? ' users-table__detail-icon--open' : ''}`}
        />
      </CreateButton>
    </div>
  );
};

const SupportPerformence = ({ filters: initialFilters = {} }) => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [localFilters, setLocalFilters] = useState(initialFilters);

  // Sync with initialFilters if they change from parent
  useEffect(() => {
    if (initialFilters.startDate || initialFilters.endDate) {
      setLocalFilters(initialFilters);
    }
  }, [initialFilters]);

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      try {
        const response = await SupportReports.getSupportSummary({
          startDate: localFilters.startDate,
          endDate: localFilters.endDate,
        });
        setAgents(response.data);
      } catch (error) {
        console.error("Failed to fetch support summary:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, [localFilters.startDate, localFilters.endDate]);

  const handleToggle = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handlePresetChange = (newRange) => {
    setLocalFilters(newRange);
  };

  return (
    <article className="dashboard-panel chart-card chart-card--wide" style={{ marginTop: '0px' }}>
      <div className="chart-card__header chart-card__header--split">
        <div className="chart-card__header-copy">
          <p className="dashboard-panel__eyebrow">Performance Detail</p>
          <h2 className="dashboard-panel__title">Support Team Performance</h2>
        </div>

        <div className="chart-card__header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <ButtonFilterPreset onChange={handlePresetChange} />
        </div>
      </div>

      <div className="chart-card__body">
        {loading ? (
          <p className="users-table-card__description">Loading support summary...</p>
        ) : agents.length === 0 ? (
          <p className="users-table-card__description">Belum ada data performa untuk periode ini.</p>
        ) : (
          <div style={styles.list}>
            {agents.map((agent) => (
              <div key={agent.support_id} style={{ display: 'flex', flexDirection: 'column' }}>
                <AgentCard 
                  agent={agent} 
                  isExpanded={expandedId === agent.support_id}
                  onToggle={() => handleToggle(agent.support_id)}
                />
                {expandedId === agent.support_id && (
                  <div className="users-table__accordion" style={{
                    marginTop: '-1px',
                    borderTopLeftRadius: '0',
                    borderTopRightRadius: '0',
                    marginBottom: '10px',
                    animation: 'fadeIn 0.2s ease-out',
                    zIndex: 1
                  }}>
                    <div className="users-table__accordion-header" style={{ marginBottom: '15px' }}>
                      <div className="users-table__accordion-copy">
                        <p className="users-table__accordion-eyebrow">Performance Detail</p>
                        <h3 className="users-table__accordion-title" style={{ fontWeight: '800' }}>
                          Tickets Handled by {agent.support_name}
                        </h3>
                      </div>
                    </div>
                    <DataTableDetailTP 
                      supportId={agent.support_id}
                      agentName={agent.support_name}
                      filters={localFilters}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
};

export default SupportPerformence;