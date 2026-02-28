import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateTask, deleteTask } from '../store/reducers/employeeTaskSlice';
import { useSocket } from '../contexts/SocketContext';

/**
 * A custom hook to manage real-time Socket.io events related to tasks.
 * It automatically binds listeners and dispatches Redux updates.
 * 
 * @param {Object} options - Callbacks for specific event intersections
 * @param {Object} options.selectedTask - The currently open task in a modal
 * @param {boolean} options.isEditMode - Whether the admin is actively editing the task
 * @param {Function} options.onTaskDeleted - Callback when the currently open task is deleted
 * @param {Function} options.onTaskUpdated - Callback when the currently open task is updated
 */
export const useTaskSocket = ({ selectedTask, isEditMode, onTaskDeleted, onTaskUpdated } = {}) => {
  const dispatch = useDispatch();
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    const handleEvents = (event, action, isDelete = false) => {
      socket.on(event, (data) => {
        // 1. Update the central Redux store
        dispatch(action(isDelete ? data.taskId : data.task));
        
        // 2. If the user is currently viewing/editing THIS task, handle overlaps
        if (selectedTask && !isEditMode) {
          if (isDelete && selectedTask._id === data.taskId) {
            if (onTaskDeleted) onTaskDeleted();
          } else if (!isDelete && selectedTask._id === data.task._id) {
            if (onTaskUpdated) onTaskUpdated(data.task);
          }
        }
      });
    };

    // Bind real-time listeners
    handleEvents('taskUpdatedBroadcast', updateTask);
    handleEvents('taskStatusChanged', updateTask);
    handleEvents('taskUpdated', updateTask);
    handleEvents('taskDeleted', deleteTask, true);

    // Cleanup listeners on unmount
    return () => {
      socket.off('taskUpdatedBroadcast');
      socket.off('taskStatusChanged');
      socket.off('taskUpdated');
      socket.off('taskDeleted');
    };
  }, [socket, dispatch, selectedTask, isEditMode, onTaskDeleted, onTaskUpdated]);
};
