"use client";

import { Plus, Clock3, Check } from "lucide-react";
import { useKantin } from "@/app/providers";
import { formatINR } from "@/lib/format";
import { FoodPlaceholder } from "./ui";

export function MenuItemCard({ item, index = 0, compact = false }) {
  const { cart, addItem } = useKantin();
  const quantity = cart.cafeId === item.cafe_id ? cart.quantities[item.id] || 0 : 0;

  return (
    <article className={`menu-item-card ${compact ? "menu-item-card-compact" : ""}`}>
      <div className="menu-item-media">
        <FoodPlaceholder name={item.name} index={index} small={compact} />
        <span className={`availability-tag ${item.is_available ? "availability-yes" : "availability-no"}`}>
          <span className="availability-dot" />
          {item.is_available ? "Available" : "Unavailable"}
        </span>
      </div>
      <div className="menu-item-content">
        <div className="menu-item-title-row">
          <h3>{item.name}</h3>
          <span className="menu-item-price">{formatINR(item.price_paise)}</span>
        </div>
        <p className="menu-item-description">{item.description || "Menu description not provided."}</p>
        <div className="menu-item-bottom">
          <span className="prep-time">
            <Clock3 size={14} aria-hidden="true" /> {item.prep_minutes} min prep
          </span>
          <button
            type="button"
            className={`add-button ${quantity ? "add-button-added" : ""}`}
            disabled={!item.is_available}
            onClick={() => addItem(item.cafe_id, item.id)}
            aria-label={
              quantity
                ? `${item.name}, ${quantity} in cart. Add one more`
                : `Add ${item.name} to cart`
            }
          >
            {quantity ? (
              <>
                <Check size={14} />
                <span>{quantity} in cart</span>
                <Plus size={14} />
              </>
            ) : (
              <>
                <span>Add</span>
                <Plus size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
