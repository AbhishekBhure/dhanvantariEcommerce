"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/store/hooks";
import { addCartItem, openCart } from "@/store/cartSlice";
import { toast } from "@/hooks/use-toast";

export default function AddToCartButton({ productId, disabled }: { productId: string; disabled?: boolean }) {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);

  async function handleAdd() {
    setIsLoading(true);
    try {
      const result = await dispatch(addCartItem({ productId, quantity: 1 }));
      if (addCartItem.rejected.match(result)) throw new Error(result.payload as string ?? "Please try again.");
      dispatch(openCart());
      toast({ title: "Added to cart", description: "Your product is ready for checkout." });
    } catch (error) {
      toast({
        title: "Could not add product",
        description: error instanceof Error ? error.message : "Please try again.",
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
