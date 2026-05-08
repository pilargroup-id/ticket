// src/services/TicketService.js
import api from "./api";

/**
 * Karena interceptor api.js mengembalikan response.data,
 * bentuk res biasanya sudah object JSON.
 * Tapi biar aman, kita handle beberapa format legacy.
 */
const unwrapArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data?.data)) return res.data.data; // legacy
  if (Array.isArray(res?.data)) return res.data; // {data:[...]}
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.tickets)) return res.tickets;
  return [];
};

const unwrapObj = (res) => {
  if (!res) return null;
  // kalau { data: {...} } dan data-nya object
  if (res?.data && typeof res.data === "object" && !Array.isArray(res.data)) return res.data;
  return res;
};

const buildTicketParams = ({ status, start_date, end_date, per_page, include_assets } = {}) => {
  const params = {};
  if (status && status !== "all") params.status = status;
  if (start_date) params.start_date = start_date;
  if (end_date) params.end_date = end_date;
  if (per_page) params.per_page = per_page;
  if (include_assets !== undefined) params.include_assets = include_assets ? 1 : 0;
  return params;
};

const buildUserTicketFormData = (form = {}) => {
  const fd = new FormData();
  fd.append("category_id", form?.category_id ?? "");
  fd.append("problem", form?.problem ?? "");
  fd.append("nama_pembuat", form?.nama_pembuat ?? "");
  // ✅ hanya append kalau beneran File
  if (form?.image instanceof File) fd.append("image", form.image);
  return fd;
};

const buildAdminTicketFormData = (payload = {}) => {
  const fd = new FormData();

  fd.append("user_id", payload?.user_id ?? "");
  fd.append("support_id", payload?.support_id ?? "");
  fd.append("category_id", payload?.category_id ?? "");
  fd.append("nama_pembuat", payload?.nama_pembuat ?? "");
  fd.append("problem", payload?.problem ?? "");
  fd.append("status", payload?.status ?? "waiting");
  fd.append("priority", payload?.priority ?? "medium");

  if (payload?.assets_id !== null && payload?.assets_id !== undefined) {
    fd.append("assets_id", payload.assets_id ?? "");
  }
  if (payload?.start_date) fd.append("start_date", payload.start_date);
  if (payload?.end_date) fd.append("end_date", payload.end_date);

  if (payload?.time_spent !== undefined && payload?.time_spent !== null && payload?.time_spent !== "") {
    fd.append("time_spent", String(payload.time_spent));
  }

  if (payload?.solution) fd.append("solution", payload.solution);
  if (payload?.notes) fd.append("notes", payload.notes);

  if (payload?.image instanceof File) fd.append("image", payload.image);

  return fd;
};

const TicketService = {
  // =========================
  // USER
  // =========================
  myTicket: async (params = {}) => {
    const res = await api.get("/user/tickets", { params });
    return unwrapArray(res);
  },

  statsMyTicket: async (params = {}) => {
    const res = await api.get("/user/reports/ticket-user", { params });
    return unwrapObj(res);
  },

  statsAllTicket: async (params = {}) => {
    const res = await api.get("/reports/ticket-all", { params });
    return unwrapObj(res);
  },

  getMyDashboard: async (params = {}) => {
    const [ticketsRes, statsRes] = await Promise.all([
      api.get("/user/tickets", { params }),
      api.get("/user/reports/ticket-user", { params }),
    ]);

    return {
      tickets: unwrapArray(ticketsRes),
      stats: unwrapObj(statsRes),
    };
  },
storeByUser: (form) => {
  const fd = buildUserTicketFormData(form);

  // ✅ debug FormData (monitor payload & file)
  for (const [k, v] of fd.entries()) {
    if (v instanceof File) {
      console.log("FD:", k, { name: v.name, size: v.size, type: v.type });
    } else {
      console.log("FD:", k, v);
    }
  }

  // ✅ jangan set Content-Type manual
  return api.post("/user/ticket", fd);
},

  updateByUser: (id, form) => {
    const formData = buildUserTicketFormData(form);
    // kalau backend update butuh semua field, pastikan form sudah lengkap
    return api.put(`/user/ticket/${id}`, formData);
  },

  myTicketByFilter: async ({ status, start_date, end_date, per_page, include_assets } = {}) => {
    const params = buildTicketParams({ status, start_date, end_date, per_page, include_assets });
    const res = await api.get("/user/tickets", { params });
    return unwrapArray(res);
  },

  // =========================
  // ADMIN
  // =========================
  ticketsByStatus: async ({ status, start_date, end_date, per_page, include_assets } = {}) => {
    const params = buildTicketParams({ status, start_date, end_date, per_page, include_assets });
    const res = await api.get("/ticket", { params });
    return unwrapArray(res);
  },

  updateTicketByAdmin: (id, payload) => api.put(`/ticket/${id}`, payload),

  storeByAdmin: (payload) => {
    const formData = buildAdminTicketFormData(payload);
    // ✅ jangan set Content-Type manual
    return api.post("/ticket/admin", formData);
  },

  // =========================
  // MASTER DATA (Admin)
  // =========================
  getSupports: async () => {
    const res = await api.get("/support");
    return unwrapArray(res);
  },

  getAssets: async (q = "") => {
    const res = await api.get("/asset", { params: q ? { q } : {} });
    return unwrapArray(res);
  },
};

export default TicketService;
