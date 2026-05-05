import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  restaurantId: null as number | null,
  couponCode: null as string | null,
  couponDiscount: 0,
  totalAmount: 0,
  items: [] as Array<Record<string, unknown>>,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCart(state, action) {
      state.restaurantId = action.payload?.cart?.restaurant_id ?? null;
      state.couponCode = action.payload?.cart?.coupon_code ?? null;
      state.couponDiscount = Number(action.payload?.cart?.coupon_discount ?? 0);
      state.totalAmount = Number(action.payload?.cart?.total_amount ?? 0);
      state.items = action.payload?.items ?? [];
    },
    clearCartState(state) {
      state.restaurantId = null;
      state.couponCode = null;
      state.couponDiscount = 0;
      state.totalAmount = 0;
      state.items = [];
    },
  },
});

export const { setCart, clearCartState } = cartSlice.actions;
export default cartSlice.reducer;
