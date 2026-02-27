import axios from "../../utils/axiosconfig";
import { setTodayLog, setError, setLoading } from "../reducers/employeeTaskSlice";

export const asyncLoadTodayLog = () => async (dispatch) => {
  try {
    const { data } = await axios.get("/worklogs/today");
    dispatch(setTodayLog(data.data));
  } catch (error) {
    console.log(error);
  }
};

export const asyncStartDay = () => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const { data } = await axios.post("/worklogs/start");
    dispatch(setTodayLog(data.data));
    dispatch(setError(null));
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

export const asyncStopDay = () => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const { data } = await axios.post("/worklogs/stop");
    dispatch(setTodayLog(data.data));
    dispatch(setError(null));
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};
