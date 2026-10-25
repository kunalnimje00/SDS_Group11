"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, SlidersHorizontal, RefreshCw } from "lucide-react";
import { useKantin } from "@/app/kantin-context";
import { CafeCard } from "./cafe-card";
import { EmptyState, PageHeading } from "./ui";

export function CafesPage() {
  const { cafes, refreshCafesAndMenu } = useKantin();
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const normalized = query.trim().toLowerCase();
  const results = (cafes || []).filter((cafe) =>
    (cafe.name || "").toLowerCase().includes(normalized)
  );

  async function handleRefresh() {
    setRefreshing(true);
    if (refreshCafesAndMenu) {
      await refreshCafesAndMenu();
    }
    setTimeout(() => setRefreshing(false), 500);
  }

  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="CAMPUS DINING"
        title="Browse canteens"
        description="Choose a campus cafe and view their menu, hours, and live availability."
        action={
          <button
            type="button"
            className="button button-secondary button-small"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ display: "inline-flex", gap: "6px" }}
          >
            <RefreshCw size={13} className={refreshing ? "spinner" : ""} />
            {refreshing ? "Refreshing..." : "Refresh Canteens"}
          </button>
        }
      />
      <div className="toolbar-row">
        <label className="search-field">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Search canteens</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search canteens..."
          />
        </label>
        <span className="toolbar-caption">
          <SlidersHorizontal size={16} /> Campus locations
        </span>
      </div>
      <div className="result-count">
        <span>
          {results.length} {results.length === 1 ? "canteen" : "canteens"} available
        </span>
        <span>Open for online ordering</span>
      </div>
      {results.length ? (
        <div className="cafe-list">
          {results.map((cafe) => (
            <CafeCard key={cafe.id} cafe={cafe} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No canteens found"
          description="Try another search term or click Refresh to fetch newly registered canteens."
          action={
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                setQuery("");
                handleRefresh();
              }}
            >
              Refresh canteens
            </button>
          }
        />
      )}
    </div>
  );
}
