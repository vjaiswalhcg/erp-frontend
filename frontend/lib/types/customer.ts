export interface Customer {
  id: string;
  external_ref: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  billing_address: string | null;
  shipping_address: string | null;
  currency: string;
  is_active: boolean;
}

export interface CustomerCreate {
  external_ref?: string;
  name: string;
  email?: string;
  phone?: string;
  billing_address?: string;
  shipping_address?: string;
  currency?: string;
}

export type CustomerUpdate = Partial<CustomerCreate>;
