import { axiosInstance } from "./axiosInstance";

export const adminApi = {
  dashboard: () => axiosInstance.get("/admin/dashboard"),
  customers: () => axiosInstance.get("/admin/customers"),
  customer: (id: number | string) =>
    axiosInstance.get(`/admin/customers/${id}`),
  blockCustomer: (id: number | string) =>
    axiosInstance.patch(`/admin/customers/${id}/block`),
  unblockCustomer: (id: number | string) =>
    axiosInstance.patch(`/admin/customers/${id}/unblock`),
  customerOrders: (id: number | string) =>
    axiosInstance.get(`/admin/customers/${id}/orders`),
  vendors: () => axiosInstance.get("/admin/vendors"),
  pendingVendors: () => axiosInstance.get("/admin/vendors/pending"),
  vendor: (id: number | string) => axiosInstance.get(`/admin/vendors/${id}`),
  approveVendor: (id: number | string) =>
    axiosInstance.post(`/admin/vendors/${id}/approve`),
  rejectVendor: (id: number | string) =>
    axiosInstance.post(`/admin/vendors/${id}/reject`),
  suspendVendor: (id: number | string) =>
    axiosInstance.patch(`/admin/vendors/${id}/suspend`),
  deleteVendor: (id: number | string) =>
    axiosInstance.delete(`/admin/vendors/${id}`),
  updateVendorCommission: (id: number | string, payload: unknown) =>
    axiosInstance.patch(`/admin/vendors/${id}/commission`, payload),
  verifyVendorDocuments: (id: number | string) =>
    axiosInstance.patch(`/admin/vendors/${id}/verify-documents`),
  restaurants: () => axiosInstance.get("/admin/restaurants"),
  restaurant: (id: number | string) =>
    axiosInstance.get(`/admin/restaurants/${id}`),
  suspendRestaurant: (id: number | string) =>
    axiosInstance.patch(`/admin/restaurants/${id}/suspend`),
  activateRestaurant: (id: number | string) =>
    axiosInstance.patch(`/admin/restaurants/${id}/activate`),
  deleteRestaurant: (id: number | string) =>
    axiosInstance.delete(`/admin/restaurants/${id}`),
  updateRestaurant: (id: number | string, payload: unknown) =>
    axiosInstance.put(`/admin/restaurants/${id}`, payload),
  deliveryPartners: () => axiosInstance.get("/admin/delivery-partners"),
  pendingDeliveryPartners: () =>
    axiosInstance.get("/admin/delivery-partners/pending"),
  deliveryPartner: (id: number | string) =>
    axiosInstance.get(`/admin/delivery-partners/${id}`),
  approveDeliveryPartner: (id: number | string) =>
    axiosInstance.post(`/admin/delivery-partners/${id}/approve`),
  rejectDeliveryPartner: (id: number | string) =>
    axiosInstance.post(`/admin/delivery-partners/${id}/reject`),
  suspendDeliveryPartner: (id: number | string) =>
    axiosInstance.patch(`/admin/delivery-partners/${id}/suspend`),
  deliveryRequests: (params?: Record<string, unknown>) =>
    axiosInstance.get("/admin/delivery-requests", { params }),
  categories: () => axiosInstance.get("/admin/categories"),
  createCategory: (payload: FormData | Record<string, unknown>) =>
    axiosInstance.post("/admin/categories", payload, {
      headers:
        payload instanceof FormData
          ? { "Content-Type": "multipart/form-data" }
          : undefined,
    }),
  updateCategory: (
    id: number | string,
    payload: FormData | Record<string, unknown>,
  ) =>
    axiosInstance.put(`/admin/categories/${id}`, payload, {
      headers:
        payload instanceof FormData
          ? { "Content-Type": "multipart/form-data" }
          : undefined,
    }),
  deleteCategory: (id: number | string) =>
    axiosInstance.delete(`/admin/categories/${id}`),
  foods: () => axiosInstance.get("/admin/food-items"),
  food: (id: number | string) => axiosInstance.get(`/admin/food-items/${id}`),
  disableFood: (id: number | string) =>
    axiosInstance.patch(`/admin/food-items/${id}/disable`),
  enableFood: (id: number | string) =>
    axiosInstance.patch(`/admin/food-items/${id}/enable`),
  deleteFood: (id: number | string) =>
    axiosInstance.delete(`/admin/food-items/${id}`),
  banners: () => axiosInstance.get("/admin/banners"),
  createBanner: (payload: FormData | Record<string, unknown>) =>
    axiosInstance.post("/admin/banners", payload, {
      headers:
        payload instanceof FormData
          ? { "Content-Type": "multipart/form-data" }
          : undefined,
    }),
  updateBanner: (
    id: number | string,
    payload: FormData | Record<string, unknown>,
  ) =>
    axiosInstance.put(`/admin/banners/${id}`, payload, {
      headers:
        payload instanceof FormData
          ? { "Content-Type": "multipart/form-data" }
          : undefined,
    }),
  deleteBanner: (id: number | string) =>
    axiosInstance.delete(`/admin/banners/${id}`),
  toggleBanner: (id: number | string) =>
    axiosInstance.patch(`/admin/banners/${id}/status`),
  orders: (params?: Record<string, unknown>) => axiosInstance.get("/admin/orders", { params }),
  order: (id: number | string) => axiosInstance.get(`/admin/orders/${id}`),
  trackOrder: (id: number | string) =>
    axiosInstance.get(`/admin/orders/${id}/track`),
  cancelOrder: (id: number | string) =>
    axiosInstance.post(`/admin/orders/${id}/cancel`),
  refundOrder: (id: number | string, payload: unknown) =>
    axiosInstance.post(`/admin/orders/${id}/refund`, payload),
  coupons: () => axiosInstance.get("/admin/coupons"),
  createCoupon: (payload: unknown) =>
    axiosInstance.post("/admin/coupons", payload),
  updateCoupon: (id: number | string, payload: unknown) =>
    axiosInstance.put(`/admin/coupons/${id}`, payload),
  deleteCoupon: (id: number | string) =>
    axiosInstance.delete(`/admin/coupons/${id}`),
  toggleCoupon: (id: number | string) =>
    axiosInstance.patch(`/admin/coupons/${id}/status`),
  payments: () => axiosInstance.get("/admin/payments"),
  commissions: () => axiosInstance.get("/admin/commissions"),
  payouts: () => axiosInstance.get("/admin/vendor-payouts"),
  createPayout: (payload: unknown) =>
    axiosInstance.post("/admin/vendor-payouts", payload),
  updatePayout: (id: number | string, payload: unknown) =>
    axiosInstance.patch(`/admin/vendor-payouts/${id}/status`, payload),
  complaints: () => axiosInstance.get("/admin/complaints"),
  complaint: (id: number | string) =>
    axiosInstance.get(`/admin/complaints/${id}`),
  replyComplaint: (id: number | string, payload: unknown) =>
    axiosInstance.post(`/admin/complaints/${id}/reply`, payload),
  updateComplaintStatus: (id: number | string, payload: unknown) =>
    axiosInstance.patch(`/admin/complaints/${id}/status`, payload),
  reportDailySales: () => axiosInstance.get("/admin/reports/daily-sales"),
  reportMonthlyRevenue: () =>
    axiosInstance.get("/admin/reports/monthly-revenue"),
  reportVendorSales: () => axiosInstance.get("/admin/reports/vendor-sales"),
  reportCommission: () => axiosInstance.get("/admin/reports/commission"),
  reportCancellations: () => axiosInstance.get("/admin/reports/cancellations"),
  reportPayments: () => axiosInstance.get("/admin/reports/payments"),
  notifications: () => axiosInstance.get("/notifications"),
  readNotification: (id: number | string) =>
    axiosInstance.patch(`/notifications/${id}/read`),
  readAllNotifications: () => axiosInstance.patch("/notifications/read-all"),
};
