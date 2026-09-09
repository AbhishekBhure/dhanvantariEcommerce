"use client";

import { FormEvent, useEffect, useState } from "react";
import { LocateFixed, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import type { Address } from "@dhanvantari/shared-types";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";

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

const emptyForm: AddressForm = {
  label: "HOME",
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};
const labelNames: Record<AddressForm["label"], string> = {
  HOME: "Home",
  WORK: "Work",
  OTHER: "Other",
};

function formFromAddress(address: Address): AddressForm {
  return {
    label: address.label,
    name: address.name,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    state: address.state,
    pincode: address.pincode,
  };
}

export default function AddressBook() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [isPincodeChecking, setIsPincodeChecking] = useState(false);
  const [isPincodeValid, setIsPincodeValid] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadAddresses();
  }, []);

  async function loadAddresses() {
    try {
      const response = await api.get<{ data: { addresses: Address[] } }>(
        "/users/addresses",
      );
      setAddresses(response.data.addresses);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Could not load addresses.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function update(field: keyof AddressForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === "pincode") {
      setIsPincodeValid(false);
      setError("");
      setForm((current) => ({ ...current, city: "", state: "" }));
    }
  }
  useEffect(() => {
    if (!isOpen || form.pincode.length !== 6) return;
    const timer = window.setTimeout(
      () => void verifyPincode(form.pincode, true),
      350,
    );
    return () => window.clearTimeout(timer);
  }, [form.pincode, isOpen]);

  async function verifyPincode(
    value: string,
    fillLocation = true,
  ): Promise<boolean> {
    if (!/^\d{6}$/.test(value)) {
      setIsPincodeValid(false);
      return false;
    }
    setIsPincodeChecking(true);
    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${value}`,
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
        setError("This pincode was not found in India Post records.");
        return false;
      }
      if (fillLocation)
        setForm((current) => ({
          ...current,
          city: office.District || office.Block || current.city,
          state: office.State || current.state,
        }));
      setError("");
      setIsPincodeValid(true);
      return true;
    } catch {
      setIsPincodeValid(false);
      setError("Could not verify this pincode. Please try again.");
      return false;
    } finally {
      setIsPincodeChecking(false);
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Location is not supported by this browser.");
      return;
    }
    setIsLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&addressdetails=1`,
          );
          if (!response.ok)
            throw new Error("Could not identify this location.");
          const data = (await response.json()) as {
            display_name?: string;
            address?: Record<string, string>;
          };
          const address = data.address ?? {};
          const line = [
            address.house_number,
            address.road,
            address.neighbourhood,
          ]
            .filter(Boolean)
            .join(", ");
          setForm((current) => ({
            ...current,
            line1:
              line ||
              data.display_name?.split(",").slice(0, 2).join(", ") ||
              current.line1,
            city:
              address.city || address.town || address.village || current.city,
            state: address.state || current.state,
            pincode: address.postcode || current.pincode,
          }));
          setMessage(
            "Location found. Please review the address before saving.",
          );
        } catch (locationError) {
          setError(
            locationError instanceof Error
              ? locationError.message
              : "Could not identify this location.",
          );
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setError(
          "Location permission was denied. You can enter the address manually.",
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      if (!(await verifyPincode(form.pincode, true))) {
        setError("Enter a valid Indian pincode.");
        return;
      }
      const payload = {
        ...form,
        line2: form.line2 || null,
        country: "India",
        isDefault:
          addresses.length === 0 ||
          addresses.every((address) => !address.isDefault),
      };
      const response = editingId
        ? await api.put<{ data: { address: Address } }>(
            `/users/addresses/${editingId}`,
            payload,
          )
        : await api.post<{ data: { address: Address } }>(
            "/users/addresses",
            payload,
          );
      setAddresses((current) =>
        editingId
          ? current.map((address) =>
              address.id === editingId ? response.data.address : address,
            )
          : [...current, response.data.address],
      );
      setForm(emptyForm);
      setEditingId(null);
      setIsOpen(false);
      setMessage("Address saved.");
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Could not save this address.",
      );
    }
  }

  async function remove(address: Address) {
    if (!window.confirm("Remove this saved address?")) return;
    try {
      await api.delete(`/users/addresses/${address.id}`);
      setAddresses((current) =>
        current.filter((item) => item.id !== address.id),
      );
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Could not remove this address.",
      );
    }
  }

  if (isLoading)
    return (
      <div className="mt-10 text-sm text-muted-foreground">
        Loading saved addresses...
      </div>
    );

  return (
    <section className="mt-10 border-t border-border pt-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
            Delivery details
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold">
            Saved addresses
          </h2>
        </div>
        <Button
          type="button"
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setIsOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add address
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}
      {message && <p className="mt-4 text-sm text-brand-700">{message}</p>}
      {!addresses.length && (
        <p className="mt-5 text-sm text-muted-foreground">
          Add a delivery address for faster checkout.
        </p>
      )}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {addresses.map((address) => (
          <article key={address.id} className="border border-border p-5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                <MapPin className="h-4 w-4 text-brand-600" />
                {labelNames[address.label]}
                {address.isDefault && (
                  <span className="text-xs font-normal text-muted-foreground">
                    Default
                  </span>
                )}
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setForm(formFromAddress(address));
                    setEditingId(address.id);
                    setIsOpen(true);
                  }}
                  aria-label={`Edit ${labelNames[address.label]} address`}
                  className="text-muted-foreground hover:text-brand-700"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void remove(address)}
                  aria-label={`Remove ${labelNames[address.label]} address`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed">
              <strong className="block">{address.name}</strong>
              {address.line1}
              {address.line2 && `, ${address.line2}`}
              <br />
              {address.city}, {address.state} {address.pincode}
              <br />
              {address.phone}
            </p>
          </article>
        ))}
      </div>
      {isOpen && (
        <div className="mt-6 border border-brand-200 bg-brand-50/40 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {editingId ? "Edit address" : "Add a new address"}
            </h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-sm text-muted-foreground"
            >
              Cancel
            </button>
          </div>
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={isLocating}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700"
          >
            <LocateFixed className="h-4 w-4" />
            {isLocating ? "Finding your location..." : "Use current location"}
          </button>
          <form onSubmit={save} className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2 text-sm font-medium">
              Save address as
              <select
                value={form.label}
                onChange={(event) => update("label", event.target.value)}
                className="mt-1 h-10 w-full border border-input bg-white px-3 text-sm"
              >
                <option value="HOME">Home</option>
                <option value="WORK">Work</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <label className="sm:col-span-2 text-sm font-medium">
              Full name
              <input
                required
                minLength={2}
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                className="mt-1 h-10 w-full border border-input px-3 text-sm"
              />
            </label>
            <label className="text-sm font-medium">
              Phone
              <input
                required
                pattern="[6-9][0-9]{9}"
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                className="mt-1 h-10 w-full border border-input px-3 text-sm"
              />
            </label>
            <label className="text-sm font-medium">
              Pincode
              <input
                required
                pattern="[0-9]{6}"
                inputMode="numeric"
                maxLength={6}
                value={form.pincode}
                onChange={(event) => update("pincode", event.target.value.replace(/\D/g, "").slice(0, 6))}
                className="mt-1 h-10 w-full border border-input px-3 text-sm"
              />
            </label>
            <label className="sm:col-span-2 text-sm font-medium">
              Flat, house number, building
              <input
                required
                minLength={5}
                value={form.line1}
                onChange={(event) => update("line1", event.target.value)}
                className="mt-1 h-10 w-full border border-input px-3 text-sm"
              />
            </label>
            <label className="sm:col-span-2 text-sm font-medium">
              Apartment, landmark{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
              <input
                value={form.line2}
                onChange={(event) => update("line2", event.target.value)}
                className="mt-1 h-10 w-full border border-input px-3 text-sm"
              />
            </label>
            <label className="text-sm font-medium">
              City
              <input
                required
                readOnly
                value={form.city}
                placeholder="Enter a valid pincode first"
                className="mt-1 h-10 w-full border border-input bg-muted px-3 text-sm"
              />
            </label>
            <label className="text-sm font-medium">
              State
              <input
                required
                readOnly
                value={form.state}
                placeholder="Enter a valid pincode first"
                className="mt-1 h-10 w-full border border-input bg-muted px-3 text-sm"
              />
            </label>
            <Button
              type="submit"
              disabled={isPincodeChecking || !isPincodeValid}
              className="sm:col-span-2"
            >
              {isPincodeChecking ? "Checking pincode..." : "Save address"}
            </Button>
          </form>
        </div>
      )}
    </section>
  );
}
