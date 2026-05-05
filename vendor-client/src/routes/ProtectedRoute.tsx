import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';

export function ProtectedRoute() {
  const token = useAppSelector((state) => state.auth.token);
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}
