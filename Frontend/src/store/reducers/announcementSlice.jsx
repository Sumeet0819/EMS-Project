import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  announcements: [],
};

const announcementSlice = createSlice({
  name: "announcements",
  initialState,
  reducers: {
    setAnnouncements: (state, action) => {
      state.announcements = Array.isArray(action.payload) ? action.payload : [];
    },
    addAnnouncement: (state, action) => {
      state.announcements.unshift(action.payload);
    },
    removeAnnouncement: (state, action) => {
      state.announcements = state.announcements.filter((a) => a.id !== action.payload);
    },
  },
});

export const { setAnnouncements, addAnnouncement, removeAnnouncement } = announcementSlice.actions;
export default announcementSlice.reducer;
