import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  dashboard: null as Record<string, unknown> | null,
  customers: [] as Array<Record<string, unknown>>,
  vendors: [] as Array<Record<string, unknown>>,
  deliveryPartners: [] as Array<Record<string, unknown>>,
  categories: [] as Array<Record<string, unknown>>,
  foods: [] as Array<Record<string, unknown>>,
  banners: [] as Array<Record<string, unknown>>,
  orders: [] as Array<Record<string, unknown>>,
  coupons: [] as Array<Record<string, unknown>>,
  payments: [] as Array<Record<string, unknown>>,
  payouts: [] as Array<Record<string, unknown>>,
  complaints: [] as Array<Record<string, unknown>>,
  reports: null as Record<string, unknown> | null,
  status: "idle",
  error: null as string | null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setAdminState(state, action) {
      Object.assign(state, action.payload);
    },
  },
});

export const { setAdminState } = adminSlice.actions;
export default adminSlice.reducer;
