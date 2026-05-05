import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { customerApi } from '../../api/customerApi';
import { Badge, Button, Card, EmptyState, LoadingState } from '../../components/common';
import { PageShell } from '../PageShell';
import { dateTime } from '../../utils/format';

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




export function CustomerReviewsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useAsyncResource<any>(async () => {
    const [ordersResponse, reviewsResponse] = await Promise.all([customerApi.orders(), customerApi.reviews()]);
    return { orders: ordersResponse.data.data.orders ?? [], reviews: reviewsResponse.data.data.reviews ?? [] };
  }, [refreshKey]);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<any>();
  const [editingId, setEditingId] = useState<number | null>(null);
  const reviewableOrders = data?.orders?.filter((order: any) => ['delivered', 'paid'].includes(String(order.status))) ?? [];
  const selectableOrders = reviewableOrders.length ? reviewableOrders : (data?.orders ?? []);

  const submit = async (values: any) => {
    try {
      if (editingId) {
        await customerApi.updateReview(editingId, values);
        toast.success('Review updated');
      } else {
        await customerApi.createReview(values);
        toast.success('Review submitted');
      }
      setEditingId(null);
      reset({});
      setRefreshKey((value) => value + 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to save review');
    }
  };

  const editReview = (review: any) => {
    setEditingId(Number(review.id));
    reset({
      order_id: review.order_id,
      rating: review.rating,
      comment: review.comment,
      restaurant_id: review.restaurant_id,
      food_item_id: review.food_item_id,
      delivery_partner_id: review.delivery_partner_id,
    });
  };

  const removeReview = async (id: number) => {
    try {
      await customerApi.deleteReview(id);
      setRefreshKey((value) => value + 1);
      toast.success('Review deleted');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to delete review');
    }
  };

  return (
    <PageShell eyebrow="Customer" title="Reviews" description="Submit restaurant and delivery reviews after a successful order.">
      {loading ? <LoadingState /> : null}
      {error ? <Card className="border-rose-200 text-rose-700">{error}</Card> : null}
      {!loading && data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h3 className="text-lg font-bold">{editingId ? 'Edit review' : 'New review'}</h3>
            {selectableOrders.length || editingId ? (
              <form className="mt-4 space-y-3" onSubmit={handleSubmit(submit)}>
                <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" {...register('order_id', { required: true })}>
                  <option value="">Select order</option>
                  {selectableOrders.map((order: any) => (
                    <option key={order.id} value={order.id}>
                      {order.order_number} - {order.status}
                    </option>
                  ))}
                </select>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Rating 1-5" type="number" min="1" max="5" {...register('rating', { required: true })} />
                <textarea className="w-full rounded-2xl border border-slate-200 px-4 py-3" rows={4} placeholder="Comment" {...register('comment')} />
                <div className="grid gap-3 md:grid-cols-3">
                  <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Restaurant ID" {...register('restaurant_id')} />
                  <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Food item ID" {...register('food_item_id')} />
                  <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Delivery partner ID" {...register('delivery_partner_id')} />
                </div>
                <div className="flex gap-2">
                  <Button disabled={isSubmitting}>{editingId ? 'Update review' : 'Submit review'}</Button>
                  {editingId ? <Button variant="ghost" type="button" onClick={() => { setEditingId(null); reset({}); }}>Cancel</Button> : null}
                </div>
              </form>
            ) : (
              <div className="mt-4">
                <EmptyState title="No reviewable orders yet" description="You can submit a review after a completed order is delivered." />
              </div>
            )}
          </Card>

          <div className="space-y-4">
            {data.reviews.length ? data.reviews.map((review: any) => (
              <Card key={review.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge tone="blue">{review.rating}/5</Badge>
                  <span className="text-xs text-slate-500">{dateTime(review.created_at)}</span>
                </div>
                <p className="font-semibold">{review.restaurant_name ?? review.food_name ?? review.delivery_partner_name ?? 'Review'}</p>
                <p className="text-sm text-slate-600">{review.comment}</p>
                <div className="flex gap-2">
                  <Button variant="ghost" type="button" onClick={() => editReview(review)}>Edit</Button>
                  <Button variant="danger" type="button" onClick={() => removeReview(review.id)}>Delete</Button>
                </div>
              </Card>
            )) : <EmptyState title="No reviews yet" description="Your reviews will show here after submission." />}
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}

