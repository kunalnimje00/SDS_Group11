"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import { KantinContext } from "./kantin-context";

const CART_STORAGE_KEY = "kantin-cart-v1";

// ─── Cart helpers (localStorage is fine for an unsent cart) ──────────
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

export function AppProviders({ children }) {
  // ─── Cart (localStorage-backed, harmless UI state) ─────────────
  const [cart, setCart] = useState({ cafeId: null, quantities: {} });
  const [hydrated, setHydrated] = useState(false);

  // ─── Supabase-backed data ──────────────────────────────────────
  const [menuItems, setMenuItems] = useState([]);
  const [cafes, setCafes] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // ─── Auth ──────────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(supabase));

  // ─── Hydrate cart from localStorage on mount ───────────────────
  useEffect(() => {
    setCart(readStoredCart());
    setHydrated(true);
  }, []);

  // Persist cart to localStorage
  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart, hydrated]);

  // ─── Auth session management ───────────────────────────────────
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

  // ─── Fetch cafes and menu items from Supabase ──────────────────
  const refreshCafesAndMenu = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data: dbCafes, error: cErr } = await supabase.from("cafes").select("*");
      if (!cErr && Array.isArray(dbCafes)) {
        setCafes(dbCafes);
      }

      const { data: dbItems, error: mErr } = await supabase.from("menu_items").select("*");
      if (!mErr && Array.isArray(dbItems)) {
        setMenuItems(dbItems);
      }
    } catch (err) {
      console.warn("Could not sync cafes/menu with Supabase:", err);
    }
  }, []);

  // Fetch destinations from Supabase
  const refreshDestinations = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from("destinations").select("*");
      if (!error && Array.isArray(data)) {
        setDestinations(data);
      }
    } catch (err) {
      console.warn("Could not fetch destinations:", err);
    }
  }, []);

  useEffect(() => {
    refreshCafesAndMenu();
    refreshDestinations();
    const interval = setInterval(refreshCafesAndMenu, 15000);
    return () => clearInterval(interval);
  }, [refreshCafesAndMenu, refreshDestinations]);

  // ─── Fetch student orders from Supabase ────────────────────────
  const refreshOrders = useCallback(async () => {
    if (!supabase || !user) {
      setOrders([]);
      return;
    }
    setOrdersLoading(true);
    try {
      // Fetch orders belonging to the authenticated student
      const { data: dbOrders, error: oErr } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (oErr) {
        console.error("Error fetching orders:", oErr.message);
        setOrders([]);
        setOrdersLoading(false);
        return;
      }

      // Fetch order items for all returned orders
      const orderIds = (dbOrders || []).map((o) => o.id);
      let allItems = [];
      if (orderIds.length > 0) {
        const { data: dbItems, error: iErr } = await supabase
          .from("order_items")
          .select("*")
          .in("order_id", orderIds);
        if (!iErr && Array.isArray(dbItems)) {
          allItems = dbItems;
        }
      }

      // Merge items into orders
      const ordersWithItems = (dbOrders || []).map((order) => ({
        ...order,
        items: allItems.filter((item) => item.order_id === order.id),
      }));

      setOrders(ordersWithItems);
    } catch (err) {
      console.error("Order fetch failed:", err);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [user]);

  // Refresh orders when user changes (login/logout)
  useEffect(() => {
    if (!authLoading) {
      refreshOrders();
    }
  }, [user, authLoading, refreshOrders]);

  // ─── Auth actions ──────────────────────────────────────────────
  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error(supabaseConfigError);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signUp = useCallback(async (email, password, displayName, cafeName) => {
    if (!supabase) throw new Error(supabaseConfigError);
    const metadata = { display_name: displayName };
    // If cafeName is provided, mark this as a cafe signup so the DB trigger fires
    if (cafeName) {
      metadata.cafe_signup = "true";
      metadata.cafe_name = cafeName;
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
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
    setOrders([]);
  }, []);

  // ─── Menu management (local context updates after Supabase RPCs) ─
  // These update local state optimistically; the actual Supabase write
  // happens in the cafe dashboard pages via RPCs. The context versions
  // are kept so the 5-second sync picks up changes.
  const updateMenuItem = useCallback((updatedItem) => {
    setMenuItems((current) => {
      const exists = current.some((it) => it.id === updatedItem.id);
      return exists
        ? current.map((item) => (item.id === updatedItem.id ? { ...item, ...updatedItem } : item))
        : [...current, updatedItem];
    });
  }, []);

  const addMenuItem = useCallback((newItem) => {
    const id = newItem.id || (typeof window !== "undefined" && window.crypto?.randomUUID?.()) || `item-${Date.now()}`;
    setMenuItems((current) => [...current, { ...newItem, id }]);
  }, []);

  const deleteMenuItem = useCallback((itemId) => {
    setMenuItems((current) => current.filter((item) => item.id !== itemId));
  }, []);

  // ─── Cart actions ──────────────────────────────────────────────
  const addItem = useCallback((cafeId, itemId) => {
    const resolvedCafeId = cafeId || cart.cafeId || cafes[0]?.id;
    if (!resolvedCafeId) return;
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

  // ─── Update order status (local context, used by cafe providers) ─
  const updateOrderStatus = useCallback((orderId, nextStatus, reason) => {
    setOrders((current) =>
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

  // ─── Place order via Supabase RPC ──────────────────────────────
  const placeOrder = useCallback(async (destinationId) => {
    if (!supabase) throw new Error(supabaseConfigError);
    if (!user) throw new Error("You must be signed in to place an order.");

    const selectedItems = Object.entries(cart.quantities)
      .map(([itemId, quantity]) => ({
        item: menuItems.find((entry) => entry.id === itemId),
        quantity,
      }))
      .filter(({ item, quantity }) => item && quantity > 0);

    if (!selectedItems.length) {
      throw new Error("Your cart is empty. Add items before placing an order.");
    }

    // Build the payload — only IDs and quantities; server will validate
    const p_items = selectedItems.map(({ item, quantity }) => ({
      menu_item_id: item.id,
      quantity,
    }));

    // Generate an idempotency key to prevent duplicate orders on retry
    const idempotencyKey = (typeof window !== "undefined" && window.crypto?.randomUUID?.()) || `order-${Date.now()}`;

    const { data, error } = await supabase.rpc("create_order", {
      p_items,
      p_destination_id: destinationId || null,
      p_idempotency_key: idempotencyKey,
    });

    if (error) {
      // Map known error codes to user-friendly messages
      const msg = error.message || "";
      if (msg.includes("item_globally_unavailable") || msg.includes("item_unavailable_today")) {
        throw new Error("One or more items are no longer available. Please review your cart.");
      }
      if (msg.includes("out_of_stock") || msg.includes("insufficient_stock")) {
        throw new Error("Some items are out of stock. Please adjust quantities and try again.");
      }
      if (msg.includes("cafe_not_active") || msg.includes("cafe_not_accepting_orders") || msg.includes("cafe_closed")) {
        throw new Error("This cafe is currently not accepting orders. Please try again later.");
      }
      if (msg.includes("destination_not_available")) {
        throw new Error("The selected delivery destination is not available.");
      }
      throw new Error(msg || "Failed to place your order. Please try again.");
    }

    // Clear cart on success
    clearCart();

    // Refresh orders so the new order appears in My Orders
    await refreshOrders();

    // Return the order data from the RPC
    return data?.order || data;
  }, [cart, menuItems, user, clearCart, refreshOrders]);

  // ─── Register cafe (updates local state for immediate display) ──
  const registerCafe = useCallback((cafeObj) => {
    if (!cafeObj?.id) return;
    setCafes((prev) => {
      const exists = prev.some((c) => c.id === cafeObj.id);
      return exists
        ? prev.map((c) => (c.id === cafeObj.id ? { ...c, ...cafeObj } : c))
        : [...prev, { ...cafeObj }];
    });
  }, []);

  // ─── Context value ─────────────────────────────────────────────
  const value = useMemo(() => ({
    cart,
    hydrated,
    orders,
    ordersLoading,
    localOrders: orders,
    menuItems,
    cafes,
    destinations,
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
    placeOrder,
    // Keep old name as alias so existing components don't break
    placeDemoOrder: placeOrder,
    updateMenuItem,
    addMenuItem,
    deleteMenuItem,
    updateOrderStatus,
    registerCafe,
    refreshCafesAndMenu,
    refreshOrders,
    refreshDestinations,
  }), [
    cart,
    hydrated,
    orders,
    ordersLoading,
    menuItems,
    cafes,
    destinations,
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
    placeOrder,
    updateMenuItem,
    addMenuItem,
    deleteMenuItem,
    updateOrderStatus,
    registerCafe,
    refreshCafesAndMenu,
    refreshOrders,
    refreshDestinations,
  ]);

  return <KantinContext.Provider value={value}>{children}</KantinContext.Provider>;
}
