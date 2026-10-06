"use client";

import { FormEvent, useState } from "react";
import type { UserPublic } from "@dhanvantari/shared-types";
import { api, ApiError } from "@/lib/api";
import { setUser } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { Button } from "@/components/ui/button";

export default function ProfileEditor({ user }: { user: UserPublic }) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); setLoading(true);
    try {
      const response = await api.patch<{ data: { user: UserPublic } }>("/users/profile", { name: name.trim(), phone: phone || null });
      dispatch(setUser({ ...user, ...response.data.user }));
      setMessage("Profile updated.");
    } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "Could not update your profile."); }
    finally { setLoading(false); }
  }

  return <section className="mt-8 border border-border p-6"><h2 className="font-display text-2xl font-bold">Profile details</h2><p className="mt-2 text-sm text-muted-foreground">{user.email}</p><form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Full name<input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="mt-1 h-10 w-full border border-input px-3 text-sm" /></label><label className="text-sm font-medium">Mobile number<input type="tel" inputMode="numeric" autoComplete="tel-national" pattern="[6-9][0-9]{9}" maxLength={10} value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))} className="mt-1 h-10 w-full border border-input px-3 text-sm" /></label><div className="sm:col-span-2 flex flex-wrap items-center gap-4"><Button type="submit" isLoading={loading}>Save profile</Button>{message && <span role="status" className="text-sm text-brand-700">{message}</span>}{error && <span role="alert" className="text-sm text-destructive">{error}</span>}</div></form></section>;
}
