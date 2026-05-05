import { useEffect, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChefHat,
  ClipboardList,
  ChevronDown,
  House,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  Users,
  X,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout } from '../../features/auth/authSlice';
import { setNotifications } from '../../features/notifications/notificationSlice';
import { Button, ThemeToggleButton } from '../common';
import { customerApi } from '../../api/customerApi';

type NavItem = { to: string; label: string; icon: ReactNode };
type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'foodgo-theme';

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}

function useThemeMode() {
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'dark' : 'light');
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  return {
    theme,
    toggleTheme: () => setTheme((value) => (value === 'dark' ? 'light' : 'dark')),
  };
}

const routeMap: Record<string, Array<NavItem>> = {
  customer: [
    { to: '/restaurants', label: 'Restaurants', icon: <ChefHat size={18} /> },
    { to: '/foods', label: 'Foods', icon: <ShoppingBag size={18} /> },
    { to: '/orders', label: 'Orders', icon: <ClipboardList size={18} /> },
    { to: '/profile', label: 'Profile', icon: <Users size={18} /> },
    { to: '/addresses', label: 'Addresses', icon: <House size={18} /> },
    { to: '/complaints', label: 'Complaints', icon: <Menu size={18} /> },
  ],
};


function DashboardFooter() {
  return (
    <footer className="mt-auto border-t border-[color:var(--app-border)] py-12 px-4 lg:px-8 bg-[var(--app-surface-soft)] text-[var(--app-muted)]">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 font-black tracking-tight text-[var(--app-text)]">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-sm shadow-brand-500/20">
                <ChefHat size={20} />
              </span>
              <span>FoodGo Customer</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              Experience the best food delivery in your city. Fresh ingredients, fast delivery, and premium service.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-[var(--app-text)] mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><NavLink to="/restaurants" className="hover:text-brand-500">Restaurants</NavLink></li>
              <li><NavLink to="/foods" className="hover:text-brand-500">Foods</NavLink></li>
              <li><NavLink to="/orders" className="hover:text-brand-500">My Orders</NavLink></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-[var(--app-text)] mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><NavLink to="/profile" className="hover:text-brand-500">Profile</NavLink></li>
              <li><NavLink to="/complaints" className="hover:text-brand-500">Help & Support</NavLink></li>
              <li><NavLink to="/notifications" className="hover:text-brand-500">Notifications</NavLink></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-[color:var(--app-border)] text-center text-xs">
          <p>© {new Date().getFullYear()} FoodGo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function DashboardNavbar({
  user,
  navItems,
  notificationsPath,
  mobileOpen,
  setMobileOpen,
  profileOpen,
  setProfileOpen,
  theme,
  onToggleTheme,
  onLogout,
  cartCount,
}: {
  user: { name?: string; email?: string } | null;
  navItems: Array<NavItem>;
  notificationsPath?: string;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
  profileOpen: boolean;
  setProfileOpen: (value: boolean) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onLogout: () => void;
  cartCount?: number;
  notificationsCount?: number;
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'restaurants' | 'foods'>('restaurants');
  const [isScopeOpen, setIsScopeOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/${searchScope}?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const initials = (user?.name ?? 'Customer')
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--app-border)] bg-white dark:bg-[#111827]">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-5 lg:px-8">
        <div className="flex items-center gap-4 lg:gap-12">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 sm:gap-3 font-black tracking-tight text-[var(--app-text)] transition-all hover:opacity-80 flex-shrink-0">
            <span className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-xl shadow-brand-500/30">
              <ChefHat size={20} className="sm:hidden" />
              <ChefHat size={22} className="hidden sm:block" />
            </span>
            <span className="text-xl sm:text-2xl">FoodGo</span>
          </NavLink>

          <form
            onSubmit={handleSearch}
            className="hidden lg:flex flex-1 items-center bg-transparent rounded-2xl border-2 border-[color:var(--app-border)] focus-within:border-brand-500 focus-within:ring-0 transition-all max-w-3xl overflow-visible group relative"
          >
            {/* Custom Scope Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsScopeOpen(!isScopeOpen)}
                className="flex items-center gap-2 px-5 py-3 border-r border-[color:var(--app-border)] hover:bg-[var(--app-hover)] transition-all cursor-pointer group/scope"
              >
                <span className="text-[11px] font-black uppercase tracking-widest text-[var(--app-text)] group-hover/scope:text-brand-500 transition-colors">
                  {searchScope}
                </span>
                <ChevronDown size={14} className={`text-[var(--app-muted)] transition-transform duration-300 ${isScopeOpen ? 'rotate-180' : ''}`} />
              </button>

              {isScopeOpen && (
                <>
                  <div className="fixed inset-0 z-[60]" onClick={() => setIsScopeOpen(false)} />
                  <div className="absolute top-full left-0 mt-2 w-48 bg-[var(--app-surface-strong)] border border-[color:var(--app-border)] rounded-2xl shadow-2xl overflow-hidden z-[70] animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl">
                    {(['restaurants', 'foods'] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setSearchScope(option);
                          setIsScopeOpen(false);
                        }}
                        className={`w-full px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-between group/opt ${searchScope === option ? 'text-brand-500 bg-brand-500/5' : 'text-[var(--app-text)] hover:bg-[var(--app-hover)]'
                          }`}
                      >
                        {option}
                        {searchScope === option && <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Input Area */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsScopeOpen(false)}
              placeholder={`Search for your favorite ${searchScope}...`}
              className="!bg-transparent flex-1 px-5 py-3 border-none outline-none text-sm text-[var(--app-text)] placeholder:text-[var(--app-muted)] font-medium"
            />

            {/* Right Search Button */}
            <button
              type="submit"
              className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 transition-colors flex items-center justify-center border-l border-brand-600/20 rounded-r-2xl"
            >
              <Search size={20} strokeWidth={2.5} />
            </button>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-5 flex-shrink-0 ml-auto">
            {/* Mobile Search Toggle */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="lg:hidden rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface)] p-2 text-[var(--app-muted)] shadow-sm transition hover:bg-[var(--app-hover)]"
              aria-label="Toggle search"
            >
              <Search size={18} />
            </button>

            <ThemeToggleButton theme={theme} onToggle={onToggleTheme} className="hidden sm:inline-flex" />

            {notificationsPath ? (
              <NavLink
                to={notificationsPath}
                className="relative rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface)] p-2 sm:p-2.5 text-[var(--app-muted)] shadow-sm transition hover:bg-[var(--app-hover)]"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {Number(notificationsPath ?? 0) > 0 ? (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-[var(--app-surface)]">
                    {notificationsPath}
                  </span>
                ) : null}
              </NavLink>
            ) : null}

            <NavLink
              to="/cart"
              className="relative rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface)] p-2 sm:p-2.5 text-[var(--app-muted)] shadow-sm transition hover:bg-[var(--app-hover)]"
              aria-label="Cart"
            >
              <ShoppingBag size={18} />
              {Number(cartCount ?? 0) > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-[var(--app-surface)]">
                  {cartCount}
                </span>
              ) : null}
            </NavLink>

            {user ? (
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex flex-col items-start gap-0.5 rounded-xl px-3 py-1 hover:bg-[var(--app-hover)] transition-all text-left"
                >
                  <span className="text-[10px] font-medium text-[var(--app-muted)] leading-none">
                    Hello, {user?.name?.split(' ')[0] ?? 'User'}
                  </span>
                  <span className="flex items-center gap-1 text-[13px] font-bold text-[var(--app-text)] leading-none">
                    Account & Lists
                    <ChevronDown size={12} className="text-[var(--app-muted)] ml-0.5" />
                  </span>
                </button>

                {profileOpen ? (
                  <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface-strong)] p-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="rounded-2xl bg-[var(--app-surface-soft)] p-3 mb-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">Signed in as</p>
                      <p className="mt-2 text-sm font-semibold text-[var(--app-text)]">{user?.name ?? 'Guest'}</p>
                      <p className="text-xs text-[var(--app-muted)] truncate">{user?.email ?? ''}</p>
                    </div>
                    <div className="grid gap-1">
                      {navItems.map((item) => (
                        <NavLink key={item.to} to={item.to} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--app-text)] hover:bg-[var(--app-hover)]">
                          <span className="text-slate-400">{item.icon}</span>
                          {item.label}
                        </NavLink>
                      ))}
                      <div className="h-px bg-[color:var(--app-border)] my-2" />
                      <button
                        type="button"
                        onClick={onLogout}
                        className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="hidden sm:block">
                <NavLink to="/login">
                  <Button className="rounded-xl font-bold px-6 text-brand-500">
                    Sign In
                  </Button>
                </NavLink>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface)] p-2 sm:p-2.5 text-[var(--app-text)] shadow-sm"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Search Bar - Collapsible */}
        {mobileSearchOpen && (
          <div className="mt-4 lg:hidden animate-in slide-in-from-top-4 duration-300">
            <form
              onSubmit={handleSearch}
              className="flex flex-col gap-3 p-1"
            >
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--app-surface-soft)] rounded-2xl border border-[color:var(--app-border)] focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500/50 transition-all">
                <select
                  value={searchScope}
                  onChange={(e) => setSearchScope(e.target.value as any)}
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest text-brand-600 outline-none cursor-pointer"
                >
                  <option value="restaurants">Restaurants</option>
                  <option value="foods">Foods</option>
                </select>
                <div className="h-4 w-px bg-[color:var(--app-border)] mx-1" />
                <Search size={16} className="text-[var(--app-muted)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${searchScope}...`}
                  className="!bg-transparent border-none outline-none text-[13px] w-full text-[var(--app-text)] placeholder:text-[var(--app-muted)]"
                  autoFocus
                />
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer Content */}
          <div className="fixed inset-y-0 right-0 w-[85%] max-w-xs bg-[var(--app-surface-strong)] p-6 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center text-white">
                  <ChefHat size={18} />
                </div>
                <span className="font-black text-lg">FoodGo</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>

            {user ? (
              <div className="rounded-2xl bg-[var(--app-surface-soft)] p-4 mb-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white text-sm font-bold">
                    {initials}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold truncate">{user?.name ?? 'Guest'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email ?? ''}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6 flex flex-col gap-3">
                <NavLink to="/login" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full h-12 rounded-2xl justify-center font-bold">
                    Sign In
                  </Button>
                </NavLink>
                <NavLink to="/signup" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full h-12 rounded-2xl justify-center font-bold border-2">
                    Create Account
                  </Button>
                </NavLink>
              </div>
            )}

            <nav className="flex-1 overflow-y-auto grid gap-1 pr-2 -mr-2">
              <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Navigation</p>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-4 py-3.5 text-sm font-bold transition-all rounded-2xl ${isActive
                      ? 'text-brand-600 bg-brand-50 dark:bg-brand-500/10'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5'
                    }`
                  }
                >
                  <span className={clsx(
                    "p-2 rounded-xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-white/5 dark:ring-white/5",
                  )}>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {user && (
              <div className="mt-auto pt-6 border-t border-slate-100 dark:border-white/5 flex-shrink-0">
                <Button variant="danger" className="w-full h-12 rounded-2xl justify-center font-bold" onClick={onLogout}>
                  <LogOut size={18} className="mr-2" /> Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteLayout({ children }: { children?: ReactNode }) {
  const { theme, toggleTheme } = useThemeMode();

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)]">
      <header className="sticky top-0 z-40 border-b border-[color:var(--app-border)] bg-[var(--app-surface)]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
          <NavLink to="/" className="flex items-center gap-3 font-black tracking-tight text-[var(--app-text)]">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-sm shadow-brand-500/20">
              <ChefHat size={20} />
            </span>
            <span>FoodGo Customer</span>
          </NavLink>

          <div className="flex items-center gap-2">
            <ThemeToggleButton theme={theme} onToggle={toggleTheme} className="hidden sm:inline-flex" />
            <NavLink to="/login">
              <Button variant="ghost">Login</Button>
            </NavLink>
            <NavLink to="/signup">
              <Button>Sign up</Button>
            </NavLink>
          </div>
        </div>
      </header>
      <main>{children ?? <Outlet />}</main>
    </div>
  );
}

export function AuthLayout() {
  useThemeMode();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--app-bg)] p-4 text-[var(--app-text)] overflow-hidden">
      {/* Background blobs for premium feel */}
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-brand-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      <main className="relative z-10 w-full max-w-[min(100%,1100px)]">
        <Outlet />
      </main>
    </div>
  );
}

export function CustomerLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user) as { name?: string; email?: string } | null;
  const cartItems = useAppSelector((state) => state.cart.items);
  const unreadNotifications = useAppSelector((state) => state.notifications.unreadCount);
  const allNavItems = routeMap.customer;
  const navItems = user
    ? allNavItems
    : allNavItems.filter(item => ['/restaurants', '/foods'].includes(item.to));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { theme, toggleTheme } = useThemeMode();
  const cartCount = cartItems?.length ?? 0;

  useEffect(() => {
    if (user) {
      customerApi.notifications().then((res) => {
        dispatch(setNotifications(res.data.data.notifications));
      }).catch(err => console.error('Failed to fetch notifications', err));
    }
  }, [user, dispatch]);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--app-bg)] text-[var(--app-text)]">
      <DashboardNavbar
        user={user}
        navItems={navItems}
        notificationsPath={user ? "/notifications" : undefined}
        notificationsCount={unreadNotifications}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        cartCount={cartCount}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 lg:px-8">
        <Outlet />
      </main>

      <DashboardFooter />
    </div>
  );
}

export const DashboardLayout = CustomerLayout;