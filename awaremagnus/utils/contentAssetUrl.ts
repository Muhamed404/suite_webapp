/**
 * Base URL for content assets (logos, document sources).
 * Uses the AWM backend host so paths like "/contents/motion_videos/..." resolve to
 * e.g. https://your-awm-host/contents/motion_videos/system_files/0-2-2-logo-....jpeg
 */
function getContentAssetBase(): string {
  if (typeof process === "undefined") return "";
  const awmUrl = process.env.NEXT_PUBLIC_AWM_API_BASE ?? "";
  if (!awmUrl) return "";
  return awmUrl
}

/**
 * Resolves a content asset URL (e.g. logo_url, source_path) to a full URL.
 * If the path is already absolute (http/https), returns as-is.
 * Otherwise prepends the AWM backend host (NEXT_PUBLIC_AWM_API_BASE origin)
 * so logos and document sources load correctly.
 */
export function getContentAssetUrl(path: string | null | undefined): string {
  if (!path?.trim()) return "";
  const trimmed = path.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const base = getContentAssetBase();
  if (!base) return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}
