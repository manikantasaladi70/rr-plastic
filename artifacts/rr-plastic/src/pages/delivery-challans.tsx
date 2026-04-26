import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListDeliveryChallans, useCreateDeliveryChallan, useDeleteDeliveryChallan, useGetDeliveryChallan, useListCustomers, useListMaterials, getListDeliveryChallansQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Eye, Printer, PlusCircle, X } from "lucide-react";
import { toast } from "sonner";

type LineItem = { materialId: string; description: string; quantity: string; rate: string };

function ChallanPrintView({ id, onClose }: { id: number; onClose: () => void }) {
  const { data: challan } = useGetDeliveryChallan(id);

  const print = () => {
    const el = document.getElementById("challan-print");
    if (!el) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Delivery Challan</title><style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      h1 { text-align: center; font-size: 20px; }
      .header { text-align: center; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { border: 1px solid #ccc; padding: 6px 10px; }
      th { background: #f0f0f0; }
      .total { text-align: right; font-weight: bold; margin-top: 10px; font-size: 16px; }
      .info { display: flex; justify-content: space-between; margin: 10px 0; }
    </style></head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.print();
  };

  if (!challan) return null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Delivery Challan</DialogTitle></DialogHeader>
        <div id="challan-print" className="p-4">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold">RR Plastics</h2>
            <p className="text-sm text-muted-foreground">Delivery Challan</p>
          </div>
          <div className="flex justify-between text-sm mb-4 border-b pb-4">
            <div><strong>Challan No:</strong> {challan.challanNumber}</div>
            <div><strong>Date:</strong> {challan.date}</div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div><strong>Customer:</strong> {challan.customerName}</div>
            <div><strong>Vehicle No:</strong> {challan.vehicleNumber}</div>
          </div>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="border px-3 py-2 text-left">#</th>
                <th className="border px-3 py-2 text-left">Item / Description</th>
                <th className="border px-3 py-2 text-right">Qty</th>
                <th className="border px-3 py-2 text-right">Rate</th>
                <th className="border px-3 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {challan.items.map((item, i) => (
                <tr key={item.id}>
                  <td className="border px-3 py-2">{i + 1}</td>
                  <td className="border px-3 py-2">{item.materialName}{item.description ? ` - ${item.description}` : ""}</td>
                  <td className="border px-3 py-2 text-right">{item.quantity}</td>
                  <td className="border px-3 py-2 text-right">&#8377;{item.rate}</td>
                  <td className="border px-3 py-2 text-right">&#8377;{item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-muted/30">
                <td colSpan={4} className="border px-3 py-2 text-right">Total Amount:</td>
                <td className="border px-3 py-2 text-right">&#8377;{challan.totalAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          <div className="flex justify-between mt-12 text-sm">
            <div>Received by: _______________</div>
            <div>Authorized Signatory: _______________</div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={print}><Printer className="mr-2 h-4 w-4" />Print</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function DeliveryChallans() {
  const qc = useQueryClient();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [items, setItems] = useState<LineItem[]>([{ materialId: "", description: "", quantity: "", rate: "" }]);

  const { data: challans, isLoading } = useListDeliveryChallans({ startDate: startDate || undefined, endDate: endDate || undefined });
  const { data: customers } = useListCustomers({});
  const { data: materials } = useListMaterials({});

  const invalidate = () => qc.invalidateQueries({ queryKey: getListDeliveryChallansQueryKey() });
  const createMutation = useCreateDeliveryChallan({ mutation: { onSuccess: () => { toast.success("Challan created"); invalidate(); setDialogOpen(false); } } });
  const deleteMutation = useDeleteDeliveryChallan({ mutation: { onSuccess: () => { toast.success("Deleted"); invalidate(); } } });

  const addItem = () => setItems(p => [...p, { materialId: "", description: "", quantity: "", rate: "" }]);
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));
  const setItem = (i: number, k: keyof LineItem, v: string) => setItems(p => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

  const openAdd = () => {
    setCustomerId(""); setVehicleNumber(""); setDate(new Date().toISOString().split("T")[0]);
    setItems([{ materialId: "", description: "", quantity: "", rate: "" }]);
    setDialogOpen(true);
  };

  const totalAmount = items.reduce((s, it) => s + (parseFloat(it.quantity) || 0) * (parseFloat(it.rate) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ data: {
      customerId: parseInt(customerId),
      vehicleNumber,
      date,
      items: items.filter(it => it.materialId && it.quantity && it.rate).map(it => ({
        materialId: parseInt(it.materialId),
        description: it.description || undefined,
        quantity: parseFloat(it.quantity),
        rate: parseFloat(it.rate),
      }))
    }});
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Delivery Challans</h1>
          <p className="text-muted-foreground text-sm">Create and manage delivery challans with print support.</p>
        </div>
        <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />New Challan</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div><Label className="text-xs">From</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-36" /></div>
        <div><Label className="text-xs">To</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-36" /></div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Challan No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>}
            {challans?.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-mono font-medium">{c.challanNumber}</TableCell>
                <TableCell>{c.date}</TableCell>
                <TableCell>{c.customerName}</TableCell>
                <TableCell>{c.vehicleNumber}</TableCell>
                <TableCell className="font-medium">&#8377;{c.totalAmount.toFixed(2)}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => setViewId(c.id)}><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate({ id: c.id })}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {(!challans?.length && !isLoading) && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No challans found.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Create Delivery Challan</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Customer</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>{customers?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Vehicle Number</Label><Input value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} required /></div>
            </div>
            <div><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} required /></div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Line Items</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addItem}><PlusCircle className="mr-1 h-4 w-4" />Add Item</Button>
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    <Select value={item.materialId} onValueChange={v => setItem(i, "materialId", v)}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="Material" /></SelectTrigger>
                      <SelectContent>{materials?.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3"><Input placeholder="Description" value={item.description} onChange={e => setItem(i, "description", e.target.value)} className="h-8" /></div>
                  <div className="col-span-2"><Input placeholder="Qty" type="number" step="0.001" value={item.quantity} onChange={e => setItem(i, "quantity", e.target.value)} className="h-8" /></div>
                  <div className="col-span-2"><Input placeholder="Rate" type="number" step="0.01" value={item.rate} onChange={e => setItem(i, "rate", e.target.value)} className="h-8" /></div>
                  <div className="col-span-1 text-right">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(i)}><X className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
              <div className="text-right text-sm font-medium pt-2 border-t">Total: &#8377;{totalAmount.toFixed(2)}</div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Create Challan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {viewId && <ChallanPrintView id={viewId} onClose={() => setViewId(null)} />}
    </div>
  );
}
