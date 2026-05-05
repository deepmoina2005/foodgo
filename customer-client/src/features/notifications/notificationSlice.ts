import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type NotificationItem = {
  id?: string | number;
  is_read?: boolean;
  [key: string]: unknown;
};

type NotificationState = {
  notifications: NotificationItem[];
  unreadCount: number;
};

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications(state, action: PayloadAction<NotificationItem[]>) {
      state.notifications = action.payload ?? [];
      state.unreadCount = (action.payload ?? []).filter((notification) => !notification.is_read).length;
    },
    markNotificationRead(state, action: PayloadAction<string | number>) {
      state.notifications = state.notifications.map((notification) =>
        String(notification.id) === String(action.payload) ? { ...notification, is_read: true } : notification,
      );
      state.unreadCount = state.notifications.filter((notification) => !notification.is_read).length;
    },
    resetNotifications() {
      return initialState;
    },
  },
});

export const { setNotifications, markNotificationRead, resetNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
