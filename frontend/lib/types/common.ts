/**
 * Common types for enterprise audit fields.
 * These fields are present on all major entities.
 */

/**
 * Standard audit fields returned from the API.
 * These track who created/modified records and when.
 */
export interface AuditFields {
  created_at: string;
  updated_at: string;
  created_by_id: string | null;
  last_modified_by_id: string | null;
  owner_id: string | null;
  // User objects for display
  created_by?: UserInfo | null;
  last_modified_by?: UserInfo | null;
  owner?: UserInfo | null;
}

/**
 * Soft delete fields returned from the API.
 * These support data retention and recovery.
 */
export interface SoftDeleteFields {
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_id: string | null;
  deleted_by?: UserInfo | null;
}

/**
 * Combined audit and soft delete fields for entities.
 */
export type EntityAuditFields = AuditFields & SoftDeleteFields;

/**
 * Optional audit fields for create operations.
 * Only owner_id can be optionally set on create.
 */
export interface AuditFieldsCreate {
  owner_id?: string;
}

/**
 * Optional audit fields for update operations.
 * Only owner_id can be changed (to transfer ownership).
 */
export interface AuditFieldsUpdate {
  owner_id?: string;
}

/**
 * Line item audit fields (lightweight - only created_at).
 */
export interface LineItemAuditFields {
  created_at?: string;
}

/**
 * User information for display in audit fields.
 */
export interface UserInfo {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name?: string; // Computed: "First Last" or email
}

