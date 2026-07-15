export type OrderStatus =
  | "waiting"
  | "accepted"
  | "preparing"
  | "ready"
  | "served"
  | "cancelled";

export type UserRole = "manager" | "chef";

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  prep_time_minutes: number;
  is_available: boolean;
  is_spicy: boolean;
  is_popular: boolean;
  is_new: boolean;
  sort_order: number;
}

export interface TableRow {
  id: number;
  label: string;
  seats: number;
  is_active: boolean;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  unit_price: number;
  quantity: number;
  notes: string | null;
  line_total: number;
}

export interface Order {
  id: string;
  order_number: number;
  table_id: number;
  status: OrderStatus;
  subtotal: number;
  vat_amount: number;
  service_charge: number;
  grand_total: number;
  estimated_ready_minutes: number;
  waiter_called: boolean;
  bill_requested: boolean;
  bill_settled: boolean;
  settled_at: string | null;
  accepted_at: string | null;
  ready_at: string | null;
  served_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  order_items?: OrderItem[];
  tables?: { label: string };
}

export interface CartLine {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

export interface Review {
  id: string;
  order_id: string | null;
  table_id: number | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface RestaurantSettings {
  id: number;
  restaurant_name: string;
  currency: string;
  vat_rate: number;
  service_charge_rate: number;
}
