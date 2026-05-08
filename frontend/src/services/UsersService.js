// src/services/UsersService.js
import api from "./api";

const buildPayload = (form) => {
  const payload = {
    name: String(form?.name ?? "").trim(),
    username: String(form?.username ?? "").trim(),
    email: String(form?.email ?? "").trim(),

    // ✅ role string
    role: form?.role !== "" && form?.role != null ? String(form.role).trim() : null,

    department_id:
      form?.department_id !== "" && form?.department_id != null
        ? Number(form.department_id)
        : null,

    phone: String(form?.phone ?? "").trim(),
    job_position: String(form?.job_position ?? "").trim(),
  };

  const pass = String(form?.password ?? "").trim();
  if (pass) payload.password = pass;

  return payload;
};

const UsersService = {
  show: async () => {
    // ✅ api.js sudah unwrap response.data
    // jadi bentuknya biasanya: { message, data: [...] }
    const res = await api.get("/user");
    return res?.data ?? res ?? [];
  },

  developer: async () => {
    const res = await api.get("/developer");
    return res?.data ?? res ?? [];
  },

  save: ({ id, form }) => {
    const payload = buildPayload(form);
    return id ? api.put(`/user/${id}`, payload) : api.post("/user", payload);
  },

  destroy: (id) => api.delete(`/user/${id}`),

  approve: (id) => api.post(`/approve-user/${id}`),
};

export default UsersService;
