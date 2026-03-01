import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  channels: [],        // list of channels with unreadCount per channel
  activeChannel: null, // the channel currently open
  channelMessages: [], // messages for the active channel
};

const channelSlice = createSlice({
  name: 'channels',
  initialState,
  reducers: {
    setChannels(state, action) {
      state.channels = action.payload;
    },
    addChannel(state, action) {
      if (!state.channels.find(c => c.id === action.payload.id)) {
        state.channels.push(action.payload);
      }
    },
    removeChannel(state, action) {
      state.channels = state.channels.filter(c => c.id !== action.payload);
      if (state.activeChannel?.id === action.payload) {
        state.activeChannel = null;
        state.channelMessages = [];
      }
    },
    setActiveChannel(state, action) {
      state.activeChannel = action.payload;
      state.channelMessages = [];
      // Reset unread count when opening a channel
      if (action.payload) {
        const ch = state.channels.find(c => c.id === action.payload.id);
        if (ch) ch.unreadCount = 0;
      }
    },
    setChannelMessages(state, action) {
      state.channelMessages = action.payload;
    },
    addChannelMessage(state, action) {
      state.channelMessages.push(action.payload);
    },
    incrementChannelUnread(state, action) {
      const channelId = action.payload;
      const ch = state.channels.find(c => c.id === channelId);
      if (ch && state.activeChannel?.id !== channelId) {
        ch.unreadCount = (ch.unreadCount || 0) + 1;
      }
    },
    // Explicit setter (e.g. after fetching fresh data)
    setChannelUnread(state, action) {
      const { channelId, count } = action.payload;
      const ch = state.channels.find(c => c.id === channelId);
      if (ch) ch.unreadCount = count;
    },
  },
});

export const {
  setChannels,
  addChannel,
  removeChannel,
  setActiveChannel,
  setChannelMessages,
  addChannelMessage,
  incrementChannelUnread,
  setChannelUnread,
} = channelSlice.actions;

export default channelSlice.reducer;
