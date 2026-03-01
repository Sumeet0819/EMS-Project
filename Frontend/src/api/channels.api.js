import client from './client';

/** Fetch all channels the current user is a member of */
export const getChannels = () =>
  client.get('/channels');

/** Create a new channel (admin only) */
export const createChannel = (name, description, isBroadcast) =>
  client.post('/channels', { name, description, isBroadcast });

/** Delete a channel (admin only) */
export const deleteChannel = (channelId) =>
  client.delete(`/channels/${channelId}`);

/** Add members to a channel */
export const addChannelMembers = (channelId, userIds) =>
  client.post(`/channels/${channelId}/members`, { userIds });

/** Fetch full message history for a channel */
export const getChannelMessages = (channelId) =>
  client.get(`/channels/${channelId}/messages`);

/** Send a message to a channel */
export const sendChannelMessage = (channelId, content) =>
  client.post(`/channels/${channelId}/messages`, { content });

/** Mark channel messages as read (update lastReadAt timestamp) */
export const markChannelRead = (channelId) =>
  client.patch(`/channels/${channelId}/read`);
