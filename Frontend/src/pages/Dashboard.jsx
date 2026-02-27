import React, { useEffect, useState, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend 
} from "recharts";
import { 
  RiDownload2Line, RiFilter3Line, RiFileChartLine,
  RiArrowRightUpLine, RiCheckDoubleLine, RiTimeLine,
  RiUserLine, RiTaskLine, RiCalendarLine
} from "@remixicon/react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

import { asyncLoadEmployees } from "../store/actions/employeeActions";
import { asyncLoadEmployeeTasks } from "../store/actions/employeeTaskActions";
import { updateTask, deleteTask, createTask } from "../store/reducers/employeeTaskSlice";
import { useSocket } from "../contexts/SocketContext";

import StatCard from "../components/StatCard";
import ActivityList from "../components/ActivityList";
import PageHeader from "../components/common/PageHeader";
import { DashboardSkeleton } from "../components/Loader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

/**
 * Combined Dashboard & Reports Page
 * Unified view for overview stats, real-time activity, and visual analytics.
 */
const Dashboard = () => {
  const dispatch = useDispatch();
  const socket = useSocket();
  const reportRef = useRef(null);
  
  const { employees, loading: employeesLoading } = useSelector((state) => state.employeeReducer);
  const { tasks, loading: tasksLoading } = useSelector((state) => state.employeeTaskReducer);
  
  const [filter, setFilter] = useState("weekly");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    dispatch(asyncLoadEmployees());
    dispatch(asyncLoadEmployeeTasks());
  }, [dispatch]);

  useEffect(() => {
    if (!socket) return;
    const handleTaskUpdatedBroadcast = ({ task }) => dispatch(updateTask(task));
    const handleTaskStatusChanged = ({ task }) => dispatch(updateTask(task));
    const handleTaskDeleted = ({ taskId }) => dispatch(deleteTask(taskId));
    const handleTaskAssigned = ({ task }) => dispatch(createTask(task));

    socket.on('taskUpdatedBroadcast', handleTaskUpdatedBroadcast);
    socket.on('taskStatusChanged', handleTaskStatusChanged);
    socket.on('taskDeleted', handleTaskDeleted);
    socket.on('taskAssigned', handleTaskAssigned);

    return () => {
      socket.off('taskUpdatedBroadcast', handleTaskUpdatedBroadcast);
      socket.off('taskStatusChanged', handleTaskStatusChanged);
      socket.off('taskDeleted', handleTaskDeleted);
      socket.off('taskAssigned', handleTaskAssigned);
    };
  }, [socket, dispatch]);

  // --- Data Processing Logic ---

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "completed").length;
    const inProgress = tasks.filter(t => t.status === "in-progress").length;
    const pending = tasks.filter(t => t.status === "pending").length;
    const totalEmployees = employees.length;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedToday = tasks.filter((t) => {
      if (t.status !== "completed" || !t.completedTime) return false;
      const completedDate = new Date(t.completedTime);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    }).length;

    return { 
      total, completed, inProgress, pending, 
      completionRate, totalEmployees, completedToday 
    };
  }, [tasks, employees]);

  const chartData = useMemo(() => {
    const now = new Date();
    const data = [];

    if (filter === "daily") {
      for (let i = 7; i >= 0; i--) {
        const start = new Date(now.getTime() - (i + 1) * 3 * 3600000);
        const end = new Date(now.getTime() - i * 3 * 3600000);
        const label = i === 0 ? "Now" : `${i * 3}h ago`;
        const completed = tasks.filter(t => {
          if (t.status !== "completed" || !t.completedTime) return false;
          const time = new Date(t.completedTime).getTime();
          return time >= start.getTime() && time < end.getTime();
        }).length;
        const created = tasks.filter(t => {
          const time = new Date(t.createdAt).getTime();
          return time >= start.getTime() && time < end.getTime();
        }).length;
        data.push({ name: label, completed, created });
      }
    } else {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dayName = days[d.getDay()];
        const dayCompleted = tasks.filter(t => {
          if (t.status !== "completed" || !t.completedTime) return false;
          const compDate = new Date(t.completedTime);
          return compDate.toDateString() === d.toDateString();
        }).length;
        const dayCreated = tasks.filter(t => {
          const createDate = new Date(t.createdAt);
          return createDate.toDateString() === d.toDateString();
        }).length;
        data.push({ name: i === 0 ? "Today" : dayName, completed: dayCompleted, created: dayCreated });
      }
    }
    return data;
  }, [tasks, filter]);

  const statusDistribution = [
    { name: "Completed", value: stats.completed },
    { name: "In Progress", value: stats.inProgress },
    { name: "Pending", value: stats.pending },
  ].filter(d => d.value > 0);

  const priorityData = useMemo(() => {
    const p = { high: 0, medium: 0, low: 0 };
    tasks.forEach(t => { if (p[t.priority] !== undefined) p[t.priority]++; });
    return [
      { name: "High", value: p.high },
      { name: "Medium", value: p.medium },
      { name: "Low", value: p.low },
    ].filter(d => d.value > 0);
  }, [tasks]);

  const activity = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    return [...tasks]
      .filter((t) => t.updatedAt || t.completedTime || t.startTime)
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.completedTime || a.startTime || 0);
        const dateB = new Date(b.updatedAt || b.completedTime || b.startTime || 0);
        return dateB - dateA;
      })
      .slice(0, 5)
      .map((t) => {
        const employeeName = t.assignedTo?.fullName
          ? `${t.assignedTo.fullName.firstName} ${t.assignedTo.fullName.lastName}`
          : t.assignedTo?.email || "Unknown";
        let activityText = `updated task: ${t.title}`;
        if (t.status === "completed") activityText = `completed task: ${t.title}`;
        else if (t.status === "in-progress") activityText = `started task: ${t.title}`;
        const diffMs = new Date() - new Date(t.updatedAt || t.completedTime || t.startTime || Date.now());
        const mins = Math.floor(diffMs / 60000);
        const hrs = Math.floor(diffMs / 3600000);
        const days = Math.floor(diffMs / 86400000);
        let timeAgo = "just now";
        if (mins > 0 && mins < 60) timeAgo = `${mins}m ago`;
        else if (hrs > 0 && hrs < 24) timeAgo = `${hrs}h ago`;
        else if (days > 0) timeAgo = `${days}d ago`;
        return { name: employeeName, activity: activityText, time: timeAgo };
      });
  }, [tasks]);

  // --- PDF Export ---

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff"
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`EMS-System-Dashboard-${new Date().toLocaleDateString()}.pdf`);
    } catch (error) {
      console.error("PDF Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (employeesLoading || tasksLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader 
          title="Dashboard Overview" 
          subtitle="Welcome back! Here's what's happening today."
        />
        
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px] bg-card/50 backdrop-blur-sm border-primary/20">
              <RiFilter3Line className="w-4 h-4 mr-2 text-primary" />
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily View</SelectItem>
              <SelectItem value="weekly">Weekly View</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={downloadPDF} 
            disabled={isExporting}
            className="group glass-morphism bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all font-semibold"
          >
            {isExporting ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Exporting...
              </span>
            ) : (
              <>
                <RiDownload2Line className="w-4 h-4 mr-2 group-hover:-translate-y-1 transition-transform" />
                Report
              </>
            )}
          </Button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-8 p-1">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Employees" value={stats.totalEmployees} icon={<RiUserLine size={20}/>} />
          <StatCard label="Completion Rate" value={`${stats.completionRate}%`} icon={<RiCheckDoubleLine size={20}/>} />
          <StatCard label="Completed Today" value={stats.completedToday} icon={<RiCheckDoubleLine size={20}/>} />
          <StatCard label="Pending Tasks"   value={stats.pending} icon={<RiTimeLine size={20}/>} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border/40 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-bold">Productivity Trend</CardTitle>
                <CardDescription>Daily task completion and creation flow</CardDescription>
              </div>
              <RiCalendarLine className="text-muted-foreground" size={20} />
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorComp)" />
                  <Area type="monotone" dataKey="created" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCreated)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Status Distribution</CardTitle>
              <CardDescription>Overall task landscape</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={80}
                    paddingAngle={5} dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center mt-2">
                <span className="text-2xl font-bold">{stats.total}</span>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Tasks</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Operational Flow Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityList data={activity} />
          
          <Card className="border-border/40 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Priority Breakdown</CardTitle>
              <CardDescription>Current workforce task urgency</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(0,0,0,0.02)'}}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'High' ? '#ef4444' : entry.name === 'Medium' ? '#f59e0b' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Insights Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/10 overflow-hidden relative group hover:bg-primary/10 transition-colors">
            <CardContent className="p-4 flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/20 text-primary group-hover:scale-110 transition-transform">
                <RiArrowRightUpLine size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold">Consistency Alert</h4>
                <p className="text-xs text-muted-foreground mt-1">Task completion rates are stable at {stats.completionRate}%. No major bottlenecks detected.</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-warning/5 border-warning/10 overflow-hidden relative group hover:bg-warning/10 transition-colors">
            <CardContent className="p-4 flex items-start gap-4">
              <div className="p-2 rounded-lg bg-warning/20 text-warning group-hover:scale-110 transition-transform">
                <RiTimeLine size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold">Attention Required</h4>
                <p className="text-xs text-muted-foreground mt-1">Currently {stats.pending} pending tasks need allocation to maintain workflow targets.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-success/5 border-success/10 overflow-hidden relative group hover:bg-success/10 transition-colors">
            <CardContent className="p-4 flex items-start gap-4">
              <div className="p-2 rounded-lg bg-success/20 text-success group-hover:scale-110 transition-transform">
                <RiCheckDoubleLine size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold">Peak Efficiency</h4>
                <p className="text-xs text-muted-foreground mt-1">Successfully cleared {stats.completed} milestones. Team output is in the high quadrant.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
