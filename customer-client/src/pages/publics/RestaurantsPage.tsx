import { useEffect, useState } from 'react';
import { Link, useLocation} from 'react-router-dom';
import {
  Search,
  Sparkles,
} from 'lucide-react';
import { publicApi } from '../../api/publicApi';
import { Badge, Card, EmptyState, LoadingState } from '../../components/common';
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



function useCatalogRouteBase() {
  const location = useLocation();
  return location.pathname.startsWith('/customer') ? '/customer' : '';
}




export function RestaurantsPage() {
  const location = useLocation();
  const getInitialSearch = () => new URLSearchParams(location.search).get('search') || '';
  
  const [search, setSearch] = useState(getInitialSearch());
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('rating');
  const [rating, setRating] = useState('');

  // Sync with URL search parameter changes
  useEffect(() => {
    const urlSearch = new URLSearchParams(location.search).get('search') || '';
    if (urlSearch !== search) {
      setSearch(urlSearch);
    }
  }, [location.search]);
  const [categories, setCategories] = useState<any[]>([]);
  const routeBase = useCatalogRouteBase();
  const { data, loading, error } = useAsyncResource<any>(
    () => publicApi.restaurants({
      search,
      area,
      city,
      category_id: categoryId,
      veg_only: vegOnly,
      min_price: minPrice,
      max_price: maxPrice,
      sort_by: sort,
      rating,
    }),
    [search, area, city, categoryId, vegOnly, minPrice, maxPrice, sort, rating],
  );

  const restaurants = data?.restaurants ?? [];

  useEffect(() => {
    publicApi.categories()
      .then((response) => setCategories(response.data.data.categories ?? []))
      .catch(() => setCategories([]));
  }, []);

  return (
    <PageShell 
      eyebrow="Browse" 
      title="Restaurants" 
      description="Browse restaurants, ratings, and delivery times from the live backend catalog."
      top={
        <Card className="mb-2 bg-[var(--app-surface-soft)] border-[color:var(--app-border)] backdrop-blur-md">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
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
              <span className="font-bold text-[var(--app-muted)] uppercase tracking-widest px-1">City</span>
              <input 
                className="w-full rounded-xl border-2 border-[color:var(--app-border)] bg-transparent px-3 py-2.5 text-xs text-[var(--app-text)] outline-none focus:border-brand-500 transition-all placeholder:text-[var(--app-muted)]" 
                value={city} 
                onChange={(event) => setCity(event.target.value)} 
                placeholder="Your city" 
              />
            </label>
            <label className="space-y-1.5 text-[10px]">
              <span className="font-bold text-[var(--app-muted)] uppercase tracking-widest px-1">Category</span>
              <select 
                className="w-full rounded-xl border-2 border-[color:var(--app-border)] bg-transparent px-3 py-2.5 text-xs text-[var(--app-text)] outline-none focus:border-brand-500 transition-all appearance-none cursor-pointer" 
                value={categoryId} 
                onChange={(event) => setCategoryId(event.target.value)}
              >
                <option value="" className="bg-[var(--app-surface-strong)]">All</option>
                {categories.map((category: any) => (
                  <option key={category.id} value={category.id} className="bg-[var(--app-surface-strong)]">{category.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-[10px]">
              <span className="font-bold text-[var(--app-muted)] uppercase tracking-widest px-1">Veg only</span>
              <select 
                className="w-full rounded-xl border-2 border-[color:var(--app-border)] bg-transparent px-3 py-2.5 text-xs text-[var(--app-text)] outline-none focus:border-brand-500 transition-all appearance-none cursor-pointer" 
                value={vegOnly ? '1' : '0'} 
                onChange={(event) => setVegOnly(event.target.value === '1')}
              >
                <option value="0" className="bg-[var(--app-surface-strong)]">All</option>
                <option value="1" className="bg-[var(--app-surface-strong)]">Veg only</option>
              </select>
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
                <option value="delivery_time" className="bg-[var(--app-surface-strong)]">Time</option>
              </select>
            </label>
          </div>
        </Card>
      }
    >

      {loading ? <LoadingState /> : null}
      {error ? <Card className="border-rose-200 text-rose-700">{error}</Card> : null}
      {!loading && !error ? (
        restaurants.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {restaurants.map((item: any) => (
              <Link key={item.id} to={`${routeBase}/restaurants/${item.id}`}>
                <Card className="h-full space-y-3 transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-slate-100">
                    {item.banner || item.logo ? (
                      <img src={storageUrl(item.banner || item.logo)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <Sparkles size={32} />
                      </div>
                    )}
                    {item.logo ? (
                      <div className="absolute bottom-3 left-3 h-14 w-14 overflow-hidden rounded-xl bg-white p-1 shadow-md">
                        <img src={storageUrl(item.logo)} alt="Logo" className="h-full w-full rounded-lg object-cover" />
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold text-slate-900">{item.name}</h3>
                    <Badge tone="green">{Number(item.average_rating ?? 0).toFixed(1)}</Badge>
                  </div>
                  <p className="text-sm text-slate-600">{item.cuisine ?? 'Multi cuisine'}</p>
                  <p className="text-sm text-slate-500">{item.city ?? 'City not set'} | {item.area ?? 'Area not set'} | {item.delivery_time_minutes ?? 30} min</p>
                  <p className="text-sm font-semibold text-brand-700">Min order {currency(item.min_order_value ?? 0)}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={item.status === 'active' ? 'green' : 'red'}>{item.status ?? 'unknown'}</Badge>
                    <Badge tone="blue">{Number(item.available_food_count ?? 0)} foods</Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No restaurants found" description="Try adjusting your search or filters." />
        )
      ) : null}
    </PageShell>
  );
}

