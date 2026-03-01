import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activeChatUser: null,   // { id, name } of user currently open in chat
  messages: [],           // message history with activeChatUser
  conversations: [],      // list of users I have exchanged messages with (from /conversations)
};

const messageSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    setActiveChatUser: (state, action) => {
      state.activeChatUser = action.payload;
      state.messages = []; // clear when switching chats
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    clearMessages: (state) => {
      state.messages = [];
      state.activeChatUser = null;
    },
    // Conversations list
    setConversations: (state, action) => {
      state.conversations = action.payload;
    },
    // Increment unread count for a specific conversation partner
    incrementDmUnread: (state, action) => {
      const partnerId = action.payload;
      const conv = state.conversations.find((c) => c.id === partnerId);
      if (conv) {
        conv.unreadCount = (conv.unreadCount || 0) + 1;
      } else {
        // Unknown partner — flag so component can refetch
        state.conversations.push({ id: partnerId, unreadCount: 1, _partial: true });
      }
    },
    // Clear unread count for a partner (after opening their chat)
    clearDmUnread: (state, action) => {
      const partnerId = action.payload;
      const conv = state.conversations.find((c) => c.id === partnerId);
      if (conv) conv.unreadCount = 0;
    },
    // Add a new conversation partner to the list (after sending first message)
    upsertConversation: (state, action) => {
      const existing = state.conversations.find((c) => c.id === action.payload.id);
      if (!existing) {
        state.conversations.unshift(action.payload);
      }
    },
  },
});

export const {
  setActiveChatUser,
  setMessages,
  addMessage,
  clearMessages,
  setConversations,
  incrementDmUnread,
  clearDmUnread,
  upsertConversation,
} = messageSlice.actions;

export default messageSlice.reducer;
