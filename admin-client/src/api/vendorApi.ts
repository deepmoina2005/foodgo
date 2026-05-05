import { axiosInstance } from "./axiosInstance";

export const vendorApi = {
  profile: () => axiosInstance.get("/vendor/profile"),
  updateProfile: (payload: FormData | Record<string, unknown>) =>
    axiosInstance.put("/vendor/profile", payload, {
      headers:
        payload instanceof FormData
          ? { "Content-Type": "multipart/form-data" }
          : undefined,
    }),
  restaurant: () => axiosInstance.get("/vendor/restaurant"),
  createRestaurant: (payload: FormData | Record<string, unknown>) =>
    axiosInstance.post("/vendor/restaurant", payload, {
      headers:
        payload instanceof FormData
          ? { "Content-Type": "multipart/form-data" }
          : undefined,
    }),
  updateRestaurant: (payload: FormData | Record<string, unknown>) =>
    axiosInstance.put("/vendor/restaurant", payload, {
      headers:
        payload instanceof FormData
          ? { "Content-Type": "multipart/form-data" }
          : undefined,
    }),
  uploadDocuments: (payload: FormData) =>
    axiosInstance.post("/vendor/restaurant/documents", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  foods: (params?: Record<string, unknown>) =>
    axiosInstance.get("/vendor/food-items", { params }),
  createFood: (payload: FormData | Record<string, unknown>) =>
    axiosInstance.post("/vendor/food-items", payload, {
      headers:
        payload instanceof FormData
          ? { "Content-Type": "multipart/form-data" }
          : undefined,
    }),
  food: (id: number | string) => axiosInstance.get(`/vendor/food-items/${id}`),
  updateFood: (
    id: number | string,
    payload: FormData | Record<string, unknown>,
  ) =>
    axiosInstance.put(`/vendor/food-items/${id}`, payload, {
      headers:
        payload instanceof FormData
          ? { "Content-Type": "multipart/form-data" }
          : undefined,
    }),
  deleteFood: (id: number | string) =>
    axiosInstance.delete(`/vendor/food-items/${id}`),
  stockFood: (id: number | string) =>
    axiosInstance.patch(`/vendor/food-items/${id}/stock`),
  statusFood: (id: number | string) =>
    axiosInstance.patch(`/vendor/food-items/${id}/status`),
  orders: () => axiosInstance.get("/vendor/orders"),
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
};
