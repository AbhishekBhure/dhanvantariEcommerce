"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { deleteCustomer, loadCustomers, toggleCustomer, type Customer } from "@/store/adminSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export default function CustomersPage() {
  const dispatch = useAppDispatch();
  const customers = useAppSelector((state) => state.admin.customers.items);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => { const timer = window.setTimeout(() => void dispatch(loadCustomers({ page, pageSize: 20, search: search.trim() || undefined })), 250); return () => window.clearTimeout(timer); }, [dispatch, page, search]);

  async function handleToggleCustomer(customer: Customer) {
    setUpdatingId(customer.id);
    const result = await dispatch(toggleCustomer(customer));
    if (toggleCustomer.rejected.match(result)) setError(result.payload as string ?? "Could not update customer.");
    setUpdatingId("");
  }

  async function handleDeleteCustomer(customer: Customer) {
    const confirmed = window.confirm(
      `Permanently delete ${customer.name}? Their profile and associated reviews, cart, and saved data will be removed. Customers with past orders cannot be deleted.`,
    );
    if (!confirmed) return;

    setError("");
    setDeletingId(customer.id);
    const result = await dispatch(deleteCustomer(customer));
    if (deleteCustomer.rejected.match(result)) {
      setError(result.payload as string ?? "Could not permanently delete customer.");
    } else {
      const reloadResult = await dispatch(loadCustomers({
        page,
        pageSize: 20,
        search: search.trim() || undefined,
      }));
      if (loadCustomers.rejected.match(reloadResult)) {
        setError(reloadResult.payload as string ?? "Customer was deleted, but the list could not be refreshed.");
      }
    }
    setDeletingId("");
  }

  return (
    <AdminLayout title="Registered Customers" subtitle="User Directory & Accounts">
      {error && <p className="mb-4 text-xs font-semibold text-red-600">{error}</p>}
      <div className="mb-4 flex gap-3"><input aria-label="Search customers" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search name or email" className="h-10 w-full max-w-md border bg-white px-3 text-sm"/><span className="self-center text-xs text-slate-500">Page {page} · {customers.length} results</span></div>
      <div className="overflow-x-auto border bg-white rounded-2xl shadow-xs">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b">
            <tr>
              <th className="px-6 py-3.5">Customer Name & Email</th>
              <th className="px-6 py-3.5">Phone</th>
              <th className="px-6 py-3.5">Total Orders</th>
              <th className="px-6 py-3.5">Joined On</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4">
                  <strong className="block text-slate-900">{customer.name.replace("[DEMO] ", "")}</strong>
                  <span className="text-xs text-slate-500">{customer.email ?? "No email provided"}</span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-600">{customer.phone ?? "—"}</td>
                <td className="px-6 py-4 text-xs font-semibold text-slate-700">{customer._count.orders}</td>
                <td className="px-6 py-4 text-xs text-slate-500">{new Date(customer.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${customer.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border"}`}>
                    {customer.isActive ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      disabled={updatingId === customer.id || deletingId === customer.id}
                      onClick={() => void handleToggleCustomer(customer)}
                      className="whitespace-nowrap text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      {customer.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      disabled={updatingId === customer.id || deletingId === customer.id}
                      onClick={() => void handleDeleteCustomer(customer)}
                      className="whitespace-nowrap text-xs font-semibold text-red-700 hover:underline disabled:opacity-50"
                    >
                      {deletingId === customer.id ? "Deleting..." : "Delete permanently"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!customers.length && <p className="py-16 text-center text-slate-400 text-sm">No customers registered yet.</p>}
      </div>
      <div className="mt-4 flex justify-end gap-2"><button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="h-9 border bg-white px-3 text-sm disabled:opacity-40">Previous</button><button type="button" disabled={customers.length < 20} onClick={() => setPage((current) => current + 1)} className="h-9 border bg-white px-3 text-sm disabled:opacity-40">Next</button></div>
    </AdminLayout>
  );
}
