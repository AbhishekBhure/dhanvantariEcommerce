"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Address } from "@dhanvantari/shared-types";
import { api, ApiError } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type CartSummary = { items: unknown[]; subtotal: number; discount: number; shippingCharge: number; total: number };
type CartResponse = { data: { cart: CartSummary } };
type AddressesResponse = { data: { addresses: Address[] } };
type OrderResponse = { data: { orderId: string; orderNumber: string; total: number; razorpayOrderId?: string; dummyPayment?: boolean } };

type AddressForm = {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
};

const emptyAddress: AddressForm = { name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" };

function sessionHeaders(): HeadersInit {
  const sessionId = window.localStorage.getItem("dhanvantari-session-id")?.trim();
  return sessionId ? { "x-session-id": sessionId } : {};
}

export default function CheckoutPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "RAZORPAY">("COD");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCheckout() {
      try {
        const [addressResponse, cartResponse] = await Promise.all([
          api.get<AddressesResponse>("/users/addresses"),
          api.get<CartResponse>("/cart", { headers: sessionHeaders() }),
        ]);
        setAddresses(addressResponse.data.addresses);
        setSelectedAddressId(addressResponse.data.addresses[0]?.id ?? "");
        setCart(cartResponse.data.cart);
        if (!addressResponse.data.addresses.length) setShowAddressForm(true);
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.status === 401) {
          router.replace("/login");
          return;
        }
        setError(requestError instanceof ApiError ? requestError.message : "Could not load checkout.");
      } finally {
        setIsLoading(false);
      }
    }
    void loadCheckout();
  }, [router]);

  function updateAddress(field: keyof AddressForm, value: string) {
    setAddressForm((current) => ({ ...current, [field]: value }));
  }

  async function createAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await api.post<{ data: { address: Address } }>("/users/addresses", { ...addressForm, country: "India", isDefault: addresses.length === 0 });
      setAddresses((current) => [...current, response.data.address]);
      setSelectedAddressId(response.data.address.id);
      setShowAddressForm(false);
      setAddressForm(emptyAddress);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Could not save this address.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function placeOrder() {
    if (!selectedAddressId) {
      setError("Select or add a delivery address.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const response = await api.post<OrderResponse>("/orders", {
        addressId: selectedAddressId,
        paymentMethod,
      });

      if (paymentMethod === "RAZORPAY" && response.data.razorpayOrderId) {
        const mockPaymentId = `pay_dummy_${Date.now()}`;
        const mockSignature = `dummy_${response.data.razorpayOrderId}_${mockPaymentId}`;

        await api.post("/payment/verify", {
          orderId: response.data.orderId,
          razorpayOrderId: response.data.razorpayOrderId,
          razorpayPaymentId: mockPaymentId,
          razorpaySignature: mockSignature,
        });
      }

      router.push(`/order-confirmation/${response.data.orderNumber}`);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Could not place your order.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <main className="section-container py-24 text-center text-muted-foreground">Loading checkout...</main>;
  if (!cart?.items.length) return <main className="section-container py-24 text-center"><h1 className="section-heading">Your cart is empty</h1><Link href="/shop" className="mt-6 inline-block text-sm font-semibold text-brand-700">Return to shop</Link></main>;

  return <main className="section-container min-h-screen py-10 md:py-16">
    <Link href="/cart" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-700"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to cart</Link>
    <h1 className="section-heading mt-5">Checkout</h1>
    <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
      <section>
        <div className="flex items-center justify-between"><h2 className="font-display text-2xl font-bold">Delivery address</h2>{addresses.length > 0 && <button type="button" onClick={() => setShowAddressForm((current) => !current)} className="text-sm font-semibold text-brand-700">{showAddressForm ? "Use saved address" : "Add new address"}</button>}</div>
        {!showAddressForm && addresses.length > 0 && <div className="mt-5 grid gap-3">{addresses.map((address) => <label key={address.id} className={`flex cursor-pointer gap-3 border p-4 ${selectedAddressId === address.id ? "border-brand-600 bg-brand-50" : "border-border"}`}><input type="radio" name="address" value={address.id} checked={selectedAddressId === address.id} onChange={() => setSelectedAddressId(address.id)} className="mt-1 accent-brand-600" /><span className="text-sm leading-relaxed"><strong className="block">{address.name}</strong>{address.line1}{address.line2 && `, ${address.line2}`}<br />{address.city}, {address.state} {address.pincode}<br />{address.phone}</span>{selectedAddressId === address.id && <Check className="ml-auto h-5 w-5 text-brand-600" aria-hidden="true" />}</label>)}</div>}
        {showAddressForm && <form onSubmit={createAddress} className="mt-5 grid gap-4 border border-border p-5 sm:grid-cols-2"><div className="sm:col-span-2"><label htmlFor="address-name" className="mb-1 block text-sm font-medium">Full name</label><input id="address-name" required value={addressForm.name} onChange={(event) => updateAddress("name", event.target.value)} className="h-10 w-full rounded-lg border border-input px-3 text-sm" /></div><div><label htmlFor="address-phone" className="mb-1 block text-sm font-medium">Phone</label><input id="address-phone" required pattern="[6-9][0-9]{9}" value={addressForm.phone} onChange={(event) => updateAddress("phone", event.target.value)} className="h-10 w-full rounded-lg border border-input px-3 text-sm" /></div><div><label htmlFor="address-pincode" className="mb-1 block text-sm font-medium">Pincode</label><input id="address-pincode" required pattern="[0-9]{6}" value={addressForm.pincode} onChange={(event) => updateAddress("pincode", event.target.value)} className="h-10 w-full rounded-lg border border-input px-3 text-sm" /></div><div className="sm:col-span-2"><label htmlFor="address-line1" className="mb-1 block text-sm font-medium">Address</label><input id="address-line1" required minLength={5} value={addressForm.line1} onChange={(event) => updateAddress("line1", event.target.value)} className="h-10 w-full rounded-lg border border-input px-3 text-sm" /></div><div className="sm:col-span-2"><label htmlFor="address-line2" className="mb-1 block text-sm font-medium">Apartment, landmark <span className="font-normal text-muted-foreground">(optional)</span></label><input id="address-line2" value={addressForm.line2} onChange={(event) => updateAddress("line2", event.target.value)} className="h-10 w-full rounded-lg border border-input px-3 text-sm" /></div><div><label htmlFor="address-city" className="mb-1 block text-sm font-medium">City</label><input id="address-city" required value={addressForm.city} onChange={(event) => updateAddress("city", event.target.value)} className="h-10 w-full rounded-lg border border-input px-3 text-sm" /></div><div><label htmlFor="address-state" className="mb-1 block text-sm font-medium">State</label><input id="address-state" required value={addressForm.state} onChange={(event) => updateAddress("state", event.target.value)} className="h-10 w-full rounded-lg border border-input px-3 text-sm" /></div><Button type="submit" className="sm:col-span-2 bg-brand-600 text-white hover:bg-brand-700" isLoading={isSubmitting}>Save address</Button></form>}
        <div className="mt-10 border-t border-border pt-8"><h2 className="font-display text-2xl font-bold">Payment method</h2><div className="mt-4 space-y-3">
          <button type="button" onClick={() => setPaymentMethod("COD")} className={`flex w-full items-center gap-3 border p-4 text-left text-sm ${paymentMethod === "COD" ? "border-brand-600 bg-brand-50" : "border-border bg-white"}`}>
            <MapPin className="h-5 w-5 text-brand-600" aria-hidden="true" />
            <span><strong className="block">Cash on delivery</strong>Pay when your order arrives.</span>
          </button>
          <button type="button" onClick={() => setPaymentMethod("RAZORPAY")} className={`flex w-full items-center gap-3 border p-4 text-left text-sm ${paymentMethod === "RAZORPAY" ? "border-brand-600 bg-brand-50" : "border-border bg-white"}`}>
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">R</span>
            <span><strong className="block">Dummy Razorpay</strong>Test payment mode for local development.</span>
          </button>
        </div></div>
        {error && <p role="alert" className="mt-6 text-sm text-destructive">{error}</p>}
      </section>
      <aside className="h-fit border border-border bg-brand-50/60 p-6"><h2 className="font-display text-2xl font-bold">Order summary</h2><div className="mt-6 space-y-3 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(cart.subtotal)}</span></div><div className="flex justify-between"><span>Savings</span><span className="text-brand-700">-{formatPrice(cart.discount)}</span></div><div className="flex justify-between"><span>Shipping</span><span>{cart.shippingCharge ? formatPrice(cart.shippingCharge) : "Free"}</span></div><div className="flex justify-between border-t border-border pt-3 text-base font-bold"><span>Total</span><span>{formatPrice(cart.total)}</span></div></div><Button type="button" onClick={() => void placeOrder()} disabled={showAddressForm || !selectedAddressId} isLoading={isSubmitting} className="mt-6 w-full bg-brand-600 text-white hover:bg-brand-700">{paymentMethod === "RAZORPAY" ? "Pay with Dummy Razorpay" : "Place COD order"}</Button></aside>
    </div>
  </main>;
}
