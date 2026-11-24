"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { api, ApiError } from "@/lib/api";
import { useAppDispatch } from "@/store/hooks";
import { loadOrders } from "@/store/adminSlice";

type Detail = { id: string; orderNumber: string; status: string; paymentStatus: string; paymentMethod: string; subtotal: number; couponDiscount: number; shippingCharge: number; total: number; createdAt: string; notes: string | null; addressName: string; addressLine1: string; addressLine2: string | null; addressCity: string; addressState: string; addressPincode: string; addressPhone: string; user: { name: string; email: string | null; phone: string | null }; items: Array<{ id: string; productName: string; variantName: string | null; sku: string | null; quantity: number; price: number; total: number }>; payment: { status: string; gatewayPaymentId: string | null; gatewayOrderId: string | null; amount: number; codCollectedAt: string | null; codCollectionReference: string | null } | null; shipment: { carrier: string | null; trackingNumber: string | null; trackingUrl: string | null; awbNumber: string | null; estimatedDelivery: string | null; status: string; indiaPostBookingStatus: string; indiaPostBarcode: string | null; indiaPostBookingReference: string | null; indiaPostTariff: number | null; indiaPostLastEvent: string | null; indiaPostLastSyncAt: string | null } | null; statusHistory: Array<{ id: string; status: string; notes: string | null; createdAt: string }> };
const money = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const [order, setOrder] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [shipment, setShipment] = useState({ carrier: "", trackingNumber: "", trackingUrl: "", awbNumber: "", estimatedDelivery: "" });
  const [booking, setBooking] = useState({ barcode: "", physicalWeight: "", length: "14", breadth: "9", height: "1", shape: "NROL" as "NROL" | "ROLL" });
  const [collectionAmount, setCollectionAmount] = useState("");
  const [collectionReference, setCollectionReference] = useState("");
  const [indiaPostBusy, setIndiaPostBusy] = useState(false);
  useEffect(() => { void api<{ data: { order: Detail } }>(`/admin/orders/${id}`).then((response) => { setOrder(response.data.order); const value = response.data.order.shipment; if (value) setShipment({ carrier: value.carrier ?? "", trackingNumber: value.trackingNumber ?? "", trackingUrl: value.trackingUrl ?? "", awbNumber: value.awbNumber ?? "", estimatedDelivery: value.estimatedDelivery?.slice(0, 10) ?? "" }); }).catch((e) => setError(e instanceof ApiError ? e.message : "Could not load order.")); }, [id]);

  async function reloadOrder() {
    const response = await api<{ data: { order: Detail } }>(`/admin/orders/${id}`);
    setOrder(response.data.order);
    await dispatch(loadOrders());
  }

  async function bookIndiaPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIndiaPostBusy(true);
    setError("");
    try {
      await api(`/admin/orders/${id}/india-post/book`, { method: "POST", body: JSON.stringify({
        barcode: booking.barcode.trim().toUpperCase(),
        physicalWeight: Number(booking.physicalWeight),
        length: Number(booking.length),
        breadth: Number(booking.breadth),
        height: Number(booking.height),
        shape: booking.shape,
      }) });
      await reloadOrder();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not book this parcel with India Post.");
      await reloadOrder().catch(() => undefined);
    } finally { setIndiaPostBusy(false); }
  }

  async function refreshIndiaPostTracking() {
    setIndiaPostBusy(true);
    setError("");
    try {
      await api(`/admin/orders/${id}/india-post/track`, { method: "POST", body: JSON.stringify({}) });
      await reloadOrder();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not refresh India Post tracking.");
    } finally { setIndiaPostBusy(false); }
  }

  async function downloadIndiaPostLabel() {
    setIndiaPostBusy(true);
    setError("");
    try {
      const response = await api<{ data: { filename: string; pdfBase64: string } }>(
        `/admin/orders/${id}/india-post/label`,
        { method: "POST", body: JSON.stringify({}) },
      );
      const bytes = Uint8Array.from(atob(response.data.pdfBase64), (character) => character.charCodeAt(0));
      const objectUrl = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = response.data.filename;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not generate the India Post label.");
    } finally { setIndiaPostBusy(false); }
  }

  async function recordCodCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIndiaPostBusy(true);
    setError("");
    try {
      await api(`/admin/orders/${id}/cod-collection`, { method: "POST", body: JSON.stringify({
        amount: Number(collectionAmount || order?.total.toFixed(2)),
        reference: collectionReference.trim() || null,
      }) });
      await reloadOrder();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not record COD collection.");
    } finally { setIndiaPostBusy(false); }
  }

  async function saveShipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try { await api(`/admin/orders/${id}/shipment`, { method: "POST", body: JSON.stringify({ ...shipment, estimatedDelivery: shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toISOString() : null }) }); await reloadOrder(); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Could not save shipment details."); }
    finally { setSaving(false); }
  }

  if (!order) return <AdminLayout title="Order details"><p className="text-sm text-red-700">{error || "Loading order..."}</p></AdminLayout>;
  return <AdminLayout title={`Order ${order.orderNumber}`} subtitle="Order & fulfilment" actions={<Link href="/orders" className="text-sm font-semibold text-emerald-700">Back to orders</Link>}>
    {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <section className="border bg-white p-5"><h2 className="font-semibold">Items</h2><div className="mt-3 divide-y">{order.items.map((item) => <div key={item.id} className="flex justify-between gap-4 py-3 text-sm"><span>{item.productName}{item.variantName && ` · ${item.variantName}`} × {item.quantity}<span className="block text-xs text-slate-500">{item.sku}</span></span><strong>{money(item.total)}</strong></div>)}</div></section>
        <section className="border bg-white p-5"><h2 className="font-semibold">Shipment & tracking</h2>
          {order.paymentMethod === "COD" && <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold">India Post Business Parcel · COD</h3>
            <p className="mt-1 text-xs text-slate-600">Allocate the barcode from your India Post range and enter the final packed parcel measurements.</p>
            {order.shipment && ["BOOKED", "UNKNOWN", "BOOKING"].includes(order.shipment.indiaPostBookingStatus) ? <div className="mt-3 space-y-2 text-sm">
              <p>Booking state: <strong>{order.shipment.indiaPostBookingStatus}</strong>{order.shipment.indiaPostBarcode ? ` · ${order.shipment.indiaPostBarcode}` : ""}</p>
              {order.shipment.indiaPostBookingReference && <p>Booking reference: {order.shipment.indiaPostBookingReference}</p>}
              {order.shipment.indiaPostTariff != null && <p>India Post tariff: {money(order.shipment.indiaPostTariff)}</p>}
              {order.shipment.indiaPostLastEvent && <p>Latest event: {order.shipment.indiaPostLastEvent}</p>}
              {order.shipment.indiaPostLastSyncAt && <p className="text-xs text-slate-500">Last synced: {new Date(order.shipment.indiaPostLastSyncAt).toLocaleString("en-IN")}</p>}
              <button type="button" disabled={indiaPostBusy} onClick={() => void refreshIndiaPostTracking()} className="h-9 border border-emerald-700 px-3 text-xs font-semibold text-emerald-800 disabled:opacity-50">{indiaPostBusy ? "Checking..." : "Refresh India Post tracking"}</button>
              {order.shipment.indiaPostBookingStatus === "BOOKED" && <button type="button" disabled={indiaPostBusy} onClick={() => void downloadIndiaPostLabel()} className="ml-2 h-9 border border-emerald-700 px-3 text-xs font-semibold text-emerald-800 disabled:opacity-50">{indiaPostBusy ? "Preparing..." : "Download India Post label"}</button>}
              {order.shipment.indiaPostBookingStatus !== "BOOKED" && <p role="alert" className="text-xs text-amber-800">Do not retry booking until India Post confirms whether the barcode was booked.</p>}
            </div> : order.status === "PACKED" ? <form onSubmit={(event) => void bookIndiaPost(event)} className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm sm:col-span-2">Allocated barcode<input required minLength={13} maxLength={13} pattern="[A-Za-z0-9]{13}" value={booking.barcode} onChange={(e) => setBooking({ ...booking, barcode: e.target.value.toUpperCase() })} className="mt-1 h-10 w-full border px-3" /></label>
              <label className="text-sm">Packed weight (grams)<input required type="number" min={1} max={35000} step={1} value={booking.physicalWeight} onChange={(e) => setBooking({ ...booking, physicalWeight: e.target.value })} className="mt-1 h-10 w-full border px-3" /></label>
              <label className="text-sm">Parcel shape<select value={booking.shape} onChange={(e) => setBooking({ ...booking, shape: e.target.value as "NROL" | "ROLL" })} className="mt-1 h-10 w-full border px-3"><option value="NROL">Rectangular / non-roll</option><option value="ROLL">Cylindrical / roll</option></select></label>
              <label className="text-sm">Length (cm)<input required type="number" min={14} max={150} step="0.1" value={booking.length} onChange={(e) => setBooking({ ...booking, length: e.target.value })} className="mt-1 h-10 w-full border px-3" /></label>
              <label className="text-sm">Breadth (cm)<input required type="number" min={9} max={150} step="0.1" value={booking.breadth} onChange={(e) => setBooking({ ...booking, breadth: e.target.value })} className="mt-1 h-10 w-full border px-3" /></label>
              <label className="text-sm">Height (cm)<input required type="number" min={1} max={150} step="0.1" value={booking.height} onChange={(e) => setBooking({ ...booking, height: e.target.value })} className="mt-1 h-10 w-full border px-3" /></label>
              <button disabled={indiaPostBusy} className="h-10 bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2">{indiaPostBusy ? "Booking..." : order.shipment?.indiaPostBookingStatus === "FAILED" ? "Retry rejected booking" : "Book with India Post"}</button>
            </form> : <p className="mt-2 text-xs text-slate-600">Move the COD order to Packed before creating its India Post consignment.</p>}
          </div>}
          <form onSubmit={saveShipment} className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2"><label className="text-sm">Carrier<input value={shipment.carrier} onChange={(e) => setShipment({ ...shipment, carrier: e.target.value })} className="mt-1 h-10 w-full border px-3" /></label><label className="text-sm">AWB number<input value={shipment.awbNumber} onChange={(e) => setShipment({ ...shipment, awbNumber: e.target.value })} className="mt-1 h-10 w-full border px-3" /></label><label className="text-sm">Tracking number<input value={shipment.trackingNumber} onChange={(e) => setShipment({ ...shipment, trackingNumber: e.target.value })} className="mt-1 h-10 w-full border px-3" /></label><label className="text-sm">Estimated delivery<input type="date" value={shipment.estimatedDelivery} onChange={(e) => setShipment({ ...shipment, estimatedDelivery: e.target.value })} className="mt-1 h-10 w-full border px-3" /></label><label className="text-sm sm:col-span-2">Tracking URL<input type="url" value={shipment.trackingUrl} onChange={(e) => setShipment({ ...shipment, trackingUrl: e.target.value })} className="mt-1 h-10 w-full border px-3" /></label><button disabled={saving} className="h-10 bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2">{saving ? "Saving..." : "Save shipment"}</button></form></section>
        <section className="border bg-white p-5"><h2 className="font-semibold">Status timeline</h2><ol className="mt-4 space-y-4">{order.statusHistory.map((entry) => <li key={entry.id} className="border-l-2 border-emerald-600 pl-4"><p className="text-sm font-semibold">{entry.status.replaceAll("_", " ")}</p><p className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString("en-IN")}{entry.notes ? ` · ${entry.notes}` : ""}</p></li>)}</ol></section>
      </div>
      <aside className="space-y-5"><section className="border bg-white p-5"><h2 className="font-semibold">Customer</h2><p className="mt-3 text-sm font-medium">{order.user.name}</p><p className="text-sm text-slate-600">{order.user.email ?? "No email provided"}</p><p className="text-sm text-slate-600">{order.addressPhone}</p><h3 className="mt-5 text-sm font-semibold">Delivery address</h3><p className="mt-2 text-sm leading-relaxed text-slate-600">{order.addressName}<br />{order.addressLine1}{order.addressLine2 ? `, ${order.addressLine2}` : ""}<br />{order.addressCity}, {order.addressState} {order.addressPincode}</p></section><section className="border bg-white p-5"><h2 className="font-semibold">Payment</h2><p className="mt-3 text-sm">{order.paymentMethod} · {order.paymentStatus}</p><p className="mt-1 text-sm text-slate-600">{order.payment?.gatewayPaymentId ?? (order.payment?.codCollectionReference ? `COD collection: ${order.payment.codCollectionReference}` : "No gateway payment ID")}</p>{order.paymentMethod === "COD" && order.status === "DELIVERED" && order.paymentStatus === "PENDING" && <form onSubmit={(event) => void recordCodCollection(event)} className="mt-4 space-y-2 border-t pt-3"><p className="text-xs text-amber-800">Record this only after verifying the COD remittance received from India Post.</p><label className="block text-xs">Collected amount<input required type="number" min="0.01" step="0.01" value={collectionAmount || order.total.toFixed(2)} onChange={(e) => setCollectionAmount(e.target.value)} className="mt-1 h-9 w-full border px-2 text-sm" /></label><label className="block text-xs">Collection reference (optional)<input value={collectionReference} onChange={(e) => setCollectionReference(e.target.value)} className="mt-1 h-9 w-full border px-2 text-sm" /></label><button disabled={indiaPostBusy} className="h-9 w-full bg-emerald-700 text-xs font-semibold text-white disabled:opacity-50">{indiaPostBusy ? "Saving..." : "Confirm COD collected"}</button></form>}{order.payment?.codCollectedAt && <p className="mt-2 text-xs text-emerald-800">COD recorded {new Date(order.payment.codCollectedAt).toLocaleString("en-IN")}</p>}<div className="mt-4 space-y-2 border-t pt-3 text-sm"><p className="flex justify-between"><span>Subtotal</span><span>{money(order.subtotal)}</span></p><p className="flex justify-between"><span>Coupon</span><span>-{money(order.couponDiscount)}</span></p><p className="flex justify-between"><span>Shipping</span><span>{money(order.shippingCharge)}</span></p><p className="flex justify-between border-t pt-2 font-bold"><span>Total</span><span>{money(order.total)}</span></p></div></section></aside>
    </div>
  </AdminLayout>;
}
