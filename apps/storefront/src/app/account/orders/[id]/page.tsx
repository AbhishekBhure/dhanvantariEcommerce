"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Package } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import type { Order } from "@dhanvantari/shared-types";
import { api, ApiError } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

type ApiOrder = Omit<Order, "addressSnapshot"> & {
  addressName: string;
  addressPhone: string;
  addressLine1: string;
  addressLine2: string | null;
  addressCity: string;
  addressState: string;
  addressPincode: string;
  addressCountry: string;
  statusHistory: Array<{ id: string; status: string; notes: string | null; createdAt: string }>;
  shipment: { status: string; carrier: string | null; trackingNumber: string | null; trackingUrl: string | null; awbNumber: string | null; estimatedDelivery: string | null } | null;
};

type OrderResponse = { data: { order: ApiOrder } };

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void api.get<OrderResponse>(`/orders/${params.id}`)
      .then((response) => setOrder(response.data.order))
      .catch((requestError) => {
        if (requestError instanceof ApiError && requestError.status === 401) router.replace("/login");
        else setError("Could not load this order.");
      });
  }, [params.id, router]);

  if (error) return <main className="section-container py-24 text-center"><h1 className="section-heading">{error}</h1><Link href="/account/orders" className="mt-6 inline-block text-sm font-semibold text-brand-700">Back to orders</Link></main>;
  if (!order) return <main className="section-container py-24 text-center text-muted-foreground">Loading order...</main>;

  return (
    <main className="section-container min-h-screen py-10 md:py-16">
      <Link href="/account/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-700"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to orders</Link>
      <div className="mt-8 flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Order details</p><h1 className="mt-3 font-display text-3xl font-bold">{order.orderNumber}</h1><p className="mt-2 text-sm text-muted-foreground">Placed {new Date(order.createdAt).toLocaleDateString("en-IN")}</p></div><span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-700"><CheckCircle2 className="h-5 w-5" aria-hidden="true" /> {order.status.replaceAll("_", " ")}</span></div>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]"><section><h2 className="font-display text-2xl font-bold">Items</h2><div className="mt-4 divide-y divide-border border-y border-border">{order.items.map((item) => <div key={item.id} className="flex justify-between gap-4 py-4 text-sm"><span>{item.productName} <span className="text-muted-foreground">x {item.quantity}</span></span><span className="font-medium">{formatPrice(item.total)}</span></div>)}</div><h2 className="mt-10 font-display text-2xl font-bold">Tracking & updates</h2>{order.shipment ? <div className="mt-4 border border-border p-5"><p className="font-semibold">{order.shipment.carrier ?? "Shipment"} · {order.shipment.status.replaceAll("_", " ")}</p>{order.shipment.awbNumber && <p className="mt-2 text-sm text-muted-foreground">AWB: {order.shipment.awbNumber}</p>}{order.shipment.trackingNumber && <p className="mt-1 text-sm text-muted-foreground">Tracking number: {order.shipment.trackingNumber}</p>}{order.shipment.estimatedDelivery && <p className="mt-1 text-sm text-muted-foreground">Estimated delivery: {new Date(order.shipment.estimatedDelivery).toLocaleDateString("en-IN")}</p>}{order.shipment.trackingUrl && <a href={order.shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex text-sm font-semibold text-brand-700 underline">Track shipment</a>}</div> : <p className="mt-3 text-sm text-muted-foreground">Shipment tracking will appear here once your order is dispatched.</p>}<ol className="mt-5 space-y-4 border-l border-brand-300 pl-5">{order.statusHistory.map((entry) => <li key={entry.id} className="relative"><span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-brand-600 ring-4 ring-background"/><p className="text-sm font-semibold">{entry.status.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString("en-IN")}{entry.notes ? ` · ${entry.notes}` : ""}</p></li>)}</ol><h2 className="mt-10 font-display text-2xl font-bold">Delivery address</h2><div className="mt-4 flex gap-3 text-sm leading-relaxed text-muted-foreground"><Package className="mt-1 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" /><p>{order.addressName}<br />{order.addressLine1}{order.addressLine2 && `, ${order.addressLine2}`}<br />{order.addressCity}, {order.addressState} {order.addressPincode}<br />{order.addressPhone}</p></div></section><aside className="h-fit border border-border bg-brand-50/60 p-6"><h2 className="font-display text-2xl font-bold">Summary</h2><div className="mt-6 space-y-3 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div><div className="flex justify-between"><span>Shipping</span><span>{order.shippingCharge ? formatPrice(order.shippingCharge) : "Free"}</span></div><div className="flex justify-between border-t border-border pt-3 text-base font-bold"><span>Total</span><span>{formatPrice(order.total)}</span></div></div><p className="mt-5 text-xs uppercase tracking-wider text-muted-foreground">Payment: {order.paymentMethod.replaceAll("_", " ")}</p></aside></div>
    </main>
  );
}
