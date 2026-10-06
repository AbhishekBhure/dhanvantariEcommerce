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
export type ContentPage = { id: string; slug: string; title: string; excerpt: string | null; content: string; featuredImage: string | null; isPublished: boolean; metaTitle: string | null; metaDescription: string | null; updatedAt: string };
export type BlogPost = { id: string; slug: string; title: string; excerpt: string | null; content: string; coverImage: string | null; category: string | null; tags: string | null; authorName: string; isPublished: boolean; publishedAt: string | null; metaTitle: string | null; metaDescription: string | null; createdAt: string; updatedAt: string };
export type Banner = { id: string; title: string; subtitle: string | null; imageUrl: string; mobileImageUrl: string | null; linkUrl: string | null; linkText: string | null; isActive: boolean; sortOrder: number };
export type SiteSettings = Record<string, any>;
export type Coupon = { id: string; code: string; type: "PERCENTAGE" | "FIXED"; value: number; minimumOrder: number | null; maximumDiscount: number | null; description: string | null; isActive: boolean; validFrom: string; validUntil: string | null; usageLimit: number | null; perUserLimit: number | null; _count?: { redemptions: number } };
export type AdminUser = { id: string; name: string; email: string; role: "ADMIN" | "SUPER_ADMIN"; isActive: boolean; emailVerified: boolean; createdAt?: string };

type ListState<T> = { items: T[]; isLoading: boolean; error: string | null };
export type AdminState = {
  user: UserPublic | null;
  authLoading: boolean;
  dashboard: { data: Dashboard | null; isLoading: boolean; error: string | null };
  products: ListState<Product>;
  categories: ListState<Category>;
  orders: ListState<Order>;
  customers: ListState<Customer>;
  pages: ListState<ContentPage>;
  posts: ListState<BlogPost>;
  banners: ListState<Banner>;
  coupons: ListState<Coupon>;
  adminUsers: ListState<AdminUser>;
  settings: { data: SiteSettings; isLoading: boolean; error: string | null };
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
  pages: initialList<ContentPage>(),
  posts: initialList<BlogPost>(),
  banners: initialList<Banner>(),
  coupons: initialList<Coupon>(),
  adminUsers: initialList<AdminUser>(),
  settings: { data: {}, isLoading: false, error: null },
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
export const loadProducts = createAsyncThunk("admin/loadProducts", async (query: { page?: number; pageSize?: number; search?: string } | undefined = undefined, { rejectWithValue }) => {
  try { const params = new URLSearchParams({ page: String(query?.page ?? 1), pageSize: String(query?.pageSize ?? 20) }); if (query?.search) params.set("search", query.search); return (await api<{ data: { products: Product[] } }>(`/admin/products?${params.toString()}`)).data.products; }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not load products.")); }
});
export const loadCategories = createAsyncThunk("admin/loadCategories", async (_, { rejectWithValue }) => {
  try { return (await api<{ data: { categories: Category[] } }>("/admin/categories")).data.categories; }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not load categories.")); }
});
export const loadOrders = createAsyncThunk("admin/loadOrders", async (query: { page?: number; pageSize?: number; search?: string; status?: string } | undefined = undefined, { rejectWithValue }) => {
  try {
    const params = new URLSearchParams({ page: String(query?.page ?? 1), pageSize: String(query?.pageSize ?? 20) });
    if (query?.search) params.set("search", query.search);
    if (query?.status) params.set("status", query.status);
    return (await api<{ data: { orders: Order[] } }>(`/admin/orders?${params.toString()}`)).data.orders;
  }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not load orders.")); }
});
export const loadCustomers = createAsyncThunk("admin/loadCustomers", async (query: { page?: number; pageSize?: number; search?: string } | undefined = undefined, { rejectWithValue }) => {
  try { const params = new URLSearchParams({ page: String(query?.page ?? 1), pageSize: String(query?.pageSize ?? 20) }); if (query?.search) params.set("search", query.search); return (await api<{ data: { customers: Customer[] } }>(`/admin/customers?${params.toString()}`)).data.customers; }
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
export const updateProduct = createAsyncThunk("admin/updateProduct", async ({ id, data }: { id: string; data: Record<string, unknown> }, { dispatch, rejectWithValue }) => {
  try { await api(`/admin/products/${id}`, { method: "PATCH", body: JSON.stringify(data) }); await dispatch(loadProducts()).unwrap(); }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not update product.")); }
});
export const adjustInventory = createAsyncThunk("admin/adjustInventory", async ({ id, quantity, reason }: { id: string; quantity: number; reason: string }, { dispatch, rejectWithValue }) => {
  try { await api(`/admin/products/${id}/inventory-adjust`, { method: "POST", body: JSON.stringify({ quantity, reason }) }); await dispatch(loadProducts()).unwrap(); }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not adjust inventory.")); }
});
export const updateOrderStatus = createAsyncThunk("admin/updateOrderStatus", async (payload: { orderId: string; status: string }, { dispatch, rejectWithValue }) => {
  try { await api(`/admin/orders/${payload.orderId}/status`, { method: "PATCH", body: JSON.stringify({ status: payload.status }) }); await dispatch(loadOrders()).unwrap(); }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not update order status.")); }
});
export const toggleCustomer = createAsyncThunk("admin/toggleCustomer", async (customer: Customer, { dispatch, rejectWithValue }) => {
  try { await api(`/admin/customers/${customer.id}/status`, { method: "PATCH", body: JSON.stringify({ isActive: !customer.isActive }) }); await dispatch(loadCustomers()).unwrap(); }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not update customer.")); }
});
export const loadCoupons = createAsyncThunk("admin/loadCoupons", async (_, { rejectWithValue }) => {
  try { return (await api<{ data: { coupons: Coupon[] } }>("/admin/coupons")).data.coupons; }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not load coupons.")); }
});
export const createCoupon = createAsyncThunk("admin/createCoupon", async (payload: Record<string, unknown>, { dispatch, rejectWithValue }) => {
  try { await api("/admin/coupons", { method: "POST", body: JSON.stringify(payload) }); await dispatch(loadCoupons()).unwrap(); }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not create coupon.")); }
});
export const setCouponActive = createAsyncThunk("admin/setCouponActive", async ({ id, isActive }: { id: string; isActive: boolean }, { dispatch, rejectWithValue }) => {
  try { await api(`/admin/coupons/${id}`, { method: "PATCH", body: JSON.stringify({ isActive }) }); await dispatch(loadCoupons()).unwrap(); }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not update coupon.")); }
});
export const loadAdminUsers = createAsyncThunk("admin/loadAdminUsers", async (_, { rejectWithValue }) => {
  try { return (await api<{ data: { users: AdminUser[] } }>("/admin/users")).data.users; }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not load admin users.")); }
});
export const updateAdminUser = createAsyncThunk("admin/updateAdminUser", async ({ id, data }: { id: string; data: { role?: AdminUser["role"]; isActive?: boolean } }, { dispatch, rejectWithValue }) => {
  try {
    if (data.role) await api(`/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role: data.role }) });
    if (data.isActive !== undefined) await api(`/admin/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ isActive: data.isActive }) });
    await dispatch(loadAdminUsers()).unwrap();
  } catch (error) { return rejectWithValue(messageFrom(error, "Could not update admin user.")); }
});
export const inviteAdmin = createAsyncThunk("admin/inviteAdmin", async (email: string, { dispatch, rejectWithValue }) => {
  try { await api("/admin/users/invite", { method: "POST", body: JSON.stringify({ email }) }); await dispatch(loadAdminUsers()).unwrap(); }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not grant admin access.")); }
});

// ─── CMS Pages Thunks ─────────────────────────────────────────
export const loadPages = createAsyncThunk("admin/loadPages", async (_, { rejectWithValue }) => {
  try { return (await api<{ data: { pages: ContentPage[] } }>("/admin/cms/pages")).data.pages; }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not load pages.")); }
});
export const createPage = createAsyncThunk("admin/createPage", async (payload: Partial<ContentPage>, { dispatch, rejectWithValue }) => {
  try { await api("/admin/cms/pages", { method: "POST", body: JSON.stringify(payload) }); await dispatch(loadPages()).unwrap(); }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not create page.")); }
});
export const updatePage = createAsyncThunk("admin/updatePage", async ({ id, data }: { id: string; data: Partial<ContentPage> }, { dispatch, rejectWithValue }) => {
  try { await api(`/admin/cms/pages/${id}`, { method: "PATCH", body: JSON.stringify(data) }); await dispatch(loadPages()).unwrap(); }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not update page.")); }
});
export const deletePage = createAsyncThunk("admin/deletePage", async (id: string, { dispatch, rejectWithValue }) => {
  try { await api(`/admin/cms/pages/${id}`, { method: "DELETE" }); await dispatch(loadPages()).unwrap(); }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not delete page.")); }
});

// ─── CMS Blog Posts Thunks ────────────────────────────────────
export const loadPosts = createAsyncThunk("admin/loadPosts", async (_, { rejectWithValue }) => {
  try { return (await api<{ data: { posts: BlogPost[] } }>("/admin/cms/posts")).data.posts; }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not load blog posts.")); }
});
export const createPost = createAsyncThunk("admin/createPost", async (payload: Partial<BlogPost>, { dispatch, rejectWithValue }) => {
  try { await api("/admin/cms/posts", { method: "POST", body: JSON.stringify(payload) }); await dispatch(loadPosts()).unwrap(); }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not create blog post.")); }
});
export const updatePost = createAsyncThunk("admin/updatePost", async ({ id, data }: { id: string; data: Partial<BlogPost> }, { dispatch, rejectWithValue }) => {
  try { await api(`/admin/cms/posts/${id}`, { method: "PATCH", body: JSON.stringify(data) }); await dispatch(loadPosts()).unwrap(); }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not update blog post.")); }
});
export const deletePost = createAsyncThunk("admin/deletePost", async (id: string, { dispatch, rejectWithValue }) => {
  try { await api(`/admin/cms/posts/${id}`, { method: "DELETE" }); await dispatch(loadPosts()).unwrap(); }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not delete blog post.")); }
});

// ─── Banners Thunks ───────────────────────────────────────────
export const loadBanners = createAsyncThunk("admin/loadBanners", async (_, { rejectWithValue }) => {
  try { return (await api<{ data: { banners: Banner[] } }>("/admin/banners")).data.banners; }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not load banners.")); }
});
export const createBanner = createAsyncThunk("admin/createBanner", async (payload: Partial<Banner>, { dispatch, rejectWithValue }) => {
  try { await api("/admin/banners", { method: "POST", body: JSON.stringify(payload) }); await dispatch(loadBanners()).unwrap(); }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not create banner.")); }
});
export const updateBanner = createAsyncThunk("admin/updateBanner", async ({ id, data }: { id: string; data: Partial<Banner> }, { dispatch, rejectWithValue }) => {
  try { await api(`/admin/banners/${id}`, { method: "PATCH", body: JSON.stringify(data) }); await dispatch(loadBanners()).unwrap(); }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not update banner.")); }
});
export const deleteBanner = createAsyncThunk("admin/deleteBanner", async (id: string, { dispatch, rejectWithValue }) => {
  try { await api(`/admin/banners/${id}`, { method: "DELETE" }); await dispatch(loadBanners()).unwrap(); }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not delete banner.")); }
});

// ─── Storefront Customizer / Settings Thunks ───────────────────
export const loadSettings = createAsyncThunk("admin/loadSettings", async (_, { rejectWithValue }) => {
  try { return (await api<{ data: { settings: SiteSettings } }>("/admin/cms/settings")).data.settings; }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not load settings.")); }
});
export const updateSetting = createAsyncThunk("admin/updateSetting", async ({ key, value }: { key: string; value: any }, { dispatch, rejectWithValue }) => {
  try { await api(`/admin/cms/settings/${key}`, { method: "PUT", body: JSON.stringify({ value }) }); await dispatch(loadSettings()).unwrap(); }
  catch (error) { return rejectWithValue(messageFrom(error, "Could not save settings.")); }
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
    listCases<Product>(loadProducts, "products");
    listCases<Category>(loadCategories, "categories");
    listCases<Order>(loadOrders, "orders");
    listCases<Customer>(loadCustomers, "customers");
    listCases<ContentPage>(loadPages, "pages");
    listCases<BlogPost>(loadPosts, "posts");
    listCases<Banner>(loadBanners, "banners");
    listCases<Coupon>(loadCoupons, "coupons");
    listCases<AdminUser>(loadAdminUsers, "adminUsers");

    builder.addCase(loadDashboard.pending, (state) => { state.dashboard.isLoading = true; state.dashboard.error = null; })
      .addCase(loadDashboard.fulfilled, (state, action) => { state.dashboard.data = action.payload; state.dashboard.isLoading = false; })
      .addCase(loadDashboard.rejected, (state, action) => { state.dashboard.isLoading = false; state.dashboard.error = action.payload as string ?? "Could not load dashboard."; });

    builder.addCase(loadSettings.pending, (state) => { state.settings.isLoading = true; state.settings.error = null; })
      .addCase(loadSettings.fulfilled, (state, action) => { state.settings.data = action.payload; state.settings.isLoading = false; })
      .addCase(loadSettings.rejected, (state, action) => { state.settings.isLoading = false; state.settings.error = action.payload as string ?? "Could not load settings."; });

    [
      createCategory, toggleCategory, createProduct, updateProduct, adjustInventory, updateOrderStatus, toggleCustomer,
      createPage, updatePage, deletePage,
      createPost, updatePost, deletePost,
      createBanner, updateBanner, deleteBanner,
      createCoupon, setCouponActive,
      updateAdminUser, inviteAdmin,
      updateSetting,
    ].forEach((thunk) => {
      builder.addCase(thunk.pending, (state) => { state.mutation.isLoading = true; state.mutation.error = null; });
      builder.addCase(thunk.fulfilled, (state) => { state.mutation.isLoading = false; });
      builder.addCase(thunk.rejected, (state, action) => { state.mutation.isLoading = false; state.mutation.error = action.payload as string ?? "Request failed"; });
    });
  },
});

export const { clearMutationError } = adminSlice.actions;
export default adminSlice.reducer;
