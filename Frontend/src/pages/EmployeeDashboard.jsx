import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  asyncLoadTasksByEmployee,
  asyncStartTask,
  asyncSubmitTask,
  updateTaskTimerLocal,
  asyncUpdateEmployeeTask,
} from "../store/actions/employeeTaskActions";
import { 
  asyncLoadTodayLog, 
  asyncStartDay, 
  asyncStopDay 
} from "../store/actions/workLogActions";
import { deleteTask, updateTask } from "../store/reducers/employeeTaskSlice";
import { useSocket } from "../contexts/SocketContext";
import TaskEditor from "../components/common/TaskEditor";
import EmployeeStats from "./EmployeeStats";
import SearchBar from "../components/common/SearchBar";
import AppSidebar from "../components/layout/AppSidebar";
import AppHeader from "../components/layout/AppHeader";
import PriorityBadge from "../components/common/PriorityBadge";
import StatusBadge from "../components/common/StatusBadge";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { RiTimeLine, RiTaskLine } from "@remixicon/react";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { useResponsiveSidebar } from "../hooks/useResponsive";

const EmployeeDashboard = () => {
  const dispatch = useDispatch();
  const { tasks } = useSelector((state) => state.employeeTaskReducer);
  const { user } = useSelector((state) => state.userReducer);
  const { todayLog } = useSelector((state) => state.employeeTaskReducer);

  // Layout states
  const { sidebarOpen, setSidebarOpen, isMobile } = useResponsiveSidebar();
  const [activeTaskView, setActiveTaskView] = useState('daily');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // Logic states
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [taskToSubmit, setTaskToSubmit] = useState(null);
  const [remarkText, setRemarkText] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const socket = useSocket();

  useEffect(() => {
    if (user?.id) {
      dispatch(asyncLoadTasksByEmployee(user.id));
      dispatch(asyncLoadTodayLog());
    }
  }, [dispatch, user]);

  const [daySeconds, setDaySeconds] = useState(0);

  useEffect(() => {
    if (todayLog) {
      setDaySeconds(todayLog.totalSeconds || 0);
    }
  }, [todayLog]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Update Daily Timer
      if (todayLog?.isActive && todayLog.startTime) {
        const elapsed = Math.floor((Date.now() - new Date(todayLog.startTime).getTime()) / 1000);
        setDaySeconds((todayLog.totalSeconds || 0) + elapsed);
      }

      // Update Task Timers
      tasks.forEach((t) => {
        const isCurrentlyWorking = t.status === "in-progress" || t.status === "in_progress";
        if (isCurrentlyWorking && t.startTime) {
          const elapsedSec = Math.max(0, Math.floor((Date.now() - new Date(t.startTime).getTime()) / 1000));
          dispatch(updateTaskTimerLocal(t._id, elapsedSec));
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [tasks, dispatch, todayLog]);

  const displayTasks = useMemo(() => {
    let filteredTasks = activeTaskView === 'daily' ? tasks.filter(t => t.isDaily) : tasks.filter(t => !t.isDaily);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredTasks = filteredTasks.filter(t => 
        (t.title?.toLowerCase().includes(query)) || (t.description?.toLowerCase().includes(query))
      );
    }
    if (statusFilter !== 'all') {
      filteredTasks = filteredTasks.filter(t => {
        const s = (t.status || 'pending').replace('_', '-');
        return s === statusFilter;
      });
    }
    if (priorityFilter !== 'all') {
      filteredTasks = filteredTasks.filter(t => (t.priority || 'medium') === priorityFilter);
    }
    return filteredTasks;
  }, [tasks, activeTaskView, searchQuery, statusFilter, priorityFilter]);

  const startTask = async (id, e) => {
    e.stopPropagation();
    try { await dispatch(asyncStartTask(id)); toast.success("Task started successfully"); }
    catch (err) { toast.error("Failed to start task: " + err.message); }
  };

  const openSubmitModal = (id, e) => {
    e.stopPropagation();
    setTaskToSubmit(id);
    setRemarkText("");
    setShowRemarkModal(true);
  };

  const handleSubmitWithRemark = async (e) => {
    e.preventDefault();
    try {
      await dispatch(asyncSubmitTask(taskToSubmit, remarkText));
      toast.success("Task submitted successfully");
      setShowRemarkModal(false);
      setTaskToSubmit(null);
    } catch (err) { toast.error("Failed to submit task: " + err.message); }
  };

  const formatTime = (sec) => {
    if (!sec && sec !== 0) return "00:00:00";
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleStartDay = () => dispatch(asyncStartDay());
  const handleStopDay = () => dispatch(asyncStopDay());

  const calculateTaskSeconds = (task) => {
    let total = task.totalTimeSpent || 0;
    const isCurrentlyWorking = task.status === "in-progress" || task.status === "in_progress";
    if (isCurrentlyWorking && task.startTime) {
      total += Math.max(0, Math.floor((Date.now() - new Date(task.startTime).getTime()) / 1000));
    }
    return total;
  };

  const handleEditorSave = async (data) => {
    try {
      await dispatch(asyncUpdateEmployeeTask(selectedTask._id, {
        status: data.status,
        remark: data.remark,
      }));
      toast.success("Task updated successfully");
      setShowDetailsModal(false);
      setSelectedTask(null);
    } catch (error) {
       toast.error("Failed to update task");
    }
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-all duration-300 ease-in-out lg:relative ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:-ml-64"}`}>
        <AppSidebar
          role="employee"
          activePage={activeTaskView}
          onNavigate={(page) => {
            setActiveTaskView(page);
            if (isMobile) setSidebarOpen(false);
          }}
          onCollapse={() => setSidebarOpen(false)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden text-foreground">
          <AppHeader 
            role="employee"
            userName={user?.fullName?.firstName || "Employee"}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />

          {activeTaskView === 'stats' ? (
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
              <EmployeeStats />
            </main>
          ) : showDetailsModal && selectedTask ? (
            <main className="flex-1 overflow-hidden p-4 md:p-6 lg:p-8">
              <TaskEditor 
                task={selectedTask}
                mode="edit"
                role="employee"
                onSave={handleEditorSave}
                onCancel={() => {
                  setShowDetailsModal(false);
                  setSelectedTask(null);
                }}
              />
            </main>
          ) : (
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
          <PageHeader 
            title="My Tasks"
            subtitle={`Your assigned ${activeTaskView} tasks`}
            actions={
              <div className="flex items-center gap-3 bg-card p-1.5 rounded-xl border border-border shadow-sm">
                <div className="px-3 py-1 flex flex-col items-center">
                   <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Day Time</span>
                   <span className="text-xl font-mono font-bold text-primary">{formatTime(daySeconds)}</span>
                </div>
                {todayLog?.isActive ? (
                  <Button variant="destructive" size="sm" onClick={handleStopDay} className="h-9 shadow-md flex items-center gap-2">
                    <RiTimeLine size={16} /> Stop Day
                  </Button>
                ) : (
                  <Button variant="default" size="sm" onClick={handleStartDay} className="h-9 shadow-md flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <RiTimeLine size={16} /> Start Day
                  </Button>
                )}
              </div>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Card className="p-4 flex items-center justify-between border-border/40 bg-gradient-to-br from-primary/5 to-transparent">
                <div>
                   <p className="text-xs font-bold text-muted-foreground uppercase">Tasks Done</p>
                   <p className="text-2xl font-bold">{tasks.filter(t => t.status === 'completed').length}</p>
                </div>
                <RiTaskLine className="text-primary/20" size={32} />
             </Card>
             <Card className="p-4 flex items-center justify-between border-border/40">
                <div>
                   <p className="text-xs font-bold text-muted-foreground uppercase">Pending</p>
                   <p className="text-2xl font-bold text-orange-500">{tasks.filter(t => t.status === 'pending').length}</p>
                </div>
                <RiTimeLine className="text-orange-500/20" size={32} />
             </Card>
             <Card className="p-4 flex items-center justify-between border-border/40">
                <div>
                   <p className="text-xs font-bold text-muted-foreground uppercase">Target</p>
                   <p className="text-2xl font-bold">{tasks.length}</p>
                </div>
                <RiTaskLine className="text-muted-foreground/20" size={32} />
             </Card>
          </div>

          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-card p-3 rounded-lg border border-border shadow-sm">
            <div className="flex-1">
              <SearchBar value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search tasks..." className="w-full" />
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {displayTasks.length === 0 ? (
            <EmptyState 
              icon={activeTaskView === "daily" ? <RiTimeLine size={24} /> : <RiTaskLine size={24} />}
              title={`No ${activeTaskView} tasks found`}
              description="You do not have any tasks matching the current filters."
            />
          ) : (
            <Card className="overflow-hidden border-border/40 shadow-sm">
              <div className="overflow-x-auto scrollbar-thin">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="min-w-[200px]">Task</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Timer</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayTasks.map((task) => (
                      <TableRow key={task._id} onClick={() => { setSelectedTask(task); setShowDetailsModal(true); }} className="cursor-pointer hover:bg-muted/20 transition-colors">
                        <TableCell className="max-w-[250px]">
                          <div className="font-semibold truncate">{task.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{task.description}</div>
                        </TableCell>
                        <TableCell><PriorityBadge priority={task.priority} /></TableCell>
                        <TableCell><StatusBadge status={task.status?.replace('_', '-')} /></TableCell>
                        <TableCell>
                          {(task.status === "in-progress" || task.status === "in_progress" || task.totalTimeSpent > 0) ? (
                            <Badge variant="outline" className={`font-mono ${(task.status === 'in-progress' || task.status === 'in_progress') ? 'text-primary border-primary/20 bg-primary/5' : 'text-muted-foreground'}`}>
                              <RiTimeLine className="mr-1 h-3 w-3" />
                              {formatTime(calculateTaskSeconds(task))}
                            </Badge>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {task.status === "pending" && (
                              <Button size="sm" onClick={(e) => startTask(task._id, e)}>Start</Button>
                            )}
                            {(task.status === "in-progress" || task.status === "in_progress") && (
                              <Button size="sm" variant="secondary" onClick={(e) => openSubmitModal(task._id, e)}>Submit</Button>
                            )}
                            {task.status === "completed" && (
                              <Badge variant="secondary" className="bg-success/10 text-success border-success/20">Done</Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

        </main>
        )}
      </div>

      <Dialog open={showRemarkModal} onOpenChange={setShowRemarkModal}>
        <DialogContent>
          <form onSubmit={handleSubmitWithRemark}>
            <DialogHeader>
              <DialogTitle>Submit Task</DialogTitle>
              <DialogDescription>Add a remark detailing the work completed.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="Enter your remark here..."
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                required
                rows={5}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowRemarkModal(false)}>Cancel</Button>
              <Button type="submit" disabled={!remarkText.trim()}>Submit Task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeDashboard;
