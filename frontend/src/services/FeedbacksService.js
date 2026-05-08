
import api from "./api";

const FeedbacksService = {
  show: async () => {
    const res = await api.get("/feedback");

    if (res?.data?.data) return res.data.data;

    return res?.data ?? [];
  },

  store: (ticketId, form) => {
    const payload = {
      description: String(form.comment ?? "").trim(),
      rating: Number(form.rating),
    };

    return api.post(`/user/feedback/${ticketId}`, payload);
  },
};

export default FeedbacksService;
