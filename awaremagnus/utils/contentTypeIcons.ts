import { getContentAssetUrl } from "./contentAssetUrl";

/**
 * Maps content type id (from AWM API) to icon path in public folder.
 * 1=Interactive Contents, 2=Motion Videos, 3=Brochures, 4=Posters, 5=Screen Savers,
 * 6=Games, 7=Documents, 8=Misc, 9=VR Games.
 */
const CONTENT_TYPE_ICON_BY_ID: Record<number, string> = {
  1: "/images/img/interact.svg",
  2: "/images/Icon_video.svg",
  3: "/images/Icon_Brouchure.svg",
  4: "/images/Icon_Poster.svg",
  5: "/images/Icon_Ss.svg",
  6: "/images/Icon_Game.svg",
  7: "/images/Icon_Pdf.svg",
  8: "/images/Icon_Music.svg",
  9: "/images/Icon_Game.svg",
};

/**
 * Maps content type name (from API) to icon path in public folder.
 */
const CONTENT_TYPE_ICON_MAP: Record<string, string> = {
  "interactive contents": "/images/img/interact.svg",
  "motion videos": "/images/Icon_video.svg",
  brochures: "/images/Icon_Brouchure.svg",
  brochure: "/images/Icon_Brouchure.svg",
  posters: "/images/Icon_Poster.svg",
  poster: "/images/Icon_Poster.svg",
  "screen savers": "/images/Icon_Ss.svg",
  "screen saver": "/images/Icon_Ss.svg",
  games: "/images/Icon_Game.svg",
  game: "/images/Icon_Game.svg",
  documents: "/images/Icon_Pdf.svg",
  document: "/images/Icon_Pdf.svg",
  misc: "/images/Icon_Music.svg",
  "vr games": "/images/Icon_Game.svg",
  pdf: "/images/Icon_Pdf.svg",
  video: "/images/Icon_video.svg",
  videos: "/images/Icon_video.svg",
  quiz: "/images/Icon_Bulb.svg",
  quizzes: "/images/Icon_Bulb.svg",
  "interactive lesson": "/images/img/interact.svg",
  "interactive content": "/images/img/interact.svg",
  ispring: "/images/img/interact.svg",
};

/** Icon for content type by id (use when you have content_type_id). */
export function getContentTypeIconById(contentTypeId: number): string {
  const path =
    CONTENT_TYPE_ICON_BY_ID[contentTypeId] ??
    CONTENT_TYPE_ICON_MAP.document ??
    "/images/Icon_Pdf.svg";

  return getContentAssetUrl(path);
}

/** Icon for content type by name. */
export function getContentTypeIcon(contentTypeName: string): string {
  if (!contentTypeName?.trim()) {
    return getContentAssetUrl(CONTENT_TYPE_ICON_MAP.document ?? "/images/Icon_Pdf.svg");
  }
  const normalized = contentTypeName.toLowerCase().trim();
  const path =
    CONTENT_TYPE_ICON_MAP[normalized] ?? CONTENT_TYPE_ICON_MAP.document ?? "/images/Icon_Pdf.svg";

  return getContentAssetUrl(path);
}

/** Prefer id when available, else name (e.g. from contentType.name). */
export function getContentTypeIconFor(
  contentTypeId: number | undefined,
  contentTypeName: string | undefined
): string {
  if (contentTypeId != null && CONTENT_TYPE_ICON_BY_ID[contentTypeId]) {
    return getContentAssetUrl(CONTENT_TYPE_ICON_BY_ID[contentTypeId]);
  }

  return getContentTypeIcon(contentTypeName ?? "");
}
