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
        if (active) setData(response);
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

export function CustomerComplaintsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useAsyncResource<any>(async () => {
    const [complaintsResponse, ordersResponse] = await Promise.all([customerApi.complaints(), customerApi.orders()]);
    return {
      complaints: complaintsResponse.data.data.complaints ?? [],
      orders: ordersResponse.data.data.orders ?? [],
    };
  }, [refreshKey]);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<any>();

  const submit = async (values: any) => {
    try {
      await customerApi.createComplaint(values);
      toast.success('Complaint submitted');
      reset({});
      setRefreshKey((value) => value + 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to submit complaint');
    }
  };

  return (
    <PageShell eyebrow="Customer" title="Complaints" description="Create support complaints. Admin replies are stored in the database notification flow.">
      {loading ? <LoadingState /> : null}
      {error ? <Card className="border-rose-200 text-rose-700">{error}</Card> : null}
      {!loading && data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h3 className="text-lg font-bold">New complaint</h3>
            <form className="mt-4 space-y-3" onSubmit={handleSubmit(submit)}>
              <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" {...register('order_id')}>
                <option value="">Select order (optional)</option>
                {data.orders.map((order: any) => (
                  <option key={order.id} value={order.id}>
                    {order.order_number} - {order.status}
                  </option>
                ))}
              </select>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Subject" {...register('subject', { required: true })} />
              <textarea className="w-full rounded-2xl border border-slate-200 px-4 py-3" rows={4} placeholder="Description" {...register('description', { required: true })} />
              <Button disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit complaint'}</Button>
            </form>
          </Card>

          <div className="space-y-4">
            {data.complaints.length ? data.complaints.map((complaint: any) => (
              <Card key={complaint.id} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-bold">{complaint.subject}</h4>
                  <Badge tone={statusTone(complaint.status)}>{complaint.status}</Badge>
                </div>
                <p className="text-sm text-slate-600">{complaint.description}</p>
                {complaint.admin_reply ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">Reply: {complaint.admin_reply}</p> : null}
              </Card>
            )) : <EmptyState title="No complaints yet" description="Raise complaints against an order to track replies." />}
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}

