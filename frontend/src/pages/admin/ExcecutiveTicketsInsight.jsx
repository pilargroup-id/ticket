// src/pages/report/ExecutiveTicketInsight.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Button,
  TextField,
  MenuItem,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import dayjs from "dayjs";

import ReportService from "../../services/ReportService";

import TicketsPerMonthLineChart from "../../components/chart/TicketsPerMonthLineChart";
import TimeSpentByDepartmentBarChart from "../../components/chart/TimeSpentByDepartmentBarChart";
import CategoryPieChart from "../../components/chart/CategoryPieChart";
import SlaCards from "../../components/card/SlaCards";

/* =========================
 * utils
 * ========================= */
const getErrMsg = (e, fallback) =>
  e?.response?.data?.message || e?.response?.message || e?.message || fallback;

const fmt = (d) => dayjs(d).format("YYYY-MM-DD");

const buildRangeFromPreset = (preset) => {
  const today = dayjs();

  if (preset === "today") return { start: fmt(today.startOf("day")), end: fmt(today.endOf("day")) };
  if (preset === "yesterday") {
    const d = today.subtract(1, "day");
    return { start: fmt(d.startOf("day")), end: fmt(d.endOf("day")) };
  }
  if (preset === "this_month") return { start: fmt(today.startOf("month")), end: fmt(today.endOf("month")) };
  if (preset === "last_month") {
    const d = today.subtract(1, "month");
    return { start: fmt(d.startOf("month")), end: fmt(d.endOf("month")) };
  }
  if (preset === "this_year") return { start: fmt(today.startOf("year")), end: fmt(today.endOf("year")) };
  if (preset === "last_year") {
    const d = today.subtract(1, "year");
    return { start: fmt(d.startOf("year")), end: fmt(d.endOf("year")) };
  }

  // custom handled outside
  return { start: fmt(today.startOf("year")), end: fmt(today.endOf("year")) };
};

/* =========================
 * loading overlay
 * ========================= */
const LoadingOverlay = ({ show, label = "Loading..." }) => {
  if (!show) return null;
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        borderRadius: 2.5,
        bgcolor: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(4px)",
        display: "grid",
        placeItems: "center",
        zIndex: 2,
      }}
    >
      <Stack alignItems="center" spacing={1}>
        <CircularProgress size={22} />
        <Typography sx={{ fontSize: 12, fontWeight: 800, color: "text.secondary" }}>
          {label}
        </Typography>
      </Stack>
    </Box>
  );
};

/* =========================
 * reusable panel
 * ========================= */
const Panel = ({ title, subtitle, right, children, error }) => (
  <Paper
    elevation={0}
    sx={{
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 3,
      overflow: "hidden",
      bgcolor: "background.paper",
      boxShadow: "0 10px 28px rgba(17,24,39,0.06)",
    }}
  >
    <Box
      sx={{
        p: { xs: 1.5, sm: 2 },
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        flexWrap: "wrap",
      }}
    >
      <Box sx={{ minWidth: 0, flex: "1 1 220px" }}>
        <Typography variant="h6" sx={{ fontWeight: 950, letterSpacing: -0.35, lineHeight: 1.15 }} noWrap>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      {right && (
        <Box sx={{ flex: { xs: "1 1 220px", sm: "0 0 auto" }, width: { xs: "100%", sm: "auto" } }}>
          {right}
        </Box>
      )}
    </Box>

    <Divider />

    <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: "rgba(15,23,42,0.02)" }}>
      {error && (
        <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
          {error}
        </Alert>
      )}
      {children}
    </Box>
  </Paper>
);

/* =========================
 * header pill
 * ========================= */
const Pill = ({ children }) => (
  <Box
    sx={{
      px: 1.25,
      py: 0.65,
      borderRadius: 999,
      border: "1px solid",
      borderColor: "divider",
      bgcolor: "rgba(17,24,39,0.04)",
      fontSize: 12,
      fontWeight: 850,
      color: "text.primary",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </Box>
);

/* =========================
 * ✅ YearSelect (no Apply)
 * ========================= */
const YearSelect = ({ year, onChange, loading }) => {
  const nowY = new Date().getFullYear();
  const years = useMemo(() => {
    // range: now-5 .. now+1
    const start = nowY - 5;
    const end = nowY + 1;
    return Array.from({ length: end - start + 1 }, (_, i) => start + i).reverse();
  }, [nowY]);

  return (
    <TextField
      select
      size="small"
      label="Year"
      value={year}
      onChange={(e) => onChange?.(Number(e.target.value))}
      disabled={loading}
      sx={{ minWidth: 130 }}
    >
      {years.map((y) => (
        <MenuItem key={y} value={y}>
          {y}
        </MenuItem>
      ))}
    </TextField>
  );
};

/* =========================
 * ✅ RangeFilter (no Apply) + optional Refresh button outside
 * ========================= */
const RangeFilter = ({
  preset,
  onPresetChange,
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  loading,
}) => {
  const presets = useMemo(
    () => [
      { value: "today", label: "Today" },
      { value: "yesterday", label: "Yesterday" },
      { value: "this_month", label: "This Month" },
      { value: "last_month", label: "Last Month" },
      { value: "this_year", label: "This Year" },
      { value: "last_year", label: "Last Year" },
      { value: "custom", label: "Custom" },
    ],
    []
  );

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1}
      useFlexGap
      flexWrap="wrap"
      alignItems="center"
      sx={{ width: "100%" }}
    >
      <TextField
        select
        size="small"
        label="Preset"
        value={preset}
        onChange={(e) => onPresetChange?.(e.target.value)}
        disabled={loading}
        sx={{ minWidth: 170 }}
      >
        {presets.map((p) => (
          <MenuItem key={p.value} value={p.value}>
            {p.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        size="small"
        label="Start"
        type="date"
        value={startDate || ""}
        onChange={(e) => onStartChange?.(e.target.value)}
        InputLabelProps={{ shrink: true }}
        disabled={loading || preset !== "custom"}
        sx={{ minWidth: 170 }}
      />

      <TextField
        size="small"
        label="End"
        type="date"
        value={endDate || ""}
        onChange={(e) => onEndChange?.(e.target.value)}
        InputLabelProps={{ shrink: true }}
        disabled={loading || preset !== "custom"}
        sx={{ minWidth: 170 }}
      />
    </Stack>
  );
};

export default function ExecutiveTicketInsight() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  /* =========================
   * SECTION A — Tickets / Month (AUTO FETCH ON YEAR CHANGE)
   * ========================= */
  const [tixYear, setTixYear] = useState(() => new Date().getFullYear());
  const [ticketsPerMonth, setTicketsPerMonth] = useState([]);
  const [tixLoading, setTixLoading] = useState(false);
  const [tixError, setTixError] = useState(null);
  const tixReqId = useRef(0);

  const fetchTicketsPerMonth = useCallback(async (yearParam) => {
    const year = Number(yearParam || tixYear);
    const req = ++tixReqId.current;

    setTixError(null);
    setTixLoading(true);
    try {
      const res = await ReportService.ticketsPerMonth({ year });
      const rows = Array.isArray(res) ? res : res?.data ?? [];
      if (req === tixReqId.current) setTicketsPerMonth(Array.isArray(rows) ? rows : []);
    } catch (e) {
      if (req === tixReqId.current) {
        setTixError(getErrMsg(e, "Failed to fetch tickets per month"));
        setTicketsPerMonth([]);
      }
    } finally {
      if (req === tixReqId.current) setTixLoading(false);
    }
  }, [tixYear]);

  // ✅ auto fetch when year changes (debounced)
  useEffect(() => {
    const t = setTimeout(() => fetchTicketsPerMonth(tixYear), 200);
    return () => clearTimeout(t);
  }, [tixYear, fetchTicketsPerMonth]);

  /* =========================
   * SECTION B — Time spent dept (AUTO FETCH ON YEAR CHANGE)
   * ========================= */
  const [deptYear, setDeptYear] = useState(() => new Date().getFullYear());
  const [timeSpentDeptChart, setTimeSpentDeptChart] = useState({ labels: [], series: [] });
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptError, setDeptError] = useState(null);
  const deptReqId = useRef(0);

  const fetchDept = useCallback(async (yearParam) => {
    const year = Number(yearParam || deptYear);
    const req = ++deptReqId.current;

    setDeptError(null);
    setDeptLoading(true);
    try {
      const chart = await ReportService.totalTimeSpentPerMonthByDepartment({ year });
      if (req === deptReqId.current) setTimeSpentDeptChart(chart ?? { labels: [], series: [] });
    } catch (e) {
      if (req === deptReqId.current) {
        setDeptError(getErrMsg(e, "Failed to fetch time spent by department"));
        setTimeSpentDeptChart({ labels: [], series: [] });
      }
    } finally {
      if (req === deptReqId.current) setDeptLoading(false);
    }
  }, [deptYear]);

  // ✅ auto fetch when year changes (debounced)
  useEffect(() => {
    const t = setTimeout(() => fetchDept(deptYear), 200);
    return () => clearTimeout(t);
  }, [deptYear, fetchDept]);

  /* =========================
   * SECTION C — Category + SLA (AUTO FETCH ON PRESET/DATE CHANGE) + Refresh Button
   * ========================= */
  const DEFAULT_PRESET = "this_year";
  const defaultRange = useMemo(() => buildRangeFromPreset(DEFAULT_PRESET), []);
  const [preset, setPreset] = useState(DEFAULT_PRESET);
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);

  const [categoryDist, setCategoryDist] = useState([]);
  const [sla, setSla] = useState(null);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [rangeError, setRangeError] = useState(null);
  const rangeReqId = useRef(0);

  const applyPreset = useCallback((p) => {
    setPreset(p);
    if (p === "custom") return;
    const r = buildRangeFromPreset(p);
    setStartDate(r.start);
    setEndDate(r.end);
  }, []);

  const fetchRange = useCallback(async (override = null) => {
    const req = ++rangeReqId.current;

    const finalRange = override
      ? override
      : preset === "custom"
      ? { start: startDate, end: endDate }
      : buildRangeFromPreset(preset);

    if (!finalRange?.start || !finalRange?.end) return;
    if (dayjs(finalRange.end).isBefore(dayjs(finalRange.start))) return;

    setRangeError(null);
    setRangeLoading(true);

    try {
      const [pieRes, slaRes] = await Promise.all([
        ReportService.ticketDistributionByCategory({
          start_date: finalRange.start,
          end_date: finalRange.end,
        }),
        ReportService.slaReport({
          start_date: finalRange.start,
          end_date: finalRange.end,
        }),
      ]);

      if (req === rangeReqId.current) {
        setCategoryDist(Array.isArray(pieRes) ? pieRes : pieRes?.data ?? []);
        setSla(slaRes?.data ?? slaRes ?? null);
      }
    } catch (e) {
      if (req === rangeReqId.current) {
        setRangeError(getErrMsg(e, "Failed to fetch category & SLA"));
        setCategoryDist([]);
        setSla(null);
      }
    } finally {
      if (req === rangeReqId.current) setRangeLoading(false);
    }
  }, [preset, startDate, endDate]);

  // ✅ auto fetch when preset/date changes (debounced)
  useEffect(() => {
    const finalRange =
      preset === "custom"
        ? { start: startDate, end: endDate }
        : buildRangeFromPreset(preset);

    const t = setTimeout(() => fetchRange(finalRange), 250);
    return () => clearTimeout(t);
  }, [preset, startDate, endDate, fetchRange]);

  const resetRange = useCallback(() => {
    setPreset(DEFAULT_PRESET);
    const r = buildRangeFromPreset(DEFAULT_PRESET);
    setStartDate(r.start);
    setEndDate(r.end);
  }, []);

  // first mount safety (optional)
  useEffect(() => {
    // ensure charts load once even if user does nothing
    fetchTicketsPerMonth(tixYear);
    fetchDept(deptYear);
    fetchRange(
      preset === "custom"
        ? { start: startDate, end: endDate }
        : buildRangeFromPreset(preset)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tixLabel = `Year ${tixYear}`;
  const deptLabel = `Year ${deptYear}`;
  const rangeLabel = useMemo(() => {
    if (!startDate || !endDate) return "-";
    return `${startDate} → ${endDate}`;
  }, [startDate, endDate]);

  return (
    <Box sx={{ width: "100%" }}>
      {/* ===== HEADER ===== */}
      <Paper
        elevation={0}
        sx={{
          mb: 2,
          p: { xs: 1.75, sm: 2 },
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          boxShadow: "0 10px 28px rgba(17,24,39,0.06)",
        }}
      >
        <Stack spacing={1}>
          <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 950, letterSpacing: -0.45 }}>
            Executive Ticket Insight
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              overflowX: "auto",
              whiteSpace: "nowrap",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            <Pill>Tickets: {tixLabel}</Pill>
            <Pill>Dept: {deptLabel}</Pill>
            <Pill>Range: {rangeLabel}</Pill>
          </Stack>
        </Stack>
      </Paper>

      <Stack spacing={{ xs: 1.5, sm: 2 }}>
        {/* ===== Tickets per Month ===== */}
        <Panel
          title="Tickets per Month"
          subtitle="Line chart — jumlah ticket per bulan (auto fetch saat ganti year)"
          error={tixError}
          right={
            <Stack direction="row" spacing={1} alignItems="center">
              <YearSelect year={tixYear} onChange={setTixYear} loading={tixLoading} />
              <Button
                variant="outlined"
                onClick={() => fetchTicketsPerMonth(tixYear)}
                disabled={tixLoading}
                startIcon={tixLoading ? <CircularProgress size={16} /> : null}
                sx={{ height: 40, fontWeight: 900 }}
              >
                Refresh
              </Button>
            </Stack>
          }
        >
          <Box sx={{ position: "relative", height: { xs: 320, sm: 420 } }}>
            <LoadingOverlay show={tixLoading} label="Loading tickets trend..." />
            <TicketsPerMonthLineChart data={ticketsPerMonth} loading={false} />
          </Box>
        </Panel>

        {/* ===== Time Spent Dept ===== */}
        <Panel
          title="Time Spent per Month by Department"
          subtitle="Bar chart — workload per dept (auto fetch saat ganti year)"
          error={deptError}
          right={
            <Stack direction="row" spacing={1} alignItems="center">
              <YearSelect year={deptYear} onChange={setDeptYear} loading={deptLoading} />
              <Button
                variant="outlined"
                onClick={() => fetchDept(deptYear)}
                disabled={deptLoading}
                startIcon={deptLoading ? <CircularProgress size={16} /> : null}
                sx={{ height: 40, fontWeight: 900 }}
              >
                Refresh
              </Button>
            </Stack>
          }
        >
          <Box sx={{ position: "relative", height: { xs: 320, sm: 450 } }}>
            <LoadingOverlay show={deptLoading} label="Loading department workload..." />
            <TimeSpentByDepartmentBarChart chart={timeSpentDeptChart} loading={deptLoading} />
          </Box>
        </Panel>

        {/* ===== Category + SLA ===== */}
        <Panel
          title="Category Mix + SLA"
          subtitle="Auto fetch saat ganti preset/date + ada tombol Refresh"
          error={rangeError}
          right={
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
              <RangeFilter
                preset={preset}
                onPresetChange={applyPreset}
                startDate={startDate}
                endDate={endDate}
                onStartChange={setStartDate}
                onEndChange={setEndDate}
                loading={rangeLoading}
              />

              <Stack direction="row" spacing={1} sx={{ ml: { sm: "auto" } }}>
                <Button
                  variant="outlined"
                  onClick={() =>
                    fetchRange(
                      preset === "custom"
                        ? { start: startDate, end: endDate }
                        : buildRangeFromPreset(preset)
                    )
                  }
                  disabled={rangeLoading}
                  startIcon={rangeLoading ? <CircularProgress size={16} /> : null}
                  sx={{ height: 40, fontWeight: 900 }}
                >
                  Refresh
                </Button>

                <Button
                  variant="outlined"
                  onClick={resetRange}
                  disabled={rangeLoading}
                  sx={{ height: 40, fontWeight: 900 }}
                >
                  Reset
                </Button>
              </Stack>
            </Stack>
          }
        >
          <Stack spacing={2}>
            <Paper elevation={0} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
              <Typography fontWeight={950} mb={1}>
                SLA Summary
              </Typography>
              <Box sx={{ position: "relative" }}>
                <LoadingOverlay show={rangeLoading} label="Loading SLA summary..." />
                <SlaCards data={sla} loading={false} />
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
              <Typography fontWeight={950} mb={1}>
                Ticket Distribution by Category
              </Typography>
              <Box sx={{ position: "relative" }}>
                <LoadingOverlay show={rangeLoading} label="Loading category distribution..." />
                <CategoryPieChart data={categoryDist} loading={false} />
              </Box>
            </Paper>
          </Stack>
        </Panel>
      </Stack>
    </Box>
  );
}
