// src/types/cartItem.ts

import { Prisma } from "@prisma/client";

// This is the SIMPLE DTO that TSOA must see.
export interface CartItemDTO {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  // Use a simple, non-Prisma type for JSON fields
  variantSelection: Record<string, any> | null; 
  sku: string | null; 
  variantId: string | null;
  userName: string; 
  productName: string;
}

// -----------------------------------------------------------
// 👇 VVV Keep this type internal to this file or use a separate file VVV
// This complex type MUST NOT be used in a TSOA controller signature.
export type CartItemWithRelations = Prisma.CartItemGetPayload<{
  include: { user: true; product: true; variant: true };
}>;

// The conversion function only uses the complex type internally
export function toCartItemDTO(item: CartItemWithRelations): CartItemDTO {
  return {
    id: item.id,
    userId: item.userId,
    productId: item.productId,
    quantity: item.quantity,
    sku: item.sku,
    variantId: item.variantId,
    variantSelection: item.variantSelection as Record<string, any> | null, 
    userName: item.user.name, 
    productName: item.product.name,
  };
}
// -----------------------------------------------------------




export interface OrderItemDTO {
  id: string;
  productId: string;
  quantity: number;
  variantId?: string | null;
  sku?: string | null;
  variantSelection?: Record<string, any> | null;
  // 👇 Add this field
  product?: {
    id: string;
    name: string;
    price: number;
    files?: { id: string; path: string }[];
  } | null;
}


export interface OrderDTO {
  id: string;
  userId?:string;
  totalPrice: number;
  discount: number | null;
  finalAmount: number;
  couponCode?: string | null;
  status: string;
  fullName?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  landmark?: string | null;
  createdAt: string;
  items: OrderItemDTO[];
}
