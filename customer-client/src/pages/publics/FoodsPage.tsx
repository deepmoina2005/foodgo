import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, } from 'react-router-dom';
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




export function FoodsPage() {
  const location = useLocation();
  const getInitialSearch = () => new URLSearchParams(location.search).get('search') || '';

  const [search, setSearch] = useState(getInitialSearch());
  const [vegType, setVegType] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [area, setArea] = useState('');
  const [rating, setRating] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('rating');

  // Sync with URL search parameter changes
  useEffect(() => {
    const urlSearch = new URLSearchParams(location.search).get('search') || '';
    if (urlSearch !== search) {
      setSearch(urlSearch);
    }
  }, [location.search]);
  const [categories, setCategories] = useState<any[]>([]);
  const navigate = useNavigate();
  const routeBase = useCatalogRouteBase();
  const { addToCart } = useCustomerOrdering();
  const [pendingFoodId, setPendingFoodId] = useState<number | null>(null);
  const { data, loading, error } = useAsyncResource<any>(
    () => publicApi.foods({
      search,
      veg_type: vegType,
      category_id: categoryId,
      area,
      rating,
      min_price: minPrice,
      max_price: maxPrice,
      sort,
    }),
    [search, vegType, categoryId, area, rating, minPrice, maxPrice, sort],
  );

  useEffect(() => {
    publicApi.categories()
      .then((response) => setCategories(response.data.data.categories ?? []))
      .catch(() => setCategories([]));
  }, []);

  const foods = data?.foods ?? [];

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
      eyebrow="Browse" 
      title="Foods" 
      description="Search food items with filters, price range, veg type, and sort options."
      top={
        <Card className="mb-2 bg-[var(--app-surface-soft)] border-[color:var(--app-border)] backdrop-blur-md">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
            <label className="space-y-1.5 text-[10px]">
              <span className="font-bold text-[var(--app-muted)] uppercase tracking-widest px-1">Veg type</span>
              <select 
                className="w-full rounded-xl border-2 border-[color:var(--app-border)] bg-transparent px-3 py-2.5 text-xs text-[var(--app-text)] outline-none focus:border-brand-500 transition-all appearance-none cursor-pointer" 
                value={vegType} 
                onChange={(event) => setVegType(event.target.value)}
              >
                <option value="" className="bg-[var(--app-surface-strong)]">All</option>
                <option value="veg" className="bg-[var(--app-surface-strong)]">Veg</option>
                <option value="non_veg" className="bg-[var(--app-surface-strong)]">Non veg</option>
              </select>
            </label>
            <label className="space-y-1.5 text-[10px]">
              <span className="font-bold text-[var(--app-muted)] uppercase tracking-widest px-1">Category</span>
              <select 
                className="w-full rounded-xl border-2 border-[color:var(--app-border)] bg-transparent px-3 py-2.5 text-xs text-[var(--app-text)] outline-none focus:border-brand-500 transition-all appearance-none cursor-pointer" 
                value={categoryId} 
                onChange={(event) => setCategoryId(event.target.value)}
              >
                <option value="" className="bg-[var(--app-surface-strong)]">All categories</option>
                {categories.map((category: any) => (
                  <option key={category.id} value={category.id} className="bg-[var(--app-surface-strong)]">{category.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-[10px]">
              <span className="font-bold text-[var(--app-muted)] uppercase tracking-widest px-1">Area</span>
              <input 
                className="w-full rounded-xl border-2 border-[color:var(--app-border)] bg-transparent px-3 py-2.5 text-xs text-[var(--app-text)] outline-none focus:border-brand-500 transition-all placeholder:text-[var(--app-muted)]" 
                value={area} 
                onChange={(event) => setArea(event.target.value)} 
                placeholder="Downtown" 
              />
            </label>
            <label className="space-y-1.5 text-[10px]">
              <span className="font-bold text-[var(--app-muted)] uppercase tracking-widest px-1">Rating</span>
              <input 
                className="w-full rounded-xl border-2 border-[color:var(--app-border)] bg-transparent px-3 py-2.5 text-xs text-[var(--app-text)] outline-none focus:border-brand-500 transition-all placeholder:text-[var(--app-muted)]" 
                value={rating} 
                onChange={(event) => setRating(event.target.value)} 
                placeholder="4" 
              />
            </label>
            <label className="space-y-1.5 text-[10px]">
              <span className="font-bold text-[var(--app-muted)] uppercase tracking-widest px-1">Min price</span>
              <input 
                className="w-full rounded-xl border-2 border-[color:var(--app-border)] bg-transparent px-3 py-2.5 text-xs text-[var(--app-text)] outline-none focus:border-brand-500 transition-all placeholder:text-[var(--app-muted)]" 
                value={minPrice} 
                onChange={(event) => setMinPrice(event.target.value)} 
                placeholder="50" 
              />
            </label>
            <label className="space-y-1.5 text-[10px]">
              <span className="font-bold text-[var(--app-muted)] uppercase tracking-widest px-1">Max price</span>
              <input 
                className="w-full rounded-xl border-2 border-[color:var(--app-border)] bg-transparent px-3 py-2.5 text-xs text-[var(--app-text)] outline-none focus:border-brand-500 transition-all placeholder:text-[var(--app-muted)]" 
                value={maxPrice} 
                onChange={(event) => setMaxPrice(event.target.value)} 
                placeholder="300" 
              />
            </label>
            <label className="space-y-1.5 text-[10px]">
              <span className="font-bold text-[var(--app-muted)] uppercase tracking-widest px-1">Sort</span>
              <select 
                className="w-full rounded-xl border-2 border-[color:var(--app-border)] bg-transparent px-3 py-2.5 text-xs text-[var(--app-text)] outline-none focus:border-brand-500 transition-all appearance-none cursor-pointer" 
                value={sort} 
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="rating" className="bg-[var(--app-surface-strong)]">Popularity</option>
                <option value="price" className="bg-[var(--app-surface-strong)]">Price</option>
                <option value="delivery_time" className="bg-[var(--app-surface-strong)]">Prep time</option>
              </select>
            </label>
          </div>
        </Card>
      }
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
                  <p className="text-sm text-slate-600">{food.restaurant_name}</p>
                  <p className="text-sm text-slate-500">{food.category_name ?? 'Category'} | {food.prep_time_minutes ?? 20} min</p>
                </Link>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-brand-700">{currency(food.discount_price ?? food.price)}</span>
                  {food.price !== food.discount_price ? <span className="text-xs text-slate-400 line-through">{currency(food.price)}</span> : null}
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
          <EmptyState title="No foods found" description="Try different search or price filters." />
        )
      ) : null}
    </PageShell>
  );
}

