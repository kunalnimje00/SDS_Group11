export const cafes = [
  {
    id: "c0ffee00-0000-4000-8000-000000000001",
    name: "Demo Cafe",
    is_active: true,
    timezone: "Asia/Kolkata",
    is_accepting_orders: true,
    hours: [
      "Mon–Fri · 08:00–14:00, 16:00–22:00",
      "Sat · 09:00–15:00",
      "Sun · Closed",
    ],
  },
];

export const menuItems = [
  {
    id: "b0000000-0000-4000-8000-000000000001",
    cafe_id: "c0ffee00-0000-4000-8000-000000000001",
    name: "Masala Dosa",
    description: "Crisp dosa with potato masala, chutney and sambar",
    price_paise: 6000,
    prep_minutes: 12,
    is_available: true,
  },
  {
    id: "b0000000-0000-4000-8000-000000000002",
    cafe_id: "c0ffee00-0000-4000-8000-000000000001",
    name: "Veg Sandwich",
    description: "Grilled, with mint chutney",
    price_paise: 4500,
    prep_minutes: 8,
    is_available: true,
  },
  {
    id: "b0000000-0000-4000-8000-000000000003",
    cafe_id: "c0ffee00-0000-4000-8000-000000000001",
    name: "Filter Coffee",
    description: "South Indian filter coffee",
    price_paise: 2500,
    prep_minutes: 4,
    is_available: true,
  },
  {
    id: "b0000000-0000-4000-8000-000000000004",
    cafe_id: "c0ffee00-0000-4000-8000-000000000001",
    name: "Samosa (2 pcs)",
    description: "With tamarind chutney",
    price_paise: 3000,
    prep_minutes: 5,
    is_available: true,
  },
  {
    id: "b0000000-0000-4000-8000-000000000005",
    cafe_id: "c0ffee00-0000-4000-8000-000000000001",
    name: "Paneer Wrap",
    description: "Tandoori paneer, onions, mint mayo",
    price_paise: 8000,
    prep_minutes: 10,
    is_available: true,
  },
];

export const destinations = [
  {
    id: "d0000000-0000-4000-8000-000000000001",
    name: "Main Library",
    campus: "Main Campus",
    travel_minutes: 5,
    is_active: true,
  },
  {
    id: "d0000000-0000-4000-8000-000000000002",
    name: "Hostel Block A",
    campus: "Main Campus",
    travel_minutes: 10,
    is_active: true,
  },
  {
    id: "d0000000-0000-4000-8000-000000000003",
    name: "Engineering Block",
    campus: "North Campus",
    travel_minutes: 15,
    is_active: true,
  },
];

const studentId = "e0000000-0000-4000-8000-000000000001";
const cafeId = cafes[0].id;

export const demoOrders = [
  {
    id: "a0000000-0000-4000-8000-000000000001",
    order_number: "ORD-000274",
    student_id: studentId,
    cafe_id: cafeId,
    destination_id: destinations[0].id,
    status: "preparing",
    total_paise: 8500,
    idempotency_key: "demo-order-key-274",
    estimated_ready_at: "2026-10-23T09:30:00.000Z",
    estimated_delivery_at: null,
    created_at: "2026-10-23T09:12:00.000Z",
    updated_at: "2026-10-23T09:18:00.000Z",
    items: [
      {
        id: "f0000000-0000-4000-8000-000000000001",
        order_id: "a0000000-0000-4000-8000-000000000001",
        menu_item_id: menuItems[0].id,
        item_name_snapshot: "Masala Dosa",
        unit_price_paise: 6000,
        quantity: 1,
        line_total_paise: 6000,
        status: "included",
      },
      {
        id: "f0000000-0000-4000-8000-000000000002",
        order_id: "a0000000-0000-4000-8000-000000000001",
        menu_item_id: menuItems[2].id,
        item_name_snapshot: "Filter Coffee",
        unit_price_paise: 2500,
        quantity: 1,
        line_total_paise: 2500,
        status: "included",
      },
    ],
  },
  {
    id: "a0000000-0000-4000-8000-000000000002",
    order_number: "ORD-000263",
    student_id: studentId,
    cafe_id: cafeId,
    destination_id: destinations[1].id,
    status: "delivered",
    total_paise: 4500,
    idempotency_key: "demo-order-key-263",
    estimated_ready_at: "2026-10-22T08:40:00.000Z",
    estimated_delivery_at: "2026-10-22T08:55:00.000Z",
    created_at: "2026-10-22T08:30:00.000Z",
    updated_at: "2026-10-22T08:55:00.000Z",
    items: [
      {
        id: "f0000000-0000-4000-8000-000000000003",
        order_id: "a0000000-0000-4000-8000-000000000002",
        menu_item_id: menuItems[1].id,
        item_name_snapshot: "Veg Sandwich",
        unit_price_paise: 4500,
        quantity: 1,
        line_total_paise: 4500,
        status: "included",
      },
    ],
  },
];

export const demoOrderEvents = {
  "a0000000-0000-4000-8000-000000000001": [
    { id: "ev-274-1", order_id: "a0000000-0000-4000-8000-000000000001", event_type: "status_changed", from_status: null, to_status: "pending", actor_id: null, actor_role: "student", reason: null, metadata: null, created_at: "2026-10-23T09:12:00.000Z" },
    { id: "ev-274-2", order_id: "a0000000-0000-4000-8000-000000000001", event_type: "status_changed", from_status: "pending", to_status: "accepted", actor_id: null, actor_role: "cafe", reason: null, metadata: null, created_at: "2026-10-23T09:15:00.000Z" },
    { id: "ev-274-3", order_id: "a0000000-0000-4000-8000-000000000001", event_type: "status_changed", from_status: "accepted", to_status: "preparing", actor_id: null, actor_role: "cafe", reason: null, metadata: null, created_at: "2026-10-23T09:18:00.000Z" },
  ],
};

export const ORDER_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export function getCafe(cafeId) {
  return cafes.find((cafe) => cafe.id === cafeId) || null;
}

export function getMenuItemsForCafe(cafeId) {
  return menuItems.filter((item) => item.cafe_id === cafeId);
}
