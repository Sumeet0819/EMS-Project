import axios from "../../utils/axiosconfig";
import {
  loadEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  setLoading,
  setError,
} from "../reducers/employeeSlice";

// Load all employees
export const asyncLoadEmployees = () => async (dispatch, getState) => {
  try {
    dispatch(setLoading(true));
    const { data } = await axios.get("/employees");
    dispatch(loadEmployees(data));
    dispatch(setError(null));
  } catch (error) {
    console.log(error);
    dispatch(setError(error.message || "Failed to load employees"));
    dispatch(setLoading(false));
  }
};

// Create a new employee
export const asyncCreateEmployee = (employee) => async (dispatch, getState) => {
  try {
    dispatch(setLoading(true));
    const { data } = await axios.post("/employees", employee);
    dispatch(createEmployee(data));
    dispatch(setError(null));
    return data; // Return created employee for confirmation
  } catch (error) {
    console.log(error);
    dispatch(setError(error.message || "Failed to create employee"));
    dispatch(setLoading(false));
    throw error;
  }
};

// Update an existing employee
export const asyncUpdateEmployee = (employeeId, updatedEmployee) => async (dispatch, getState) => {
  try {
    dispatch(setLoading(true));
    const { data } = await axios.patch(`/employees/${employeeId}`, updatedEmployee);
    dispatch(updateEmployee(data));
    dispatch(setError(null));
    return data;
  } catch (error) {
    console.log(error);
    dispatch(setError(error.message || "Failed to update employee"));
    dispatch(setLoading(false));
    throw error;
  }
};

// Delete an employee
export const asyncDeleteEmployee = (employeeId) => async (dispatch, getState) => {
  try {
    dispatch(setLoading(true));
    await axios.delete(`/employees/${employeeId}`);
    dispatch(deleteEmployee(employeeId));
    dispatch(setError(null));
  } catch (error) {
    console.log(error);
    dispatch(setError(error.message || "Failed to delete employee"));
    dispatch(setLoading(false));
    throw error;
  }
};
