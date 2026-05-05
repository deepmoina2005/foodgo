import { Navigate, Route, Routes } from 'react-router-dom'; 
import { CustomerLayout, AuthLayout } from '../components/layout';
import { ProtectedRoute } from './ProtectedRoute';
import { CustomerRoute } from './CustomerRoute';
import {
  FoodDetailsPage,
  FoodsPage,
  RestaurantDetailsPage,
  RestaurantsPage,
  CategoryFoodsPage,
} from '../pages/publics';
import {
  LoginPage,
  NotFoundPage,
  SignupPage,
  UnauthorizedPage,
} from '../pages/auth';
import {
  CustomerAddressesPage,
  CustomerCartPage,
  CustomerCheckoutPage,
  CustomerComplaintsPage,
  CustomerInvoicePage,
  CustomerOrderConfirmationPage,
  CustomerOrderDetailsPage,
  CustomerOrderTrackingPage,
  CustomerOrdersPage,
  CustomerProfilePage,
  CustomerNotificationsPage,
} from '../pages/customer';
import { useAppSelector } from '../hooks/redux';
import { CustomerHomePage } from '../pages/customer';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>

      <Route element={<CustomerLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<CustomerHomePage />} />
        <Route path="/restaurants" element={<RestaurantsPage />} />
        <Route path="/restaurants/:id" element={<RestaurantDetailsPage />} />
        <Route path="/restaurants/:id/category/:categoryId" element={<CategoryFoodsPage />} />
        <Route path="/foods" element={<FoodsPage />} />
        <Route path="/foods/:id" element={<FoodDetailsPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<CustomerRoute />}>
            <Route path="/dashboard" element={<CustomerHomePage />} />
            <Route path="/profile" element={<CustomerProfilePage />} />
            <Route path="/addresses" element={<CustomerAddressesPage />} />
            <Route path="/cart" element={<CustomerCartPage />} />
            <Route path="/checkout" element={<CustomerCheckoutPage />} />
            <Route path="/order-confirmation/:id" element={<CustomerOrderConfirmationPage />} />
            <Route path="/orders" element={<CustomerOrdersPage />} />
            <Route path="/orders/:id" element={<CustomerOrderDetailsPage />} />
            <Route path="/orders/:id/track" element={<CustomerOrderTrackingPage />} />
            <Route path="/invoice/:id" element={<CustomerInvoicePage />} />
            <Route path="/complaints" element={<CustomerComplaintsPage />} />
            <Route path="/notifications" element={<CustomerNotificationsPage />} />

            {/* Legacy Redirects */}
            <Route path="/customer/dashboard" element={<Navigate to="/dashboard" replace />} />
            <Route path="/customer/profile" element={<Navigate to="/profile" replace />} />
            <Route path="/customer/addresses" element={<Navigate to="/addresses" replace />} />
            <Route path="/customer/restaurants" element={<Navigate to="/restaurants" replace />} />
            <Route path="/customer/restaurants/:id" element={<RestaurantDetailsPage />} />
            <Route path="/customer/restaurants/:id/category/:categoryId" element={<CategoryFoodsPage />} />
            <Route path="/customer/foods" element={<Navigate to="/foods" replace />} />
            <Route path="/customer/foods/:id" element={<FoodDetailsPage />} />
            <Route path="/customer/cart" element={<Navigate to="/cart" replace />} />
            <Route path="/customer/checkout" element={<Navigate to="/checkout" replace />} />
            <Route path="/customer/orders" element={<Navigate to="/orders" replace />} />
            <Route path="/customer/orders/:id" element={<CustomerOrderDetailsPage />} />
            <Route path="/customer/orders/:id/track" element={<CustomerOrderTrackingPage />} />
            <Route path="/customer/invoice/:id" element={<CustomerInvoicePage />} />
            <Route path="/customer/complaints" element={<Navigate to="/complaints" replace />} />
            <Route path="/customer/notifications" element={<Navigate to="/notifications" replace />} />
            <Route path="/customer/order-confirmation/:id" element={<CustomerOrderConfirmationPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
