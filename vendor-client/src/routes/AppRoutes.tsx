import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardLayout, SiteLayout, AuthLayout } from '../components/layout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import {
  LoginPage,
  NotFoundPage,
  SignupPage,
  UnauthorizedPage,
} from '../pages/auth';
import {
  VendorDashboardPage,
  VendorFoodAddPage,
  VendorFoodEditPage,
  VendorFoodsPage,
  VendorOrderDetailsPage,
  VendorOrdersPage,
  VendorPayoutsPage,
  VendorProfilePage,
  VendorReportsPage,
  VendorRestaurantPage,
  VendorReviewsPage,
  VendorSettingsPage,
} from '../pages/vendor';
import {
  AdminDashboardPage,
  CategoriesPage,
  ComplaintsPage as AdminComplaintsPage,
  CouponsPage,
  CustomersPage,
  DeliveryApprovalsPage,
  DeliveryPartnersPage,
  ReportsPage,
  RestaurantsPage as AdminRestaurantsPage,
  SettingsPage,
  VendorApprovalsPage,
  VendorsPage,
} from '../pages/admin';
import {
  DeliveryDashboardPage,
  DeliveryEarningsPage,
  DeliveryHistoryPage,
  DeliveryOrderDetailsPage,
  DeliveryOrdersPage,
  DeliveryProfilePage,
  DeliveryRatingsPage,
} from '../pages/delivery';
import { useAppSelector } from '../hooks/redux';

function HomeRedirect() {
  const role = useAppSelector((state) => state.auth.user?.role);
  return <Navigate to={role === 'vendor' ? '/vendor/dashboard' : '/login'} replace />;
}

function VendorRoutes() {
  return (
    <Route element={<RoleRoute roles={['vendor']} />}>
      <Route element={<DashboardLayout />}>
        <Route path="/vendor/dashboard" element={<VendorDashboardPage />} />
        <Route path="/vendor/profile" element={<VendorProfilePage />} />
        <Route path="/vendor/restaurant" element={<VendorRestaurantPage />} />
        <Route path="/vendor/foods" element={<VendorFoodsPage />} />
        <Route path="/vendor/foods/add" element={<VendorFoodAddPage />} />
        <Route path="/vendor/foods/:id/edit" element={<VendorFoodEditPage />} />
        <Route path="/vendor/orders" element={<VendorOrdersPage />} />
        <Route path="/vendor/orders/:id" element={<VendorOrderDetailsPage />} />
        <Route path="/vendor/reviews" element={<VendorReviewsPage />} />
        <Route path="/vendor/reports" element={<VendorReportsPage />} />
        <Route path="/vendor/payouts" element={<VendorPayoutsPage />} />
        <Route path="/vendor/settings" element={<VendorSettingsPage />} />
      </Route>
    </Route>
  );
}

function AdminRoutes() {
  return (
    <Route element={<RoleRoute roles={['admin']} />}>
      <Route element={<DashboardLayout />}>
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/customers" element={<CustomersPage />} />
        <Route path="/admin/vendors" element={<VendorsPage />} />
        <Route path="/admin/vendor-approvals" element={<VendorApprovalsPage />} />
        <Route path="/admin/restaurants" element={<AdminRestaurantsPage />} />
        <Route path="/admin/delivery-partners" element={<DeliveryPartnersPage />} />
        <Route path="/admin/delivery-approvals" element={<DeliveryApprovalsPage />} />
        <Route path="/admin/categories" element={<CategoriesPage />} />
        <Route path="/admin/coupons" element={<CouponsPage />} />
        <Route path="/admin/complaints" element={<AdminComplaintsPage />} />
        <Route path="/admin/reports" element={<ReportsPage />} />
        <Route path="/admin/settings" element={<SettingsPage />} />
      </Route>
    </Route>
  );
}

function DeliveryRoutes() {
  return (
    <Route element={<RoleRoute roles={['delivery_partner']} />}>
      <Route element={<DashboardLayout />}>
        <Route path="/delivery/dashboard" element={<DeliveryDashboardPage />} />
        <Route path="/delivery/profile" element={<DeliveryProfilePage />} />
        <Route path="/delivery/orders" element={<DeliveryOrdersPage />} />
        <Route path="/delivery/orders/:id" element={<DeliveryOrderDetailsPage />} />
        <Route path="/delivery/history" element={<DeliveryHistoryPage />} />
        <Route path="/delivery/earnings" element={<DeliveryEarningsPage />} />
        <Route path="/delivery/ratings" element={<DeliveryRatingsPage />} />
      </Route>
    </Route>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        {VendorRoutes()}
        {AdminRoutes()}
        {DeliveryRoutes()}
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
