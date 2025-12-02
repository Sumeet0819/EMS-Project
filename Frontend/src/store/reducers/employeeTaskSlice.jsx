import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  tasks: [],
  loading: false,
  error: null,
};

const employeeTaskSlice = createSlice({
  name: "employeeTask",
  initialState,
  reducers: {
    // Load all tasks for an employee
    loadEmployeeTasks: (state, action) => {
      state.tasks = Array.isArray(action.payload) ? action.payload : [];
      state.loading = false;
    },
    
    // Create a new task
    createTask: (state, action) => {
      state.tasks.push(action.payload);
    },

    // Update an existing task
    updateTask: (state, action) => {
      const index = state.tasks.findIndex(
        (t) => t._id === action.payload._id || t.id === action.payload.id
      );
      if (index !== -1) {
        state.tasks[index] = { ...state.tasks[index], ...action.payload };
      }
    },

    // Delete a task
    deleteTask: (state, action) => {
      state.tasks = state.tasks.filter((t) => t.id !== action.payload);
    },

    // Start a task (change status to in-progress)
    startTask: (state, action) => {
      const task = state.tasks.find(
        (t) => t._id === action.payload || t.id === action.payload
      );
      if (task) {
        task.status = "in-progress";
        task.startTime = new Date();
      }
    },

    // Submit a task (change status to completed)
    submitTask: (state, action) => {
      const task = state.tasks.find(
        (t) => t._id === action.payload || t.id === action.payload
      );
      if (task) {
        task.status = "completed";
        task.completedTime = new Date();
      }
    },

    // Update timer
    updateTaskTimer: (state, action) => {
      const task = state.tasks.find((t) => t.id === action.payload.id);
      if (task) {
        task.timer = action.payload.timer;
      }
    },

    // Set loading state
    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    // Set error state
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export default employeeTaskSlice.reducer;
export const {
  loadEmployeeTasks,
  createTask,
  updateTask,
  deleteTask,
  startTask,
  submitTask,
  updateTaskTimer,
  setLoading,
  setError,
} = employeeTaskSlice.actions;
