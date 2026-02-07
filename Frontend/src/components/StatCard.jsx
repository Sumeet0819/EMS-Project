import React from "react";
import "../styles/StatCard.css";

const StatCard = ({ label, value, icon }) => {
  return (
    <div className="stat-card">
      <div>
        <p className="label">{label}</p>
        <h2>{value}</h2>
      </div>
      <div className="icon">{icon}</div>
    </div>
  );
};

export default StatCard;
