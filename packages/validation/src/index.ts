import { z } from "zod";

// ─── Auth Schemas ─────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ─── User / Profile Schemas ───────────────────────────────────

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")
    .optional()
    .nullable(),
});

// ─── Address Schemas ──────────────────────────────────────────

export const addressSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  line1: z.string().min(5, "Address line 1 is required").max(255),
  line2: z.string().max(255).optional().nullable(),
  city: z.string().min(2, "City is required").max(100),
  state: z.string().min(2, "State is required").max(100),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  country: z.string().default("India"),
  isDefault: z.boolean().default(false),
});

// ─── Category Schemas ─────────────────────────────────────────

export const categorySchema = z.object({
  name: z.string().min(2, "Category name is required").max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  description: z.string().max(2000).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  isPublished: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  metaTitle: z.string().max(255).optional().nullable(),
  metaDescription: z.string().max(500).optional().nullable(),
});

// ─── Product Schemas ──────────────────────────────────────────

export const productVariantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Variant name is required").max(100),
  sku: z.string().max(100).optional().nullable(),
  mrp: z.number().positive("MRP must be positive"),
  price: z.number().positive("Price must be positive"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  weight: z.number().positive().optional().nullable(),
  isAvailable: z.boolean().default(true),
});

export const productSchema = z.object({
  name: z.string().min(2, "Product name is required").max(255),
  slug: z
    .string()
    .min(2)
    .max(255)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  description: z.string().max(10000).optional().nullable(),
  shortDescription: z.string().max(500).optional().nullable(),
  ingredients: z.string().max(5000).optional().nullable(),
  usageInstructions: z.string().max(5000).optional().nullable(),
  sku: z.string().max(100).optional().nullable(),
  mrp: z.number().positive("MRP must be positive"),
  price: z.number().positive("Price must be positive"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isNew: z.boolean().default(false),
  categoryIds: z.array(z.string().uuid()).min(1, "Select at least one category"),
  variants: z.array(productVariantSchema).default([]),
  metaTitle: z.string().max(255).optional().nullable(),
  metaDescription: z.string().max(500).optional().nullable(),
});

// ─── Cart Schemas ─────────────────────────────────────────────

export const addToCartSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  variantId: z.string().uuid("Invalid variant ID").optional().nullable(),
  quantity: z
    .number()
    .int()
    .min(1, "Quantity must be at least 1")
    .max(10, "Maximum 10 items per product"),
});

export const updateCartItemSchema = z.object({
  quantity: z
    .number()
    .int()
    .min(1, "Quantity must be at least 1")
    .max(10, "Maximum 10 items per product"),
});

export const applyCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required").max(50).toUpperCase(),
});

// ─── Checkout / Order Schemas ─────────────────────────────────

export const createOrderSchema = z.object({
  addressId: z.string().uuid("Invalid address"),
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
  couponCode: z.string().max(50).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const verifyPaymentSchema = z.object({
  orderId: z.string().uuid(),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

// ─── Coupon Schemas ───────────────────────────────────────────

export const couponSchema = z.object({
  code: z
    .string()
    .min(3, "Coupon code must be at least 3 characters")
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, "Code must be uppercase alphanumeric")
    .toUpperCase(),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().positive("Value must be positive"),
  minimumOrder: z.number().min(0).optional().nullable(),
  maximumDiscount: z.number().positive().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().default(true),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  perUserLimit: z.number().int().positive().optional().nullable(),
  productRestrictions: z.array(z.string().uuid()).default([]),
  categoryRestrictions: z.array(z.string().uuid()).default([]),
});

// ─── Admin: Inventory Adjustment ─────────────────────────────

export const inventoryAdjustmentSchema = z.object({
  quantity: z.number().int(),
  reason: z.string().min(1, "Reason is required").max(500),
});

// ─── Admin: Order Status Update ──────────────────────────────

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "CONFIRMED",
    "PROCESSING",
    "PACKED",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "RETURN_REQUESTED",
    "RETURNED",
    "REFUNDED",
  ]),
  notes: z.string().max(500).optional(),
});

export const addShipmentSchema = z.object({
  carrier: z.string().min(1).max(100),
  trackingNumber: z.string().min(1).max(200),
  trackingUrl: z.string().url().optional().nullable(),
  awbNumber: z.string().max(100).optional().nullable(),
  estimatedDelivery: z.string().datetime().optional().nullable(),
});

// ─── Banner Schema ────────────────────────────────────────────

export const bannerSchema = z.object({
  title: z.string().min(1).max(255),
  subtitle: z.string().max(500).optional().nullable(),
  imageUrl: z.string().url("Invalid image URL"),
  mobileImageUrl: z.string().url().optional().nullable(),
  linkUrl: z.string().url().optional().nullable(),
  linkText: z.string().max(100).optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

// ─── Query / Filter Schemas ───────────────────────────────────

export const productFilterSchema = z.object({
  categorySlug: z.string().optional(),
  search: z.string().max(200).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isBestseller: z.coerce.boolean().optional(),
  isNew: z.coerce.boolean().optional(),
  sortBy: z
    .enum(["price_asc", "price_desc", "newest", "name_asc"])
    .default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
});

// ─── Export inferred types ────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
export type InventoryAdjustmentInput = z.infer<typeof inventoryAdjustmentSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type AddShipmentInput = z.infer<typeof addShipmentSchema>;
export type BannerInput = z.infer<typeof bannerSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
