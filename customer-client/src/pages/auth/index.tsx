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
  role?: 'customer';
};

function AuthFields({ register, isSignup = false }: { register: ReturnType<typeof useForm<AuthForm>>['register']; isSignup?: boolean }) {
  return (
    <div className="space-y-4">
      {isSignup ? (
        <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Full name" {...register('name')} />
      ) : null}
      <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email address" {...register('email')} />
      {isSignup ? <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Phone" {...register('phone')} /> : null}
      <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Password" type="password" {...register('password')} />
      <input type="hidden" value="customer" {...register('role')} />
    </div>
  );
}

export function LoginPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<AuthForm>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const onSubmit = async (values: AuthForm) => {
    try {
      const { data } = await authApi.login(values);
      dispatch(setCredentials({ token: data.data.token, user: data.data.user }));
      toast.success(data.message);
      navigate('/dashboard');
    } catch (error: any) {
      dispatch(setAuthError(error?.response?.data?.message ?? 'Login failed'));
      toast.error(error?.response?.data?.message ?? 'Login failed');
    }
  };

  return (
    <PageShell 
      centered 
      eyebrow="Authentication" 
      title="Login" 
      description="Sign in to browse restaurants, manage your cart, and track orders. No OTP, no email verification, no forgotten password flow."
    >
      <Card className="mx-auto mt-4 max-w-md p-8 shadow-2xl ring-1 ring-slate-200 dark:ring-white/10">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <AuthFields register={register} />
          <Button className="w-full py-4 text-base" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Login'}
          </Button>
        </form>
        <p className="mt-8 text-center text-sm text-slate-600">
          New here? <Link className="font-bold text-brand-600 hover:underline" to="/signup">Create an account</Link>
        </p>
      </Card>
    </PageShell>
  );
}

export function SignupPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<AuthForm>({ defaultValues: { role: 'customer' } });
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const onSubmit = async (values: AuthForm) => {
    try {
      const { data } = await authApi.register({ ...values, role: 'customer' });
      dispatch(setCredentials({ token: data.data.token, user: data.data.user }));
      toast.success(data.message);
      navigate('/dashboard');
    } catch (error: any) {
      dispatch(setAuthError(error?.response?.data?.message ?? 'Signup failed'));
      toast.error(error?.response?.data?.message ?? 'Signup failed');
    }
  };

  return (
    <PageShell 
      centered 
      eyebrow="Authentication" 
      title="Create account" 
      description="Create a customer account for the storefront. Vendor and delivery onboarding happens in the dashboard app."
    >
      <Card className="mx-auto mt-4 max-w-md p-8 shadow-2xl ring-1 ring-slate-200 dark:ring-white/10">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <AuthFields register={register} isSignup />
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
