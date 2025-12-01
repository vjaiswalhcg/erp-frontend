"use client";

import { Payment } from "@/lib/types/payment";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Hash,
  Calendar,
  Clock,
  UserCircle,
  Shield,
  DollarSign,
  User,
  FileText,
  Link,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PaymentViewDialogProps {
  payment: Payment | null;
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
  received: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
  applied: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
};

export function PaymentViewDialog({
  payment,
  open,
  onOpenChange,
}: PaymentViewDialogProps) {
  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <span className="text-lg">Payment Details</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={statusColors[payment.status] || statusColors.received}>
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </Badge>
                {payment.is_deleted && (
                  <Badge variant="destructive">Deleted</Badge>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Basic Information */}
          <Section title="Payment Information">
            <div className="grid grid-cols-2 gap-x-4">
              <InfoRow icon={Hash} label="Payment ID" value={payment.id} />
              <InfoRow icon={Hash} label="External Reference" value={payment.external_ref} />
              <InfoRow icon={Calendar} label="Received Date" value={formatDate(payment.received_date)} />
              <InfoRow icon={Wallet} label="Payment Method" value={payment.method} />
              <InfoRow
                icon={User}
                label="Customer"
                value={payment.customer?.name || payment.customer_id}
              />
              {payment.invoice_id && (
                <InfoRow icon={Link} label="Linked Invoice" value={payment.invoice_id} />
              )}
            </div>
          </Section>

          {/* Amount */}
          <Section title="Amount">
            <div className="flex items-center gap-4">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(payment.amount, payment.currency)}
                </p>
                <p className="text-sm text-slate-500">{payment.currency}</p>
              </div>
            </div>
          </Section>

          {/* Notes */}
          {payment.note && (
            <Section title="Notes">
              <InfoRow icon={FileText} label="Payment Notes" value={payment.note} />
            </Section>
          )}

          {/* Audit Trail */}
          <Section title="Audit Trail">
            <div className="grid grid-cols-2 gap-x-4">
              <InfoRow icon={Calendar} label="Created At" value={formatDateTime(payment.created_at)} />
              <InfoRow icon={Clock} label="Last Modified At" value={formatDateTime(payment.updated_at)} />
              <InfoRow icon={UserCircle} label="Created By" value={payment.created_by_id || "System"} />
              <InfoRow icon={UserCircle} label="Last Modified By" value={payment.last_modified_by_id || "System"} />
              <InfoRow icon={Shield} label="Owner" value={payment.owner_id || "Unassigned"} />
            </div>
          </Section>

          {/* Deletion Information */}
          {payment.is_deleted && (
            <Section title="Deletion Information">
              <div className="grid grid-cols-2 gap-x-4">
                <InfoRow icon={Calendar} label="Deleted At" value={formatDateTime(payment.deleted_at)} />
                <InfoRow icon={UserCircle} label="Deleted By" value={payment.deleted_by_id || "System"} />
              </div>
            </Section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

