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
 * A unified component for Creating, Viewing, and Updating tasks.
 * Optimized for mobile-first scrolling with desktop-side-by-side splits.
 */
const TaskEditor = ({
  task,
  mode = "view",
  role = "admin",
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
  const canEditCoreFields = role === "admin" && (mode === "create" || mode === "edit");
  const canEditStatus = mode === "edit" || mode === "create";

  return (
    <div className="h-full w-full flex flex-col bg-background animate-fade-in pb-10 md:pb-0">
      <form onSubmit={handleSubmit} className="flex flex-col h-full border border-border rounded-lg shadow-sm bg-card overflow-y-auto md:overflow-hidden">
        
        {/* Top Section: Task Details */}
        <div className="flex-shrink-0 flex flex-col border-b border-border md:h-[45%]">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border bg-card sticky top-0 z-10 font-sans">
            <div className="flex items-start gap-2 md:gap-3">
              <Button type="button" variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0">
                <RiArrowLeftLine size={18} />
              </Button>
              <div className="flex flex-col gap-0.5">
                <h2 className="text-lg md:text-xl font-bold leading-tight tracking-tight text-foreground truncate max-w-[150px] xs:max-w-[250px] sm:max-w-none">
                  {mode === 'create' ? 'Create New Task' : form.title || 'Untitled Task'}
                </h2>
                {task && mode !== 'create' && (
                  <Badge variant="outline" className="text-[10px] px-2 py-0 h-4 text-muted-foreground bg-muted/30 border-border/60 font-mono tracking-wider w-fit rounded-full">
                     #{task._id?.slice(-6) || "ID"}
                  </Badge>
                )}
              </div>
            </div>
            {!isViewOnly && (
              <Button type="submit" size="sm" className="gap-2 font-semibold shadow-md">
                <RiSave3Line size={16} className="hidden xs:block" />
                {mode === 'create' ? 'Create' : 'Save'}
              </Button>
            )}
          </div>

          {/* Form Fields Area */}
          <div className="flex-1 p-4 md:p-6 bg-card overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {/* Title */}
              <div className="space-y-1.5 lg:col-span-2">
                <Label htmlFor="title" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Task Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Enter a descriptive title..."
                  disabled={!canEditCoreFields}
                  className="bg-background/50 h-9"
                  required
                />
              </div>

              {/* Assignee */}
              <div className="space-y-1.5">
                <Label htmlFor="assignedTo" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Assign To</Label>
                <Select
                  name="assignedTo"
                  value={form.assignedTo}
                  onValueChange={(val) => handleSelectChange('assignedTo', val)}
                  disabled={!canEditCoreFields}
                  required
                >
                  <SelectTrigger id="assignedTo" className="bg-background/50 h-9">
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
              <div className="space-y-1.5">
                <Label htmlFor="priority" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Priority</Label>
                <Select
                  name="priority"
                  value={form.priority}
                  onValueChange={(val) => handleSelectChange('priority', val)}
                  disabled={!canEditCoreFields}
                >
                  <SelectTrigger id="priority" className="bg-background/50 h-9">
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
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Status</Label>
                <Select
                  name="status"
                  value={form.status}
                  onValueChange={(val) => handleSelectChange('status', val)}
                  disabled={!canEditStatus}
                >
                  <SelectTrigger id="status" className="bg-background/50 h-9">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Is Daily */}
              {role === "admin" && canEditCoreFields && (
                <div className="sm:col-span-2 lg:col-span-3 flex items-center pt-2 gap-2">
                  <input
                    type="checkbox"
                    id="isDaily"
                    name="isDaily"
                    checked={form.isDaily}
                    onChange={(e) => setForm({ ...form, isDaily: e.target.checked })}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary bg-background"
                  />
                  <Label htmlFor="isDaily" className="font-semibold cursor-pointer text-xs text-muted-foreground">
                    Mark as a Daily Recurring Task
                  </Label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section: Description */}
        <div className="flex-1 flex flex-col p-4 md:p-6 bg-background space-y-4 md:h-[55%]">
          <div className="flex-1 flex flex-col gap-2">
            <Label htmlFor="description" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Task Description</Label>
            <Textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder={isViewOnly ? "No description provided." : "Enter comprehensive task details..."}
              disabled={!canEditCoreFields}
              className="flex-1 resize-none text-sm md:text-base p-4 bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/20 rounded-md"
              required
            />
          </div>

          {/* Optional Remark Area */}
          {(!canEditCoreFields && mode === "edit") || (task?.remark && mode === "view") ? (
            <div className="flex flex-col gap-2 shrink-0 h-[100px] md:h-[120px]">
               <Label htmlFor="remark" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Remarks / Completion Notes</Label>
               <Textarea
                 id="remark"
                 name="remark"
                 value={form.remark}
                 onChange={handleChange}
                 placeholder="Add context about completion..."
                 disabled={mode === "view" || (role === "admin" && task?.status === "completed")}
                 className="flex-1 resize-none text-sm border-dashed bg-background"
               />
            </div>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default TaskEditor;
