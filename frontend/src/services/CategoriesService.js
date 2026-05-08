import api from "./api";

const CategoriesService = {
  show: async () => {
    const res = await api.get("/user/category");
    if (res?.data?.data) return res.data.data;
    return res?.data ?? [];
  },

  store: async (name) => {
    const formData = new FormData();
    formData.append("name", name ?? "");

    return api.post("/category", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  update: async (id, name) => {
    const formData = new FormData();
    formData.append("name", name ?? "");
    formData.append("_method", "PUT");

    return api.post(`/category/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  destroy: (id) => api.delete(`/category/${id}`),
};

export default CategoriesService;
