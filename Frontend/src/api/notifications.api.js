import client from './client';

/** Fetch all notifications for the current user */
export const getNotifications = () =>
  client.get('/notifications');

/** Mark a single notification as read */
export const markNotificationRead = (id) =>
  client.patch(`/notifications/${id}/read`);

/** Mark all notifications as read */
export const markAllNotificationsRead = () =>
  client.patch('/notifications/read-all');
