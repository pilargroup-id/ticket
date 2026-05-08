import api from "./api";

const LocationsService = {
  show: async () => {
    const res = await api.get("/location");

    if (res?.data?.data) return res.data.data;

    return res?.data ?? [];
  },

  store: (name) => {
    const formData = new FormData();
    formData.append("name", name);

    return api.post("/location", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  update: (id, name) => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("_method", "PUT");

    return api.post(`/location/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  destroy: (id) => {
    return api.delete(`/location/${id}`);
  },
};

export default LocationsService;
