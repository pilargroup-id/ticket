import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Button,
  Divider,
  Skeleton,
  Alert,
  CircularProgress,
} from "@mui/material";

import ReportService from "../../services/ReportService";
import GanttChart from "../../components/chart/GanttChart";
import GanttDetailModal from "../../components/form/GanttDetailModal";

function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "waiting", label: "Waiting" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "void", label: "Void" },
];

const StatTile = ({ label, value, sublabel }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 1.5,
      borderRadius: 3,
      minWidth: 140,
      flex: 1,
      bgcolor: "background.paper",
    }}
  >
    <Typography sx={{ opacity: 0.75, fontSize: 12, fontWeight: 800 }}>
      {label}
    </Typography>

    <Typography sx={{ fontSize: 22, fontWeight: 950, lineHeight: 1.15 }}>
      {value ?? 0}
    </Typography>

    {!!sublabel && (
      <Typography sx={{ opacity: 0.65, fontSize: 12, fontWeight: 700 }}>
        {sublabel}
      </Typography>
    )}
  </Paper>
);

export default function ProjectMonitoringQueue() {
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(currentYear);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const qDebounced = useDebouncedValue(q, 350);

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const [error, setError] = useState(null);

  const [openDetail, setOpenDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ReportService.projectGanttReport({
        year,
        status,
        q: qDebounced,
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to fetch gantt list");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [year, status, qDebounced]);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await ReportService.projectGanttSummary({ year });
      setSummary(data);
    } catch (e) {
      console.error("Failed to fetch summary:", e);
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchList();
    fetchSummary();
  }, [fetchList, fetchSummary]);

  const openDetailById = useCallback(async (projectId) => {
    if (!projectId) return;
    setOpenDetail(true);
    setDetailLoading(true);
    setDetailData(null);

    try {
      const data = await ReportService.projectGanttDetailReport(projectId);
      setDetailData(data);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const slaLabel = useMemo(() => {
    const sla = Number(summary?.sla ?? 0);
    return `${sla.toFixed(2)}%`;
  }, [summary]);

  const controlsSx = {
    minWidth: { xs: "100%", sm: 150 },
    "& .MuiInputBase-root": { borderRadius: 2.25, height: 40 },
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        {/* HEADER + FILTER */}
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ md: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography fontWeight={950} fontSize={18} sx={{ letterSpacing: -0.2 }}>
                Project Monitoring — Gantt Chart
              </Typography>
              <Typography sx={{ opacity: 0.7, fontWeight: 700, fontSize: 13 }}>
                Year {year} • {rows.length} project(s)
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ width: { xs: "100%", md: "auto" } }}>
              <TextField
                select
                size="small"
                label="Year"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                sx={{ ...controlsSx, minWidth: { xs: "100%", sm: 120 } }}
                disabled={loading || summaryLoading}
              >
                {Array.from({ length: 6 }).map((_, i) => {
                  const y = currentYear - 2 + i;
                  return (
                    <MenuItem key={y} value={y}>
                      {y}
                    </MenuItem>
                  );
                })}
              </TextField>

              <TextField
                select
                size="small"
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                sx={{ ...controlsSx, minWidth: { xs: "100%", sm: 170 } }}
                disabled={loading || summaryLoading}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                size="small"
                label="Search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Project name / code"
                sx={{ ...controlsSx, minWidth: { xs: "100%", sm: 220 } }}
                disabled={loading || summaryLoading}
              />

              <Button
                variant="contained"
                onClick={() => {
                  fetchList();
                  fetchSummary();
                }}
                disabled={loading || summaryLoading}
                startIcon={loading || summaryLoading ? <CircularProgress size={16} /> : null}
                sx={{
                  borderRadius: 2.25,
                  fontWeight: 950,
                  textTransform: "none",
                  minHeight: 40,
                  px: 1.75,
                  whiteSpace: "nowrap",
                }}
              >
                Refresh
              </Button>
            </Stack>
          </Stack>

          {error ? (
            <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }}>
              {error}
            </Alert>
          ) : null}
        </Paper>

        {/* GANTT */}
        <GanttChart tasks={rows} loading={loading} onTaskClick={openDetailById} />

        {/* SUMMARY */}
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography fontWeight={950}>Summary</Typography>
                <Typography sx={{ opacity: 0.7, fontSize: 13, fontWeight: 700 }}>
                  Overview for year {year}
                </Typography>
              </Box>

              {summaryLoading ? (
                <Typography sx={{ opacity: 0.7, fontWeight: 800, fontSize: 13 }}>
                  Loading...
                </Typography>
              ) : (
                <Typography sx={{ opacity: 0.7, fontWeight: 800, fontSize: 13 }}>
                  Total: {summary?.total ?? 0}
                </Typography>
              )}
            </Stack>

            <Divider />

            {summaryLoading && !summary ? (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Paper key={i} variant="outlined" sx={{ p: 1.5, borderRadius: 3, flex: 1 }}>
                    <Skeleton width="50%" />
                    <Skeleton width="30%" height={32} />
                    <Skeleton width="65%" />
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flexWrap="wrap">
                <StatTile label="Waiting" value={summary?.waiting} />
                <StatTile label="Pending" value={summary?.pending} />
                <StatTile label="In Progress" value={summary?.in_progress} />
                <StatTile label="Resolved" value={summary?.resolved} />
                <StatTile label="Void" value={summary?.void} />
                <StatTile
                  label="SLA (Resolved)"
                  value={slaLabel}
                  sublabel={`On time: ${summary?.closedOnTime ?? 0} • Late: ${summary?.closedLate ?? 0}`}
                />
              </Stack>
            )}
          </Stack>
        </Paper>
      </Stack>

      <GanttDetailModal
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        detailData={detailData}
        loading={detailLoading}
      />
    </Box>
  );
}
