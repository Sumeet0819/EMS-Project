import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RiAddLine, RiPencilLine, RiDeleteBinLine, RiGroupLine } from "@remixicon/react";
import {
  asyncLoadEmployees,
  asyncDeleteEmployee,
  asyncUpdateEmployee,
} from "../store/actions/employeeActions";
import CreateEmployee from "../components/CreateEmployee";
import EmployeeCard from "../components/EmployeeCard";
import SearchBar from "../components/common/SearchBar";
import ViewToggle from "../components/common/ViewToggle";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import UserAvatar from "../components/common/UserAvatar";

const TeamManagement = () => {
  const dispatch = useDispatch();
  const { employees } = useSelector((state) => state.employeeReducer);
  const [isCreateEmployee, setCreateEmployee] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(asyncLoadEmployees());
  }, [dispatch]);

  const confirmDelete = async () => {
    try {
      await dispatch(asyncDeleteEmployee(employeeToDelete._id || employeeToDelete.id));
      dispatch(asyncLoadEmployees());
      toast.success("Employee deleted successfully");
      setIsDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    } catch (error) {
      toast.error("Failed to delete employee");
    }
  };

  const handleUpdateEmployee = (e) => {
    e.preventDefault();
    const updatedEmployee = {
      ...selectedEmployee,
      fullName: {
        firstName: e.target.firstName.value,
        lastName: e.target.lastName.value,
      },
      email: e.target.email.value,
      role: e.target.role.value,
    };
    dispatch(asyncUpdateEmployee(updatedEmployee));
    setEditModalOpen(false);
    toast.success("Employee Details Updated Successfully");
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const firstName = emp.fullName?.firstName || emp.firstName || "";
      const lastName = emp.fullName?.lastName || emp.lastName || "";
      const fullName = `${firstName} ${lastName}`.toLowerCase();
      const email = (emp.email || "").toLowerCase();
      const query = searchQuery.toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });
  }, [employees, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Team Management"
        subtitle="Manage your employees and their roles"
        actions={
          <Button onClick={() => setCreateEmployee(true)}>
            <RiAddLine className="mr-2 h-4 w-4" /> Add Employee
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-card p-3 rounded-lg border border-border shadow-sm">
        <div className="flex-1">
          <SearchBar 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full"
          />
        </div>
        <div className="flex justify-end">
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        </div>
      </div>

      {filteredEmployees.length === 0 ? (
        <EmptyState 
          icon={<RiGroupLine size={24} />}
          title="No Employees Found"
          description={employees.length === 0 ? "Get started by adding your first employee to the team." : "No employees match your search."}
          action={
            employees.length === 0 && (
              <Button onClick={() => setCreateEmployee(true)}>
                <RiAddLine className="mr-2 h-4 w-4" /> Add First Employee
              </Button>
            )
          }
        />
      ) : viewMode === 'list' ? (
        <Card className="overflow-hidden border-border/40 shadow-sm">
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="min-w-[150px]">Employee</TableHead>
                  <TableHead className="min-w-[150px]">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((emp) => (
                  <TableRow key={emp._id || emp.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar 
                          firstName={emp.fullName?.firstName || emp.firstName} 
                          lastName={emp.fullName?.lastName || emp.lastName} 
                          size="sm"
                          className="hidden xs:flex"
                        />
                        <span className="font-semibold text-sm whitespace-nowrap">
                          {emp.fullName?.firstName || emp.firstName} {emp.fullName?.lastName || emp.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-[10px] md:text-xs">
                       <span className="max-w-[120px] md:max-w-[200px] truncate block" title={emp.email}>
                        {emp.email}
                       </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={emp.role === "admin" ? "default" : "secondary"} className="scale-90 md:scale-100">
                        {emp.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => { setSelectedEmployee(emp); setEditModalOpen(true); }}
                        >
                          <RiPencilLine size={14} />
                        </Button>
                        <Button 
                          variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => { setEmployeeToDelete(emp); setIsDeleteDialogOpen(true); }}
                        >
                          <RiDeleteBinLine size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredEmployees.map((emp) => (
            <EmployeeCard 
              key={emp._id || emp.id} 
              employee={{...emp, _id: emp._id || emp.id}}
              onEdit={(e) => { setSelectedEmployee(e); setEditModalOpen(true); }}
              onDelete={() => { setEmployeeToDelete(emp); setIsDeleteDialogOpen(true); }}
            />
          ))}
        </div>
      )}

      {isCreateEmployee && (
        <CreateEmployee onClose={() => { setCreateEmployee(false); dispatch(asyncLoadEmployees()); }} />
      )}

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          {selectedEmployee && (
            <form onSubmit={handleUpdateEmployee}>
              <DialogHeader>
                <DialogTitle>Edit Employee</DialogTitle>
                <DialogDescription>Update the employee's details.</DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="firstName" className="text-right">First Name</Label>
                  <Input id="firstName" name="firstName" defaultValue={selectedEmployee.fullName?.firstName || selectedEmployee.firstName} required className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="lastName" className="text-right">Last Name</Label>
                  <Input id="lastName" name="lastName" defaultValue={selectedEmployee.fullName?.lastName || selectedEmployee.lastName} required className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={selectedEmployee.email} required className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">Role</Label>
                  <div className="col-span-3">
                    <Select name="role" defaultValue={selectedEmployee.role} required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
                <Button type="submit">Update</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog 
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Employee"
        description={<>Are you sure you want to delete <strong>{employeeToDelete?.fullName?.firstName || employeeToDelete?.firstName}</strong>? This will remove their access to the system.</>}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
};

export default TeamManagement;
