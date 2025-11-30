# Salesforce to ERP Integration Guide

## Overview

This document provides technical guidance for the Salesforce team to integrate with the ERP system. This covers the **Salesforce-to-ERP** direction where Salesforce initiates API calls to the ERP backend.

### Integration Architecture

```
┌──────────────────┐         HTTPS/REST          ┌──────────────────┐
│    Salesforce    │ ──────────────────────────▶ │   ERP Backend    │
│                  │                              │   (FastAPI)      │
│  - Apex Classes  │ ◀────────────────────────── │                  │
│  - Flows         │         JSON Response        │                  │
│  - Triggers      │                              │                  │
└──────────────────┘                              └──────────────────┘
```

### Base Configuration

| Setting | Value |
|---------|-------|
| **Base URL** | `https://erp-backend-fb7fdd6n4a-uc.a.run.app` |
| **API Version** | `/api/v1` |
| **Content-Type** | `application/json` |
| **Authentication** | JWT Bearer Token |

---

## Authentication

The ERP system uses JWT (JSON Web Token) authentication with access and refresh tokens.

### Step 1: Obtain Access Token

**Endpoint:** `POST /api/v1/auth/login`

**Request:**
```http
POST /api/v1/auth/login HTTP/1.1
Host: erp-backend-fb7fdd6n4a-uc.a.run.app
Content-Type: application/json

{
  "email": "integration@yourcompany.com",
  "password": "your-secure-password"
}
```

**Success Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "integration@yourcompany.com",
    "role": "staff",
    "is_active": true
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "detail": "Incorrect email or password"
}
```

### Step 2: Use Access Token for API Calls

Include the access token in the `Authorization` header for all subsequent API calls:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Refresh Token (When Access Token Expires)

Access tokens expire after **60 minutes**. Use the refresh token to obtain a new access token without re-authenticating.

**Endpoint:** `POST /api/v1/auth/refresh`

**Request:**
```http
POST /api/v1/auth/refresh HTTP/1.1
Host: erp-backend-fb7fdd6n4a-uc.a.run.app
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...(new)",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...(new)",
  "token_type": "bearer",
  "user": { ... }
}
```

> **Note:** Refresh tokens expire after **7 days**. After that, a full re-authentication is required.

### Token Lifecycle Summary

| Token | Expiration | Usage |
|-------|------------|-------|
| Access Token | 60 minutes | Include in `Authorization` header for API calls |
| Refresh Token | 7 days | Use to obtain new access token without password |

---

## Customer API

### Create Customer

Creates a new customer in the ERP system.

**Endpoint:** `POST /api/v1/customers/`

**Request:**
```http
POST /api/v1/customers/ HTTP/1.1
Host: erp-backend-fb7fdd6n4a-uc.a.run.app
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "name": "Acme Corporation",
  "email": "contact@acme.com",
  "phone": "+1-555-123-4567",
  "billing_address": "123 Main St, San Francisco, CA 94102",
  "shipping_address": "456 Warehouse Blvd, Oakland, CA 94607",
  "currency": "USD",
  "external_ref": "0015g00000ABC123",
  "is_active": true
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | **Yes** | Customer name |
| `email` | string | No | Email address (must be valid format) |
| `phone` | string | No | Phone number |
| `billing_address` | string | No | Billing address |
| `shipping_address` | string | No | Shipping address |
| `currency` | string | No | 3-letter currency code (default: "USD") |
| `external_ref` | string | No | **Salesforce Account ID** - Use this to link records |
| `is_active` | boolean | No | Active status (default: true) |

**Success Response (200 OK):**
```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "name": "Acme Corporation",
  "email": "contact@acme.com",
  "phone": "+1-555-123-4567",
  "billing_address": "123 Main St, San Francisco, CA 94102",
  "shipping_address": "456 Warehouse Blvd, Oakland, CA 94607",
  "currency": "USD",
  "external_ref": "0015g00000ABC123",
  "is_active": true
}
```

### Update Customer

Updates an existing customer by ERP ID.

**Endpoint:** `PUT /api/v1/customers/{customer_id}`

**Request:**
```http
PUT /api/v1/customers/7c9e6679-7425-40de-944b-e07fc1f90ae7 HTTP/1.1
Host: erp-backend-fb7fdd6n4a-uc.a.run.app
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "name": "Acme Corporation (Updated)",
  "email": "newcontact@acme.com",
  "phone": "+1-555-987-6543",
  "billing_address": "789 New Address, San Francisco, CA 94103",
  "shipping_address": "456 Warehouse Blvd, Oakland, CA 94607",
  "currency": "USD",
  "external_ref": "0015g00000ABC123",
  "is_active": true
}
```

**Success Response (200 OK):**
```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "name": "Acme Corporation (Updated)",
  "email": "newcontact@acme.com",
  "phone": "+1-555-987-6543",
  "billing_address": "789 New Address, San Francisco, CA 94103",
  "shipping_address": "456 Warehouse Blvd, Oakland, CA 94607",
  "currency": "USD",
  "external_ref": "0015g00000ABC123",
  "is_active": true
}
```

**Error Response (404 Not Found):**
```json
{
  "detail": "Customer not found"
}
```

### Get Customer

Retrieves a single customer by ERP ID.

**Endpoint:** `GET /api/v1/customers/{customer_id}`

**Request:**
```http
GET /api/v1/customers/7c9e6679-7425-40de-944b-e07fc1f90ae7 HTTP/1.1
Host: erp-backend-fb7fdd6n4a-uc.a.run.app
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "name": "Acme Corporation",
  "email": "contact@acme.com",
  "phone": "+1-555-123-4567",
  "billing_address": "123 Main St, San Francisco, CA 94102",
  "shipping_address": "456 Warehouse Blvd, Oakland, CA 94607",
  "currency": "USD",
  "external_ref": "0015g00000ABC123",
  "is_active": true
}
```

### List Customers

Retrieves a list of customers with pagination.

**Endpoint:** `GET /api/v1/customers/`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 50 | Number of records to return (max: 200) |
| `offset` | integer | 0 | Number of records to skip |

**Request:**
```http
GET /api/v1/customers/?limit=10&offset=0 HTTP/1.1
Host: erp-backend-fb7fdd6n4a-uc.a.run.app
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
[
  {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "name": "Acme Corporation",
    "email": "contact@acme.com",
    "phone": "+1-555-123-4567",
    "billing_address": "123 Main St, San Francisco, CA 94102",
    "shipping_address": "456 Warehouse Blvd, Oakland, CA 94607",
    "currency": "USD",
    "external_ref": "0015g00000ABC123",
    "is_active": true
  },
  {
    "id": "8d0f7780-8536-51ef-a55c-f18fd2g01bf8",
    "name": "Beta Industries",
    "email": "info@beta.com",
    "phone": "+1-555-222-3333",
    "billing_address": "100 Industrial Way, Austin, TX 78701",
    "shipping_address": null,
    "currency": "USD",
    "external_ref": "0015g00000DEF456",
    "is_active": true
  }
]
```

---

## Order API

### Order Status Workflow

Orders follow this status progression:

```
┌─────────┐     ┌───────────┐     ┌───────────┐     ┌────────┐
│  draft  │ ──▶ │ confirmed │ ──▶ │ fulfilled │ ──▶ │ closed │
└─────────┘     └───────────┘     └───────────┘     └────────┘
```

| Status | Description |
|--------|-------------|
| `draft` | Initial state, order can be modified |
| `confirmed` | Order is confirmed, ready for fulfillment |
| `fulfilled` | Order has been shipped/delivered |
| `closed` | Order is complete (final state) |

### Create Order

Creates a new order with line items.

**Endpoint:** `POST /api/v1/orders/`

**Request:**
```http
POST /api/v1/orders/ HTTP/1.1
Host: erp-backend-fb7fdd6n4a-uc.a.run.app
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "customer_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "external_ref": "8005g00000XYZ789",
  "order_date": "2024-11-30",
  "status": "draft",
  "currency": "USD",
  "notes": "Priority shipping requested",
  "lines": [
    {
      "product_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "quantity": 10,
      "unit_price": 99.99,
      "tax_rate": 0.08
    },
    {
      "product_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "quantity": 5,
      "unit_price": 149.99,
      "tax_rate": 0.08
    }
  ]
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customer_id` | UUID | **Yes** | ERP Customer ID |
| `external_ref` | string | No | **Salesforce Order ID** - Use this to link records |
| `order_date` | string | No | Order date (ISO 8601 format, defaults to today) |
| `status` | string | No | Order status (default: "draft") |
| `currency` | string | No | 3-letter currency code (default: "USD") |
| `notes` | string | No | Order notes |
| `lines` | array | **Yes** | Array of line items (at least one required) |

**Line Item Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `product_id` | UUID | **Yes** | ERP Product ID |
| `quantity` | number | **Yes** | Quantity (must be > 0) |
| `unit_price` | number | **Yes** | Unit price (must be >= 0) |
| `tax_rate` | number | No | Tax rate as decimal (e.g., 0.08 for 8%) |

**Success Response (200 OK):**
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "external_ref": "8005g00000XYZ789",
  "customer_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "order_date": "2024-11-30T00:00:00",
  "status": "draft",
  "currency": "USD",
  "notes": "Priority shipping requested",
  "subtotal": 1749.85,
  "tax_total": 139.99,
  "total": 1889.84,
  "lines": [
    {
      "id": "11111111-1111-1111-1111-111111111111",
      "product_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "quantity": 10,
      "unit_price": 99.99,
      "tax_rate": 0.08,
      "line_total": 1079.89,
      "product": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "name": "Widget Pro",
        "sku": "WGT-PRO-001",
        "price": 99.99
      }
    },
    {
      "id": "22222222-2222-2222-2222-222222222222",
      "product_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "quantity": 5,
      "unit_price": 149.99,
      "tax_rate": 0.08,
      "line_total": 809.95,
      "product": {
        "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "name": "Gadget Elite",
        "sku": "GDG-ELT-002",
        "price": 149.99
      }
    }
  ],
  "customer": {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "name": "Acme Corporation",
    "email": "contact@acme.com"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "detail": "Invalid customer"
}
```

```json
{
  "detail": "Invalid product a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### Update Order

Updates an existing order. Can modify order details and line items.

**Endpoint:** `PUT /api/v1/orders/{order_id}`

**Request:**
```http
PUT /api/v1/orders/f47ac10b-58cc-4372-a567-0e02b2c3d479 HTTP/1.1
Host: erp-backend-fb7fdd6n4a-uc.a.run.app
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "customer_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "external_ref": "8005g00000XYZ789",
  "order_date": "2024-11-30",
  "status": "draft",
  "currency": "USD",
  "notes": "Updated: Express shipping",
  "lines": [
    {
      "product_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "quantity": 15,
      "unit_price": 99.99,
      "tax_rate": 0.08
    }
  ]
}
```

> **Note:** When updating lines, you must provide the complete list. Existing lines are replaced.

### Get Order

Retrieves a single order with all details.

**Endpoint:** `GET /api/v1/orders/{order_id}`

**Request:**
```http
GET /api/v1/orders/f47ac10b-58cc-4372-a567-0e02b2c3d479 HTTP/1.1
Host: erp-backend-fb7fdd6n4a-uc.a.run.app
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "external_ref": "8005g00000XYZ789",
  "customer_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "order_date": "2024-11-30T00:00:00",
  "status": "confirmed",
  "currency": "USD",
  "notes": "Priority shipping requested",
  "subtotal": 1749.85,
  "tax_total": 139.99,
  "total": 1889.84,
  "lines": [...],
  "customer": {...}
}
```

### Confirm Order

Transitions an order from `draft` to `confirmed` status.

**Endpoint:** `POST /api/v1/orders/{order_id}/confirm`

**Request:**
```http
POST /api/v1/orders/f47ac10b-58cc-4372-a567-0e02b2c3d479/confirm HTTP/1.1
Host: erp-backend-fb7fdd6n4a-uc.a.run.app
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "status": "confirmed",
  ...
}
```

**Error Response (400 Bad Request):**
```json
{
  "detail": "Order already closed"
}
```

### Fulfill Order

Transitions an order from `confirmed` to `fulfilled` status.

**Endpoint:** `POST /api/v1/orders/{order_id}/fulfill`

**Request:**
```http
POST /api/v1/orders/f47ac10b-58cc-4372-a567-0e02b2c3d479/fulfill HTTP/1.1
Host: erp-backend-fb7fdd6n4a-uc.a.run.app
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "status": "fulfilled",
  ...
}
```

### List Orders

Retrieves a list of orders with pagination.

**Endpoint:** `GET /api/v1/orders/`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 50 | Number of records to return (max: 200) |
| `offset` | integer | 0 | Number of records to skip |

**Request:**
```http
GET /api/v1/orders/?limit=20&offset=0 HTTP/1.1
Host: erp-backend-fb7fdd6n4a-uc.a.run.app
Authorization: Bearer <access_token>
```

### Delete Order

Deletes an order (use with caution).

**Endpoint:** `DELETE /api/v1/orders/{order_id}`

**Request:**
```http
DELETE /api/v1/orders/f47ac10b-58cc-4372-a567-0e02b2c3d479 HTTP/1.1
Host: erp-backend-fb7fdd6n4a-uc.a.run.app
Authorization: Bearer <access_token>
```

**Success Response:** `204 No Content`

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `200` | OK | Request successful |
| `204` | No Content | Delete successful |
| `400` | Bad Request | Invalid request data |
| `401` | Unauthorized | Missing or invalid token |
| `403` | Forbidden | User inactive or lacks permission |
| `404` | Not Found | Resource not found |
| `422` | Validation Error | Request body validation failed |

### Error Response Format

All errors return a JSON object with a `detail` field:

```json
{
  "detail": "Error message here"
}
```

### Validation Errors (422)

Validation errors include field-level details:

```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

### Common Error Scenarios

| Scenario | Status | Response |
|----------|--------|----------|
| Invalid credentials | 401 | `{"detail": "Incorrect email or password"}` |
| Expired token | 401 | `{"detail": "Token has expired"}` |
| Invalid token | 401 | `{"detail": "Could not validate credentials"}` |
| User inactive | 403 | `{"detail": "Inactive user"}` |
| Customer not found | 404 | `{"detail": "Customer not found"}` |
| Order not found | 404 | `{"detail": "Order not found"}` |
| Invalid customer ID | 400 | `{"detail": "Invalid customer"}` |
| Invalid product ID | 400 | `{"detail": "Invalid product <id>"}` |

---

## Salesforce Implementation Guide

### Recommended Approach

1. **Create a Named Credential** in Salesforce Setup for the ERP API
2. **Create a Custom Setting or Custom Metadata** to store the integration user credentials
3. **Implement an Apex Token Manager** class to handle authentication and token refresh
4. **Create Apex REST Callout classes** for each operation

### External Reference Field Mapping

Use the `external_ref` field to store Salesforce Record IDs:

| Salesforce Object | ERP Entity | external_ref Value |
|-------------------|------------|-------------------|
| Account | Customer | Account.Id (e.g., `0015g00000ABC123`) |
| Order | Order | Order.Id (e.g., `8015g00000XYZ789`) |

This enables:
- Lookup by Salesforce ID
- Duplicate prevention
- Bi-directional sync tracking

### Sample Apex Code

#### Token Manager Class

```apex
public class ERPTokenManager {
    private static final String TOKEN_CACHE_KEY = 'ERP_ACCESS_TOKEN';
    private static final String REFRESH_CACHE_KEY = 'ERP_REFRESH_TOKEN';
    
    public static String getAccessToken() {
        // Check cache first
        String cachedToken = (String)Cache.Org.get(TOKEN_CACHE_KEY);
        if (cachedToken != null) {
            return cachedToken;
        }
        
        // Get new token
        return refreshOrLogin();
    }
    
    private static String refreshOrLogin() {
        String refreshToken = (String)Cache.Org.get(REFRESH_CACHE_KEY);
        
        if (refreshToken != null) {
            // Try refresh
            try {
                return doRefresh(refreshToken);
            } catch (Exception e) {
                // Refresh failed, do full login
            }
        }
        
        return doLogin();
    }
    
    private static String doLogin() {
        ERP_Settings__c settings = ERP_Settings__c.getOrgDefaults();
        
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:ERP_API/api/v1/auth/login');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(JSON.serialize(new Map<String, String>{
            'email' => settings.Username__c,
            'password' => settings.Password__c
        }));
        
        Http http = new Http();
        HttpResponse res = http.send(req);
        
        if (res.getStatusCode() == 200) {
            Map<String, Object> response = (Map<String, Object>)JSON.deserializeUntyped(res.getBody());
            String accessToken = (String)response.get('access_token');
            String newRefreshToken = (String)response.get('refresh_token');
            
            // Cache tokens (access: 55 min, refresh: 6 days)
            Cache.Org.put(TOKEN_CACHE_KEY, accessToken, 3300);
            Cache.Org.put(REFRESH_CACHE_KEY, newRefreshToken, 518400);
            
            return accessToken;
        }
        
        throw new ERPException('Login failed: ' + res.getBody());
    }
    
    public class ERPException extends Exception {}
}
```

#### Customer Sync Class

```apex
public class ERPCustomerService {
    
    public static String createCustomer(Account acc) {
        String token = ERPTokenManager.getAccessToken();
        
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:ERP_API/api/v1/customers/');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('Authorization', 'Bearer ' + token);
        
        Map<String, Object> payload = new Map<String, Object>{
            'name' => acc.Name,
            'email' => acc.Email__c,
            'phone' => acc.Phone,
            'billing_address' => formatAddress(acc.BillingStreet, acc.BillingCity, acc.BillingState, acc.BillingPostalCode),
            'shipping_address' => formatAddress(acc.ShippingStreet, acc.ShippingCity, acc.ShippingState, acc.ShippingPostalCode),
            'external_ref' => acc.Id,
            'currency' => acc.CurrencyIsoCode,
            'is_active' => true
        };
        
        req.setBody(JSON.serialize(payload));
        
        Http http = new Http();
        HttpResponse res = http.send(req);
        
        if (res.getStatusCode() == 200) {
            Map<String, Object> response = (Map<String, Object>)JSON.deserializeUntyped(res.getBody());
            return (String)response.get('id'); // Return ERP Customer ID
        }
        
        throw new ERPTokenManager.ERPException('Create customer failed: ' + res.getBody());
    }
    
    private static String formatAddress(String street, String city, String state, String postal) {
        List<String> parts = new List<String>();
        if (String.isNotBlank(street)) parts.add(street);
        if (String.isNotBlank(city)) parts.add(city);
        if (String.isNotBlank(state)) parts.add(state);
        if (String.isNotBlank(postal)) parts.add(postal);
        return String.join(parts, ', ');
    }
}
```

### Best Practices

1. **Store ERP IDs in Salesforce**
   - Add a custom field `ERP_Customer_Id__c` on Account
   - Add a custom field `ERP_Order_Id__c` on Order
   - Populate these after successful create operations

2. **Use `external_ref` for Lookups**
   - Always populate `external_ref` with Salesforce Record ID
   - This enables the ERP team to query by Salesforce ID if needed

3. **Handle Token Expiration**
   - Cache tokens appropriately
   - Implement automatic refresh
   - Fall back to full login if refresh fails

4. **Implement Retry Logic**
   - Retry on 5xx errors with exponential backoff
   - Do not retry on 4xx errors (client errors)

5. **Error Handling**
   - Log all API responses for debugging
   - Surface meaningful error messages to users
   - Consider using Platform Events for async error handling

6. **Bulk Operations**
   - The ERP API processes one record at a time
   - For bulk syncs, implement Queueable Apex with batching
   - Respect Salesforce callout limits (100 callouts per transaction)

---

## API Reference Summary

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Get access and refresh tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Get current user info |

### Customer Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/customers/` | List customers |
| POST | `/api/v1/customers/` | Create customer |
| GET | `/api/v1/customers/{id}` | Get customer |
| PUT | `/api/v1/customers/{id}` | Update customer |

### Order Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/orders/` | List orders |
| POST | `/api/v1/orders/` | Create order |
| GET | `/api/v1/orders/{id}` | Get order |
| PUT | `/api/v1/orders/{id}` | Update order |
| DELETE | `/api/v1/orders/{id}` | Delete order |
| POST | `/api/v1/orders/{id}/confirm` | Confirm order |
| POST | `/api/v1/orders/{id}/fulfill` | Fulfill order |

---

## Support

For API issues or questions:
- **API Documentation**: https://erp-backend-fb7fdd6n4a-uc.a.run.app/docs
- **OpenAPI Spec**: https://erp-backend-fb7fdd6n4a-uc.a.run.app/openapi.json

---

*Last Updated: November 30, 2024*

