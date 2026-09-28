"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { loadCustomers, toggleCustomer, type Customer } from "@/store/adminSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export default function CustomersPage() {
  const dispatch = useAppDispatch();
  const customers = useAppSelector((state) => state.admin.customers.items);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  useEffect(() => { void dispatch(loadCustomers()); }, [dispatch]);

  async function handleToggleCustomer(customer: Customer) {
    setUpdatingId(customer.id);
    const result = await dispatch(toggleCustomer(customer));
    if (toggleCustomer.rejected.match(result)) setError(result.payload as string ?? "Could not update customer.");
    setUpdatingId("");
  }

  return (
    <AdminLayout title="Registered Customers" subtitle="User Directory & Accounts">
      {error && <p className="mb-4 text-xs font-semibold text-red-600">{error}</p>}
      <div className="overflow-x-auto border bg-white rounded-2xl shadow-xs">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b">
            <tr>
              <th className="px-6 py-3.5">Customer Name & Email</th>
              <th className="px-6 py-3.5">Phone</th>
              <th className="px-6 py-3.5">Total Orders</th>
              <th className="px-6 py-3.5">Joined On</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4">
                  <strong className="block text-slate-900">{customer.name.replace("[DEMO] ", "")}</strong>
                  <span className="text-xs text-slate-500">{customer.email}</span>
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
                  <button
                    type="button"
                    disabled={updatingId === customer.id}
                    onClick={() => void handleToggleCustomer(customer)}
                    className="text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    {customer.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!customers.length && <p className="py-16 text-center text-slate-400 text-sm">No customers registered yet.</p>}
      </div>
    </AdminLayout>
  );
}
