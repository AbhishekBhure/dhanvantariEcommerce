"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

type Customer = { id: string; name: string; email: string; phone: string | null; isActive: boolean; createdAt: string; _count: { orders: number } };
type Response = { data: { customers: Customer[]; total: number } };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  async function loadCustomers() { try { const response = await api<Response>("/admin/customers?page=1&pageSize=50"); setCustomers(response.data.customers); } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "Could not load customers."); } }
  useEffect(() => { void loadCustomers(); }, []);
  async function toggleCustomer(customer: Customer) { setUpdatingId(customer.id); try { await api(`/admin/customers/${customer.id}/status`, { method: "PATCH", body: JSON.stringify({ isActive: !customer.isActive }) }); await loadCustomers(); } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "Could not update customer."); } finally { setUpdatingId(""); } }
  return <main className="admin-container"><Link href="/" className="text-sm text-brand-600">Back to dashboard</Link><h1 className="mt-5 text-3xl font-bold">Customers</h1>{error && <p className="mt-6 text-sm text-red-700">{error}</p>}<div className="mt-8 overflow-x-auto border bg-white"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Orders</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr></thead><tbody className="divide-y">{customers.map((customer) => <tr key={customer.id}><td className="px-4 py-4"><strong className="block">{customer.name.replace("[DEMO] ", "")}</strong><span className="text-slate-500">{customer.email}</span></td><td className="px-4 py-4">{customer.phone ?? "-"}</td><td className="px-4 py-4">{customer._count.orders}</td><td className="px-4 py-4 text-slate-500">{new Date(customer.createdAt).toLocaleDateString("en-IN")}</td><td className="px-4 py-4 text-brand-600">{customer.isActive ? "Active" : "Inactive"}</td><td className="px-4 py-4"><button type="button" disabled={updatingId === customer.id} onClick={() => void toggleCustomer(customer)} className="text-xs font-semibold text-brand-600">{customer.isActive ? "Deactivate" : "Activate"}</button></td></tr>)}</tbody></table>{!customers.length && <p className="py-16 text-center text-slate-500">No customers found.</p>}</div></main>;
}
