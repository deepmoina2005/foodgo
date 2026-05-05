import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'react-toastify';
import { adminApi } from '../../api/adminApi';
import { Badge, Button, Card, EmptyState, LoadingState, StatCard, Table } from '../../components/common';
import { PageShell } from '../PageShell';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setAdminState } from '../../features/admin/adminSlice';
import { currency } from '../../utils/format';

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
        if (active) setData(response.data.data as T);
      })
      .catch((err) => {
        if (active) setError(err?.response?.data?.message ?? 'Unable to load data');
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

function statusTone(status?: string) {
  if (!status) return 'slate' as const;
  if (['delivered', 'paid', 'active', 'approved', 'resolved'].includes(status)) return 'green' as const;
  if (['cancelled', 'rejected', 'blocked', 'failed', 'suspended'].includes(status)) return 'red' as const;
  return 'orange' as const;
}

export function AdminDashboardPage() {
  const dispatch = useAppDispatch();
  const admin = useAppSelector((state) => state.admin);

  useEffect(() => {
    adminApi.dashboard()
      .then((response) => dispatch(setAdminState({ dashboard: response.data.data })))
      .catch(() => toast.error('Unable to load admin dashboard'));
  }, [dispatch]);

  const stats = admin.dashboard?.stats as Record<string, unknown> | undefined;
  const chartData = [
    { name: 'Customers', value: Number(stats?.customers ?? 0) },
    { name: 'Vendors', value: Number(stats?.vendors ?? 0) },
    { name: 'Delivery', value: Number(stats?.delivery_partners ?? 0) },
    { name: 'Orders', value: Number(stats?.orders ?? 0) },
  ];

  return (
    <PageShell eyebrow="Admin" title="Admin dashboard" description="Monitor vendors, customers, delivery partners, commissions, payouts, complaints, and reports.">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Customers" value={String(stats?.customers ?? 0)} />
        <StatCard label="Vendors" value={String(stats?.vendors ?? 0)} />
        <StatCard label="Delivery partners" value={String(stats?.delivery_partners ?? 0)} />
        <StatCard label="Revenue" value={currency(stats?.revenue as number)} />
      </div>
      <Card className="mt-6 h-80">
        <h3 className="mb-4 text-lg font-bold">Platform snapshot</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#f97316" radius={[12, 12, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </PageShell>
  );
}

export function CustomersPage() {
  const { data, loading, setData } = useAsyncResource<any>(() => adminApi.customers(), []);
  const customers = data?.customers ?? [];

  const toggle = async (id: number, blocked: boolean) => {
    if (blocked) {
      await adminApi.unblockCustomer(id);
    } else {
      await adminApi.blockCustomer(id);
    }
    toast.success('Customer status updated');
    const response = await adminApi.customers();
    setData(response.data.data);
  };

  return (
    <PageShell eyebrow="Admin" title="Customers" description="View, block, and unblock customer accounts.">
      {loading ? <LoadingState /> : null}
      {!loading ? (
        <Table
          columns={['Name', 'Email', 'Status', 'Actions']}
          rows={customers.map((customer: any) => [
            <span key="a" className="font-semibold">{customer.name}</span>,
            <span key="b">{customer.email}</span>,
            <Badge key="c" tone={statusTone(customer.account_status)}>{customer.account_status}</Badge>,
            <Button key="d" variant="danger" onClick={() => toggle(customer.id, customer.account_status === 'blocked')}>{customer.account_status === 'blocked' ? 'Unblock' : 'Block'}</Button>,
          ])}
        />
      ) : null}
    </PageShell>
  );
}

export function VendorsPage() {
  const { data, loading, setData } = useAsyncResource<any>(() => adminApi.vendors(), []);
  const vendors = data?.vendors ?? [];

  const refresh = async () => {
    const response = await adminApi.vendors();
    setData(response.data.data);
  };

  const approve = async (id: number) => {
    await adminApi.approveVendor(id);
    toast.success('Vendor approved');
    await refresh();
  };
  const reject = async (id: number) => {
    await adminApi.rejectVendor(id);
    toast.success('Vendor rejected');
    await refresh();
  };
  const suspend = async (id: number) => {
    await adminApi.suspendVendor(id);
    toast.success('Vendor suspended');
    await refresh();
  };

  return (
    <PageShell eyebrow="Admin" title="Vendors" description="Approve, reject, suspend, and verify vendor documents.">
      {loading ? <LoadingState /> : null}
      {!loading ? (
        <Table
          columns={['Name', 'Email', 'Status', 'Commission', 'Actions']}
          rows={vendors.map((vendor: any) => [
            <span key="a" className="font-semibold">{vendor.name}</span>,
            <span key="b">{vendor.email}</span>,
            <Badge key="c" tone={statusTone(vendor.status)}>{vendor.status}</Badge>,
            <span key="d">{String(vendor.commission_percentage)}%</span>,
            <div key="e" className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => approve(vendor.id)}>Approve</Button>
              <Button variant="ghost" onClick={() => reject(vendor.id)}>Reject</Button>
              <Button variant="danger" onClick={() => suspend(vendor.id)}>Suspend</Button>
            </div>,
          ])}
        />
      ) : null}
    </PageShell>
  );
}

export function VendorApprovalsPage() {
  const { data, loading, setData } = useAsyncResource<any>(() => adminApi.pendingVendors(), []);
  const vendors = data?.vendors ?? [];

  const refresh = async () => {
    const response = await adminApi.pendingVendors();
    setData(response.data.data);
  };

  return (
    <PageShell eyebrow="Admin" title="Vendor approvals" description="Pending vendor onboarding requests.">
      {loading ? <LoadingState /> : null}
      {!loading ? (
        <Table
          columns={['Name', 'Email', 'Status', 'Actions']}
          rows={vendors.map((vendor: any) => [
            <span key="a" className="font-semibold">{vendor.name}</span>,
            <span key="b">{vendor.email}</span>,
            <Badge key="c" tone={statusTone(vendor.status)}>{vendor.status}</Badge>,
            <div key="d" className="flex flex-wrap gap-2">
              <Button onClick={async () => { await adminApi.approveVendor(vendor.id); await refresh(); }}>Approve</Button>
              <Button variant="danger" onClick={async () => { await adminApi.rejectVendor(vendor.id); await refresh(); }}>Reject</Button>
            </div>,
          ])}
        />
      ) : null}
    </PageShell>
  );
}

export function RestaurantsPage() {
  const { data, loading, setData } = useAsyncResource<any>(() => adminApi.restaurants(), []);
  const restaurants = data?.restaurants ?? [];

  const refresh = async () => {
    const response = await adminApi.restaurants();
    setData(response.data.data);
  };

  const toggle = async (id: number, active: boolean) => {
    if (active) await adminApi.suspendRestaurant(id); else await adminApi.activateRestaurant(id);
    await refresh();
  };

  return (
    <PageShell eyebrow="Admin" title="Restaurants" description="Activate or suspend restaurants and edit records.">
      {loading ? <LoadingState /> : null}
      {!loading ? (
        <Table
          columns={['Name', 'Area', 'Status', 'Actions']}
          rows={restaurants.map((restaurant: any) => [
            <span key="a" className="font-semibold">{restaurant.name}</span>,
            <span key="b">{restaurant.area}</span>,
            <Badge key="c" tone={statusTone(restaurant.status)}>{restaurant.status}</Badge>,
            <Button key="d" variant={restaurant.status === 'active' ? 'danger' : 'ghost'} onClick={() => toggle(restaurant.id, restaurant.status === 'active')}>{restaurant.status === 'active' ? 'Suspend' : 'Activate'}</Button>,
          ])}
        />
      ) : null}
    </PageShell>
  );
}

export function DeliveryPartnersPage() {
  const { data, loading } = useAsyncResource<any>(() => adminApi.deliveryPartners(), []);
  const partners = data?.delivery_partners ?? [];
  return (
    <PageShell eyebrow="Admin" title="Delivery partners" description="View delivery accounts and their KYC status.">
      {loading ? <LoadingState /> : null}
      {!loading ? (
        <Table
          columns={['Name', 'Phone', 'Status', 'KYC']}
          rows={partners.map((partner: any) => [
            <span key="a" className="font-semibold">{partner.full_name ?? partner.name}</span>,
            <span key="b">{partner.phone}</span>,
            <Badge key="c" tone={statusTone(partner.status)}>{partner.status}</Badge>,
            <Badge key="d" tone={statusTone(partner.kyc_status)}>{partner.kyc_status}</Badge>,
          ])}
        />
      ) : null}
    </PageShell>
  );
}

export function DeliveryApprovalsPage() {
  const { data, loading, setData } = useAsyncResource<any>(() => adminApi.pendingDeliveryPartners(), []);
  const partners = data?.delivery_partners ?? [];

  const refresh = async () => {
    const response = await adminApi.pendingDeliveryPartners();
    setData(response.data.data);
  };

  return (
    <PageShell eyebrow="Admin" title="Delivery approvals" description="Review and approve pending delivery partner applications.">
      {loading ? <LoadingState /> : null}
      {!loading ? (
        <Table
          columns={['Name', 'Phone', 'Status', 'Actions']}
          rows={partners.map((partner: any) => [
            <span key="a" className="font-semibold">{partner.full_name ?? partner.name}</span>,
            <span key="b">{partner.phone}</span>,
            <Badge key="c" tone={statusTone(partner.status)}>{partner.status}</Badge>,
            <div key="d" className="flex flex-wrap gap-2">
              <Button onClick={async () => { await adminApi.approveDeliveryPartner(partner.id); await refresh(); }}>Approve</Button>
              <Button variant="danger" onClick={async () => { await adminApi.rejectDeliveryPartner(partner.id); await refresh(); }}>Reject</Button>
            </div>,
          ])}
        />
      ) : null}
    </PageShell>
  );
}

export function CategoriesPage() {
  const { data, loading, setData } = useAsyncResource<any>(() => adminApi.categories(), []);
  const categories = data?.categories ?? [];
  const [form, setForm] = useState<{ name: string; image: FileList | null }>({ name: '', image: null });
  const [editingId, setEditingId] = useState<number | null>(null);

  const refresh = async () => {
    const response = await adminApi.categories();
    setData(response.data.data);
  };

  const submit = async () => {
    const payload = new FormData();
    payload.append('name', form.name);
    if (form.image?.[0]) payload.append('image', form.image[0]);
    if (editingId) {
      await adminApi.updateCategory(editingId, payload);
      toast.success('Category updated');
    } else {
      await adminApi.createCategory(payload);
      toast.success('Category created');
    }
    setForm({ name: '', image: null });
    setEditingId(null);
    await refresh();
  };

  return (
    <PageShell eyebrow="Admin" title="Categories" description="Create and manage food categories.">
      <div className="grid gap-6 lg:grid-cols-2">
      <Card>
          <h3 className="text-lg font-bold">{editingId ? 'Edit category' : 'Create category'}</h3>
          <div className="mt-4 space-y-3">
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} placeholder="Category name" />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="file" onChange={(event) => setForm((value) => ({ ...value, image: event.target.files } as any))} />
            <div className="flex gap-2">
              <Button onClick={submit}>{editingId ? 'Update' : 'Create'}</Button>
              {editingId ? <Button variant="ghost" onClick={() => { setEditingId(null); setForm({ name: '', image: null }); }}>Cancel</Button> : null}
            </div>
          </div>
        </Card>
        <Card>
          {loading ? <LoadingState /> : (
            <Table
              columns={['Name', 'Status', 'Actions']}
              rows={categories.map((category: any) => [
                <span key="a" className="font-semibold">{category.name}</span>,
                <Badge key="b" tone={category.is_active ? 'green' : 'red'}>{category.is_active ? 'Active' : 'Inactive'}</Badge>,
                <div key="c" className="flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => { setEditingId(category.id); setForm({ name: category.name, image: null }); }}>Edit</Button>
                  <Button variant="danger" onClick={async () => { await adminApi.deleteCategory(category.id); await refresh(); }}>Delete</Button>
                </div>,
              ])}
            />
          )}
        </Card>
      </div>
    </PageShell>
  );
}

export function FoodsPage() {
  const { data, loading, setData } = useAsyncResource<any>(() => adminApi.foods(), []);
  const foods = data?.food_items ?? [];
  const refresh = async () => {
    const response = await adminApi.foods();
    setData(response.data.data);
  };
  return (
    <PageShell eyebrow="Admin" title="Food items" description="Enable or disable food items platform-wide.">
      {loading ? <LoadingState /> : (
        <Table
          columns={['Food', 'Restaurant', 'Status', 'Actions']}
          rows={foods.map((food: any) => [
            <span key="a" className="font-semibold">{food.name}</span>,
            <span key="b">{food.restaurant_name}</span>,
            <Badge key="c" tone={food.is_active ? 'green' : 'red'}>{food.is_active ? 'Active' : 'Disabled'}</Badge>,
            <div key="d" className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={async () => { await adminApi.disableFood(food.id); await refresh(); }}>Disable</Button>
              <Button variant="ghost" onClick={async () => { await adminApi.enableFood(food.id); await refresh(); }}>Enable</Button>
            </div>,
          ])}
        />
      )}
    </PageShell>
  );
}

export function BannersPage() {
  const { data, loading, setData } = useAsyncResource<any>(() => adminApi.banners(), []);
  const banners = data?.banners ?? [];
  const [form, setForm] = useState<{ title: string; subtitle: string; link_url: string; image: FileList | null; sort_order: number }>({ title: '', subtitle: '', link_url: '', image: null, sort_order: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);

  const refresh = async () => {
    const response = await adminApi.banners();
    setData(response.data.data);
  };

  const submit = async () => {
    const payload = new FormData();
    payload.append('title', form.title);
    payload.append('subtitle', form.subtitle);
    payload.append('link_url', form.link_url);
    payload.append('sort_order', String(form.sort_order));
    if (form.image?.[0]) payload.append('image', form.image[0]);
    if (editingId) await adminApi.updateBanner(editingId, payload);
    else await adminApi.createBanner(payload);
    toast.success(editingId ? 'Banner updated' : 'Banner created');
    setForm({ title: '', subtitle: '', link_url: '', image: null, sort_order: 0 });
    setEditingId(null);
    await refresh();
  };

  return (
    <PageShell eyebrow="Admin" title="Banners" description="Manage public banners and promotional sliders.">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-bold">{editingId ? 'Edit banner' : 'Create banner'}</h3>
          <div className="mt-4 space-y-3">
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} placeholder="Title" />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.subtitle} onChange={(event) => setForm((value) => ({ ...value, subtitle: event.target.value }))} placeholder="Subtitle" />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.link_url} onChange={(event) => setForm((value) => ({ ...value, link_url: event.target.value }))} placeholder="Link URL" />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="file" onChange={(event) => setForm((value) => ({ ...value, image: event.target.files } as any))} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={String(form.sort_order)} onChange={(event) => setForm((value) => ({ ...value, sort_order: Number(event.target.value) }))} placeholder="Sort order" type="number" />
            <div className="flex gap-2">
              <Button onClick={submit}>{editingId ? 'Update' : 'Create'}</Button>
              {editingId ? <Button variant="ghost" onClick={() => { setEditingId(null); setForm({ title: '', subtitle: '', link_url: '', image: null, sort_order: 0 }); }}>Cancel</Button> : null}
            </div>
          </div>
        </Card>
        <Card>
          {loading ? <LoadingState /> : (
            <Table
              columns={['Title', 'Status', 'Actions']}
              rows={banners.map((banner: any) => [
                <span key="a" className="font-semibold">{banner.title}</span>,
                <Badge key="b" tone={banner.is_active ? 'green' : 'red'}>{banner.is_active ? 'Active' : 'Inactive'}</Badge>,
                <div key="c" className="flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => { setEditingId(banner.id); setForm({ title: banner.title, subtitle: banner.subtitle ?? '', link_url: banner.link_url ?? '', image: null, sort_order: Number(banner.sort_order ?? 0) }); }}>Edit</Button>
                  <Button variant="ghost" onClick={async () => { await adminApi.toggleBanner(banner.id); await refresh(); }}>Toggle</Button>
                  <Button variant="danger" onClick={async () => { await adminApi.deleteBanner(banner.id); await refresh(); }}>Delete</Button>
                </div>,
              ])}
            />
          )}
        </Card>
      </div>
    </PageShell>
  );
}

export function OrdersPage() {
  const { data, loading, setData } = useAsyncResource<any>(() => adminApi.orders(), []);
  const orders = data?.orders ?? [];
  const [assignForm, setAssignForm] = useState({ order_id: '', delivery_partner_id: '' });

  const refresh = async () => {
    const response = await adminApi.orders();
    setData(response.data.data);
  };

  const assign = async () => {
    await adminApi.assignDelivery(assignForm.order_id, { delivery_partner_id: assignForm.delivery_partner_id });
    toast.success('Delivery assigned');
    await refresh();
  };

  return (
    <PageShell eyebrow="Admin" title="Orders" description="Track, cancel, and assign delivery partners to orders.">
      <Card className="mb-6 grid gap-3 md:grid-cols-3">
        <input className="rounded-2xl border border-slate-200 px-4 py-3" value={assignForm.order_id} onChange={(event) => setAssignForm((value) => ({ ...value, order_id: event.target.value }))} placeholder="Order ID" />
        <input className="rounded-2xl border border-slate-200 px-4 py-3" value={assignForm.delivery_partner_id} onChange={(event) => setAssignForm((value) => ({ ...value, delivery_partner_id: event.target.value }))} placeholder="Delivery partner ID" />
        <Button onClick={assign}>Assign delivery</Button>
      </Card>
      {loading ? <LoadingState /> : (
        <Table
          columns={['Order', 'Status', 'Payment', 'Total', 'Actions']}
          rows={orders.map((order: any) => [
            <span key="a" className="font-semibold">{order.order_number}</span>,
            <Badge key="b" tone={statusTone(order.status)}>{order.status}</Badge>,
            <span key="c">{order.payment_status}</span>,
            <span key="d">{currency(order.total_amount)}</span>,
            <div key="e" className="flex flex-wrap gap-2">
              <span className="text-xs text-slate-500">Use details page for tracking</span>
              {order.status !== 'cancelled' ? <Button variant="danger" onClick={async () => { await adminApi.cancelOrder(order.id); await refresh(); }}>Cancel</Button> : null}
              <Button variant="ghost" onClick={async () => { await adminApi.refundOrder(order.id, { reason: 'Admin refund' }); await refresh(); }}>Refund</Button>
            </div>,
          ])}
        />
      )}
    </PageShell>
  );
}

export function OrderDetailsPage() {
  const { id } = useParams();
  const { data, loading } = useAsyncResource<any>(() => adminApi.order(id as string), [id]);
  const order = data?.order;
  const items = data?.items ?? [];
  const assignment = data?.assignment;
  return (
    <PageShell eyebrow="Admin" title={`Order ${id ?? ''}`} description="Administrative order view with tracking and assignments.">
      {loading ? <LoadingState /> : null}
      {!loading && order ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-2">
            <p className="font-bold">{order.order_number}</p>
            <p className="text-sm text-slate-600">Customer: {order.customer_name}</p>
            <p className="text-sm text-slate-600">Restaurant: {order.restaurant_name}</p>
            <div className="flex flex-wrap gap-2">
              <Badge tone={statusTone(order.status)}>{order.status}</Badge>
              <Badge tone={statusTone(order.payment_status)}>{order.payment_status}</Badge>
            </div>
          </Card>
          <Card>
            <h3 className="text-lg font-bold">Items</h3>
            <div className="mt-4 space-y-2">
              {items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>{item.item_name}</span>
                  <span>{item.quantity} x {currency(item.unit_price)}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-bold">Assignment</h3>
            {assignment ? <pre className="mt-4 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-white">{JSON.stringify(assignment, null, 2)}</pre> : <EmptyState title="No delivery assignment" />}
          </Card>
        </div>
      ) : null}
    </PageShell>
  );
}

export function CouponsPage() {
  const { data, loading, setData } = useAsyncResource<any>(() => adminApi.coupons(), []);
  const coupons = data?.coupons ?? [];
  const [form, setForm] = useState({ code: '', title: '', type: 'percent', value: '', min_order_amount: '', max_discount_amount: '', usage_limit: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  const refresh = async () => {
    const response = await adminApi.coupons();
    setData(response.data.data);
  };

  const submit = async () => {
    const payload = { ...form };
    if (editingId) await adminApi.updateCoupon(editingId, payload);
    else await adminApi.createCoupon(payload);
    toast.success(editingId ? 'Coupon updated' : 'Coupon created');
    setEditingId(null);
    setForm({ code: '', title: '', type: 'percent', value: '', min_order_amount: '', max_discount_amount: '', usage_limit: '' });
    await refresh();
  };

  return (
    <PageShell eyebrow="Admin" title="Coupons" description="Create, update, activate, and deactivate coupons.">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-bold">{editingId ? 'Edit coupon' : 'Create coupon'}</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {Object.entries(form).map(([key, value]) => (
              <input key={key} className="rounded-2xl border border-slate-200 px-4 py-3" value={value} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} placeholder={key} />
            ))}
            <div className="md:col-span-2 flex gap-2">
              <Button onClick={submit}>{editingId ? 'Update' : 'Create'}</Button>
              {editingId ? <Button variant="ghost" onClick={() => { setEditingId(null); setForm({ code: '', title: '', type: 'percent', value: '', min_order_amount: '', max_discount_amount: '', usage_limit: '' }); }}>Cancel</Button> : null}
            </div>
          </div>
        </Card>
        <Card>
          {loading ? <LoadingState /> : (
            <Table
              columns={['Code', 'Title', 'Status', 'Actions']}
              rows={coupons.map((coupon: any) => [
                <span key="a" className="font-semibold">{coupon.code}</span>,
                <span key="b">{coupon.title}</span>,
                <Badge key="c" tone={coupon.is_active ? 'green' : 'red'}>{coupon.is_active ? 'Active' : 'Inactive'}</Badge>,
                <div key="d" className="flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => { setEditingId(coupon.id); setForm({ code: coupon.code, title: coupon.title, type: coupon.type, value: String(coupon.value), min_order_amount: String(coupon.min_order_amount ?? ''), max_discount_amount: String(coupon.max_discount_amount ?? ''), usage_limit: String(coupon.usage_limit ?? '') }); }}>Edit</Button>
                  <Button variant="ghost" onClick={async () => { await adminApi.toggleCoupon(coupon.id); await refresh(); }}>Toggle</Button>
                  <Button variant="danger" onClick={async () => { await adminApi.deleteCoupon(coupon.id); await refresh(); }}>Delete</Button>
                </div>,
              ])}
            />
          )}
        </Card>
      </div>
    </PageShell>
  );
}

export function PaymentsPage() {
  const { data, loading } = useAsyncResource<any>(() => adminApi.payments(), []);
  const payments = data?.payments ?? [];
  return (
    <PageShell eyebrow="Admin" title="Payments" description="Review payment records and COD status updates.">
      {loading ? <LoadingState /> : (
        <Table
          columns={['Order', 'Method', 'Status', 'Amount']}
          rows={payments.map((payment: any) => [
            <span key="a" className="font-semibold">#{payment.order_id}</span>,
            <span key="b">{payment.payment_method}</span>,
            <Badge key="c" tone={statusTone(payment.payment_status)}>{payment.payment_status}</Badge>,
            <span key="d">{currency(payment.amount)}</span>,
          ])}
        />
      )}
    </PageShell>
  );
}

export function PayoutsPage() {
  const { data, loading, setData } = useAsyncResource<any>(() => adminApi.payouts(), []);
  const payouts = data?.vendor_payouts ?? data?.payouts ?? [];
  const [form, setForm] = useState({ vendor_id: '', order_id: '', amount: '', commission_amount: '', payout_status: 'pending' });

  const refresh = async () => {
    const response = await adminApi.payouts();
    setData(response.data.data);
  };

  const submit = async () => {
    await adminApi.createPayout(form);
    toast.success('Payout created');
    setForm({ vendor_id: '', order_id: '', amount: '', commission_amount: '', payout_status: 'pending' });
    await refresh();
  };

  return (
    <PageShell eyebrow="Admin" title="Vendor payouts" description="Manage vendor payout records and processing status.">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-bold">Create payout</h3>
          <div className="mt-4 grid gap-3">
            {Object.entries(form).map(([key, value]) => (
              <input key={key} className="rounded-2xl border border-slate-200 px-4 py-3" value={value} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} placeholder={key} />
            ))}
            <Button onClick={submit}>Save payout</Button>
          </div>
        </Card>
        <Card>
          {loading ? <LoadingState /> : (
            <Table
              columns={['Vendor', 'Amount', 'Status']}
              rows={payouts.map((payout: any) => [
                <span key="a" className="font-semibold">#{payout.vendor_id}</span>,
                <span key="b">{currency(payout.amount)}</span>,
                <Badge key="c" tone={statusTone(payout.payout_status)}>{payout.payout_status}</Badge>,
              ])}
            />
          )}
        </Card>
      </div>
    </PageShell>
  );
}

export function ComplaintsPage() {
  const { data, loading, setData } = useAsyncResource<any>(() => adminApi.complaints(), []);
  const complaints = data?.complaints ?? [];
  const [form, setForm] = useState({ complaint_id: '', admin_reply: '', status: 'in_progress' });

  const refresh = async () => {
    const response = await adminApi.complaints();
    setData(response.data.data);
  };

  const reply = async () => {
    await adminApi.replyComplaint(form.complaint_id, { admin_reply: form.admin_reply, status: form.status });
    toast.success('Complaint replied');
    await refresh();
  };

  return (
    <PageShell eyebrow="Admin" title="Complaints" description="Respond to complaints and update status. Replies are tracked as notifications.">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-bold">Reply to complaint</h3>
          <div className="mt-4 grid gap-3">
            <input className="rounded-2xl border border-slate-200 px-4 py-3" value={form.complaint_id} onChange={(event) => setForm((current) => ({ ...current, complaint_id: event.target.value }))} placeholder="Complaint ID" />
            <textarea className="rounded-2xl border border-slate-200 px-4 py-3" rows={4} value={form.admin_reply} onChange={(event) => setForm((current) => ({ ...current, admin_reply: event.target.value }))} placeholder="Admin reply" />
            <select className="rounded-2xl border border-slate-200 px-4 py-3" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
            <Button onClick={reply}>Submit reply</Button>
          </div>
        </Card>
        <Card>
          {loading ? <LoadingState /> : (
            <Table
              columns={['Subject', 'Status', 'Reply']}
              rows={complaints.map((complaint: any) => [
                <span key="a" className="font-semibold">{complaint.subject}</span>,
                <Badge key="b" tone={statusTone(complaint.status)}>{complaint.status}</Badge>,
                <span key="c" className="text-sm text-slate-600">{complaint.admin_reply ?? '-'}</span>,
              ])}
            />
          )}
        </Card>
      </div>
    </PageShell>
  );
}

export function ReportsPage() {
  const { data, loading } = useAsyncResource<any>(() => Promise.all([
    adminApi.reportDailySales(),
    adminApi.reportMonthlyRevenue(),
    adminApi.reportVendorSales(),
    adminApi.reportCommission(),
    adminApi.reportCancellations(),
    adminApi.reportPayments(),
  ]).then(([dailySales, monthlyRevenue, vendorSales, commission, cancellations, payments]) => ({
    dailySales: dailySales.data.data.report ?? [],
    monthlyRevenue: monthlyRevenue.data.data.report ?? [],
    vendorSales: vendorSales.data.data.report ?? [],
    commission: commission.data.data.report ?? [],
    cancellations: cancellations.data.data.report ?? [],
    payments: payments.data.data.report ?? [],
  })), []);

  return (
    <PageShell eyebrow="Admin" title="Reports" description="Daily sales, monthly revenue, vendor sales, commission, cancellation, and payment reports.">
      {loading ? <LoadingState /> : !data ? null : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h3 className="text-lg font-bold">Daily sales</h3>
            <Table columns={['Day', 'Orders', 'Sales']} rows={data.dailySales.map((row: any) => [
              <span key="a">{String(row.day)}</span>,
              <span key="b">{String(row.orders_count)}</span>,
              <span key="c">{currency(row.total_sales)}</span>,
            ])} />
          </Card>
          <Card>
            <h3 className="text-lg font-bold">Monthly revenue</h3>
            <Table columns={['Month', 'Revenue']} rows={data.monthlyRevenue.map((row: any) => [
              <span key="a">{String(row.month)}</span>,
              <span key="b">{currency(row.revenue)}</span>,
            ])} />
          </Card>
          <Card>
            <h3 className="text-lg font-bold">Vendor sales</h3>
            <Table columns={['Vendor', 'Orders', 'Sales']} rows={data.vendorSales.map((row: any) => [
              <span key="a">{String(row.vendor_name)}</span>,
              <span key="b">{String(row.orders_count)}</span>,
              <span key="c">{currency(row.total_sales)}</span>,
            ])} />
          </Card>
          <Card>
            <h3 className="text-lg font-bold">Commission</h3>
            <Table columns={['Status', 'Count', 'Amount']} rows={data.commission.map((row: any) => [
              <span key="a">{String(row.status)}</span>,
              <span key="b">{String(row.rows_count)}</span>,
              <span key="c">{currency(row.commission_amount)}</span>,
            ])} />
          </Card>
          <Card>
            <h3 className="text-lg font-bold">Cancellations</h3>
            <Table columns={['Day', 'Count']} rows={data.cancellations.map((row: any) => [
              <span key="a">{String(row.day)}</span>,
              <span key="b">{String(row.cancellations)}</span>,
            ])} />
          </Card>
          <Card>
            <h3 className="text-lg font-bold">Payments</h3>
            <Table columns={['Status', 'Count', 'Amount']} rows={data.payments.map((row: any) => [
              <span key="a">{String(row.payment_status)}</span>,
              <span key="b">{String(row.count)}</span>,
              <span key="c">{currency(row.total_amount)}</span>,
            ])} />
          </Card>
        </div>
      )}
    </PageShell>
  );
}

export const SettingsPage = () => (
  <PageShell eyebrow="Admin" title="Settings" description="Platform-wide preferences and operational settings.">
    <Card>
      <p className="text-sm text-slate-600">Operational settings are managed through dedicated CRUD modules such as categories, coupons, banners, and restaurants.</p>
    </Card>
  </PageShell>
);
