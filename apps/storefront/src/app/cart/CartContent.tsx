"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadCart, removeCartItem, updateCartItem } from "@/store/cartSlice";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function CartContent() {
  const dispatch = useAppDispatch();
  const cart = useAppSelector((state) => state.cart);
  const isLoading = cart.isLoading;

  useEffect(() => { void dispatch(loadCart()); }, [dispatch]);

  async function updateItem(itemId: string, quantity: number) {
    const result = await dispatch(updateCartItem({ itemId, quantity }));
    if (updateCartItem.rejected.match(result)) toast({ title: "Cart update failed", description: "Please try again.", variant: "destructive" });
  }

  async function removeItem(itemId: string) {
    const result = await dispatch(removeCartItem(itemId));
    if (removeCartItem.rejected.match(result)) toast({ title: "Could not remove item", variant: "destructive" });
  }

  if (isLoading) return <div className="py-24 text-center text-muted-foreground">Loading your cart...</div>;
  if (!cart?.items.length) return <div className="border-y border-dashed border-border py-24 text-center"><ShoppingBag className="mx-auto h-10 w-10 text-brand-600" aria-hidden="true" /><h2 className="mt-5 font-display text-3xl font-bold">Your cart is empty</h2><p className="mt-3 text-muted-foreground">Start with something made for your everyday ritual.</p><Link href="/shop" className="mt-6 inline-block text-sm font-semibold text-brand-700">Explore the collection</Link></div>;

  return <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
    <div className="divide-y divide-border border-y border-border">
      {cart.items.map((item) => <div key={item.id} className="flex gap-4 py-5">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted"><Image src={getImageUrl(item.product.images[0]?.url)} alt={item.product.name} fill className="object-cover" sizes="96px" /></div>
        <div className="min-w-0 flex-1"><Link href={`/products/${item.product.slug}`} className="font-semibold hover:text-brand-700">{item.product.name.replace("[DEMO] ", "")}</Link><p className="mt-1 text-sm font-medium text-brand-700">{formatPrice(item.product.price)}</p><div className="mt-3 flex items-center gap-3"><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => void updateItem(item.id, Math.max(1, item.quantity - 1))} aria-label="Decrease quantity"><Minus className="h-3 w-3" /></Button><span className="w-4 text-center text-sm">{item.quantity}</span><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => void updateItem(item.id, item.quantity + 1)} aria-label="Increase quantity"><Plus className="h-3 w-3" /></Button></div></div>
        <button type="button" onClick={() => void removeItem(item.id)} className="self-start text-muted-foreground hover:text-destructive" aria-label={`Remove ${item.product.name}`}><Trash2 className="h-4 w-4" /></button>
      </div>)}
    </div>
    <aside className="h-fit border border-border bg-brand-50/60 p-6"><h2 className="font-display text-2xl font-bold">Order summary</h2><div className="mt-6 space-y-3 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(cart.subtotal)}</span></div><div className="flex justify-between"><span>Product savings</span><span className="text-brand-700">-{formatPrice(cart.discount)}</span></div><div className="flex justify-between"><span>Shipping</span><span>{cart.shippingCharge ? formatPrice(cart.shippingCharge) : "Free"}</span></div><div className="flex justify-between border-t border-border pt-3 text-base font-bold"><span>Total</span><span>{formatPrice(cart.total)}</span></div></div><Link href="/checkout" className="mt-6 flex h-11 w-full items-center justify-center rounded-lg bg-brand-600 px-6 text-sm font-semibold text-white hover:bg-brand-700">Proceed to checkout</Link></aside>
  </div>;
}
