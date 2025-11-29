export interface PaymentApplication {
  id: string;
  invoice_id: string;
  amount_applied: number;
}

export interface Payment {
  id: string;
  external_ref: string | null;
  customer_id: string;
  payment_date: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  applications?: PaymentApplication[];
  customer?: {
    id: string;
    name: string;
  };
}

export interface PaymentCreate {
  external_ref?: string;
  customer_id: string;
  payment_date?: string;
  amount: number;
  currency?: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  applications?: {
    invoice_id: string;
    amount_applied: number;
  }[];
}

export interface PaymentUpdate {
  external_ref?: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
}
