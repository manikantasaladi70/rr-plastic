import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListMaterials, useCreateMaterial, useUpdateMaterial, useDeleteMaterial, getListMaterialsQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Search, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type FormState = { name: string; unit: string; currentStock: string; lowStockThreshold: string };
const emptyForm: FormState = { name: "", unit: "kg", currentStock: "0", lowStockThreshold: "50" };

export default function Materials() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: materials, isLoading } = useListMaterials({ search: search || undefined });

  const invalidate = () => qc.invalidateQueries({ queryKey: getListMaterialsQueryKey() });
  const createMutation = useCreateMaterial({ mutation: { onSuccess: () => { toast.success("Material added"); invalidate(); setDialogOpen(false); } } });
  const updateMutation = useUpdateMaterial({ mutation: { onSuccess: () => { toast.success("Updated"); invalidate(); setDialogOpen(false); } } });
  const deleteMutation = useDeleteMaterial({ mutation: { onSuccess: () => { toast.success("Deleted"); invalidate(); } } });

  const openAdd = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (m: any) => {
    setEditId(m.id);
    setForm({ name: m.name, unit: m.unit, currentStock: String(m.currentStock), lowStockThreshold: String(m.lowStockThreshold) });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { data: { name: form.name, unit: form.unit, currentStock: parseFloat(form.currentStock), lowStockThreshold: parseFloat(form.lowStockThreshold) } };
    if (editId) updateMutation.mutate({ id: editId, ...payload });
    else createMutation.mutate(payload);
  };

  const f = (v: string, k: keyof FormState) => setForm(p => ({ ...p, [k]: v }));

  const lowStockCount = materials?.filter(m => m.currentStock <= m.lowStockThreshold).length || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Materials</h1>
          <p className="text-muted-foreground text-sm">Manage raw materials and inventory thresholds.</p>
        </div>
        <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add Material</Button>
      </div>

      {lowStockCount > 0 && (
        <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-2 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>{lowStockCount} material{lowStockCount > 1 ? "s are" : " is"} below low stock threshold</span>
        </div>
      )}

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search materials..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Material Name</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Low Stock Threshold</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>}
            {materials?.map(m => {
              const isLow = m.currentStock <= m.lowStockThreshold;
              return (
                <TableRow key={m.id} className={isLow ? "bg-destructive/5" : ""}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>{m.unit}</TableCell>
                  <TableCell className={isLow ? "text-destructive font-bold" : "font-medium"}>{m.currentStock}</TableCell>
                  <TableCell>{m.lowStockThreshold}</TableCell>
                  <TableCell>
                    <Badge variant={isLow ? "destructive" : "secondary"}>{isLow ? "Low Stock" : "OK"}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Edit2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate({ id: m.id })}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {(!materials?.length && !isLoading) && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No materials found.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Material" : "Add Material"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Material Name</Label><Input value={form.name} onChange={e => f(e.target.value, "name")} required /></div>
            <div><Label>Unit (e.g. kg, liters, pcs)</Label><Input value={form.unit} onChange={e => f(e.target.value, "unit")} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Current Stock</Label><Input type="number" step="0.001" min="0" value={form.currentStock} onChange={e => f(e.target.value, "currentStock")} required /></div>
              <div><Label>Low Stock Threshold</Label><Input type="number" step="0.001" min="0" value={form.lowStockThreshold} onChange={e => f(e.target.value, "lowStockThreshold")} required /></div>
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
