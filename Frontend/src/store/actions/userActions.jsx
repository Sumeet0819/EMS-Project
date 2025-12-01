import { useNavigate } from "react-router-dom";
import axios from "../../utils/axiosconfig";
import { loaduser } from "../reducers/userSlice";


export const asyncRegisterUser = (user) => async (dispatch, getState) => {
  try {
    const res = await axios.post("/users", user);
  } catch (error) {
    console.log(error);
  }
};

export const asyncCurrentuser = () => async (dispatch, getstate) => {
  try {
    const user = localStorage.getItem("user");
    if (user) dispatch(loaduser(JSON.parse(user)));
    else console.log("user not found");
  } catch (error) {
    console.log(error);
  }
};

export const asyncLogoutuser = () => async (dispatch, getstate) => {
  try {
    localStorage.setItem("user", "");
  } catch (error) {
    console.log(error);
  }
};


export const asyncLoginuser = (user, navigate, expectedRole) => async (dispatch, getState) => {
  try {
    const { data } = await axios.get(`/users?email=${user.email}`);

    if (data.length > 0 && data[0].password === user.password) {
      const loggedInUser = data[0];
      localStorage.setItem("user", JSON.stringify(loggedInUser));
      dispatch(loaduser(loggedInUser));

      // Redirect based on role
      if (loggedInUser.role === "admin") {
        navigate("/admin");
      } else if (loggedInUser.role === "employee") {
        navigate("/employee");
      }
    } else {
      throw new Error("User not found or wrong password");
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};


export const asyncUpdateuser = (id,user) => async (dispatch, getState) => {
  try {
    const res = await axios.patch(`/users/${id}`,user)
    localStorage.setItem("user", JSON.stringify(user));
    console.log(res);
    
  } catch (error) {
    console.log(error);
  }
};

export const asyncDeleteuser = (id) => async (dispatch, getState) => {
  try {
    const res = await axios.delete(`/users/${id}`)
    localStorage.removeItem("user");
  } catch (error) {
    console.log(error);
  }
};
