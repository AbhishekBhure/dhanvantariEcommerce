"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadCustomers, toggleCustomer, type Customer } from "@/store/adminSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export default function CustomersPage() {
  const dispatch = useAppDispatch();
  const customers = useAppSelector((state) => state.admin.customers.items);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  useEffect(() => { void dispatch(loadCustomers()); }, [dispatch]);
  async function handleToggleCustomer(customer: Customer) { setUpdatingId(customer.id); const result = await dispatch(toggleCustomer(customer)); if (toggleCustomer.rejected.match(result)) setError(result.payload as string ?? "Could not update customer."); setUpdatingId(""); }
  return <main className="admin-container"><Link href="/" className="text-sm text-brand-600">Back to dashboard</Link><h1 className="mt-5 text-3xl font-bold">Customers</h1>{error && <p className="mt-6 text-sm text-red-700">{error}</p>}<div className="mt-8 overflow-x-auto border bg-white"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Orders</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr></thead><tbody className="divide-y">{customers.map((customer) => <tr key={customer.id}><td className="px-4 py-4"><strong className="block">{customer.name.replace("[DEMO] ", "")}</strong><span className="text-slate-500">{customer.email}</span></td><td className="px-4 py-4">{customer.phone ?? "-"}</td><td className="px-4 py-4">{customer._count.orders}</td><td className="px-4 py-4 text-slate-500">{new Date(customer.createdAt).toLocaleDateString("en-IN")}</td><td className="px-4 py-4 text-brand-600">{customer.isActive ? "Active" : "Inactive"}</td><td className="px-4 py-4"><button type="button" disabled={updatingId === customer.id} onClick={() => void handleToggleCustomer(customer)} className="text-xs font-semibold text-brand-600">{customer.isActive ? "Deactivate" : "Activate"}</button></td></tr>)}</tbody></table>{!customers.length && <p className="py-16 text-center text-slate-500">No customers found.</p>}</div></main>;
}
