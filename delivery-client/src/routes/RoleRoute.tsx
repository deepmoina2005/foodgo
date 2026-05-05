import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';

export function RoleRoute({ roles }: { roles: string[] }) {
  const role = useAppSelector((state) => state.auth.user?.role);
  return role && roles.includes(role as string) ? <Outlet /> : <Navigate to="/unauthorized" replace />;
}
