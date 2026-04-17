import type { CustomerRecord } from "../pages/customers/customerTypes";

export const CUSTOMERS_STORAGE_KEY = "moduserv:customers";

export function loadCustomers(fallback: CustomerRecord[] = []): CustomerRecord[] {
  try {
    const raw = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
    if (!raw) return fallback;
    return JSON.parse(raw) as CustomerRecord[];
  } catch {
    return fallback;
  }
}

export function saveCustomers(customers: CustomerRecord[]): void {
  try {
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
  } catch {
    // ignore storage failure for now
  }
}

export function clearCustomers(): void {
  try {
    localStorage.removeItem(CUSTOMERS_STORAGE_KEY);
  } catch {
    // ignore storage failure for now
  }
}