"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Address } from "@dhanvantari/shared-types";
import { api, ApiError } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type CartSummary = {
  items: unknown[];
  subtotal: number;
  discount: number;
  shippingCharge: number;
  total: number;
};
type CartResponse = { data: { cart: CartSummary } };
type AddressesResponse = { data: { addresses: Address[] } };
type OrderResponse = {
  data: {
    orderId: string;
    orderNumber: string;
    total: number;
    razorpayOrderId?: string;
    dummyPayment?: boolean;
  };
};

type AddressForm = {
  label: "HOME" | "WORK" | "OTHER";
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
};

const emptyAddress: AddressForm = {
  label: "HOME",
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

function sessionHeaders(): HeadersInit {
  const sessionId = window.localStorage
    .getItem("dhanvantari-session-id")
    ?.trim();
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPincodeChecking, setIsPincodeChecking] = useState(false);
  const [isPincodeValid, setIsPincodeValid] = useState(false);

  function setFieldError(field: string, message: string) {
    setFieldErrors((current) => ({ ...current, [field]: message }));
  }

  function clearFieldError(field: string) {
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

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
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : "Could not load checkout.",
        );
      } finally {
        setIsLoading(false);
      }
    }
    void loadCheckout();
  }, [router]);

  function updateAddress(field: keyof AddressForm, value: string) {
    setAddressForm((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
    if (field === "pincode") {
      setIsPincodeValid(false);
      setAddressForm((current) => ({ ...current, city: "", state: "" }));
    }
  }

  useEffect(() => {
    if (!showAddressForm || addressForm.pincode.length !== 6) return;
    const timer = window.setTimeout(() => void lookupPincode(addressForm.pincode), 350);
    return () => window.clearTimeout(timer);
  }, [addressForm.pincode, showAddressForm]);

  async function lookupPincode(pincode: string): Promise<boolean> {
    if (!/^\d{6}$/.test(pincode)) {
      setIsPincodeValid(false);
      if (pincode.length > 0) setFieldError("pincode", "Enter a valid 6-digit pincode.");
      return false;
    }
    setIsPincodeChecking(true);
    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`,
      );
      const results = (await response.json()) as Array<{
        Status: string;
        PostOffice?: Array<{
          District?: string;
          State?: string;
          Block?: string;
        }>;
      }>;
      const office = results[0]?.PostOffice?.[0];
      if (results[0]?.Status !== "Success" || !office) {
        setIsPincodeValid(false);
        setFieldError("pincode", "This pincode was not found in India Post records.");
        return false;
      }
      setAddressForm((current) => ({
        ...current,
        city: office.District || office.Block || "",
        state: office.State || "",
      }));
      setIsPincodeValid(true);
      clearFieldError("pincode");
      return true;
    } catch {
      setIsPincodeValid(false);
      setFieldError("pincode", "Could not verify this pincode. Please try again.");
      return false;
    } finally {
      setIsPincodeChecking(false);
    }
  }

  async function createAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      if (!(await lookupPincode(addressForm.pincode))) return;
      const response = await api.post<{ data: { address: Address } }>(
        "/users/addresses",
        {
          ...addressForm,
          line2: addressForm.line2 || null,
          country: "India",
          isDefault: addresses.length === 0,
        },
      );
      setAddresses((current) => [...current, response.data.address]);
      setSelectedAddressId(response.data.address.id);
      setShowAddressForm(false);
      setAddressForm(emptyAddress);
      setIsPincodeValid(false);
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        const errors = requestError.data.errors as Record<string, string[]> | undefined;
        if (errors) setFieldErrors(Object.fromEntries(Object.entries(errors).map(([key, messages]) => [key, messages[0] ?? "Invalid value"])));
      }
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Could not save this address.",
      );
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
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Could not place your order.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading)
    return (
      <main className="section-container py-24 text-center text-muted-foreground">
        Loading checkout...
      </main>
    );
  if (!cart?.items.length)
    return (
      <main className="section-container py-24 text-center">
        <h1 className="section-heading">Your cart is empty</h1>
        <Link
          href="/shop"
          className="mt-6 inline-block text-sm font-semibold text-brand-700"
        >
          Return to shop
        </Link>
      </main>
    );

  return (
    <main className="section-container min-h-screen py-10 md:py-16">
      <Link
        href="/cart"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to cart
      </Link>
      <h1 className="section-heading mt-5">Checkout</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">
              Delivery address
            </h2>
            {addresses.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAddressForm((current) => !current)}
                className="text-sm font-semibold text-brand-700"
              >
                {showAddressForm ? "Use saved address" : "Add new address"}
              </button>
            )}
          </div>
          {!showAddressForm && addresses.length > 0 && (
            <div className="mt-5 grid gap-3">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={`flex cursor-pointer gap-3 border p-4 ${selectedAddressId === address.id ? "border-brand-600 bg-brand-50" : "border-border"}`}
                >
                  <input
                    type="radio"
                    name="address"
                    value={address.id}
                    checked={selectedAddressId === address.id}
                    onChange={() => setSelectedAddressId(address.id)}
                    className="mt-1 accent-brand-600"
                  />
                  <span className="text-sm leading-relaxed">
                    <strong className="block">{address.name}</strong>
                    {address.line1}
                    {address.line2 && `, ${address.line2}`}
                    <br />
                    {address.city}, {address.state} {address.pincode}
                    <br />
                    {address.phone}
                  </span>
                  {selectedAddressId === address.id && (
                    <Check
                      className="ml-auto h-5 w-5 text-brand-600"
                      aria-hidden="true"
                    />
                  )}
                </label>
              ))}
            </div>
          )}
          {showAddressForm && (
            <form
              onSubmit={createAddress}
              className="mt-5 grid gap-4 border border-border p-5 sm:grid-cols-2"
            >
              <div className="sm:col-span-2">
                <label
                  htmlFor="address-name"
                  className="mb-1 block text-sm font-medium"
                >
                  Full name
                </label>
                <input
                  id="address-name"
                  required
                  value={addressForm.name}
                  onChange={(event) =>
                    updateAddress("name", event.target.value)
                  }
                  aria-invalid={Boolean(fieldErrors.name)}
                  className="h-10 w-full rounded-lg border border-input px-3 text-sm"
                />
                {fieldErrors.name && <p className="mt-1 text-xs text-destructive">{fieldErrors.name}</p>}
              </div>
              <div>
                <label
                  htmlFor="address-phone"
                  className="mb-1 block text-sm font-medium"
                >
                  Phone
                </label>
                <input
                  id="address-phone"
                  required
                  pattern="[6-9][0-9]{9}"
                  value={addressForm.phone}
                  onChange={(event) =>
                    updateAddress("phone", event.target.value)
                  }
                  aria-invalid={Boolean(fieldErrors.phone)}
                  className="h-10 w-full rounded-lg border border-input px-3 text-sm"
                />
                {fieldErrors.phone && <p className="mt-1 text-xs text-destructive">{fieldErrors.phone}</p>}
              </div>
              <div>
                <label
                  htmlFor="address-pincode"
                  className="mb-1 block text-sm font-medium"
                >
                  Pincode
                </label>
                <input
                  id="address-pincode"
                  required
                  pattern="[0-9]{6}"
                  inputMode="numeric"
                  maxLength={6}
                  value={addressForm.pincode}
                  onChange={(event) =>
                    updateAddress(
                      "pincode",
                      event.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  onBlur={() => void lookupPincode(addressForm.pincode)}
                  aria-invalid={Boolean(fieldErrors.pincode)}
                  className="h-10 w-full rounded-lg border border-input px-3 text-sm"
                />
                {isPincodeChecking && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Checking pincode...
                  </span>
                )}
                {isPincodeValid && (
                  <span className="mt-1 block text-xs text-brand-700">
                    City and state verified
                  </span>
                )}
                {fieldErrors.pincode && <p className="mt-1 text-xs text-destructive">{fieldErrors.pincode}</p>}
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="address-line1"
                  className="mb-1 block text-sm font-medium"
                >
                  Address
                </label>
                <input
                  id="address-line1"
                  required
                  minLength={5}
                  value={addressForm.line1}
                  onChange={(event) =>
                    updateAddress("line1", event.target.value)
                  }
                  aria-invalid={Boolean(fieldErrors.line1)}
                  className="h-10 w-full rounded-lg border border-input px-3 text-sm"
                />
                {fieldErrors.line1 && <p className="mt-1 text-xs text-destructive">{fieldErrors.line1}</p>}
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="address-line2"
                  className="mb-1 block text-sm font-medium"
                >
                  Apartment, landmark{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <input
                  id="address-line2"
                  value={addressForm.line2}
                  onChange={(event) =>
                    updateAddress("line2", event.target.value)
                  }
                  className="h-10 w-full rounded-lg border border-input px-3 text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="address-city"
                  className="mb-1 block text-sm font-medium"
                >
                  City
                </label>
                <input
                  id="address-city"
                  required
                  readOnly
                  value={addressForm.city}
                  placeholder="Enter a valid pincode first"
                  className="h-10 w-full rounded-lg border border-input bg-muted px-3 text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="address-state"
                  className="mb-1 block text-sm font-medium"
                >
                  State
                </label>
                <input
                  id="address-state"
                  required
                  readOnly
                  value={addressForm.state}
                  placeholder="Enter a valid pincode first"
                  className="h-10 w-full rounded-lg border border-input bg-muted px-3 text-sm"
                />
              </div>
              <Button
                type="submit"
                disabled={isPincodeChecking || !isPincodeValid}
                className="sm:col-span-2 bg-brand-600 text-white hover:bg-brand-700"
                isLoading={isSubmitting}
              >
                Save address
              </Button>
            </form>
          )}
          <div className="mt-10 border-t border-border pt-8">
            <h2 className="font-display text-2xl font-bold">Payment method</h2>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("COD")}
                className={`flex w-full items-center gap-3 border p-4 text-left text-sm ${paymentMethod === "COD" ? "border-brand-600 bg-brand-50" : "border-border bg-white"}`}
              >
                <MapPin className="h-5 w-5 text-brand-600" aria-hidden="true" />
                <span>
                  <strong className="block">Cash on delivery</strong>Pay when
                  your order arrives.
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("RAZORPAY")}
                className={`flex w-full items-center gap-3 border p-4 text-left text-sm ${paymentMethod === "RAZORPAY" ? "border-brand-600 bg-brand-50" : "border-border bg-white"}`}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                  R
                </span>
                <span>
                  <strong className="block">Dummy Razorpay</strong>Test payment
                  mode for local development.
                </span>
              </button>
            </div>
          </div>
          {error && (
            <p role="alert" className="mt-6 text-sm text-destructive">
              {error}
            </p>
          )}
        </section>
        <aside className="h-fit border border-border bg-brand-50/60 p-6">
          <h2 className="font-display text-2xl font-bold">Order summary</h2>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Savings</span>
              <span className="text-brand-700">
                -{formatPrice(cart.discount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>
                {cart.shippingCharge
                  ? formatPrice(cart.shippingCharge)
                  : "Free"}
              </span>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
              <span>Total</span>
              <span>{formatPrice(cart.total)}</span>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => void placeOrder()}
            disabled={showAddressForm || !selectedAddressId}
            isLoading={isSubmitting}
            className="mt-6 w-full bg-brand-600 text-white hover:bg-brand-700"
          >
            {paymentMethod === "RAZORPAY"
              ? "Pay with Dummy Razorpay"
              : "Place COD order"}
          </Button>
        </aside>
      </div>
    </main>
  );
}
