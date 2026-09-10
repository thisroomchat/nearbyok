import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, withCredentials: true });
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("nbk_admin_token");
  if (token) config.headers["X-Admin-Token"] = token;
  return config;
});
api.interceptors.response.use((r) => r, (err) => {
  if (err?.response?.status === 401 && err.config?.url?.startsWith("/admin") && sessionStorage.getItem("nbk_admin_token")) {
    sessionStorage.removeItem("nbk_admin_token");
    window.dispatchEvent(new Event("nbk-admin-logout"));
  }
  return Promise.reject(err);
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
export const adminLogin = (username, password) => api.post("/auth/admin-login", { username, password }).then((r) => r.data);
export const adminMe = () => api.get("/auth/admin-me").then((r) => r.data);

// settings & media
export const getPublicSettings = () => api.get("/settings/public").then((r) => r.data);
export const getMediaSignature = (resource_type, purpose) => api.get("/media/signature", { params: { resource_type, purpose } }).then((r) => r.data);
export const deleteMedia = (public_id, resource_type) => api.post("/media/delete", { public_id, resource_type }).then((r) => r.data);

// Signed direct upload to Cloudinary (API secret never leaves the backend).
export const uploadMedia = async (file, purpose, onProgress) => {
  const isVideo = file.type.startsWith("video/");
  const sig = await getMediaSignature(isVideo ? "video" : "image", purpose);
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.api_key);
  form.append("timestamp", sig.timestamp);
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);
  const res = await axios.post(sig.upload_url, form, {
    onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded * 100) / e.total) : 0),
  });
  const d = res.data;
  return {
    url: d.secure_url, public_id: d.public_id, type: isVideo ? "video" : "image",
    thumb: isVideo ? d.secure_url.replace(/\.[a-z0-9]+$/i, ".jpg") : d.secure_url,
    width: d.width, height: d.height, duration: d.duration,
  };
};

// claims & owner
export const claimBusiness = (id, body) => api.post(`/businesses/${id}/claim`, body).then((r) => r.data);
export const getMyClaims = () => api.get("/my/claims").then((r) => r.data);
export const getMyListing = (id) => api.get(`/my/listings/${id}`).then((r) => r.data);
export const updateMyListing = (id, body) => api.put(`/my/listings/${id}`, body).then((r) => r.data);

// admin: claims & settings
export const adminClaims = (status = "") => api.get("/admin/claims", { params: { status } }).then((r) => r.data);
export const adminDecideClaim = (id, action, note = "") => api.post(`/admin/claims/${id}/${action}`, { note }).then((r) => r.data);
export const adminGetSettings = () => api.get("/admin/settings").then((r) => r.data);
export const adminPutSettings = (body) => api.put("/admin/settings", body).then((r) => r.data);
export const adminTestCloudinary = () => api.post("/admin/settings/cloudinary-test").then((r) => r.data);

// admin: console extras
export const adminAnalytics = (days = 30) => api.get("/admin/analytics", { params: { days } }).then((r) => r.data);
export const adminBusinesses = (params) => api.get("/admin/businesses", { params }).then((r) => r.data);
export const adminPatchBusiness = (id, body) => api.patch(`/admin/businesses/${id}`, body).then((r) => r.data);
export const adminDeleteBusiness = (id) => api.delete(`/admin/businesses/${id}`).then((r) => r.data);
export const adminReviews = (params) => api.get("/admin/reviews", { params }).then((r) => r.data);
export const adminDeleteReview = (id) => api.delete(`/admin/reviews/${id}`).then((r) => r.data);
export const adminUsers = (params) => api.get("/admin/users", { params }).then((r) => r.data);
export const adminAudit = () => api.get("/admin/audit").then((r) => r.data);
export const adminLeadsCsvUrl = () => `${API}/admin/leads/export.csv`;
export const adminSeoList = () => api.get("/admin/seo").then((r) => r.data);
export const adminSeoPut = (body) => api.put("/admin/seo", body).then((r) => r.data);
export const adminSeoDelete = (path) => api.delete("/admin/seo", { params: { path } }).then((r) => r.data);
export const adminMediaSignature = (resource_type = "image") => api.get("/admin/media/signature", { params: { resource_type } }).then((r) => r.data);
export const adminUploadSiteImage = async (file) => {
  const sig = await adminMediaSignature("image");
  const form = new FormData();
  form.append("file", file); form.append("api_key", sig.api_key); form.append("timestamp", sig.timestamp); form.append("signature", sig.signature); form.append("folder", sig.folder);
  const res = await axios.post(sig.upload_url, form);
  return res.data.secure_url;
};
export const adminTrends = () => api.get("/admin/trends").then((r) => r.data);
export const adminTrendsUpload = (file, kind) => { const f = new FormData(); f.append("file", file); f.append("kind", kind); return api.post("/admin/trends/upload", f).then((r) => r.data); };
export const adminTrendPatch = (id, body) => api.patch(`/admin/trends/${id}`, body).then((r) => r.data);
export const adminTrendDelete = (id) => api.delete(`/admin/trends/${id}`).then((r) => r.data);
export const adminTrendsBulk = (body) => api.post("/admin/trends/bulk", body).then((r) => r.data);

// public: seo + nearby pages
export const getSeoOverride = (path) => api.get("/seo", { params: { path } }).then((r) => r.data);
export const getNearbyIndex = () => api.get("/nearby").then((r) => r.data);
export const getNearbyPage = (slug, params = {}) => api.get(`/nearby/${slug}`, { params }).then((r) => r.data);

// AI Trip Planner
export const getTripMeta = () => api.get("/trip/meta").then((r) => r.data);
export const getTripPopular = () => api.get("/trip/popular").then((r) => r.data);
export const postTripPlan = (body) => api.post("/trip/plan", body).then((r) => r.data);
export const getTripRoute = (slug) => api.get(`/trip/route/${slug}`).then((r) => r.data);
export const saveTrip = (id) => api.post("/trip/save", { id }).then((r) => r.data);
export const getSavedTrips = () => api.get("/trip/saved").then((r) => r.data);
export const deleteSavedTrip = (id) => api.delete(`/trip/saved/${id}`).then((r) => r.data);

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
