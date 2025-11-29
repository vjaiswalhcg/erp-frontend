export interface InvoiceLine {
  id: string;
  description: string | null;
  product_id?: string | null;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  line_total: number;
  product?: {
    id: string;
    name: string;
  };
}

export interface Invoice {
  id: string;
  external_ref: string | null;
  customer_id: string;
  order_id: string | null;
  invoice_date: string;
  due_date: string | null;
  status: "draft" | "posted" | "paid" | "written_off";
  subtotal: number;
  tax_total: number;
  total: number;
  currency: string;
  notes: string | null;
  lines?: InvoiceLine[];
  customer?: {
    id: string;
    name: string;
  };
}

export interface InvoiceCreate {
  external_ref?: string;
  customer_id: string;
  order_id?: string;
  invoice_date?: string;
  due_date?: string;
  status?: "draft" | "posted" | "paid" | "written_off";
  tax_total?: number;
  currency?: string;
  notes?: string;
  lines: {
    description?: string;
    product_id?: string | null;
    quantity: number;
    unit_price: number;
    tax_rate?: number;
  }[];
}

export interface InvoiceUpdate {
  external_ref?: string;
  due_date?: string;
  status?: "draft" | "posted" | "paid" | "written_off";
  notes?: string;
}
