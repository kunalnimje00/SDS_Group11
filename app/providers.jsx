"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cafes as initialCafes, demoOrders, menuItems as initialMenuItems } from "@/lib/demo-data";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import { KantinContext } from "./kantin-context";

const CART_STORAGE_KEY = "kantin-cart-v1";
const ORDER_STORAGE_KEY = "kantin-orders-v1";
const MENU_STORAGE_KEY = "kantin-custom-menu-v1";
const CAFES_STORAGE_KEY = "kantin-cafes-v1";

function readStoredCart() {
  if (typeof window === "undefined") return { cafeId: null, quantities: {} };
  try {
    const value = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || "null");
    if (!value || typeof value !== "object") return { cafeId: null, quantities: {} };
    return {
      cafeId: typeof value.cafeId === "string" ? value.cafeId : null,
      quantities: value.quantities && typeof value.quantities === "object" ? value.quantities : {},
    };
  } catch {
    return { cafeId: null, quantities: {} };
  }
}

function readStoredOrders() {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(ORDER_STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function readStoredMenu() {
  if (typeof window === "undefined") return initialMenuItems;
  try {
    const value = JSON.parse(window.localStorage.getItem(MENU_STORAGE_KEY) || "null");
    return Array.isArray(value) && value.length ? value : initialMenuItems;
  } catch {
    return initialMenuItems;
  }
}

function readStoredCafes() {
  if (typeof window === "undefined") return initialCafes;
  try {
    const value = JSON.parse(window.localStorage.getItem(CAFES_STORAGE_KEY) || "null");
    if (Array.isArray(value) && value.length) {
      const map = new Map();
      initialCafes.forEach((c) => map.set(c.id, c));
      value.forEach((c) => map.set(c.id, { ...map.get(c.id), ...c }));
      return Array.from(map.values());
    }
    return initialCafes;
  } catch {
    return initialCafes;
  }
}

export function AppProviders({ children }) {
  const [cart, setCart] = useState({ cafeId: null, quantities: {} });
  const [localOrders, setLocalOrders] = useState([]);
  const [menuItems, setMenuItems] = useState(initialMenuItems);
  const [cafes, setCafes] = useState(initialCafes);
  const [hydrated, setHydrated] = useState(false);

  // Supabase Auth state
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(supabase));

  // Hydrate local state on mount
  useEffect(() => {
    setCart(readStoredCart());
    setLocalOrders(readStoredOrders());
    setMenuItems(readStoredMenu());
    setCafes(readStoredCafes());
    setHydrated(true);
  }, []);

  // Save cart
  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart, hydrated]);

  // Save local orders
  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(localOrders));
    }
  }, [localOrders, hydrated]);

  // Save custom menu items
  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menuItems));
    }
  }, [menuItems, hydrated]);

  // Save cafes
  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(CAFES_STORAGE_KEY, JSON.stringify(cafes));
    }
  }, [cafes, hydrated]);

  // Subscribe to Supabase Auth state changes
  useEffect(() => {
    if (!supabase) return undefined;

    async function initAuth() {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (err) {
        console.error("Error checking auth session:", err);
      } finally {
        setAuthLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Sync Cafes and Menu Items from Supabase in real-time
  const refreshCafesAndMenu = useCallback(async () => {
    if (!supabase) return;
    try {
      // 1. Fetch all cafes
      const { data: dbCafes, error: cErr } = await supabase.from("cafes").select("*");
      if (!cErr && Array.isArray(dbCafes) && dbCafes.length > 0) {
        setCafes((prev) => {
          const map = new Map();
          initialCafes.forEach((c) => map.set(c.id, c));
          prev.forEach((c) => map.set(c.id, c));
          dbCafes.forEach((c) => {
            const existing = map.get(c.id);
            map.set(c.id, {
              ...existing,
              ...c,
              hours: existing?.hours || [
                "Mon–Fri · 08:00–20:00",
                "Sat · 09:00–16:00",
              ],
            });
          });
          const result = Array.from(map.values());
          if (typeof window !== "undefined") {
            window.localStorage.setItem(CAFES_STORAGE_KEY, JSON.stringify(result));
          }
          return result;
        });
      }

      // 2. Fetch all menu items
      const { data: dbItems, error: mErr } = await supabase.from("menu_items").select("*");
      if (!mErr && Array.isArray(dbItems) && dbItems.length > 0) {
        setMenuItems((prev) => {
          const map = new Map();
          prev.forEach((it) => map.set(it.id, it));
          dbItems.forEach((it) => map.set(it.id, { ...map.get(it.id), ...it }));
          const result = Array.from(map.values());
          if (typeof window !== "undefined") {
            window.localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(result));
          }
          return result;
        });
      }
    } catch (err) {
      console.warn("Could not sync cafes/menu with Supabase:", err);
    }
  }, []);

  useEffect(() => {
    refreshCafesAndMenu();
    const interval = setInterval(refreshCafesAndMenu, 5000);
    return () => clearInterval(interval);
  }, [refreshCafesAndMenu]);

  // Dynamically register a cafe (used when staff creates/logs into a cafe)
  const registerCafe = useCallback((cafeObj) => {
    if (!cafeObj?.id) return;
    setCafes((prev) => {
      const exists = prev.some((c) => c.id === cafeObj.id);
      const updated = exists
        ? prev.map((c) => (c.id === cafeObj.id ? { ...c, ...cafeObj } : c))
        : [
            ...prev,
            {
              ...cafeObj,
              is_accepting_orders: cafeObj.is_accepting_orders ?? true,
              is_active: cafeObj.is_active ?? true,
              hours: cafeObj.hours || [
                "Mon–Fri · 08:00–20:00",
                "Sat · 09:00–16:00",
              ],
            },
          ];
      if (typeof window !== "undefined") {
        window.localStorage.setItem(CAFES_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  // Auth actions
  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error(supabaseConfigError);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signUp = useCallback(async (email, password, displayName) => {
    if (!supabase) throw new Error(supabaseConfigError);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw error;
    return data;
  }, []);

  const verifyEmailOtp = useCallback(async (email, token) => {
    if (!supabase) throw new Error(supabaseConfigError);
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
    if (error) throw error;
    return data;
  }, []);

  const resendEmailOtp = useCallback(async (email) => {
    if (!supabase) throw new Error(supabaseConfigError);
    const { data, error } = await supabase.auth.resend({ type: "signup", email });
    if (error) throw error;
    return data;
  }, []);

  const sendPasswordResetOtp = useCallback(async (email) => {
    if (!supabase) throw new Error(supabaseConfigError);
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return data;
  }, []);

  const verifyPasswordResetOtp = useCallback(async (email, token) => {
    if (!supabase) throw new Error(supabaseConfigError);
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "recovery" });
    if (error) throw error;
    return data;
  }, []);

  const updatePassword = useCallback(async (newPassword) => {
    if (!supabase) throw new Error(supabaseConfigError);
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) throw new Error(supabaseConfigError);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
  }, []);

  // Menu management
  const updateMenuItem = useCallback((updatedItem) => {
    setMenuItems((current) => {
      const exists = current.some((it) => it.id === updatedItem.id);
      const next = exists
        ? current.map((item) => (item.id === updatedItem.id ? { ...item, ...updatedItem } : item))
        : [...current, updatedItem];
      if (typeof window !== "undefined") {
        window.localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const addMenuItem = useCallback((newItem) => {
    const id = newItem.id || window.crypto?.randomUUID?.() || `item-${Date.now()}`;
    setMenuItems((current) => {
      const next = [...current, { ...newItem, id }];
      if (typeof window !== "undefined") {
        window.localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const deleteMenuItem = useCallback((itemId) => {
    setMenuItems((current) => {
      const next = current.filter((item) => item.id !== itemId);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  // Cart actions
  const addItem = useCallback((cafeId, itemId) => {
    const resolvedCafeId = cafeId || cart.cafeId || cafes[0]?.id || "c0ffee00-0000-4000-8000-000000000001";
    if (cart.cafeId && cart.cafeId !== resolvedCafeId) {
      const currentCafe = cafes.find((c) => c.id === cart.cafeId)?.name || "another cafe";
      const nextCafe = cafes.find((c) => c.id === resolvedCafeId)?.name || "this cafe";
      if (!window.confirm(`Your cart has items from ${currentCafe}. Clear it and start a new cart from ${nextCafe}?`)) {
        return;
      }
      setCart({ cafeId: resolvedCafeId, quantities: { [itemId]: 1 } });
      return;
    }
    setCart((current) => ({
      cafeId: resolvedCafeId,
      quantities: { ...current.quantities, [itemId]: (current.quantities[itemId] || 0) + 1 },
    }));
  }, [cart.cafeId, cafes]);

  const setQuantity = useCallback((itemId, quantity) => {
    setCart((current) => {
      if (quantity < 1) {
        const quantities = { ...current.quantities };
        delete quantities[itemId];
        return { cafeId: Object.keys(quantities).length ? current.cafeId : null, quantities };
      }
      return { ...current, quantities: { ...current.quantities, [itemId]: quantity } };
    });
  }, []);

  const removeItem = useCallback((itemId) => {
    setCart((current) => {
      const quantities = { ...current.quantities };
      delete quantities[itemId];
      return { cafeId: Object.keys(quantities).length ? current.cafeId : null, quantities };
    });
  }, []);

  const clearCart = useCallback(() => setCart({ cafeId: null, quantities: {} }), []);

  // Update order status
  const updateOrderStatus = useCallback((orderId, nextStatus, reason) => {
    setLocalOrders((current) =>
      current.map((order) => {
        if (order.id === orderId || order.order_number === orderId) {
          return {
            ...order,
            status: nextStatus,
            updated_at: new Date().toISOString(),
            ...(reason ? { cancellation_reason: reason } : {}),
          };
        }
        return order;
      })
    );
  }, []);

  // Place order
  const placeDemoOrder = useCallback(async (destinationId) => {
    const cafe = cafes.find((entry) => entry.id === cart.cafeId) || cafes[0];
    const selectedItems = Object.entries(cart.quantities)
      .map(([itemId, quantity]) => ({ item: menuItems.find((entry) => entry.id === itemId), quantity }))
      .filter(({ item, quantity }) => item && item.is_available && quantity > 0);

    if (!cafe || !selectedItems.length) return null;

    const now = new Date().toISOString();
    const id = window.crypto?.randomUUID?.() || `order-${Date.now()}`;
    const orderNumber = `ORD-${String(Date.now()).slice(-6)}`;
    const studentId = user?.id || "e0000000-0000-4000-8000-000000000001";
    const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Student";

    const order = {
      id,
      order_number: orderNumber,
      student_id: studentId,
      student_display_name: displayName,
      cafe_id: cafe.id,
      destination_id: destinationId,
      status: "pending",
      total_paise: selectedItems.reduce((sum, { item, quantity }) => sum + item.price_paise * quantity, 0),
      idempotency_key: id,
      estimated_ready_at: null,
      estimated_delivery_at: null,
      created_at: now,
      updated_at: now,
      items: selectedItems.map(({ item, quantity }, index) => ({
        id: `${id}-${index + 1}`,
        order_id: id,
        menu_item_id: item.id,
        item_name_snapshot: item.name,
        unit_price_paise: item.price_paise,
        quantity,
        line_total_paise: item.price_paise * quantity,
        status: "included",
      })),
    };

    // If Supabase is available and user is authenticated, also invoke create_order RPC
    if (supabase && user) {
      try {
        const p_items = selectedItems.map(({ item, quantity }) => ({
          menu_item_id: item.id,
          quantity,
        }));
        const { data, error } = await supabase.rpc("create_order", {
          p_items,
          p_destination_id: destinationId,
          p_idempotency_key: id,
        });
        if (!error && data?.order) {
          order.id = data.order.id;
          order.order_number = data.order.order_number;
        }
      } catch (err) {
        console.warn("Backend order creation fallback to local:", err);
      }
    }

    setLocalOrders((current) => [order, ...current]);
    clearCart();
    return order;
  }, [cart, clearCart, menuItems, user, cafes]);

  const value = useMemo(() => ({
    cart,
    hydrated,
    localOrders,
    orders: [...localOrders, ...demoOrders],
    menuItems,
    cafes,
    user,
    session,
    authLoading,
    signIn,
    signUp,
    verifyEmailOtp,
    resendEmailOtp,
    sendPasswordResetOtp,
    verifyPasswordResetOtp,
    updatePassword,
    signOut,
    addItem,
    setQuantity,
    removeItem,
    clearCart,
    placeDemoOrder,
    updateMenuItem,
    addMenuItem,
    deleteMenuItem,
    updateOrderStatus,
    registerCafe,
    refreshCafesAndMenu,
  }), [
    cart,
    hydrated,
    localOrders,
    menuItems,
    cafes,
    user,
    session,
    authLoading,
    signIn,
    signUp,
    verifyEmailOtp,
    resendEmailOtp,
    sendPasswordResetOtp,
    verifyPasswordResetOtp,
    updatePassword,
    signOut,
    addItem,
    setQuantity,
    removeItem,
    clearCart,
    placeDemoOrder,
    updateMenuItem,
    addMenuItem,
    deleteMenuItem,
    updateOrderStatus,
    registerCafe,
    refreshCafesAndMenu,
  ]);

  return <KantinContext.Provider value={value}>{children}</KantinContext.Provider>;
}
