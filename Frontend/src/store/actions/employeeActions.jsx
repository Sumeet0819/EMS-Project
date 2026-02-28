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
export const asyncLoadEmployees = () => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const { data } = await axios.get("/employees");
    const employees = Array.isArray(data.data) ? data.data : data;
    dispatch(loadEmployees(employees));
    dispatch(setError(null));
    dispatch(setLoading(false));
  } catch (error) {
    console.error("Load employees error:", error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to load employees";
    dispatch(setError(errorMessage));
    dispatch(setLoading(false));
    throw error;
  }
};

// Create a new employee - Default role as "employee"
export const asyncCreateEmployee = (employee) => async (dispatch) => {
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
    dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Create employee error:", error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to create employee";
    dispatch(setError(errorMessage));
    dispatch(setLoading(false));
    throw error;
  }
};

// Update an existing employee
export const asyncUpdateEmployee = (updatedEmployee) => async (dispatch) => {
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
export const asyncDeleteEmployee = (employeeId) => async (dispatch) => {
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
