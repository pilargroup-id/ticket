// src/pages/ticket/Dashboard.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Stack, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

import StatisticCard from "../../components/card/StatisticCard";
import PageTransition from "../../components/animation/Transition";
import DataTableResponsive from "../../components/table/DatatableResponsive";
import StatisticCardSkeleton from "../../components/skeleton/SkeletonStatsCardUser";
import FormModal from "../../components/form/FormModal";
import Swal from "sweetalert2";

import FeedbackOutlinedIcon from "@mui/icons-material/FeedbackOutlined";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

import TicketService from "../../services/TicketService";
import FeedbacksService from "../../services/FeedbacksService";
import CategoryService from "../../services/CategoriesService";

// =========================
// STATUS
// =========================
const STATUS_LIST = ["resolved", "waiting", "in_progress", "feedback", "void"];
const DEFAULT_STATUS = "resolved";

const normalizeStatus = (s) => {
  const key = String(s ?? "").toLowerCase().trim();
  return STATUS_LIST.includes(key) ? key : DEFAULT_STATUS;
};

// =========================
// SIMPLE UNWRAP
// =========================
const asArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

// =========================
// DATE HELPERS
// =========================
const safeDate = (v) => String(v ?? "").trim();
const rangeKey = (start, end) => `${safeDate(start)}|${safeDate(end)}`;
const ticketsKey = (status, start, end) =>
  `${normalizeStatus(status)}|${safeDate(start)}|${safeDate(end)}`;

const isValidRange = (start, end) => {
  if (!start && !end) return true;
  if (start && end) return start <= end;
  return true;
};

function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const toYMD = (d) => {
  if (!d) return "";
  const x = dayjs(d);
  return x.isValid() ? x.format("YYYY-MM-DD") : "";
};

const toDayjs = (s) => {
  if (!s) return null;
  const x = dayjs(s, "YYYY-MM-DD", true);
  return x.isValid() ? x : null;
};

// =========================
// GLOBAL CACHE (range-aware)
// =========================
const DASH_CACHE = {
  statsByRange: new Map(), // key `${start}|${end}` -> stats
  ticketsByKey: new Map(), // key `${status}|${start}|${end}` -> tickets[]
  lastActiveStatus: DEFAULT_STATUS,

  categories: null,
  categoriesLoaded: false,
  categoriesLoading: false,
};

// ✅ invalidate semua tickets cache untuk range (start,end) biar pindah status ga ambil data lama
const invalidateTicketsRange = (start, end) => {
  const s = safeDate(start);
  const e = safeDate(end);
  const suffix = `|${s}|${e}`;

  for (const key of Array.from(DASH_CACHE.ticketsByKey.keys())) {
    if (String(key).endsWith(suffix)) {
      DASH_CACHE.ticketsByKey.delete(key);
    }
  }
};

// =========================
// SMALL CONCURRENCY LIMITER
// =========================
async function runWithConcurrency(tasks, limit = 2) {
  const results = [];
  let idx = 0;

  async function worker() {
    while (idx < tasks.length) {
      const cur = idx++;
      try {
        results[cur] = await tasks[cur]();
      } catch (e) {
        console.error(`Task error at index ${cur}:`, e);
        results[cur] = null;
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () =>
    worker(),
  );
  await Promise.all(workers);
  return results;
}

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [loadingTable, setLoadingTable] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [activeStatus, setActiveStatus] = useState(
    normalizeStatus(DASH_CACHE.lastActiveStatus),
  );

  // ✅ DATE FILTER (request_date)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const debStart = useDebouncedValue(startDate, 350);
  const debEnd = useDebouncedValue(endDate, 350);

  const [openModal, setOpenModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openFeedbackModal, setOpenFeedbackModal] = useState(false);

  const [editTicketId, setEditTicketId] = useState(null);
  const [feedbackTicketId, setFeedbackTicketId] = useState(null);
  const [editImageUrl, setEditImageUrl] = useState("");

  const [form, setForm] = useState({
    category_id: "",
    problem: "",
    nama_pembuat: "",
    image: null,
  });

  const [feedbackForm, setFeedbackForm] = useState({
    rating: "",
    comment: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  // guard: response request lama ga nimpa state terbaru
  const ticketsReqSeq = useRef(0);
  const statsReqSeq = useRef(0);

  const refreshingRef = useRef(false);

  // ✅ first load only: skeleton stats
  const firstLoadRef = useRef(true);

  const resetModalState = useCallback(() => {
    setErrors({});
    setSubmitError("");
  }, []);

  const columns = useMemo(
    () => [
      { title: "Ticket ID", data: "ticket_code" },
      { title: "Nama Pembuat", data: "nama_pembuat" },
      { title: "Category", data: "category_name" },
      { title: "Masalah", data: "problem" },
      { title: "Status", data: "status" },
      { title: "Support", data: "support_name" },
      { title: "Solution", data: "solution" },
      { title: "Actions", data: "actions" },
    ],
    [],
  );

  const statusKey = useCallback(
    (row) => String(row?.status ?? "").toLowerCase().trim(),
    [],
  );

  const getTicketImageUrl = useCallback((row) => {
    if (!row) return "";
    if (row?.image_url) return row.image_url;

    const path = row?.image || "";
    if (!path) return "";
    const base = import.meta?.env?.VITE_APP_URL || "";
    if (!base) return "";
    return `${base}/storage/${path}`;
  }, []);

  const rangeError = useMemo(() => {
    const s = safeDate(startDate);
    const e = safeDate(endDate);
    if (s && e && s > e) return "Start date harus <= End date";
    return "";
  }, [startDate, endDate]);

  // =========================
  // FETCH STATS (range-aware cached)
  // silent=true -> NO skeleton (no loadingStats)
  // =========================
  const fetchStats = useCallback(
    async (start, end, { force = false, silent = false } = {}) => {
      const rk = rangeKey(start, end);

      if (!force && DASH_CACHE.statsByRange.has(rk)) {
        const cached = DASH_CACHE.statsByRange.get(rk);
        setStats(cached);
        return cached;
      }

      if (!silent) setLoadingStats(true);
      const mySeq = ++statsReqSeq.current;

      try {
        const res = await TicketService.statsMyTicket({
          start_date: safeDate(start),
          end_date: safeDate(end),
        });

        const data = res;
        if (mySeq !== statsReqSeq.current) return null;

        DASH_CACHE.statsByRange.set(rk, data);
        setStats(data);
        return data;
      } catch (e) {
        console.error("Fetch stats error:", e);
        if (mySeq !== statsReqSeq.current) return null;
        setStats(null);
        return null;
      } finally {
        if (!silent && mySeq === statsReqSeq.current) setLoadingStats(false);
      }
    },
    [],
  );

  // =========================
  // FETCH TICKETS (range-aware cached)
  // silent=true -> NO loadingTable
  // =========================
  const fetchTickets = useCallback(
    async (status, start, end, { silent = false } = {}) => {
      const safeStatus = normalizeStatus(status);
      const mySeq = ++ticketsReqSeq.current;

      if (!silent) setLoadingTable(true);

      try {
        const res = await TicketService.myTicketByFilter({
          status: safeStatus,
          start_date: safeDate(start),
          end_date: safeDate(end),
        });

        const data = asArray(res); // ✅ FIX (biar ga nyangkut [])
        if (mySeq !== ticketsReqSeq.current) return null;

        DASH_CACHE.ticketsByKey.set(ticketsKey(safeStatus, start, end), data);
        return data;
      } catch (e) {
        console.error("Fetch tickets error:", e);
        if (mySeq !== ticketsReqSeq.current) return null;

        DASH_CACHE.ticketsByKey.set(ticketsKey(safeStatus, start, end), []);
        return [];
      } finally {
        if (!silent && mySeq === ticketsReqSeq.current) setLoadingTable(false);
      }
    },
    [],
  );

  const setTicketsFromCache = useCallback((status, start, end) => {
    const key = ticketsKey(status, start, end);
    const cached = DASH_CACHE.ticketsByKey.get(key);
    if (Array.isArray(cached)) {
      setTickets(cached);
      return true;
    }
    return false;
  }, []);

  // =========================
  // PREFETCH status lain (range-aware)
  // =========================
  const prefetchAllStatuses = useCallback(async (startStatus, start, end) => {
    const base = normalizeStatus(startStatus);
    const s = safeDate(start);
    const e = safeDate(end);

    const tasks = STATUS_LIST.filter((st) => st !== base).map(
      (st) => async () => {
        const key = ticketsKey(st, s, e);
        if (DASH_CACHE.ticketsByKey.has(key)) return null;

        try {
          const res = await TicketService.myTicketByFilter({
            status: st,
            start_date: s,
            end_date: e,
          });
          DASH_CACHE.ticketsByKey.set(key, asArray(res));
        } catch (err) {
          console.error(`Prefetch error (${st}):`, err);
          DASH_CACHE.ticketsByKey.set(key, []);
        }
        return null;
      },
    );

    await runWithConcurrency(tasks, 2);
  }, []);

  // =========================
  // MAIN FETCH
  // =========================
  useEffect(() => {
    const s = safeDate(debStart);
    const e = safeDate(debEnd);
    if (!isValidRange(s, e)) return;

    const current = normalizeStatus(activeStatus);
    DASH_CACHE.lastActiveStatus = current;

    const silentStats = !firstLoadRef.current;

    (async () => {
      const hasCache = setTicketsFromCache(current, s, e);

      const ticketsPromise = hasCache
        ? Promise.resolve(
            DASH_CACHE.ticketsByKey.get(ticketsKey(current, s, e)) || [],
          )
        : fetchTickets(current, s, e, { silent: false }).then((x) => x || []);

      const statsPromise = fetchStats(s, e, { force: false, silent: silentStats });

      const [tRes] = await Promise.all([ticketsPromise, statsPromise]);
      setTickets(tRes || []);

      prefetchAllStatuses(current, s, e);

      firstLoadRef.current = false;
    })();
  }, [
    activeStatus,
    debStart,
    debEnd,
    fetchStats,
    fetchTickets,
    prefetchAllStatuses,
    setTicketsFromCache,
  ]);

  // =========================
  // FILTER CLICK: cache first
  // =========================
  const applyStatusFilter = useCallback(
    async (status) => {
      const safeStatus = normalizeStatus(status);
      const s = safeDate(startDate);
      const e = safeDate(endDate);
      if (!isValidRange(s, e)) return;

      DASH_CACHE.lastActiveStatus = safeStatus;
      setActiveStatus(safeStatus);

      if (setTicketsFromCache(safeStatus, s, e)) return;

      const data = await fetchTickets(safeStatus, s, e, { silent: false });
      if (normalizeStatus(DASH_CACHE.lastActiveStatus) === safeStatus) {
        setTickets(data || []);
      }
    },
    [endDate, fetchTickets, setTicketsFromCache, startDate],
  );

  // =========================
  // STAT CARDS
  // =========================
  const statCards = useMemo(() => {
    const base = {
      resolved: 0,
      waiting: 0,
      in_progress: 0,
      feedback: 0,
      void: 0,
    };
    const raw = stats?.status;

    const normalized =
      raw && typeof raw === "object"
        ? Object.entries(raw).reduce((acc, [k, v]) => {
            acc[String(k).toLowerCase()] = Number(v) || 0;
            return acc;
          }, {})
        : {};

    const merged = { ...base, ...normalized };

    const toTitle = (key) =>
      String(key)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

    return STATUS_LIST.map((k) => ({
      key: k,
      status: k,
      title: toTitle(k),
      value: Number(merged[k]) || 0,
    }));
  }, [stats]);

  // =========================
  // REFRESH:
  // showLoading=true  => skeleton stats + table loading
  // showLoading=false => silent (no loading)
  // =========================
  const handleRefresh = useCallback(
    async ({ showLoading = true } = {}) => {
      if (refreshingRef.current) return;
      refreshingRef.current = true;

      const current = normalizeStatus(activeStatus);
      const s = safeDate(startDate);
      const e = safeDate(endDate);
      if (!isValidRange(s, e)) {
        refreshingRef.current = false;
        return;
      }

      try {
        // ✅ invalidate cache range ini biar fresh untuk SEMUA status
        DASH_CACHE.statsByRange.delete(rangeKey(s, e));
        invalidateTicketsRange(s, e);

        // ✅ guard cache resolved global (tanpa range) juga biar aman
        DASH_CACHE.ticketsByKey.delete(ticketsKey("resolved", "", ""));

        const [st, data] = await Promise.all([
          fetchStats(s, e, { force: true, silent: !showLoading }),
          fetchTickets(current, s, e, { silent: !showLoading }),
        ]);

        if (st !== null) setStats(st);
        if (Array.isArray(data)) setTickets(data);

        // prefetch ulang biar status lain juga fresh
        prefetchAllStatuses(current, s, e);

        if (showLoading) firstLoadRef.current = false;
      } finally {
        refreshingRef.current = false;
      }
    },
    [activeStatus, endDate, fetchStats, fetchTickets, prefetchAllStatuses, startDate],
  );

  // =========================
  // RESET
  // =========================
  const handleReset = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;

    const current = normalizeStatus(activeStatus);

    try {
      setStartDate("");
      setEndDate("");

      // ✅ bersihin cache range kosong untuk semua status
      DASH_CACHE.statsByRange.delete(rangeKey("", ""));
      invalidateTicketsRange("", "");
      DASH_CACHE.ticketsByKey.delete(ticketsKey("resolved", "", ""));

      setLoadingTable(true);
      setLoadingStats(true);

      const [st, data] = await Promise.all([
        fetchStats("", "", { force: true, silent: false }),
        fetchTickets(current, "", "", { silent: true }),
      ]);

      setStats(st);
      setTickets(data || []);

      prefetchAllStatuses(current, "", "");
      firstLoadRef.current = false;
    } catch (e) {
      console.error("Reset error:", e);
    } finally {
      setLoadingTable(false);
      setLoadingStats(false);
      refreshingRef.current = false;
    }
  }, [activeStatus, fetchStats, fetchTickets, prefetchAllStatuses]);

  // =========================
  // GUARD: backend ngecek resolved global (tanpa range)
  // =========================
  const hasUnfeedbackResolvedTicket = useMemo(() => {
    const key = ticketsKey("resolved", "", "");
    const cached = DASH_CACHE.ticketsByKey.get(key);
    if (Array.isArray(cached)) return cached.length > 0;
    return false;
  }, [tickets]);

  // =========================
  // ACTIONS UI
  // =========================
  const actionBtnSx = useMemo(
    () => ({
      textTransform: "none",
      borderRadius: "10px",
      fontWeight: 850,
      boxShadow: "none",
      minHeight: 34,
      lineHeight: 1.1,
    }),
    [],
  );

  // =========================
  // LAZY CATEGORIES (modal open)
  // =========================
  const ensureCategoriesLoaded = useCallback(async () => {
    if (DASH_CACHE.categoriesLoaded && Array.isArray(DASH_CACHE.categories)) {
      setCategories(DASH_CACHE.categories);
      return DASH_CACHE.categories;
    }
    if (DASH_CACHE.categoriesLoading) {
      setCategoriesLoading(true);
      return [];
    }

    DASH_CACHE.categoriesLoading = true;
    setCategoriesLoading(true);

    try {
      const res = await CategoryService.show().catch(() => []);
      const data = asArray(res);
      DASH_CACHE.categories = data;
      DASH_CACHE.categoriesLoaded = true;
      setCategories(data);
      return data;
    } catch (e) {
      console.error("Fetch categories error:", e);
      DASH_CACHE.categories = [];
      DASH_CACHE.categoriesLoaded = true;
      setCategories([]);
      return [];
    } finally {
      DASH_CACHE.categoriesLoading = false;
      setCategoriesLoading(false);
    }
  }, []);

  const openEditTicketModal = useCallback(
    async (row) => {
      resetModalState();
      await ensureCategoriesLoaded();

      setEditTicketId(row?.id ?? null);
      setEditImageUrl(getTicketImageUrl(row));

      setForm({
        category_id: row?.category_id != null ? String(row.category_id) : "",
        problem: row?.problem ?? "",
        nama_pembuat: row?.nama_pembuat ?? "",
        image: null,
      });

      setOpenEditModal(true);
    },
    [ensureCategoriesLoaded, getTicketImageUrl, resetModalState],
  );

  const openFeedbackTicketModal = useCallback(
    (row) => {
      resetModalState();
      setFeedbackTicketId(row?.id ?? null);
      setFeedbackForm({ rating: "", comment: "" });
      setOpenFeedbackModal(true);
    },
    [resetModalState],
  );

  const renderActions = useCallback(
    (row) => {
      const s = statusKey(row);

      if (s === "waiting") {
        return (
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditRoundedIcon />}
            onClick={() => openEditTicketModal(row)}
            sx={{
              ...actionBtnSx,
              borderColor: "rgba(13, 60, 148, 0.35)",
              color: "var(--blue-900)",
              backgroundColor: "rgba(255,255,255,0.92)",
              "&:hover": {
                borderColor: "rgba(13, 60, 148, 0.55)",
                backgroundColor: "rgba(13, 60, 148, 0.06)",
                boxShadow: "none",
              },
            }}
          >
            Edit
          </Button>
        );
      }

      if (s === "resolved") {
        return (
          <Button
            variant="contained"
            size="small"
            startIcon={<FeedbackOutlinedIcon />}
            onClick={() => openFeedbackTicketModal(row)}
            color="error"
            sx={{
              ...actionBtnSx,
              boxShadow: "none",
              "&:hover": { boxShadow: "none", backgroundColor: "error.dark" },
            }}
          >
            Feedback
          </Button>
        );
      }

      return <span style={{ opacity: 0.6 }}>-</span>;
    },
    [actionBtnSx, openEditTicketModal, openFeedbackTicketModal, statusKey],
  );

  // =========================
  // ADD (guard: cek resolved global tanpa range)
  // =========================
  const openTicketModal = useCallback(async () => {
    const key = ticketsKey("resolved", "", "");
    let resolvedTickets = DASH_CACHE.ticketsByKey.get(key);

    if (!Array.isArray(resolvedTickets)) {
      resolvedTickets = await fetchTickets("resolved", "", "", {
        silent: true,
      });
    }

    const needFeedback =
      Array.isArray(resolvedTickets) && resolvedTickets.length > 0;

    if (needFeedback) {
      Swal.fire({
        icon: "info",
        title: "Feedback Diperlukan",
        html: `
          <div style="line-height:1.6">
            <p style="margin-bottom:8px">
              Kamu memiliki <b>ticket yang belum diberikan feedback</b>.
            </p>
            <p style="color:#6b7280;font-size:14px">
              Berikan feedback terlebih dahulu sebelum membuat ticket baru.
            </p>
          </div>
        `,
        confirmButtonText: "Tutup",
        confirmButtonColor: "#2563eb",
        focusConfirm: false,
      });
      return;
    }

    resetModalState();
    await ensureCategoriesLoaded();

    setForm({ category_id: "", problem: "", image: null, nama_pembuat: "" });
    setOpenModal(true);
  }, [ensureCategoriesLoaded, fetchTickets, resetModalState]);

  const closeTicketModal = useCallback(() => {
    if (submitting) return;
    setOpenModal(false);
  }, [submitting]);

  const handleSubmitTicket = useCallback(async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      resetModalState();

      await TicketService.storeByUser(form);

      setOpenModal(false);

      // ✅ refetch tanpa skeleton/loading (udah aman karena handleRefresh invalidate semua status range)
      await handleRefresh({ showLoading: false });
    } catch (error) {
      const status = error?.response?.status;
      const data = error?.response?.data;

      if (status === 422) {
        setErrors(data?.errors || {});
        setSubmitError(data?.message || "Validasi gagal.");
        return;
      }
      setSubmitError(data?.message || error?.message || "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  }, [form, handleRefresh, resetModalState, submitting]);

  const closeEditTicketModal = useCallback(() => {
    if (submitting) return;
    setOpenEditModal(false);
    setEditTicketId(null);
    setEditImageUrl("");
    setForm((prev) => ({ ...prev, image: null }));
  }, [submitting]);

  const handleEditSubmit = useCallback(async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      resetModalState();

      await TicketService.updateByUser(editTicketId, form);

      setOpenEditModal(false);
      setEditTicketId(null);
      setEditImageUrl("");
      setForm((prev) => ({ ...prev, image: null }));

      // ✅ refetch tanpa skeleton/loading
      await handleRefresh({ showLoading: false });
    } catch (error) {
      const status = error?.response?.status;
      const data = error?.response?.data;

      if (status === 422) {
        setErrors(data?.errors || {});
        setSubmitError(data?.message || "Validasi gagal.");
        return;
      }
      setSubmitError(data?.message || error?.message || "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  }, [editTicketId, form, handleRefresh, resetModalState, submitting]);

  const closeFeedbackModal = useCallback(() => {
    if (submitting) return;
    setOpenFeedbackModal(false);
    setFeedbackTicketId(null);
  }, [submitting]);

  const handleFeedbackSubmit = useCallback(async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      resetModalState();

      await FeedbacksService.store(feedbackTicketId, feedbackForm);

      setOpenFeedbackModal(false);
      setFeedbackTicketId(null);

      // ✅ invalidate resolved global guard cache (biar tombol Add ga ke-lock terus)
      DASH_CACHE.ticketsByKey.delete(ticketsKey("resolved", "", ""));

      // ✅ refetch tanpa skeleton/loading
      await handleRefresh({ showLoading: false });
    } catch (error) {
      const status = error?.response?.status;
      const data = error?.response?.data;

      if (status === 422) {
        setErrors(data?.errors || {});
        setSubmitError(data?.message || "Validasi gagal.");
        return;
      }
      setSubmitError(data?.message || error?.message || "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  }, [feedbackForm, feedbackTicketId, handleRefresh, resetModalState, submitting]);

  const ticketFields = useMemo(() => ticketFieldsFrom(categories), [categories]);

  // =========================
  // UI
  // =========================
  return (
    <PageTransition>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        {/* HEADER + DATE FILTER */}
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            gap: 1,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <Box sx={{ minWidth: 240, flex: "1 1 280px" }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 950,
                letterSpacing: -0.3,
                color: "rgba(17,24,39,0.92)",
                lineHeight: 1.15,
                fontSize: { xs: 22, sm: 28 },
              }}
            >
              My Tickets
            </Typography>

            <Typography
              sx={{
                mt: 0.35,
                fontSize: 13,
                fontWeight: 650,
                color: "rgba(17,24,39,0.60)",
                lineHeight: 1.35,
              }}
            >
              Filter by request date. Status filter klik card (instant).
            </Typography>

            {!!rangeError && (
              <Typography
                sx={{
                  mt: 0.6,
                  fontSize: 12,
                  fontWeight: 800,
                  color: "error.main",
                }}
              >
                {rangeError}
              </Typography>
            )}
          </Box>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "center",
              width: isMobile ? "100%" : "auto",
              flex: isMobile ? "1 1 100%" : "0 0 auto",
              minWidth: isMobile ? "100%" : 560,
              flexWrap: "nowrap",
            }}
          >
            {/* START */}
            <DatePicker
              label="Start"
              value={toDayjs(startDate)}
              onChange={(v) => setStartDate(toYMD(v))}
              format="YYYY-MM-DD"
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  error: !!rangeError,
                  inputProps: { inputMode: "numeric" },
                  sx: {
                    "& .MuiOutlinedInput-root": { borderRadius: 3 },
                    minWidth: isMobile ? 0 : 220,
                  },
                },
              }}
              sx={{ flex: 1 }}
            />

            {/* END */}
            <DatePicker
              label="End"
              value={toDayjs(endDate)}
              onChange={(v) => setEndDate(toYMD(v))}
              format="YYYY-MM-DD"
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  error: !!rangeError,
                  inputProps: { inputMode: "numeric" },
                  sx: {
                    "& .MuiOutlinedInput-root": { borderRadius: 3 },
                    minWidth: isMobile ? 0 : 220,
                  },
                },
              }}
              sx={{ flex: 1 }}
            />

            {/* REFRESH */}
            <Button
              variant="outlined"
              onClick={() => handleRefresh({ showLoading: true })}
              disabled={!!rangeError}
              sx={{
                borderRadius: 2,
                fontWeight: 900,
                textTransform: "none",
                height: 40,
                minWidth: isMobile ? 44 : 120,
                px: isMobile ? 0 : 2,
                flex: "0 0 auto",
              }}
            >
              {isMobile ? "↻" : "Refresh"}
            </Button>

            {/* RESET */}
            <Button
              variant="outlined"
              onClick={handleReset}
              disabled={!!rangeError}
              sx={{
                borderRadius: 2,
                fontWeight: 900,
                textTransform: "none",
                height: 40,
                minWidth: isMobile ? 44 : 120,
                px: isMobile ? 0 : 2,
                flex: "0 0 auto",
              }}
            >
              {isMobile ? "All" : "Show All"}
            </Button>
          </Stack>
        </Box>

        {/* STAT CARDS */}
        <Box
          sx={{
            mb: 2,
            width: "100%",
            display: { xs: "flex", md: "grid" },
            overflowX: { xs: "auto", md: "visible" },
            gap: 1.25,
            gridTemplateColumns: { md: "repeat(5, minmax(0, 1fr))" },
            px: { xs: 0.5, md: 0 },
            pb: { xs: 0.5, md: 0 },
            "&::-webkit-scrollbar": { display: "none" },
            scrollbarWidth: "none",
          }}
        >
          {loadingStats
            ? Array.from({ length: 5 }).map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    flex: { xs: "0 0 auto", md: "unset" },
                    minWidth: { xs: 140, sm: 160, md: 0 },
                  }}
                >
                  <StatisticCardSkeleton />
                </Box>
              ))
            : statCards.map((item) => (
                <Box
                  key={item.key}
                  sx={{
                    flex: { xs: "0 0 auto", md: "unset" },
                    minWidth: { xs: 140, sm: 160, md: 0 },
                  }}
                >
                  <StatisticCard
                    title={item.title}
                    value={item.value}
                    status={item.status}
                    onClick={() => applyStatusFilter(item.key)}
                    active={activeStatus === item.key}
                  />
                </Box>
              ))}
        </Box>

        {/* TABLE */}
        <Box
          sx={{
            mt: 2,
            p: { xs: 1.25, sm: 2 },
            borderRadius: 3,
            border: "1px solid #e5e7eb",
            backgroundColor: "#fff",
          }}
        >
          <DataTableResponsive
            columns={columns}
            data={tickets}
            add={openTicketModal}
            loading={loadingTable}
            renderActions={renderActions}
            renderActionsMobile={renderActions}
            disableAdd={hasUnfeedbackResolvedTicket}
            addLabel="Buat Ticket"
          />
        </Box>

        {/* MODALS */}
        <FormModal
          open={openModal}
          onClose={closeTicketModal}
          fields={ticketFields}
          form={form}
          setForm={setForm}
          onSubmit={handleSubmitTicket}
          submitting={submitting || categoriesLoading}
          title="Tambah Ticket"
          errors={errors}
          submitError={submitError}
        />

        <FormModal
          open={openEditModal}
          onClose={closeEditTicketModal}
          fields={ticketFields}
          form={form}
          setForm={setForm}
          onSubmit={handleEditSubmit}
          submitting={submitting || categoriesLoading}
          title="Edit Ticket"
          errors={errors}
          submitError={submitError}
          filePreview={{ image: editImageUrl }}
        />

        <FormModal
          open={openFeedbackModal}
          onClose={closeFeedbackModal}
          fields={feedbackFields}
          form={feedbackForm}
          setForm={setFeedbackForm}
          onSubmit={handleFeedbackSubmit}
          submitting={submitting}
          title="Feedback Ticket"
          errors={errors}
          submitError={submitError}
        />
      </LocalizationProvider>
    </PageTransition>
  );
}

function ticketFieldsFrom(categories) {
  return [
    {
      type: "select",
      name: "category_id",
      placeholder: "Pilih Kategori",
      options: (categories || []).map((c) => ({
        label: c.name,
        value: String(c.id),
      })),
    },
    { type: "input", name: "nama_pembuat", placeholder: "Nama Pembuat" },
    { type: "input", name: "problem", placeholder: "Masalah" },
    { type: "file", name: "image", placeholder: "Lampiran (opsional)" },
  ];
}

const feedbackFields = [
  {
    type: "select",
    name: "rating",
    placeholder: "Rating",
    options: [
      { label: "1", value: "1" },
      { label: "2", value: "2" },
      { label: "3", value: "3" },
      { label: "4", value: "4" },
      { label: "5", value: "5" },
    ],
  },
  { type: "input", name: "comment", placeholder: "Komentar" },
];
