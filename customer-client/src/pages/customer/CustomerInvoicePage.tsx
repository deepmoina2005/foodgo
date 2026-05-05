import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { customerApi } from '../../api/customerApi';
import { Badge, Button, Card, LoadingState, Table } from '../../components/common';
import { PageShell } from '../PageShell';
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

export function CustomerInvoicePage() {
  const { id } = useParams();
  const { data, loading, error } = useAsyncResource<any>(() => customerApi.invoice(id as string), [id]);
  const order = data?.order;
  const items = data?.items ?? [];
  const payment = data?.payment;

  return (
    <PageShell eyebrow="Customer" title={`Invoice ${id ?? ''}`} description="Invoice preview generated from the order record and line items.">
      {loading ? <LoadingState /> : null}
      {error ? <Card className="border-rose-200 text-rose-700">{error}</Card> : null}
      {!loading && order ? (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black">Invoice {order.order_number}</h3>
              <p className="text-sm text-slate-500">{order.restaurant_name}</p>
              <p className="text-xs text-slate-400">{dateTime(order.created_at)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={statusTone(order.order_status ?? order.status)}>{order.order_status ?? order.status}</Badge>
              <Badge tone={statusTone(order.payment_status)}>{order.payment_status}</Badge>
              <Button variant="ghost" type="button" onClick={() => window.print()}>Print</Button>
            </div>
          </div>
          <Table
            columns={['Item', 'Qty', 'Unit price', 'Total']}
            rows={items.map((item: any) => [
              <span key="a" className="font-semibold">{item.item_name}</span>,
              <span key="b">{item.quantity}</span>,
              <span key="c">{currency(item.unit_price)}</span>,
              <span key="d">{currency(item.line_total)}</span>,
            ])}
          />
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <p className="flex justify-between"><span>Subtotal</span><span>{currency(order.subtotal)}</span></p>
            <p className="flex justify-between"><span>Discount</span><span>{currency(order.discount_amount)}</span></p>
            <p className="flex justify-between"><span>GST</span><span>{currency(order.gst_amount ?? 0)}</span></p>
            <p className="flex justify-between"><span>Delivery fee</span><span>{currency(order.delivery_charge ?? order.delivery_fee ?? 0)}</span></p>
            <p className="flex justify-between"><span>Platform fee</span><span>{currency(order.platform_fee ?? 0)}</span></p>
            <p className="flex justify-between font-bold"><span>Total</span><span>{currency(order.total_amount)}</span></p>
          </div>
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <p className="flex justify-between"><span>Payment method</span><span>{payment?.payment_method ?? order.payment_method ?? 'COD'}</span></p>
            <p className="flex justify-between"><span>Payment status</span><span>{payment?.payment_status ?? order.payment_status}</span></p>
          </div>
        </Card>
      ) : null}
    </PageShell>
  );
}

