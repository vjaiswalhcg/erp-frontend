"use client";

import { Order } from "@/lib/types/order";
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
  ShoppingCart,
  Hash,
  Calendar,
  Clock,
  UserCircle,
  Shield,
  DollarSign,
  User,
  FileText,
  Package,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface OrderViewDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString();
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
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
  fulfilled: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
  closed: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400",
};

export function OrderViewDialog({
  order,
  open,
  onOpenChange,
}: OrderViewDialogProps) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <span className="text-lg">Order Details</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={statusColors[order.status] || statusColors.draft}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
                {order.is_deleted && (
                  <Badge variant="destructive">Deleted</Badge>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Basic Information */}
          <Section title="Order Information">
            <div className="grid grid-cols-2 gap-x-4">
              <InfoRow icon={Hash} label="Order ID" value={order.id} />
              <InfoRow icon={Hash} label="External Reference" value={order.external_ref} />
              <InfoRow icon={Calendar} label="Order Date" value={formatDateTime(order.order_date)} />
              <InfoRow icon={DollarSign} label="Currency" value={order.currency} />
              <InfoRow
                icon={User}
                label="Customer"
                value={order.customer?.name || order.customer_id}
              />
            </div>
          </Section>

          {/* Line Items */}
          <Section title="Line Items">
            <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100 dark:bg-slate-800">
                    <TableHead className="text-xs">Product</TableHead>
                    <TableHead className="text-xs text-right">Qty</TableHead>
                    <TableHead className="text-xs text-right">Unit Price</TableHead>
                    <TableHead className="text-xs text-right">Tax</TableHead>
                    <TableHead className="text-xs text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.lines?.map((line, idx) => (
                    <TableRow key={line.id || idx}>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-3 w-3 text-slate-400" />
                          {line.product?.name || line.product_id}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-right">{line.quantity}</TableCell>
                      <TableCell className="text-sm text-right">
                        {formatCurrency(line.unit_price, order.currency)}
                      </TableCell>
                      <TableCell className="text-sm text-right">
                        {(line.tax_rate * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-sm text-right font-medium">
                        {formatCurrency(line.line_total, order.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Section>

          {/* Totals */}
          <Section title="Order Totals">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span>{formatCurrency(order.subtotal, order.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax</span>
                <span>{formatCurrency(order.tax_total, order.currency)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-lg">{formatCurrency(order.total, order.currency)}</span>
              </div>
            </div>
          </Section>

          {/* Notes */}
          {order.notes && (
            <Section title="Notes">
              <InfoRow icon={FileText} label="Order Notes" value={order.notes} />
            </Section>
          )}

          {/* Audit Trail */}
          <Section title="Audit Trail">
            <div className="grid grid-cols-2 gap-x-4">
              <InfoRow icon={Calendar} label="Created At" value={formatDateTime(order.created_at)} />
              <InfoRow icon={Clock} label="Last Modified At" value={formatDateTime(order.updated_at)} />
              <InfoRow icon={UserCircle} label="Created By" value={order.created_by_id || "System"} />
              <InfoRow icon={UserCircle} label="Last Modified By" value={order.last_modified_by_id || "System"} />
              <InfoRow icon={Shield} label="Owner" value={order.owner_id || "Unassigned"} />
            </div>
          </Section>

          {/* Deletion Information */}
          {order.is_deleted && (
            <Section title="Deletion Information">
              <div className="grid grid-cols-2 gap-x-4">
                <InfoRow icon={Calendar} label="Deleted At" value={formatDateTime(order.deleted_at)} />
                <InfoRow icon={UserCircle} label="Deleted By" value={order.deleted_by_id || "System"} />
              </div>
            </Section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

