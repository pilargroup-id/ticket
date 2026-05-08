// src/services/AssetsService.js
import api from "./api";

const extractList = (res) => {
  // api.js sudah return response.data
  // bentuk umum: { message, data: [...] }
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

const pickItem = (res) => res?.data ?? res ?? null;

const toFormData = (payload) => {
  const fd = new FormData();
  Object.entries(payload || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    fd.append(k, v);
  });
  return fd;
};

const AssetsService = {
  show: async () => {
    const res = await api.get("/asset");
    return extractList(res);
  },

  store: async (payload) => {
    // backend lu validasi normal field, multipart juga bisa
    const fd = toFormData(payload);
    return api.post("/asset", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  update: async (id, payload) => {
    // ✅ langsung PUT (lebih clean)
    const fd = toFormData(payload);
    return api.post(`/asset/${id}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
      params: { _method: "PUT" }, // aman untuk Laravel kalau server lu gak terima PUT multipart
    });
  },

  destroy: (id) => api.delete(`/asset/${id}`),
};

export default AssetsService;
export { pickItem };
