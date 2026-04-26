import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListProduction, useCreateProduction, useUpdateProduction, useDeleteProduction, useListCustomers, useListMaterials, getListProductionQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

type FormState = { customerId: string; materialId: string; quantityIssued: string; quantityReceived: string; date: string; remarks: string };
const emptyForm: FormState = { customerId: "", materialId: "", quantityIssued: "0", quantityReceived: "0", date: new Date().toISOString().split("T")[0], remarks: "" };

export default function Production() {
  const qc = useQueryClient();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: production, isLoading } = useListProduction({ startDate: startDate || undefined, endDate: endDate || undefined });
  const { data: customers } = useListCustomers({});
  const { data: materials } = useListMaterials({});

  const invalidate = () => qc.invalidateQueries({ queryKey: getListProductionQueryKey() });
  const createMutation = useCreateProduction({ mutation: { onSuccess: () => { toast.success("Production record added"); invalidate(); setDialogOpen(false); } } });
  const updateMutation = useUpdateProduction({ mutation: { onSuccess: () => { toast.success("Updated"); invalidate(); setDialogOpen(false); } } });
  const deleteMutation = useDeleteProduction({ mutation: { onSuccess: () => { toast.success("Deleted"); invalidate(); } } });

  const openAdd = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (item: any) => {
    setEditId(item.id);
    setForm({ customerId: String(item.customerId), materialId: String(item.materialId), quantityIssued: String(item.quantityIssued), quantityReceived: String(item.quantityReceived), date: item.date, remarks: item.remarks || "" });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { data: { customerId: parseInt(form.customerId), materialId: parseInt(form.materialId), quantityIssued: parseFloat(form.quantityIssued), quantityReceived: parseFloat(form.quantityReceived), date: form.date, remarks: form.remarks || undefined } };
    if (editId) updateMutation.mutate({ id: editId, ...payload });
    else createMutation.mutate(payload);
  };

  const f = (v: string, k: keyof FormState) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Production</h1>
          <p className="text-muted-foreground text-sm">Track material given to customers and production returned.</p>
        </div>
        <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add Record</Button>
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
              <TableHead>Customer</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Qty Issued</TableHead>
              <TableHead>Qty Received</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow>}
            {production?.map(item => {
              const balance = item.quantityIssued - item.quantityReceived;
              return (
                <TableRow key={item.id}>
                  <TableCell>{item.date}</TableCell>
                  <TableCell className="font-medium">{item.customerName}</TableCell>
                  <TableCell>{item.materialName}</TableCell>
                  <TableCell>{item.quantityIssued}</TableCell>
                  <TableCell>{item.quantityReceived}</TableCell>
                  <TableCell className={balance > 0 ? "text-orange-600 font-medium" : "text-green-600 font-medium"}>{balance.toFixed(3)}</TableCell>
                  <TableCell>{item.remarks || "-"}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Edit2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate({ id: item.id })}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {(!production?.length && !isLoading) && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No records found.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Production Record" : "Add Production Record"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Customer</Label>
              <Select value={form.customerId} onValueChange={v => f(v, "customerId")}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>{customers?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Material</Label>
              <Select value={form.materialId} onValueChange={v => f(v, "materialId")}>
                <SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger>
                <SelectContent>{materials?.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name} ({m.unit})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Qty Issued</Label><Input type="number" step="0.001" min="0" value={form.quantityIssued} onChange={e => f(e.target.value, "quantityIssued")} /></div>
              <div><Label>Qty Received</Label><Input type="number" step="0.001" min="0" value={form.quantityReceived} onChange={e => f(e.target.value, "quantityReceived")} /></div>
            </div>
            <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => f(e.target.value, "date")} required /></div>
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
