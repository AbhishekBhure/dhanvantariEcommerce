import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { CartItem, CouponPublic } from "@dhanvantari/shared-types";
import api, { ApiError } from "@/lib/api";

interface CartState {
  items: CartItem[];
  coupon: CouponPublic | null;
  subtotal: number;
  discount: number;
  couponDiscount: number;
  shippingCharge: number;
  total: number;
  isLoading: boolean;
  isOpen: boolean; // drawer state
}

const initialState: CartState = {
  items: [],
  coupon: null,
  subtotal: 0,
  discount: 0,
  couponDiscount: 0,
  shippingCharge: 0,
  total: 0,
  isLoading: false,
  isOpen: false,
};

export type CartData = Omit<CartState, "isLoading" | "isOpen">;
type CartResponse = { data: { cart: CartData } };
const cartHeaders = (createSession = false) => {
  if (typeof window === "undefined") return undefined;
  let sessionId = window.localStorage.getItem("dhanvantari-session-id")?.trim();
  if (!sessionId && createSession) {
    sessionId = crypto.randomUUID();
    window.localStorage.setItem("dhanvantari-session-id", sessionId);
  }
  return sessionId ? { "x-session-id": sessionId } : undefined;
};
const getMessage = (error: unknown, fallback: string) => error instanceof ApiError ? error.message : fallback;

export const loadCart = createAsyncThunk("cart/loadCart", async (_, { rejectWithValue }) => {
  try { return (await api.get<CartResponse>("/cart", { headers: cartHeaders() })).data.cart; }
  catch (error) { return rejectWithValue(getMessage(error, "Could not load cart.")); }
});
export const addCartItem = createAsyncThunk("cart/addCartItem", async (input: { productId: string; variantId?: string | null; quantity: number }, { dispatch, rejectWithValue }) => {
  try { await api.post("/cart/items", input, { headers: cartHeaders(true) }); return await dispatch(loadCart()).unwrap(); }
  catch (error) { return rejectWithValue(getMessage(error, "Could not add item to cart.")); }
});
export const updateCartItem = createAsyncThunk("cart/updateCartItem", async (input: { itemId: string; quantity: number }, { dispatch, rejectWithValue }) => {
  try { await api.patch(`/cart/items/${input.itemId}`, { quantity: input.quantity }, { headers: cartHeaders() }); return await dispatch(loadCart()).unwrap(); }
  catch (error) { return rejectWithValue(getMessage(error, "Could not update cart.")); }
});
export const removeCartItem = createAsyncThunk("cart/removeCartItem", async (itemId: string, { dispatch, rejectWithValue }) => {
  try { await api.delete(`/cart/items/${itemId}`, { headers: cartHeaders() }); return await dispatch(loadCart()).unwrap(); }
  catch (error) { return rejectWithValue(getMessage(error, "Could not remove item from cart.")); }
});

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCart(state, action: PayloadAction<Partial<CartState>>) {
      return { ...state, ...action.payload };
    },
    setCartLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    openCart(state) {
      state.isOpen = true;
    },
    closeCart(state) {
      state.isOpen = false;
    },
    toggleCart(state) {
      state.isOpen = !state.isOpen;
    },
    setCoupon(state, action: PayloadAction<CouponPublic | null>) {
      state.coupon = action.payload;
    },
    clearCartState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    [loadCart, addCartItem, updateCartItem, removeCartItem].forEach((thunk) => {
      builder.addCase(thunk.pending, (state) => { state.isLoading = true; });
      builder.addCase(thunk.fulfilled, (state, action) => { state.isLoading = false; if (action.payload) Object.assign(state, action.payload); });
      builder.addCase(thunk.rejected, (state) => { state.isLoading = false; });
    });
  },
});

export const {
  setCart,
  setCartLoading,
  openCart,
  closeCart,
  toggleCart,
  setCoupon,
  clearCartState,
} = cartSlice.actions;

export default cartSlice.reducer;
