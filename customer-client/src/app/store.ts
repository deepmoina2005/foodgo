import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import cartReducer from "../features/cart/cartSlice";
import customerReducer from "../features/customer/customerSlice";
import orderReducer from "../features/orders/orderSlice";
import notificationReducer from "../features/notifications/notificationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    customer: customerReducer,
    orders: orderReducer,
    notifications: notificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
