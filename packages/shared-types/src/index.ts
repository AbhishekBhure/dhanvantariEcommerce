// ============================================================
// DHANVANTARI — Shared TypeScript Types
// ============================================================

// ─── Utility Types ───────────────────────────────────────────

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T = void> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface ApiError {
  success: false;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

// ─── Enums ───────────────────────────────────────────────────

export enum UserRole {
  CUSTOMER = "CUSTOMER",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export enum OrderStatus {
  PENDING_PAYMENT = "PENDING_PAYMENT",
  CONFIRMED = "CONFIRMED",
  PROCESSING = "PROCESSING",
  PACKED = "PACKED",
  SHIPPED = "SHIPPED",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  DELIVERED = "DELIVERED",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  CANCELLED = "CANCELLED",
  RETURN_REQUESTED = "RETURN_REQUESTED",
  RETURNED = "RETURNED",
  REFUNDED = "REFUNDED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
  PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED",
}

export enum PaymentMethod {
  RAZORPAY = "RAZORPAY",
  COD = "COD",
}

export enum CouponType {
  PERCENTAGE = "PERCENTAGE",
  FIXED = "FIXED",
}

export enum ShipmentStatus {
  PENDING = "PENDING",
  CREATED = "CREATED",
  PICKED_UP = "PICKED_UP",
  IN_TRANSIT = "IN_TRANSIT",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  DELIVERED = "DELIVERED",
  FAILED_DELIVERY = "FAILED_DELIVERY",
  RETURNED = "RETURNED",
}

// ─── User / Auth Types ───────────────────────────────────────

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  phone: Nullable<string>;
  role: UserRole;
  createdAt: string;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// ─── Address Types ───────────────────────────────────────────

export interface Address {
  id: string;
  userId: string;
  name: string;
  phone: string;
  line1: string;
  line2: Nullable<string>;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressInput {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  isDefault?: boolean;
}

// ─── Category Types ──────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: Nullable<string>;
  imageUrl: Nullable<string>;
  isPublished: boolean;
  sortOrder: number;
  metaTitle: Nullable<string>;
  metaDescription: Nullable<string>;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
}

// ─── Product Types ───────────────────────────────────────────

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: Nullable<string>;
  mrp: number;
  price: number;
  stock: number;
  weight: Nullable<number>;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText: Nullable<string>;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: Nullable<string>;
  shortDescription: Nullable<string>;
  ingredients: Nullable<string>;
  usageInstructions: Nullable<string>;
  sku: Nullable<string>;
  mrp: number;
  price: number;
  stock: number;
  isPublished: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  isNew: boolean;
  metaTitle: Nullable<string>;
  metaDescription: Nullable<string>;
  categories: Category[];
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  shortDescription: Nullable<string>;
  mrp: number;
  price: number;
  stock: number;
  isPublished: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  isNew: boolean;
  primaryImage: Nullable<string>;
  categories: Pick<Category, "id" | "name" | "slug">[];
}

export interface ProductFilters {
  categorySlug?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
  sortBy?: "price_asc" | "price_desc" | "newest" | "name_asc";
  page?: number;
  pageSize?: number;
}

// ─── Cart Types ──────────────────────────────────────────────

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId: Nullable<string>;
  quantity: number;
  product: Pick<Product, "id" | "name" | "slug" | "price" | "mrp" | "stock" | "isPublished" | "images">;
  variant: Nullable<ProductVariant>;
}

export interface Cart {
  id: string;
  userId: Nullable<string>;
  sessionId: Nullable<string>;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shippingCharge: number;
  total: number;
  coupon: Nullable<CouponPublic>;
  createdAt: string;
  updatedAt: string;
}

// ─── Coupon Types ────────────────────────────────────────────

export interface CouponPublic {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minimumOrder: Nullable<number>;
  maximumDiscount: Nullable<number>;
  description: Nullable<string>;
}

export interface Coupon extends CouponPublic {
  isActive: boolean;
  validFrom: string;
  validUntil: Nullable<string>;
  usageLimit: Nullable<number>;
  usageCount: number;
  perUserLimit: Nullable<number>;
  productRestrictions: string[];
  categoryRestrictions: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Order Types ─────────────────────────────────────────────

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId: Nullable<string>;
  productName: string;
  variantName: Nullable<string>;
  productImageUrl: Nullable<string>;
  sku: Nullable<string>;
  mrp: number;
  price: number;
  quantity: number;
  total: number;
}

export interface OrderSnapshot {
  addressName: string;
  addressPhone: string;
  addressLine1: string;
  addressLine2: Nullable<string>;
  addressCity: string;
  addressState: string;
  addressPincode: string;
  addressCountry: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discount: number;
  shippingCharge: number;
  total: number;
  couponCode: Nullable<string>;
  couponDiscount: number;
  notes: Nullable<string>;
  addressSnapshot: OrderSnapshot;
  items: OrderItem[];
  shipment: Nullable<Shipment>;
  payment: Nullable<Payment>;
  createdAt: string;
  updatedAt: string;
}

// ─── Payment Types ───────────────────────────────────────────

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  gatewayOrderId: Nullable<string>;
  gatewayPaymentId: Nullable<string>;
  gatewaySignature: Nullable<string>;
  failureReason: Nullable<string>;
  createdAt: string;
  updatedAt: string;
}

// ─── Shipment Types ──────────────────────────────────────────

export interface Shipment {
  id: string;
  orderId: string;
  status: ShipmentStatus;
  carrier: Nullable<string>;
  trackingNumber: Nullable<string>;
  trackingUrl: Nullable<string>;
  awbNumber: Nullable<string>;
  estimatedDelivery: Nullable<string>;
  dispatchedAt: Nullable<string>;
  deliveredAt: Nullable<string>;
  createdAt: string;
  updatedAt: string;
}

// ─── Banner / Content Types ──────────────────────────────────

export interface Banner {
  id: string;
  title: string;
  subtitle: Nullable<string>;
  imageUrl: string;
  mobileImageUrl: Nullable<string>;
  linkUrl: Nullable<string>;
  linkText: Nullable<string>;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Checkout Types ──────────────────────────────────────────

export interface CheckoutSummary {
  items: CartItem[];
  subtotal: number;
  discount: number;
  couponDiscount: number;
  shippingCharge: number;
  total: number;
  coupon: Nullable<CouponPublic>;
  address: Address;
  paymentMethod: PaymentMethod;
}

export interface CreateOrderRequest {
  addressId: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  notes?: string;
}

export interface RazorpayOrderResponse {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}
