import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  employees: [],
  loading: false,
  error: null,
};

const employeeSlice = createSlice({
  name: "employee",
  initialState,
  reducers: {
    // Load all employees
    loadEmployees: (state, action) => {
      state.employees = Array.isArray(action.payload) ? action.payload : [];
      state.loading = false;
      state.error = null;
    },

    // Create a new employee
    createEmployee: (state, action) => {
      state.employees.push(action.payload);
      state.loading = false;
      state.error = null;
    },

    // Update an existing employee
    updateEmployee: (state, action) => {
      const index = state.employees.findIndex((e) => e._id === action.payload._id || e.id === action.payload.id);
      if (index !== -1) {
        state.employees[index] = { ...state.employees[index], ...action.payload };
      }
      state.loading = false;
      state.error = null;
    },

    // Delete an employee
    deleteEmployee: (state, action) => {
      state.employees = state.employees.filter((e) => e._id !== action.payload && e.id !== action.payload);
      state.loading = false;
      state.error = null;
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

export default employeeSlice.reducer;
export const {
  loadEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  setLoading,
  setError,
} = employeeSlice.actions;
