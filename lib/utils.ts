import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { OrderStatus } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "LKR") {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; badge: string; step: number }
> = {
  waiting: { label: "Waiting", color: "#E8A33D", badge: "bg-gold/15 text-gold-dark border-gold/30", step: 0 },
  accepted: { label: "Accepted", color: "#E0454B", badge: "bg-chili/10 text-chili border-chili/30", step: 1 },
  preparing: { label: "Preparing", color: "#E0454B", badge: "bg-chili/10 text-chili border-chili/30", step: 2 },
  ready: { label: "Ready", color: "#3A5A40", badge: "bg-basil/15 text-basil border-basil/30", step: 3 },
  served: { label: "Served", color: "#2B1B12", badge: "bg-espresso/10 text-espresso border-espresso/20", step: 4 },
  cancelled: { label: "Cancelled", color: "#8F1A1F", badge: "bg-chili-dark/10 text-chili-dark border-chili-dark/30", step: -1 },
};

export const ORDER_TIMELINE_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "waiting", label: "Order Placed" },
  { key: "accepted", label: "Accepted" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "served", label: "Served" },
];

export function timeSince(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m ago`;
}
