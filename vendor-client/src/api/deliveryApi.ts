import { axiosInstance } from "./axiosInstance";

export const deliveryApi = {
  profile: () => axiosInstance.get("/delivery/profile"),
  updateProfile: (payload: FormData | Record<string, unknown>) =>
    axiosInstance.put("/delivery/profile", payload, {
      headers:
        payload instanceof FormData
          ? { "Content-Type": "multipart/form-data" }
          : undefined,
    }),
  uploadKyc: (payload: FormData) =>
    axiosInstance.post("/delivery/kyc", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  orders: () => axiosInstance.get("/delivery/orders"),
  order: (id: number | string) => axiosInstance.get(`/delivery/orders/${id}`),
  acceptOrder: (id: number | string) =>
    axiosInstance.post(`/delivery/orders/${id}/accept`),
  pickupOrder: (id: number | string) =>
    axiosInstance.patch(`/delivery/orders/${id}/pickup`),
  updateStatus: (id: number | string, payload: unknown) =>
    axiosInstance.patch(`/delivery/orders/${id}/status`, payload),
  deliveredOrder: (id: number | string) =>
    axiosInstance.patch(`/delivery/orders/${id}/delivered`),
  history: () => axiosInstance.get("/delivery/history"),
  earnings: () => axiosInstance.get("/delivery/earnings"),
  ratings: () => axiosInstance.get("/delivery/ratings"),
};
