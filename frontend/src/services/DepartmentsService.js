// src/services/DepartmentsService.js
import api from "./api";

const DepartmentsService = {
  // ✅ return LIST langsung (page tinggal pakai)
  show: async () => {
    const res = await api.get("/department"); // res = { message, data }

    // support resource paginate / collection
    if (res?.data?.data) return res.data.data;

    return res?.data ?? [];
  },

  store: ({ name, location_id }) => {
    const formData = new FormData();
    formData.append("name", name ?? "");
    formData.append("location_id", location_id ?? "");

    return api.post("/department", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  update: (id, { name, location_id }) => {
    const formData = new FormData();
    formData.append("name", name ?? "");
    formData.append("location_id", location_id ?? "");
    formData.append("_method", "PUT");

    return api.post(`/department/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  destroy: (id) => api.delete(`/department/${id}`),
};

export default DepartmentsService;
