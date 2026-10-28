"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Clock3, Search, UtensilsCrossed, RefreshCw } from "lucide-react";
import { useKantin } from "@/app/kantin-context";
import { supabase } from "@/lib/supabase";
import { MenuItemCard } from "./menu-item-card";
import { EmptyState, PageHeading } from "./ui";

export function CafeMenuPage() {
  const params = useParams();
  const { cafes, menuItems, refreshCafesAndMenu } = useKantin();
  const cafeId = String(params.cafeId || "");

  // Resolve cafe
  const [activeCafe, setActiveCafe] = useState(() => cafes.find((c) => c.id === cafeId) || null);
  const [dbItems, setDbItems] = useState([]);
  const [loading, setLoading] = useState(!activeCafe);
  const [query, setQuery] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);

  // Keep activeCafe in sync with cafes or fetch from Supabase
  useEffect(() => {
    const found = cafes.find((c) => c.id === cafeId);
    if (found) {
      setActiveCafe(found);
      setLoading(false);
      return;
    }

    if (supabase && cafeId) {
      supabase
        .from("cafes")
        .select("*")
        .eq("id", cafeId)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!error && data) {
            setActiveCafe({
              ...data,
              hours: [
                "Mon–Fri · 08:00–20:00",
                "Sat · 09:00–16:00",
              ],
            });
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [cafeId, cafes]);

  // Fetch real-time menu items from Supabase for this cafe
  const fetchCafeMenu = useCallback(async () => {
    if (!supabase || !cafeId) return;
    try {
      // 1. Try get_cafe_menu RPC
      const { data: rpcData, error: rpcErr } = await supabase.rpc("get_cafe_menu", {
        p_cafe_id: cafeId,
      });
      if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
        setDbItems(rpcData);
        return;
      }

      // 2. Try direct table query
      const { data: tblData, error: tblErr } = await supabase
        .from("menu_items")
        .select("*")
        .eq("cafe_id", cafeId);
      if (!tblErr && Array.isArray(tblData) && tblData.length > 0) {
        setDbItems(tblData);
      }
    } catch (err) {
      console.warn("Could not fetch remote menu for cafe:", err);
    }
  }, [cafeId]);

  useEffect(() => {
    fetchCafeMenu();
    const interval = setInterval(fetchCafeMenu, 15000);
    return () => clearInterval(interval);
  }, [fetchCafeMenu]);

  // Merge items: dbItems + context items for this cafe
  const cafe = activeCafe || cafes.find((c) => c.id === cafeId) || (cafes.length === 1 ? cafes[0] : null);

  const matchedItems = [
    ...dbItems,
    ...menuItems.filter((item) => item.cafe_id === cafeId || item.cafe_id === cafe?.id),
  ];

  // Deduplicate by ID
  const itemMap = new Map();
  matchedItems.forEach((it) => itemMap.set(it.id, it));
  let allItems = Array.from(itemMap.values());

  // If no items are explicitly tagged with this cafe ID yet, fallback to available menu items
  if (allItems.length === 0 && menuItems.length > 0) {
    allItems = menuItems.map((it) => ({ ...it, cafe_id: cafe?.id || cafeId }));
  }

  const normalized = query.trim().toLowerCase();
  const filteredItems = allItems.filter(
    (item) =>
      (!availableOnly || item.is_available) &&
      `${item.name} ${item.description || ""}`.toLowerCase().includes(normalized)
  );

  if (loading) {
    return (
      <div className="page-stack">
        <div className="skeleton-card" style={{ height: 180 }} />
      </div>
    );
  }

  if (!cafe) {
    return (
      <div className="page-stack">
        <EmptyState
          icon={UtensilsCrossed}
          title="Cafe not found"
          description="The selected cafe could not be located."
          action={
            <Link href="/cafes" className="button button-secondary">
              Browse canteens
            </Link>
          }
        />
      </div>
    );
  }

  const hoursList = Array.isArray(cafe.hours) && cafe.hours.length > 0
    ? cafe.hours
    : ["Mon–Fri · 08:00–20:00", "Sat · 09:00–16:00", "Sun · Closed"];

  return (
    <div className="page-stack">
      <Link href="/cafes" className="back-link">
        <ArrowLeft size={15} /> All canteens
      </Link>
      <PageHeading
        eyebrow="CAMPUS MENU"
        title={cafe.name}
        description="Freshly prepared meals and cafeteria favorites. Order online for quick pickup."
        action={
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span className="status-dot-label">
              <span className="status-dot" />
              {cafe.is_accepting_orders !== false ? "Accepting orders" : "Not accepting orders"}
            </span>
            <button
              type="button"
              className="button button-secondary button-small"
              onClick={() => {
                fetchCafeMenu();
                if (refreshCafesAndMenu) refreshCafesAndMenu();
              }}
              title="Refresh live menu"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        }
      />

      <section className="cafe-hours-panel" aria-label="Sample cafe hours">
        <div className="hours-panel-icon">
          <Clock3 size={19} />
        </div>
        <div className="hours-panel-copy">
          <strong>Operating hours</strong>
          <span>Weekly schedule</span>
        </div>
        <div className="hours-list">
          {hoursList.map((hour) => (
            <span key={hour}>{hour}</span>
          ))}
        </div>
      </section>

      <div className="menu-tools">
        <label className="search-field">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Search menu items</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the menu..."
          />
        </label>
        <button
          type="button"
          className={`filter-chip ${availableOnly ? "filter-chip-active" : ""}`}
          aria-pressed={availableOnly}
          onClick={() => setAvailableOnly((value) => !value)}
        >
          {availableOnly ? "Available items only" : "All items"}
        </button>
      </div>

      <div className="result-count">
        <span>
          {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"} available
        </span>
        <span>Prep times are dynamic kitchen estimates</span>
      </div>

      {filteredItems.length ? (
        <div className="menu-grid">
          {filteredItems.map((item, index) => (
            <MenuItemCard
              key={item.id}
              item={{ ...item, cafe_id: cafe.id }}
              index={index}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title="No menu items match"
          description="Try another search term or turn off the availability filter."
          action={
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                setQuery("");
                setAvailableOnly(false);
              }}
            >
              Reset filters
            </button>
          }
        />
      )}
    </div>
  );
}
