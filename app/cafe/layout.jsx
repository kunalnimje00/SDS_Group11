"use client";

import { Suspense } from "react";
import { CafeProvider } from "./providers";

export default function CafeRootLayout({ children }) {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg)" }} />}>
      <CafeProvider>{children}</CafeProvider>
    </Suspense>
  );
}
