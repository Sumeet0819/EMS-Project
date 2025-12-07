import axios from "axios";
import { store } from "../store/store";
import { asyncLogoutuser } from "../store/actions/userActions";

const instance = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

// Request interceptor - ensure withCredentials is always true
instance.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors globally
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized access - Session expired or invalid token");
      
      // Clear local storage
      localStorage.removeItem("employee");
      
      // Dispatch logout action
      if (store) {
        store.dispatch(asyncLogoutuser());
      }
      
      // Redirect to login page if not already there
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
