// Types for the merchant product catalogue — ZeePay as back store.
// Merchants create products here (dashboard or API); their storefront
// pulls the catalogue via GET /api/v1/products and sells each item via
// POST /api/v1/payments with productId.

export interface ProductInput {
  externalReference?: string; // merchant's own SKU/product id (idempotent key)
  name: string;
  description?: string;
  price: number;
  currency: string;
  images?: string[];
  category?: string;
  stockQuantity?: number | null; // null/undefined = unlimited (digital goods, services)
  metadata?: Record<string, any>;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  images?: string[];
  category?: string;
  stockQuantity?: number | null;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface ProductResponse {
  id: string;
  sku?: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  images: string[];
  category?: string;
  stockQuantity?: number | null;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
