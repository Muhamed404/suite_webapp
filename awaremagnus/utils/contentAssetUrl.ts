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
