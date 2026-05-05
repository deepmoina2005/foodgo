import { Link, useLocation, useParams } from 'react-router-dom';
import { Button, Card } from '../../components/common';
import { PageShell } from '../PageShell';

export function CustomerOrderConfirmationPage() {
  const location = useLocation();
  const params = useParams();
  const order = (location.state as any) ?? null;

  return (
    <PageShell eyebrow="Customer" title="Order confirmed" description="Your COD order has been placed and is now moving through the restaurant and delivery workflow.">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Success</p>
          <h3 className="text-2xl font-black text-slate-900">Order placed successfully</h3>
          <p className="text-sm text-slate-600">Cash on delivery order has been received by the restaurant. You can follow the progress from the orders page.</p>
          {order ? (
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <p><span className="font-semibold">Order number:</span> {order.order_number ?? order.orderNumber ?? '-'}</p>
              <p><span className="font-semibold">Payment status:</span> {order.payment_status ?? order.paymentStatus ?? 'pending'}</p>
              <p><span className="font-semibold">Order ID:</span> {order.order_id ?? order.id ?? params.id ?? '-'}</p>
              <p><span className="font-semibold">Status:</span> {order.order_status ?? order.status ?? 'placed'}</p>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Link to="/orders"><Button>View orders</Button></Link>
            <Link to="/cart"><Button variant="ghost">Open cart</Button></Link>
            {params.id ? <Link to={`/orders/${params.id}/track`}><Button variant="ghost">Track order</Button></Link> : null}
          </div>
        </Card>
        <Card className="space-y-3">
          <h3 className="text-lg font-bold">What happens next</h3>
          <div className="space-y-3 text-sm text-slate-600">
            <p>1. Vendor accepts or rejects the placed order.</p>
            <p>2. Accepted orders move to preparing and ready states.</p>
            <p>3. Admin assigns a delivery partner once the order is ready.</p>
            <p>4. Delivery partner marks pickup, out for delivery, and delivered.</p>
            <p>5. COD payment switches from pending to paid after delivery.</p>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

