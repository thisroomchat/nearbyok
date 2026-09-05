import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, withCredentials: true });
api.interceptors.request.use((config) => {
  const key = sessionStorage.getItem("nbk_admin_key");
  if (key) config.headers["X-Admin-Key"] = key;
  return config;
});

export const getHome = () => api.get("/home").then((r) => r.data);
export const getCatalog = () => api.get("/catalog").then((r) => r.data);
export const getListing = (category, state, city, params = {}) =>
  api.get(`/listing/${category}/${state}/${city}`, { params }).then((r) => r.data);
export const getDetail = (category, state, city, slug) =>
  api.get(`/detail/${category}/${state}/${city}/${slug}`).then((r) => r.data);
export const doSearch = (what, where) =>
  api.get("/search", { params: { what, where } }).then((r) => r.data);
export const postLead = (payload) => api.post("/leads", payload).then((r) => r.data);

// auth
export const postSession = (session_id) => api.post("/auth/session", { session_id }).then((r) => r.data);
export const getMe = () => api.get("/auth/me").then((r) => r.data);
export const postLogout = () => api.post("/auth/logout").then((r) => r.data);
export const adminLogin = (password) => api.post("/auth/admin-login", { password }).then((r) => r.data);

// user features
export const toggleFavorite = (id) => api.post(`/favorites/${id}`).then((r) => r.data);
export const getFavorites = () => api.get("/favorites").then((r) => r.data);
export const postReview = (id, body) => api.post(`/businesses/${id}/reviews`, body).then((r) => r.data);
export const getMyReviews = () => api.get("/my/reviews").then((r) => r.data);
export const submitBusiness = (body) => api.post("/businesses/submit", body).then((r) => r.data);
export const getMyListings = () => api.get("/my/listings").then((r) => r.data);

// admin
export const adminStats = () => api.get("/admin/stats").then((r) => r.data);
export const adminIngestStatus = (city) => api.get("/admin/ingest-status", { params: { city } }).then((r) => r.data);
export const adminIngest = (category, city, pages = 1) => api.post("/admin/ingest", null, { params: { category, city, pages } }).then((r) => r.data);
export const adminIngestCity = (city, pages = 1) => api.post("/admin/ingest-city", null, { params: { city, pages } }).then((r) => r.data);
export const adminIngestAll = (pages = 1, skip_done = true) => api.post("/admin/ingest-all", null, { params: { pages, skip_done } }).then((r) => r.data);
export const adminLatestJob = () => api.get("/admin/ingest-jobs/latest").then((r) => r.data);
export const adminCancelJob = () => api.post("/admin/ingest-all/cancel").then((r) => r.data);
export const adminSubmissions = () => api.get("/admin/submissions").then((r) => r.data);
export const adminReviewSubmission = (id, action) => api.post(`/admin/submissions/${id}/${action}`).then((r) => r.data);
export const adminLeads = () => api.get("/admin/leads").then((r) => r.data);
