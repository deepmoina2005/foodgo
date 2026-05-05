import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { customerApi } from '../../api/customerApi';
import { authApi } from '../../api/authApi';
import { Badge, Button, Card,LoadingState } from '../../components/common';
import { PageShell } from '../PageShell';

function useAsyncResource<T>(factory: () => Promise<any>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    factory()
      .then((response) => {
        if (active) setData(response.data.data as T);
      })
      .catch((err) => {
        if (active) setError(err?.response?.data?.message ?? 'Unable to load data');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, setData };
}

function statusTone(status?: string) {
  if (!status) return 'slate' as const;
  const normalized = status.toLowerCase();

  if (['placed'].includes(normalized)) return 'gray' as const;
  if (['accepted'].includes(normalized)) return 'blue' as const;
  if (['preparing'].includes(normalized)) return 'yellow' as const;
  if (['ready'].includes(normalized)) return 'purple' as const;
  if (['assigned'].includes(normalized)) return 'indigo' as const;
  if (['picked_up'].includes(normalized)) return 'cyan' as const;
  if (['out_for_delivery'].includes(normalized)) return 'orange' as const;
  if (['delivered', 'paid', 'active', 'approved', 'resolved'].includes(normalized)) return 'green' as const;
  if (['cancelled', 'rejected', 'blocked', 'failed'].includes(normalized)) return 'red' as const;
  if (['refunded'].includes(normalized)) return 'rose' as const;
  return 'slate' as const;
}



export function CustomerProfilePage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useAsyncResource<any>(() => customerApi.profile(), [refreshKey]);
  const profileForm = useForm<{ name: string; phone?: string; avatar?: FileList }>({ defaultValues: { name: '', phone: '' } });
  const passwordForm = useForm<{ current_password: string; password: string; password_confirmation: string }>({ defaultValues: { current_password: '', password: '', password_confirmation: '' } });
  const { register, handleSubmit, reset, formState: { isSubmitting } } = profileForm;
  const { register: registerPassword, handleSubmit: handleSubmitPassword, reset: resetPassword, formState: { isSubmitting: isChangingPassword } } = passwordForm;

  useEffect(() => {
    if (data?.user) {
      reset({
        name: data.user.name ?? '',
        phone: data.user.phone ?? '',
      });
    }
  }, [data, reset]);

  const updateProfile = async (values: any) => {
    try {
      const form = new FormData();
      form.append('name', values.name);
      form.append('phone', values.phone ?? '');
      if (values.avatar?.[0]) form.append('avatar', values.avatar[0]);
      await customerApi.updateProfile(form);
      toast.success('Profile updated');
      setRefreshKey((value) => value + 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to update profile');
    }
  };

  const changePassword = async (values: any) => {
    try {
      await authApi.changePassword(values);
      toast.success('Password updated');
      resetPassword();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to change password');
    }
  };

  return (
    <PageShell eyebrow="Customer" title="Profile" description="View and update your account details.">
      {loading ? <LoadingState /> : null}
      {error ? <Card className="border-rose-200 text-rose-700">{error}</Card> : null}
      {!loading && data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Account</p>
            <h3 className="mt-2 text-2xl font-black">{data.user?.name}</h3>
            <p className="text-sm text-slate-600">{data.user?.email}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone={statusTone(data.user?.account_status)}>{data.user?.account_status}</Badge>
              <Badge tone="blue">{data.user?.role}</Badge>
            </div>
          </Card>

          <Card className="space-y-4">
            <h3 className="text-lg font-bold">Update profile</h3>
            <form className="space-y-3" onSubmit={handleSubmit(updateProfile)}>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Full name" {...register('name')} />
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Phone" {...register('phone')} />
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="file" {...register('avatar')} />
              <Button disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update profile'}</Button>
            </form>
          </Card>

          <Card className="space-y-4 lg:col-span-2">
            <h3 className="text-lg font-bold">Change password</h3>
            <form className="grid gap-3 md:grid-cols-3" onSubmit={handleSubmitPassword(changePassword)}>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Current password" type="password" {...registerPassword('current_password')} />
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="New password" type="password" {...registerPassword('password')} />
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Confirm password" type="password" {...registerPassword('password_confirmation')} />
              <div>
                <Button disabled={isChangingPassword}>{isChangingPassword ? 'Saving...' : 'Change password'}</Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </PageShell>
  );
}

