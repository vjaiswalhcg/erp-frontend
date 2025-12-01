"use client";

import { Invoice } from "@/lib/types/invoice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Hash,
  Calendar,
  Clock,
  UserCircle,
  Shield,
  DollarSign,
  User,
  Package,
  Link,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface InvoiceViewDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString();
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString();
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm text-slate-900 dark:text-slate-100 mt-0.5 break-words">
          {value || <span className="text-slate-400">—</span>}
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        {title}
      </h4>
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 space-y-1">
        {children}
      </div>
    </div>
  );
}

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  posted: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
  written_off: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
};

export function InvoiceViewDialog({
  invoice,
  open,
  onOpenChange,
}: InvoiceViewDialogProps) {
  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center">
              <FileText className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <span className="text-lg">Invoice Details</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={statusColors[invoice.status] || statusColors.draft}>
                  {invoice.status.replace("_", " ").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                </Badge>
                {invoice.is_deleted && (
                  <Badge variant="destructive">Deleted</Badge>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Basic Information */}
          <Section title="Invoice Information">
            <div className="grid grid-cols-2 gap-x-4">
              <InfoRow icon={Hash} label="Invoice ID" value={invoice.id} />
              <InfoRow icon={Hash} label="External Reference" value={invoice.external_ref} />
              <InfoRow icon={Calendar} label="Invoice Date" value={formatDate(invoice.invoice_date)} />
              <InfoRow icon={Calendar} label="Due Date" value={formatDate(invoice.due_date)} />
              <InfoRow icon={DollarSign} label="Currency" value={invoice.currency} />
              <InfoRow
                icon={User}
                label="Customer"
                value={invoice.customer?.name || invoice.customer_id}
              />
              {invoice.order_id && (
                <InfoRow icon={Link} label="Linked Order" value={invoice.order_id} />
              )}
            </div>
          </Section>

          {/* Line Items */}
          <Section title="Line Items">
            <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100 dark:bg-slate-800">
                    <TableHead className="text-xs">Item</TableHead>
                    <TableHead className="text-xs text-right">Qty</TableHead>
                    <TableHead className="text-xs text-right">Unit Price</TableHead>
                    <TableHead className="text-xs text-right">Tax</TableHead>
                    <TableHead className="text-xs text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.lines?.map((line, idx) => (
                    <TableRow key={line.id || idx}>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-3 w-3 text-slate-400" />
                          {line.description || line.product?.name || line.product_id || "Item"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-right">{line.quantity}</TableCell>
                      <TableCell className="text-sm text-right">
                        {formatCurrency(line.unit_price, invoice.currency)}
                      </TableCell>
                      <TableCell className="text-sm text-right">
                        {((line.tax_rate || 0) * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-sm text-right font-medium">
                        {formatCurrency(line.line_total, invoice.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Section>

          {/* Totals */}
          <Section title="Invoice Totals">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax</span>
                <span>{formatCurrency(invoice.tax_total, invoice.currency)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-lg">{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
            </div>
          </Section>

          {/* Notes */}
          {invoice.notes && (
            <Section title="Notes">
              <InfoRow icon={FileText} label="Invoice Notes" value={invoice.notes} />
            </Section>
          )}

          {/* Audit Trail */}
          <Section title="Audit Trail">
            <div className="grid grid-cols-2 gap-x-4">
              <InfoRow icon={Calendar} label="Created At" value={formatDateTime(invoice.created_at)} />
              <InfoRow icon={Clock} label="Last Modified At" value={formatDateTime(invoice.updated_at)} />
              <InfoRow icon={UserCircle} label="Created By" value={invoice.created_by_id || "System"} />
              <InfoRow icon={UserCircle} label="Last Modified By" value={invoice.last_modified_by_id || "System"} />
              <InfoRow icon={Shield} label="Owner" value={invoice.owner_id || "Unassigned"} />
            </div>
          </Section>

          {/* Deletion Information */}
          {invoice.is_deleted && (
            <Section title="Deletion Information">
              <div className="grid grid-cols-2 gap-x-4">
                <InfoRow icon={Calendar} label="Deleted At" value={formatDateTime(invoice.deleted_at)} />
                <InfoRow icon={UserCircle} label="Deleted By" value={invoice.deleted_by_id || "System"} />
              </div>
            </Section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

