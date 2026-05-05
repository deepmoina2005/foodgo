import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';

export function CustomerRoute() {
  const role = useAppSelector((state) => state.auth.user?.role);
  return role === 'customer' ? <Outlet /> : <Navigate to="/unauthorized" replace />;
}
