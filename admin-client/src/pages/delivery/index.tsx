import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { deliveryApi } from '../../api/deliveryApi';
import { Badge, Button, Card, EmptyState, LoadingState, StatCard, Table } from '../../components/common';
import { PageShell } from '../PageShell';
import { useAppDispatch } from '../../hooks/redux';
import { setDeliveryState } from '../../features/delivery/deliverySlice';
import { currency, dateTime } from '../../utils/format';

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
  if (['delivered', 'paid', 'active', 'approved', 'picked_up'].includes(status)) return 'green' as const;
  if (['cancelled', 'rejected', 'failed', 'suspended'].includes(status)) return 'red' as const;
  return 'orange' as const;
}

export function DeliveryDashboardPage() {
  const dispatch = useAppDispatch();
  const delivery = useAsyncResource<any>(() => Promise.all([deliveryApi.profile(), deliveryApi.orders(), deliveryApi.earnings()]).then(([profile, orders, earnings]) => ({
    profile: profile.data.data.delivery_partner,
    orders: orders.data.data.orders ?? [],
    earnings: earnings.data.data,
  })), []);

  useEffect(() => {
    if (delivery.data) {
      dispatch(setDeliveryState(delivery.data));
    }
  }, [delivery.data, dispatch]);

  return (
    <PageShell eyebrow="Delivery" title="Delivery dashboard" description="View assigned orders, accept deliveries, mark pickup and completion, and track earnings.">
      {delivery.loading ? <LoadingState /> : null}
      {!delivery.loading && delivery.data ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Assigned orders" value={String(delivery.data.orders.length)} />
            <StatCard label="Earnings" value={currency(delivery.data.earnings?.earnings as number)} />
            <StatCard label="Rating" value={String(delivery.data.profile?.rating_average ?? '0.0')} />
          </div>
          <Card className="mt-6">
            <h3 className="text-lg font-bold">Quick actions</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="ghost">Accept assigned delivery</Button>
              <Button variant="ghost">Mark picked up</Button>
              <Button variant="ghost">Mark delivered</Button>
            </div>
          </Card>
        </>
      ) : null}
    </PageShell>
  );
}

export function DeliveryProfilePage() {
  const { data, loading } = useAsyncResource<any>(() => deliveryApi.profile(), []);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<any>();

  useEffect(() => {
    if (data?.delivery_partner) {
      reset({
        full_name: data.delivery_partner.full_name ?? '',
        phone: data.delivery_partner.phone ?? '',
        vehicle_type: data.delivery_partner.vehicle_type ?? '',
      });
    }
  }, [data, reset]);

  const submit = async (values: any) => {
    try {
      await deliveryApi.updateProfile(values);
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to update profile');
    }
  };

  return (
    <PageShell eyebrow="Delivery" title="Profile" description="Update delivery partner profile and account details.">
      {loading ? <LoadingState /> : null}
      {!loading && data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <p className="text-sm text-slate-500">Delivery partner</p>
            <h3 className="mt-2 text-2xl font-black">{data.delivery_partner?.full_name}</h3>
            <p className="text-sm text-slate-600">{data.user?.email}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone={statusTone(data.delivery_partner?.status)}>{data.delivery_partner?.status}</Badge>
              <Badge tone="blue">{data.delivery_partner?.kyc_status}</Badge>
            </div>
          </Card>
          <Card>
            <h3 className="text-lg font-bold">Update profile</h3>
            <form className="mt-4 space-y-3" onSubmit={handleSubmit(submit)}>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Full name" {...register('full_name', { required: true })} />
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Phone" {...register('phone')} />
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Vehicle type" {...register('vehicle_type')} />
              <Button disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update profile'}</Button>
            </form>
          </Card>
        </div>
      ) : null}
    </PageShell>
  );
}

export function DeliveryKycPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<any>();

  const submit = async (values: any) => {
    try {
      const form = new FormData();
      form.append('kyc_status', values.kyc_status ?? 'pending');
      if (values.kyc_document?.[0]) form.append('kyc_document', values.kyc_document[0]);
      await deliveryApi.uploadKyc(form);
      toast.success('KYC uploaded');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to upload KYC');
    }
  };

  return (
    <PageShell eyebrow="Delivery" title="KYC" description="Upload identity and KYC verification documents.">
      <Card className="mx-auto max-w-xl">
        <form className="space-y-3" onSubmit={handleSubmit(submit)}>
          <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" {...register('kyc_status')}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="file" {...register('kyc_document', { required: true })} />
          <Button disabled={isSubmitting}>{isSubmitting ? 'Uploading...' : 'Upload KYC'}</Button>
        </form>
      </Card>
    </PageShell>
  );
}

export function DeliveryOrdersPage() {
  const { data, loading, setData } = useAsyncResource<any>(() => deliveryApi.orders(), []);
  const orders = data?.orders ?? [];

  const refresh = async () => {
    const response = await deliveryApi.orders();
    setData(response.data.data);
  };

  const accept = async (id: number | string) => {
    await deliveryApi.acceptOrder(id);
    toast.success('Delivery accepted');
    await refresh();
  };
  const pickup = async (id: number | string) => {
    await deliveryApi.pickupOrder(id);
    toast.success('Pickup confirmed');
    await refresh();
  };
  const outForDelivery = async (id: number | string) => {
    await deliveryApi.updateStatus(id, { status: 'out_for_delivery' });
    toast.success('Marked out for delivery');
    await refresh();
  };
  const delivered = async (id: number | string) => {
    await deliveryApi.deliveredOrder(id);
    toast.success('Marked delivered');
    await refresh();
  };

  return (
    <PageShell eyebrow="Delivery" title="Assigned orders" description="Accept and complete only orders assigned to you.">
      {loading ? <LoadingState /> : !loading ? (
        <Table
          columns={['Order', 'Status', 'Customer', 'Total', 'Actions']}
          rows={orders.map((order: any) => [
            <span key="a" className="font-semibold">{String(order.order_number)}</span>,
            <Badge key="b" tone={statusTone(order.status)}>{String(order.status)}</Badge>,
            <span key="c">{String(order.customer_name ?? '')}</span>,
            <span key="d">{currency(order.total_amount as number)}</span>,
            <div key="e" className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => accept(order.id)}>Accept</Button>
              <Button variant="ghost" onClick={() => pickup(order.id)}>Pickup</Button>
              <Button variant="ghost" onClick={() => outForDelivery(order.id)}>Out for delivery</Button>
              <Button onClick={() => delivered(order.id)}>Delivered</Button>
            </div>,
          ])}
        />
      ) : null}
    </PageShell>
  );
}

export function DeliveryOrderDetailsPage() {
  const { id } = useParams();
  const { data, loading } = useAsyncResource<any>(() => deliveryApi.order(id as string), [id]);
  const order = data?.order;
  const items = data?.items ?? [];

  return (
    <PageShell eyebrow="Delivery" title={`Order ${id ?? ''}`} description="Review pickup, routing, and delivery status history.">
      {loading ? <LoadingState /> : !loading && order ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h3 className="text-lg font-bold">{order.order_number}</h3>
            <p className="mt-2 text-sm text-slate-600">Customer: {order.customer_name}</p>
            <p className="text-sm text-slate-600">Restaurant: {order.restaurant_name}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone={statusTone(order.status)}>{order.status}</Badge>
              <Badge tone={statusTone(order.assignment_status)}>{order.assignment_status}</Badge>
            </div>
          </Card>
          <Card>
            <h3 className="text-lg font-bold">Items</h3>
            <div className="mt-4 space-y-2">
              {items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>{item.item_name}</span>
                  <span>{item.quantity} x {currency(item.unit_price)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
    </PageShell>
  );
}

export function DeliveryHistoryPage() {
  const { data, loading } = useAsyncResource<any>(() => deliveryApi.history(), []);
  const history = data?.history ?? [];
  return (
    <PageShell eyebrow="Delivery" title="Delivery history" description="Completed deliveries and historical status updates.">
      {loading ? <LoadingState /> : (
        <Table
          columns={['Order', 'Customer', 'Delivered', 'Status']}
          rows={history.map((row: any) => [
            <span key="a" className="font-semibold">{row.order_number}</span>,
            <span key="b">{row.customer_name}</span>,
            <span key="c">{dateTime(row.delivered_at)}</span>,
            <Badge key="d" tone="green">{row.status}</Badge>,
          ])}
        />
      )}
    </PageShell>
  );
}

export function DeliveryEarningsPage() {
  const { data, loading } = useAsyncResource<any>(() => deliveryApi.earnings(), []);
  return (
    <PageShell eyebrow="Delivery" title="Earnings" description="Delivery fee earnings are tracked after completion.">
      {loading ? <LoadingState /> : !loading && data ? (
        <Card className="space-y-2">
          <p className="text-sm text-slate-500">Partner: {data.partner?.full_name}</p>
          <p className="text-3xl font-black text-slate-900">{currency(data.earnings ?? 0)}</p>
        </Card>
      ) : null}
    </PageShell>
  );
}

export function DeliveryRatingsPage() {
  const { data, loading } = useAsyncResource<any>(() => deliveryApi.ratings(), []);
  const ratings = data?.ratings ?? [];
  return (
    <PageShell eyebrow="Delivery" title="Ratings" description="Delivery partner ratings and customer feedback.">
      {loading ? <LoadingState /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {ratings.length ? ratings.map((rating: any) => (
            <Card key={rating.id}>
              <div className="flex items-center justify-between">
                <Badge tone="blue">{rating.rating}/5</Badge>
                <span className="text-xs text-slate-500">{dateTime(rating.created_at)}</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{rating.comment ?? 'No comment'}</p>
            </Card>
          )) : <EmptyState title="No ratings yet" />}
        </div>
      )}
    </PageShell>
  );
}
