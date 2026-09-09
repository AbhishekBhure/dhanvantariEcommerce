import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { UserPublic } from "@dhanvantari/shared-types";
import { api, ApiError } from "@/lib/api";

export type Dashboard = {
  ordersToday: number;
  ordersPending: number;
  revenueToday: number;
  totalRevenue: number;
  totalProducts: number;
  lowStockProducts: { id: string; name: string; stock: number }[];
  recentOrders: { id: string; orderNumber: string; status: string; total: number; createdAt: string; user: { name: string } | null }[];
};
export type Product = { id: string; name: string; sku: string | null; price: number; stock: number; isPublished: boolean; categories: string[] };
export type Category = { id: string; name: string; slug: string; description: string | null; isPublished: boolean; sortOrder: number; _count?: { products: number } };
export type Order = { id: string; orderNumber: string; status: string; total: number; createdAt: string; user: { name: string } | null };
export type Customer = { id: string; name: string; email: string; phone: string | null; isActive: boolean; createdAt: string; _count: { orders: number } };

type ListState<T> = { items: T[]; isLoading: boolean; error: string | null };
export type AdminState = {
  user: UserPublic | null;
  authLoading: boolean;
  dashboard: { data: Dashboard | null; isLoading: boolean; error: string | null };
  products: ListState<Product>;
  categories: ListState<Category>;
  orders: ListState<Order>;
  customers: ListState<Customer>;
  mutation: { isLoading: boolean; error: string | null };
};

const initialList = <T>(): ListState<T> => ({ items: [], isLoading: false, error: null });
const initialState: AdminState = {
  user: null,
  authLoading: true,
  dashboard: { data: null, isLoading: false, error: null },
  products: initialList<Product>(),
  categories: initialList<Category>(),
  orders: initialList<Order>(),
  customers: initialList<Customer>(),
  mutation: { isLoading: false, error: null },
};

const messageFrom = (error: unknown, fallback: string) => error instanceof ApiError ? error.message : fallback;

export const loginAdmin = createAsyncThunk("admin/login", async (credentials: { email: string; password: string }, { rejectWithValue }) => {
  try { return (await api<{ data: { user: UserPublic } }>("/auth/login", { method: "POST", body: JSON.stringify(credentials) })).data.user; }
  catch (error) { return rejectWithValue(messageFrom(error, "Unable to sign in.")); }
});
export const logoutAdmin = createAsyncThunk("admin/logout", async () => { await api("/auth/logout", { method: "POST" }); });
export const loadDashboard = createAsyncThunk("admin/loadDashboard", async (_, { rejectWithValue }) => {
  try { return (await api<{ data: Dashboard }>("/admin/dashboard")).data; }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not load dashboard.")); }
});
export const loadProducts = createAsyncThunk("admin/loadProducts", async (_, { rejectWithValue }) => {
  try { return (await api<{ data: { products: Product[] } }>("/admin/products?page=1&pageSize=50")).data.products; }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not load products.")); }
});
export const loadCategories = createAsyncThunk("admin/loadCategories", async (_, { rejectWithValue }) => {
  try { return (await api<{ data: { categories: Category[] } }>("/admin/categories")).data.categories; }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not load categories.")); }
});
export const loadOrders = createAsyncThunk("admin/loadOrders", async (_, { rejectWithValue }) => {
  try { return (await api<{ data: { orders: Order[] } }>("/admin/orders?page=1&pageSize=50")).data.orders; }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not load orders.")); }
});
export const loadCustomers = createAsyncThunk("admin/loadCustomers", async (_, { rejectWithValue }) => {
  try { return (await api<{ data: { customers: Customer[] } }>("/admin/customers?page=1&pageSize=50")).data.customers; }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not load customers.")); }
});
export const createCategory = createAsyncThunk("admin/createCategory", async (payload: { name: string; description: string | null; sortOrder: number }, { dispatch, rejectWithValue }) => {
  try { await api("/admin/categories", { method: "POST", body: JSON.stringify({ ...payload, isPublished: true }) }); await dispatch(loadCategories()).unwrap(); }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not create category.")); }
});
export const toggleCategory = createAsyncThunk("admin/toggleCategory", async (category: Category, { dispatch, rejectWithValue }) => {
  try { await api(`/admin/categories/${category.id}`, { method: "PATCH", body: JSON.stringify({ isPublished: !category.isPublished }) }); await dispatch(loadCategories()).unwrap(); }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not update category.")); }
});
export const createProduct = createAsyncThunk("admin/createProduct", async (payload: Record<string, unknown>, { dispatch, rejectWithValue }) => {
  try { await api("/admin/products", { method: "POST", body: JSON.stringify(payload) }); await dispatch(loadProducts()).unwrap(); }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not create product.")); }
});
export const updateOrderStatus = createAsyncThunk("admin/updateOrderStatus", async (payload: { orderId: string; status: string }, { dispatch, rejectWithValue }) => {
  try { await api(`/admin/orders/${payload.orderId}/status`, { method: "PATCH", body: JSON.stringify({ status: payload.status }) }); await dispatch(loadOrders()).unwrap(); }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not update order status.")); }
});
export const toggleCustomer = createAsyncThunk("admin/toggleCustomer", async (customer: Customer, { dispatch, rejectWithValue }) => {
  try { await api(`/admin/customers/${customer.id}/status`, { method: "PATCH", body: JSON.stringify({ isActive: !customer.isActive }) }); await dispatch(loadCustomers()).unwrap(); }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not update customer.")); }
});

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: { clearMutationError(state) { state.mutation.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(loginAdmin.pending, (state) => { state.authLoading = true; })
      .addCase(loginAdmin.fulfilled, (state, action: PayloadAction<UserPublic>) => { state.user = action.payload; state.authLoading = false; })
      .addCase(loginAdmin.rejected, (state) => { state.authLoading = false; })
      .addCase(logoutAdmin.fulfilled, (state) => { state.user = null; });
    const listCases = <T>(thunk: any, target: keyof AdminState) => {
      builder.addCase(thunk.pending, (state) => { (state[target] as ListState<T>).isLoading = true; (state[target] as ListState<T>).error = null; });
      builder.addCase(thunk.fulfilled, (state, action: PayloadAction<T[]>) => { (state[target] as ListState<T>).items = action.payload; (state[target] as ListState<T>).isLoading = false; });
      builder.addCase(thunk.rejected, (state, action) => { (state[target] as ListState<T>).isLoading = false; (state[target] as ListState<T>).error = action.payload as string ?? "Request failed"; });
    };
    listCases<Product>(loadProducts, "products"); listCases<Category>(loadCategories, "categories"); listCases<Order>(loadOrders, "orders"); listCases<Customer>(loadCustomers, "customers");
    builder.addCase(loadDashboard.pending, (state) => { state.dashboard.isLoading = true; state.dashboard.error = null; })
      .addCase(loadDashboard.fulfilled, (state, action) => { state.dashboard.data = action.payload; state.dashboard.isLoading = false; })
      .addCase(loadDashboard.rejected, (state, action) => { state.dashboard.isLoading = false; state.dashboard.error = action.payload as string ?? "Could not load dashboard."; });
    [createCategory, toggleCategory, createProduct, updateOrderStatus, toggleCustomer].forEach((thunk) => {
      builder.addCase(thunk.pending, (state) => { state.mutation.isLoading = true; state.mutation.error = null; });
      builder.addCase(thunk.fulfilled, (state) => { state.mutation.isLoading = false; });
      builder.addCase(thunk.rejected, (state, action) => { state.mutation.isLoading = false; state.mutation.error = action.payload as string ?? "Request failed"; });
    });
  },
});

export const { clearMutationError } = adminSlice.actions;
export default adminSlice.reducer;
