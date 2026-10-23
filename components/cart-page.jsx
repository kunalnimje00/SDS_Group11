"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBasket, Trash2, Utensils } from "lucide-react";
import { useKantin } from "@/app/providers";
import { formatINR } from "@/lib/format";
import { EmptyState, PageHeading, FoodPlaceholder } from "./ui";

export function CartPage() {
  const { cart, hydrated, setQuantity, removeItem, cafes, menuItems } = useKantin();

  if (!hydrated) {
    return (
      <div className="page-stack">
        <div className="skeleton-block" />
        <div className="skeleton-block skeleton-block-short" />
      </div>
    );
  }

  const cafe = cafes.find((c) => c.id === cart.cafeId);
  const lines = Object.entries(cart.quantities)
    .map(([itemId, quantity], index) => ({
      item: menuItems.find((entry) => entry.id === itemId),
      quantity,
      index,
    }))
    .filter((line) => line.item);

  const subtotal = lines.reduce((sum, line) => sum + line.item.price_paise * line.quantity, 0);

  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="YOUR SELECTION"
        title="My cart"
        description="One canteen per order. Review your meal items and proceed to checkout."
      />

      {!lines.length ? (
        <EmptyState
          icon={ShoppingBasket}
          title="Your cart is empty"
          description="Add delicious items from the campus menu to begin your order."
          action={
            <Link href="/cafes" className="button button-primary">
              Browse canteens <Utensils size={16} />
            </Link>
          }
        />
      ) : (
        <div className="cart-layout">
          <section className="cart-lines-panel">
            <div className="cart-cafe-heading">
              <div className="cart-cafe-icon">
                <Utensils size={17} />
              </div>
              <div>
                <span className="tiny-label">ORDERING FROM</span>
                <strong>{cafe?.name || "Campus Cafe"}</strong>
              </div>
            </div>
            <div className="cart-lines">
              {lines.map(({ item, quantity, index }) => (
                <article className="cart-line" key={item.id}>
                  <FoodPlaceholder name={item.name} index={index} small />
                  <div className="cart-line-info">
                    <h3>{item.name}</h3>
                    <p>{formatINR(item.price_paise)} each</p>
                    <button
                      type="button"
                      className="remove-link"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                  <div className="cart-line-controls">
                    <div className="quantity-control" aria-label={`Quantity for ${item.name}`}>
                      <button
                        type="button"
                        aria-label={`Remove one ${item.name}`}
                        onClick={() => setQuantity(item.id, quantity - 1)}
                      >
                        <Minus size={13} />
                      </button>
                      <span aria-live="polite">{quantity}</span>
                      <button
                        type="button"
                        aria-label={`Add one ${item.name}`}
                        onClick={() => setQuantity(item.id, quantity + 1)}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <strong>{formatINR(item.price_paise * quantity)}</strong>
                  </div>
                </article>
              ))}
            </div>
            <Link className="add-more-link" href={`/cafes/${cafe?.id || ""}`}>
              <Plus size={15} /> Add another item from this cafe
            </Link>
          </section>

          <aside className="summary-card">
            <p className="eyebrow">ORDER SUMMARY</p>
            <h2>Good choice.</h2>
            <div className="summary-row">
              <span>Items subtotal</span>
              <strong>{formatINR(subtotal)}</strong>
            </div>
            <div className="summary-row">
              <span>Campus destination</span>
              <span className="muted-value">Choose next</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-row summary-total">
              <span>Total amount</span>
              <strong>{formatINR(subtotal)}</strong>
            </div>
            <Link href="/checkout" className="button button-primary button-full">
              Review checkout <span>→</span>
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
