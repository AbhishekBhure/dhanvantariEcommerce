import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { CartItem, CouponPublic } from "@dhanvantari/shared-types";

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
