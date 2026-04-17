import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  modelMap as defaultModelMap,
  brandOptions as defaultBrands,
  deviceTypeOptions as defaultDeviceTypes,
  colourOptions as defaultColours,
  paymentTypeOptions as defaultPaymentTypes,
  paymentStatusOptions as defaultPaymentStatuses,
} from "../pages/intake/data/intakeData";
import { API_BASE, authFetch } from "../../lib/api";
import { useSite } from "../../context/SiteContext";
import { useAuth } from "../../context/AuthContext";

const STORAGE_KEY = "moduserv:intake-options";

export type IntakeOptions = {
  brands: string[];
  deviceTypes: string[];
  modelMap: Record<string, Record<string, string[]>>;
  colours: string[];
  paymentTypes: string[];
  paymentStatuses: string[];
};

type IntakeOptionsContextType = {
  options: IntakeOptions;
  getModelsFor: (brand: string, deviceType: string) => string[];
  addBrand: (brand: string) => void;
  removeBrand: (brand: string) => void;
  addDeviceType: (deviceType: string) => void;
  removeDeviceType: (deviceType: string) => void;
  addModel: (brand: string, deviceType: string, model: string) => void;
  removeModel: (brand: string, deviceType: string, model: string) => void;
  addColour: (colour: string) => void;
  removeColour: (colour: string) => void;
  addPaymentType: (pt: string) => void;
  removePaymentType: (pt: string) => void;
  addPaymentStatus: (ps: string) => void;
  removePaymentStatus: (ps: string) => void;
  resetToDefaults: () => void;
};

const IntakeOptionsContext = createContext<IntakeOptionsContextType | null>(null);

function buildDefaults(): IntakeOptions {
  return {
    brands: [...defaultBrands],
    deviceTypes: [...defaultDeviceTypes],
    modelMap: JSON.parse(JSON.stringify(defaultModelMap)) as Record<string, Record<string, string[]>>,
    colours: [...defaultColours],
    paymentTypes: [...defaultPaymentTypes],
    paymentStatuses: [...defaultPaymentStatuses],
  };
}

function loadFromStorage(): IntakeOptions {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as IntakeOptions;
  } catch {
    // corrupt — fall through to defaults
  }
  return buildDefaults();
}

export function IntakeOptionsProvider({ children }: { children: React.ReactNode }) {
  const { selectedSiteId } = useSite();
  const { user } = useAuth();
  const [options, setOptions] = useState<IntakeOptions>(loadFromStorage);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
  }, [options]);

  // Fetch from backend only when logged in
  useEffect(() => {
    if (!user) return;
    async function fetchFromAPI() {
      try {
        const res = await authFetch(`${API_BASE}/intake-options?site_id=${selectedSiteId}`);
        if (!res.ok) return;
        const data = await res.json() as IntakeOptions | null;
        if (data && typeof data === "object" && data.brands) {
          setOptions(data);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
      } catch { /* backend offline */ }
    }
    fetchFromAPI();
  }, [user, selectedSiteId]);

  // Debounced sync to backend — fires 1 s after last mutation
  function scheduleSave(nextOptions: IntakeOptions) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      authFetch(`${API_BASE}/intake-options/${selectedSiteId}`, {
        method: "PUT",
        body: JSON.stringify(nextOptions),
      }).catch(() => {});
    }, 1000);
  }

  function getModelsFor(brand: string, deviceType: string): string[] {
    return options.modelMap[brand]?.[deviceType] ?? [];
  }

  function mutate(updater: (prev: IntakeOptions) => IntakeOptions) {
    setOptions((prev) => {
      const next = updater(prev);
      scheduleSave(next);
      return next;
    });
  }

  function addBrand(brand: string) {
    const clean = brand.trim();
    if (!clean || options.brands.includes(clean)) return;
    mutate((prev) => ({ ...prev, brands: [...prev.brands, clean] }));
  }

  function removeBrand(brand: string) {
    mutate((prev) => ({ ...prev, brands: prev.brands.filter((b) => b !== brand) }));
  }

  function addDeviceType(deviceType: string) {
    const clean = deviceType.trim();
    if (!clean || options.deviceTypes.includes(clean)) return;
    mutate((prev) => ({ ...prev, deviceTypes: [...prev.deviceTypes, clean] }));
  }

  function removeDeviceType(deviceType: string) {
    mutate((prev) => ({ ...prev, deviceTypes: prev.deviceTypes.filter((d) => d !== deviceType) }));
  }

  function addModel(brand: string, deviceType: string, model: string) {
    const clean = model.trim();
    if (!clean) return;
    mutate((prev) => {
      const nextMap = { ...prev.modelMap };
      const brandMap = { ...(nextMap[brand] ?? {}) };
      const existing = brandMap[deviceType] ?? [];
      if (existing.includes(clean)) return prev;
      brandMap[deviceType] = [...existing, clean];
      nextMap[brand] = brandMap;
      return { ...prev, modelMap: nextMap };
    });
  }

  function removeModel(brand: string, deviceType: string, model: string) {
    mutate((prev) => {
      const nextMap = { ...prev.modelMap };
      const brandMap = { ...(nextMap[brand] ?? {}) };
      brandMap[deviceType] = (brandMap[deviceType] ?? []).filter((m) => m !== model);
      nextMap[brand] = brandMap;
      return { ...prev, modelMap: nextMap };
    });
  }

  function addColour(colour: string) {
    const clean = colour.trim();
    if (!clean || options.colours.includes(clean)) return;
    mutate((prev) => ({ ...prev, colours: [...prev.colours, clean] }));
  }

  function removeColour(colour: string) {
    mutate((prev) => ({ ...prev, colours: prev.colours.filter((c) => c !== colour) }));
  }

  function addPaymentType(pt: string) {
    const clean = pt.trim();
    if (!clean || options.paymentTypes.includes(clean)) return;
    mutate((prev) => ({ ...prev, paymentTypes: [...prev.paymentTypes, clean] }));
  }

  function removePaymentType(pt: string) {
    mutate((prev) => ({ ...prev, paymentTypes: prev.paymentTypes.filter((p) => p !== pt) }));
  }

  function addPaymentStatus(ps: string) {
    const clean = ps.trim();
    if (!clean || options.paymentStatuses.includes(clean)) return;
    mutate((prev) => ({ ...prev, paymentStatuses: [...prev.paymentStatuses, clean] }));
  }

  function removePaymentStatus(ps: string) {
    mutate((prev) => ({ ...prev, paymentStatuses: prev.paymentStatuses.filter((p) => p !== ps) }));
  }

  function resetToDefaults() {
    const defaults = buildDefaults();
    localStorage.removeItem(STORAGE_KEY);
    setOptions(defaults);
    scheduleSave(defaults);
  }

  const value = useMemo(
    () => ({
      options,
      getModelsFor,
      addBrand,
      removeBrand,
      addDeviceType,
      removeDeviceType,
      addModel,
      removeModel,
      addColour,
      removeColour,
      addPaymentType,
      removePaymentType,
      addPaymentStatus,
      removePaymentStatus,
      resetToDefaults,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options]
  );

  return (
    <IntakeOptionsContext.Provider value={value}>
      {children}
    </IntakeOptionsContext.Provider>
  );
}

export function useIntakeOptions() {
  const ctx = useContext(IntakeOptionsContext);
  if (!ctx) throw new Error("useIntakeOptions must be used inside IntakeOptionsProvider");
  return ctx;
}
