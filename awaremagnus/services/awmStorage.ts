/**
 * Centralized AWM File Storage Service
 *
 * Single source of truth for:
 *  - Backend URL configuration
 *  - Client-side asset URL resolution (through Next.js proxy)
 *  - Server-side backend URL construction (for route handlers / SSR)
 *
 * All asset URLs resolve through the Next.js proxy at /awm/{type}/...
 * so the browser never needs direct access to the backend.
 */

// ─── Constants ───────────────────────────────────────────────────────

/** Next.js basePath for the AwareMagnus app */
export const AWM_BASE_PATH = "/awm";

/**
 * Internal backend URL (server-side only).
 * Only used inside Next.js route handlers / server components.
 * Never exposed to the browser.
 */
export const SERVICE_AWM_URL =
  process.env.SERVICE_AWM_URL ||
  process.env.NEXT_PUBLIC_SERVICE_AWM_URL ||
  "http://localhost:3002";

/** Supported asset directory types served by the AWM backend */
export type AssetType = "contents" | "certificates" | "module_translations";

// ─── Client-Side URL Resolvers ───────────────────────────────────────

/**
 * Resolves any asset path to a client-safe URL that routes through the
 * Next.js proxy at `/awm/{assetType}/...`.
 *
 * Handles:
 *  - Absolute URLs (http/https) → returned as-is
 *  - Already-prefixed paths (/awm/...) → returned as-is
 *  - Bare video platform domains → https:// prepended
 *  - Paths starting with /{assetType}/ → /awm prepended
 *  - Bare relative paths → /awm/{assetType}/ prepended
 *
 * @param type    - The asset type ("contents" | "certificates" | "module_translations")
 * @param path    - The raw path from the API (e.g. "/contents/org/1/video.mp4")
 * @returns       - A client-safe URL (e.g. "/awm/contents/org/1/video.mp4")
 */
export function resolveAssetUrl(
  type: AssetType,
  path: string | null | undefined
): string {
  if (!path?.trim()) return "";
  const trimmed = path.trim();

  // Already absolute → return as-is
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Already prefixed with basePath → return as-is
  if (trimmed.startsWith(AWM_BASE_PATH)) {
    return trimmed;
  }

  // Handle common video platform domains missing protocol
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("youtube.com") ||
    lower.startsWith("www.youtube.com") ||
    lower.startsWith("youtu.be") ||
    lower.startsWith("vimeo.com") ||
    lower.startsWith("player.vimeo.com")
  ) {
    return `https://${trimmed}`;
  }

  // Path already starts with the asset directory → prepend basePath
  if (trimmed.startsWith(`/${type}/`)) {
    return `${AWM_BASE_PATH}${trimmed}`;
  }

  // Path starts with / (but not the asset directory) → prepend basePath
  // This covers paths like /images/..., /logo.svg, etc. for "contents" type
  if (trimmed.startsWith("/")) {
    if (type === "contents") {
      // For content type, generic paths like /images/icon.svg are local public assets
      return `${AWM_BASE_PATH}${trimmed}`;
    }
    // For other types, assume the path is within the type directory
    const cleanPath = trimmed.slice(1);
    return `${AWM_BASE_PATH}/${type}/${cleanPath}`;
  }

  // Bare relative path → prepend /awm/{type}/
  return `${AWM_BASE_PATH}/${type}/${trimmed}`;
}

// ─── Convenience Aliases (backward-compatible) ──────────────────────

/**
 * Resolve a content asset URL (logos, videos, source files, public images).
 * Routes through the proxy at `/awm/contents/...`
 */
export function getContentAssetUrl(path: string | null | undefined): string {
  return resolveAssetUrl("contents", path);
}

/**
 * Resolve a module translation asset URL (logo banners).
 * Routes through the proxy at `/awm/module_translations/...`
 */
export function getModuleAssetUrl(path: string | null | undefined): string {
  return resolveAssetUrl("module_translations", path);
}

/**
 * Resolve a certificate asset URL (logos, watermarks, stamps, signatures).
 * Routes through the proxy at `/awm/certificates/...`
 */
export function getCertificateAssetUrl(
  path: string | null | undefined
): string {
  return resolveAssetUrl("certificates", path);
}

// ─── Server-Side Backend URL ────────────────────────────────────────

/**
 * Constructs a full backend URL for a given asset.
 * **Server-side only** — used in route handlers to proxy to the AWM backend.
 *
 * @param type - Asset type
 * @param path - File path segment (e.g. "org/1/logo.png")
 * @returns Full URL like "http://localhost:3002/contents/org/1/logo.png"
 */
export function getBackendFileUrl(type: AssetType, path: string): string {
  const cleanBase = SERVICE_AWM_URL.replace(/\/+$/, "");
  return `${cleanBase}/${type}/${path}`;
}
