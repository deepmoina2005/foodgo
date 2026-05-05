import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { customerApi } from '../../api/customerApi';
import { Badge, Button, Card, EmptyState, LoadingState } from '../../components/common';
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




export function CustomerAddressesPage() {
  const { data, loading, error, setData } = useAsyncResource<any>(() => customerApi.addresses(), []);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<any>({ defaultValues: { label: 'Home', is_default: true } });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (editingId && data?.addresses) {
      const address = data.addresses.find((item: any) => Number(item.id) === Number(editingId));
      if (address) {
        reset(address);
      }
    }
  }, [editingId, data, reset]);

  const reload = async () => {
    const response = await customerApi.addresses();
    setData(response.data.data);
  };

  const submit = async (values: any) => {
    try {
      if (editingId) {
        await customerApi.updateAddress(editingId, values);
        toast.success('Address updated');
      } else {
        await customerApi.createAddress(values);
        toast.success('Address created');
      }
      setEditingId(null);
      reset({ label: 'Home', is_default: true });
      await reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to save address');
    }
  };

  const remove = async (id: number) => {
    try {
      await customerApi.deleteAddress(id);
      await reload();
      toast.success('Address deleted');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to delete address');
    }
  };

  const setDefault = async (id: number) => {
    try {
      await customerApi.setDefaultAddress(id);
      await reload();
      toast.success('Default address updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to update default address');
    }
  };

  return (
    <PageShell eyebrow="Customer" title="Addresses" description="Manage delivery addresses and set one as default.">
      {loading ? <LoadingState /> : null}
      {error ? <Card className="border-rose-200 text-rose-700">{error}</Card> : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-bold">{editingId ? 'Edit address' : 'Add new address'}</h3>
          <form className="mt-4 grid gap-3" onSubmit={handleSubmit(submit)}>
            <div className="grid gap-3 md:grid-cols-2">
              <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Label" {...register('label')} />
              <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Name" {...register('name', { required: true })} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Phone" {...register('phone')} />
              <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Postal code" {...register('postal_code', { required: true })} />
            </div>
            <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Address line 1" {...register('line1', { required: true })} />
            <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Address line 2" {...register('line2')} />
            <div className="grid gap-3 md:grid-cols-3">
              <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="City" {...register('city', { required: true })} />
              <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="State" {...register('state', { required: true })} />
              <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Area" {...register('area')} />
            </div>
            <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Landmark" {...register('landmark')} />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" {...register('is_default')} />
              Make default
            </label>
            <div className="flex gap-2">
              <Button disabled={isSubmitting}>{editingId ? 'Update address' : 'Save address'}</Button>
              {editingId ? <Button variant="ghost" type="button" onClick={() => { setEditingId(null); reset({ label: 'Home', is_default: true }); }}>Cancel edit</Button> : null}
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          {data?.addresses?.length ? data.addresses.map((address: any) => (
            <Card key={address.id} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold">{address.label}</h4>
                  <p className="text-sm text-slate-600">{address.line1}</p>
                  <p className="text-sm text-slate-500">{address.city}, {address.state} - {address.postal_code}</p>
                </div>
                {address.is_default ? <Badge tone="green">Default</Badge> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" type="button" onClick={() => { setEditingId(Number(address.id)); reset(address); }}>Edit</Button>
                <Button variant="ghost" type="button" onClick={() => setDefault(Number(address.id))}>Set default</Button>
                <Button variant="danger" type="button" onClick={() => remove(Number(address.id))}>Delete</Button>
              </div>
            </Card>
          )) : <EmptyState title="No addresses saved" description="Add your first delivery address." />}
        </div>
      </div>
    </PageShell>
  );
}

