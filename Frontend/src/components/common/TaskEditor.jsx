import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { RiArrowLeftLine, RiSave3Line, RiCheckboxCircleLine } from "@remixicon/react";
import { Badge } from "../ui/badge";

/**
 * TaskEditor
 * A unified full-page component for Creating, Viewing, and Updating tasks.
 * Designed with a 40/60 vertical split as requested.
 */
const TaskEditor = ({
  task, // pass null or undefined if creating
  mode = "view", // "create", "edit", "view"
  role = "admin", // "admin" or "employee"
  employees = [],
  onSave,
  onCancel,
}) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium",
    status: "pending",
    isDaily: false,
    remark: "",
  });

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || "",
        description: task.description || "",
        assignedTo: task.assignedTo?._id || task.assignedTo || "",
        priority: task.priority || "medium",
        status: task.status || "pending",
        isDaily: task.isDaily || false,
        remark: task.remark || "",
      });
    }
  }, [task]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSelectChange = (name, value) => setForm({ ...form, [name]: value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const isViewOnly = mode === "view";
  // Admins can edit core fields (title, assignee, priority) during create/edit.
  // Employees can generally only edit status/remark on assigned tasks.
  const canEditCoreFields = role === "admin" && (mode === "create" || mode === "edit");
  const canEditStatus = mode === "edit" || mode === "create";

  return (
    <div className="h-full w-full flex flex-col bg-background animate-in fade-in slide-in-from-bottom-4 duration-300">
      <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden border border-border rounded-lg shadow-sm bg-card">
        
        {/* Top 40%: Task Options and Functionality */}
        <div className="h-[40%] flex-shrink-0 flex flex-col border-b border-border">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-card">
            <div className="flex items-start gap-3">
              <Button type="button" variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 mt-1 text-muted-foreground hover:text-foreground shrink-0">
                <RiArrowLeftLine size={20} />
              </Button>
              <div className="flex items-start gap-4">
                <div className="p-1.5 bg-primary/10 text-primary rounded-md shrink-0 mt-0.5 border border-primary/20">
                  <RiCheckboxCircleLine className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-1.5 pt-0.5">
                  <h2 className="text-xl font-semibold leading-tight tracking-tight text-foreground">
                    {mode === 'create' ? 'Create New Task' : form.title || 'Untitled Task'}
                  </h2>
                  {task && mode !== 'create' && (
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-muted-foreground bg-muted/30 border-border/60 font-mono tracking-wider w-fit rounded-full">
                       #{task._id?.slice(-6) || "ID"}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {!isViewOnly && (
              <Button type="submit" size="sm" className="gap-2">
                <RiSave3Line size={16} />
                {mode === 'create' ? 'Create Task' : 'Save Changes'}
              </Button>
            )}
          </div>

          {/* Form Fields Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-card">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Title - Takes full width or 2 cols depending on layout */}
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Enter a descriptive title..."
                  disabled={!canEditCoreFields}
                  required
                />
              </div>

              {/* Assignee */}
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assign To</Label>
                <Select
                  name="assignedTo"
                  value={form.assignedTo}
                  onValueChange={(val) => handleSelectChange('assignedTo', val)}
                  disabled={!canEditCoreFields}
                  required
                >
                  <SelectTrigger id="assignedTo">
                    <SelectValue placeholder="Select Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp._id || emp.id} value={emp._id || emp.id}>
                        {emp.fullName?.firstName || emp.firstName} {emp.fullName?.lastName || emp.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  name="priority"
                  value={form.priority}
                  onValueChange={(val) => handleSelectChange('priority', val)}
                  disabled={!canEditCoreFields}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  name="status"
                  value={form.status}
                  onValueChange={(val) => handleSelectChange('status', val)}
                  disabled={!canEditStatus}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Is Daily Metadata */}
              {role === "admin" && canEditCoreFields && (
                <div className="space-y-2 lg:col-span-3 flex items-center pt-8 gap-2">
                  <input
                    type="checkbox"
                    id="isDaily"
                    name="isDaily"
                    checked={form.isDaily}
                    onChange={(e) => setForm({ ...form, isDaily: e.target.checked })}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary bg-background"
                  />
                  <Label htmlFor="isDaily" className="font-normal cursor-pointer text-muted-foreground mt-[2px]">
                    Mark as a Daily Recurring Task
                  </Label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom 60%: Rich Text / Description Editor */}
        <div className="h-[60%] flex flex-col flex-1 p-6 bg-background space-y-4">
          <div className="flex-1 flex flex-col gap-2">
            <Label htmlFor="description" className="text-base">Task Description</Label>
            <Textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder={isViewOnly ? "No description provided." : "Enter comprehensive task details, requirements, and links here..."}
              disabled={!canEditCoreFields}
              className="flex-1 resize-none text-base p-4"
              required
            />
          </div>

          {/* Optional Remark Area for Employees submitting context or Admins reviewing */}
          {(!canEditCoreFields && mode === "edit") || (task?.remark && mode === "view") ? (
            <div className="h-[20%] flex flex-col gap-2 shrink-0">
               <Label htmlFor="remark">Remarks / Completion Notes</Label>
               <Textarea
                 id="remark"
                 name="remark"
                 value={form.remark}
                 onChange={handleChange}
                 placeholder="Add context about completion..."
                 disabled={mode === "view" || (role === "admin" && task?.status === "completed")}
                 className="flex-1 resize-none"
               />
            </div>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default TaskEditor;
