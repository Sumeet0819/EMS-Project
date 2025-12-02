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
    const employees = Array.isArray(data.data) ? data.data : data;
    dispatch(loadEmployees(employees));
    dispatch(setError(null));
  } catch (error) {
    console.log(error);
    dispatch(setError(error.message || "Failed to load employees"));
    dispatch(setLoading(false));
  }
};

// Create a new employee - Default role as "employee"
export const asyncCreateEmployee = (employee) => async (dispatch, getState) => {
  try {
    dispatch(setLoading(true));
    const employeeData = {
      fullName: {
        firstName: employee.firstName,
        lastName: employee.lastName,
      },
      email: employee.email,
      password: employee.password || "default123",
    };
    
    const { data } = await axios.post("/employees", employeeData);
    dispatch(createEmployee(data.data || data));
    dispatch(setError(null));
    return data;
  } catch (error) {
    console.log(error);
    dispatch(setError(error.message || "Failed to create employee"));
    dispatch(setLoading(false));
    throw error;
  }
};

// Update an existing employee
export const asyncUpdateEmployee = (updatedEmployee) => async (dispatch, getState) => {
  try {
    dispatch(setLoading(true));
    const { data } = await axios.put(`/employees/${updatedEmployee._id}`, updatedEmployee);
    dispatch(updateEmployee(data.data || data));
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
