import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Star, MapPin, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import { publicApi } from '../../api/publicApi';
import { customerApi } from '../../api/customerApi';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setCart } from '../../features/cart/cartSlice';
import { Badge, Button, Card, LoadingSpinner } from '../../components/common';
import { currency, storageUrl } from '../../utils/format';

export function CustomerHomePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(false);
  const [popularRestaurants, setPopularRestaurants] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);

  const auth = useAppSelector((state) => state.auth);

  const isCustomer =
    Boolean(auth.token) &&
    (auth.user as { role?: string } | null)?.role === 'customer';

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);

        const [restaurantsRes, foodsRes] = await Promise.all([
          publicApi.restaurants({ sort_by: 'rating', limit: 6 }),
          publicApi.foods({ sort_by: 'rating', limit: 8 }),
        ]);

        setPopularRestaurants(
          restaurantsRes.data.data.restaurants?.slice(0, 6) ?? []
        );

        setBestSellers(foodsRes.data.data.foods?.slice(0, 8) ?? []);
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const handleAddToCart = async (food: any, isBuyNow = false) => {
    if (!isCustomer) {
      toast.info('Please sign in as a customer to add items to cart.');
      navigate('/login');
      return;
    }

    try {
      const response = await customerApi.addCartItem({
        food_item_id: food.id,
        quantity: 1,
      });

      dispatch(setCart(response.data.data));

      if (isBuyNow) {
        navigate('/cart');
      } else {
        toast.success('Added to cart');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to add item to cart');
    }
  };

  if (loading && popularRestaurants.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner className="h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="group relative h-[300px] w-full overflow-hidden rounded-[32px] shadow-2xl sm:h-[380px] sm:rounded-[40px]">
        <img
          src="/hero.png"
          alt="Premium Dining"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

        <div className="absolute inset-0 z-10 flex flex-col justify-center px-6 sm:px-8 lg:px-16">
          <div className="mb-4 flex items-center gap-2 sm:mb-6">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 backdrop-blur-md sm:h-8 sm:w-8">
              <MapPin size={14} className="text-white" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-white sm:text-sm">
              Dineout
            </span>
          </div>

          <h1 className="max-w-xl text-2xl font-black leading-tight text-white sm:text-4xl lg:text-6xl">
            Restaurants With <br className="sm:hidden" /> Great Offers <br />
            Near Me
          </h1>

          <div className="mt-8 flex gap-4">
            <Link to="/restaurants">
              <Button className="h-12 rounded-2xl border-none bg-gradient-to-r from-orange-500 to-brand-500 px-10 font-black uppercase tracking-wider text-white shadow-xl shadow-brand-500/30 transition-all hover:scale-105 hover:shadow-brand-500/40 active:scale-95">
                Explore Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Restaurants */}
      <section className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-[var(--app-text)]">
              Popular Restaurants
            </h2>
            <p className="mt-2 text-[var(--app-muted)]">
              Most loved places by the community
            </p>
          </div>

          <Link
            to="/restaurants"
            className="group flex items-center gap-2 rounded-xl bg-brand-500/10 px-4 py-2 text-sm font-black text-brand-600 transition-all hover:bg-brand-500 hover:text-white"
          >
            View all
            <ChevronRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {popularRestaurants.slice(0, 3).map((res) => (
            <div key={res.id} className="group relative">
              <Card className="h-full overflow-hidden rounded-[32px] border-none bg-[var(--app-surface-strong)] p-0 transition-all hover:shadow-2xl hover:shadow-slate-200 dark:hover:shadow-none">
                <Link
                  to={`/restaurants/${res.id}`}
                  className="relative block h-56 w-full overflow-hidden rounded-xl"
                >
                  <img
                    src={storageUrl(res.banner || res.logo)}
                    alt={res.name}
                    className="h-full rounded-xl w-full object-cover transition duration-500 group-hover:scale-110"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <div className="absolute left-4 top-4 flex gap-2">
                    <Badge className="border-none bg-white/20 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                      {res.cuisine || 'Multi-cuisine'}
                    </Badge>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Star size={16} className="fill-amber-400 text-amber-400" />
                      <span>{Number(res.rating || 4.2).toFixed(1)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold opacity-90">
                      <Clock size={14} />
                      <span>30-40 min</span>
                    </div>
                  </div>
                </Link>

                <div className="space-y-4 p-6">
                  <div className="space-y-1">
                    <Link to={`/restaurants/${res.id}`}>
                      <h3 className="truncate text-xl font-black text-[var(--app-text)] transition group-hover:text-brand-600">
                        {res.name}
                      </h3>
                    </Link>

                    <div className="flex items-center gap-2 text-sm font-bold text-[var(--app-muted)]">
                      <MapPin size={14} className="text-brand-500" />
                      <span className="truncate">
                        {res.area}
                        {res.city ? `, ${res.city}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[color:var(--app-border)] pt-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--app-muted)]">
                        Min Order
                      </span>
                      <span className="text-sm font-black text-[var(--app-text)]">
                        {currency(res.min_order_value || 0)}
                      </span>
                    </div>

                    <Link to={`/restaurants/${res.id}`}>
                      <Button className="rounded-xl bg-brand-500 px-5 text-[11px] font-black uppercase tracking-wider shadow-lg shadow-brand-500/20 hover:bg-brand-600">
                        View Menu
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* Best Selling Foods */}
      <section className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-[var(--app-text)]">
              Best Selling Foods
            </h2>
            <p className="mt-2 text-[var(--app-muted)]">
              Explore the most ordered dishes this week
            </p>
          </div>

          <Link
            to="/foods"
            className="group flex items-center gap-2 rounded-xl bg-brand-500/10 px-4 py-2 text-sm font-black text-brand-600 transition-all hover:bg-brand-500 hover:text-white"
          >
            View all
            <ChevronRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {bestSellers.map((food) => (
            <div key={food.id} className="group relative">
              <Card className="flex h-full flex-col gap-4 rounded-[32px] border-none bg-[var(--app-surface-strong)] p-4 transition-all hover:shadow-2xl hover:shadow-slate-200 dark:hover:shadow-none">
                <Link
                  to={`/foods/${food.id}`}
                  className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100"
                >
                  <img
                    src={storageUrl(food.image)}
                    alt={food.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                </Link>

                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      tone={food.is_veg ? 'green' : 'red'}
                      className="rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                    >
                      {food.is_veg ? 'Veg' : 'Non-veg'}
                    </Badge>

                    <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-500 dark:bg-amber-500/10">
                      <Star size={12} className="fill-amber-500" />
                      {Number(food.rating || 4.5).toFixed(1)}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="truncate text-lg font-black text-[var(--app-text)] transition group-hover:text-brand-600">
                      {food.name}
                    </h3>

                    <p className="truncate text-xs font-bold text-[var(--app-muted)]">
                      {food.restaurant_name}
                    </p>

                    <p className="text-[11px] font-medium text-[var(--app-muted)]">
                      {food.category_name || 'Food'} | {food.prep_time || '20 min'}
                    </p>
                  </div>

                  <div className="mt-auto pt-2">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-[var(--app-text)]">
                          {currency(food.price)}
                        </span>

                        {Number(food.price) < 200 && (
                          <span className="text-xs font-bold text-[var(--app-muted)] line-through">
                            {currency(Number(food.price) + 40)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="ghost"
                        className="h-10 rounded-xl border-slate-100 text-[9.4px] font-black uppercase tracking-tight dark:border-white/10"
                        onClick={() => handleAddToCart(food, true)}
                      >
                        Buy now
                      </Button>

                      <Button
                        className="h-10 rounded-xl bg-brand-500 text-[9.4px] font-black uppercase tracking-tight shadow-lg shadow-brand-500/20 hover:bg-brand-600"
                        onClick={() => handleAddToCart(food)}
                      >
                        Add to cart
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}