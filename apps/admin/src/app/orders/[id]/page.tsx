"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { api, ApiError } from "@/lib/api";
import { useAppDispatch } from "@/store/hooks";
import { loadOrders } from "@/store/adminSlice";

type Detail = { id: string; orderNumber: string; status: string; paymentStatus: string; paymentMethod: string; subtotal: number; couponDiscount: number; shippingCharge: number; total: number; createdAt: string; notes: string | null; addressName: string; addressLine1: string; addressLine2: string | null; addressCity: string; addressState: string; addressPincode: string; addressPhone: string; user: { name: string; email: string; phone: string | null }; items: Array<{ id: string; productName: string; variantName: string | null; sku: string | null; quantity: number; price: number; total: number }>; payment: { status: string; gatewayPaymentId: string | null; gatewayOrderId: string | null; amount: number } | null; shipment: { carrier: string | null; trackingNumber: string | null; trackingUrl: string | null; awbNumber: string | null; estimatedDelivery: string | null; status: string } | null; statusHistory: Array<{ id: string; status: string; notes: string | null; createdAt: string }> };
const money = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const [order, setOrder] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [shipment, setShipment] = useState({ carrier: "", trackingNumber: "", trackingUrl: "", awbNumber: "", estimatedDelivery: "" });
  useEffect(() => { void api<{ data: { order: Detail } }>(`/admin/orders/${id}`).then((response) => { setOrder(response.data.order); const value = response.data.order.shipment; if (value) setShipment({ carrier: value.carrier ?? "", trackingNumber: value.trackingNumber ?? "", trackingUrl: value.trackingUrl ?? "", awbNumber: value.awbNumber ?? "", estimatedDelivery: value.estimatedDelivery?.slice(0, 10) ?? "" }); }).catch((e) => setError(e instanceof ApiError ? e.message : "Could not load order.")); }, [id]);

  async function saveShipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try { await api(`/admin/orders/${id}/shipment`, { method: "POST", body: JSON.stringify({ ...shipment, estimatedDelivery: shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toISOString() : null }) }); const response = await api<{ data: { order: Detail } }>(`/admin/orders/${id}`); setOrder(response.data.order); await dispatch(loadOrders()); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Could not save shipment details."); }
    finally { setSaving(false); }
  }

  if (!order) return <AdminLayout title="Order details"><p className="text-sm text-red-700">{error || "Loading order..."}</p></AdminLayout>;
  return <AdminLayout title={`Order ${order.orderNumber}`} subtitle="Order & fulfilment" actions={<Link href="/orders" className="text-sm font-semibold text-emerald-700">Back to orders</Link>}>
    {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <section className="border bg-white p-5"><h2 className="font-semibold">Items</h2><div className="mt-3 divide-y">{order.items.map((item) => <div key={item.id} className="flex justify-between gap-4 py-3 text-sm"><span>{item.productName}{item.variantName && ` · ${item.variantName}`} × {item.quantity}<span className="block text-xs text-slate-500">{item.sku}</span></span><strong>{money(item.total)}</strong></div>)}</div></section>
        <section className="border bg-white p-5"><h2 className="font-semibold">Shipment & tracking</h2><form onSubmit={saveShipment} className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm">Carrier<input value={shipment.carrier} onChange={(e) => setShipment({ ...shipment, carrier: e.target.value })} className="mt-1 h-10 w-full border px-3" /></label><label className="text-sm">AWB number<input value={shipment.awbNumber} onChange={(e) => setShipment({ ...shipment, awbNumber: e.target.value })} className="mt-1 h-10 w-full border px-3" /></label><label className="text-sm">Tracking number<input value={shipment.trackingNumber} onChange={(e) => setShipment({ ...shipment, trackingNumber: e.target.value })} className="mt-1 h-10 w-full border px-3" /></label><label className="text-sm">Estimated delivery<input type="date" value={shipment.estimatedDelivery} onChange={(e) => setShipment({ ...shipment, estimatedDelivery: e.target.value })} className="mt-1 h-10 w-full border px-3" /></label><label className="text-sm sm:col-span-2">Tracking URL<input type="url" value={shipment.trackingUrl} onChange={(e) => setShipment({ ...shipment, trackingUrl: e.target.value })} className="mt-1 h-10 w-full border px-3" /></label><button disabled={saving} className="h-10 bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2">{saving ? "Saving..." : "Save shipment"}</button></form></section>
        <section className="border bg-white p-5"><h2 className="font-semibold">Status timeline</h2><ol className="mt-4 space-y-4">{order.statusHistory.map((entry) => <li key={entry.id} className="border-l-2 border-emerald-600 pl-4"><p className="text-sm font-semibold">{entry.status.replaceAll("_", " ")}</p><p className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString("en-IN")}{entry.notes ? ` · ${entry.notes}` : ""}</p></li>)}</ol></section>
      </div>
      <aside className="space-y-5"><section className="border bg-white p-5"><h2 className="font-semibold">Customer</h2><p className="mt-3 text-sm font-medium">{order.user.name}</p><p className="text-sm text-slate-600">{order.user.email}</p><p className="text-sm text-slate-600">{order.addressPhone}</p><h3 className="mt-5 text-sm font-semibold">Delivery address</h3><p className="mt-2 text-sm leading-relaxed text-slate-600">{order.addressName}<br />{order.addressLine1}{order.addressLine2 ? `, ${order.addressLine2}` : ""}<br />{order.addressCity}, {order.addressState} {order.addressPincode}</p></section><section className="border bg-white p-5"><h2 className="font-semibold">Payment</h2><p className="mt-3 text-sm">{order.paymentMethod} · {order.paymentStatus}</p><p className="mt-1 text-sm text-slate-600">{order.payment?.gatewayPaymentId ?? "No gateway payment ID"}</p><div className="mt-4 space-y-2 border-t pt-3 text-sm"><p className="flex justify-between"><span>Subtotal</span><span>{money(order.subtotal)}</span></p><p className="flex justify-between"><span>Coupon</span><span>-{money(order.couponDiscount)}</span></p><p className="flex justify-between"><span>Shipping</span><span>{money(order.shippingCharge)}</span></p><p className="flex justify-between border-t pt-2 font-bold"><span>Total</span><span>{money(order.total)}</span></p></div></section></aside>
    </div>
  </AdminLayout>;
}
