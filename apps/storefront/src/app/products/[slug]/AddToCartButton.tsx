"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { useAppDispatch } from "@/store/hooks";
import { openCart, setCart } from "@/store/cartSlice";
import { toast } from "@/hooks/use-toast";

export default function AddToCartButton({ productId, disabled }: { productId: string; disabled?: boolean }) {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);

  async function handleAdd() {
    setIsLoading(true);
    try {
      const storedSessionId = window.localStorage.getItem("dhanvantari-session-id");
      const sessionId = storedSessionId?.trim() || crypto.randomUUID();
      window.localStorage.setItem("dhanvantari-session-id", sessionId);
      await api.post<{ success: boolean }>(
        "/cart/items",
        { productId, quantity: 1 },
        { headers: { "x-session-id": sessionId } },
      );
      const cartResponse = await api.get<{ data: { cart: Parameters<typeof setCart>[0] } }>(
        "/cart",
        { headers: { "x-session-id": sessionId } },
      );
      dispatch(setCart(cartResponse.data.cart));
      dispatch(openCart());
      toast({ title: "Added to cart", description: "Your product is ready for checkout." });
    } catch (error) {
      toast({
        title: "Could not add product",
        description: error instanceof ApiError ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button size="lg" className="w-full bg-brand-600 text-white hover:bg-brand-700" onClick={handleAdd} disabled={disabled || isLoading} isLoading={isLoading}>
      {!isLoading && <ShoppingCart className="mr-2 h-5 w-5" aria-hidden="true" />}
      {disabled ? "Out of stock" : "Add to cart"}
    </Button>
  );
}
