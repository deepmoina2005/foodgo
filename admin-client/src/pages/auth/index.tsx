import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authApi } from '../../api/authApi';
import { Button, Card } from '../../components/common';
import { PageShell } from '../PageShell';
import { useAppDispatch } from '../../hooks/redux';
import { setCredentials, setAuthError } from '../../features/auth/authSlice';

type AuthForm = {
  email: string;
  password: string;
  role?: 'admin';
};

export function LoginPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<AuthForm>({ defaultValues: { role: 'admin' } });
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const onSubmit = async (values: AuthForm) => {
    try {
      const { data } = await authApi.login({ ...values, role: 'admin' });
      if (data?.data?.user?.role !== 'admin') {
        throw new Error('This account cannot access this dashboard.');
      }
      dispatch(setCredentials({ token: data.data.token, user: data.data.user }));
      toast.success(data.message);
      navigate('/admin/dashboard');
    } catch (error: any) {
      dispatch(setAuthError(error?.response?.data?.message ?? error?.message ?? 'Login failed'));
      toast.error(error?.response?.data?.message ?? error?.message ?? 'Login failed');
    }
  };

  return (
    <PageShell 
      centered 
      eyebrow="Authentication" 
      title="Admin login" 
      description="Sign in to the admin dashboard only. No signup, no OTP, no email verification."
    >
      <Card className="mx-auto mt-4 max-w-md p-8 shadow-2xl ring-1 ring-slate-200 dark:ring-white/10">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <input className="w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10" placeholder="Email address" {...register('email')} />
          <input className="w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10" placeholder="Password" type="password" {...register('password')} />
          <input type="hidden" value="admin" {...register('role')} />
          <Button className="w-full py-4 text-base" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Login'}
          </Button>
        </form>
        <div className="mt-8 rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Admin accounts are provisioned by the system. If you need access, ask a platform owner.
          </p>
        </div>
      </Card>
    </PageShell>
  );
}

export const SignupPage = () => (
  <PageShell centered eyebrow="Access" title="Signup unavailable" description="Admin access is pre-provisioned.">
    <Card className="mx-auto mt-4 max-w-md p-8 shadow-2xl ring-1 ring-slate-200 dark:ring-white/10">
      <p className="text-sm text-slate-600">This dashboard does not allow self-signup.</p>
      <div className="mt-4">
        <Link to="/login">
          <Button>Back to login</Button>
        </Link>
      </div>
    </Card>
  </PageShell>
);

export const UnauthorizedPage = () => (
  <PageShell centered eyebrow="Access" title="Unauthorized" description="You do not have permission to view this page.">
    <Card className="mx-auto mt-4 max-w-md p-8 shadow-2xl ring-1 ring-slate-200 dark:ring-white/10">
      <p className="text-sm text-slate-600">Check your account role or sign in with the correct user type.</p>
      <div className="mt-4">
        <Link to="/login">
          <Button>Back to login</Button>
        </Link>
      </div>
    </Card>
  </PageShell>
);

export const NotFoundPage = () => (
  <PageShell eyebrow="404" title="Page not found" description="The route you requested is not available.">
    <Card>
      <Link to="/">
        <Button>Go home</Button>
      </Link>
    </Card>
  </PageShell>
);
