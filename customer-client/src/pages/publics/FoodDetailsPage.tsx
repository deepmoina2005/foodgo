import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ShoppingBag,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { customerApi } from '../../api/customerApi';
import { publicApi } from '../../api/publicApi';
import { Badge, Button, Card,LoadingState } from '../../components/common';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setCart } from '../../features/cart/cartSlice';
import { PageShell } from '../PageShell';
import { currency, storageUrl } from '../../utils/format';

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
        if (!active) return;
        setData(response.data.data as T);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.response?.data?.message ?? 'Unable to load data');
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


function useCustomerOrdering() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const isCustomer = Boolean(auth.token && (auth.user as { role?: string } | null)?.role === 'customer');

  const addToCart = async (payload: Record<string, unknown>) => {
    if (!isCustomer) {
      toast.info('Please sign in as a customer to add items to cart.');
      navigate('/login');
      return false;
    }

    const response = await customerApi.addCartItem(payload);
    dispatch(setCart(response.data.data));
    toast.success('Added to cart');
    return true;
  };

  return { isCustomer, addToCart };
}

function useCatalogRouteBase() {
  const location = useLocation();
  return location.pathname.startsWith('/customer') ? '/customer' : '';
}




export function FoodDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const routeBase = useCatalogRouteBase();
  const { data, loading, error } = useAsyncResource<any>(() => publicApi.food(id as string), [id]);
  const { addToCart } = useCustomerOrdering();
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [adding, setAdding] = useState(false);
  const food = data?.food;
  const isOutOfStock = food ? (Number(food.stock_enabled ?? 1) === 0 || Number(food.stock_qty ?? 1) === 0) : false;
  const canChangeQuantity = !isOutOfStock;

  const handleAdd = async () => {
    try {
      setAdding(true);
      await addToCart({ food_item_id: food.id, quantity, note });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to add item to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAdd();
    navigate(routeBase ? `${routeBase}/cart` : '/cart');
  };

  return (
    <PageShell eyebrow="Browse" title={food ? food.name : 'Food details'} description="Inspect price, restaurant context, preparation time, and availability.">
      {loading ? <LoadingState /> : null}
      {error ? <Card className="border-rose-200 text-rose-700">{error}</Card> : null}
      {!loading && food ? (
        <Card className="space-y-4">
          {food.image ? (
            <div className="h-64 w-full overflow-hidden rounded-3xl bg-slate-100 shadow-sm md:h-80 lg:h-96">
              <img src={storageUrl(food.image)} alt={food.name} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex h-64 w-full items-center justify-center rounded-3xl bg-slate-50 text-slate-300 md:h-80 lg:h-96">
              <ShoppingBag size={64} />
            </div>
          )}
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge tone={food.veg_type === 'veg' ? 'green' : 'red'}>{food.veg_type}</Badge>
              <h3 className="mt-3 text-2xl font-black text-slate-900">{food.name}</h3>
              <p className="mt-2 text-sm text-slate-600">{food.description}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-brand-700">{currency(food.discount_price ?? food.price)}</p>
              {food.price !== food.discount_price ? <p className="text-sm text-slate-400 line-through">{currency(food.price)}</p> : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Restaurant</p>
              <p className="mt-2 font-bold text-slate-900">{food.restaurant_name}</p>
              <p className="text-sm text-slate-600">{food.restaurant_area}</p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Category</p>
              <p className="mt-2 font-bold text-slate-900">{food.category_name ?? 'Uncategorized'}</p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Prep time</p>
              <p className="mt-2 font-bold text-slate-900">{food.prep_time_minutes ?? 20} min</p>
            </Card>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to={`${routeBase}/restaurants/${food.restaurant_id}`}>
              <Button variant="ghost">View restaurant</Button>
            </Link>
            <Button disabled={adding || !canChangeQuantity} onClick={handleBuyNow}>Buy now</Button>
            <Button variant="ghost" disabled={adding || !canChangeQuantity} onClick={handleAdd}>{adding ? 'Adding...' : canChangeQuantity ? 'Add to cart' : 'Out of stock'}</Button>
            <Link to={routeBase ? `${routeBase}/cart` : '/login'}>
              <Button variant="ghost">Open cart</Button>
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Quantity</p>
              <div className="mt-3 flex items-center gap-2">
                <Button variant="ghost" type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} disabled={!canChangeQuantity}>-</Button>
                <span className="min-w-10 text-center font-bold">{quantity}</span>
                <Button variant="ghost" type="button" onClick={() => setQuantity((current) => current + 1)} disabled={!canChangeQuantity}>+</Button>
              </div>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Order note</p>
              <textarea
                className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3"
                rows={4}
                placeholder="Add cooking instructions or delivery note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </Card>
          </div>
        </Card>
      ) : null}
    </PageShell>
  );
}

