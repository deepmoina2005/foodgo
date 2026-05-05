import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { customerApi } from '../../api/customerApi';
import { Badge, Button, Card, EmptyState, LoadingState, Modal, Textarea, Input } from '../../components/common';
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


export function CustomerOrderDetailsPage() {
  const { id } = useParams();
  const { data, loading, error } = useAsyncResource<any>(() => customerApi.order(id as string), [id]);
  const navigate = useNavigate();
  const order = data?.order;
  const items = data?.items ?? [];
  const assignment = data?.assignment;
  const [busyAction, setBusyAction] = useState<'cancel' | 'reorder' | 'review' | null>(null);
  const [reviewItem, setReviewItem] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const handleCancel = async () => {
    try {
      setBusyAction('cancel');
      await customerApi.cancelOrder(id as string);
      toast.success('Order cancelled');
      navigate('/orders');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to cancel order');
    } finally {
      setBusyAction(null);
    }
  };

  const handleReorder = async () => {
    try {
      setBusyAction('reorder');
      await customerApi.reorder(id as string);
      toast.success('Order added back to cart');
      navigate('/cart');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to reorder');
    } finally {
      setBusyAction(null);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewItem) return;

    try {
      setBusyAction('review');
      await customerApi.createReview({
        order_id: order.id,
        food_item_id: reviewItem.food_item_id,
        restaurant_id: order.restaurant_id,
        rating: reviewRating,
        comment: reviewComment
      });
      toast.success('Review submitted successfully');
      setReviewItem(null);
      setReviewComment('');
      setReviewRating(5);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to submit review');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <PageShell eyebrow="Customer" title={`Order ${id ?? ''}`} description="Detailed order summary and status timeline.">
      {loading ? <LoadingState /> : null}
      {error ? <Card className="border-rose-200 text-rose-700">{error}</Card> : null}
      {!loading && order ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-3">
            <h3 className="text-lg font-bold">Order summary</h3>
            <p className="text-sm text-slate-600">Restaurant: {order.restaurant_name}</p>
            <p className="text-sm text-slate-600">Order number: {order.order_number}</p>
            <p className="text-sm text-slate-600">Placed: {dateTime(order.placed_at)}</p>
            <div className="flex flex-wrap gap-2">
              <Badge tone={statusTone(order.order_status ?? order.status)}>{order.order_status ?? order.status}</Badge>
              <Badge tone={statusTone(order.payment_status)}>{order.payment_status}</Badge>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {(order.order_status ?? order.status) === 'placed' ? <Button variant="danger" type="button" onClick={handleCancel} disabled={busyAction === 'cancel'}>{busyAction === 'cancel' ? 'Cancelling...' : 'Cancel order'}</Button> : null}
              <Button type="button" onClick={handleReorder} disabled={busyAction === 'reorder'}>{busyAction === 'reorder' ? 'Adding...' : 'Reorder'}</Button>
              <Link to={`/orders/${order.id}/track`}><Button variant="ghost">Track</Button></Link>
              <Link to={`/invoice/${order.id}`}><Button variant="ghost">Invoice</Button></Link>
            </div>
          </Card>
          <Card>
            <h3 className="text-lg font-bold">Items</h3>
            <div className="mt-4 space-y-3">
              {items.map((item: any) => (
                <div key={item.id} className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{item.item_name}</p>
                      <p className="text-xs text-slate-500">Qty {item.quantity}</p>
                    </div>
                    <p className="font-bold">{currency(item.line_total)}</p>
                  </div>
                  {['delivered', 'paid'].includes(String(order.order_status ?? order.status)) && (
                    <Button 
                      variant="ghost" 
                      className="w-full text-xs py-1.5"
                      onClick={() => setReviewItem(item)}
                    >
                      Rate & Review Item
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-bold">Delivery assignment</h3>
            {assignment ? (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <Card className="bg-slate-50">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Partner</p>
                  <p className="mt-2 font-bold text-slate-900">{assignment.delivery_partner_name ?? 'Assigned'}</p>
                </Card>
                <Card className="bg-slate-50">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Vehicle</p>
                  <p className="mt-2 font-bold text-slate-900">{assignment.vehicle_type ?? '-'}</p>
                </Card>
                <Card className="bg-slate-50">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Status</p>
                  <p className="mt-2 font-bold text-slate-900">{assignment.status ?? '-'}</p>
                </Card>
              </div>
            ) : String(order?.delivery_request_status ?? '') === 'open' ? (
              <EmptyState title="Waiting for delivery partner assignment" description="The restaurant has marked your order ready and the pickup request is visible to delivery partners." />
            ) : (
              <EmptyState title="Not assigned yet" />
            )}
          </Card>
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-bold">Order timeline</h3>
            <div className="mt-4 grid gap-3">
              {(data?.timeline ?? []).map((step: any) => (
                <div key={step.status} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Badge tone={step.at ? 'green' : 'slate'}>{orderStepLabel(String(step.status ?? ''))}</Badge>
                    <span className="text-sm text-slate-600">{step.at ? dateTime(step.at) : 'Pending'}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      <Modal
        open={!!reviewItem}
        onClose={() => setReviewItem(null)}
        title={`Review ${reviewItem?.item_name}`}
        description="Share your feedback about this dish."
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <Input 
            label="Rating (1-5)" 
            type="number" 
            min="1" 
            max="5" 
            value={reviewRating}
            onChange={(e) => setReviewRating(parseInt(e.target.value))}
            required
          />
          <Textarea 
            label="Your Review" 
            placeholder="How was the taste and quality?"
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={busyAction === 'review'}>
              {busyAction === 'review' ? 'Submitting...' : 'Submit Review'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setReviewItem(null)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}

