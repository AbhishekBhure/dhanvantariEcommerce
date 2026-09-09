import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@dhanvantari/shared-types";
import api, { ApiError } from "@/lib/api";

export type OrderSummary = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  total: number;
  createdAt: string;
  items: { productName: string; quantity: number; productImageUrl: string | null }[];
};

type OrdersState = { items: OrderSummary[]; isLoading: boolean; error: string | null };
const initialState: OrdersState = { items: [], isLoading: false, error: null };
const messageFrom = (error: unknown) => error instanceof ApiError ? error.message : "Could not load your orders.";

export const loadMyOrders = createAsyncThunk("orders/loadMyOrders", async (_, { rejectWithValue }) => {
  try { return (await api.get<{ data: { orders: OrderSummary[] } }>("/orders")).data.orders; }
  catch (error) { return rejectWithValue(messageFrom(error)); }
});

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(loadMyOrders.pending, (state) => { state.isLoading = true; state.error = null; });
    builder.addCase(loadMyOrders.fulfilled, (state, action) => { state.items = action.payload; state.isLoading = false; });
    builder.addCase(loadMyOrders.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string ?? "Could not load your orders."; });
  },
});

export default orderSlice.reducer;
