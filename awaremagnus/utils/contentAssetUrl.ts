const AWM_BASE_PATH = "/awm";

/**
 * Resolves a content asset URL (e.g. logo_url, source_path, or public images) to a full URL.
 */
export function getContentAssetUrl(path: string | null | undefined): string {
  if (!path?.trim()) return "";
  const trimmed = path.trim();

  // If already absolute, return as-is
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // If already starts with base path, return as-is
  if (trimmed.startsWith(AWM_BASE_PATH)) {
    return trimmed;
  }

  // Handle common video platform domains that might be missing protocol
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

  // For local relative paths (starting with /), we want to prepend /awm
  // so they resolve correctly under the Next.js basePath.
  // This applies to /images/, /icons/, /logo.svg, /favicon.ico, etc.
  if (trimmed.startsWith("/")) {
    // If it's a backend-served content asset (e.g. uploaded videos, logos),
    // proxy through the Next.js route handler at /awm/contents/...
    if (trimmed.startsWith("/contents/")) {
      return `${AWM_BASE_PATH}${trimmed}`;
    }

    // Otherwise, prepend /awm (basePath) for local public assets
    return `${AWM_BASE_PATH}${trimmed}`;
  }

  // For paths NOT starting with / (relative to current page), prepend /awm/
  return `${AWM_BASE_PATH}/${trimmed}`;
}

/**
 * Resolves a module translation asset URL (logos, banners, etc.) to a direct backend URL.
 */
export function getModuleAssetUrl(path: string | null | undefined): string {
  if (!path?.trim()) return "";
  const trimmed = path.trim();

  // If already absolute, return as-is
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Get backend URL from environment
  const backendUrl = process.env.NEXT_PUBLIC_SERVICE_AWM_URL ?? "http://localhost:3002";

  // If path starts with /module_translations/, construct direct backend URL
  if (trimmed.startsWith("/module_translations/")) {
    return `${backendUrl}${trimmed}`;
  }

  // If it's a relative path, assume it's module_translations
  if (!trimmed.startsWith("/")) {
    return `${backendUrl}/module_translations/${trimmed}`;
  }

  // For other paths, fallback to direct backend
  return `${backendUrl}${trimmed}`;
}

/**
 * Resolves a certificate asset URL (logos, watermarks, etc.) through the same-origin proxy.
 */
export function getCertificateAssetUrl(path: string | null | undefined): string {
  if (!path?.trim()) return "";
  const trimmed = path.trim();

  // If already absolute, return as-is
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // If already starts with base path /awm/certificates/, return as-is
  if (trimmed.startsWith(`${AWM_BASE_PATH}/certificates/`)) {
    return trimmed;
  }

  // If it starts with /certificates/, prepend /awm (basePath)
  if (trimmed.startsWith("/certificates/")) {
    return `${AWM_BASE_PATH}${trimmed}`;
  }

  // Otherwise, prepend /awm/certificates/
  const cleanPath = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;

  return `${AWM_BASE_PATH}/certificates/${cleanPath}`;
}
