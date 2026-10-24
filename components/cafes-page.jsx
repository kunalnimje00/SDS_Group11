"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { useKantin } from "@/app/kantin-context";
import { CafeCard } from "./cafe-card";
import { EmptyState, PageHeading } from "./ui";

export function CafesPage() {
  const { cafes } = useKantin();
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const results = cafes.filter((cafe) => cafe.name.toLowerCase().includes(normalized));

  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="CAMPUS DINING"
        title="Browse canteens"
        description="Choose a campus cafe and view their menu, hours, and live availability."
      />
      <div className="toolbar-row">
        <label className="search-field">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Search canteens</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search canteens"
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
        <span>Open during active academic hours</span>
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
          description="Try another search term or clear your search."
          action={
            <button type="button" className="button button-secondary" onClick={() => setQuery("")}>
              Clear search
            </button>
          }
        />
      )}
    </div>
  );
}
