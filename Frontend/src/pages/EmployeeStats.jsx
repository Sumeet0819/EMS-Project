import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import PageHeader from "../components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { RiTimeLine, RiCheckDoubleLine, RiTaskLine, RiCalendarLine } from "@remixicon/react";
import { Badge } from "../components/ui/badge";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b"];

const EmployeeStats = () => {
  const { tasks } = useSelector((state) => state.employeeTaskReducer);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress' || t.status === 'in-progress').length;
    
    // Average time spent on completed tasks (in minutes)
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.totalTimeSpent > 0);
    const avgTime = completedTasks.length > 0
      ? Math.round(completedTasks.reduce((acc, t) => acc + t.totalTimeSpent, 0) / completedTasks.length / 60)
      : 0;

    return { total, completed, pending, inProgress, avgTime };
  }, [tasks]);

  const statusDistribution = [
    { name: "Completed", value: stats.completed },
    { name: "In Progress", value: stats.inProgress },
    { name: "Pending", value: stats.pending },
  ];

  // Dummy chart data for "Activity over 7 days"
  const chartData = [
    { name: "Mon", completed: 3, goal: 5 },
    { name: "Tue", completed: 5, goal: 5 },
    { name: "Wed", completed: 4, goal: 5 },
    { name: "Thu", completed: 6, goal: 5 },
    { name: "Fri", completed: 5, goal: 5 },
    { name: "Sat", completed: 2, goal: 2 },
    { name: "Sun", completed: 1, goal: 2 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Statistics" 
        subtitle="Track your productivity and performance metrics"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tasks Completed" value={stats.completed} icon={<RiCheckDoubleLine size={20}/>} color="text-emerald-500" />
        <StatCard label="Total Time Spent" value={`${Math.round(tasks.reduce((acc, t) => acc + (t.totalTimeSpent || 0), 0) / 3600)}h`} icon={<RiTimeLine size={20}/>} color="text-blue-500" />
        <StatCard label="Avg. Task Time" value={`${stats.avgTime}m`} icon={<RiTimeLine size={20}/>} color="text-orange-500" />
        <StatCard label="Productivity Score" value="85%" icon={<RiCheckDoubleLine size={20}/>} color="text-primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg font-bold">Task Completion Trend</CardTitle>
              <CardDescription className="text-xs">Weekly productivity overview</CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter">
                <RiCalendarLine className="mr-1 h-3 w-3" /> Last 7 Days
            </Badge>
          </CardHeader>
          <CardContent className="h-[300px] w-full px-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '10px' }} />
                <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorComp)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Status Distribution</CardTitle>
            <CardDescription className="text-xs">Current workload balance</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col items-center justify-center p-2">
            <ResponsiveContainer width="100%" height="75%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%" cy="50%"
                  innerRadius={45} outerRadius={65}
                  paddingAngle={5} dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '10px' }} />
                <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '10px' }}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-4">
              <span className="text-xl font-bold">{stats.total}</span>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Assigned</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => (
  <Card className="border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
          <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg bg-background border border-border/50 ${color}`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default EmployeeStats;
