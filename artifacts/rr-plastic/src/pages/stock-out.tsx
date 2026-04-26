import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListStockOut, useCreateStockOut, useUpdateStockOut, useDeleteStockOut, useListMaterials, getListStockOutQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

type FormState = { materialId: string; quantity: string; date: string; purpose: string; remarks: string };
const emptyForm: FormState = { materialId: "", quantity: "", date: new Date().toISOString().split("T")[0], purpose: "", remarks: "" };

export default function StockOut() {
  const qc = useQueryClient();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: stockOut, isLoading } = useListStockOut({ startDate: startDate || undefined, endDate: endDate || undefined });
  const { data: materials } = useListMaterials({});

  const invalidate = () => qc.invalidateQueries({ queryKey: getListStockOutQueryKey() });

  const createMutation = useCreateStockOut({ mutation: { onSuccess: () => { toast.success("Stock out added"); invalidate(); setDialogOpen(false); }, onError: (e: any) => toast.error(e.data?.error || "Insufficient stock") } });
  const updateMutation = useUpdateStockOut({ mutation: { onSuccess: () => { toast.success("Updated"); invalidate(); setDialogOpen(false); } } });
  const deleteMutation = useDeleteStockOut({ mutation: { onSuccess: () => { toast.success("Deleted"); invalidate(); } } });

  const openAdd = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (item: any) => {
    setEditId(item.id);
    setForm({ materialId: String(item.materialId), quantity: String(item.quantity), date: item.date, purpose: item.purpose || "", remarks: item.remarks || "" });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { data: { materialId: parseInt(form.materialId), quantity: parseFloat(form.quantity), date: form.date, purpose: form.purpose || undefined, remarks: form.remarks || undefined } };
    if (editId) updateMutation.mutate({ id: editId, ...payload });
    else createMutation.mutate(payload);
  };

  const f = (v: string, k: keyof FormState) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Stock Out</h1>
          <p className="text-muted-foreground text-sm">Record material consumption and stock withdrawals.</p>
        </div>
        <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add Stock Out</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div><Label className="text-xs">From</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-36" /></div>
        <div><Label className="text-xs">To</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-36" /></div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Date</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>}
            {stockOut?.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.date}</TableCell>
                <TableCell className="font-medium">{item.materialName}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.purpose || "-"}</TableCell>
                <TableCell>{item.remarks || "-"}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Edit2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate({ id: item.id })}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {(!stockOut?.length && !isLoading) && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No records found.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Stock Out" : "Add Stock Out"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Material</Label>
              <Select value={form.materialId} onValueChange={v => f(v, "materialId")}>
                <SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger>
                <SelectContent>{materials?.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name} ({m.unit}) — Stock: {m.currentStock}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Quantity</Label><Input type="number" step="0.001" value={form.quantity} onChange={e => f(e.target.value, "quantity")} required /></div>
              <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => f(e.target.value, "date")} required /></div>
            </div>
            <div><Label>Purpose</Label><Input value={form.purpose} onChange={e => f(e.target.value, "purpose")} /></div>
            <div><Label>Remarks</Label><Input value={form.remarks} onChange={e => f(e.target.value, "remarks")} /></div>
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
