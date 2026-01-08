import axios from "../../utils/axiosconfig";
import {
  loadEmployeeTasks,
  createTask,
  updateTask,
  deleteTask,
  startTask,
  submitTask,
  updateTaskTimer,
  setLoading,
  setError,
} from "../reducers/employeeTaskSlice";

// Load all tasks
export const asyncLoadEmployeeTasks = () => async (dispatch, getState) => {
  try {
    dispatch(setLoading(true));
    const { data } = await axios.get("/tasks");
    dispatch(loadEmployeeTasks(data.data));
    dispatch(setError(null));
  } catch (error) {
    console.log(error);
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

// Create a new task - Admin only
export const asyncCreateEmployeeTask = (task) => async (dispatch, getState) => {
  try {
    dispatch(setLoading(true));
    const { data } = await axios.post("/tasks", task);
    dispatch(createTask(data.data));
    dispatch(setError(null));
    return data;
  } catch (error) {
    console.log(error);
    dispatch(setError(error.message || "Failed to create task"));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// Update an existing task
export const asyncUpdateEmployeeTask = (taskId, updatedTask) => async (dispatch, getState) => {
  try {
    dispatch(setLoading(true));
    const { data } = await axios.put(`/tasks/${taskId}`, updatedTask);
    dispatch(updateTask(data.data));
    dispatch(setError(null));
    return data;
  } catch (error) {
    console.log(error);
    dispatch(setError(error.message));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// Delete a task
export const asyncDeleteEmployeeTask = (taskId) => async (dispatch, getState) => {
  try {
    dispatch(setLoading(true));
    await axios.delete(`/tasks/${taskId}`);
    dispatch(deleteTask(taskId));
    dispatch(setError(null));
  } catch (error) {
    console.log(error);
    dispatch(setError(error.message));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// Start a task (status: in-progress)
export const asyncStartTask = (taskId) => async (dispatch, getState) => {
  try {
    const updatedTask = { status: "in-progress" };
    const { data } = await axios.put(`/tasks/${taskId}`, updatedTask);
    dispatch(updateTask(data.data));
    dispatch(setError(null));
    return data;
  } catch (error) {
    console.log(error);
    dispatch(setError(error.message));
    throw error;
  }
};

// Submit a task (status: completed)
export const asyncSubmitTask = (taskId, remark = "") => async (dispatch, getState) => {
  try {
    const updatedTask = { status: "completed", remark };
    const { data } = await axios.put(`/tasks/${taskId}`, updatedTask);
    dispatch(updateTask(data.data));
    dispatch(setError(null));
    return data;
  } catch (error) {
    console.log(error);
    dispatch(setError(error.message));
    throw error;
  }
};

// Update task timer (locally only)
export const updateTaskTimerLocal = (taskId, timer) => (dispatch, getState) => {
  dispatch(updateTaskTimer({ id: taskId, timer }));
};

// Get tasks for specific employee
export const asyncLoadTasksByEmployee = (employeeId) => async (dispatch, getState) => {
  try {
    dispatch(setLoading(true));
    const { data } = await axios.get(`/tasks/employee/${employeeId}`);
    dispatch(loadEmployeeTasks(data.data));
    dispatch(setError(null));
    return data.data;
  } catch (error) {
    console.log(error);
    dispatch(setError(error.message || "Failed to load tasks"));
    dispatch(setLoading(false));
  }
};

// Get task statistics by employee
export const asyncLoadTaskStats = () => async (dispatch, getState) => {
  try {
    dispatch(setLoading(true));
    const { data } = await axios.get("/tasks/stats/all");
    dispatch(setError(null));
    dispatch(setLoading(false));
    return data.data;
  } catch (error) {
    console.log(error);
    dispatch(setError(error.message));
    dispatch(setLoading(false));
  }
};
