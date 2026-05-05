import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import cartReducer from "../features/cart/cartSlice";
import customerReducer from "../features/customer/customerSlice";
import vendorReducer from "../features/vendor/vendorSlice";
import adminReducer from "../features/admin/adminSlice";
import deliveryReducer from "../features/delivery/deliverySlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    customer: customerReducer,
    vendor: vendorReducer,
    admin: adminReducer,
    delivery: deliveryReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;