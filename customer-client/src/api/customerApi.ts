import { axiosInstance } from "./axiosInstance";

export const customerApi = {
  profile: () => axiosInstance.get("/customer/profile"),
  updateProfile: (payload: FormData | Record<string, unknown>) =>
    payload instanceof FormData
      ? (() => {
          const form = payload;
          form.append("_method", "PUT");
          return axiosInstance.post("/customer/profile", form, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        })()
      : axiosInstance.put("/customer/profile", payload),
  addresses: () => axiosInstance.get("/customer/addresses"),
  createAddress: (payload: unknown) =>
    axiosInstance.post("/customer/addresses", payload),
  updateAddress: (id: number | string, payload: unknown) =>
    axiosInstance.put(`/customer/addresses/${id}`, payload),
  deleteAddress: (id: number | string) =>
    axiosInstance.delete(`/customer/addresses/${id}`),
  setDefaultAddress: (id: number | string) =>
    axiosInstance.patch(`/customer/addresses/${id}/default`),
  restaurants: (params?: Record<string, unknown>) =>
    axiosInstance.get("/customer/restaurants", { params }),
  restaurant: (id: number | string) =>
    axiosInstance.get(`/customer/restaurants/${id}`),
  foods: (params?: Record<string, unknown>) =>
    axiosInstance.get("/customer/foods", { params }),
  food: (id: number | string) => axiosInstance.get(`/customer/foods/${id}`),
  categories: () => axiosInstance.get("/customer/categories"),
  cart: () => axiosInstance.get("/customer/cart"),
  cartSummary: () => axiosInstance.get("/customer/cart/summary"),
  addCartItem: (payload: unknown) =>
    axiosInstance.post("/customer/cart/items", payload),
  updateCartItem: (id: number | string, payload: unknown) =>
    axiosInstance.put(`/customer/cart/items/${id}`, payload),
  removeCartItem: (id: number | string) =>
    axiosInstance.delete(`/customer/cart/items/${id}`),
  clearCart: () => axiosInstance.delete("/customer/cart/clear"),
  applyCoupon: (payload: unknown) =>
    axiosInstance.post("/customer/cart/apply-coupon", payload),
  checkout: (payload: unknown) =>
    axiosInstance.post("/customer/checkout", payload),
  orders: () => axiosInstance.get("/customer/orders"),
  order: (id: number | string) => axiosInstance.get(`/customer/orders/${id}`),
  trackOrder: (id: number | string) =>
    axiosInstance.get(`/customer/orders/${id}/track`),
  cancelOrder: (id: number | string) =>
    axiosInstance.post(`/customer/orders/${id}/cancel`),
  reorder: (id: number | string) =>
    axiosInstance.post(`/customer/orders/${id}/reorder`),
  invoice: (id: number | string) =>
    axiosInstance.get(`/customer/orders/${id}/invoice`),
  reviews: () => axiosInstance.get("/customer/reviews"),
  createReview: (payload: unknown) =>
    axiosInstance.post("/customer/reviews", payload),
  updateReview: (id: number | string, payload: unknown) =>
    axiosInstance.put(`/customer/reviews/${id}`, payload),
  deleteReview: (id: number | string) =>
    axiosInstance.delete(`/customer/reviews/${id}`),
  complaints: () => axiosInstance.get("/customer/complaints"),
  createComplaint: (payload: unknown) =>
    axiosInstance.post("/customer/complaints", payload),
  notifications: () => axiosInstance.get("/notifications"),
  readNotification: (id: number | string) =>
    axiosInstance.patch(`/notifications/${id}/read`),
  readAllNotifications: () => axiosInstance.patch("/notifications/read-all"),
};
