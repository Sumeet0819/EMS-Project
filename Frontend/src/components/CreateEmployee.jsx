import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { asyncCreateEmployee } from "../store/actions/employeeActions";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { RiLoader4Line } from "@remixicon/react";

/**
 * CreateEmployee Modal
 * Refactored to use shadcn Dialog, Input, Button, Label
 */
const CreateEmployee = ({ onClose }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.employeeReducer);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "default123",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(asyncCreateEmployee(form));
      toast.success("Employee Created Successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to Create Employee");
    }
  };

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Enter the employee details. Default role is 'employee'. Default password is 'default123'.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="John"
                value={form.firstName}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Doe"
                value={form.lastName}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john.doe@company.com"
                value={form.email}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="default123"
                value={form.password}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Creating..." : "Add Employee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEmployee;
