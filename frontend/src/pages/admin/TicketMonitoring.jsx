// src/pages/ticket/TicketMonitoring.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Box, Button, Stack, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

import StatisticCard from "../../components/card/StatisticCard";
import StatisticCardSkeleton from "../../components/skeleton/SkeletonStatsCardUser";
import PageTransition from "../../components/animation/Transition";
import DataTableResponsive from "../../components/table/DatatableResponsive";

import TicketService from "../../services/TicketService";
import TicketActionModal from "../../components/form/TicketActionModal";

import UsersService from "../../services/UsersService";
import CategoriesService from "../../services/CategoriesService";

// =========================
// STATUS UTILS
// =========================
const STATUS_LIST = ["waiting", "in_progress", "resolved", "feedback", "void"];
const DEFAULT_STATUS = "waiting";

const normalizeStatus = (s) => {
  const key = String(s ?? "").toLowerCase().trim();
  return STATUS_LIST.includes(key) ? key : DEFAULT_STATUS;
};

// =========================
// RESPONSE UNWRAP HELPERS
// =========================
const unwrapArray = (res) => {
  if (Array.isArray(res)) return res;

  const d1 = res?.data?.data;
  if (Array.isArray(d1)) return d1;

  const d2 = res?.data;
  if (Array.isArray(d2)) return d2;

  const d3 = res?.data?.assets;
  if (Array.isArray(d3)) return d3;

  const d4 = res?.assets;
  if (Array.isArray(d4)) return d4;

  return [];
};

const unwrapObject = (res) => {
  if (res == null) return null;
  if (Array.isArray(res)) return null;
  if (res?.data != null) return res.data?.data ?? res.data ?? null;
  if (typeof res === "object") return res;
  return null;
};

// =========================
// helpers
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
// CACHE (TTL + SWR)
// =========================
const CACHE_TTL_MS = 15_000;
const now = () => Date.now();
const cacheGet = (map, key) => map.get(key) || null;
const cacheSet = (map, key, value) => map.set(key, { value, ts: now() });
const cacheIsFresh = (entry) => entry && now() - entry.ts <= CACHE_TTL_MS;
const cacheValue = (entry, fallback) => (entry ? entry.value : fallback);

// ASSETS
const ASSET_ALL_KEY = "__all__";
const ASSET_DEFAULT_QUERY = "a";

// =====================================================
// ✅ GLOBAL CACHE (tahan pindah halaman)
// =====================================================
const TM_CACHE = {
  ticketsByKey: new Map(), // key -> {value, ts}
  statsByRange: new Map(), // key -> {value, ts}
  lastActiveStatus: DEFAULT_STATUS,

  master: {
    supports: null,
    users: null,
    categories: null,
    loaded: false,
    loading: false,
  },

  assetsByQuery: new Map(), // key -> {value, ts}
  assetsInflight: null,
};

export default function TicketMonitoring() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // =========================
  // UI STATE
  // =========================
  const [tickets, setTickets] = useState([]);
  const [activeStatus, setActiveStatus] = useState(
    normalizeStatus(TM_CACHE.lastActiveStatus),
  );

  const [loadingTable, setLoadingTable] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  // master data (lazy)
  const [supports, setSupports] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [masterLoading, setMasterLoading] = useState(false);

  // assets
  const [assets, setAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(false);

  // modal
  const [openActionModal, setOpenActionModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [actionType, setActionType] = useState(null);

  const [submittingAction, setSubmittingAction] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ✅ DATE FILTER (request_date)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const debouncedStart = useDebouncedValue(startDate, 350);
  const debouncedEnd = useDebouncedValue(endDate, 350);

  // stats
  const [stats, setStats] = useState(null);

  // =========================
  // REFS: anti race
  // =========================
  const ticketsReqSeq = useRef(0);
  const statsReqSeq = useRef(0);
  const masterReqSeq = useRef(0);
  const refreshingRef = useRef(false);

  // ✅ skeleton policy: only first load + manual refresh
  const firstLoadRef = useRef(true);

  // =========================
  // TABLE COLUMNS
  // =========================
  const columns = useMemo(
    () => [
            { title: "Ticket ID", data: "ticket_code" },
      { title: "Request Date", data: "request_date" },
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

  const statusKey = useCallback((row) => normalizeStatus(row?.status), []);

  // =========================
  // ✅ FETCH: TICKETS (SWR)
  // silent=true => no loadingTable
  // =========================
  const fetchTickets = useCallback(
    async (status, start, end, { force = false, silent = false } = {}) => {
      const safeStatus = normalizeStatus(status);
      const key = ticketsKey(safeStatus, start, end);
      const cached = cacheGet(TM_CACHE.ticketsByKey, key);
      if (!force && cached) {
        const val = cacheValue(cached, []);
        setTickets(val);
        if (cacheIsFresh(cached)) return val;
        // stale -> lanjut fetch
      }

      const mySeq = ++ticketsReqSeq.current;
      if (!silent) setLoadingTable(true);

      try {
        const res = await TicketService.ticketsByStatus({
          status: safeStatus,
          start_date: safeDate(start),
          end_date: safeDate(end),
        });
       
        const data = unwrapArray(res);
        if (mySeq !== ticketsReqSeq.current) return null;
console.log("Fetch tickets response:", data); 
        cacheSet(TM_CACHE.ticketsByKey, key, data);
        setTickets(data);
        return data;
      } catch (e) {
        console.error("Fetch tickets error:", e);
        if (mySeq !== ticketsReqSeq.current) return null;

        cacheSet(TM_CACHE.ticketsByKey, key, []);
        setTickets([]);
        return [];
      } finally {
        if (!silent && mySeq === ticketsReqSeq.current) setLoadingTable(false);
      }
       
    },
    [],
  );

  // =========================
  // ✅ FETCH: STATS (SWR)
  // silent=true => no loadingStats (no skeleton)
  // =========================
  const fetchStats = useCallback(
    async (start, end, { force = false, silent = false } = {}) => {
      const rk = rangeKey(start, end);
      const cached = cacheGet(TM_CACHE.statsByRange, rk);

      if (!force && cached) {
        setStats(cacheValue(cached, null));
        if (cacheIsFresh(cached)) return cacheValue(cached, null);
        // stale -> lanjut fetch
      }

      const s = safeDate(start);
      const e = safeDate(end);

      const mySeq = ++statsReqSeq.current;
      if (!silent) setLoadingStats(true);

      try {
        // no range => backend statsAllTicket
        if (!s && !e) {
          const apiStats = await TicketService.statsAllTicket();
          const shaped = unwrapObject(apiStats) ?? apiStats ?? { status: {} };

          if (mySeq !== statsReqSeq.current) return null;

          cacheSet(TM_CACHE.statsByRange, rk, shaped);
          setStats(shaped);
          return shaped;
        }

        // range mode => quick count from cache
        const counts = {};
        STATUS_LIST.forEach((st) => {
          const k = ticketsKey(st, s, e);
          const entry = cacheGet(TM_CACHE.ticketsByKey, k);
          const arr = entry ? cacheValue(entry, []) : null;
          counts[st] = Array.isArray(arr) ? arr.length : 0;
        });

        const shaped = { status: counts };

        if (mySeq !== statsReqSeq.current) return null;

        cacheSet(TM_CACHE.statsByRange, rk, shaped);
        setStats(shaped);
        return shaped;
      } catch (err) {
        console.error("Fetch stats error:", err);
        const fallback = { status: {} };
        cacheSet(TM_CACHE.statsByRange, rk, fallback);
        setStats(fallback);
        return fallback;
      } finally {
        if (!silent && mySeq === statsReqSeq.current) setLoadingStats(false);
      }
    },
    [],
  );

  // =========================
  // ✅ PREFETCH OTHER STATUSES (background, TTL-aware)
  // =========================
  const prefetchOtherStatuses = useCallback(async (baseStatus, start, end) => {
    const s = safeDate(start);
    const e = safeDate(end);

    const tasks = STATUS_LIST.filter((st) => st !== baseStatus).map((st) => async () => {
      const key = ticketsKey(st, s, e);
      const cached = cacheGet(TM_CACHE.ticketsByKey, key);
      if (cached && cacheIsFresh(cached)) return null;

      try {
        const res = await TicketService.ticketsByStatus({
          status: st,
          start_date: s,
          end_date: e,
        });
        cacheSet(TM_CACHE.ticketsByKey, key, unwrapArray(res));
      } catch (err) {
        console.error(`Prefetch tickets error (${st}):`, err);
        cacheSet(TM_CACHE.ticketsByKey, key, []);
      }
      return null;
    });

    let idx = 0;
    const limit = 3;

    async function worker() {
      while (idx < tasks.length) {
        const cur = idx++;
        await tasks[cur]();
      }
    }

    await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  }, []);

  // =========================
  // ✅ MASTER DATA (LAZY, dedupe)
  // =========================
  const ensureMasterLoaded = useCallback(async () => {
    if (TM_CACHE.master.loaded) {
      setSupports(TM_CACHE.master.supports || []);
      setUsers(TM_CACHE.master.users || []);
      setCategories(TM_CACHE.master.categories || []);
      return;
    }

    if (TM_CACHE.master.loading) {
      setMasterLoading(true);
      return;
    }

    TM_CACHE.master.loading = true;
    setMasterLoading(true);
    const mySeq = ++masterReqSeq.current;

    try {
      const [s, u, c] = await Promise.all([
        TicketService.getSupports().catch(() => []),
        UsersService.show().catch(() => []),
        CategoriesService.show().catch(() => []),
      ]);

      if (mySeq !== masterReqSeq.current) return;

      TM_CACHE.master.supports = unwrapArray(s);
      TM_CACHE.master.users = unwrapArray(u);
      TM_CACHE.master.categories = unwrapArray(c);
      TM_CACHE.master.loaded = true;

      setSupports(TM_CACHE.master.supports);
      setUsers(TM_CACHE.master.users);
      setCategories(TM_CACHE.master.categories);
    } finally {
      if (mySeq === masterReqSeq.current) {
        TM_CACHE.master.loading = false;
        setMasterLoading(false);
      }
    }
  }, []);

  // =========================
  // ✅ ASSETS (DEDUPED + TTL)
  // =========================
  const ensureAssetsLoaded = useCallback(async ({ force = false } = {}) => {
    const cached = cacheGet(TM_CACHE.assetsByQuery, ASSET_ALL_KEY);

    if (!force && cached) {
      setAssets(cacheValue(cached, []));
      setAssetsLoading(false);
      if (cacheIsFresh(cached)) return cacheValue(cached, []);
      // stale -> lanjut fetch
    }

    if (!force && TM_CACHE.assetsInflight) {
      setAssetsLoading(true);
      const data = await TM_CACHE.assetsInflight.catch(() => []);
      const arr = unwrapArray(data);
      setAssets(arr);
      setAssetsLoading(false);
      return arr;
    }

    setAssetsLoading(true);

    TM_CACHE.assetsInflight = (async () => {
      try {
        const res = await TicketService.getAssets("");
        let data = unwrapArray(res);

        if (!data.length) {
          const res2 = await TicketService.getAssets(ASSET_DEFAULT_QUERY);
          data = unwrapArray(res2);
        }

        cacheSet(TM_CACHE.assetsByQuery, ASSET_ALL_KEY, data);
        return data;
      } catch (e) {
        console.error("❌ ensureAssetsLoaded error:", e);
        cacheSet(TM_CACHE.assetsByQuery, ASSET_ALL_KEY, []);
        return [];
      } finally {
        TM_CACHE.assetsInflight = null;
      }
    })();

    const data = await TM_CACHE.assetsInflight;
    const arr = unwrapArray(data);
    setAssets(arr);
    setAssetsLoading(false);
    return arr;
  }, []);

  // =========================
  // ✅ SINGLE EFFECT (status + date range)
  // - FIRST LOAD => stats skeleton ON
  // - AFTER THAT => stats silent (no skeleton) on status/date changes
  // =========================
  useEffect(() => {
    const current = normalizeStatus(activeStatus);
    TM_CACHE.lastActiveStatus = current;

    const s = safeDate(debouncedStart);
    const e = safeDate(debouncedEnd);
    if (!isValidRange(s, e)) return;

    const silentStats = !firstLoadRef.current;

    fetchTickets(current, s, e, { force: false, silent: false });
    fetchStats(s, e, { force: false, silent: silentStats });

    prefetchOtherStatuses(current, s, e);

    firstLoadRef.current = false;
  }, [
    activeStatus,
    debouncedStart,
    debouncedEnd,
    fetchTickets,
    fetchStats,
    prefetchOtherStatuses,
  ]);

  // =========================
  // STAT CARDS
  // =========================
  const statCards = useMemo(() => {
    const raw = stats?.status || {};
    const normalized =
      raw && typeof raw === "object"
        ? Object.entries(raw).reduce((acc, [k, v]) => {
            const key = String(k).toLowerCase().trim();
            acc[key] = Number(v) || 0;
            return acc;
          }, {})
        : {};

    const toTitle = (key) =>
      String(key)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

    return STATUS_LIST.map((k) => ({
      key: k,
      title: toTitle(k),
      value: Number(normalized[k]) || 0,
    }));
  }, [stats]);

  const rangeError = useMemo(() => {
    const s = safeDate(startDate);
    const e = safeDate(endDate);
    if (s && e && s > e) return "Start date harus <= End date";
    return "";
  }, [endDate, startDate]);

  // =========================
  // ✅ REVALIDATE (after actions) -> silent
  // =========================
  const revalidateCurrent = useCallback(async () => {
    const current = normalizeStatus(activeStatus);
    const s = safeDate(startDate);
    const e = safeDate(endDate);
    if (!isValidRange(s, e)) return;

    await Promise.all([
      fetchTickets(current, s, e, { force: true, silent: true }),
      fetchStats(s, e, { force: true, silent: true }),
    ]);

    prefetchOtherStatuses(current, s, e);
  }, [
    activeStatus,
    startDate,
    endDate,
    fetchTickets,
    fetchStats,
    prefetchOtherStatuses,
  ]);

  // =========================
  // MANUAL REFRESH BUTTON
  // - show skeleton stats + table loading
  // =========================
  const handleRefresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;

    try {
      const current = normalizeStatus(activeStatus);
      const s = safeDate(startDate);
      const e = safeDate(endDate);
      if (!isValidRange(s, e)) return;

      setLoadingTable(true);
      setLoadingStats(true);

      await Promise.all([
        fetchTickets(current, s, e, { force: true, silent: true }),
        fetchStats(s, e, { force: true, silent: true }),
      ]);

      prefetchOtherStatuses(current, s, e);
    } finally {
      setLoadingTable(false);
      setLoadingStats(false);
      refreshingRef.current = false;
    }
  }, [activeStatus, startDate, endDate, fetchTickets, fetchStats, prefetchOtherStatuses]);

  const handleReset = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;

    try {
      setStartDate("");
      setEndDate("");

      setLoadingTable(true);
      setLoadingStats(true);

      const current = normalizeStatus(activeStatus);
      await Promise.all([
        fetchTickets(current, "", "", { force: true, silent: true }),
        fetchStats("", "", { force: true, silent: true }),
      ]);

      prefetchOtherStatuses(current, "", "");
    } finally {
      setLoadingTable(false);
      setLoadingStats(false);
      refreshingRef.current = false;
    }
  }, [activeStatus, fetchTickets, fetchStats, prefetchOtherStatuses]);

  // =========================
  // APPLY FILTER (card click)
  // =========================
  const applyStatusFilter = useCallback((status) => {
    const safeStatus = normalizeStatus(status);
    TM_CACHE.lastActiveStatus = safeStatus;
    setActiveStatus(safeStatus);
  }, []);

  // =========================
  // ACTIONS
  // =========================
  const openModalFor = useCallback(
    async (row, type) => {
      setSelectedTicket(row ?? null);
      setActionType(type);
      setSubmitError("");
      setOpenActionModal(true);

      ensureMasterLoaded();
      ensureAssetsLoaded({ force: false });
    },
    [ensureAssetsLoaded, ensureMasterLoaded],
  );

  const openCreateTicket = useCallback(async () => {
    setSelectedTicket(null);
    setActionType("create");
    setSubmitError("");
    setOpenActionModal(true);

    ensureMasterLoaded();
    ensureAssetsLoaded({ force: false });
  }, [ensureAssetsLoaded, ensureMasterLoaded]);

  const handleCancelToWaiting = useCallback(
    async (row) => {
      if (!row?.id) return;

      setSubmittingAction(true);
      setSubmitError("");

      try {
        await TicketService.updateTicketByAdmin(row.id, { status: "waiting" });
        await revalidateCurrent(); // ✅ silent refresh
      } catch (e) {
        setSubmitError(e?.message || "Gagal cancel ticket");
      } finally {
        setSubmittingAction(false);
      }
    },
    [revalidateCurrent],
  );

  const renderActions = useCallback(
    (row) => {
      const s = statusKey(row);

      if (s === "waiting") {
        return (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              size="small"
              variant="contained"
              onClick={() => openModalFor(row, "execution")}
              sx={{
                textTransform: "none",
                borderRadius: "10px",
                fontWeight: 850,
                boxShadow: "none",
              }}
            >
              Execution
            </Button>

            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => openModalFor(row, "void")}
              sx={{
                textTransform: "none",
                borderRadius: "10px",
                fontWeight: 850,
                boxShadow: "none",
              }}
            >
              Void
            </Button>
          </Stack>
        );
      }

      if (s === "in_progress") {
        return (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              size="small"
              variant="contained"
              color="success"
              onClick={() => openModalFor(row, "resolved")}
              sx={{
                textTransform: "none",
                borderRadius: "10px",
                fontWeight: 850,
                boxShadow: "none",
              }}
            >
              Resolved
            </Button>

            <Button
              size="small"
              variant="outlined"
              color="warning"
              onClick={() => handleCancelToWaiting(row)}
              sx={{
                textTransform: "none",
                borderRadius: "10px",
                fontWeight: 850,
                boxShadow: "none",
              }}
            >
              Cancel
            </Button>
          </Stack>
        );
      }

      return <span style={{ opacity: 0.6 }}>-</span>;
    },
    [handleCancelToWaiting, openModalFor, statusKey],
  );

  const handleSubmitAction = useCallback(
    async (payload, meta = {}) => {
      setSubmittingAction(true);
      setSubmitError("");

      try {
        if (meta?.actionType === "create") {
          await TicketService.storeByAdmin(payload);
        } else {
          if (!selectedTicket?.id) return;
          await TicketService.updateTicketByAdmin(selectedTicket.id, payload);
        }

        setOpenActionModal(false);
        setSelectedTicket(null);
        setActionType(null);

        await revalidateCurrent(); // ✅ silent refresh
      } catch (e) {
        console.error("Ticket submit error:", e);
        setSubmitError(e?.message || "Gagal submit ticket");
      } finally {
        setSubmittingAction(false);
      }
    },
    [revalidateCurrent, selectedTicket?.id],
  );

  const handleCloseModal = useCallback(() => {
    if (submittingAction) return;

    setOpenActionModal(false);
    setSelectedTicket(null);
    setActionType(null);
    setSubmitError("");
  }, [submittingAction]);

  // =========================
  // UI
  // =========================
  return (
    <PageTransition>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        {/* HEADER + FILTER (keep design) */}
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
              Ticket Monitoring
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
              minWidth: isMobile ? "100%" : 460,
              flexWrap: "nowrap",
            }}
          >
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

            <Button
              variant="outlined"
              onClick={handleRefresh}
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
            display: "flex",
            overflowX: { xs: "auto", md: "visible" },
            gap: 1.25,
            alignItems: "stretch",
            px: { xs: 0.5, md: 0 },
            pb: { xs: 0.5, md: 0 },
            "&::-webkit-scrollbar": { display: "none" },
            scrollbarWidth: "none",
          }}
        >
          {loadingStats
            ? Array.from({ length: STATUS_LIST.length }).map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    flex: { xs: "0 0 auto", md: 1 },
                    minWidth: { xs: 140, sm: 160 },
                  }}
                >
                  <StatisticCardSkeleton />
                </Box>
              ))
            : statCards.map((card) => (
                <Box
                  key={card.key}
                  sx={{
                    flex: { xs: "0 0 auto", md: 1 },
                    minWidth: { xs: 140, sm: 160 },
                  }}
                >
                  <StatisticCard
                    title={card.title}
                    value={card.value}
                    status={card.key}
                    onClick={() => applyStatusFilter(card.key)}
                    active={activeStatus === card.key}
                  />
                </Box>
              ))}
        </Box>

        {/* TABLE */}
        <Box
          sx={{
            p: { xs: 1.25, sm: 2 },
            borderRadius: 3,
            border: "1px solid #e5e7eb",
            backgroundColor: "#fff",
          }}
        >
          <DataTableResponsive
            columns={columns}
            data={tickets}
            loading={loadingTable}
            onRefresh={handleRefresh}
            add={openCreateTicket}
            renderActions={renderActions}
            renderActionsMobile={renderActions}
          />
        </Box>

        {/* MODAL */}
        <TicketActionModal
          open={openActionModal}
          onClose={handleCloseModal}
          actionType={actionType}
          ticket={selectedTicket}
          supports={supports}
          users={users}
          categories={categories}
          assets={assets}
          assetsLoading={assetsLoading}
          onSubmit={handleSubmitAction}
          submitting={submittingAction}
          submitError={submitError}
          masterLoading={masterLoading}
        />
      </LocalizationProvider>
    </PageTransition>
  );
}
