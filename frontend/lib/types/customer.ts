import { AuditFieldsCreate, AuditFieldsUpdate, EntityAuditFields } from "./common";

export interface Customer extends EntityAuditFields {
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

export interface CustomerCreate extends AuditFieldsCreate {
  external_ref?: string;
  name: string;
  email?: string;
  phone?: string;
  billing_address?: string;
  shipping_address?: string;
  currency?: string;
  is_active?: boolean;
}

export interface CustomerUpdate extends AuditFieldsUpdate {
  external_ref?: string;
  name?: string;
  email?: string;
  phone?: string;
  billing_address?: string;
  shipping_address?: string;
  currency?: string;
  is_active?: boolean;
}
