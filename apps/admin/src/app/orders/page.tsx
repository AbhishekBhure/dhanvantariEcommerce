"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadOrders, updateOrderStatus, type Order } from "@/store/adminSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const transitions: Record<string, string[]> = {
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["RETURN_REQUESTED"],
  RETURN_REQUESTED: ["RETURNED"],
  RETURNED: ["REFUNDED"],
  PAYMENT_FAILED: ["CANCELLED"],
};

export default function OrdersPage() {
  const dispatch = useAppDispatch();
  const orders = useAppSelector((state) => state.admin.orders.items);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  useEffect(() => { void dispatch(loadOrders()); }, [dispatch]);

  async function updateStatus(orderId: string, status: string) {
    setUpdatingId(orderId);
    setError("");
    try {
      const result = await dispatch(updateOrderStatus({ orderId, status }));
      if (updateOrderStatus.rejected.match(result)) setError(result.payload as string ?? "Could not update order status.");
    } finally { setUpdatingId(""); }
  }

  return (
    <main className="admin-container">
      <Link href="/" className="text-sm text-brand-600">Back to dashboard</Link>
      <h1 className="mt-5 text-3xl font-bold">Orders</h1>
      {error && <p className="mt-6 text-sm text-red-700">{error}</p>}
      <div className="mt-8 overflow-x-auto border bg-white">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="border-b text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Update</th></tr></thead>
          <tbody className="divide-y">
            {orders.map((order) => { const nextStatuses = transitions[order.status] ?? []; return <tr key={order.id}><td className="px-4 py-4 font-medium">{order.orderNumber}</td><td className="px-4 py-4">{order.user?.name ?? "Guest"}</td><td className="px-4 py-4">₹{order.total}</td><td className="px-4 py-4 text-brand-600">{order.status.replaceAll("_", " ")}</td><td className="px-4 py-4 text-slate-500">{new Date(order.createdAt).toLocaleDateString("en-IN")}</td><td className="px-4 py-4">{nextStatuses.length ? <select aria-label={`Update ${order.orderNumber} status`} disabled={updatingId === order.id} defaultValue="" onChange={(event) => { if (event.target.value) void updateStatus(order.id, event.target.value); }} className="border px-2 py-2 text-xs"><option value="">Choose status</option>{nextStatuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select> : <span className="text-xs text-slate-400">No transitions</span>}</td></tr>; })}
          </tbody>
        </table>
        {!orders.length && <p className="py-16 text-center text-slate-500">No orders found.</p>}
      </div>
    </main>
  );
}
