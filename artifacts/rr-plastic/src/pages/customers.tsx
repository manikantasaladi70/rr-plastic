import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer, useGetCustomerSummary, getListCustomersQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Search, Eye } from "lucide-react";
import { toast } from "sonner";

type FormState = { name: string; phone: string; gst: string; address: string };
const emptyForm: FormState = { name: "", phone: "", gst: "", address: "" };

function CustomerSummaryDialog({ customerId, onClose }: { customerId: number; onClose: () => void }) {
  const { data: summary } = useGetCustomerSummary(customerId);
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Customer Summary: {summary?.customerName}</DialogTitle></DialogHeader>
        {summary ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">{summary.totalMaterialIssued}</div>
                <div className="text-xs text-muted-foreground mt-1">Material Issued</div>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{summary.totalProductionReceived}</div>
                <div className="text-xs text-muted-foreground mt-1">Production Received</div>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className={`text-2xl font-bold ${summary.balance > 0 ? "text-orange-600" : "text-green-600"}`}>{summary.balance.toFixed(3)}</div>
                <div className="text-xs text-muted-foreground mt-1">Balance (Pending)</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Balance = Material Issued - Production Received. Positive balance means material is still pending return.</p>
          </div>
        ) : <div className="py-4 text-center">Loading...</div>}
        <DialogFooter><Button onClick={onClose}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Customers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [summaryId, setSummaryId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: customers, isLoading } = useListCustomers({ search: search || undefined });

  const invalidate = () => qc.invalidateQueries({ queryKey: getListCustomersQueryKey() });
  const createMutation = useCreateCustomer({ mutation: { onSuccess: () => { toast.success("Customer added"); invalidate(); setDialogOpen(false); } } });
  const updateMutation = useUpdateCustomer({ mutation: { onSuccess: () => { toast.success("Updated"); invalidate(); setDialogOpen(false); } } });
  const deleteMutation = useDeleteCustomer({ mutation: { onSuccess: () => { toast.success("Deleted"); invalidate(); } } });

  const openAdd = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: any) => { setEditId(c.id); setForm({ name: c.name, phone: c.phone, gst: c.gst || "", address: c.address || "" }); setDialogOpen(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { data: { name: form.name, phone: form.phone, gst: form.gst || undefined, address: form.address || undefined } };
    if (editId) updateMutation.mutate({ id: editId, ...payload });
    else createMutation.mutate(payload);
  };

  const f = (v: string, k: keyof FormState) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground text-sm">Manage customer accounts and view material balance.</p>
        </div>
        <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add Customer</Button>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>GST Number</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>}
            {customers?.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell>{c.gst || "-"}</TableCell>
                <TableCell>{c.address || "-"}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => setSummaryId(c.id)} title="View Summary"><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Edit2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate({ id: c.id })}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {(!customers?.length && !isLoading) && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No customers found.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Customer" : "Add Customer"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Customer Name</Label><Input value={form.name} onChange={e => f(e.target.value, "name")} required /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => f(e.target.value, "phone")} required /></div>
            <div><Label>GST Number (optional)</Label><Input value={form.gst} onChange={e => f(e.target.value, "gst")} /></div>
            <div><Label>Address (optional)</Label><Input value={form.address} onChange={e => f(e.target.value, "address")} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editId ? "Update" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {summaryId && <CustomerSummaryDialog customerId={summaryId} onClose={() => setSummaryId(null)} />}
    </div>
  );
}
