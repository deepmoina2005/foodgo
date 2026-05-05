import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChefHat,
  ClipboardList,
  ChevronDown,
  House,
  LayoutDashboard,
  LogOut,
  Menu,
  ShoppingBag,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout } from '../../features/auth/authSlice';
import { Button, ThemeToggleButton } from '../common';

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
    const listener = (event: MediaQueryListEvent) => setTheme(event.matches ? 'dark' : 'light');
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  return { theme, toggleTheme: () => setTheme((value) => (value === 'dark' ? 'light' : 'dark')) };
}

const routeMap: Record<string, Array<NavItem>> = {
  vendor: [
    { to: '/vendor/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/vendor/profile', label: 'Profile', icon: <Users size={18} /> },
    { to: '/vendor/restaurant', label: 'Restaurant', icon: <ChefHat size={18} /> },
    { to: '/vendor/foods', label: 'Foods', icon: <ShoppingBag size={18} /> },
    { to: '/vendor/orders', label: 'Orders', icon: <ClipboardList size={18} /> },
    { to: '/vendor/reports', label: 'Reports', icon: <Sparkles size={18} /> },
    { to: '/vendor/payouts', label: 'Payouts', icon: <House size={18} /> },
    { to: '/vendor/settings', label: 'Settings', icon: <Menu size={18} /> },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/admin/customers', label: 'Customers', icon: <Users size={18} /> },
    { to: '/admin/vendors', label: 'Vendors', icon: <ChefHat size={18} /> },
    { to: '/admin/vendor-approvals', label: 'Vendor approvals', icon: <Menu size={18} /> },
    { to: '/admin/restaurants', label: 'Restaurants', icon: <ChefHat size={18} /> },
    { to: '/admin/delivery-partners', label: 'Delivery partners', icon: <Users size={18} /> },
    { to: '/admin/delivery-approvals', label: 'Delivery approvals', icon: <Menu size={18} /> },
    { to: '/admin/categories', label: 'Categories', icon: <House size={18} /> },
    { to: '/admin/coupons', label: 'Coupons', icon: <Menu size={18} /> },
    { to: '/admin/complaints', label: 'Complaints', icon: <Menu size={18} /> },
    { to: '/admin/reports', label: 'Reports', icon: <Sparkles size={18} /> },
  ],
  delivery_partner: [
    { to: '/delivery/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/delivery/available-requests', label: 'Pickup requests', icon: <ClipboardList size={18} /> },
    { to: '/delivery/profile', label: 'Profile', icon: <Users size={18} /> },
    { to: '/delivery/orders', label: 'Orders', icon: <ClipboardList size={18} /> },
    { to: '/delivery/history', label: 'History', icon: <Sparkles size={18} /> },
    { to: '/delivery/earnings', label: 'Earnings', icon: <ShoppingBag size={18} /> },
    { to: '/delivery/ratings', label: 'Ratings', icon: <House size={18} /> },
  ],
};

function roleLabel(role?: string) {
  if (role === 'delivery_partner') return 'Delivery Partner';
  if (role === 'admin') return 'Admin';
  return 'Vendor';
}

function roleSubtitle(role?: string) {
  if (role === 'delivery_partner') return 'Pickup requests, current order, and delivery earnings.';
  if (role === 'admin') return 'Manage users, approvals, orders, reports, and platform operations.';
  return 'Monitor sales, menu items, orders, and restaurant performance.';
}

function navClass(isActive: boolean, theme: ThemeMode) {
  if (theme === 'light') {
    return isActive
      ? 'bg-slate-900 text-white shadow-sm'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950';
  }

  return isActive
    ? 'bg-white text-slate-950 shadow-sm'
    : 'text-white/75 hover:bg-white/10 hover:text-white';
}

function DashboardSidebar({
  navItems,
  onLogout,
  onNavigate,
  theme,
}: {
  navItems: Array<NavItem>;
  onLogout: () => void;
  onNavigate?: () => void;
  theme: ThemeMode;
}) {
  const shellClass = theme === 'light' ? 'text-slate-950' : 'text-[var(--app-sidebar-text)]';
  const brandClass = theme === 'light' ? 'text-slate-950' : 'text-white';
  const logoutClass = theme === 'light'
    ? 'w-full justify-start border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
    : 'w-full justify-start border-white/10 bg-white/5 text-white hover:bg-white/10';

  return (
    <div className={`flex h-full min-h-0 flex-col ${shellClass}`}>
      <NavLink to="/" className={`flex items-center gap-3 font-black tracking-tight ${brandClass}`}>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-sm shadow-brand-500/20">
          <ChefHat size={20} />
        </span>
        <span>FoodGo Console</span>
      </NavLink>

      <nav className="mt-6 flex-1 space-y-2 overflow-y-auto pr-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${navClass(isActive, theme)}`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="pt-6">
        <Button variant="ghost" className={logoutClass} onClick={onLogout}>
          <LogOut size={16} className="mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}

function DashboardTopbar({
  role,
  navItems,
  user,
  currentLabel,
  mobileOpen,
  setMobileOpen,
  profileOpen,
  setProfileOpen,
  theme,
  onToggleTheme,
  onLogout,
}: {
  role?: string;
  navItems: Array<NavItem>;
  user: { name?: string; email?: string } | null;
  currentLabel: string;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
  profileOpen: boolean;
  setProfileOpen: (value: boolean) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onLogout: () => void;
}) {
  const notificationsPath = navItems.find((item) => item.label === 'Notifications')?.to;
  const initials = (user?.name ?? roleLabel(role))
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--app-border)] bg-[var(--app-surface)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 px-4 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface)] p-3 text-[var(--app-text)] shadow-sm lg:hidden"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--app-muted)]">Dashboard</p>
            <h1 className="text-xl font-black text-[var(--app-text)]">{currentLabel}</h1>
            <p className="text-sm text-[var(--app-muted)]">{roleSubtitle(role)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <ThemeToggleButton theme={theme} onToggle={onToggleTheme} className="hidden sm:inline-flex" />
          {notificationsPath ? (
            <NavLink
              to={notificationsPath}
              className="hidden rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface)] p-3 text-[var(--app-muted)] shadow-sm transition hover:bg-[var(--app-hover)] md:inline-flex"
              aria-label="Notifications"
            >
              <Bell size={18} />
            </NavLink>
          ) : null}

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-left shadow-sm transition hover:bg-[var(--app-hover)]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-950">
                {initials}
              </span>
              <span className="hidden text-left md:block">
                <span className="block text-xs text-[var(--app-muted)]">Signed in</span>
                <span className="block max-w-36 truncate text-sm font-semibold text-[var(--app-text)]">{user?.name ?? 'Guest'}</span>
              </span>
              <ChevronDown size={16} className="text-[var(--app-muted)]" />
            </button>

            {profileOpen ? (
              <div className="absolute right-0 top-14 z-40 w-72 rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface)] p-4 shadow-xl">
                <div className="rounded-2xl bg-[var(--app-surface-soft)] p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">Account</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--app-text)]">{user?.name ?? 'Guest'}</p>
                  <p className="text-sm text-[var(--app-muted)]">{user?.email ?? 'No user'}</p>
                </div>
                <div className="mt-3 grid gap-2">
                  {notificationsPath ? (
                    <NavLink to={notificationsPath} className="rounded-2xl px-3 py-2 text-sm font-medium text-[var(--app-text)] hover:bg-[var(--app-hover)]">
                      Open notifications
                    </NavLink>
                  ) : null}
                  <button
                    type="button"
                    onClick={onLogout}
                    className="rounded-2xl px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

export function SiteLayout({ children }: { children?: ReactNode }) {
  const { theme, toggleTheme } = useThemeMode();

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)]">
      <header className="sticky top-0 z-40 border-b border-[color:var(--app-border)] bg-[var(--app-surface)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
          <NavLink to="/" className="flex items-center gap-3 font-black tracking-tight text-[var(--app-text)]">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-sm shadow-brand-500/20">
              <ChefHat size={20} />
            </span>
            <span>FoodGo</span>
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

export function DashboardLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const role = useAppSelector((state) => state.auth.user?.role as keyof typeof routeMap | undefined);
  const user = useAppSelector((state) => state.auth.user) as { name?: string; email?: string } | null;
  const navItems = role ? routeMap[role] ?? [] : [];
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { theme, toggleTheme } = useThemeMode();

  const currentLabel = useMemo(() => {
    const active = navItems.find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`));
    return active?.label ?? roleLabel(role);
  }, [location.pathname, navItems, role]);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)]">
      <div className="flex min-h-screen">
        <aside className={`sticky top-0 hidden h-screen w-80 shrink-0 overflow-hidden border-r px-5 py-6 lg:flex lg:flex-col ${theme === 'light'
          ? 'border-slate-200 bg-white text-slate-950'
          : 'border-[color:var(--app-sidebar-border)] bg-[var(--app-sidebar)] text-[var(--app-sidebar-text)]'
          }`}>
          <DashboardSidebar navItems={navItems} onLogout={handleLogout} theme={theme} />
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" onClick={() => setMobileOpen(false)}>
            <aside
              className={`absolute left-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto px-5 py-6 shadow-2xl ${theme === 'light'
                ? 'bg-white text-slate-950'
                : 'bg-[var(--app-sidebar)] text-[var(--app-sidebar-text)]'
                }`}
              onClick={(event) => event.stopPropagation()}
            >
              <DashboardSidebar navItems={navItems} onLogout={handleLogout} onNavigate={() => setMobileOpen(false)} theme={theme} />
            </aside>
          </div>
        ) : null}

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <DashboardTopbar
            role={role}
            navItems={navItems}
            user={user}
            currentLabel={currentLabel}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
            profileOpen={profileOpen}
            setProfileOpen={setProfileOpen}
            theme={theme}
            onToggleTheme={toggleTheme}
            onLogout={handleLogout}
          />
          <main className="flex-1 bg-[var(--app-bg)] px-4 py-6 text-[var(--app-text)] lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
