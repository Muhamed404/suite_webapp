/**
 * Maps content type name (from API) to icon path in public folder.
 * Used on module details and content list to show the correct icon per type.
 */
const CONTENT_TYPE_ICON_MAP: Record<string, string> = {
  document: "/images/attachment.svg",
  documents: "/images/attachment.svg",
  video: "/images/Icon_video.svg",
  videos: "/images/Icon_video.svg",
  "motion videos": "/images/Icon_video.svg",
  quiz: "/images/img/form.svg",
  quizzes: "/images/img/form.svg",
  posters: "/images/img/form.svg",
  "screen savers": "/images/img/form.svg",
  "screen saver": "/images/img/form.svg",
  games: "/images/img/Icon_Trophy.svg",
  game: "/images/img/Icon_Trophy.svg",
  "interactive lesson": "/images/img/interact.svg",
  "interactive content": "/images/img/interact.svg",
};

/**
 * Returns the icon path for a content type by name.
 * Matches case-insensitively; falls back to a default document icon if no match.
 */
export function getContentTypeIcon(contentTypeName: string): string {
  if (!contentTypeName?.trim()) {
    return CONTENT_TYPE_ICON_MAP.document ?? "/images/attachment.svg";
  }
  const normalized = contentTypeName.toLowerCase().trim();
  return (
    CONTENT_TYPE_ICON_MAP[normalized] ??
    CONTENT_TYPE_ICON_MAP.document ??
    "/images/attachment.svg"
  );
}
