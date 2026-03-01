import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  notifications: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    // FIX: API returns a plain array, not { notifications, unreadCount }
    setNotifications: (state, action) => {
      const list = Array.isArray(action.payload) ? action.payload : [];
      state.notifications = list;
      state.unreadCount = list.filter((n) => !n.isRead).length;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    markAsReadInState: (state, action) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsReadInState: (state) => {
      state.notifications.forEach((n) => (n.isRead = true));
      state.unreadCount = 0;
    },
  },
});

export const { setNotifications, addNotification, markAsReadInState, markAllAsReadInState } =
  notificationSlice.actions;
export default notificationSlice.reducer;
