import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authApi } from '../../api/authApi';
import { Button, Card } from '../../components/common';
import { PageShell } from '../PageShell';
import { useAppDispatch } from '../../hooks/redux';
import { setCredentials, setAuthError } from '../../features/auth/authSlice';

type AuthForm = {
  name?: string;
  email: string;
  phone?: string;
  password: string;
  role?: 'delivery_partner';
};

export function LoginPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<AuthForm>({ defaultValues: { role: 'delivery_partner' } });
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const onSubmit = async (values: AuthForm) => {
    try {
      const { data } = await authApi.login({ ...values, role: 'delivery_partner' });
      if (data?.data?.user?.role !== 'delivery_partner') {
        throw new Error('This account cannot access this dashboard.');
      }
      dispatch(setCredentials({ token: data.data.token, user: data.data.user }));
      toast.success(data.message);
      navigate('/delivery/dashboard');
    } catch (error: any) {
      dispatch(setAuthError(error?.response?.data?.message ?? error?.message ?? 'Login failed'));
      toast.error(error?.response?.data?.message ?? error?.message ?? 'Login failed');
    }
  };

  return (
    <PageShell 
      centered 
      eyebrow="Authentication" 
      title="Delivery login" 
      description="Sign in to the delivery dashboard only."
    >
      <Card className="mx-auto mt-4 max-w-md p-8 shadow-2xl ring-1 ring-slate-200 dark:ring-white/10">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <input className="w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10" placeholder="Email address" {...register('email')} />
          <input className="w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10" placeholder="Password" type="password" {...register('password')} />
          <input type="hidden" value="delivery_partner" {...register('role')} />
          <Button className="w-full py-4 text-base" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Login'}
          </Button>
        </form>
        <p className="mt-8 text-center text-sm text-slate-600">
          New delivery partner? <Link className="font-bold text-brand-600 hover:underline" to="/signup">Create an account</Link>
        </p>
      </Card>
    </PageShell>
  );
}

export function SignupPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<AuthForm>({ defaultValues: { role: 'delivery_partner' } });
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const onSubmit = async (values: AuthForm) => {
    try {
      const { data } = await authApi.register({ ...values, role: 'delivery_partner' });
      if (data?.data?.user?.role !== 'delivery_partner') {
        throw new Error('This account cannot access this dashboard.');
      }
      dispatch(setCredentials({ token: data.data.token, user: data.data.user }));
      toast.success(data.message);
      navigate('/delivery/dashboard');
    } catch (error: any) {
      dispatch(setAuthError(error?.response?.data?.message ?? error?.message ?? 'Signup failed'));
      toast.error(error?.response?.data?.message ?? error?.message ?? 'Signup failed');
    }
  };

  return (
    <PageShell 
      centered 
      eyebrow="Authentication" 
      title="Create delivery account" 
      description="Create a delivery partner account for the dispatch dashboard."
    >
      <Card className="mx-auto mt-4 max-w-md p-8 shadow-2xl ring-1 ring-slate-200 dark:ring-white/10">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <input className="w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10" placeholder="Full name" {...register('name')} />
          <input className="w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10" placeholder="Email address" {...register('email')} />
          <input className="w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10" placeholder="Phone" {...register('phone')} />
          <input className="w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10" placeholder="Password" type="password" {...register('password')} />
          <input type="hidden" value="delivery_partner" {...register('role')} />
          <Button className="w-full py-4 text-base" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create account'}
          </Button>
        </form>
        <p className="mt-8 text-center text-sm text-slate-600">
          Already have an account? <Link className="font-bold text-brand-600 hover:underline" to="/login">Login</Link>
        </p>
      </Card>
    </PageShell>
  );
}

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
