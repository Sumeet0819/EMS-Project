import { useNavigate } from "react-router-dom";
import axios from "../../utils/axiosconfig";
import { loaduser } from "../reducers/userSlice";


export const asyncRegisterUser = (employee) => async (dispatch, getState) => {
  try {
    const { data } = await axios.post("/auth/register", employee);
    localStorage.setItem("employee", JSON.stringify(data.employee));
    dispatch(loaduser(data.employee));
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const asyncCurrentuser = () => async (dispatch, getstate) => {
  try {
    const employee = localStorage.getItem("employee");
    if (employee) dispatch(loaduser(JSON.parse(employee)));
    else console.log("employee not found");
  } catch (error) {
    console.log(error);
  }
};

export const asyncLogoutuser = () => async (dispatch, getstate) => {
  try {
    localStorage.setItem("employee", "");
  } catch (error) {
    console.log(error);
  }
};


export const asyncLoginuser = (credentials, navigate) => async (dispatch, getState) => {
  try {
    const { data } = await axios.post("/auth/login", credentials);
    
    const employee = {
      id: data.employee.id,
      firstName: data.employee.fullName.firstName,
      lastName: data.employee.fullName.lastName,
      email: data.employee.email,
      role: data.employee.role,
      fullName: data.employee.fullName,
    };
    
    console.log("Employee data:", employee);
    console.log("Employee role:", employee.role);
    
    localStorage.setItem("employee", JSON.stringify(employee));
    dispatch(loaduser(employee));

    // Navigate immediately based on role
    if (employee.role === "admin") {
      console.log("Navigating to /admin");
      navigate("/admin", { replace: true });
    } else if (employee.role === "employee") {
      console.log("Navigating to /employee");
      navigate("/employee", { replace: true });
    }
    
    return { success: true, employee };
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};


export const asyncUpdateuser = (id, employee) => async (dispatch, getState) => {
  try {
    const { data } = await axios.put(`/auth/${id}`, employee);
    localStorage.setItem("employee", JSON.stringify(employee));
    dispatch(loaduser(employee));
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const asyncDeleteuser = (id) => async (dispatch, getState) => {
  try {
    await axios.delete(`/auth/${id}`);
    localStorage.removeItem("employee");
  } catch (error) {
    console.log(error);
    throw error;
  }
};
