import React, { useEffect, useMemo, useRef } from "react";
import { Box, Paper, Stack, Typography, CircularProgress } from "@mui/material";

import Gantt from "frappe-gantt";
import "../../styles/frappe-gantt.css";

export default function GanttChart({ tasks = [], loading = false, onTaskClick }) {
  const wrapRef = useRef(null);

  const processedTasks = useMemo(() => {
    return (tasks || [])
      .filter((r) => r?.start && r?.end)
      .map((r) => ({
        id: String(r.id),
        name: r.label || r.name || "-",
        start: r.start,
        end: r.end,
        progress: Number(r.progress ?? 0),
        custom_class: `status-${String(r.status || "").toLowerCase()}`,
      }));
  }, [tasks]);

  useEffect(() => {
    if (!wrapRef.current) return;

    // clear
    wrapRef.current.innerHTML = "";

    if (!processedTasks.length) return;

    const el = wrapRef.current;

    const gantt = new Gantt(el, processedTasks, {
      view_mode: "Day",
      date_format: "YYYY-MM-DD",
      on_click: (task) => onTaskClick && onTaskClick(task.id),
      custom_popup_html: (task) => `
        <div style="padding:10px;min-width:260px">
          <div style="font-weight:700;margin-bottom:6px">${task.name}</div>
          <div>📅 ${task.start} → ${task.end}</div>
          <div>✅ Progress: ${task.progress}%</div>
          <div style="opacity:.75;margin-top:6px">Klik bar untuk detail</div>
        </div>
      `,
    });

    return () => {
      // cleanup
      if (el) el.innerHTML = "";
      void gantt;
    };
  }, [processedTasks, onTaskClick]);

  return (
    <Paper sx={{ p: 2, borderRadius: 3 }}>
      {loading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
          <CircularProgress />
          <Typography sx={{ mt: 1, opacity: 0.7 }}>Loading gantt...</Typography>
        </Stack>
      ) : processedTasks.length ? (
        <Box sx={{ overflowX: "auto" }}>
          {/* minWidth biar scroll kerasa kalau chart lebar */}
          <Box ref={wrapRef} sx={{ minWidth: 900 }} />
        </Box>
      ) : (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
          <Typography sx={{ opacity: 0.7 }}>No data</Typography>
        </Stack>
      )}
    </Paper>
  );
}
