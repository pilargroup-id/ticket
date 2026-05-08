// src/pages/report/ProjectPerformanceTracker.jsx
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
  useMediaQuery,
  Tooltip,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";

import ReportService from "../../services/ReportService";

/* =========================
 * helpers
 * ========================= */
const getErrMsg = (e, fallback) =>
  e?.response?.data?.message || e?.response?.message || e?.message || fallback;

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "waiting", label: "Waiting" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "void", label: "Void" },
];

// status color chip
const statusChipSx = (theme, status) => {
  const map = {
    waiting: theme.palette.warning.main,
    pending: theme.palette.info.main,
    in_progress: theme.palette.primary.main,
    resolved: theme.palette.success.main,
    void: theme.palette.error.main,
    feedback: theme.palette.success.main,
  };
  const c = map[String(status || "").toLowerCase()] || theme.palette.grey[600];
  return {
    height: 22,
    fontSize: 11,
    fontWeight: 900,
    borderRadius: 999,
    border: `1px solid ${alpha(c, 0.35)}`,
    bgcolor: alpha(c, 0.08),
    color: c,
    "& .MuiChip-label": { px: 0.9 },
  };
};

/** =========================
 * Table SX
 * ========================= */
const makeTableSx = (theme, opts = {}) => {
  const {
    stickyHeaderBg = "background.paper",
    zebra = true,
    dense = false,
    centerHeader = true,
    centerBody = true,
  } = opts;

  return {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    tableLayout: "auto",

    "& th, & td": {
      borderBottom: "1px solid",
      borderColor: "divider",
      padding: dense ? "10px 12px" : "12px 14px",
      fontSize: 12,
      verticalAlign: "middle",
      whiteSpace: "nowrap",
    },

    "& th": {
      position: "sticky",
      top: 0,
      zIndex: 2,
      bgcolor: stickyHeaderBg,
      fontWeight: 950,
      letterSpacing: 0.2,
      textAlign: centerHeader ? "center" : "left",
      borderBottom: "1px solid",
      borderColor: alpha(theme.palette.divider, 0.9),
    },

    "& td": {
      textAlign: centerBody ? "center" : "left",
      color: "text.primary",
    },

    ...(zebra
      ? {
          "& tbody tr:nth-of-type(odd) td": {
            bgcolor: "rgba(15,23,42,0.015)",
          },
        }
      : {}),
    "& tbody tr:hover td": {
      bgcolor: "rgba(15,23,42,0.04)",
    },

    "& thead th:first-of-type": { borderTopLeftRadius: 12 },
    "& thead th:last-of-type": { borderTopRightRadius: 12 },
  };
};

const LoadingOverlay = ({ show, label = "Loading..." }) => {
  if (!show) return null;
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        borderRadius: 2.75,
        bgcolor: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(6px)",
        display: "grid",
        placeItems: "center",
        zIndex: 5,
      }}
    >
      <Stack alignItems="center" spacing={1}>
        <CircularProgress size={22} />
        <Typography sx={{ fontSize: 12, fontWeight: 900, color: "text.secondary" }}>
          {label}
        </Typography>
      </Stack>
    </Box>
  );
};

/* =========================
 * UI atoms
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
      fontWeight: 900,
      color: "text.primary",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </Box>
);

const Panel = ({ title, subtitle, right, children, error }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: 3,
      border: "1px solid",
      borderColor: "divider",
      overflow: "hidden",
      bgcolor: "background.paper",
      boxShadow: "0 10px 28px rgba(17,24,39,0.06)",
    }}
  >
    <Box
      sx={{
        p: { xs: 1.5, sm: 2 },
        display: "flex",
        alignItems: { xs: "stretch", sm: "center" },
        justifyContent: "space-between",
        gap: 1.25,
        flexWrap: "wrap",
      }}
    >
      <Box sx={{ minWidth: 0, flex: "1 1 260px" }}>
        <Typography variant="h6" sx={{ fontWeight: 950, letterSpacing: -0.35, lineHeight: 1.15 }} noWrap>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>

      {right ? (
        <Box sx={{ flex: { xs: "1 1 260px", sm: "0 0 auto" }, width: { xs: "100%", sm: "auto" } }}>{right}</Box>
      ) : null}
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

const controlSx = {
  minWidth: { xs: "100%", sm: 160 },
  "& .MuiInputBase-root": { borderRadius: 2.25, height: 40 },
};

const btnContainedSx = {
  borderRadius: 2.25,
  textTransform: "none",
  fontWeight: 950,
  boxShadow: "none",
  px: 1.6,
  minHeight: 40,
  "&:hover": { boxShadow: "none" },
  "&.Mui-disabled": {
    bgcolor: "rgba(148,163,184,0.35)",
    color: "rgba(15,23,42,0.55)",
  },
};

const btnOutlinedSx = {
  ...btnContainedSx,
  bgcolor: "transparent",
  "&.Mui-disabled": {
    borderColor: "rgba(148,163,184,0.35)",
    color: "rgba(15,23,42,0.45)",
  },
};

/* =========================
 * YearSelect (NO APPLY)
 * ========================= */
const YearSelect = ({ year, onChange, disabled }) => {
  const years = useMemo(() => {
    const now = new Date().getFullYear();
    const list = [];
    for (let y = now; y >= now - 6; y--) list.push(y);
    return list;
  }, []);

  return (
    <TextField
      select
      size="small"
      label="Year"
      value={year}
      onChange={(e) => onChange(Number(e.target.value))}
      disabled={disabled}
      sx={controlSx}
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
 * Modal: Export Preview Projects (DETAILS)
 * - scroll FIX (body overflow)
 * - Project Code kolom KIRI
 * ========================= */
const ExportPreviewProjectsModal = ({
  open,
  onClose,
  loadingPreview,
  exporting,
  error,
  year,
  status,
  q,
  rows,
  onExport,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Modal open={open} onClose={onClose} disableScrollLock>
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          display: "grid",
          placeItems: "center",
          p: { xs: 1.25, sm: 3 },
          outline: "none",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 1300,
            height: { xs: "92vh", sm: "88vh" }, // ✅ penting biar body bisa scroll
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 18px 60px rgba(17,24,39,0.22)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          {/* header sticky */}
          <Box
            sx={{
              p: { xs: 1.25, sm: 1.75 },
              display: "flex",
              justifyContent: "space-between",
              gap: 1,
              alignItems: "center",
              position: "sticky",
              top: 0,
              zIndex: 3,
              bgcolor: "background.paper",
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 950 }} noWrap>
                Export Preview — Project Details
              </Typography>

              <Stack direction="row" spacing={1} sx={{ mt: 0.75 }} useFlexGap flexWrap="wrap">
                <Chip size="small" label={`Year: ${year}`} />
                <Chip size="small" label={`Status: ${status}`} />
                <Chip size="small" label={`Search: ${q || "-"}`} />
                <Chip size="small" label={`Rows: ${rows?.length ?? 0}`} />
              </Stack>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="contained"
                onClick={onExport}
                disabled={loadingPreview || exporting}
                startIcon={exporting ? <CircularProgress size={16} /> : <DownloadRoundedIcon />}
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

          {/* ✅ body scroll */}
          <Box
            sx={{
              position: "relative",
              flex: 1,
              minHeight: 0,
              overflow: "auto",
              p: { xs: 1.25, sm: 2 },
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
                borderRadius: 2.75,
                overflow: "auto",
                bgcolor: "background.paper",
              }}
            >
              <Box
                component="table"
                sx={{
                  ...makeTableSx(theme, { centerHeader: true, centerBody: true }),
                  // Project column (3) left body
                  "& th:nth-of-type(3), & td:nth-of-type(3)": { minWidth: 280 },
                  "& td:nth-of-type(3)": { textAlign: "left", whiteSpace: "normal" },
                  // Description column (9) left body
                  "& th:nth-of-type(9), & td:nth-of-type(9)": { minWidth: 460 },
                  "& td:nth-of-type(9)": { textAlign: "left", whiteSpace: "normal" },
                  // Date column (5)
                  "& th:nth-of-type(5), & td:nth-of-type(5)": { width: 140 },
                }}
              >
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Code</th>
                    <th>Project</th>
                    <th>Requestor</th>
                    <th>Date</th>
                    <th>Developer</th>
                    <th>Task Status</th>
                    <th>Progress</th>
                    <th>Description</th>
                  </tr>
                </thead>

                <tbody>
                  {(rows || []).map((r, idx) => (
                    <tr key={r.detail_id ?? r.id ?? `${r.project_code}-${idx}`}>
                      <td>{idx + 1}</td>
                      <td>{r.project_code || "-"}</td>
                      <td>
                        <Typography sx={{ fontSize: 12, fontWeight: 950, lineHeight: 1.25 }}>
                          {r.project_name || "-"}
                        </Typography>
                      </td>
                      <td>{r.requestor_name || "-"}</td>
                      <td>{r.progress_date || "-"}</td>
                      <td>{r.developer_name || "-"}</td>
                      <td>
                        <Chip size="small" label={r.detail_status || "-"} sx={statusChipSx(theme, r.detail_status)} />
                      </td>
                      <td>{Number(r.detail_progress_percent ?? 0)}%</td>
                      <td>{r.detail_description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </Box>
            </Box>

            {!rows?.length && !loadingPreview ? (
              <Box sx={{ mt: 2, display: "grid", placeItems: "center" }}>
                <Typography sx={{ color: "text.secondary", fontWeight: 950, fontSize: 13 }}>
                  No Data
                </Typography>
              </Box>
            ) : null}
          </Box>

          <Divider />

          <Box sx={{ p: { xs: 1.25, sm: 1.5 }, display: "flex", justifyContent: "flex-end" }}>
            <Button variant="outlined" onClick={onClose} disabled={loadingPreview || exporting} sx={btnOutlinedSx}>
              Close
            </Button>
          </Box>
        </Paper>
      </Box>
    </Modal>
  );
};

/* =========================
 * Modal: Developer Detail
 * - scroll FIX
 * ========================= */
const DeveloperDetailModal = ({ open, onClose, loading, error, devName, data }) => {
  const theme = useTheme();
  const rows = data?.rows || [];
  const pag = data?.pagination;

  return (
    <Modal open={open} onClose={onClose} disableScrollLock>
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          display: "grid",
          placeItems: "center",
          p: { xs: 1.25, sm: 3 },
          outline: "none",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 1300,
            height: { xs: "92vh", sm: "88vh" }, // ✅
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 18px 60px rgba(17,24,39,0.22)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <Box
            sx={{
              p: { xs: 1.25, sm: 1.75 },
              display: "flex",
              justifyContent: "space-between",
              gap: 1,
              alignItems: "center",
              position: "sticky",
              top: 0,
              zIndex: 3,
              bgcolor: "background.paper",
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 950 }} noWrap>
                Developer Detail — {devName || "Developer"}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
                {pag ? `Total Projects: ${pag.total} • Page ${pag.current_page}/${pag.last_page}` : null}
              </Typography>
            </Box>

            <IconButton onClick={onClose} disabled={loading}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider />

          <Box
            sx={{
              position: "relative",
              flex: 1,
              minHeight: 0,
              overflow: "auto", // ✅
              p: { xs: 1.25, sm: 2 },
            }}
          >
            <LoadingOverlay show={loading} label="Loading developer detail..." />

            {error ? (
              <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
                {error}
              </Alert>
            ) : null}

            {!loading && !rows?.length ? (
              <Box sx={{ display: "grid", placeItems: "center", minHeight: 160 }}>
                <Typography sx={{ color: "text.secondary", fontWeight: 950, fontSize: 13 }}>
                  No projects.
                </Typography>
              </Box>
            ) : null}

            <Stack spacing={1.5}>
              {rows.map((p) => (
                <Paper
                  key={p.project_id}
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    p: 1.5,
                    bgcolor: "background.paper",
                    boxShadow: "0 10px 28px rgba(17,24,39,0.06)",
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ sm: "center" }}
                    justifyContent="space-between"
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 950 }} noWrap>
                        {p.project_code} — {p.project_name}
                      </Typography>

                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 0.5 }}>
                        <Chip size="small" label={p.status || "-"} sx={statusChipSx(theme, p.status)} />
                        <Chip size="small" label={`Progress: ${p.progress_percent ?? 0}%`} />
                        <Chip
                          size="small"
                          label={`Late: ${p.is_late ? "Yes" : "No"}`}
                          sx={{
                            height: 22,
                            fontSize: 11,
                            fontWeight: 900,
                            borderRadius: 999,
                            bgcolor: p.is_late ? alpha(theme.palette.error.main, 0.1) : "rgba(15,23,42,0.04)",
                            color: p.is_late ? theme.palette.error.main : "text.primary",
                          }}
                        />
                        <Chip size="small" label={`Requestor: ${p.requestor_name || "-"}`} />
                      </Stack>
                    </Box>

                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent="flex-end">
                      <Chip size="small" label={`Tasks: ${p.tasks_count ?? 0}`} />
                      <Chip size="small" label={`Last: ${p.last_progress_date || "-"}`} />
                    </Stack>
                  </Stack>

                  {Array.isArray(p.tasks) && p.tasks.length ? (
                    <Box sx={{ mt: 1.1, borderTop: "1px solid", borderColor: "divider", pt: 1 }}>
                      <Box
                        component="table"
                        sx={{
                          ...makeTableSx(theme, { centerHeader: true, centerBody: true, dense: true }),
                          "& th:nth-of-type(2)": { textAlign: "center" },
                          "& td:nth-of-type(2)": {
                            textAlign: "left",
                            whiteSpace: "normal",
                            minWidth: 360,
                          },
                          "& th:nth-of-type(1), & td:nth-of-type(1)": { width: 140 },
                          "& th:nth-of-type(4), & td:nth-of-type(4)": { width: 120 },
                        }}
                      >
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Progress</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.tasks.slice(0, 25).map((t) => (
                            <tr key={t.id}>
                              <td>{t.progress_date || "-"}</td>
                              <td>{t.description || "-"}</td>
                              <td>
                                <Chip size="small" label={t.status || "-"} sx={statusChipSx(theme, t.status)} />
                              </td>
                              <td>{t.progress_percent ?? 0}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </Box>

                      {p.tasks.length > 25 ? (
                        <Typography sx={{ mt: 0.75, fontSize: 12, color: "text.secondary", fontWeight: 900 }}>
                          Showing 25/{p.tasks.length} tasks (biar modal nggak berat).
                        </Typography>
                      ) : null}
                    </Box>
                  ) : null}
                </Paper>
              ))}
            </Stack>
          </Box>

          <Divider />

          <Box sx={{ p: { xs: 1.25, sm: 1.5 }, display: "flex", justifyContent: "flex-end" }}>
            <Button variant="outlined" onClick={onClose} disabled={loading} sx={btnOutlinedSx}>
              Close
            </Button>
          </Box>
        </Paper>
      </Box>
    </Modal>
  );
};

/* =========================
 * Page
 * ========================= */
export default function ProjectPerformanceTracker() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  /* =========================
   * 1) Export Projects (DETAILS)
   * ========================= */
  const [expYear, setExpYear] = useState(() => new Date().getFullYear());
  const [expStatus, setExpStatus] = useState("all");
  const [expQ, setExpQ] = useState("");

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [exporting, setExporting] = useState(false);

  const fetchPreview = useCallback(async () => {
    if (previewLoading || exporting) return;

    setPreviewError(null);
    setPreviewLoading(true);

    try {
      const res = await ReportService.previewExportProjects({
        year: expYear,
        status: expStatus,
        q: expQ,
        per_page: 5000,
      });

      // ✅ paginate: { data: { data: [...] } } atau kadang service lu udah extract
      const items = res?.data?.data ?? res?.data ?? res ?? [];
      setPreviewRows(Array.isArray(items) ? items : []);
    } catch (e) {
      setPreviewError(getErrMsg(e, "Failed to fetch preview project details"));
      setPreviewRows([]);
    } finally {
      setPreviewLoading(false);
    }
  }, [expYear, expStatus, expQ, previewLoading, exporting]);

  const handleExport = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await ReportService.exportProjects({
        year: expYear,
        status: expStatus,
        q: expQ,
      });
    } catch (e) {
      setPreviewError(e?.message || "Failed to export project details");
    } finally {
      setExporting(false);
    }
  }, [exporting, expYear, expStatus, expQ]);

  /* =========================
   * 2) Developer Summary (year-based)
   * - auto fetch saat year/status berubah
   * ========================= */
  const [devYear, setDevYear] = useState(() => new Date().getFullYear());
  const [devStatus, setDevStatus] = useState("all");
  const [devRows, setDevRows] = useState([]);
  const [devLoading, setDevLoading] = useState(false);
  const [devError, setDevError] = useState(null);
  const devInFlight = useRef(false);

  const fetchDevSummary = useCallback(async () => {
    if (devInFlight.current) return;
    devInFlight.current = true;

    setDevError(null);
    setDevLoading(true);

    try {
      const rows = await ReportService.developerProjectSummary({
        year: devYear,
        status: devStatus,
      });
      setDevRows(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setDevError(getErrMsg(e, "Failed to fetch developer project summary"));
      setDevRows([]);
    } finally {
      setDevLoading(false);
      devInFlight.current = false;
    }
  }, [devYear, devStatus]);

  useEffect(() => {
    fetchDevSummary();
  }, [fetchDevSummary]);

  /* =========================
   * 3) Developer Detail modal
   * ========================= */
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [detailDevName, setDetailDevName] = useState("");
  const [detailData, setDetailData] = useState(null);

  const openDeveloperDetail = useCallback(
    async (developerId, developerName) => {
      if (!developerId) return;
      setDetailOpen(true);
      setDetailLoading(true);
      setDetailError(null);
      setDetailDevName(developerName || "Developer");
      setDetailData(null);

      try {
        const data = await ReportService.developerProjectDetail(developerId, {
          year: devYear,
          status: devStatus,
          per_page: 50,
        });
        setDetailData(data);
      } catch (e) {
        setDetailError(getErrMsg(e, "Failed to fetch developer detail"));
        setDetailData(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [devYear, devStatus]
  );

  const headerPaperSx = {
    mb: 2,
    p: { xs: 1.75, sm: 2 },
    borderRadius: 3,
    border: "1px solid",
    borderColor: "divider",
    bgcolor: "background.paper",
    boxShadow: "0 10px 28px rgba(17,24,39,0.06)",
  };

  const statPills = useMemo(
    () => ({
      exp: `Export: ${expYear} • ${expStatus}${expQ ? ` • q:${expQ}` : ""}`,
      dev: `Dev: ${devYear} • ${devStatus}`,
    }),
    [expYear, expStatus, expQ, devYear, devStatus]
  );

  return (
    <Box sx={{ width: "100%" }}>
      {/* ===== HEADER ===== */}
      <Paper elevation={0} sx={headerPaperSx}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.25}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant={isMobile ? "h6" : "h5"}
              sx={{ fontWeight: 950, letterSpacing: -0.45, lineHeight: 1.1 }}
              noWrap
            >
              Project Performance Tracker
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent="flex-end">
            <Pill>{statPills.exp}</Pill>
            <Pill>{statPills.dev}</Pill>
          </Stack>
        </Stack>
      </Paper>

      <Stack spacing={{ xs: 1.5, sm: 2 }}>
        {/* =========================
         * 1) Export Projects (DETAILS)
         * ========================= */}
        <Panel
          title="Export Project Details"
          subtitle="Preview & export Excel (row = task/progress from project_details)"
          right={
            <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
              <YearSelect year={expYear} onChange={setExpYear} disabled={previewLoading || exporting} />

              <TextField
                select
                size="small"
                label="Header Status"
                value={expStatus}
                onChange={(e) => setExpStatus(e.target.value)}
                disabled={previewLoading || exporting}
                sx={controlSx}
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
                placeholder="code / name / requestor / developer / desc"
                value={expQ}
                onChange={(e) => setExpQ(e.target.value)}
                disabled={previewLoading || exporting}
                sx={{ ...controlSx, minWidth: { xs: "100%", sm: 260 } }}
              />

              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  onClick={async () => {
                    if (previewLoading || exporting) return;
                    setPreviewOpen(true);
                    await fetchPreview();
                  }}
                  disabled={previewLoading || exporting}
                  startIcon={previewLoading ? <CircularProgress size={16} /> : <VisibilityRoundedIcon />}
                  sx={btnContainedSx}
                >
                  Preview
                </Button>

                <Button
                  variant="outlined"
                  onClick={fetchPreview}
                  disabled={previewLoading || exporting}
                  startIcon={previewLoading ? <CircularProgress size={16} /> : <RefreshRoundedIcon />}
                  sx={btnOutlinedSx}
                >
                  Refresh
                </Button>
              </Stack>
            </Stack>
          }
        >
          <Typography sx={{ fontSize: 13, color: "text.secondary", fontWeight: 800 }}>
            Notes: Export & preview Mengambil task/progress dari <b>project_details</b>
          </Typography>
        </Panel>

        {/* =========================
         * 2) Developer Performance
         * ========================= */}
        <Panel
          title="Developer Project Performance"
          subtitle="Summary by developer (auto fetch saat year/status berubah — click Detail)"
          error={devError}
          right={
            <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
              <YearSelect year={devYear} onChange={setDevYear} disabled={devLoading} />

              <TextField
                select
                size="small"
                label="Header Status"
                value={devStatus}
                onChange={(e) => setDevStatus(e.target.value)}
                disabled={devLoading}
                sx={controlSx}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>

              <Button
                variant="contained"
                onClick={fetchDevSummary}
                disabled={devLoading}
                startIcon={devLoading ? <CircularProgress size={16} /> : <RefreshRoundedIcon />}
                sx={btnContainedSx}
              >
                Refresh
              </Button>
            </Stack>
          }
        >
          <Box sx={{ position: "relative", borderRadius: 2.75 }}>
            <LoadingOverlay show={devLoading} label="Loading developer performance..." />

            {!devLoading && !devRows?.length ? (
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2.75,
                  bgcolor: "background.paper",
                  minHeight: 220,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Typography sx={{ color: "text.secondary", fontWeight: 950, fontSize: 13 }}>
                  No Data
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2.75,
                  overflow: "auto",
                  bgcolor: "background.paper",
                }}
              >
                <Box
                  component="table"
                  sx={{
                    ...makeTableSx(theme, { centerHeader: true, centerBody: true }),
                    "& th:nth-of-type(1)": { minWidth: 240, textAlign: "center" },
                    "& td:nth-of-type(1)": { minWidth: 240, textAlign: "left", whiteSpace: "normal" },
                    "& th:nth-of-type(8), & td:nth-of-type(8)": { width: 140 },
                  }}
                >
                  <thead>
                    <tr>
                      <th>Developer</th>
                      <th>Projects</th>
                      <th>Total Tasks</th>
                      <th>Open</th>
                      <th>Resolved</th>
                      <th>Late</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(devRows || []).map((r) => (
                      <tr key={r.developer_id}>
                        <td>
                          <Typography sx={{ fontSize: 12, fontWeight: 950, lineHeight: 1.2 }}>
                            {r.developer_name || "-"}
                          </Typography>
                        </td>
                        <td>{r.projects_count ?? 0}</td>
                        <td>{r.total_tasks ?? 0}</td>
                        <td>{r.open_touch_count ?? 0}</td>
                        <td>{r.resolved_touch_count ?? 0}</td>
                        <td>
                          <Chip
                            size="small"
                            label={r.late_touch_count ?? 0}
                            sx={{
                              height: 22,
                              fontSize: 11,
                              fontWeight: 950,
                              borderRadius: 999,
                              bgcolor:
                                (r.late_touch_count ?? 0) > 0
                                  ? alpha(theme.palette.error.main, 0.12)
                                  : "rgba(15,23,42,0.04)",
                              color:
                                (r.late_touch_count ?? 0) > 0 ? theme.palette.error.main : "text.primary",
                            }}
                          />
                        </td>
                        <td>
                          <Tooltip title="View developer detail">
                            <span>
                              <Button
                                size="small"
                                variant="contained"
                                sx={{ ...btnContainedSx, minHeight: 32, px: 1.25 }}
                                disabled={devLoading}
                                onClick={() => openDeveloperDetail(r.developer_id, r.developer_name)}
                              >
                                Detail
                              </Button>
                            </span>
                          </Tooltip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Box>
              </Box>
            )}
          </Box>
        </Panel>
      </Stack>

      {/* Preview modal */}
      <ExportPreviewProjectsModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        loadingPreview={previewLoading}
        exporting={exporting}
        error={previewError}
        year={expYear}
        status={expStatus}
        q={expQ}
        rows={previewRows}
        onExport={handleExport}
      />

      {/* Developer detail modal */}
      <DeveloperDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        loading={detailLoading}
        error={detailError}
        devName={detailDevName}
        data={detailData}
      />

      <Box sx={{ height: 12 }} />
    </Box>
  );
}
