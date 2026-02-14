/**
 * Base URL for content assets (logos, document sources).
 * Uses the AWM backend host so paths like "/contents/motion_videos/..." resolve to
 * e.g. https://your-awm-host/contents/motion_videos/system_files/0-2-2-logo-....jpeg
 */
function getContentAssetBase(): string {
  if (typeof window === "undefined") {
    // Server side: return full URL
    return (
      process.env.NEXT_PUBLIC_SERVICE_AWM_URL ??
      process.env.NEXT_PUBLIC_AWM_API_BASE ??
      "http://localhost:3002"
    ).replace(/\/$/, "");
  }
  // Client side: return proxy path. 
  // Assets likely start with /contents/. We want /awm/contents/...
  // So we return the base path /awm.
  return "/awm";
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

  // If already absolute, return as-is
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
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

  const base = getContentAssetBase();

  if (!base) return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  return `${base}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}
