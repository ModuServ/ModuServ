export function safeText(value: unknown, fallback: string = ""): string {
  if (value === null || value === undefined) return fallback;

  let str = String(value).trim();

  if (/Ã|Â|�/.test(str)) {
    return fallback || "Invalid data";
  }

  str = str.replace(/[\u0000-\u001F\u007F]/g, "");
  str = str.replace(/\s+/g, " ");

  return str.length > 0 ? str : fallback;
}