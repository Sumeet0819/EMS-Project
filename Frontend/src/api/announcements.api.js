import client from './client';

/** Fetch all announcements */
export const getAnnouncements = () =>
  client.get('/announcements');

/** Create a new announcement (admin only) */
export const createAnnouncement = (title, content) =>
  client.post('/announcements', { title, content });

/** Delete an announcement (admin only) */
export const deleteAnnouncement = (id) =>
  client.delete(`/announcements/${id}`);
