import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { asyncLoadEmployees } from "../store/actions/employeeActions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";

const CreateTask = ({ onCancel, onSubmit, employees: passedEmployees, preSelectedEmployee }) => {
  const dispatch = useDispatch();
  const { employees: reduxEmployees, loading } = useSelector((state) => state.employeeReducer);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: preSelectedEmployee || "",
    priority: "medium",
    status: "pending",
    isDaily: false,
  });

  useEffect(() => {
    if (!passedEmployees || passedEmployees.length === 0) {
      dispatch(asyncLoadEmployees());
    }
  }, [dispatch, passedEmployees]);

  useEffect(() => {
    if (preSelectedEmployee) {
      setForm(prev => ({ ...prev, assignedTo: preSelectedEmployee }));
    }
  }, [preSelectedEmployee]);

  const employees = passedEmployees && passedEmployees.length > 0 ? passedEmployees : reduxEmployees;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const selectedEmployee = employees.find((e) => e._id === form.assignedTo || e.id === form.assignedTo);

    onSubmit({
      title: form.title,
      description: form.description,
      assignedTo: form.assignedTo,
      assignedToName: selectedEmployee ? `${selectedEmployee.fullName?.firstName || selectedEmployee.firstName} ${selectedEmployee.fullName?.lastName || selectedEmployee.lastName}` : "",
      priority: form.priority,
      status: form.status,
      isDaily: form.isDaily,
    });

    setForm({
      title: "",
      description: "",
      assignedTo: preSelectedEmployee || "",
      priority: "medium",
      status: "pending",
      isDaily: false,
    });
  };

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Fill in the task details and assign it to an employee.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title" className="text-left font-semibold">Title</Label>
              <Input
                id="title"
                name="title"
                required
                onChange={handleChange}
                value={form.title}
                placeholder="Enter task title"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description" className="text-left font-semibold">Description</Label>
              <Textarea
                id="description"
                name="description"
                onChange={handleChange}
                value={form.description}
                className="h-24 md:h-32"
                placeholder="Briefly describe the task"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="assignedTo" className="text-left font-semibold">Assign To</Label>
                <Select
                  name="assignedTo"
                  value={form.assignedTo}
                  onValueChange={(val) => handleSelectChange("assignedTo", val)}
                  disabled={loading || employees.length === 0}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? "Loading..." : "Select employee"} />
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

              <div className="flex flex-col gap-2">
                <Label htmlFor="priority" className="text-left font-semibold">Priority</Label>
                <Select
                  name="priority"
                  value={form.priority}
                  onValueChange={(val) => handleSelectChange("priority", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="status" className="text-left font-semibold">Status</Label>
              <Select
                name="status"
                value={form.status}
                onValueChange={(val) => handleSelectChange("status", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="isDaily"
                name="isDaily"
                checked={form.isDaily}
                onChange={(e) => setForm({ ...form, isDaily: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
              />
              <Label htmlFor="isDaily" className="font-medium text-sm cursor-pointer opacity-80">
                Mark as Daily Task (recurring)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || employees.length === 0}>
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTask;
