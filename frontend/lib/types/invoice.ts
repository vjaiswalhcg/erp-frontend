export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Invoice {
  id: string;
  external_ref: string | null;
  customer_id: string;
  order_id: string | null;
  invoice_date: string;
  due_date: string | null;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
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
  status?: string;
  tax_amount?: number;
  currency?: string;
  notes?: string;
  lines: {
    description: string;
    quantity: number;
    unit_price: number;
  }[];
}

export interface InvoiceUpdate {
  external_ref?: string;
  due_date?: string;
  status?: string;
  notes?: string;
}
