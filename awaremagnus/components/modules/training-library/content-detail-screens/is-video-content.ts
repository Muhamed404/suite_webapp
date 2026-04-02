/**
 * Determines if a content type is video-related (Video, Motion Videos, etc.).
 * Used to route to the video-specific detail screen.
 */
export function isVideoContentType(
  contentTypeId: number | undefined,
  contentTypeName: string | undefined
): boolean {
  if (contentTypeId != null) {
    // contentTypeId 2 = Motion Videos per contentTypeIcons
    if (contentTypeId === 2) return true;
    // Some backends may use different IDs for video
    if (contentTypeId === 1 && contentTypeName) {
      const n = contentTypeName.toLowerCase();

      if (n.includes("video") || n.includes("motion")) return true;
    }
  }
  if (contentTypeName?.trim()) {
    const n = contentTypeName.toLowerCase().trim();

    return n.includes("video") || n.includes("motion");
  }

  return false;
}
