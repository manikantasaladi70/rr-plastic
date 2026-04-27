import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  getListEmployeesQueryKey,
} from "@workspace/api-client-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

type FormState = {
  name: string;
  role: string;
  phone: string;
  dailySalary: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  name: "",
  role: "",
  phone: "",
  dailySalary: "",
  isActive: true,
};

export default function Employees() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: employees, isLoading } = useListEmployees({
    search: search || undefined,
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: getListEmployeesQueryKey() });

  const createMutation = useCreateEmployee({
    mutation: {
      onSuccess: () => {
        toast.success("Employee added");
        invalidate();
        setDialogOpen(false);
      },
      onError: () => toast.error("Failed to add employee"),
    },
  });

  const updateMutation = useUpdateEmployee({
    mutation: {
      onSuccess: () => {
        toast.success("Updated");
        invalidate();
        setDialogOpen(false);
      },
      onError: () => toast.error("Failed to update employee"),
    },
  });

  const deleteMutation = useDeleteEmployee({
    mutation: {
      onSuccess: () => {
        toast.success("Deleted");
        invalidate();
      },
      onError: () => toast.error("Failed to delete employee"),
    },
  });

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (emp: any) => {
    setEditId(emp.id);
    setForm({
      name: emp.name,
      role: emp.role,
      phone: emp.phone,
      dailySalary: String(emp.dailySalary),
      isActive: emp.isActive,
    });
    setDialogOpen(true);
  };

  // FIX: validate before submit — dailySalary must be a positive number
  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();

    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.role.trim()) {
      toast.error("Role is required");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Phone is required");
      return;
    }
    const salary = parseFloat(form.dailySalary);
    if (isNaN(salary) || salary <= 0) {
      toast.error("Enter a valid daily salary");
      return;
    }

    const payload = {
      data: {
        name: form.name.trim(),
        role: form.role.trim(),
        phone: form.phone.trim(),
        dailySalary: salary,
        isActive: form.isActive,
      },
    };

    if (editId) {
      updateMutation.mutate({ id: editId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const f = (v: any, k: keyof FormState) =>
    setForm((p) => ({ ...p, [k]: v }));

  // FIX: delete with confirmation so no accidental deletes
  const handleDelete = (emp: any) => {
    if (!confirm(`Delete "${emp.name}"? This cannot be undone.`)) return;
    deleteMutation.mutate({ id: emp.id });
  };

  const isBusy =
    createMutation.isPending ||
    updateMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-muted-foreground text-sm">
            Manage employee records and daily salary details.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search employees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Daily Salary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            )}

            {employees?.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell className="font-medium">{emp.name}</TableCell>
                <TableCell>{emp.role}</TableCell>
                <TableCell>{emp.phone}</TableCell>
                <TableCell>₹{Number(emp.dailySalary).toFixed(2)}/day</TableCell>
                <TableCell>
                  <Badge variant={emp.isActive ? "default" : "secondary"}>
                    {emp.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(emp)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  {/* FIX: confirm before delete */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDelete(emp)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {!employees?.length && !isLoading && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No employees found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editId ? "Edit Employee" : "Add Employee"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={form.name}
                onChange={(e) => f(e.target.value, "name")}
                placeholder="e.g. Ravi Kumar"
                required
              />
            </div>
            <div>
              <Label>Role / Designation</Label>
              <Input
                value={form.role}
                onChange={(e) => f(e.target.value, "role")}
                placeholder="e.g. Operator, Supervisor"
                required
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => f(e.target.value, "phone")}
                placeholder="10-digit mobile number"
                required
              />
            </div>
            <div>
              <Label>Daily Salary (₹)</Label>
              <Input
                type="number"
                step="0.01"
                min="1"
                value={form.dailySalary}
                onChange={(e) => f(e.target.value, "dailySalary")}
                placeholder="e.g. 500"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => f(e.target.checked, "isActive")}
              />
              <Label htmlFor="isActive">Active Employee</Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isBusy}>
                {isBusy ? "Saving..." : editId ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}