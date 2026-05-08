// src/pages/project/ProjectMonitoring.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

import UsersService from "../../services/UsersService";
import ProjectService from "../../services/ProjectService";
import ProjectActionModal from "../../components/form/ProjectActionModal";
import ProjectDetailModal from "../../components/form/ProjectDetailModal";

// =========================
// STATUS
// =========================
const STATUS_LIST = ["waiting", "in_progress", "pending", "resolved", "void"];
const DEFAULT_STATUS = "waiting";

const normalizeStatus = (s) => {
  const key = String(s ?? "")
    .toLowerCase()
    .trim();
  return STATUS_LIST.includes(key) ? key : DEFAULT_STATUS;
};

// =========================
// DATE
// =========================
const safeDate = (v) => String(v ?? "").trim();

function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// =========================
// UNWRAP
// =========================
const asArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

// =====================================================
// ✅ GLOBAL CACHE
// =====================================================
const PM_CACHE = {
  rangeKey: null,
  projectsRaw: null,
  projectsNorm: null,
  lastActiveStatus: DEFAULT_STATUS,

  master: {
    loaded: false,
    loading: false,
    developers: null,
    requestors: null,
  },
};

export default function ProjectMonitoring() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // =========================
  // ✅ YEAR FILTER (default: OFF -> ALL)
  // =========================
  const [year, setYear] = useState(null); // ✅ null = ALL
  const [useYearFilter, setUseYearFilter] = useState(false);
  const debYear = useDebouncedValue(year, 250);

  const startDate = useMemo(() => {
    if (!useYearFilter || !year) return "";
    return `${debYear}-01-01`;
  }, [debYear, useYearFilter, year]);

  const endDate = useMemo(() => {
    if (!useYearFilter || !year) return "";
    return `${debYear}-12-31`;
  }, [debYear, useYearFilter, year]);

  // =========================
  // UI STATE
  // =========================
  const [activeStatus, setActiveStatus] = useState(
    normalizeStatus(PM_CACHE.lastActiveStatus),
  );

  const [loadingTable, setLoadingTable] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  const [projects, setProjects] = useState([]); // normalized list (full)
  const [developers, setDevelopers] = useState([]);
  const [requestors, setRequestors] = useState([]);
  const [masterLoading, setMasterLoading] = useState(false);

  // ACTION MODAL
  const [openActionModal, setOpenActionModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // DETAIL MODAL
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [detailProject, setDetailProject] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailData, setDetailData] = useState(null);

  // anti race
  const seqRef = useRef(0);
  const refreshingRef = useRef(false);

  // =========================
  // COLUMNS
  // =========================
  const columns = useMemo(
    () => [
      { title: "Project", data: "project_code" },
      { title: "Name", data: "project_name" },
      { title: "Requestor", data: "requestor_name" },
      { title: "Priority", data: "priority" },
      { title: "Progress", data: "progress_percent" },
      { title: "Status", data: "status" },
      { title: "Actions", data: "actions" },
    ],
    [],
  );

  // =========================
  // NORMALIZE
  // =========================
  const normalizeRows = useCallback((list, devList, reqList) => {
    const devMap = new Map((devList || []).map((u) => [Number(u.id), u]));
    const reqMap = new Map((reqList || []).map((u) => [Number(u.id), u]));

    return (list || []).map((p) => {
      const req =
        reqMap.get(Number(p.requestor_id ?? p.requestor?.id)) ||
        p.requestor ||
        null;
      const dev =
        devMap.get(Number(p.dev_id ?? p.developer?.id)) || p.developer || null;

      const progressNum =
        typeof p.progress_percent === "number"
          ? p.progress_percent
          : Number(p.progress_percent || 0);

      return {
        ...p,
        status: normalizeStatus(p.status),
        project_code: p.project_code ?? "-",
        project_name: p.project_name ?? "-",
        priority: p.priority ?? "-",
        progress_percent: `${progressNum}`,
        requestor_name: req?.name ?? p.requestor_name ?? "-",
        developer_name: dev?.name ?? p.developer_name ?? "-",
      };
    });
  }, []);

  // =========================
  // MASTER LAZY (dev + requestor)
  // =========================
  const ensureMasterLoaded = useCallback(async () => {
    if (PM_CACHE.master.loaded) {
      setDevelopers(PM_CACHE.master.developers || []);
      setRequestors(PM_CACHE.master.requestors || []);
      return;
    }
    if (PM_CACHE.master.loading) {
      setMasterLoading(true);
      return;
    }

    PM_CACHE.master.loading = true;
    setMasterLoading(true);
    const mySeq = ++seqRef.current;

    try {
      const [devs, reqs] = await Promise.all([
        UsersService.developer().catch(() => []),
        UsersService.show().catch(() => []),
      ]);

      if (mySeq !== seqRef.current) return;

      PM_CACHE.master.developers = asArray(devs);
      PM_CACHE.master.requestors = asArray(reqs);
      PM_CACHE.master.loaded = true;

      setDevelopers(PM_CACHE.master.developers);
      setRequestors(PM_CACHE.master.requestors);

      // kalau projectsRaw udah ada → re-normalize sekali biar nama kebeneran
      if (Array.isArray(PM_CACHE.projectsRaw)) {
        const norm = normalizeRows(
          PM_CACHE.projectsRaw,
          PM_CACHE.master.developers,
          PM_CACHE.master.requestors,
        );
        PM_CACHE.projectsNorm = norm;
        setProjects(norm);
      }
    } finally {
      if (mySeq === seqRef.current) {
        PM_CACHE.master.loading = false;
        setMasterLoading(false);
      }
    }
  }, [normalizeRows]);

  // =========================
  // FETCH PROJECTS
  // mode:
  // - "all"  : tanpa tanggal (default pertama)
  // - "year" : pakai start/end
  // =========================
  const fetchProjects = useCallback(
    async ({ start, end, force = false, mode = "all" } = {}) => {
      const mySeq = ++seqRef.current;

      setLoadingTable(true);
      setLoadingStats(true);

      const s = safeDate(start ?? startDate);
      const e = safeDate(end ?? endDate);

      const key = mode === "all" ? "__ALL__" : `${s}|${e}`;

      // cache hit
      if (!force && PM_CACHE.rangeKey === key) {
        const cached = PM_CACHE.projectsNorm || PM_CACHE.projectsRaw;
        if (Array.isArray(cached)) {
          const rows = PM_CACHE.projectsNorm
            ? PM_CACHE.projectsNorm
            : normalizeRows(
                PM_CACHE.projectsRaw,
                PM_CACHE.master.developers || [],
                PM_CACHE.master.requestors || [],
              );

          if (mySeq === seqRef.current) {
            setProjects(rows);
            setLoadingTable(false);
            setLoadingStats(false);
          }
          return;
        }
      }

      // validasi kalau mode year
      if (mode === "year") {
        if (!s || !e || s > e) {
          if (mySeq === seqRef.current) {
            setLoadingTable(false);
            setLoadingStats(false);
          }
          return;
        }
      }

      try {
        const res =
          mode === "all"
            ? await ProjectService.list({})
            : await ProjectService.list({ start_date: s, end_date: e });

        if (mySeq !== seqRef.current) return;

        const raw = asArray(res);
        PM_CACHE.rangeKey = key;
        PM_CACHE.projectsRaw = raw;

        const rows = normalizeRows(
          raw,
          PM_CACHE.master.developers || [],
          PM_CACHE.master.requestors || [],
        );

        if (PM_CACHE.master.loaded) PM_CACHE.projectsNorm = rows;
        else PM_CACHE.projectsNorm = null;

        setProjects(rows);
      } catch (err) {
        console.error("Fetch projects error:", err);
        if (mySeq !== seqRef.current) return;

        PM_CACHE.rangeKey = key;
        PM_CACHE.projectsRaw = [];
        PM_CACHE.projectsNorm = [];
        setProjects([]);
      } finally {
        if (mySeq === seqRef.current) {
          setLoadingTable(false);
          setLoadingStats(false);
        }
      }
    },
    [endDate, normalizeRows, startDate, useYearFilter],
  );

  // =========================
  // MOUNT -> FIRST LOAD ALL
  // =========================
  useEffect(() => {
    const st = normalizeStatus(PM_CACHE.lastActiveStatus || DEFAULT_STATUS);
    PM_CACHE.lastActiveStatus = st;
    setActiveStatus(st);

    const key = "__ALL__";

    if (PM_CACHE.rangeKey === key && Array.isArray(PM_CACHE.projectsRaw)) {
      const rows = PM_CACHE.projectsNorm
        ? PM_CACHE.projectsNorm
        : normalizeRows(
            PM_CACHE.projectsRaw,
            PM_CACHE.master.developers || [],
            PM_CACHE.master.requestors || [],
          );

      setProjects(rows);
      setLoadingTable(false);
      setLoadingStats(false);
    } else {
      fetchProjects({ force: false, mode: "all" });
    }

    return () => {
      seqRef.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================
  // YEAR CHANGED -> only when useYearFilter true
  // =========================
  useEffect(() => {
    if (!useYearFilter) return;

    const s = safeDate(startDate);
    const e = safeDate(endDate);
    if (!s || !e || s > e) return;

    fetchProjects({ start: s, end: e, force: false, mode: "year" });
  }, [startDate, endDate, fetchProjects, useYearFilter]);

  // =========================
  // FILTER STATUS (client-only)
  // =========================
  const applyStatusFilter = useCallback((status) => {
    const safe = normalizeStatus(status);
    PM_CACHE.lastActiveStatus = safe;
    setActiveStatus(safe);
  }, []);

  const filteredProjects = useMemo(() => {
    const s = normalizeStatus(activeStatus);
    const list = projects || [];
    if (s === "all") return list;

    const out = [];
    for (let i = 0; i < list.length; i++) {
      if (normalizeStatus(list[i]?.status) === s) out.push(list[i]);
    }
    return out;
  }, [activeStatus, projects]);

  // =========================
  // STATS (client-side)
  // =========================
  const stats = useMemo(() => {
    const base = Object.fromEntries(STATUS_LIST.map((s) => [s, 0]));
    const list = projects || [];

    base.all = list.length;

    for (let i = 0; i < list.length; i++) {
      const s = normalizeStatus(list[i]?.status);
      if (s !== "all") base[s] = (base[s] || 0) + 1;
    }
    return base;
  }, [projects]);

  const toTitle = useCallback(
    (key) =>
      String(key)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    [],
  );

  const statCards = useMemo(
    () =>
      STATUS_LIST.map((k) => ({
        key: k,
        title: k === "all" ? "All" : toTitle(k),
        value: Number(stats?.[k]) || 0,
      })),
    [stats, toTitle],
  );

  // =========================
  // REFRESH
  // =========================
  const handleRefresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;

    try {
      PM_CACHE.projectsRaw = null;
      PM_CACHE.projectsNorm = null;
      PM_CACHE.rangeKey = null;

      if (!useYearFilter) {
        await fetchProjects({ force: true, mode: "all" });
      } else {
        await fetchProjects({
          start: startDate,
          end: endDate,
          force: true,
          mode: "year",
        });
      }
    } finally {
      refreshingRef.current = false;
    }
  }, [fetchProjects, startDate, endDate, useYearFilter]);

  // =========================
  // DETAIL MODAL
  // =========================
  const openDetail = useCallback(
    async (row) => {
      if (!row?.id) return;

      setDetailProject(row);
      setOpenDetailModal(true);
      setDetailLoading(true);
      setDetailError("");
      setDetailData(null);

      ensureMasterLoaded();

      try {
        const res = await ProjectService.history(row.id);
        const data = res?.data ?? res;
        setDetailData(data);
      } catch (e) {
        console.error("Fetch project history error:", e);
        setDetailError(e?.message || "Gagal ambil detail project");
      } finally {
        setDetailLoading(false);
      }
    },
    [ensureMasterLoaded],
  );

  const closeDetail = useCallback(() => {
    setOpenDetailModal(false);
    setDetailProject(null);
    setDetailData(null);
    setDetailError("");
    setDetailLoading(false);
  }, []);

  // =========================
  // ACTION MODAL
  // =========================
  const openCreateProject = useCallback(async () => {
    setSelectedProject(null);
    setActionType("create");
    setSubmitError("");
    setOpenActionModal(true);
    await ensureMasterLoaded();
  }, [ensureMasterLoaded]);

  const openModalFor = useCallback(
    async (row, type) => {
      setSelectedProject(row ?? null);
      setActionType(type);
      setSubmitError("");
      setOpenActionModal(true);
      await ensureMasterLoaded();
    },
    [ensureMasterLoaded],
  );

  const handleSubmitAction = useCallback(
    async (payload, meta = {}) => {
      setSubmittingAction(true);
      setSubmitError("");

      try {
        if (meta?.actionType === "create") {
          await ProjectService.store(payload);
        } else {
          const id = selectedProject?.id;
          if (!id) return;

          if (meta.actionType === "start")
            await ProjectService.start(id, payload);
          if (meta.actionType === "progress")
            await ProjectService.progress(id, payload);
          if (meta.actionType === "hold")
            await ProjectService.hold(id, payload);
          if (meta.actionType === "unhold")
            await ProjectService.unhold(id, payload);
          if (meta.actionType === "void")
            await ProjectService.void(id, payload);
          if (meta.actionType === "resolve")
            await ProjectService.resolve(id, payload);
        }

        setOpenActionModal(false);
        setSelectedProject(null);
        setActionType(null);

        await handleRefresh();
      } catch (e) {
        console.error("Project submit error:", e);
        setSubmitError(e?.message || "Gagal submit project");
      } finally {
        setSubmittingAction(false);
      }
    },
    [handleRefresh, selectedProject],
  );

  const handleCloseModal = useCallback(() => {
    if (submittingAction) return;
    setOpenActionModal(false);
    setSelectedProject(null);
    setActionType(null);
    setSubmitError("");
  }, [submittingAction]);

  // =========================
  // ACTIONS RENDER
  // =========================
  const btnStyle = useMemo(
    () => ({
      textTransform: "none",
      borderRadius: "10px",
      fontWeight: 850,
      boxShadow: "none",
    }),
    [],
  );

  const renderActions = useCallback(
    (row) => {
      const s = normalizeStatus(row?.status);

      const DetailBtn = (
        <Button
          size="small"
          variant="outlined"
          onClick={() => openDetail(row)}
          sx={btnStyle}
        >
          Lihat Detail
        </Button>
      );

      if (s === "waiting") {
        return (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {DetailBtn}
            <Button
              size="small"
              variant="contained"
              onClick={() => openModalFor(row, "start")}
              sx={btnStyle}
            >
              Start
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => openModalFor(row, "void")}
              sx={btnStyle}
            >
              Void
            </Button>
          </Stack>
        );
      }

      if (s === "in_progress") {
        return (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {DetailBtn}
            <Button
              size="small"
              variant="contained"
              onClick={() => openModalFor(row, "progress")}
              sx={btnStyle}
            >
              Progress
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="warning"
              onClick={() => openModalFor(row, "hold")}
              sx={btnStyle}
            >
              Hold
            </Button>
            <Button
              size="small"
              variant="contained"
              color="success"
              onClick={() => openModalFor(row, "resolve")}
              sx={btnStyle}
            >
              Resolve
            </Button>
          </Stack>
        );
      }

      if (s === "pending") {
        return (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {DetailBtn}
            <Button
              size="small"
              variant="contained"
              onClick={() => openModalFor(row, "unhold")}
              sx={btnStyle}
            >
              Continue
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => openModalFor(row, "void")}
              sx={btnStyle}
            >
              Void
            </Button>
          </Stack>
        );
      }

      return (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {DetailBtn}
        </Stack>
      );
    },
    [btnStyle, openDetail, openModalFor],
  );

  // =========================
  // UI
  // =========================
  return (
    <PageTransition>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        {/* HEADER + FILTER */}
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
              Project Monitoring
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
              Default tampil ALL data. Pilih Year kalau mau filter.
            </Typography>

            <Typography
              sx={{
                mt: 0.45,
                fontSize: 12,
                fontWeight: 750,
                color: "rgba(17,24,39,0.55)",
              }}
            >
              Range:{" "}
              {useYearFilter
                ? `${startDate} s/d ${endDate}`
                : "ALL (no year filter)"}
            </Typography>
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
              label="Year"
              views={["year"]}
              value={year ? dayjs(`${year}-01-01`) : null} // ✅ kosong kalau ALL
              onChange={(v) => {
                if (!v) {
                  // user clear
                  setYear(null);
                  setUseYearFilter(false);
                  return;
                }

                const x = dayjs(v);
                if (!x.isValid()) return;

                setUseYearFilter(true);
                setYear(x.year());
              }}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  placeholder: "All Years", // UX nice
                  sx: {
                    "& .MuiOutlinedInput-root": { borderRadius: 3 },
                  },
                },
              }}
            />

            <Button
              variant="outlined"
              onClick={handleRefresh}
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

            {/* OPTIONAL: tombol balik ke ALL (biar enak) */}
            <Button
              variant="outlined"
              onClick={async () => {
                // ✅ reset jadi ALL (year kosong)
                setUseYearFilter(false);
                setYear(null);

                // reset cache biar bener-bener ambil ALL
                PM_CACHE.projectsRaw = null;
                PM_CACHE.projectsNorm = null;
                PM_CACHE.rangeKey = null;

                await fetchProjects({ force: true, mode: "all" });
              }}
              sx={{
                borderRadius: 2,
                fontWeight: 900,
                textTransform: "none",
                height: 40,
                minWidth: isMobile ? 44 : 110,
                px: isMobile ? 0 : 2,
                flex: "0 0 auto",
              }}
            >
              {isMobile ? "ALL" : "Show All"}
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
                    status={card.key} // ✅ warna hidup
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
            data={filteredProjects}
            loading={loadingTable}
            add={openCreateProject}
            renderActions={renderActions}
            renderActionsMobile={renderActions}
          />
        </Box>

        {/* MODALS */}
        <ProjectActionModal
          open={openActionModal}
          onClose={handleCloseModal}
          actionType={actionType}
          project={selectedProject}
          developers={developers}
          requestors={requestors}
          submitting={submittingAction}
          submitError={submitError}
          masterLoading={masterLoading}
          onSubmit={handleSubmitAction}
        />

        <ProjectDetailModal
          open={openDetailModal}
          onClose={closeDetail}
          project={detailProject}
          loading={detailLoading}
          error={detailError}
          data={detailData}
        />
      </LocalizationProvider>
    </PageTransition>
  );
}
