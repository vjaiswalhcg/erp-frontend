import { AuditFieldsCreate, AuditFieldsUpdate, EntityAuditFields } from "./common";

export interface Product extends EntityAuditFields {
  id: string;
  external_ref: string | null;
  sku: string;
  name: string;
  description: string | null;
  uom: string | null;
  price: number;
  currency: string;
  tax_code: string | null;
  is_active: boolean;
}

export interface ProductCreate extends AuditFieldsCreate {
  external_ref?: string;
  sku: string;
  name: string;
  description?: string;
  uom?: string;
  price: number;
  currency?: string;
  tax_code?: string;
  is_active?: boolean;
}

export interface ProductUpdate extends AuditFieldsUpdate {
  external_ref?: string;
  sku?: string;
  name?: string;
  description?: string;
  uom?: string;
  price?: number;
  currency?: string;
  tax_code?: string;
  is_active?: boolean;
}
