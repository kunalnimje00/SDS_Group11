"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cafes, demoOrders, menuItems as initialMenuItems } from "@/lib/demo-data";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import { KantinContext } from "./kantin-context";

const CART_STORAGE_KEY = "kantin-cart-v1";
const ORDER_STORAGE_KEY = "kantin-orders-v1";
const MENU_STORAGE_KEY = "kantin-custom-menu-v1";

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

export function AppProviders({ children }) {
  const [cart, setCart] = useState({ cafeId: null, quantities: {} });
  const [localOrders, setLocalOrders] = useState([]);
  const [menuItems, setMenuItems] = useState(initialMenuItems);
  const [hydrated, setHydrated] = useState(false);

  // Supabase Auth state
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(supabase));

  // Hydrate local state on mount
  // Read browser storage after mount to keep server and initial client renders consistent.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setCart(readStoredCart());
    setLocalOrders(readStoredOrders());
    setMenuItems(readStoredMenu());
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

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

  // Save custom menu items (when cafe updates menu)
  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menuItems));
    }
  }, [menuItems, hydrated]);

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

  // Auth actions
  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error(supabaseConfigError);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }, []);

  const signUp = useCallback(async (email, password, displayName, cafeName) => {
    if (!supabase) throw new Error(supabaseConfigError);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          ...(cafeName ? { cafe_signup: true, cafe_name: cafeName } : {}),
        },
      },
    });
    if (error) throw error;
    return data;
  }, []);

  const verifyEmailOtp = useCallback(async (email, token) => {
    if (!supabase) throw new Error(supabaseConfigError);

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });
    if (error) throw error;
    return data;
  }, []);

  const resendEmailOtp = useCallback(async (email) => {
    if (!supabase) throw new Error(supabaseConfigError);

    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) throw error;
  }, []);

  const sendPasswordResetOtp = useCallback(async (email) => {
    if (!supabase) throw new Error(supabaseConfigError);

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }, []);

  const verifyPasswordResetOtp = useCallback(async (email, token) => {
    if (!supabase) throw new Error(supabaseConfigError);

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "recovery",
    });
    if (error) throw error;
    return data;
  }, []);

  const updatePassword = useCallback(async (password) => {
    if (!supabase) throw new Error(supabaseConfigError);

    const { data, error } = await supabase.auth.updateUser({ password });
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

  // Menu management (allows cafe staff or admin to update items anytime)
  const updateMenuItem = useCallback((updatedItem) => {
    setMenuItems((current) =>
      current.map((item) => (item.id === updatedItem.id ? { ...item, ...updatedItem } : item))
    );
  }, []);

  const addMenuItem = useCallback((newItem) => {
    const id = newItem.id || window.crypto?.randomUUID?.() || `item-${Date.now()}`;
    setMenuItems((current) => [...current, { ...newItem, id }]);
  }, []);

  const deleteMenuItem = useCallback((itemId) => {
    setMenuItems((current) => current.filter((item) => item.id !== itemId));
  }, []);

  // Cart actions
  const addItem = useCallback((cafeId, itemId) => {
    if (cart.cafeId && cart.cafeId !== cafeId) {
      const currentCafe = cafes.find((c) => c.id === cart.cafeId)?.name || "another cafe";
      const nextCafe = cafes.find((c) => c.id === cafeId)?.name || "this cafe";
      if (!window.confirm(`Your cart has items from ${currentCafe}. Clear it and start a new cart from ${nextCafe}?`)) {
        return;
      }
      setCart({ cafeId, quantities: { [itemId]: 1 } });
      return;
    }
    setCart((current) => ({
      cafeId,
      quantities: { ...current.quantities, [itemId]: (current.quantities[itemId] || 0) + 1 },
    }));
  }, [cart.cafeId]);

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

  // Place order
  const placeDemoOrder = useCallback((destinationId) => {
    const cafe = cafes.find((entry) => entry.id === cart.cafeId);
    const selectedItems = Object.entries(cart.quantities)
      .map(([itemId, quantity]) => ({ item: menuItems.find((entry) => entry.id === itemId), quantity }))
      .filter(({ item, quantity }) => item && item.is_available && quantity > 0);

    if (!cafe || !selectedItems.length) return null;

    const now = new Date().toISOString();
    const id = window.crypto?.randomUUID?.() || `order-${Date.now()}`;
    const orderNumber = `ORD-${String(Date.now()).slice(-6)}`;
    const studentId = user?.id || "e0000000-0000-4000-8000-000000000001";

    const order = {
      id,
      order_number: orderNumber,
      student_id: studentId,
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

    setLocalOrders((current) => [order, ...current]);
    clearCart();
    return order;
  }, [cart, clearCart, menuItems, user]);

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
  }), [
    cart,
    hydrated,
    localOrders,
    menuItems,
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
  ]);

  return <KantinContext.Provider value={value}>{children}</KantinContext.Provider>;
}
