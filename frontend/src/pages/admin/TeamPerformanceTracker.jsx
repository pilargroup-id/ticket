// src/pages/report/TeamPerformanceTracker.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Divider,
  Alert,
  Button,
  CircularProgress,
  Modal,
  IconButton,
  Chip,
  TextField,
  MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import ReportService from "../../services/ReportService";
import ReportFilterBar from "../../components/report/ReportFilter";
import { buildRangeFromPreset } from "../../components/utils/ReportFilterUtils";

import SupportTicketsPerMonthBarChart from "../../components/chart/SupportTicketsPerMonthBarChart";
import SupportTimeSpentPerMonthBarChart from "../../components/chart/SupportTimeSpentPerMonthBarChart";
import SupportPerformanceCards from "../../components/card/SupportPerformanceCards";

const fmtDate = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const humanMinutes = (minutes) => {
  const m = Math.max(0, Number(minutes || 0));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h > 0 && mm > 0) return `${h} jam ${mm} menit`;
  if (h > 0) return `${h} jam`;
  return `${mm} menit`;
};

const getErrMsg = (e, fallback) =>
  e?.response?.data?.message || e?.response?.message || e?.message || fallback;

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
        justifyContent: "space-between",
        alignItems: { xs: "stretch", sm: "flex-start" },
        flexDirection: { xs: "column", sm: "row" },
        gap: 1.25,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 950, letterSpacing: -0.35, lineHeight: 1.15 }} noWrap>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {right ? <Box sx={{ width: { xs: "100%", sm: "auto" } }}>{right}</Box> : null}
    </Box>

    <Divider />

    <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: "rgba(15,23,42,0.02)" }}>
      {error ? (
        <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      {children}
    </Box>
  </Paper>
);

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
      lineHeight: 1.2,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </Box>
);

// ✅ tombol disabled abu-abu (nggak nabrak)
const btnContainedSx = {
  borderRadius: 2.25,
  textTransform: "none",
  fontWeight: 900,
  boxShadow: "none",
  px: 1.5,
  minHeight: 40,
  "&:hover": { boxShadow: "none" },
  "&.Mui-disabled": {
    bgcolor: "rgba(148,163,184,0.35)",
    color: "rgba(15,23,42,0.55)",
  },
};

const btnOutlinedSx = {
  ...btnContainedSx,
  "&.Mui-disabled": {
    borderColor: "rgba(148,163,184,0.35)",
    color: "rgba(15,23,42,0.45)",
  },
};

/* =========================
 * ✅ YearSelect (no Apply)
 * ========================= */
const YearSelect = ({ year, onChange, loading }) => {
  const nowY = new Date().getFullYear();
  const years = useMemo(() => {
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

const ExportPreviewModal = ({
  open,
  onClose,
  loadingPreview,
  exporting,
  error,
  rangeLabel,
  status,
  rows,
  onExport,
}) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          p: { xs: 1.5, sm: 3 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          outline: "none",
          // ✅ biar kalau layar kecil banget, modal wrapper bisa scroll
          overflowY: "auto",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 1200,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 16px 44px rgba(17,24,39,0.18)",
            overflow: "hidden",

            // ✅ penting: biar body bisa scroll
            display: "flex",
            flexDirection: "column",
            maxHeight: { xs: "calc(100vh - 24px)", sm: "calc(100vh - 48px)" },
          }}
        >
          {/* ===== HEADER (fixed) ===== */}
          <Box
            sx={{
              p: { xs: 1.5, sm: 2 },
              display: "flex",
              justifyContent: "space-between",
              gap: 1,
              flexWrap: "wrap",
              alignItems: "center",
              bgcolor: "background.paper",
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 950 }} noWrap>
                Preview Export Tickets
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.75 }} useFlexGap flexWrap="wrap">
                <Chip size="small" label={`Range: ${rangeLabel}`} />
                <Chip size="small" label={`Status: ${status}`} />
                <Chip size="small" label={`Rows: ${rows?.length ?? 0}`} />
              </Stack>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="contained"
                onClick={onExport}
                disabled={loadingPreview || exporting}
                startIcon={loadingPreview || exporting ? <CircularProgress size={16} /> : null}
                sx={btnContainedSx}
              >
                {exporting ? "Exporting..." : "Export"}
              </Button>
              <IconButton onClick={onClose} disabled={loadingPreview || exporting}>
                <CloseIcon />
              </IconButton>
            </Stack>
          </Box>

          <Divider />

          {/* ===== BODY (scrollable) ===== */}
          <Box
            sx={{
              position: "relative",
              flex: 1,
              minHeight: 0, // ✅ WAJIB biar flex child bisa scroll
              overflowY: "auto",
              p: { xs: 1.25, sm: 2 },
              bgcolor: "rgba(15,23,42,0.02)",
            }}
          >
            <LoadingOverlay show={loadingPreview} label="Loading preview..." />

            {error ? (
              <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
                {error}
              </Alert>
            ) : null}

            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2.5,
                overflow: "auto",
                bgcolor: "background.paper",
              }}
            >
              <Box
                component="table"
                sx={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  "& th, & td": {
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    p: 1,
                    fontSize: 12,
                    verticalAlign: "top",
                    whiteSpace: "nowrap",
                  },
                  "& th": {
                    position: "sticky",
                    top: 0,
                    bgcolor: "background.paper",
                    zIndex: 1,
                    fontWeight: 900,
                    fontSize: 12,
                  },
                }}
              >
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>User</th>
                    <th>Support</th>
                    <th>Category</th>
                    <th>Asset</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Time</th>
                    <th>Late</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(rows || []).map((t) => (
                    <tr key={t.id}>
                      <td>{t.ticket_code}</td>
                      <td>{t.user_name || "-"}</td>
                      <td>{t.support_name || "-"}</td>
                      <td>{t.category_name || "-"}</td>
                      <td>{t.assets_name || "-"}</td>
                      <td>{t.status}</td>
                      <td>{t.priority || "-"}</td>
                      <td>{humanMinutes(t.time_spent)}</td>
                      <td>{t.is_late ? "Yes" : "No"}</td>
                      <td>{t.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </Box>
            </Box>

            {!rows?.length && !loadingPreview ? (
              <Typography sx={{ mt: 1.25, color: "text.secondary", fontWeight: 900, fontSize: 13 }}>
                No rows untuk filter ini.
              </Typography>
            ) : null}
          </Box>

          <Divider />

          {/* ===== FOOTER (fixed) ===== */}
          <Box
            sx={{
              p: { xs: 1.25, sm: 1.5 },
              display: "flex",
              justifyContent: "flex-end",
              bgcolor: "background.paper",
            }}
          >
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={loadingPreview || exporting}
              sx={btnOutlinedSx}
            >
              Close
            </Button>
          </Box>
        </Paper>
      </Box>
    </Modal>
  );
};


export default function TeamPerformanceTracker() {
  // ✅ default this_year
  const DEFAULT_PRESET = "this_year";
  const defaultRange = useMemo(() => buildRangeFromPreset(DEFAULT_PRESET), []);
  const defaultStart = defaultRange?.start_date || fmtDate(new Date(new Date().getFullYear(), 0, 1));
  const defaultEnd = defaultRange?.end_date || fmtDate(new Date(new Date().getFullYear(), 11, 31));

  // ===== Section 1: Export (tetap pakai Apply karena butuh buka modal preview) =====
  const [expPreset, setExpPreset] = useState(DEFAULT_PRESET);
  const [expStart, setExpStart] = useState(defaultStart);
  const [expEnd, setExpEnd] = useState(defaultEnd);
  const [expStatus, setExpStatus] = useState("all");
  const expRangeLabel = useMemo(() => `${expStart} → ${expEnd}`, [expStart, expEnd]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [exporting, setExporting] = useState(false);

  const applyExportPreset = useCallback((p) => {
    setExpPreset(p);
    const r = buildRangeFromPreset(p);
    if (r) {
      setExpStart(r.start_date);
      setExpEnd(r.end_date);
    }
  }, []);

  const fetchPreview = useCallback(async () => {
    if (!expStart || !expEnd) return;
    if (previewLoading || exporting) return;

    setPreviewError(null);
    setPreviewLoading(true);
    try {
      const rows = await ReportService.previewExportTickets({
        start_date: expStart,
        end_date: expEnd,
        status: expStatus,
        per_page: 5000,
      });
      setPreviewRows(rows);
    } catch (e) {
      setPreviewError(getErrMsg(e, "Failed to fetch preview tickets"));
      setPreviewRows([]);
    } finally {
      setPreviewLoading(false);
    }
  }, [expStart, expEnd, expStatus, previewLoading, exporting]);

  const handleExport = useCallback(async () => {
    if (!expStart || !expEnd) return;
    if (exporting) return;

    setExporting(true);
    try {
      await ReportService.exportTickets({
        start_date: expStart,
        end_date: expEnd,
        status: expStatus,
      });
    } catch (e) {
      setPreviewError(e?.message || "Failed to export tickets");
    } finally {
      setExporting(false);
    }
  }, [exporting, expStart, expEnd, expStatus]);

  // ===== Section 2: Tickets chart (AUTO on year change) + Refresh button =====
  const [tixYear, setTixYear] = useState(() => new Date().getFullYear());
  const [ticketsChart, setTicketsChart] = useState({ labels: [], series: [] });
  const [tixLoading, setTixLoading] = useState(false);
  const [tixError, setTixError] = useState(null);
  const tixReqId = useRef(0);

  const fetchTicketsChart = useCallback(async (yearParam) => {
    const year = Number(yearParam ?? tixYear);
    const req = ++tixReqId.current;

    setTixError(null);
    setTixLoading(true);
    try {
      const chart = await ReportService.ticketsPerMonthBySupport({ year });
      if (req === tixReqId.current) setTicketsChart(chart);
    } catch (e) {
      if (req === tixReqId.current) {
        setTixError(getErrMsg(e, "Failed to fetch tickets chart"));
        setTicketsChart({ labels: [], series: [] });
      }
    } finally {
      if (req === tixReqId.current) setTixLoading(false);
    }
  }, [tixYear]);

  useEffect(() => {
    const t = setTimeout(() => fetchTicketsChart(tixYear), 200);
    return () => clearTimeout(t);
  }, [tixYear, fetchTicketsChart]);

  // ===== Section 3: Time spent chart (AUTO on year change) + Refresh button =====
  const [tsYear, setTsYear] = useState(() => new Date().getFullYear());
  const [timeChart, setTimeChart] = useState({ labels: [], series: [] });
  const [tsLoading, setTsLoading] = useState(false);
  const [tsError, setTsError] = useState(null);
  const tsReqId = useRef(0);

  const fetchTimeChart = useCallback(async (yearParam) => {
    const year = Number(yearParam ?? tsYear);
    const req = ++tsReqId.current;

    setTsError(null);
    setTsLoading(true);
    try {
      const chart = await ReportService.timeSpentPerMonthBySupport({ year });
      if (req === tsReqId.current) setTimeChart(chart);
    } catch (e) {
      if (req === tsReqId.current) {
        setTsError(getErrMsg(e, "Failed to fetch time spent chart"));
        setTimeChart({ labels: [], series: [] });
      }
    } finally {
      if (req === tsReqId.current) setTsLoading(false);
    }
  }, [tsYear]);

  useEffect(() => {
    const t = setTimeout(() => fetchTimeChart(tsYear), 200);
    return () => clearTimeout(t);
  }, [tsYear, fetchTimeChart]);

  // ===== Section 4: Summary (AUTO on preset/date/status change) + Refresh button =====
  const [sumPreset, setSumPreset] = useState("this_year");
  const sumDefaultRange = useMemo(() => buildRangeFromPreset("this_year"), []);
  const [sumStart, setSumStart] = useState(sumDefaultRange?.start_date || defaultStart);
  const [sumEnd, setSumEnd] = useState(sumDefaultRange?.end_date || defaultEnd);
  const [sumStatus, setSumStatus] = useState("all");

  const [supportSummary, setSupportSummary] = useState([]);
  const [sumLoading, setSumLoading] = useState(false);
  const [sumError, setSumError] = useState(null);
  const sumReqId = useRef(0);

  const applySumPreset = useCallback((p) => {
    setSumPreset(p);
    const r = buildRangeFromPreset(p);
    if (r) {
      setSumStart(r.start_date);
      setSumEnd(r.end_date);
    }
  }, []);

  const fetchSummary = useCallback(async (override = null) => {
    const req = ++sumReqId.current;

    const start = override?.start_date ?? sumStart;
    const end = override?.end_date ?? sumEnd;
    const status = override?.status ?? sumStatus;

    if (!start || !end) return;

    setSumError(null);
    setSumLoading(true);
    try {
      const rows = await ReportService.supportSummary({
        start_date: start,
        end_date: end,
        status,
      });
      if (req === sumReqId.current) setSupportSummary(rows);
    } catch (e) {
      if (req === sumReqId.current) {
        setSumError(getErrMsg(e, "Failed to fetch support summary"));
        setSupportSummary([]);
      }
    } finally {
      if (req === sumReqId.current) setSumLoading(false);
    }
  }, [sumStart, sumEnd, sumStatus]);

  useEffect(() => {
    const t = setTimeout(() => fetchSummary(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sumStart, sumEnd, sumStatus, sumPreset]);

  const headerPaperSx = {
    mb: 2,
    p: { xs: 1.75, sm: 2 },
    borderRadius: 3,
    border: "1px solid",
    borderColor: "divider",
    bgcolor: "background.paper",
    boxShadow: "0 10px 28px rgba(17,24,39,0.06)",
  };

return (
  <Box
    sx={{
      width: "100%",
      // ✅ bikin area page ini pasti bisa scroll walau parent layout nge-lock
      height: "calc(100vh - var(--header-height, 0px))",
      overflowY: "auto",
      overflowX: "hidden",
      pr: { xs: 0.5, sm: 1 },
      pb: 2,
      WebkitOverflowScrolling: "touch",
    }}
  >
    <Paper elevation={0} sx={headerPaperSx}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.25}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 950, letterSpacing: -0.45, lineHeight: 1.1 }}
            noWrap
          >
            Team Performance Tracker
          </Typography>
        </Box>

        {/* ✅ pills bisa scroll horizontal di mobile */}
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="nowrap"
          justifyContent="flex-end"
          sx={{
            width: { xs: "100%", sm: "auto" },
            overflowX: "auto",
            whiteSpace: "nowrap",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          <Pill>Export: {expStart}→{expEnd}</Pill>
          <Pill>Tickets: Year {tixYear}</Pill>
          <Pill>Time: Year {tsYear}</Pill>
          <Pill>Summary: {sumStart}→{sumEnd}</Pill>
        </Stack>
      </Stack>
    </Paper>

    <Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ pb: 2 }}>
      {/* 1) Export (tetap ada Apply karena preview modal) */}
      <Panel
        title="Export Tickets"
        subtitle="Filter khusus export (preset/custom + status) — preview via tombol"
        right={
          <ReportFilterBar
            preset={expPreset}
            onPresetChange={applyExportPreset}
            startDate={expStart}
            endDate={expEnd}
            onStartChange={setExpStart}
            onEndChange={setExpEnd}
            showStatus
            status={expStatus}
            onStatusChange={setExpStatus}
            loading={previewLoading || exporting}
            onReset={() => {
              applyExportPreset(DEFAULT_PRESET);
              setExpStatus("all");
            }}
            onApply={async () => {
              if (previewLoading || exporting) return;
              setPreviewOpen(true);
              await fetchPreview();
            }}
          />
        }
      >
        {/* ✅ kasih isi biar panel gak “kosong” dan tinggi aneh */}
        <Typography sx={{ color: "text.secondary", fontWeight: 800, fontSize: 13 }}>
          Klik <b>Apply</b> untuk buka preview export.
        </Typography>
      </Panel>

      {/* 2) Tickets chart (no Apply) + Refresh */}
      <Panel
        title="Tickets per Month by Support"
        subtitle="Bar chart — tickets per bulan (auto fetch saat ganti year)"
        error={tixError}
        right={
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", sm: "center" }}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <YearSelect year={tixYear} onChange={setTixYear} loading={tixLoading} />
            <Button
              variant="outlined"
              onClick={() => fetchTicketsChart(tixYear)}
              disabled={tixLoading}
              startIcon={tixLoading ? <CircularProgress size={16} /> : null}
              sx={{ height: 40, fontWeight: 900, borderRadius: 2.25, textTransform: "none" }}
            >
              Refresh
            </Button>
          </Stack>
        }
      >
        <Box sx={{ position: "relative", borderRadius: 2.5, minHeight: 260 }}>
          <LoadingOverlay show={tixLoading} label="Loading tickets chart..." />
          <SupportTicketsPerMonthBarChart chart={ticketsChart} loading={tixLoading} />
        </Box>
      </Panel>

      {/* 3) Time spent chart (no Apply) + Refresh */}
      <Panel
        title="Time Spent per Month by Support"
        subtitle="Bar chart — waktu per bulan (auto fetch saat ganti year)"
        error={tsError}
        right={
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", sm: "center" }}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <YearSelect year={tsYear} onChange={setTsYear} loading={tsLoading} />
            <Button
              variant="outlined"
              onClick={() => fetchTimeChart(tsYear)}
              disabled={tsLoading}
              startIcon={tsLoading ? <CircularProgress size={16} /> : null}
              sx={{ height: 40, fontWeight: 900, borderRadius: 2.25, textTransform: "none" }}
            >
              Refresh
            </Button>
          </Stack>
        }
      >
        <Box sx={{ position: "relative", borderRadius: 2.5, minHeight: 260 }}>
          <LoadingOverlay show={tsLoading} label="Loading time spent chart..." />
          <SupportTimeSpentPerMonthBarChart chart={timeChart} loading={tsLoading} />
        </Box>
      </Panel>

      {/* 4) Summary (no Apply) + Refresh */}
      <Panel
        title="Support Performance"
        subtitle="Auto fetch saat preset/date/status berubah + tombol Refresh"
        error={sumError}
        right={
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", md: "center" }}
            sx={{ width: "100%" }}
          >
            <Box sx={{ flex: 1, minWidth: 260 }}>
              <ReportFilterBar
                preset={sumPreset}
                onPresetChange={applySumPreset}
                startDate={sumStart}
                endDate={sumEnd}
                onStartChange={setSumStart}
                onEndChange={setSumEnd}
                showStatus
                status={sumStatus}
                onStatusChange={setSumStatus}
                loading={sumLoading}
                onReset={() => {
                  applySumPreset("this_year");
                  setSumStatus("all");
                }}
                hideApply
                autoApplyOnChange
                onAutoApply={fetchSummary}
              />
            </Box>

            <Button
              variant="outlined"
              onClick={fetchSummary}
              disabled={sumLoading}
              startIcon={sumLoading ? <CircularProgress size={16} /> : null}
              sx={{
                height: 40,
                fontWeight: 900,
                borderRadius: 2.25,
                textTransform: "none",
                width: { xs: "100%", md: "auto" },
              }}
            >
              Refresh
            </Button>
          </Stack>
        }
      >
        <Box sx={{ position: "relative", borderRadius: 2.5, minHeight: 220 }}>
          <LoadingOverlay show={sumLoading} label="Loading support performance..." />
          <SupportPerformanceCards
            data={supportSummary}
            startDate={sumStart}
            endDate={sumEnd}
            status={sumStatus}
          />
        </Box>
      </Panel>
    </Stack>

    <ExportPreviewModal
      open={previewOpen}
      onClose={() => setPreviewOpen(false)}
      loadingPreview={previewLoading}
      exporting={exporting}
      error={previewError}
      rangeLabel={expRangeLabel}
      status={expStatus}
      rows={previewRows}
      onExport={handleExport}
    />
  </Box>
);

}
