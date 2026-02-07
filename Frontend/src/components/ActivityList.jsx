import React from "react";
import "../styles/ActivityList.css";

const ActivityList = ({ data }) => {
  return (
    <div className="activity-card">
      <h3>Recent Activity</h3>
      {data && data.length > 0 ? (
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
      ) : (
        <p style={{ color: "var(--text-color-muted)", padding: "var(--spacing-md)", textAlign: "center" }}>
          No recent activity
        </p>
      )}
    </div>
  );
};

export default ActivityList;
