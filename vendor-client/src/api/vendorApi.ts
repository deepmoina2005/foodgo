import { axiosInstance } from "./axiosInstance";

export const vendorApi = {
  profile: () => axiosInstance.get("/vendor/profile"),
  updateProfile: (payload: FormData | Record<string, unknown>) =>
    axiosInstance.put("/vendor/profile", payload, {
      headers: {},
    }),
  restaurant: () => axiosInstance.get("/vendor/restaurant"),
  createRestaurant: (payload: FormData | Record<string, unknown>) =>
    axiosInstance.post("/vendor/restaurant", payload, {
      headers: {},
    }),
  updateRestaurant: (payload: FormData | Record<string, unknown>) =>
    axiosInstance.post("/vendor/restaurant", payload, {
      headers: {},
    }),
  uploadDocuments: (payload: FormData) =>
    axiosInstance.post("/vendor/restaurant/documents", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  categories: () => axiosInstance.get("/categories"),
  foods: (params?: Record<string, unknown>) =>
    axiosInstance.get("/vendor/food-items", { params }),
  createFood: (payload: FormData | Record<string, unknown>) =>
    axiosInstance.post("/vendor/food-items", payload, {
      headers: {},
    }),
  food: (id: number | string) => axiosInstance.get(`/vendor/food-items/${id}`),
  updateFood: (
    id: number | string,
    payload: FormData | Record<string, unknown>,
  ) =>
    axiosInstance.put(`/vendor/food-items/${id}`, payload, {
      headers: {},
    }),
  deleteFood: (id: number | string) =>
    axiosInstance.delete(`/vendor/food-items/${id}`),
  stockFood: (id: number | string) =>
    axiosInstance.patch(`/vendor/food-items/${id}/stock`),
  statusFood: (id: number | string) =>
    axiosInstance.patch(`/vendor/food-items/${id}/status`),
  orders: (params?: Record<string, unknown>) => axiosInstance.get("/vendor/orders", { params }),
  order: (id: number | string) => axiosInstance.get(`/vendor/orders/${id}`),
  acceptOrder: (id: number | string) =>
    axiosInstance.post(`/vendor/orders/${id}/accept`),
  rejectOrder: (id: number | string) =>
    axiosInstance.post(`/vendor/orders/${id}/reject`),
  updateOrderStatus: (id: number | string, payload: unknown) =>
    axiosInstance.patch(`/vendor/orders/${id}/status`, payload),
  invoice: (id: number | string) =>
    axiosInstance.get(`/vendor/orders/${id}/invoice`),
  dashboard: () => axiosInstance.get("/vendor/dashboard"),
  salesReport: () => axiosInstance.get("/vendor/reports/sales"),
  bestSelling: () => axiosInstance.get("/vendor/reports/best-selling"),
  reviews: () => axiosInstance.get("/vendor/reviews"),
  payouts: () => axiosInstance.get("/vendor/payouts"),
  notifications: () => axiosInstance.get("/notifications"),
  readNotification: (id: number | string) =>
    axiosInstance.patch(`/notifications/${id}/read`),
  readAllNotifications: () => axiosInstance.patch("/notifications/read-all"),
};
