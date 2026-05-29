import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/**
 * Axios instance pre-configured for the LifeOS backend API.
 * Automatically attaches JWT token from localStorage.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor: Attach JWT Token ───────────────────────────────────

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("lifeos_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle 401 ────────────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("lifeos_token");
        localStorage.removeItem("lifeos_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ────────────────────────────────────────────────────────────────

export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
  updateProfile: (data: Record<string, unknown>) =>
    api.put("/auth/profile", data),
};

// ─── Goals API ───────────────────────────────────────────────────────────────

export const goalsAPI = {
  getAll: (params?: { period?: string; status?: string }) =>
    api.get("/goals", { params }),
  create: (data: { title: string; description?: string; priority?: string; period?: string; deadline?: string }) =>
    api.post("/goals", data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/goals/${id}`, data),
  delete: (id: string) =>
    api.delete(`/goals/${id}`),
};

// ─── Habits API ──────────────────────────────────────────────────────────────

export const habitsAPI = {
  getAll: () => api.get("/habits"),
  create: (data: { name: string }) =>
    api.post("/habits", data),
  log: (id: string) =>
    api.post(`/habits/${id}/log`),
  delete: (id: string) =>
    api.delete(`/habits/${id}`),
};

// ─── Tasks API ───────────────────────────────────────────────────────────────

export const tasksAPI = {
  getAll: (params?: { date?: string; completed?: string }) =>
    api.get("/tasks", { params }),
  create: (data: { title: string; scheduledDate: string; startTime?: string; duration?: number }) =>
    api.post("/tasks", data),
  complete: (id: string) =>
    api.patch(`/tasks/${id}/complete`),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/tasks/${id}`, data),
  delete: (id: string) =>
    api.delete(`/tasks/${id}`),
};

// ─── Activities API ──────────────────────────────────────────────────────────

export const activitiesAPI = {
  getAll: (params?: { type?: string; from?: string; to?: string }) =>
    api.get("/activities", { params }),
  log: (data: { type: string; duration?: number; amount?: number; notes?: string }) =>
    api.post("/activities", data),
  getSummary: () =>
    api.get("/activities/summary"),
};

// ─── AI API ──────────────────────────────────────────────────────────────────

export const aiAPI = {
  chat: (messages: { role: string; content: string }[]) =>
    api.post("/ai/chat", { messages }),
  generateSchedule: (description?: string) =>
    api.post("/ai/schedule", { description }),
  generateReview: () =>
    api.post("/ai/review"),
  getReviews: () =>
    api.get("/ai/reviews"),
};

// ─── Achievements API ────────────────────────────────────────────────────────

export const achievementsAPI = {
  getAll: () => api.get("/achievements"),
};

export default api;

