import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Star } from "lucide-react";
import type { ProductListItem } from "@dhanvantari/shared-types";
import { formatPrice, calculateDiscount, getImageUrl, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: ProductListItem;
  onAddToCart?: (productId: string) => void;
  isAddingToCart?: boolean;
  className?: string;
}

export default function ProductCard({
  product,
  onAddToCart,
  isAddingToCart = false,
  className,
}: ProductCardProps) {
  const discountPercent = calculateDiscount(product.mrp, product.price);
  const isOutOfStock = product.stock === 0;

  return (
    <article
      className={cn("product-card group", className)}
      aria-label={`Product: ${product.name}`}
    >
      {/* Image container */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Link href={`/products/${product.slug}`} tabIndex={-1} aria-hidden="true">
          <Image
            src={getImageUrl(product.primaryImage)}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            loading="lazy"
          />
        </Link>

        {/* Badges */}
        {product.isNew && !product.isBestseller && (
          <span className="badge-new" aria-label="New product">New</span>
        )}
        {product.isBestseller && (
          <span className="badge-bestseller" aria-label="Bestseller">Bestseller</span>
        )}
        {discountPercent > 0 && (
          <span className="absolute top-3 right-3 bg-destructive text-white text-xs font-bold px-2 py-1 rounded-full">
            -{discountPercent}%
          </span>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <span className="text-sm font-semibold text-muted-foreground bg-background px-3 py-1 rounded-full border">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        {product.categories[0] && (
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {product.categories[0].name.replace("[DEMO] ", "")}
          </p>
        )}

        {/* Name */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-sm text-foreground leading-snug mb-2 hover:text-brand-700 transition-colors line-clamp-2">
            {product.name.replace("[DEMO] ", "")}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="price-current">{formatPrice(product.price)}</span>
          {discountPercent > 0 && (
            <>
              <span className="price-mrp">{formatPrice(product.mrp)}</span>
              <span className="price-discount">{discountPercent}% off</span>
            </>
          )}
        </div>

        {/* Add to cart */}
        {onAddToCart && (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-brand-600 text-brand-700 hover:bg-brand-600 hover:text-white transition-all"
            onClick={() => onAddToCart(product.id)}
            disabled={isOutOfStock || isAddingToCart}
            isLoading={isAddingToCart}
            aria-label={
              isOutOfStock
                ? `${product.name} — out of stock`
                : `Add ${product.name} to cart`
            }
          >
            {!isAddingToCart && <ShoppingCart className="w-4 h-4 mr-2" aria-hidden="true" />}
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </Button>
        )}
      </div>
    </article>
  );
}

// Skeleton loader for product card
export function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden" aria-hidden="true">
      <div className="aspect-square skeleton" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-6 w-24 rounded" />
        <div className="skeleton h-9 w-full rounded-md" />
      </div>
    </div>
  );
}
