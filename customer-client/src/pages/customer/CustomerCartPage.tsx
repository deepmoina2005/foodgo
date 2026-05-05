import { useEffect, useState } from 'react';
import { Link} from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { customerApi } from '../../api/customerApi';
import { Button, Card, EmptyState, LoadingState } from '../../components/common';
import { PageShell } from '../PageShell';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setCart } from '../../features/cart/cartSlice';
import { currency } from '../../utils/format';

export function CustomerCartPage() {
  const dispatch = useAppDispatch();
  const cart = useAppSelector((state) => state.cart);
  const { register, handleSubmit } = useForm<{ code: string }>();
  const [loading, setLoading] = useState(true);

  const loadCart = async () => {
    setLoading(true);
    try {
      const response = await customerApi.cart();
      dispatch(setCart(response.data.data));
    } catch {
      toast.error('Unable to load cart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateQuantity = async (id: number | string, quantity: number) => {
    try {
      await customerApi.updateCartItem(id, { quantity });
      await loadCart();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to update cart');
    }
  };

  const removeItem = async (id: number | string) => {
    try {
      await customerApi.removeCartItem(id);
      await loadCart();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to remove item');
    }
  };

  const clearCart = async () => {
    try {
      await customerApi.clearCart();
      await loadCart();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to clear cart');
    }
  };

  const applyCoupon = async (values: { code: string }) => {
    try {
      await customerApi.applyCoupon({ code: values.code });
      toast.success('Coupon applied');
      await loadCart();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to apply coupon');
    }
  };

  const items = cart.items as Array<any>;

  return (
    <PageShell eyebrow="Customer" title="Cart" description="One restaurant per cart, COD checkout only.">
      {loading ? <LoadingState /> : null}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          {items.length ? items.map((item) => (
            <div key={String(item.id)} className="flex flex-col gap-3 border-b border-slate-100 py-4 last:border-0 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-slate-900">{String(item.food_name ?? 'Food item')}</p>
                <p className="text-sm text-slate-500">{currency(item.price)} each</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" type="button" onClick={() => updateQuantity(item.id, Math.max(1, Number(item.quantity) - 1))}>-</Button>
                <span className="min-w-10 text-center font-semibold">{String(item.quantity)}</span>
                <Button variant="ghost" type="button" onClick={() => updateQuantity(item.id, Number(item.quantity) + 1)}>+</Button>
                <Button variant="danger" type="button" onClick={() => removeItem(item.id)}>Remove</Button>
              </div>
              <p className="font-bold">{currency(item.item_total as number)}</p>
            </div>
          )) : <EmptyState title="Cart is empty" description="Add menu items from a restaurant to begin checkout." action={<div className="flex flex-wrap gap-2"><Link to="/restaurants"><Button variant="ghost">Browse restaurants</Button></Link><Link to="/foods"><Button>Browse foods</Button></Link></div>} />}
        </Card>

        <div className="space-y-4">
          <Card>
            <h3 className="text-lg font-bold">Summary</h3>
            <div className="mt-4 space-y-2 text-sm">
              <p className="flex justify-between">
                <span>Restaurant</span>
                <span>{cart.restaurantName ?? (cart.restaurantId ? `#${cart.restaurantId}` : '-')}</span>
              </p>
              <p className="flex justify-between"><span>Coupon</span><span>{cart.couponCode ?? '-'}</span></p>
              <p className="flex justify-between"><span>Discount</span><span>{currency(cart.couponDiscount)}</span></p>
              <p className="flex justify-between"><span>GST</span><span>{currency(Number((cart.summary as any)?.gst_amount ?? 0))}</span></p>
              <p className="flex justify-between"><span>Delivery fee</span><span>{currency(Number((cart.summary as any)?.delivery_charge ?? 0))}</span></p>
              <p className="flex justify-between"><span>Platform fee</span><span>{currency(Number((cart.summary as any)?.platform_fee ?? 0))}</span></p>
              <p className="flex justify-between font-bold text-slate-900"><span>Total</span><span>{currency(cart.totalAmount)}</span></p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/checkout"><Button>Checkout</Button></Link>
              <Button variant="ghost" type="button" onClick={clearCart}>Clear cart</Button>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-bold">Apply coupon</h3>
            <form className="mt-4 space-y-3" onSubmit={handleSubmit(applyCoupon)}>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Coupon code" {...register('code')} />
              <Button type="submit">Apply coupon</Button>
            </form>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

