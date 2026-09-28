"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
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
    <AdminLayout title="Customer Orders" subtitle="Order Fulfillment & Logistics">
      {error && <p className="mb-4 text-xs font-semibold text-red-600">{error}</p>}
      <div className="overflow-x-auto border bg-white rounded-2xl shadow-xs">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b">
            <tr>
              <th className="px-6 py-3.5">Order Number</th>
              <th className="px-6 py-3.5">Customer</th>
              <th className="px-6 py-3.5">Total Amount</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5">Date</th>
              <th className="px-6 py-3.5 text-right">Update Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => {
              const nextStatuses = transitions[order.status] ?? [];
              return (
                <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-mono font-semibold text-slate-900">{order.orderNumber}</td>
                  <td className="px-6 py-4 text-xs text-slate-700">{order.user?.name ?? "Guest Customer"}</td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-900">₹{order.total}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold font-mono uppercase text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {order.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="px-6 py-4 text-right">
                    {nextStatuses.length ? (
                      <select
                        aria-label={`Update ${order.orderNumber} status`}
                        disabled={updatingId === order.id}
                        defaultValue=""
                        onChange={(event) => {
                          if (event.target.value) void updateStatus(order.id, event.target.value);
                        }}
                        className="border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Choose status</option>
                        {nextStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-slate-400">Terminal</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!orders.length && <p className="py-16 text-center text-slate-400 text-sm">No orders found.</p>}
      </div>
    </AdminLayout>
  );
}
