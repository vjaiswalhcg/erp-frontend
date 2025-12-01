import { AuditFieldsCreate, AuditFieldsUpdate, EntityAuditFields, LineItemAuditFields } from "./common";

export interface PaymentApplication extends LineItemAuditFields {
  id: string;
  payment_id: string;
  invoice_id: string;
  amount_applied: number;
}

export interface Payment extends EntityAuditFields {
  id: string;
  external_ref: string | null;
  customer_id: string;
  invoice_id?: string | null;
  received_date: string;
  amount: number;
  currency: string;
  method: string | null;
  note: string | null;
  status: "received" | "applied" | "failed";
  applications?: PaymentApplication[];
  customer?: {
    id: string;
    name: string;
  };
}

export interface PaymentCreate extends AuditFieldsCreate {
  external_ref?: string;
  customer_id: string;
  invoice_id?: string;
  received_date?: string;
  amount: number;
  currency?: string;
  method?: string;
  note?: string;
}

export interface PaymentUpdate extends AuditFieldsUpdate {
  external_ref?: string;
  customer_id?: string;
  invoice_id?: string | null;
  received_date?: string;
  amount?: number;
  currency?: string;
  method?: string;
  note?: string;
  status?: "received" | "applied" | "failed";
}

export interface PaymentApplicationCreate {
  invoice_id: string;
  amount_applied: number;
}
