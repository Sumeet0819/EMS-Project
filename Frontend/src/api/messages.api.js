import client from './client';

/** Fetch conversations list (users I have exchanged messages with) */
export const getConversations = () =>
  client.get('/messages/conversations');

/** Fetch full message history with a specific user */
export const getMessages = (userId) =>
  client.get(`/messages/${userId}`);

/** Send a direct message */
export const sendDM = (receiverId, content) =>
  client.post('/messages', { receiverId, content });

/** Mark all messages from a user as read */
export const markDmRead = (userId) =>
  client.patch(`/messages/${userId}/read`);

/** Get unread counts grouped by sender */
export const getUnreadCounts = () =>
  client.get('/messages/unreads');
