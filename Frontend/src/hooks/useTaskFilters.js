import { useState, useMemo } from 'react';
import { useDebounce } from 'use-debounce';

/**
 * A custom hook to handle filtering and searching tasks.
 * @param {Array} tasks - The full array of tasks from the Redux store.
 * @returns {Object} Filter state and the resulting filteredTasks array.
 */
export const useTaskFilters = (tasks = []) => {
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  
  const [searchQuery, setSearchQuery] = useState("");
  // Debounce the search query by 300ms to prevent heavy re-renders while typing
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 1. Employee filter
      if (employeeFilter !== "all" && employeeFilter !== "") {
        const assignedToId = task.assignedTo?._id || task.assignedTo;
        if (assignedToId !== employeeFilter) return false;
      }

      // 2. Search filter
      if (!debouncedSearchQuery) return true;
      const query = debouncedSearchQuery.toLowerCase();
      const title = (task.title || "").toLowerCase();
      const desc = (task.description || "").toLowerCase();
      
      let assigneeName = "";
      if (task.assignedTo?.fullName) {
        assigneeName = `${task.assignedTo.fullName.firstName || ''} ${task.assignedTo.fullName.lastName || ''}`.toLowerCase();
      }
      
      return title.includes(query) || desc.includes(query) || assigneeName.includes(query);
    });
  }, [tasks, employeeFilter, debouncedSearchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    employeeFilter,
    setEmployeeFilter,
    viewMode,
    setViewMode,
    filteredTasks
  };
};
