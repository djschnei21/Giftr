export const FESTIVITY_STORAGE_KEY = "giftr-festivity";

export const FESTIVITY_LEVELS = ["high", "medium", "low"] as const;

export type FestivityLevel = (typeof FESTIVITY_LEVELS)[number];

export const DEFAULT_FESTIVITY: FestivityLevel = "high";

const FESTIVITY_EVENT = "giftr-festivity-change";

/** Last choice applied in this tab, used when storage is blocked. */
let memory: FestivityLevel = DEFAULT_FESTIVITY;

/** Missing or unknown values resolve to High, which is today's Giftr. */
export function parseFestivity(value: string | null | undefined): FestivityLevel {
  return value === "high" || value === "medium" || value === "low" ? value : DEFAULT_FESTIVITY;
}

/**
 * Blocking script for the root layout `<head>`. It writes `data-festivity`
 * before the body is parsed, so a saved Low setting does not flash snow.
 * Keep the accepted values in step with `parseFestivity`.
 */
export const FESTIVITY_BOOT_SCRIPT = `(function(){try{var v=localStorage.getItem(${JSON.stringify(FESTIVITY_STORAGE_KEY)});var l=v==="medium"||v==="low"?v:"high";document.documentElement.setAttribute("data-festivity",l)}catch(e){document.documentElement.setAttribute("data-festivity","high")}})();`;

export function readFestivity(): FestivityLevel {
  if (typeof window === "undefined") return DEFAULT_FESTIVITY;
  try {
    return parseFestivity(localStorage.getItem(FESTIVITY_STORAGE_KEY));
  } catch {
    return memory;
  }
}

export function applyFestivity(level: FestivityLevel) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-festivity", level);
}

export function setFestivity(level: FestivityLevel) {
  const next = parseFestivity(level);
  memory = next;
  try {
    localStorage.setItem(FESTIVITY_STORAGE_KEY, next);
  } catch {
    // Private mode can reject storage. The attribute still updates this page.
  }
  applyFestivity(next);
  if (typeof window !== "undefined") window.dispatchEvent(new Event(FESTIVITY_EVENT));
}

export function subscribeFestivity(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === FESTIVITY_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(FESTIVITY_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(FESTIVITY_EVENT, onStoreChange);
  };
}
