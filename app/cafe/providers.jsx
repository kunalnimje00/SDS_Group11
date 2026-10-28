"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useKantin } from "@/app/kantin-context";
import { supabase } from "@/lib/supabase";
import { checkCafeStaffMembership } from "@/lib/cafe-auth";

const CafeContext = createContext(null);

export function CafeProvider({ children }) {
  const {
    user,
    session,
    signOut,
    authLoading,
    localOrders,
    updateOrderStatus: updateLocalOrderStatus,
    addMenuItem: addKantinMenuItem,
    updateMenuItem: updateKantinMenuItem,
    deleteMenuItem: deleteKantinMenuItem,
    menuItems: kantinMenuItems,
    cafes: kantinCafes,
    registerCafe,
  } = useKantin();

  const [isCafeStaff, setIsCafeStaff] = useState(false);
  const [staffCheckLoading, setStaffCheckLoading] = useState(true);
  const [staffCheckError, setStaffCheckError] = useState(null);
  const [cafeId, setCafeId] = useState("c0ffee00-0000-4000-8000-000000000001");
  const [cafeName, setCafeName] = useState("Demo Cafe");
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
          // Attempt to find the specific cafe assigned to this staff member
          const { data: staffData } = await supabase
            .from("cafe_staff")
            .select("cafe_id, cafes(id, name)")
            .eq("user_id", user.id)
            .maybeSingle();

          let resolvedId = staffData?.cafe_id;
          let resolvedName = staffData?.cafes?.name;
          if (!resolvedId) {
            const { data: cafesData } = await supabase
              .from("cafes")
              .select("id, name")
              .limit(1);

            if (cafesData && cafesData.length > 0) {
              resolvedId = cafesData[0].id;
              resolvedName = cafesData[0].name;
            }
          }

          if (resolvedId) {
            setCafeId(resolvedId);
            if (resolvedName) setCafeName(resolvedName);
            if (registerCafe) {
              registerCafe({
                id: resolvedId,
                name: resolvedName || "My Cafeteria",
                is_accepting_orders: true,
                is_active: true,
              });
            }
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

  // Fetch cafe orders via RPC & merge with local session orders
  const refreshOrders = useCallback(async (statusFilter) => {
    if (!isCafeStaff) return;
    setOrdersLoading(true);
    try {
      let remoteOrders = [];
      try {
        const { data, error } = await supabase.rpc("cafe_list_orders", {
          p_status: statusFilter || null,
        });
        if (!error && Array.isArray(data)) {
          remoteOrders = data;
        }
      } catch (rErr) {
        console.warn("RPC cafe_list_orders error:", rErr);
      }

      // Merge remote orders with local session orders for this cafe
      const merged = [...remoteOrders];
      const localList = Array.isArray(localOrders) ? localOrders : [];

      localList.forEach((lo) => {
        const exists = merged.some(
          (ro) => ro.id === lo.id || ro.order_number === lo.order_number
        );
        if (!exists) {
          if (!statusFilter || lo.status === statusFilter) {
            merged.push(lo);
          }
        }
      });

      // Sort newest first
      merged.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setOrders(merged);
    } catch (err) {
      console.error("Order fetch failed:", err);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [isCafeStaff, localOrders]);

  useEffect(() => {
    if (isCafeStaff) {
      refreshOrders();
    }
  }, [isCafeStaff, refreshOrders]);

  // Handle order status transitions
  const updateOrderStatus = useCallback(
    async (orderId, toStatus, reason) => {
      // 1. Update local UI state immediately
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId || o.order_number === orderId
            ? { ...o, status: toStatus, updated_at: new Date().toISOString() }
            : o
        )
      );

      // 2. Update local storage orders if using student session
      if (updateLocalOrderStatus) {
        updateLocalOrderStatus(orderId, toStatus, reason);
      }

      // 3. Update Supabase backend via RPC
      try {
        const params = { p_order_id: orderId, p_to_status: toStatus };
        if (reason) params.p_reason = reason;
        await supabase.rpc("cafe_set_order_status", params);
      } catch (err) {
        console.warn("Supabase order status transition note:", err.message);
      }
    },
    [updateLocalOrderStatus]
  );

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
      cafeId,
      cafeName,
      orders,
      setOrders,
      ordersLoading,
      pendingOrdersCount,
      refreshOrders,
      updateOrderStatus,
      checkStaff,
      signOut,
      addMenuItem: addKantinMenuItem,
      updateMenuItem: updateKantinMenuItem,
      deleteMenuItem: deleteKantinMenuItem,
      registerCafe,
      menuItems: kantinMenuItems,
    }),
    [
      user,
      session,
      authLoading,
      isCafeStaff,
      staffCheckLoading,
      staffCheckError,
      cafeId,
      cafeName,
      orders,
      ordersLoading,
      pendingOrdersCount,
      refreshOrders,
      updateOrderStatus,
      checkStaff,
      signOut,
      addKantinMenuItem,
      updateKantinMenuItem,
      deleteKantinMenuItem,
      kantinMenuItems,
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
