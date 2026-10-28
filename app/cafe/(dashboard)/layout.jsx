"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCafe } from "../providers";
import { CafeShell } from "@/components/cafe-shell";

export default function CafeDashboardLayout({ children }) {
  const router = useRouter();
  const { user, authLoading, isCafeStaff, staffCheckLoading } = useCafe();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/cafe/login");
    } else if (!authLoading && !staffCheckLoading && user && !isCafeStaff) {
      router.replace("/cafe/access-pending");
    }
  }, [user, authLoading, isCafeStaff, staffCheckLoading, router]);

  return <CafeShell>{children}</CafeShell>;
}
