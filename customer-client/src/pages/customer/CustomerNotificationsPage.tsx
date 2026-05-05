import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { customerApi } from '../../api/customerApi';
import { useAppDispatch } from '../../hooks/redux';
import { markNotificationRead, setNotifications } from '../../features/notifications/notificationSlice';
import { Badge, Button, Card, EmptyState, LoadingState } from '../../components/common';
import { PageShell } from '../PageShell';


function useAsyncResource<T>(factory: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    factory()
      .then((response) => {
        if (active) setData(response);
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


export function CustomerNotificationsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const dispatch = useAppDispatch();

  const { data, loading, error } = useAsyncResource<{ notifications: any[] }>(async () => {
    const response = await customerApi.notifications();
    const notifications = response.data.data.notifications ?? [];
    dispatch(setNotifications(notifications));
    return { notifications };
  }, [refreshKey, dispatch]);

  const markRead = async (id: number | string) => {
    try {
      await customerApi.readNotification(id);
      dispatch(markNotificationRead(id));
      setRefreshKey((value) => value + 1);
      toast.success('Notification marked as read');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to update notification');
    }
  };

  const markAllRead = async () => {
    try {
      await customerApi.readAllNotifications();
      setRefreshKey((value) => value + 1);
      toast.success('All notifications marked as read');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to update notifications');
    }
  };

  return (
    <PageShell eyebrow="Customer" title="Notifications" description="Database-backed order, coupon, and complaint updates.">
      {loading ? <LoadingState /> : null}
      {error ? <Card className="border-rose-200 text-rose-700">{error}</Card> : null}
      {!loading && data ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">All notifications</h3>
              <p className="text-sm text-slate-500">Order placement, status updates, complaint replies, and coupon alerts.</p>
            </div>
            {data.notifications.length ? <Button variant="ghost" type="button" onClick={markAllRead}>Mark all read</Button> : null}
          </div>
          <div className="mt-4 space-y-3">
            {data.notifications.length ? data.notifications.map((notification: any) => (
              <div key={notification.id} className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{notification.title}</p>
                    {!notification.is_read ? <Badge tone="orange">Unread</Badge> : <Badge tone="slate">Read</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                </div>
                {!notification.is_read ? <Button variant="ghost" type="button" onClick={() => markRead(notification.id)}>Mark read</Button> : null}
              </div>
            )) : <EmptyState title="No notifications yet" description="You will see order and support events here." />}
          </div>
        </Card>
      ) : null}
    </PageShell>
  );
}
