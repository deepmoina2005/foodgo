import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { customerApi } from '../../api/customerApi';
import { Badge, Button, Card, EmptyState, LoadingState } from '../../components/common';
import { PageShell } from '../PageShell';
import { useAppSelector } from '../../hooks/redux';
import { currency} from '../../utils/format';

export function CustomerCheckoutPage() {
  const navigate = useNavigate();
  const params = useParams();
  const customerState = useAppSelector((state) => state.customer);
  const cartState = useAppSelector((state) => state.cart);
  const [refreshKey, setRefreshKey] = useState(0);
  const [data, setData] = useState<{
    addresses: Array<Record<string, unknown>>;
    cart: {
      cart: Record<string, unknown> | null;
      items: Array<Record<string, unknown>>;
      subtotal: number;
      total: number;
      summary?: Record<string, unknown> | null;
    };
    restaurant: Record<string, unknown> | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{ address_id: string; coupon_code?: string; customer_note?: string }>();

  useEffect(() => {
    let active = true;

    const loadCheckout = async () => {
      setLoading(true);
      setError(null);

      const [cartResult, cartSummaryResult, addressesResult] = await Promise.allSettled([
        customerApi.cart(),
        customerApi.cartSummary(),
        customerApi.addresses(),
      ]);

      const cartResponse = cartResult.status === 'fulfilled' ? cartResult.value : null;
      const cartSummaryResponse = cartSummaryResult.status === 'fulfilled' ? cartSummaryResult.value : null;
      const addressesResponse = addressesResult.status === 'fulfilled' ? addressesResult.value : null;
      const cartData = cartResponse?.data?.data;
      const summaryData = cartSummaryResponse?.data?.data?.summary ?? cartData?.summary ?? null;
      const cart = cartData?.cart ?? cartData ?? null;
      const restaurantId = cart?.restaurant_id ?? cartState.restaurantId;

      let restaurant = null;
      if (restaurantId) {
        try {
          const restaurantResponse = await customerApi.restaurant(restaurantId);
          restaurant = restaurantResponse.data.data.restaurant ?? null;
        } catch {
          restaurant = null;
        }
      }

      if (!active) return;

      const addresses = addressesResponse?.data?.data?.addresses ?? customerState.addresses ?? [];
      const checkoutCart = {
        cart: {
          restaurant_id: cart?.restaurant_id ?? cartState.restaurantId,
          coupon_code: cart?.coupon_code ?? cartState.couponCode,
          coupon_discount: Number(cart?.coupon_discount ?? cartState.couponDiscount ?? 0),
          total_amount: Number(cart?.total_amount ?? cartData?.total ?? cartState.totalAmount ?? 0),
          summary: summaryData,
        },
        items: cartData?.items ?? cart?.items ?? cartState.items ?? [],
        subtotal: Number(cartData?.subtotal ?? cart?.subtotal ?? cartState.subtotal ?? 0),
        total: Number(cart?.total_amount ?? cartData?.total ?? cartState.totalAmount ?? 0),
      };

      setData({
        addresses: addresses as Array<Record<string, unknown>>,
        cart: checkoutCart,
        restaurant: restaurant as Record<string, unknown> | null,
      });

      const failures = [cartResult, cartSummaryResult, addressesResult].filter((result) => result.status === 'rejected');
      if (failures.length) {
        setError('Some checkout data could not be loaded. Using your saved cart data.');
      }

      setLoading(false);
    };

    loadCheckout().catch((loadError) => {
      if (!active) return;
      setData({
        addresses: customerState.addresses ?? [],
        cart: {
          cart: {
            restaurant_id: cartState.restaurantId,
            coupon_code: cartState.couponCode,
            coupon_discount: cartState.couponDiscount,
            total_amount: cartState.totalAmount,
          },
          items: cartState.items,
          subtotal: cartState.subtotal,
          total: cartState.totalAmount,
        },
        restaurant: null,
      });
      setError(loadError?.response?.data?.message ?? 'Unable to load checkout');
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    const defaultAddress = data?.addresses?.find((address: any) => address.is_default) ?? data?.addresses?.[0];
    if (defaultAddress?.id) {
      reset({
        address_id: String(defaultAddress.id),
      });
    }
  }, [data, reset]);

  const onSubmit = async (values: { address_id: string; coupon_code?: string; customer_note?: string }) => {
    try {
      const response = await customerApi.checkout(values);
      toast.success('Order placed successfully');
      const orderId = response.data.data?.order_id ?? response.data.data?.order?.id ?? params.id;
      navigate(`/order-confirmation/${orderId}`, { state: response.data.data });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Checkout failed');
    }
  };

  const retry = () => setRefreshKey((value) => value + 1);

  return (
    <PageShell eyebrow="Customer" title="Checkout" description="Confirm the delivery address and place a COD order.">
      {loading ? <LoadingState label="Loading checkout..." /> : null}
      {!loading && error && !data ? (
        <Card className="mx-auto max-w-3xl border-rose-200 bg-rose-50 text-rose-900">
          <h3 className="text-lg font-bold">Unable to load checkout</h3>
          <p className="mt-2 text-sm text-rose-800">{error}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={retry}>Retry</Button>
            <Link to="/cart"><Button variant="ghost">Go to cart</Button></Link>
          </div>
        </Card>
      ) : null}
      {!loading && error && data ? (
        <Card className="mx-auto mb-6 max-w-3xl border-amber-200 bg-amber-50 text-amber-900">
          <h3 className="text-lg font-bold">Checkout loaded with fallback data</h3>
          <p className="mt-2 text-sm text-amber-800">{error}</p>
        </Card>
      ) : null}
      {!loading && data ? (
        data.cart?.items?.length ? (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Order summary</p>
                  <h3 className="mt-2 text-2xl font-black text-slate-900">Review your cart</h3>
                </div>
                <Badge tone="orange">COD only</Badge>
              </div>

              <div className="space-y-3">
                {data.cart.items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.food_name}</p>
                      <p className="text-sm text-slate-500">
                        {currency(item.price)} x {item.quantity}
                      </p>
                    </div>
                    <p className="font-bold text-slate-900">{currency(item.item_total)}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="space-y-2 text-sm">
                  <p className="flex justify-between"><span>Items total</span><span>{currency(data.cart.subtotal ?? 0)}</span></p>
                  <p className="flex justify-between"><span>Coupon discount</span><span>- {currency(Number(data.cart.cart?.coupon_discount ?? 0))}</span></p>
                  <p className="flex justify-between"><span>GST</span><span>{currency(Number((data.cart.cart?.summary as any)?.gst_amount ?? 0))}</span></p>
                  <p className="flex justify-between"><span>Delivery fee</span><span>{currency(Number((data.cart.cart?.summary as any)?.delivery_charge ?? data.restaurant?.delivery_fee ?? 0))}</span></p>
                  <p className="flex justify-between"><span>Platform fee</span><span>{currency(Number((data.cart.cart?.summary as any)?.platform_fee ?? 0))}</span></p>
                  <p className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
                    <span>Payable</span>
                    <span>{currency(Number((data.cart.cart?.summary as any)?.total_amount ?? data.cart.total ?? 0))}</span>
                  </p>
                </div>
              </div>
            </Card>

            <Card className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Delivery</p>
                <h3 className="mt-2 text-2xl font-black text-slate-900">Place COD order</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Cash on delivery only. No online payment gateway, no mail, no OTP.
                </p>
                {data.restaurant ? (
                  <p className="mt-2 text-sm text-slate-500">
                    Restaurant: <span className="font-semibold text-slate-700">{String(data.restaurant.name ?? '')}</span>
                  </p>
                ) : null}
              </div>

              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Delivery address</label>
                  <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" {...register('address_id', { required: true })}>
                    <option value="">Select address</option>
                    {data.addresses?.map((address: any) => (
                      <option key={address.id} value={address.id}>
                        {address.label} - {address.city}
                      </option>
                    ))}
                  </select>
                </div>

                {!data.addresses?.length ? (
                  <EmptyState
                    title="No address saved"
                    description="Add an address before placing the order."
                    action={(
                      <Link to="/addresses">
                        <Button variant="ghost">Add address</Button>
                      </Link>
                    )}
                  />
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Coupon code (optional)" {...register('coupon_code')} />
                  <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Customer note" {...register('customer_note')} />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button disabled={isSubmitting || !data.addresses?.length}>
                    {isSubmitting ? 'Placing order...' : 'Place COD order'}
                  </Button>
                  <Link to="/cart">
                    <Button variant="ghost" type="button">Back to cart</Button>
                  </Link>
                </div>
              </form>
            </Card>
          </div>
        ) : (
          <Card className="mx-auto max-w-2xl">
            <EmptyState
              title="Your cart is empty"
              description="Add food items first, then come back to complete checkout."
              action={(
                <div className="flex flex-wrap gap-2">
                  <Link to="/restaurants"><Button variant="ghost">Browse restaurants</Button></Link>
                  <Link to="/foods"><Button>Browse foods</Button></Link>
                </div>
              )}
            />
          </Card>
        )
      ) : null}
    </PageShell>
  );
}

