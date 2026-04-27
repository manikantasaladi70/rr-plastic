import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListDeliveryChallans,
  useCreateDeliveryChallan,
  useDeleteDeliveryChallan,
  useGetDeliveryChallan,
  useListCustomers,
  useListMaterials,
  getListDeliveryChallansQueryKey,
} from "@workspace/api-client-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Eye, Printer, PlusCircle, X } from "lucide-react";
import { toast } from "sonner";

type LineItem = {
  materialId: string;  // "manual" = free-type, else numeric id
  manualName: string;  // used when materialId === "manual"
  description: string;
  quantity: string;
  rate: string;
};

const emptyItem = (): LineItem => ({
  materialId: "",
  manualName: "",
  description: "",
  quantity: "",
  rate: "",
});

/* ─── Print View ─────────────────────────────────────────────────────────── */
function ChallanPrintView({ id, onClose }: { id: number; onClose: () => void }) {
  const { data: challan } = useGetDeliveryChallan(id);

  const print = () => {
    const el = document.getElementById("challan-print");
    if (!el) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Delivery Challan</title></head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.print();
  };

  if (!challan) return null;

  const dateFormatted = new Date(challan.date).toLocaleDateString("en-IN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  const s = {
    wrap: { fontFamily: "Arial, sans-serif", padding: "40px", fontSize: "13px", color: "#000" },
    title: { textAlign: "right" as const, fontSize: "24px", fontWeight: "bold", marginBottom: "20px" },
    topRow: { display: "flex", justifyContent: "space-between", borderTop: "2px solid #000", borderBottom: "1px solid #000", padding: "8px 0", marginBottom: "16px" },
    topLabel: { fontWeight: "bold", fontSize: "11px", display: "block", marginBottom: "4px" },
    addrRow: { display: "flex", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid #ccc" },
    billFrom: { flex: 1, textAlign: "right" as const },
    addrLabel: { fontWeight: "bold", fontSize: "11px", display: "block", marginBottom: "4px" },
    docType: { marginBottom: "20px", fontSize: "12px" },
    docLabel: { fontWeight: "bold", display: "block", marginBottom: "2px" },
    table: { width: "100%", borderCollapse: "collapse" as const },
    th: { background: "#f5f5f5", fontSize: "11px", fontWeight: "bold", padding: "8px", border: "1px solid #ccc", textAlign: "left" as const },
    thR: { background: "#f5f5f5", fontSize: "11px", fontWeight: "bold", padding: "8px", border: "1px solid #ccc", textAlign: "right" as const },
    td: { padding: "8px", border: "1px solid #ccc", fontSize: "12px" },
    tdR: { padding: "8px", border: "1px solid #ccc", fontSize: "12px", textAlign: "right" as const },
    tdLabel: { padding: "8px", border: "1px solid #ccc", fontSize: "12px", textAlign: "right" as const, fontWeight: "bold" },
    sig: { textAlign: "right" as const, marginTop: "60px", fontSize: "13px" },
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Delivery Challan – {challan.challanNumber}</DialogTitle>
        </DialogHeader>

        <div id="challan-print" style={s.wrap}>
          <div style={s.title}>Delivery Challan</div>

          <div style={s.topRow}>
            <div style={{ flex: 1 }}>
              <span style={s.topLabel}>INVOICE DATE</span>
              {dateFormatted}
            </div>
            <div style={{ flex: 1 }}>
              <span style={s.topLabel}>DELIVERY CHALLAN NO.</span>
              {challan.challanNumber}
            </div>
            <div style={{ flex: 1 }}>
              <span style={s.topLabel}>PLACE OF SUPPLY</span>
              Telangana
            </div>
          </div>

          <div style={s.addrRow}>
            <div style={{ flex: 1 }}>
              <span style={s.addrLabel}>DELIVER TO</span>
              <div style={{ fontWeight: "bold" }}>{challan.customerName}</div>
              <div style={{ fontSize: "11px", marginTop: "4px" }}>Vehicle No: {challan.vehicleNumber}</div>
            </div>
            <div style={s.billFrom}>
              <span style={s.addrLabel}>BILL FROM</span>
              <div style={{ fontWeight: "bold" }}>RR Plastics</div>
              <div>Hyderabad</div>
              <div>Telangana</div>
            </div>
          </div>

          <div style={s.docType}>
            <span style={s.docLabel}>Document Type Code</span>
            <div>DC</div>
          </div>

          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>#</th>
                <th style={s.th}>Item Name</th>
                <th style={s.th}>Description</th>
                <th style={s.thR}>QTY</th>
                <th style={s.thR}>Price/Unit</th>
                <th style={s.thR}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {challan.items.map((item, i) => (
                <tr key={item.id}>
                  <td style={s.td}>{i + 1}</td>
                  <td style={s.td}>{item.materialName || item.description || "—"}</td>
                  <td style={s.td}>{item.description || "—"}</td>
                  <td style={s.tdR}>{item.quantity}</td>
                  <td style={s.tdR}>₹{Number(item.rate).toFixed(2)}</td>
                  <td style={s.tdR}>₹{Number(item.amount).toFixed(2)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={5} style={s.tdLabel}>SUB TOTAL</td>
                <td style={s.tdR}>₹{challan.totalAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan={5} style={s.tdLabel}>ADDITIONAL CHARGES</td>
                <td style={s.tdR}>₹0.00</td>
              </tr>
              <tr>
                <td colSpan={5} style={s.tdLabel}>ADDITIONAL DISCOUNT</td>
                <td style={s.tdR}>₹0.00</td>
              </tr>
              <tr>
                <td colSpan={5} style={s.tdLabel}>TOTAL DUE</td>
                <td style={{ ...s.tdR, fontWeight: "bold" }}>₹{challan.totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div style={s.sig}>Authorised Signature</div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={print}><Printer className="mr-2 h-4 w-4" />Print</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function DeliveryChallans() {
  const qc = useQueryClient();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);

  const { data: challans, isLoading } = useListDeliveryChallans({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });
  const { data: customers } = useListCustomers({});
  const { data: materials } = useListMaterials({});

  const invalidate = () => qc.invalidateQueries({ queryKey: getListDeliveryChallansQueryKey() });

  const createMutation = useCreateDeliveryChallan({
    mutation: {
      onSuccess: () => { toast.success("Challan created"); invalidate(); setDialogOpen(false); },
      onError: () => toast.error("Failed to create challan"),
    },
  });

  const deleteMutation = useDeleteDeliveryChallan({
    mutation: {
      onSuccess: () => { toast.success("Challan deleted"); invalidate(); },
      onError: () => toast.error("Failed to delete challan"),
    },
  });

  const addItem = () => setItems(p => [...p, emptyItem()]);
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));
  const setItem = (i: number, k: keyof LineItem, v: string) =>
    setItems(p => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

  const openAdd = () => {
    setCustomerId("");
    setVehicleNumber("");
    setDate(new Date().toISOString().split("T")[0]);
    setItems([emptyItem()]);
    setDialogOpen(true);
  };

  const totalAmount = items.reduce(
    (s, it) => s + (parseFloat(it.quantity) || 0) * (parseFloat(it.rate) || 0), 0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) { toast.error("Please select a customer"); return; }
    if (!vehicleNumber.trim()) { toast.error("Please enter a vehicle number"); return; }

    const validItems = items.filter(it => {
      if (it.materialId === "manual") return it.manualName.trim() && it.quantity && it.rate;
      return it.materialId && it.quantity && it.rate;
    });

    if (!validItems.length) { toast.error("Add at least one complete line item"); return; }

    // Find a fallback materialId for manual items (use first material or 1)
    const fallbackMaterialId = materials?.[0]?.id ?? 1;

    createMutation.mutate({
      data: {
        customerId: parseInt(customerId),
        vehicleNumber: vehicleNumber.trim(),
        date,
        items: validItems.map(it => ({
          materialId: it.materialId === "manual" ? fallbackMaterialId : parseInt(it.materialId),
          description: it.materialId === "manual"
            ? it.manualName.trim()
            : (it.description || undefined),
          quantity: parseFloat(it.quantity),
          rate: parseFloat(it.rate),
        })),
      },
    });
  };

  const handleDelete = (c: { id: number; challanNumber: string }) => {
    if (!confirm(`Delete challan ${c.challanNumber}? This cannot be undone.`)) return;
    deleteMutation.mutate({ id: c.id });
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
        <div>
          <Label className="text-xs">From</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-36" />
        </div>
        <div>
          <Label className="text-xs">To</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-36" />
        </div>
        {(startDate || endDate) && (
          <div className="flex items-end">
            <Button variant="ghost" size="sm" onClick={() => { setStartDate(""); setEndDate(""); }}>Clear filter</Button>
          </div>
        )}
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
                <TableCell>{new Date(c.date).toLocaleDateString("en-IN")}</TableCell>
                <TableCell>{c.customerName}</TableCell>
                <TableCell>{c.vehicleNumber}</TableCell>
                <TableCell className="font-medium">₹{c.totalAmount.toFixed(2)}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => setViewId(c.id)} title="View & Print">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(c)} disabled={deleteMutation.isPending} title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!challans?.length && !isLoading && (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No challans found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Delivery Challan</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Customer *</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vehicle Number *</Label>
                <Input value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} placeholder="e.g. TS09AB1234" />
              </div>
            </div>

            <div>
              <Label>Date *</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Line Items *</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addItem}>
                  <PlusCircle className="mr-1 h-4 w-4" />Add Item
                </Button>
              </div>

              <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground px-1">
                <div className="col-span-4">Material</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-2">Rate (₹)</div>
                <div className="col-span-1" />
              </div>

              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    {item.materialId === "manual" ? (
                      <div className="flex gap-1">
                        <Input
                          placeholder="Type material name"
                          value={item.manualName}
                          onChange={e => setItem(i, "manualName", e.target.value)}
                          className="h-8"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          title="Switch to dropdown"
                          onClick={() => setItem(i, "materialId", "")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Select value={item.materialId} onValueChange={v => setItem(i, "materialId", v)}>
                        <SelectTrigger className="h-8"><SelectValue placeholder="Select or type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">✏️ Type manually</SelectItem>
                          {materials?.map(m => (
                            <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="col-span-3">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={e => setItem(i, "description", e.target.value)}
                      className="h-8"
                      disabled={item.materialId === "manual"}
                      title={item.materialId === "manual" ? "Name is used as description for manual items" : ""}
                    />
                  </div>

                  <div className="col-span-2">
                    <Input
                      placeholder="Qty"
                      type="number"
                      step="0.001"
                      min="0"
                      value={item.quantity}
                      onChange={e => setItem(i, "quantity", e.target.value)}
                      className="h-8"
                    />
                  </div>

                  <div className="col-span-2">
                    <Input
                      placeholder="Rate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.rate}
                      onChange={e => setItem(i, "rate", e.target.value)}
                      className="h-8"
                    />
                  </div>

                  <div className="col-span-1 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeItem(i)}
                      disabled={items.length === 1}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="text-right text-sm font-medium pt-2 border-t">
                Total: ₹{totalAmount.toFixed(2)}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Challan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {viewId !== null && <ChallanPrintView id={viewId} onClose={() => setViewId(null)} />}
    </div>
  );
}