"use client";

import { createContext, useContext } from "react";

const KantinContext = createContext(null);

export { KantinContext };

export function useKantin() {
  const context = useContext(KantinContext);
  if (!context) throw new Error("useKantin must be used inside AppProviders");
  return context;
}
