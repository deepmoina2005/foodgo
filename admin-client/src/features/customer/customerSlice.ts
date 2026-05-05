import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  profile: null as Record<string, unknown> | null,
  addresses: [] as Array<Record<string, unknown>>,
  restaurants: [] as Array<Record<string, unknown>>,
  foods: [] as Array<Record<string, unknown>>,
  categories: [] as Array<Record<string, unknown>>,
  orders: [] as Array<Record<string, unknown>>,
  reviews: [] as Array<Record<string, unknown>>,
  complaints: [] as Array<Record<string, unknown>>,
  notifications: [] as Array<Record<string, unknown>>,
  status: "idle",
  error: null as string | null,
};

const customerSlice = createSlice({
  name: "customer",
  initialState,
  reducers: {
    setCustomerState(state, action) {
      Object.assign(state, action.payload);
    },
    resetCustomerState() {
      return initialState;
    },
  },
});

export const { setCustomerState, resetCustomerState } = customerSlice.actions;
export default customerSlice.reducer;
