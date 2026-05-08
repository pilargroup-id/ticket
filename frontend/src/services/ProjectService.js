// src/services/ProjectService.js
import api from "./api";

const ProjectService = {
  // GET /project?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
  list: async ({ start_date, end_date } = {}) => {
    const params = {};
    if (start_date) params.start_date = start_date;
    if (end_date) params.end_date = end_date;

    const res = await api.get("/project", { params });
    // api.js return response.data already
    return res?.data ?? res ?? [];
  },

  // POST /project
  store: async (payload) => {
    const res = await api.post("/project", payload);
    return res?.data ?? res;
  },

  // ACTIONS
  start: async (id, payload) => {
    const res = await api.post(`/project/${id}/start`, payload);
    return res?.data ?? res;
  },

  progress: async (id, payload) => {
    const res = await api.post(`/project/${id}/progress`, payload);
    return res?.data ?? res;
  },

  hold: async (id, payload) => {
    const res = await api.post(`/project/${id}/hold`, payload);
    return res?.data ?? res;
  },

  unhold: async (id, payload) => {
    const res = await api.post(`/project/${id}/unhold`, payload);
    return res?.data ?? res;
  },

  void: async (id, payload) => {
    const res = await api.post(`/project/${id}/void`, payload);
    return res?.data ?? res;
  },

  resolve: async (id, payload) => {
    const res = await api.post(`/project/${id}/resolve`, payload);
    return res?.data ?? res;
  },

  history: async (id) => {
  const res = await api.get(`/project/${id}/history`);
  return res?.data ?? res;
},

};

export default ProjectService;
