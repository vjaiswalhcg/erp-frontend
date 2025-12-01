"use client";

import { Product } from "@/lib/types/product";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Hash,
  DollarSign,
  Calendar,
  Clock,
  UserCircle,
  Shield,
  Tag,
  FileText,
  Ruler,
} from "lucide-react";

interface ProductViewDialogProps {
  product: Product | null;
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

export function ProductViewDialog({
  product,
  open,
  onOpenChange,
}: ProductViewDialogProps) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
              <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <span className="text-lg">{product.name}</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="font-mono">
                  {product.sku}
                </Badge>
                <Badge
                  variant={product.is_active ? "default" : "secondary"}
                  className={
                    product.is_active
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }
                >
                  {product.is_active ? "Active" : "Inactive"}
                </Badge>
                {product.is_deleted && (
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
              <InfoRow icon={Hash} label="ID" value={product.id} />
              <InfoRow
                icon={Hash}
                label="External Reference"
                value={product.external_ref}
              />
              <InfoRow icon={Tag} label="SKU" value={product.sku} />
              <InfoRow icon={Ruler} label="Unit of Measure" value={product.uom} />
            </div>
          </Section>

          {/* Pricing */}
          <Section title="Pricing">
            <div className="grid grid-cols-2 gap-x-4">
              <InfoRow
                icon={DollarSign}
                label="Price"
                value={`${product.currency} ${product.price.toFixed(2)}`}
              />
              <InfoRow icon={Tag} label="Tax Code" value={product.tax_code} />
            </div>
          </Section>

          {/* Description */}
          {product.description && (
            <Section title="Description">
              <InfoRow
                icon={FileText}
                label="Description"
                value={product.description}
              />
            </Section>
          )}

          {/* Audit Trail */}
          <Section title="Audit Trail">
            <div className="grid grid-cols-2 gap-x-4">
              <InfoRow
                icon={Calendar}
                label="Created At"
                value={formatDateTime(product.created_at)}
              />
              <InfoRow
                icon={Clock}
                label="Last Modified At"
                value={formatDateTime(product.updated_at)}
              />
              <InfoRow
                icon={UserCircle}
                label="Created By"
                value={product.created_by_id || "System"}
              />
              <InfoRow
                icon={UserCircle}
                label="Last Modified By"
                value={product.last_modified_by_id || "System"}
              />
              <InfoRow
                icon={Shield}
                label="Owner"
                value={product.owner_id || "Unassigned"}
              />
            </div>
          </Section>

          {/* Deletion Information (only show if deleted) */}
          {product.is_deleted && (
            <Section title="Deletion Information">
              <div className="grid grid-cols-2 gap-x-4">
                <InfoRow
                  icon={Calendar}
                  label="Deleted At"
                  value={formatDateTime(product.deleted_at)}
                />
                <InfoRow
                  icon={UserCircle}
                  label="Deleted By"
                  value={product.deleted_by_id || "System"}
                />
              </div>
            </Section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

