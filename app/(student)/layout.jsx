"use client";

import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";

export default function StudentLayout({ children }) {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg)" }} />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
