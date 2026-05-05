import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type OrderState = {
  orders: Array<Record<string, unknown>>;
  currentOrder: Record<string, unknown> | null;
  status: string;
  error: string | null;
};

const initialState: OrderState = {
  orders: [],
  currentOrder: null,
  status: 'idle',
  error: null,
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders(state, action: PayloadAction<Array<Record<string, unknown>>>) {
      state.orders = action.payload ?? [];
    },
    setCurrentOrder(state, action: PayloadAction<Record<string, unknown> | null>) {
      state.currentOrder = action.payload ?? null;
    },
    resetOrders() {
      return initialState;
    },
  },
});

export const { setOrders, setCurrentOrder, resetOrders } = orderSlice.actions;
export default orderSlice.reducer;
