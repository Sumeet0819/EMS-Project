import React, { useEffect } from 'react';
import { RiCloseLine, RiTimeLine, RiCalendarLine, RiUserLine, RiFlagLine, RiTaskLine } from '@remixicon/react';
import '../styles/TaskDetailsModal.css';

const TaskDetailsModal = ({ task, onClose }) => {
  if (!task) return null;

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status color class
  const getStatusClass = (status) => {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'in-progress': return 'status-progress';
      case 'pending': return 'status-pending';
      default: return '';
    }
  };

  // Get priority color class
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  return (
    <div className="task-details-overlay" onClick={onClose}>
      <div className="task-details-modal" onClick={(e) => e.stopPropagation()}>
        <span className="close-details-btn" onClick={onClose}>
          <RiCloseLine size={24} />
        </span>

        <div className="task-details-header">
          <div className="task-id-badge">Task #{task._id.slice(-6)}</div>
          <h2 className="task-details-title">{task.title}</h2>
          <div className="task-meta-row">
            <span className={`task-status-badge ${getStatusClass(task.status)}`}>
              {task.status.replace('-', ' ')}
            </span>
            <span className={`task-priority-badge ${getPriorityClass(task.priority)}`}>
              <RiFlagLine size={14} />
              {task.priority} Priority
            </span>
          </div>
        </div>

        <div className="task-details-body">
          <div className="details-section">
            <h3><RiTaskLine size={18} /> Description</h3>
            <p className="task-description">{task.description || "No description provided."}</p>
          </div>

          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label"><RiUserLine size={16} /> Assigned To</span>
              <span className="detail-value">
                {task.assignedTo?.fullName 
                  ? `${task.assignedTo.fullName.firstName} ${task.assignedTo.fullName.lastName}`
                  : (task.assignedTo?.email || "Unassigned")}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label"><RiCalendarLine size={16} /> Created At</span>
              <span className="detail-value">{formatDate(task.createdAt)}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label"><RiTimeLine size={16} /> Deadline</span>
              <span className="detail-value">{formatDate(task.deadline)}</span>
            </div>
            
            {task.completedTime && (
              <div className="detail-item">
                <span className="detail-label"><RiTimeLine size={16} /> Completed At</span>
                <span className="detail-value">{formatDate(task.completedTime)}</span>
              </div>
            )}
          </div>

          {task.remark && (
            <div className="details-section remark-section">
              <h3>Remark</h3>
              <p>{task.remark}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
