import { createSlice } from "@reduxjs/toolkit";

// Initialize user from localStorage if available
const getInitialUser = () => {
  try {
    const employee = localStorage.getItem("employee");
    if (employee && employee !== "" && employee !== "null") {
      return JSON.parse(employee);
    }
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
  }
  return null;
};

const initialState = {
  user: getInitialUser(),
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    loaduser: (state, action) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
    },
  },
});

export default userSlice.reducer;
export const { loaduser, clearUser } = userSlice.actions;