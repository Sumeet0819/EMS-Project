import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  asyncLoadTasksByEmployee,
  asyncStartTask,
  asyncStopTask,
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
import ChatPage from "../components/common/ChatPage";
import ChatUnreadListener from "../components/common/ChatUnreadListener";

const EmployeeDashboard = () => {
  const dispatch = useDispatch();
  const { tasks } = useSelector((state) => state.employeeTaskReducer);
  const { user } = useSelector((state) => state.userReducer);
  const { todayLog } = useSelector((state) => state.employeeTaskReducer);
  const conversations = useSelector(s => s.messageReducer.conversations);
  const chatChannels  = useSelector(s => s.channelReducer.channels);
  const chatUnread = useMemo(() =>
    conversations.reduce((a, c) => a + (c.unreadCount || 0), 0) +
    chatChannels.reduce((a, c)  => a + (c.unreadCount || 0), 0)
  , [conversations, chatChannels]);

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

  // Removed useEffect that syncs Day Time with 24h work log to prevent shift-timer flickering

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      // Calculate 12-hour bucket boundary
      const bucketStart = new Date(now);
      bucketStart.setHours(now.getHours() < 12 ? 0 : 12, 0, 0, 0);

      // UI will re-calculate task seconds in real-time using calculateTaskSeconds

      // Calculate Daily Total from Task Times (within the last 12-hour bucket)
      const total = tasks.reduce((acc, t) => {
        return acc + calculateTaskSeconds(t);
      }, 0);

      setDaySeconds(total);
    }, 1000);
    return () => clearInterval(interval);
  }, [tasks, dispatch]);

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
    try { 
      await dispatch(asyncStartTask(id)); 
      // Always ensure the day log is active if a task starts
      if (!todayLog?.isActive) {
        await dispatch(asyncStartDay());
      }
      toast.success("Task started successfully"); 
    }
    catch (err) { toast.error("Failed to start task: " + err.message); }
  };

  const stopTask = async (id, e) => {
    e.stopPropagation();
    try { 
      await dispatch(asyncStopTask(id)); 
      // Stop day log ONLY if no other tasks are running
      const otherRunning = tasks.some(t => t._id !== id && (t.status === 'in-progress' || t.status === 'in_progress'));
      if (!otherRunning) {
        await dispatch(asyncStopDay());
      }
      toast.success("Task stopped successfully"); 
    }
    catch (err) { toast.error("Failed to stop task: " + err.message); }
  };

  const formatTime = (sec) => {
    if (!sec && sec !== 0) return "00:00:00";
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };


  const calculateTaskSeconds = (task) => {
    if (!task) return 0;
    const now = new Date();
    const bucketStart = new Date(now);
    bucketStart.setHours(now.getHours() < 12 ? 0 : 12, 0, 0, 0);

    // Reset logic: if lastResetTime is before this bucket, shiftTimeSpent is ignored
    const lastReset = task.lastResetTime ? new Date(task.lastResetTime) : new Date(0);
    const totalInShift = lastReset >= bucketStart ? (task.shiftTimeSpent || 0) : 0;

    const isRunning = task.status === "in-progress" || task.status === "in_progress";
    
    if (isRunning && task.startTime) {
      const taskStart = new Date(task.startTime);
      // Clip start time to bucket boundary
      const effectiveStart = taskStart > bucketStart ? taskStart : bucketStart;
      const elapsed = Math.max(0, Math.floor((now - effectiveStart) / 1000));
      
      // If task started before this bucket, we ignore previous bucket's shiftTimeSpent
      if (taskStart < bucketStart) return elapsed;
      return totalInShift + elapsed;
    }

    return totalInShift;
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

      {/* Always-on chat unread listener */}
      <ChatUnreadListener />

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-all duration-300 ease-in-out lg:relative ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:-ml-64"}`}>
        <AppSidebar
          role="employee"
          activePage={activeTaskView}
          chatUnread={chatUnread}
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
            userName={`${user?.fullName?.firstName || ""} ${user?.fullName?.lastName || ""}`.trim() || "Employee"}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />

          {activeTaskView === 'stats' ? (
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
              <EmployeeStats />
            </main>
          ) : activeTaskView === 'chat' ? (
            <main className="flex-1 overflow-hidden p-4">
              <ChatPage />
            </main>
          ) : showDetailsModal && selectedTask ? (
            <main className="flex-1 overflow-hidden p-4 md:p-6 lg:p-8">
              <TaskEditor 
                task={selectedTask}
                mode="edit"
                role="employee"
                onSave={handleEditorSave}
                onStart={(id) => startTask(id, { stopPropagation: () => {} })}
                onStop={(id) => stopTask(id, { stopPropagation: () => {} })}
                onSubmit={async (id, remark) => {
                  try {
                    await dispatch(asyncSubmitTask(id, remark));
                    // Check if other tasks are running before stopping day
                    const otherRunning = tasks.some(t => t._id !== id && (t.status === 'in-progress' || t.status === 'in_progress'));
                    if (!otherRunning) {
                      await dispatch(asyncStopDay());
                    }
                    toast.success("Task submitted successfully");
                    setShowDetailsModal(false);
                    setSelectedTask(null);
                  } catch (err) { toast.error("Failed to submit task: " + err.message); }
                }}
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
           <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-background border border-border/60 rounded-xl shadow-sm">
            <div className={`h-2.5 w-2.5 rounded-full ${todayLog?.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">Day Time</span>
              <span className="text-lg font-mono font-black text-foreground tabular-nums tracking-tight">
                {formatTime(daySeconds)}
              </span>
            </div>
          </div>
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
                          {(() => {
                            const shiftSec = calculateTaskSeconds(task);
                            const isRunning = task.status === "in-progress" || task.status === "in_progress";
                            if (isRunning || shiftSec > 0) {
                              return (
                                <Badge variant="outline" className={`font-mono ${isRunning ? 'text-primary border-primary/20 bg-primary/5' : 'text-muted-foreground'}`}>
                                  <RiTimeLine className="mr-1 h-3 w-3" />
                                  {formatTime(shiftSec)}
                                </Badge>
                              );
                            }
                            return "-";
                          })()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {(task.status === "pending" || task.status === "pending") && (
                              <Button size="sm" onClick={(e) => startTask(task._id, e)} className="bg-emerald-600 hover:bg-emerald-700">Start</Button>
                            )}
                            {(task.status === "in-progress" || task.status === "in_progress") && (
                              <>
                                <Button size="sm" variant="outline" onClick={(e) => stopTask(task._id, e)} className="border-orange-500 text-orange-600 hover:bg-orange-50 shadow-sm">Stop</Button>
                                <Button size="sm" onClick={(e) => { e.stopPropagation(); setSelectedTask(task); setShowDetailsModal(true); }} className="bg-emerald-600 hover:bg-emerald-700">Submit</Button>
                              </>
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

    </div>
  );
};

export default EmployeeDashboard;
