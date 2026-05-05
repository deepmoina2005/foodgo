import { useEffect, useState } from 'react';
import { Link} from 'react-router-dom';
import { toast } from 'react-toastify';
import { customerApi } from '../../api/customerApi';
import { Badge, Button, Card, LoadingState, Table } from '../../components/common';
import { PageShell } from '../PageShell';
import { currency } from '../../utils/format';

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



export function CustomerOrdersPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useAsyncResource<any>(() => customerApi.orders(), [refreshKey]);
  const orders = data?.orders ?? [];

  const handleReorder = async (id: number | string) => {
    try {
      await customerApi.reorder(id);
      toast.success('Added back to cart');
      setRefreshKey((value) => value + 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to reorder');
    }
  };

  const handleCancel = async (id: number | string) => {
    try {
      await customerApi.cancelOrder(id);
      toast.success('Order cancelled');
      setRefreshKey((value) => value + 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to cancel order');
    }
  };

  return (
    <PageShell eyebrow="Customer" title="My orders" description="Browse your order history and open invoices or tracking views.">
      {loading ? <LoadingState /> : null}
      {error ? <Card className="border-rose-200 text-rose-700">{error}</Card> : null}
      {!loading ? (
        <Table
          columns={['Order', 'Restaurant', 'Status', 'Payment', 'Total', 'Actions']}
          rows={orders.map((order: any) => [
            <span key="a" className="font-semibold">{String(order.order_number)}</span>,
            <span key="b">{String(order.restaurant_name ?? '')}</span>,
            <Badge key="c" tone={statusTone(order.order_status ?? order.status)}>{String(order.order_status ?? order.status)}</Badge>,
            <span key="d">{String(order.payment_status)}</span>,
            <span key="e">{currency(order.total_amount as number)}</span>,
            <div key="f" className="flex flex-wrap gap-2">
              <Link to={`/orders/${order.id}`}><Button variant="ghost">View</Button></Link>
              <Link to={`/orders/${order.id}/track`}><Button variant="ghost">Track</Button></Link>
              <Link to={`/invoice/${order.id}`}><Button variant="ghost">Invoice</Button></Link>
              {order.status === 'placed' ? <Button variant="danger" onClick={() => handleCancel(order.id)}>Cancel</Button> : null}
              <Button onClick={() => handleReorder(order.id)}>Reorder</Button>
            </div>,
          ])}
        />
      ) : null}
    </PageShell>
  );
}

