"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useKantin } from "@/app/providers";
import { supabase } from "@/lib/supabase";
import { checkCafeStaffMembership } from "@/lib/cafe-auth";

const CafeContext = createContext(null);

export function CafeProvider({ children }) {
  const { user, session, signOut, authLoading } = useKantin();
  const [isCafeStaff, setIsCafeStaff] = useState(false);
  const [staffCheckLoading, setStaffCheckLoading] = useState(true);
  const [staffCheckError, setStaffCheckError] = useState(null);
  const [cafeName, setCafeName] = useState("My Cafeteria");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const checkStaff = useCallback(async () => {
    if (!user) {
      setIsCafeStaff(false);
      setStaffCheckLoading(false);
      setStaffCheckError(null);
      return { isStaff: false, error: null };
    }

    setStaffCheckLoading(true);
    setStaffCheckError(null);

    try {
      const result = await checkCafeStaffMembership();
      setIsCafeStaff(result.isStaff);
      setStaffCheckError(result.error);

      if (result.isStaff) {
        try {
          const { data: cafesData, error: cafesErr } = await supabase
            .from("cafes")
            .select("id, name")
            .limit(1);

          if (!cafesErr && cafesData && cafesData.length > 0) {
            setCafeName(cafesData[0].name || "My Cafeteria");
          }
        } catch (cErr) {
          console.error("Error fetching cafe details:", cErr);
        }
      }
      return result;
    } catch (err) {
      const errMsg = err?.message || "Failed to verify staff membership";
      setIsCafeStaff(false);
      setStaffCheckError(errMsg);
      return { isStaff: false, error: errMsg };
    } finally {
      setStaffCheckLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    checkStaff();
  }, [user, authLoading, checkStaff]);

  // Fetch cafe orders via RPC
  const refreshOrders = useCallback(async (statusFilter) => {
    if (!isCafeStaff) return;
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase.rpc("cafe_list_orders", {
        p_status: statusFilter || null,
      });
      if (!error && Array.isArray(data)) {
        setOrders(data);
      } else if (error) {
        console.error("Error fetching orders:", error.message);
        setOrders([]);
      }
    } catch (err) {
      console.error("Order fetch failed:", err);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [isCafeStaff]);

  useEffect(() => {
    if (isCafeStaff) {
      refreshOrders();
    }
  }, [isCafeStaff, refreshOrders]);

  const pendingOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === "pending").length;
  }, [orders]);

  const value = useMemo(
    () => ({
      user,
      session,
      authLoading,
      isCafeStaff,
      staffCheckLoading,
      staffCheckError,
      cafeName,
      orders,
      ordersLoading,
      pendingOrdersCount,
      refreshOrders,
      checkStaff,
      signOut,
    }),
    [
      user, session, authLoading, isCafeStaff, staffCheckLoading,
      staffCheckError, cafeName, orders, ordersLoading,
      pendingOrdersCount, refreshOrders, checkStaff, signOut,
    ]
  );

  return <CafeContext.Provider value={value}>{children}</CafeContext.Provider>;
}

export function useCafe() {
  const context = useContext(CafeContext);
  if (!context) {
    throw new Error("useCafe must be used inside a CafeProvider");
  }
  return context;
}
