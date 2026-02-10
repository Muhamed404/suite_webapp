/**
 * Utilities to detect video URL types and build embed URLs for iframe fallback.
 * Used when React Player cannot play a URL (e.g. unsupported platform or playback error).
 */

export function isYouTubeUrl(url: string): boolean {
  try {
    const u = new URL(url);

    return (
      u.hostname === "www.youtube.com" || u.hostname === "youtube.com" || u.hostname === "youtu.be"
    );
  } catch {
    return false;
  }
}

export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();

  // Handle strings that might miss protocol but are clearly YouTube
  let fullUrl = trimmed;

  if (!trimmed.startsWith("http")) {
    fullUrl = `https://${trimmed}`;
  }

  try {
    const u = new URL(fullUrl);

    // youtu.be/ID
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1).split(/[?#]/)[0];

      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    // youtube.com/watch?v=ID
    const v = u.searchParams.get("v");

    if (v) return `https://www.youtube.com/embed/${v}`;

    // youtube.com/embed/ID (already embed URL)
    if (u.pathname.startsWith("/embed/")) {
      return `https://www.youtube.com/embed/${u.pathname.split("/")[2]}`;
    }

    // youtube.com/shorts/ID
    if (u.pathname.startsWith("/shorts/")) {
      const id = u.pathname.split("/")[2];

      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    // youtube.com/v/ID
    if (u.pathname.startsWith("/v/")) {
      const id = u.pathname.split("/")[2];

      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    return null;
  } catch {
    return null;
  }
}

export function isVimeoUrl(url: string): boolean {
  try {
    const u = new URL(url);

    return u.hostname === "vimeo.com" || u.hostname === "player.vimeo.com";
  } catch {
    return false;
  }
}

export function getVimeoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);

    if (u.hostname === "player.vimeo.com") return url;
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);

    return match ? `https://player.vimeo.com/video/${match[1]}` : null;
  } catch {
    return null;
  }
}

export function isFileUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();

    return (
      path.endsWith(".mp4") ||
      path.endsWith(".webm") ||
      path.endsWith(".mov") ||
      path.endsWith(".ogg") ||
      path.endsWith(".m3u8") ||
      path.endsWith(".avi")
    );
  } catch {
    return false;
  }
}

/**
 * Returns an embeddable iframe URL for the given video URL, or null if not embeddable.
 * Used as fallback when React Player fails or doesn't support the platform.
 */
export function getVideoEmbedUrl(url: string): string | null {
  if (isYouTubeUrl(url)) return getYouTubeEmbedUrl(url);
  if (isVimeoUrl(url)) return getVimeoEmbedUrl(url);
  // For direct file URLs, the URL itself can be used in a video element or React Player
  if (isFileUrl(url)) return null; // Files should use React Player or native video

  // Generic: some hosts allow embedding with the URL directly (e.g. Wistia, some CDNs)
  return url;
}
