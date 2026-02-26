import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  asyncLoadEmployeeTasks,
  asyncCreateEmployeeTask,
  asyncUpdateEmployeeTask,
  asyncDeleteEmployeeTask,
} from "../store/actions/employeeTaskActions";
import { asyncLoadEmployees } from "../store/actions/employeeActions";
import { updateTask, deleteTask } from "../store/reducers/employeeTaskSlice";
import { useSocket } from "../contexts/SocketContext";
import TaskEditor from "../components/common/TaskEditor";
import { RiDeleteBinLine, RiPencilLine, RiAddLine, RiTaskLine } from "@remixicon/react";
import { toast } from "sonner";
import SearchBar from "../components/common/SearchBar";
import ViewToggle from "../components/common/ViewToggle";
import StatusBadge from "../components/common/StatusBadge";
import PriorityBadge from "../components/common/PriorityBadge";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";

const TaskPage = () => {
  const dispatch = useDispatch();
  const socket = useSocket();
  const { tasks } = useSelector((state) => state.employeeTaskReducer);
  const { employees } = useSelector((state) => state.employeeReducer);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Edit State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", assignedTo: "", priority: "medium", status: "pending" });
  
  // Delete State
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Filter State
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(asyncLoadEmployeeTasks());
    dispatch(asyncLoadEmployees());
  }, [dispatch]);

  // Socket setup omitted for brevity but logic remains active in the container
  useEffect(() => {
    if (!socket) return;
    const handleEvents = (event, action, isDelete = false) => {
      socket.on(event, (data) => {
        dispatch(action(isDelete ? data.taskId : data.task));
        if (selectedTask && !isEditMode) {
          if (isDelete && selectedTask._id === data.taskId) {
            setSelectedTask(null);
            setShowDetailsModal(false);
          } else if (!isDelete && selectedTask._id === data.task._id) {
            setSelectedTask(data.task);
          }
        }
      });
    };
    handleEvents('taskUpdatedBroadcast', updateTask);
    handleEvents('taskStatusChanged', updateTask);
    handleEvents('taskUpdated', updateTask);
    handleEvents('taskDeleted', deleteTask, true);

    return () => {
      socket.off('taskUpdatedBroadcast');
      socket.off('taskStatusChanged');
      socket.off('taskUpdated');
      socket.off('taskDeleted');
    };
  }, [socket, dispatch, selectedTask, isEditMode]);

  const handleCreateTask = async (newTask) => {
    try {
      await dispatch(asyncCreateEmployeeTask(newTask));
      dispatch(asyncLoadEmployeeTasks());
      setShowCreateModal(false);
      toast.success("Task Created Successfully");
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const openEditModal = (task, e) => {
    e.stopPropagation();
    setSelectedTask(task);
    setEditForm({
      title: task.title || "",
      description: task.description || "",
      assignedTo: task.assignedTo?._id || task.assignedTo || "",
      priority: task.priority || "medium",
      status: task.status || "pending",
    });
    setIsEditMode(true);
  };

  const filteredTasks = useMemo(() => {
    return (tasks || []).filter((task) => {
      // Employee filter
      if (employeeFilter !== "all" && employeeFilter !== "") {
        const assignedToId = task.assignedTo?._id || task.assignedTo;
        if (assignedToId !== employeeFilter) return false;
      }

      // Search filter
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const title = (task.title || "").toLowerCase();
      const desc = (task.description || "").toLowerCase();
      
      let assigneeName = "";
      if (task.assignedTo?.fullName) {
        assigneeName = `${task.assignedTo.fullName.firstName || ''} ${task.assignedTo.fullName.lastName || ''}`.toLowerCase();
      }
      
      return title.includes(query) || desc.includes(query) || assigneeName.includes(query);
    });
  }, [tasks, employeeFilter, searchQuery]);

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

      <div className="flex flex-col sm:flex-row gap-3 items-center bg-card p-2 rounded-lg border border-border">
        <SearchBar 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title, description, or assignee..."
        />
        <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
          <SelectTrigger className="w-[200px]">
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
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
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
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task._id} onClick={() => { setSelectedTask(task); setShowDetailsModal(true); }}>
                  <TableCell className="font-medium max-w-[200px] truncate">{task.title}</TableCell>
                  <TableCell>
                    {task.assignedTo?.fullName
                      ? `${task.assignedTo.fullName.firstName} ${task.assignedTo.fullName.lastName}`
                      : "Unassigned"}
                  </TableCell>
                  <TableCell><PriorityBadge priority={task.priority} /></TableCell>
                  <TableCell><StatusBadge status={task.status} /></TableCell>
                  <TableCell className="text-right">
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
              ))}
            </TableBody>
          </Table>
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
