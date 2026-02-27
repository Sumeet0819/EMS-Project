import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  tasks: [],
  todayLog: null,
  loading: false,
  error: null,
};

const employeeTaskSlice = createSlice({
  name: "employeeTask",
  initialState,
  reducers: {
    setTodayLog: (state, action) => {
      state.todayLog = action.payload;
    },
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
      const updatedTask = action.payload;
      const taskId = updatedTask._id || updatedTask.id;
      if (!taskId) return;
      
      const index = state.tasks.findIndex(
        (t) => (t._id === taskId) || (t.id === taskId)
      );
      
      if (index !== -1) {
        // Update existing task
        state.tasks[index] = { ...state.tasks[index], ...updatedTask };
      }
      // Don't add new tasks here - only update existing ones
    },

    // Delete a task
    deleteTask: (state, action) => {
      const taskId = action.payload;
      state.tasks = state.tasks.filter(
        (t) => t._id !== taskId && t.id !== taskId
      );
    },

    // Start a task (change status to in-progress)
    startTask: (state, action) => {
      const task = state.tasks.find(
        (t) => t._id === action.payload || t.id === action.payload
      );
      if (task) {
        task.status = "in-progress";
        task.startTime = new Date().toISOString();
      }
    },

    // Submit a task (change status to completed)
    submitTask: (state, action) => {
      const task = state.tasks.find(
        (t) => t._id === action.payload || t.id === action.payload
      );
      if (task) {
        task.status = "completed";
        task.completedTime = new Date().toISOString();
      }
    },

    // Update timer
    updateTaskTimer: (state, action) => {
      const { id, timer } = action.payload;
      const task = state.tasks.find(
        (t) => t._id === id || t.id === id
      );
      if (task) {
        task.timer = timer;
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
  setTodayLog,
  createTask,
  updateTask,
  deleteTask,
  startTask,
  submitTask,
  updateTaskTimer,
  setLoading,
  setError,
} = employeeTaskSlice.actions;
