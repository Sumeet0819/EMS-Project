import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  asyncLoadEmployeeTasks,
  asyncCreateEmployeeTask,
  asyncUpdateEmployeeTask,
  asyncDeleteEmployeeTask,
} from "../store/actions/employeeTaskActions";
import { asyncLoadEmployees } from "../store/actions/employeeActions";

import TaskEditor from "../components/common/TaskEditor";
import { RiDeleteBinLine, RiPencilLine, RiAddLine, RiTaskLine } from "@remixicon/react";
import { toast } from "sonner";
import SearchBar from "../components/common/SearchBar";
import ViewToggle from "../components/common/ViewToggle";
import { FixedSizeList as List } from 'react-window';
import StatusBadge from "../components/common/StatusBadge";
import PriorityBadge from "../components/common/PriorityBadge";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { useTaskFilters } from "../hooks/useTaskFilters";
import { useTaskSocket } from "../hooks/useTaskSocket";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";


const TaskPage = () => {
  const dispatch = useDispatch();
  const { tasks } = useSelector((state) => state.employeeTaskReducer);
  const { employees } = useSelector((state) => state.employeeReducer);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Edit State
  const [isEditMode, setIsEditMode] = useState(false);

  
  // Delete State
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Custom Hooks
  const {
    searchQuery,
    setSearchQuery,
    employeeFilter,
    setEmployeeFilter,
    viewMode,
    setViewMode,
    filteredTasks
  } = useTaskFilters(tasks);

  useTaskSocket({
    selectedTask,
    isEditMode,
    onTaskDeleted: () => {
      setSelectedTask(null);
      setShowDetailsModal(false);
    },
    onTaskUpdated: (updatedTask) => setSelectedTask(updatedTask)
  });

  useEffect(() => {
    dispatch(asyncLoadEmployeeTasks());
    dispatch(asyncLoadEmployees());
  }, [dispatch]);

  const handleCreateTask = async (newTask) => {
    try {
      await dispatch(asyncCreateEmployeeTask(newTask));
      dispatch(asyncLoadEmployeeTasks());
      setShowCreateModal(false);
      toast.success("Task Created Successfully");
    } catch {
      toast.error("Failed to create task");
    }
  };

  const handleUpdateTask = async (data) => {
    try {
      await dispatch(asyncUpdateEmployeeTask(selectedTask._id, data));
      dispatch(asyncLoadEmployeeTasks());
      toast.success("Task updated successfully");
      setIsEditMode(false);
      setSelectedTask(null);
    } catch {
      toast.error("Failed to update task");
    }
  };

  const confirmDelete = async () => {
    try {
      await dispatch(asyncDeleteEmployeeTask(taskToDelete._id));
      dispatch(asyncLoadEmployeeTasks());
      toast.success("Task deleted successfully");
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);
    } catch {
      toast.error("Failed to delete task");
    }
  };





  if (showCreateModal) {
    return (
      <TaskEditor
        mode="create"
        role="admin"
        employees={employees}
        onSave={handleCreateTask}
        onCancel={() => setShowCreateModal(false)}
      />
    );
  }

  if (showDetailsModal) {
    return (
      <TaskEditor
        task={selectedTask}
        mode="edit"
        role="admin"
        employees={employees}
        onSave={handleUpdateTask}
        onCancel={() => {
          setShowDetailsModal(false);
          setSelectedTask(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Task Management"
        subtitle="Manage all tasks and assign work"
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            <RiAddLine className="mr-2 h-4 w-4" /> Create Task
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-card p-3 rounded-lg border border-border shadow-sm">
        <div className="flex-1">
          <SearchBar 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, description, or assignee..."
            className="w-full"
          />
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Employees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp._id || emp.id} value={emp._id || emp.id}>
                  {emp.fullName?.firstName || emp.firstName} {emp.fullName?.lastName || emp.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end">
            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <EmptyState 
          icon={<RiTaskLine size={24} />}
          title="No Tasks Found"
          description={tasks.length === 0 ? "Get started by creating your first task." : "No tasks match your current filters."}
          action={
            tasks.length === 0 && (
              <Button onClick={() => setShowCreateModal(true)}>
                <RiAddLine className="mr-2 h-4 w-4" /> Add First Task
              </Button>
            )
          }
        />
      ) : viewMode === 'list' ? (
        <Card className="overflow-hidden border-border/40 shadow-sm">
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="min-w-[150px]">Title</TableHead>
                  <TableHead className="min-w-[150px]">Assigned To</TableHead>
                  <TableHead className="w-[120px]">Priority</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="text-right w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <List
                  height={600} // The height of the scrolling window
                  itemCount={filteredTasks.length}
                  itemSize={65} // Example height of a table row
                  width="100%"
                >
                  {({ index, style }) => {
                    const task = filteredTasks[index];
                    return (
                      <TableRow 
                        key={task._id} 
                        style={style}
                        onClick={() => { setSelectedTask(task); setShowDetailsModal(true); }} 
                        className="cursor-pointer hover:bg-muted/20 transition-colors flex items-center justify-between border-b"
                      >
                        <TableCell className="font-semibold py-4 min-w-[150px] max-w-[200px] md:max-w-none truncate">{task.title}</TableCell>
                        <TableCell className="whitespace-nowrap min-w-[150px] truncate">
                          {task.assignedTo?.fullName
                            ? `${task.assignedTo.fullName.firstName} ${task.assignedTo.fullName.lastName}`
                            : "Unassigned"}
                        </TableCell>
                        <TableCell className="w-[120px]"><PriorityBadge priority={task.priority} /></TableCell>
                        <TableCell className="w-[120px]"><StatusBadge status={task.status} /></TableCell>
                        <TableCell className="text-right w-[80px]">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:bg-destructive/10"
                            onClick={(e) => { e.stopPropagation(); setTaskToDelete(task); setIsDeleteDialogOpen(true); }}
                          >
                            <RiDeleteBinLine size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  }}
                </List>
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTasks.map((task) => (
            <Card 
              key={task._id} 
              className="flex flex-col cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => { setSelectedTask(task); setShowDetailsModal(true); }}
            >
              <div className="p-4 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <PriorityBadge priority={task.priority} />
                  <div className="flex -mt-2 -mr-2">
                    <Button 
                      variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={(e) => { e.stopPropagation(); setTaskToDelete(task); setIsDeleteDialogOpen(true); }}
                    >
                      <RiDeleteBinLine size={15} />
                    </Button>
                  </div>
                </div>
                <h3 className="font-semibold text-base mb-1 line-clamp-2">{task.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{task.description}</p>
                <div className="mt-auto space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Assigned to:</span>
                    <span className="font-medium truncate ml-2">
                      {task.assignedTo?.fullName?.firstName || "Unassigned"}
                    </span>
                  </div>
                  <StatusBadge status={task.status} className="w-full justify-center" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}


      <ConfirmDialog 
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Task"
        description={<>Are you sure you want to delete <strong>"{taskToDelete?.title}"</strong>? This action cannot be undone.</>}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />


    </div>
  );
};

export default TaskPage;
