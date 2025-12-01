import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RiLoginBoxLine } from "@remixicon/react";
import { asyncLogoutuser } from "../store/actions/userActions";
import "./Header.css";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(asyncLogoutuser());
    navigate("/");
  };

  return (
    <header className="header">
      <span>Welcome, Admin</span>
      <button className="logout" onClick={handleLogout}>
        <RiLoginBoxLine />
        Logout
      </button>
    </header>
  );
};

export default Header;