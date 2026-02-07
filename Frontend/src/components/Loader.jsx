import React from "react";
import "../styles/Loader.css";

const Loader = ({ message = "Loading...", size = "medium", fullScreen = false }) => {
  const sizeClasses = {
    small: "loader-small",
    medium: "loader-medium",
    large: "loader-large",
  };

  const loaderClass = `loader-spinner ${sizeClasses[size] || sizeClasses.medium}`;

  if (fullScreen) {
    return (
      <div className="loader-overlay">
        <div className={loaderClass}></div>
        {message && <p className="loader-text">{message}</p>}
      </div>
    );
  }

  return (
    <div className="loader-container">
      <div className={loaderClass}></div>
      {message && <p className="loader-text">{message}</p>}
    </div>
  );
};

export default Loader;

