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

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">Title</Label>
              <Input
                id="title"
                name="title"
                required
                onChange={handleChange}
                value={form.title}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right mt-2">Description</Label>
              <Textarea
                id="description"
                name="description"
                onChange={handleChange}
                value={form.description}
                className="col-span-3 h-24"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assignedTo" className="text-right">Assign To</Label>
              <Select
                name="assignedTo"
                value={form.assignedTo}
                onValueChange={(val) => handleSelectChange("assignedTo", val)}
                disabled={loading || employees.length === 0}
                required
              >
                <SelectTrigger className="col-span-3">
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

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">Priority</Label>
              <Select
                name="priority"
                value={form.priority}
                onValueChange={(val) => handleSelectChange("priority", val)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <Select
                name="status"
                value={form.status}
                onValueChange={(val) => handleSelectChange("status", val)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-2 ml-[88px]">
              <input
                type="checkbox"
                id="isDaily"
                name="isDaily"
                checked={form.isDaily}
                onChange={(e) => setForm({ ...form, isDaily: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="isDaily" className="font-normal cursor-pointer">
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
