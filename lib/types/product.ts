export interface Product {
  id: string;
  external_ref: string | null;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  is_active: boolean;
}

export interface ProductCreate {
  external_ref?: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
}

export type ProductUpdate = Partial<ProductCreate>;
