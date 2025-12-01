import React from "react";
import "./ActivityList.css";

const ActivityList = ({ data }) => {
  return (
    <div className="activity-card">
      <h3>Recent Activity</h3>
      <ul>
        {data.map((i, idx) => (
          <li key={idx}>
            <div>
              <strong>{i.name}</strong>
              <p>{i.activity}</p>
            </div>
            <span className="time">{i.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActivityList;
