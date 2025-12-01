import { AuditFieldsCreate, AuditFieldsUpdate, EntityAuditFields, LineItemAuditFields } from "./common";

export interface OrderLine extends LineItemAuditFields {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  line_total: number;
  product?: {
    id: string;
    name: string;
    sku?: string;
  };
}

export interface Order extends EntityAuditFields {
  id: string;
  external_ref: string | null;
  customer_id: string;
  order_date: string;
  status: "draft" | "confirmed" | "fulfilled" | "closed";
  subtotal: number;
  tax_total: number;
  total: number;
  currency: string;
  notes: string | null;
  lines: OrderLine[];
  customer?: {
    id: string;
    name: string;
  };
}

export interface OrderLineCreate {
  product_id: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
}

export interface OrderCreate extends AuditFieldsCreate {
  external_ref?: string;
  customer_id: string;
  order_date?: string;
  status?: "draft" | "confirmed" | "fulfilled" | "closed";
  currency?: string;
  notes?: string;
  lines: OrderLineCreate[];
}

export interface OrderUpdate extends AuditFieldsUpdate {
  external_ref?: string;
  customer_id?: string;
  order_date?: string;
  status?: "draft" | "confirmed" | "fulfilled" | "closed";
  currency?: string;
  notes?: string;
  lines?: OrderLineCreate[];
}
