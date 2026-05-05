import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  restaurantId: null as number | null,
  restaurantName: null as string | null,
  couponCode: null as string | null,
  couponDiscount: 0,
  totalAmount: 0,
  subtotal: 0,
  summary: null as Record<string, unknown> | null,
  items: [] as Array<Record<string, unknown>>,
};

function unwrapCartPayload(payload: any) {
  const cart = payload?.cart?.cart ?? payload?.cart ?? payload ?? {};
  const items = payload?.cart?.items ?? payload?.items ?? cart?.items ?? [];
  const firstItemRestaurant = Array.isArray(items) && items.length ? items[0]?.restaurant_name : null;

  return {
    restaurantId: cart?.restaurant_id ?? null,
    restaurantName: payload?.restaurant?.name ?? payload?.cart?.restaurant_name ?? firstItemRestaurant ?? null,
    couponCode: cart?.coupon_code ?? null,
    couponDiscount: Number(cart?.coupon_discount ?? payload?.coupon_discount ?? 0),
    subtotal: Number(payload?.subtotal ?? payload?.cart?.subtotal ?? cart?.subtotal ?? 0),
    totalAmount: Number(cart?.total_amount ?? payload?.total ?? payload?.cart?.total ?? 0),
    summary: payload?.summary ?? payload?.cart?.summary ?? null,
    items,
  };
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCart(state, action) {
      const cart = unwrapCartPayload(action.payload);
      state.restaurantId = cart.restaurantId;
      state.restaurantName = cart.restaurantName;
      state.couponCode = cart.couponCode;
      state.couponDiscount = cart.couponDiscount;
      state.subtotal = cart.subtotal;
      state.totalAmount = cart.totalAmount;
      state.summary = cart.summary;
      state.items = cart.items;
    },
    clearCartState(state) {
      state.restaurantId = null;
      state.restaurantName = null;
      state.couponCode = null;
      state.couponDiscount = 0;
      state.totalAmount = 0;
      state.subtotal = 0;
      state.summary = null;
      state.items = [];
    },
  },
});

export const { setCart, clearCartState } = cartSlice.actions;
export default cartSlice.reducer;
