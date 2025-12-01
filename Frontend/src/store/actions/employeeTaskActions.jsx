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

// Load all tasks for a specific employee
export const asyncLoadEmployeeTasks = (employeeId) => async (dispatch, getState) => {
  try {
    dispatch(setLoading(true));
    const { data } = await axios.get(`/tasks?employeeId=${employeeId}`);
    dispatch(loadEmployeeTasks(data));
    dispatch(setError(null));
  } catch (error) {
    console.log(error);
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

// Create a new task for employee
export const asyncCreateEmployeeTask = (task) => async (dispatch, getState) => {
  try {
    dispatch(setLoading(true));
    const { data } = await axios.post("/tasks", task);
    dispatch(createTask(data));
    dispatch(setError(null));
  } catch (error) {
    console.log(error);
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

// Update an existing task
export const asyncUpdateEmployeeTask = (taskId, updatedTask) => async (dispatch, getState) => {
  try {
    dispatch(setLoading(true));
    const { data } = await axios.patch(`/tasks/${taskId}`, updatedTask);
    dispatch(updateTask(data));
    dispatch(setError(null));
  } catch (error) {
    console.log(error);
    dispatch(setError(error.message));
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
  } finally {
    dispatch(setLoading(false));
  }
};

// Start a task (status: inprogress)
export const asyncStartTask = (taskId) => async (dispatch, getState) => {
  try {
    const updatedTask = { status: "inprogress", startTime: Date.now() };
    const { data } = await axios.patch(`/tasks/${taskId}`, updatedTask);
    dispatch(startTask(taskId));
    dispatch(setError(null));
  } catch (error) {
    console.log(error);
    dispatch(setError(error.message));
  }
};

// Submit a task (status: done)
export const asyncSubmitTask = (taskId) => async (dispatch, getState) => {
  try {
    const updatedTask = { status: "done" };
    const { data } = await axios.patch(`/tasks/${taskId}`, updatedTask);
    dispatch(submitTask(taskId));
    dispatch(setError(null));
  } catch (error) {
    console.log(error);
    dispatch(setError(error.message));
  }
};

// Update task timer (locally only, no API call)
export const updateTaskTimerLocal = (taskId, timer) => (dispatch, getState) => {
  dispatch(updateTaskTimer({ id: taskId, timer }));
};
