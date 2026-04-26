import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee, getListEmployeesQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

type FormState = { name: string; role: string; phone: string; dailySalary: string; isActive: boolean };
const emptyForm: FormState = { name: "", role: "", phone: "", dailySalary: "", isActive: true };

export default function Employees() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: employees, isLoading } = useListEmployees({ search: search || undefined });

  const invalidate = () => qc.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
  const createMutation = useCreateEmployee({ mutation: { onSuccess: () => { toast.success("Employee added"); invalidate(); setDialogOpen(false); } } });
  const updateMutation = useUpdateEmployee({ mutation: { onSuccess: () => { toast.success("Updated"); invalidate(); setDialogOpen(false); } } });
  const deleteMutation = useDeleteEmployee({ mutation: { onSuccess: () => { toast.success("Deleted"); invalidate(); } } });

  const openAdd = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (e: any) => {
    setEditId(e.id);
    setForm({ name: e.name, role: e.role, phone: e.phone, dailySalary: String(e.dailySalary), isActive: e.isActive });
    setDialogOpen(true);
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const payload = { data: { name: form.name, role: form.role, phone: form.phone, dailySalary: parseFloat(form.dailySalary), isActive: form.isActive } };
    if (editId) updateMutation.mutate({ id: editId, ...payload });
    else createMutation.mutate(payload);
  };

  const f = (v: any, k: keyof FormState) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-muted-foreground text-sm">Manage employee records and daily salary details.</p>
        </div>
        <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add Employee</Button>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

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
            {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>}
            {employees?.map(emp => (
              <TableRow key={emp.id}>
                <TableCell className="font-medium">{emp.name}</TableCell>
                <TableCell>{emp.role}</TableCell>
                <TableCell>{emp.phone}</TableCell>
                <TableCell>&#8377;{emp.dailySalary}/day</TableCell>
                <TableCell><Badge variant={emp.isActive ? "default" : "secondary"}>{emp.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(emp)}><Edit2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate({ id: emp.id })}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {(!employees?.length && !isLoading) && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No employees found.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Employee" : "Add Employee"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Full Name</Label><Input value={form.name} onChange={e => f(e.target.value, "name")} required /></div>
            <div><Label>Role / Designation</Label><Input value={form.role} onChange={e => f(e.target.value, "role")} required /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => f(e.target.value, "phone")} required /></div>
            <div><Label>Daily Salary (&#8377;)</Label><Input type="number" step="0.01" value={form.dailySalary} onChange={e => f(e.target.value, "dailySalary")} required /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => f(e.target.checked, "isActive")} />
              <Label htmlFor="isActive">Active Employee</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editId ? "Update" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
