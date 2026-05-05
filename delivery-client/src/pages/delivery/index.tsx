import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
        const value = response?.data?.data ?? response;
        if (active) setData(value as T);
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

function fallbackResponse<T>(data: T) {
  return { data: { data } } as any;
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
  if (['delivered', 'paid', 'active', 'approved'].includes(normalized)) return 'green' as const;
  if (['cancelled', 'rejected', 'failed', 'suspended'].includes(normalized)) return 'red' as const;
  if (['refunded'].includes(normalized)) return 'rose' as const;
  return 'slate' as const;
}

function isActiveOrder(order: any) {
  return ['assigned', 'accepted', 'picked_up', 'out_for_delivery'].includes(String(order?.status ?? ''));
}

function locationLabel(partner: any) {
  return [partner?.city, partner?.area].filter(Boolean).join(' / ') || 'Location not set';
}

function requestConflictMessage(err: any) {
  if (err?.response?.status === 409) {
    return 'Already accepted by another delivery partner.';
  }

  return err?.response?.data?.message ?? 'Unable to accept pickup request';
}

function orderTimelineLabel(status: string) {
  const labels: Record<string, string> = {
    placed: 'Placed',
    accepted: 'Accepted',
    preparing: 'Preparing',
    ready: 'Ready',
    waiting_for_delivery_partner: 'Waiting for delivery partner',
    assigned: 'Delivery partner assigned',
    picked_up: 'Picked up',
    out_for_delivery: 'Out for delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  return labels[status] ?? status;
}

function canMarkPickedUp(order: any) {
  return ['assigned', 'ready'].includes(String(order?.status ?? '')) && String(order?.assignment_status ?? '') === 'accepted';
}

const panelClass = 'rounded-3xl border border-[color:var(--app-border)] bg-[var(--app-surface-soft)] p-4';
const fieldClass =
  'w-full rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface-strong)] px-4 py-3 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-muted)] focus:border-brand-400 focus:ring-4 focus:ring-brand-100/40';

export function DeliveryDashboardPage() {
  const dispatch = useAppDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const delivery = useAsyncResource<any>(() => Promise.all([
    deliveryApi.profile().catch(() => fallbackResponse({ user: null, delivery_partner: null })),
    deliveryApi.orders().catch(() => fallbackResponse({ orders: [] })),
    deliveryApi.earnings().catch(() => fallbackResponse({ partner: null, earnings: 0 })),
    deliveryApi.availableRequests().catch(() => ({ data: { data: { requests: [], count: 0 } } })),
  ]).then(([profile, orders, earnings, requests]) => ({
    profile: profile.data.data.delivery_partner,
    orders: orders.data.data.orders ?? [],
    earnings: earnings.data.data,
    requests: requests.data.data.requests ?? [],
    request_count: requests.data.data.count ?? 0,
  })), [refreshKey]);

  useEffect(() => {
    if (delivery.data) {
      dispatch(setDeliveryState(delivery.data));
    }
  }, [delivery.data, dispatch]);

  const profile = delivery.data?.profile;
  const orders = delivery.data?.orders ?? [];
  const requests = delivery.data?.requests ?? [];
  const completedOrders = orders.filter((order: any) => String(order.status) === 'delivered');
  const activeOrder = orders.find((order: any) => isActiveOrder(order));
  const toggleAvailability = async () => {
    if (!profile) return;
    try {
      await deliveryApi.updateAvailability({ is_available: !profile.is_available });
      toast.success(profile.is_available ? 'Marked offline' : 'Marked online');
      setRefreshKey((value) => value + 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to update availability');
    }
  };

  return (
    <PageShell eyebrow="Delivery" title="Delivery dashboard" description="Manage your online status, accept assigned orders, update delivery progress, and track earnings.">
      {delivery.loading ? <LoadingState /> : null}
      {!delivery.loading && delivery.data ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="Available requests" value={String(delivery.data.request_count ?? requests.length)} />
            <StatCard label="Current delivery" value={activeOrder ? String(activeOrder.order_number) : 'None'} />
            <StatCard label="Completed deliveries" value={String(completedOrders.length)} />
            <StatCard label="Earnings" value={currency(delivery.data.earnings?.earnings as number)} />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-[var(--app-muted)]">Partner status</p>
                  <h3 className="text-2xl font-black">{profile?.full_name}</h3>
                </div>
                <Button variant={profile?.is_available ? 'ghost' : 'primary'} onClick={toggleAvailability} disabled={Boolean(activeOrder)}>
                  {profile?.is_available ? 'Go offline' : 'Go online'}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone={statusTone(profile?.status)}>{profile?.status}</Badge>
                <Badge tone={profile?.is_available ? 'green' : 'slate'}>{profile?.is_available ? 'Online' : 'Offline'}</Badge>
                <Badge tone="blue">{profile?.kyc_status}</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface-soft)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">Vehicle</p>
                  <p className="mt-1 font-semibold">{profile?.vehicle_type ?? '-'}</p>
                </div>
                <div className="rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface-soft)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">Location</p>
                  <p className="mt-1 font-semibold">{locationLabel(profile)}</p>
                </div>
              </div>
            </Card>

            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-[var(--app-muted)]">Current delivery</p>
                  <h3 className="text-xl font-bold">{activeOrder ? activeOrder.order_number : 'No active order'}</h3>
                </div>
                {activeOrder ? <Badge tone={statusTone(activeOrder.assignment_status)}>{activeOrder.assignment_status}</Badge> : null}
              </div>
              {activeOrder ? (
                <div className="space-y-3 rounded-3xl bg-[var(--app-surface-soft)] p-4">
                  <p className="font-semibold">{activeOrder.restaurant_name}</p>
                  <p className="text-sm text-[var(--app-muted)]">Customer: {activeOrder.customer_name}</p>
                  <p className="text-sm text-[var(--app-muted)]">Status: {activeOrder.status}</p>
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/delivery/orders/${activeOrder.id}`}>
                      <Button variant="ghost">Open order</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <EmptyState title="No active order" description="Pickup requests will appear in the pickup requests section once a vendor marks an order ready." />
              )}
            </Card>
          </div>

          <Card className="mt-6">
            <h3 className="text-lg font-bold">Quick actions</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/delivery/available-requests"><Button variant="ghost">Pickup requests</Button></Link>
              <Link to="/delivery/orders"><Button variant="ghost">View orders</Button></Link>
              <Link to="/delivery/notifications"><Button variant="ghost">Notifications</Button></Link>
              <Link to="/delivery/history"><Button variant="ghost">History</Button></Link>
              <Link to="/delivery/profile"><Button variant="ghost">Edit profile</Button></Link>
            </div>
          </Card>
        </>
      ) : null}
    </PageShell>
  );
}

export function DeliveryAvailableRequestsPage() {
  const navigate = useNavigate();
  const { data, loading, error } = useAsyncResource<any>(() => deliveryApi.availableRequests(), []);
  const requests = data?.requests ?? [];

  const accept = async (id: number | string) => {
    try {
      const response = await deliveryApi.acceptAvailableRequest(id);
      toast.success('Pickup request accepted');
      const orderId = response.data?.data?.order_id;
      if (orderId) {
        navigate(`/delivery/orders/${orderId}`);
      } else {
        navigate('/delivery/orders');
      }
    } catch (err: any) {
      toast.error(requestConflictMessage(err));
    }
  };

  return (
    <PageShell eyebrow="Delivery" title="Available pickup requests" description="Open pickup requests from ready orders that are available to approved delivery partners.">
      {loading ? <LoadingState /> : null}
      {error ? <Card className="border-rose-200 text-rose-700">{error}</Card> : null}
      {!loading && !error ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Open requests" value={String(requests.length)} />
            <StatCard label="Status" value={data?.delivery_partner?.is_available ? 'Online' : 'Offline'} />
            <StatCard label="Location" value={locationLabel(data?.delivery_partner)} />
          </div>

          {requests.length ? (
            <Table
              columns={['Order', 'Restaurant', 'Area', 'Status', 'Amount', 'Distance', 'Actions']}
              rows={requests.map((request: any) => [
                <span key="a" className="font-semibold">{request.order_number}</span>,
                <span key="b">{request.restaurant_name}</span>,
                <span key="c">{[request.request_city, request.request_area].filter(Boolean).join(' / ') || '-'}</span>,
                <Badge key="d" tone={statusTone(request.order_status)}>{request.order_status}</Badge>,
                <span key="e">{currency(request.total_amount)}</span>,
                <span key="f">{request.distance === null ? '-' : String(request.distance.toFixed ? request.distance.toFixed(3) : request.distance)}</span>,
                <div key="g" className="flex flex-wrap gap-2">
                  <Link to={`/delivery/available-requests/${request.request_id}`}><Button variant="ghost">Details</Button></Link>
                  <Button onClick={() => accept(request.request_id)}>Accept pickup</Button>
                </div>,
              ])}
            />
          ) : (
            <EmptyState
              title="No pickup requests"
              description={`New requests will appear here when a vendor marks an order ready. Current location: ${locationLabel(data?.delivery_partner)}.`}
            />
          )}
        </div>
      ) : null}
    </PageShell>
  );
}

export function DeliveryAvailableRequestDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useAsyncResource<any>(() => deliveryApi.availableRequest(id as string), [id]);
  const request = data?.request;

  const accept = async () => {
    if (!request) return;
    try {
      await deliveryApi.acceptAvailableRequest(request.request_id);
      toast.success('Pickup request accepted');
      navigate(`/delivery/orders/${request.order_id}`);
    } catch (err: any) {
      toast.error(requestConflictMessage(err));
    }
  };

  return (
      <PageShell eyebrow="Delivery" title="Pickup request details" description="Review the pickup request before accepting it.">
      {loading ? <LoadingState /> : null}
      {error ? <Card className="border-rose-200 text-rose-700">{error}</Card> : null}
      {!loading && request ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-3">
            <h3 className="text-lg font-bold">{request.order_number}</h3>
            <div className="space-y-2 text-sm text-[var(--app-muted)]">
              <p><span className="font-semibold">Restaurant:</span> {request.restaurant_name}</p>
              <p><span className="font-semibold">Pickup address:</span> {request.pickup_address}</p>
              <p><span className="font-semibold">Customer area:</span> {[request.customer_city, request.customer_area].filter(Boolean).join(' / ') || '-'}</p>
              <p><span className="font-semibold">Customer address:</span> {[request.customer_address_line, request.customer_landmark].filter(Boolean).join(' - ') || '-'}</p>
              <p><span className="font-semibold">Order amount:</span> {currency(request.total_amount)}</p>
              <p><span className="font-semibold">Current order status:</span> {request.order_status}</p>
              <p><span className="font-semibold">Estimated pickup readiness:</span> {request.estimated_pickup_ready_at ? dateTime(request.estimated_pickup_ready_at) : 'Not available yet'}</p>
              <p><span className="font-semibold">Distance:</span> {request.distance === null ? 'Not available' : String(request.distance.toFixed ? request.distance.toFixed(3) : request.distance)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={accept}>Accept pickup</Button>
              <Link to="/delivery/available-requests"><Button variant="ghost">Back</Button></Link>
            </div>
          </Card>
          <Card className="space-y-3">
            <h3 className="text-lg font-bold">Request summary</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface-soft)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Request status</p>
                <p className="mt-1 font-semibold">{request.request_status}</p>
              </div>
              <div className="rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface-soft)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Expires at</p>
                <p className="mt-1 font-semibold">{request.expires_at ? dateTime(request.expires_at) : '-'}</p>
              </div>
            </div>
            <EmptyState title="First accept wins" description="If another partner accepts first, this request will immediately become unavailable." />
          </Card>
        </div>
      ) : null}
    </PageShell>
  );
}

export function DeliveryProfilePage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading } = useAsyncResource<any>(() => deliveryApi.profile(), [refreshKey]);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<any>();

  useEffect(() => {
      if (data?.delivery_partner) {
        reset({
          full_name: data.delivery_partner.full_name ?? '',
          phone: data.delivery_partner.phone ?? '',
          vehicle_type: data.delivery_partner.vehicle_type ?? '',
          city: data.delivery_partner.city ?? '',
          area: data.delivery_partner.area ?? '',
          latitude: data.delivery_partner.latitude ?? '',
          longitude: data.delivery_partner.longitude ?? '',
        });
      }
    }, [data, reset]);

  const isBusyWithOrder = Boolean(!data?.delivery_partner?.is_available && data?.delivery_partner?.current_order_id);

  const toggleAvailability = async () => {
    if (!data?.delivery_partner) return;
    if (isBusyWithOrder) {
      toast.error('You cannot go online while an order is active.');
      return;
    }
    try {
      await deliveryApi.updateAvailability({ is_available: !data.delivery_partner.is_available });
      toast.success(data.delivery_partner.is_available ? 'Marked offline' : 'Marked online');
      setRefreshKey((value) => value + 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to update availability');
    }
  };

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
            <p className="text-sm text-[var(--app-muted)]">Delivery partner</p>
            <h3 className="mt-2 text-2xl font-black">{data.delivery_partner?.full_name}</h3>
            <p className="text-sm text-[var(--app-muted)]">{data.user?.email}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone={statusTone(data.delivery_partner?.status)}>{data.delivery_partner?.status}</Badge>
              <Badge tone={data.delivery_partner?.is_available ? 'green' : 'slate'}>{data.delivery_partner?.is_available ? 'Online' : 'Offline'}</Badge>
              <Badge tone="blue">{data.delivery_partner?.kyc_status}</Badge>
            </div>
            <div className={panelClass}>
              <p className="text-sm text-[var(--app-muted)]">Service area</p>
              <p className="mt-1 font-semibold">{locationLabel(data.delivery_partner)}</p>
              <p className="text-sm text-[var(--app-muted)]">Latitude: {data.delivery_partner?.latitude ?? '-'}</p>
              <p className="text-sm text-[var(--app-muted)]">Longitude: {data.delivery_partner?.longitude ?? '-'}</p>
              <div className="mt-4">
                {isBusyWithOrder ? (
                  <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
                    <p className="text-sm font-semibold">Busy with active order</p>
                    <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-100/80">You can go online again after this delivery is completed.</p>
                  </div>
                ) : null}
                <Button
                  type="button"
                  variant={data.delivery_partner?.is_available ? 'ghost' : isBusyWithOrder ? 'secondary' : 'primary'}
                  onClick={toggleAvailability}
                  disabled={isBusyWithOrder}
                >
                  {data.delivery_partner?.is_available ? 'Go offline' : isBusyWithOrder ? 'Busy with order' : 'Go online'}
                </Button>
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="text-lg font-bold">Update profile</h3>
            <form className="mt-4 space-y-3" onSubmit={handleSubmit(submit)}>
              <input className={fieldClass} placeholder="Full name" {...register('full_name', { required: true })} />
              <input className={fieldClass} placeholder="Phone" {...register('phone')} />
              <input className={fieldClass} placeholder="Vehicle type" {...register('vehicle_type')} />
              <input className={fieldClass} placeholder="City" {...register('city')} />
              <input className={fieldClass} placeholder="Area" {...register('area')} />
              <div className="grid gap-3 md:grid-cols-2">
                <input className={fieldClass} placeholder="Latitude" {...register('latitude')} />
                <input className={fieldClass} placeholder="Longitude" {...register('longitude')} />
              </div>
              <Button disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update profile'}</Button>
            </form>
          </Card>
        </div>
      ) : null}
    </PageShell>
  );
}

export function DeliveryKycPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading } = useAsyncResource<any>(() => deliveryApi.profile(), [refreshKey]);
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
      {loading ? <LoadingState /> : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3">
          <p className="text-sm text-[var(--app-muted)]">Current verification</p>
          <h3 className="text-2xl font-black">{data?.delivery_partner?.full_name}</h3>
          <div className="flex flex-wrap gap-2">
            <Badge tone={statusTone(data?.delivery_partner?.status)}>{data?.delivery_partner?.status}</Badge>
            <Badge tone={statusTone(data?.delivery_partner?.kyc_status)}>{data?.delivery_partner?.kyc_status}</Badge>
          </div>
          <p className="text-sm text-[var(--app-muted)]">Upload identity documents so admin can approve your account faster.</p>
        </Card>
        <Card>
          <form className="space-y-3" onSubmit={handleSubmit(async (values) => {
            await submit(values);
            setRefreshKey((value) => value + 1);
          })}>
            <select className={fieldClass} {...register('kyc_status')}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <input className={fieldClass} type="file" {...register('kyc_document', { required: true })} />
            <Button disabled={isSubmitting}>{isSubmitting ? 'Uploading...' : 'Upload KYC'}</Button>
          </form>
        </Card>
      </div>
    </PageShell>
  );
}

export function DeliveryOrdersPage() {
  const { data, loading, setData } = useAsyncResource<any>(() => deliveryApi.orders(), []);
  const orders = data?.orders ?? [];
  const activeOrders = orders.filter((order: any) => isActiveOrder(order));

  const refresh = async () => {
    const response = await deliveryApi.orders();
    setData(response.data.data);
  };

  const pickup = async (id: number | string) => {
    try {
      await deliveryApi.pickupOrder(id);
      toast.success('Pickup confirmed');
      await refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to mark pickup');
    }
  };
  const outForDelivery = async (id: number | string) => {
    try {
      await deliveryApi.updateStatus(id, { status: 'out_for_delivery' });
      toast.success('Marked out for delivery');
      await refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to update status');
    }
  };
  const delivered = async (id: number | string) => {
    try {
      await deliveryApi.deliveredOrder(id);
      toast.success('Marked delivered');
      await refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to complete delivery');
    }
  };

  return (
    <PageShell eyebrow="Delivery" title="My current orders" description="Manage assigned deliveries after you accept a pickup request.">
      {loading ? <LoadingState /> : !loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Active orders" value={String(activeOrders.length)} />
            <StatCard label="Completed" value={String(orders.filter((order: any) => order.status === 'delivered').length)} />
            <StatCard label="Ready to pickup" value={String(orders.filter((order: any) => canMarkPickedUp(order)).length)} />
          </div>
          {activeOrders.length ? (
            <Card>
              <h3 className="text-lg font-bold">Current active order</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {activeOrders.slice(0, 1).map((order: any) => (
                  <div key={order.id} className="rounded-3xl border border-[color:var(--app-border)] bg-[var(--app-surface-soft)] p-4">
                    <p className="font-semibold">{order.order_number}</p>
                    <p className="text-sm text-[var(--app-muted)]">{order.restaurant_name}</p>
                    <p className="text-sm text-[var(--app-muted)]">{order.customer_name}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone={statusTone(order.status)}>{order.status}</Badge>
                      <Badge tone={statusTone(order.assignment_status)}>{order.assignment_status ?? 'assigned'}</Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link to={`/delivery/orders/${order.id}`}><Button variant="ghost">Open</Button></Link>
              {['assigned', 'ready'].includes(String(order.status)) && order.assignment_status === 'accepted' ? <Button variant="ghost" onClick={() => pickup(order.id)}>Mark picked up</Button> : null}
                      {order.status === 'picked_up' ? <Button variant="ghost" onClick={() => outForDelivery(order.id)}>Out for delivery</Button> : null}
                      {order.status === 'out_for_delivery' ? <Button onClick={() => delivered(order.id)}>Delivered</Button> : null}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <EmptyState title="No current delivery" description="Open pickup requests are listed separately. Once accepted, the order appears here." />
          )}
          <Table
            columns={['Order', 'Order status', 'Assignment', 'Customer', 'Total', 'Actions']}
            rows={orders.map((order: any) => [
              <span key="a" className="font-semibold">{String(order.order_number)}</span>,
              <Badge key="b" tone={statusTone(order.status)}>{String(order.status)}</Badge>,
              <Badge key="c" tone={statusTone(order.assignment_status)}>{String(order.assignment_status ?? 'assigned')}</Badge>,
              <span key="d">{String(order.customer_name ?? '')}</span>,
              <span key="e">{currency(order.total_amount as number)}</span>,
              <div key="f" className="flex flex-wrap gap-2">
                <Link to={`/delivery/orders/${order.id}`}><Button variant="ghost">Details</Button></Link>
                {['assigned', 'ready'].includes(String(order.status)) && order.assignment_status === 'accepted' ? <Button variant="ghost" onClick={() => pickup(order.id)}>Mark picked up</Button> : null}
                {order.status === 'picked_up' ? <Button variant="ghost" onClick={() => outForDelivery(order.id)}>Out for delivery</Button> : null}
                {order.status === 'out_for_delivery' ? <Button onClick={() => delivered(order.id)}>Delivered</Button> : null}
              </div>,
            ])}
          />
        </div>
      ) : null}
    </PageShell>
  );
}

export function DeliveryOrderDetailsPage() {
  const { id } = useParams();
  const { data, loading } = useAsyncResource<any>(() => deliveryApi.order(id as string), [id]);
  const order = data?.order;
  const items = data?.items ?? [];
  const assignment = data?.assignment;
  const timeline = data?.timeline ?? [];
  const waitingForReady = ['assigned', 'accepted', 'preparing'].includes(String(order?.status ?? ''));

  return (
    <PageShell eyebrow="Delivery" title={`Order ${id ?? ''}`} description="Review pickup, routing, and delivery status history.">
      {loading ? <LoadingState /> : !loading && order ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h3 className="text-lg font-bold">{order.order_number}</h3>
            <p className="mt-2 text-sm text-[var(--app-muted)]">Customer: {order.customer_name}</p>
            <p className="text-sm text-[var(--app-muted)]">Restaurant: {order.restaurant_name}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone={statusTone(order.status)}>{order.status}</Badge>
              <Badge tone={statusTone(order.assignment_status)}>{order.assignment_status}</Badge>
              <Badge tone={statusTone(order.delivery_request_status)}>{order.delivery_request_status ?? 'request'}</Badge>
            </div>
            {order.delivery_request_status === 'open' && !assignment ? (
              <EmptyState title="Waiting for delivery partner assignment" description="The pickup request is open, but no partner has accepted it yet." />
            ) : null}
            {assignment ? (
              <div className="mt-4 rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface-soft)] p-4 text-sm text-[var(--app-muted)]">
                <p className="font-semibold text-[var(--app-text)]">Assignment details</p>
                <p>Partner: {assignment.delivery_partner_name ?? '-'}</p>
                <p>Phone: {assignment.delivery_partner_phone ?? '-'}</p>
                <p>Status: {assignment.status}</p>
                <p>Assigned: {assignment.assigned_at ?? '-'}</p>
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {['assigned', 'ready'].includes(String(order.status)) && order.assignment_status === 'accepted' ? <Button onClick={async () => {
                try {
                  await deliveryApi.pickupOrder(order.id);
                  toast.success('Pickup confirmed');
                  window.location.reload();
                } catch (err: any) {
                  toast.error(err?.response?.data?.message ?? 'Unable to mark pickup');
                }
              }}>Mark picked up</Button> : null}
              {order.status === 'picked_up' ? <Button variant="ghost" onClick={async () => {
                try {
                  await deliveryApi.updateStatus(order.id, { status: 'out_for_delivery' });
                  toast.success('Marked out for delivery');
                  window.location.reload();
                } catch (err: any) {
                  toast.error(err?.response?.data?.message ?? 'Unable to update status');
                }
              }}>Out for delivery</Button> : null}
              {order.status === 'out_for_delivery' ? <Button variant="secondary" onClick={async () => {
                try {
                  await deliveryApi.deliveredOrder(order.id);
                  toast.success('Marked delivered');
                  window.location.reload();
                } catch (err: any) {
                  toast.error(err?.response?.data?.message ?? 'Unable to complete delivery');
                }
              }}>Mark delivered</Button> : null}
            </div>
            {waitingForReady ? <p className="text-sm text-[var(--app-muted)]">Waiting for restaurant to mark food ready.</p> : null}
          </Card>
          <Card>
            <h3 className="text-lg font-bold">Items</h3>
            <div className="mt-4 space-y-2">
              {items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-3">
                  <span>{item.item_name}</span>
                  <span>{item.quantity} x {currency(item.unit_price)}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-bold">Timeline</h3>
            <div className="mt-4 grid gap-3">
              {timeline.length ? timeline.map((step: any) => (
                <div key={step.status} className="flex items-center justify-between rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-3">
                  <Badge tone={step.at ? 'green' : 'slate'}>{orderTimelineLabel(String(step.status ?? ''))}</Badge>
                  <span className="text-sm text-[var(--app-muted)]">{step.at ? dateTime(step.at) : 'Pending'}</span>
                </div>
              )) : <EmptyState title="No timeline yet" description="Status updates will appear here as the order moves forward." />}
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
          <p className="text-sm text-[var(--app-muted)]">Partner: {data.partner?.full_name}</p>
          <p className="text-3xl font-black text-[var(--app-text)]">{currency(data.earnings ?? 0)}</p>
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
                <span className="text-xs text-[var(--app-muted)]">{dateTime(rating.created_at)}</span>
              </div>
              <p className="mt-3 text-sm text-[var(--app-muted)]">{rating.comment ?? 'No comment'}</p>
            </Card>
          )) : <EmptyState title="No ratings yet" />}
        </div>
      )}
    </PageShell>
  );
}

function parseNotificationPayload(payload: unknown): Record<string, unknown> {
  if (!payload) return {};
  if (typeof payload === 'object') return payload as Record<string, unknown>;
  if (typeof payload !== 'string') return {};
  try {
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function notificationTarget(notification: any) {
  const payload = parseNotificationPayload(notification.payload);
  const orderId = payload.order_id ?? payload.orderId;
  if (orderId) {
    return `/delivery/orders/${orderId}`;
  }
  return null;
}

export function DeliveryNotificationsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useAsyncResource<any>(async () => {
    const response = await deliveryApi.notifications();
    return {
      notifications: response.data.data.notifications ?? [],
      unread_count: response.data.data.unread_count ?? 0,
    };
  }, [refreshKey]);

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unread_count ?? notifications.filter((item: any) => !item.is_read).length;

  const reload = () => setRefreshKey((value) => value + 1);

  const markRead = async (id: number | string) => {
    try {
      await deliveryApi.readNotification(id);
      toast.success('Notification marked as read');
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to update notification');
    }
  };

  const markAllRead = async () => {
    try {
      await deliveryApi.readAllNotifications();
      toast.success('All notifications marked as read');
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to update notifications');
    }
  };

  return (
    <PageShell eyebrow="Delivery" title="Notifications" description="Delivery assignment, pickup, and delivery updates from the backend database.">
      {loading ? <LoadingState /> : null}
      {error ? <Card className="border-rose-200 text-rose-700">{error}</Card> : null}
      {!loading && data ? (
        <div className="space-y-4">
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">All notifications</h3>
              <p className="text-sm text-[var(--app-muted)]">{unreadCount} unread notification{unreadCount === 1 ? '' : 's'}</p>
            </div>
            {notifications.length ? <Button variant="ghost" type="button" onClick={markAllRead}>Mark all read</Button> : null}
          </Card>

          {notifications.length ? notifications.map((notification: any) => {
            const target = notificationTarget(notification);
            return (
              <Card key={notification.id} className={`space-y-3 ${notification.is_read ? '' : 'border-amber-200 bg-amber-50/60'}`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-slate-900">{notification.title}</h4>
                      <Badge tone={notification.is_read ? 'slate' : 'orange'}>{notification.is_read ? 'Read' : 'Unread'}</Badge>
                      <Badge tone="blue">{String(notification.type ?? 'update')}</Badge>
                    </div>
                    <p className="text-sm text-[var(--app-muted)]">{notification.message}</p>
                    <p className="text-xs text-[var(--app-muted)]">{String(notification.created_at ?? '')}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {target ? <Link to={target}><Button variant="ghost">Open</Button></Link> : null}
                    {!notification.is_read ? <Button type="button" onClick={() => markRead(notification.id)}>Mark read</Button> : null}
                  </div>
                </div>
              </Card>
            );
          }) : <EmptyState title="No notifications yet" description="Assigned order events will appear here." />}
        </div>
      ) : null}
    </PageShell>
  );
}
