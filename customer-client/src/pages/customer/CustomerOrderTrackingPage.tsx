import { useEffect, useState } from 'react';
import {  useParams } from 'react-router-dom';
import { customerApi } from '../../api/customerApi';
import { Badge, Card, EmptyState, LoadingState } from '../../components/common';
import { PageShell } from '../PageShell';
import {  dateTime } from '../../utils/format';

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


function orderStepLabel(status: string) {
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


export function CustomerOrderTrackingPage() {
  const { id } = useParams();
  const { data, loading, error } = useAsyncResource<any>(() => customerApi.trackOrder(id as string), [id]);
  const timeline = data?.timeline ?? [];
  const order = data?.order;
  const assignment = data?.assignment;

  return (
    <PageShell eyebrow="Customer" title={`Track order ${id ?? ''}`} description="Live order tracking events are backed by the order status history.">
      {loading ? <LoadingState /> : null}
      {error ? <Card className="border-rose-200 text-rose-700">{error}</Card> : null}
      {!loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-3">
            <h3 className="text-lg font-bold">Tracking summary</h3>
            {order ? (
              <div className="space-y-2 text-sm text-slate-600">
                <p><span className="font-semibold">Restaurant:</span> {order.restaurant_name}</p>
                <p><span className="font-semibold">Current status:</span> {orderStepLabel(String(order.order_status ?? order.status ?? ''))}</p>
                <p><span className="font-semibold">Payment:</span> {order.payment_status}</p>
                <p><span className="font-semibold">ETA:</span> {order.estimated_delivery_time ? `${order.estimated_delivery_time} min` : '-'}</p>
              </div>
            ) : null}
            {assignment ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                <p className="font-semibold text-slate-900">{assignment.delivery_partner_name ?? 'Delivery partner'}</p>
                <p className="text-slate-500">{assignment.vehicle_type ?? 'Vehicle not set'}</p>
                <p className="text-slate-500">Status: {assignment.status}</p>
              </div>
            ) : String(order?.delivery_request_status ?? '') === 'open' ? (
              <EmptyState title="Waiting for delivery partner assignment" description="The order is ready and waiting for a delivery partner to accept pickup." />
            ) : (
              <EmptyState title="Not assigned yet" description="Delivery partner details will appear after pickup is accepted." />
            )}
          </Card>

          <Card className="space-y-3">
            <h3 className="text-lg font-bold">Timeline</h3>
            {timeline.length ? timeline.map((step: any) => (
              <div key={step.status} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <Badge tone={step.at ? 'green' : 'slate'}>{orderStepLabel(String(step.status ?? ''))}</Badge>
                <span className="text-sm text-slate-500">{step.at ? dateTime(step.at) : 'Pending'}</span>
              </div>
            )) : <EmptyState title="No tracking events yet" description="Tracking updates appear after the order moves through the workflow." />}
          </Card>
        </div>
      ) : null}
    </PageShell>
  );
}

