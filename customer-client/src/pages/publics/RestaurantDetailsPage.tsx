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




export function RestaurantDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const routeBase = useCatalogRouteBase();
  const { data, loading, error } = useAsyncResource<any>(() => publicApi.restaurantMenu(id as string), [id]);
  const { addToCart } = useCustomerOrdering();
  const [pendingFoodId, setPendingFoodId] = useState<number | null>(null);
  const restaurant = data?.restaurant;
  const menuEntries = Object.entries(data?.menu ?? {});
  const reviews = data?.reviews ?? [];

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
    <PageShell eyebrow="Browse" title={restaurant ? restaurant.name : 'Restaurant details'} description="View the menu, timing, and restaurant profile.">
      {loading ? <LoadingState /> : null}
      {error ? <Card className="border-rose-200 text-rose-700">{error}</Card> : null}
      {!loading && restaurant ? (
        <div className="space-y-6">
          {restaurant.banner || restaurant.logo ? (
            <div className="h-48 w-full overflow-hidden rounded-3xl bg-slate-100 shadow-sm md:h-72">
              <img
                src={storageUrl(restaurant.banner || restaurant.logo)}
                alt={restaurant.name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}
          <Card className={`grid gap-4 md:grid-cols-3 relative z-10 ${(restaurant.banner || restaurant.logo) ? '!-mt-16 sm:!-mt-24 shadow-xl' : ''}`}>
            <div className="md:col-span-2">
              <h3 className="text-2xl font-black text-slate-900">{restaurant.name}</h3>
              <p className="mt-2 text-sm text-slate-600">{restaurant.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="orange">{restaurant.cuisine ?? 'Cuisine'}</Badge>
                <Badge tone="green">{Number(restaurant.average_rating ?? 0).toFixed(1)} rating</Badge>
                <Badge tone="blue">{restaurant.delivery_time_minutes ?? 30} min</Badge>
              </div>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <p><span className="font-semibold">Area:</span> {restaurant.area ?? '-'}</p>
              <p><span className="font-semibold">Address:</span> {restaurant.address_line ?? '-'}</p>
              <p><span className="font-semibold">Min order:</span> {currency(restaurant.min_order_value ?? 0)}</p>
              <p><span className="font-semibold">Delivery fee:</span> {currency(restaurant.delivery_fee ?? 0)}</p>
            </div>
          </Card>

          <div className="space-y-6">
            {menuEntries.length ? menuEntries.map(([categoryName, items]) => (
              <div key={categoryName} className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-black text-slate-900">{categoryName}</h3>
                  <div className="flex items-center gap-2">
                    <Badge tone="blue">{(items as any[]).length} items</Badge>
                    {(items as any[]).length > 3 ? (
                      <Link
                        to={`${routeBase}/restaurants/${id}/category/${data?.categories?.find((c: any) => c.name === categoryName)?.id}`}
                        className="text-sm font-bold text-brand-600 hover:text-brand-700"
                      >
                        View all
                      </Link>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {(items as any[]).slice(0, 3).map((food: any) => (
                    <Card key={food.id} className="h-full space-y-3">
                      <Link to={`${routeBase}/foods/${food.id}`} className="block">
                        <div className="mb-4 h-32 w-full overflow-hidden rounded-2xl bg-slate-100">
                          {food.image ? (
                            <img src={storageUrl(food.image)} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                              <ShoppingBag size={24} />
                            </div>
                          )}
                        </div>
                        <Badge tone={food.veg_type === 'veg' ? 'green' : 'red'}>{food.veg_type}</Badge>
                        <h4 className="mt-3 text-lg font-bold">{food.name}</h4>
                        <p className="mt-1 text-sm text-slate-600 line-clamp-2">{food.description}</p>
                      </Link>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-brand-700">{currency(food.discount_price ?? food.price)}</span>
                        <span className="text-slate-500">{food.prep_time_minutes ?? 20} min</span>
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
              </div>
            )) : <EmptyState title="No menu items" />}
          </div>

          {reviews.length ? (
            <Card>
              <h3 className="text-lg font-bold">Recent reviews</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {reviews.map((review: any) => (
                  <div key={review.id} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Badge tone="blue">{review.rating}/5</Badge>
                      <span className="text-xs text-slate-500">{review.customer_name ?? 'Customer'}</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-700">{review.comment ?? 'No comment provided.'}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      ) : null}
    </PageShell>
  );
}

