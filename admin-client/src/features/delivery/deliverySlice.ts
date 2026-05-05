import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  profile: null as Record<string, unknown> | null,
  orders: [] as Array<Record<string, unknown>>,
  history: [] as Array<Record<string, unknown>>,
  earnings: null as Record<string, unknown> | null,
  ratings: [] as Array<Record<string, unknown>>,
  kyc: null as Record<string, unknown> | null,
  status: "idle",
  error: null as string | null,
};

const deliverySlice = createSlice({
  name: "delivery",
  initialState,
  reducers: {
    setDeliveryState(state, action) {
      Object.assign(state, action.payload);
    },
  },
});

export const { setDeliveryState } = deliverySlice.actions;
export default deliverySlice.reducer;
