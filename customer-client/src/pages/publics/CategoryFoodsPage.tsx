import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ShoppingBag,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { customerApi } from '../../api/customerApi';
import { publicApi } from '../../api/publicApi';
import { Badge, Button, Card, EmptyState, LoadingState } from '../../components/common';
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




export function CategoryFoodsPage() {
  const { id, categoryId } = useParams();
  const navigate = useNavigate();
  const routeBase = useCatalogRouteBase();
  const { addToCart } = useCustomerOrdering();
  const [pendingFoodId, setPendingFoodId] = useState<number | null>(null);

  const { data, loading, error } = useAsyncResource<any>(
    () => publicApi.foods({ restaurant_id: id, category_id: categoryId }),
    [id, categoryId]
  );

  const foods = data?.foods ?? [];
  const categoryName = foods[0]?.category_name ?? 'Category';

  const handleAdd = async (food: any) => {
    try {
      setPendingFoodId(Number(food.id));
      await addToCart({ food_item_id: food.id, quantity: 1 });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to add item to cart');
    } finally {
      setPendingFoodId(null);
    }
  };

  const handleBuyNow = async (food: any) => {
    await handleAdd(food);
    navigate(routeBase ? `${routeBase}/cart` : '/cart');
  };

  return (
    <PageShell
      eyebrow="Category"
      title={categoryName}
      description={`Viewing all items in ${categoryName}.`}
    >
      {loading ? <LoadingState /> : null}
      {error ? <Card className="border-rose-200 text-rose-700">{error}</Card> : null}
      {!loading && !error ? (
        foods.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {foods.map((food: any) => (
              <Card key={food.id} className="h-full space-y-3 transition hover:-translate-y-1 hover:shadow-xl">
                <Link to={`${routeBase}/foods/${food.id}`} className="block">
                  <div className="mb-4 h-40 w-full overflow-hidden rounded-2xl bg-slate-100">
                    {food.image ? (
                      <img src={storageUrl(food.image)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <ShoppingBag size={32} />
                      </div>
                    )}
                  </div>
                  <Badge tone={food.veg_type === 'veg' ? 'green' : 'red'}>{food.veg_type}</Badge>
                  <h3 className="text-lg font-bold text-slate-900">{food.name}</h3>
                  <p className="text-sm text-slate-600 line-clamp-2">{food.description}</p>
                </Link>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-brand-700">{currency(food.discount_price ?? food.price)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => handleBuyNow(food)}>Buy now</Button>
                  <Button
                    disabled={pendingFoodId === Number(food.id) || Number(food.stock_enabled ?? 1) === 0 || Number(food.stock_qty ?? 1) === 0}
                    onClick={() => handleAdd(food)}
                  >
                    {pendingFoodId === Number(food.id) ? 'Adding...' : Number(food.stock_enabled ?? 1) === 0 || Number(food.stock_qty ?? 1) === 0 ? 'Out of stock' : 'Add to cart'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="No items found" />
        )
      ) : null}
    </PageShell>
  );
}