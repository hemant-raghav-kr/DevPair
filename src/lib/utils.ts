/**
 * Utility functions for DevPair
 */

/**
 * Conditionally joins CSS class names together.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Formats a date string into a localized human-readable format.
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/**
 * Truncates text cleanly with an ellipsis.
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

/**
 * Resolves the canonical base application URL for DevPair.
 *
 * Evaluation order:
 * 1. NEXT_PUBLIC_APP_URL environment variable (configured in Vercel / .env)
 * 2. Window location origin (when running in client browser)
 * 3. Vercel deployment URL (NEXT_PUBLIC_VERCEL_URL / VERCEL_URL)
 * 4. Production fallback domain (https://dev-pair-delta.vercel.app)
 * 5. Local development fallback (http://localhost:3000)
 *
 * Guarantees:
 * - Never includes a trailing slash.
 * - In production environments, never returns localhost or 127.0.0.1.
 */
export function getAppUrl(): string {
  // 1. Explicitly configured public app URL
  const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (publicAppUrl) {
    const cleaned = publicAppUrl.replace(/\/+$/, "");
    if (
      process.env.NODE_ENV === "production" &&
      (cleaned.includes("localhost") || cleaned.includes("127.0.0.1"))
    ) {
      return "https://dev-pair-delta.vercel.app";
    }
    return cleaned;
  }

  // 2. Client-side browser window origin
  if (typeof window !== "undefined" && window.location?.origin) {
    const origin = window.location.origin.trim().replace(/\/+$/, "");
    if (origin) {
      if (
        process.env.NODE_ENV === "production" &&
        (origin.includes("localhost") || origin.includes("127.0.0.1"))
      ) {
        return "https://dev-pair-delta.vercel.app";
      }
      return origin;
    }
  }

  // 3. Vercel deployment URL
  const vercelUrl = (process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL)?.trim();
  if (vercelUrl) {
    const formatted = vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
    return formatted.replace(/\/+$/, "");
  }

  // 4. Production fallback
  if (process.env.NODE_ENV === "production") {
    return "https://dev-pair-delta.vercel.app";
  }

  // 5. Local development fallback
  return "http://localhost:3000";
}

