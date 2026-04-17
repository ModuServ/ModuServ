import { createContext, useContext, useEffect, useState } from "react";
import { loadCustomers, saveCustomers } from "../services/customerStorage";
import type { CustomerRecord } from "../pages/customers/customerTypes";
import { API_BASE, authFetch } from "../../lib/api";
import { useSite } from "../../context/SiteContext";
import { useAuth } from "../../context/AuthContext";
import { useSync } from "../../context/SyncContext";

interface CustomerContextType {
  customers: CustomerRecord[];
  addCustomer: (customer: CustomerRecord) => void;
  updateCustomer: (id: string, updates: Partial<CustomerRecord>) => void;
  upsertCustomer: (input: Omit<CustomerRecord, "id" | "createdAt" | "updatedAt" | "fullName">) => CustomerRecord;
  findCustomerByIdentity: (input: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
  }) => CustomerRecord | null;
  deleteCustomer: (id: string) => Promise<void>;
  clearCustomers: () => void;
}

const CustomerContext = createContext<CustomerContextType | null>(null);

function normalize(value: string | undefined) {
  return String(value || "").trim().toLowerCase();
}

function getNextCustomerId(existingCustomers: CustomerRecord[]) {
  const max = existingCustomers.reduce((highest, item) => {
    const match = item.id.match(/CUS-(\d+)/i);
    if (!match) return highest;
    const value = Number(match[1]);
    return value > highest ? value : highest;
  }, 0);
  return `CUS-${String(max + 1).padStart(3, "0")}`;
}

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const { selectedSiteId } = useSite();
  const { user } = useAuth();
  const { addToQueue } = useSync();
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => loadCustomers([]));

  useEffect(() => {
    saveCustomers(customers);
  }, [customers]);

  // Fetch from backend only when logged in
  useEffect(() => {
    if (!user) return;
    async function fetchFromAPI() {
      try {
        const res = await authFetch(`${API_BASE}/customers?site_id=${selectedSiteId}`);
        if (!res.ok) return;
        const data = await res.json() as CustomerRecord[];
        if (Array.isArray(data)) {
          setCustomers(data);
          saveCustomers(data);
        }
      } catch { /* backend offline */ }
    }
    fetchFromAPI();
  }, [user, selectedSiteId]);

  function addCustomer(customer: CustomerRecord) {
    setCustomers((prev) => [customer, ...prev]);
  }

  function updateCustomer(id: string, updates: Partial<CustomerRecord>) {
    setCustomers((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updates,
              fullName: `${updates.firstName ?? item.firstName} ${updates.lastName ?? item.lastName}`.trim(),
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );

    // Sync to backend
    const existing = customers.find((c) => c.id === id);
    if (existing) {
      authFetch(`${API_BASE}/customers/${id}`, {
        method: "PUT",
        body: JSON.stringify({ ...existing, ...updates }),
      }).catch(() => {
        addToQueue("customer", id, "update", { ...existing, ...updates });
      });
    }
  }

  function findCustomerByIdentity(input: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
  }) {
    const email = normalize(input.email);
    const phone = normalize(input.phoneNumber);
    const firstName = normalize(input.firstName);
    const lastName = normalize(input.lastName);

    return (
      customers.find((customer) => {
        const customerEmail = normalize(customer.email);
        const customerPhone = normalize(customer.phoneNumber);
        const customerFirst = normalize(customer.firstName);
        const customerLast = normalize(customer.lastName);

        const emailMatch = email && customerEmail && email === customerEmail;
        const phoneMatch = phone && customerPhone && phone === customerPhone;
        const namePhoneMatch =
          firstName && lastName && phone &&
          customerFirst === firstName && customerLast === lastName && customerPhone === phone;

        return Boolean(emailMatch || phoneMatch || namePhoneMatch);
      }) || null
    );
  }

  function upsertCustomer(input: Omit<CustomerRecord, "id" | "createdAt" | "updatedAt" | "fullName">) {
    const existing = findCustomerByIdentity(input);
    const now = new Date().toISOString();

    if (existing) {
      const updated: CustomerRecord = {
        ...existing,
        ...input,
        fullName: `${input.firstName} ${input.lastName}`.trim(),
        updatedAt: now,
      };
      setCustomers((prev) => prev.map((item) => (item.id === existing.id ? updated : item)));

      authFetch(`${API_BASE}/customers`, {
        method: "POST",
        body: JSON.stringify({ ...updated, siteId: selectedSiteId }),
      }).catch(() => {
        addToQueue("customer", updated.id, "update", { ...updated, siteId: selectedSiteId });
      });

      return updated;
    }

    const created: CustomerRecord = {
      id: getNextCustomerId(customers),
      ...input,
      fullName: `${input.firstName} ${input.lastName}`.trim(),
      createdAt: now,
      updatedAt: now,
    };
    setCustomers((prev) => [created, ...prev]);

    authFetch(`${API_BASE}/customers`, {
      method: "POST",
      body: JSON.stringify({ ...created, siteId: selectedSiteId }),
    }).catch(() => {
      addToQueue("customer", created.id, "create", { ...created, siteId: selectedSiteId });
    });

    return created;
  }

  async function deleteCustomer(id: string) {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    try {
      await authFetch(`${API_BASE}/customers/${id}`, { method: "DELETE" });
    } catch { /* offline — local removal is sufficient */ }
  }

  function clearCustomers() {
    setCustomers([]);
  }

  return (
    <CustomerContext.Provider
      value={{
        customers,
        addCustomer,
        updateCustomer,
        upsertCustomer,
        findCustomerByIdentity,
        deleteCustomer,
        clearCustomers,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomers() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomers must be used within CustomerProvider");
  return ctx;
}
