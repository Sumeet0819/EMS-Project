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
      state.tasks = action.payload;
      state.loading = false;
    },
    
    // Create a new task
    createTask: (state, action) => {
      state.tasks.push(action.payload);
    },

    // Update an existing task
    updateTask: (state, action) => {
      const index = state.tasks.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = { ...state.tasks[index], ...action.payload };
      }
    },

    // Delete a task
    deleteTask: (state, action) => {
      state.tasks = state.tasks.filter((t) => t.id !== action.payload);
    },

    // Start a task (change status to inprogress)
    startTask: (state, action) => {
      const task = state.tasks.find((t) => t.id === action.payload);
      if (task) {
        task.status = "inprogress";
        task.startTime = Date.now();
      }
    },

    // Submit a task (change status to done)
    submitTask: (state, action) => {
      const task = state.tasks.find((t) => t.id === action.payload);
      if (task) {
        task.status = "done";
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
