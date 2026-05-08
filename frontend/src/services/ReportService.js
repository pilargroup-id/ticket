// src/services/ReportService.js
import api, { apiDownload } from "./api";

/**
 * Toggle debug log di console
 * - true: log semua request/response
 * - false: silent
 */
const REPORT_DEBUG = true;

const logGroup = (title, data) => {
  if (!REPORT_DEBUG) return;
  try {
    console.groupCollapsed(title);
    console.log(data);
    console.groupEnd();
  } catch {
    console.log(title, data);
  }
};

/**
 * Axios unwrap:
 * - kalau axios response -> ambil .data
 * - kalau sudah plain object -> return langsung
 */
const unwrap = (res) => (res && typeof res === "object" && "data" in res ? res.data : res);

/**
 * Helper ambil array dari bentuk:
 * - { data: [...] }
 * - { data: { data: [...] } } (paginate laravel)
 * - [... ]
 */
const pickArray = (payload) => {
  const p = unwrap(payload);
  if (Array.isArray(p)) return p;
  if (Array.isArray(p?.data?.data)) return p.data.data;
  if (Array.isArray(p?.data)) return p.data;
  return [];
};

/**
 * Helper ambil chart dari bentuk:
 * - { chart: {labels, series} }
 * - { data: { chart: ... } }
 * - { labels, series }
 */
const pickChart = (payload) => {
  const p = unwrap(payload);
  if (p?.labels && p?.series) return p;
  if (p?.chart?.labels && p?.chart?.series) return p.chart;
  if (p?.data?.chart?.labels && p?.data?.chart?.series) return p.data.chart;
  return { labels: [], series: [] };
};

const ReportService = {
  // =========================
  // TICKETS - RAW (return JSON)
  // =========================
  ticketReportUser: async (params = {}) => unwrap(await api.get("/reports/user-tickets", { params })),
  ticketReportUserAlt: async (params = {}) => unwrap(await api.get("/reports/ticket-user", { params })),
  ticketReportAll: async (params = {}) => unwrap(await api.get("/reports/ticket-all", { params })),

  ticketsPerMonth: async (params = {}) => unwrap(await api.get("/reports/tickets/per-month", { params })),

  totalTimeSpentPerMonthByDepartment: async (params = {}) => {
    logGroup("➡️ [REQ] totalTimeSpentPerMonthByDepartment params", params);
    const res = await api.get("/reports/tickets/time-spent-per-month-department", { params });
    const data = unwrap(res);
    logGroup("⬅️ [RESP] totalTimeSpentPerMonthByDepartment data", data);

    const chart = pickChart(data);
    logGroup("✅ [PARSED] totalTimeSpentPerMonthByDepartment chart", chart);
    return chart;
  },

  ticketDistributionByCategory: async (params = {}) =>
    unwrap(await api.get("/reports/tickets/distribution-category", { params })),

  slaReport: async (params = {}) => unwrap(await api.get("/reports/tickets/sla", { params })),

  // =========================
  // SUPPORT / EXPORT
  // =========================

  // backend: { message, data: TicketCollection(...) } -> paginate -> data.data = rows
  previewExportTickets: async (params = {}) => {
    logGroup("➡️ [REQ] previewExportTickets params", params);
    const res = await api.get("/reports/tickets/preview", { params });
    const data = unwrap(res);
    logGroup("⬅️ [RESP] previewExportTickets data", data);

    const rows = pickArray(data);
    logGroup("✅ [PARSED] previewExportTickets rows", rows);
    return rows;
  },

  // backend: { message, meta, data: [...] }
  supportSummary: async (params = {}) => {
    logGroup("➡️ [REQ] supportSummary params", params);
    const res = await api.get("/reports/supports/summary", { params });
    const data = unwrap(res);
    logGroup("⬅️ [RESP] supportSummary data", data);

    const rows = pickArray(data);
    logGroup("✅ [PARSED] supportSummary rows", rows);
    return rows;
  },

  // backend: { message, meta, chart: {labels, series}, raw }
  ticketsPerMonthBySupport: async (params = {}) => {
    logGroup("➡️ [REQ] ticketsPerMonthBySupport params", params);
    const res = await api.get("/reports/supports/tickets-per-month", { params });
    const data = unwrap(res);
    logGroup("⬅️ [RESP] ticketsPerMonthBySupport data", data);

    const chart = pickChart(data);
    logGroup("✅ [PARSED] ticketsPerMonthBySupport chart", chart);
    return chart;
  },

  timeSpentPerMonthBySupport: async (params = {}) => {
    logGroup("➡️ [REQ] timeSpentPerMonthBySupport params", params);
    const res = await api.get("/reports/supports/time-spent-per-month", { params });
    const data = unwrap(res);
    logGroup("⬅️ [RESP] timeSpentPerMonthBySupport data", data);

    const chart = pickChart(data);
    logGroup("✅ [PARSED] timeSpentPerMonthBySupport chart", chart);
    return chart;
  },

  ticketsDetailBySupport: async (supportId, params = {}) => {
    logGroup(`➡️ [REQ] ticketsDetailBySupport supportId=${supportId} params`, params);
    const res = await api.get(`/reports/supports/${supportId}/tickets`, { params });
    const data = unwrap(res);
    logGroup(`⬅️ [RESP] ticketsDetailBySupport supportId=${supportId} data`, data);

    const rows = pickArray(data);
    logGroup(`✅ [PARSED] ticketsDetailBySupport supportId=${supportId} rows`, rows);
    return rows;
  },

  exportTickets: (params = {}) => {
    const { start_date, end_date } = params;
    const filename = `tickets_export_${start_date || "all"}_${end_date || "all"}.xlsx`;

    logGroup("➡️ [REQ] exportTickets params", params);
    logGroup("📄 [FILENAME]", filename);

    return apiDownload("/reports/tickets/export", params, filename);
  },

  // =========================
  // PROJECT
  // =========================
  projectGanttReport: async ({ year, status, q } = {}) => {
    const params = {};
    if (year) params.year = year;
    if (status && status !== "all") params.status = status;
    if (q) params.q = q;

    logGroup("➡️ [REQ] projectGanttReport params", params);
    const res = await api.get("/reports/projects/gantt", { params });
    const data = unwrap(res);
    logGroup("⬅️ [RESP] projectGanttReport data", data);

    // backend: { message, meta, data:[...] }
    return pickArray(data);
  },

  projectGanttDetailReport: async (project_id) => {
    logGroup("➡️ [REQ] projectGanttDetailReport params", { project_id });
    const res = await api.get("/reports/projects/gantt-detail", { params: { project_id } });
    const data = unwrap(res);
    logGroup("⬅️ [RESP] projectGanttDetailReport data", data);
    return data ?? null;
  },

  projectGanttSummary: async ({ year } = {}) => {
    const params = {};
    if (year) params.year = year;

    logGroup("➡️ [REQ] projectGanttSummary params", params);
    const res = await api.get("/reports/projects/summary", { params });
    const data = unwrap(res);
    logGroup("⬅️ [RESP] projectGanttSummary data", data);

    // backend: { message, data:{...} }
    return data?.data ?? data ?? null;
  },

  // ✅ preview project (paginate)
  previewExportProjects: async (params = {}) => {
    logGroup("➡️ [REQ] previewExportProjects params", params);
    const res = await api.get("/reports/projects/preview", { params });
    const data = unwrap(res);
    logGroup("⬅️ [RESP] previewExportProjects data", data);

    // backend paginate: { message, data: { data: [...] } }
    const rows = pickArray(data);
    logGroup("✅ [PARSED] previewExportProjects rows", rows);
    return rows;
  },

  // ✅ export project
  exportProjects: (params = {}) => {
    const year = params?.year ?? new Date().getFullYear();
    const filename = `projects_export_${year}.xlsx`;

    logGroup("➡️ [REQ] exportProjects params", params);
    logGroup("📄 [FILENAME]", filename);

    return apiDownload("/reports/projects/export", params, filename);
  },

  // ✅ developer performance summary (array)
  developerProjectSummary: async (params = {}) => {
    logGroup("➡️ [REQ] developerProjectSummary params", params);
    const res = await api.get("/reports/developers/projects/summary", { params });
    const data = unwrap(res);
    logGroup("⬅️ [RESP] developerProjectSummary data", data);

    // backend: { message, meta, data:[...] }
    return pickArray(data);
  },

  // ✅ developer project detail (object {pagination, rows})
  developerProjectDetail: async (developerId, params = {}) => {
    logGroup(`➡️ [REQ] developerProjectDetail developerId=${developerId} params`, params);
    const res = await api.get(`/reports/developers/${developerId}/projects`, { params });
    const data = unwrap(res);
    logGroup(`⬅️ [RESP] developerProjectDetail developerId=${developerId} data`, data);

    // backend: { message, meta, data: { pagination, rows } }
    return data?.data ?? data ?? null;
  },
};

export default ReportService;
