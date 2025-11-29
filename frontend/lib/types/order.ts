export interface OrderLine {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Order {
  id: string;
  external_ref: string | null;
  customer_id: string;
  order_date: string;
  status: string;
  total_amount: number;
  currency: string;
  notes: string | null;
  lines?: OrderLine[];
  customer?: {
    id: string;
    name: string;
  };
}

export interface OrderCreate {
  external_ref?: string;
  customer_id: string;
  order_date?: string;
  status?: string;
  currency?: string;
  notes?: string;
  lines: {
    product_id: string;
    quantity: number;
    unit_price: number;
  }[];
}

export interface OrderUpdate {
  external_ref?: string;
  status?: string;
  notes?: string;
}
