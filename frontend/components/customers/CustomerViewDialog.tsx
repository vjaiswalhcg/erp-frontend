"use client";

import { Customer } from "@/lib/types/customer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  Clock,
  UserCircle,
  Shield,
  Hash,
} from "lucide-react";

interface CustomerViewDialogProps {
  customer: Customer | null;
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
  className = "",
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-3 py-2 ${className}`}>
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
      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
        {title}
      </h4>
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 space-y-1">
        {children}
      </div>
    </div>
  );
}

export function CustomerViewDialog({
  customer,
  open,
  onOpenChange,
}: CustomerViewDialogProps) {
  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <span className="text-lg">{customer.name}</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={customer.is_active ? "default" : "secondary"}
                  className={
                    customer.is_active
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }
                >
                  {customer.is_active ? "Active" : "Inactive"}
                </Badge>
                {customer.is_deleted && (
                  <Badge variant="destructive">Deleted</Badge>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Basic Information */}
          <Section title="Basic Information">
            <div className="grid grid-cols-2 gap-x-4">
              <InfoRow icon={Hash} label="ID" value={customer.id} />
              <InfoRow
                icon={Hash}
                label="External Reference"
                value={customer.external_ref}
              />
              <InfoRow icon={Mail} label="Email" value={customer.email} />
              <InfoRow icon={Phone} label="Phone" value={customer.phone} />
              <InfoRow
                icon={CreditCard}
                label="Currency"
                value={customer.currency}
              />
            </div>
          </Section>

          {/* Addresses */}
          <Section title="Addresses">
            <InfoRow
              icon={MapPin}
              label="Billing Address"
              value={customer.billing_address}
            />
            <Separator className="my-2" />
            <InfoRow
              icon={MapPin}
              label="Shipping Address"
              value={customer.shipping_address}
            />
          </Section>

          {/* Audit Trail */}
          <Section title="Audit Trail">
            <div className="grid grid-cols-2 gap-x-4">
              <InfoRow
                icon={Calendar}
                label="Created At"
                value={formatDateTime(customer.created_at)}
              />
              <InfoRow
                icon={Clock}
                label="Last Modified At"
                value={formatDateTime(customer.updated_at)}
              />
              <InfoRow
                icon={UserCircle}
                label="Created By"
                value={customer.created_by_id || "System"}
              />
              <InfoRow
                icon={UserCircle}
                label="Last Modified By"
                value={customer.last_modified_by_id || "System"}
              />
              <InfoRow
                icon={Shield}
                label="Owner"
                value={customer.owner_id || "Unassigned"}
              />
            </div>
          </Section>

          {/* System Status (only show if deleted) */}
          {customer.is_deleted && (
            <Section title="Deletion Information">
              <div className="grid grid-cols-2 gap-x-4">
                <InfoRow
                  icon={Calendar}
                  label="Deleted At"
                  value={formatDateTime(customer.deleted_at)}
                />
                <InfoRow
                  icon={UserCircle}
                  label="Deleted By"
                  value={customer.deleted_by_id || "System"}
                />
              </div>
            </Section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

