/** Image extensions supported for brochure/poster source files (matches AWM upload rules). */
export const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg"]);

/** Office document extensions (brochure/document types). */
export const DOC_EXTENSIONS = new Set(["doc", "docx"]);

export type ContentMediaKind = "pdf" | "image" | "doc" | "other";

export function extractFileExtension(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const cleanUrl = url.trim().split("?")[0].split("#")[0];
  const lastDot = cleanUrl.lastIndexOf(".");

  if (lastDot < 0 || lastDot === cleanUrl.length - 1) return null;

  return cleanUrl.slice(lastDot + 1).toLowerCase();
}

/**
 * Infer how to render a content source URL. Uses the file extension only —
 * never treats a missing extension as PDF.
 */
export function getContentMediaKind(url: string | null | undefined): ContentMediaKind | null {
  if (!url?.trim()) return null;

  const ext = extractFileExtension(url);

  if (ext === "pdf") return "pdf";
  if (ext && IMAGE_EXTENSIONS.has(ext)) return "image";
  if (ext && DOC_EXTENSIONS.has(ext)) return "doc";

  const lower = url.split("?")[0].toLowerCase();

  if (lower.includes(".pdf")) return "pdf";
  if (/\.(png|jpe?g|gif|webp|svg)(?:$|[?#])/i.test(lower)) return "image";
  if (/\.(doc|docx)(?:$|[?#])/i.test(lower)) return "doc";

  return "other";
}

export function isPdfContent(url: string | null | undefined): boolean {
  return getContentMediaKind(url) === "pdf";
}

export function isImageContent(url: string | null | undefined): boolean {
  return getContentMediaKind(url) === "image";
}

/** Resolve AWM-relative content paths to same-origin proxy URLs. */
export function resolveAwmContentUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();

  if (s.startsWith("http")) return s;
  if (s.startsWith("/contents/")) return `/awm${s}`;

  return `/awm/contents/${s.startsWith("/") ? s.slice(1) : s}`;
}

/** Accept attribute for brochure/poster file inputs. */
export const BROCHURE_POSTER_FILE_ACCEPT =
  "application/pdf,image/jpeg,image/png,image/gif,image/webp,image/svg+xml,.pdf,.jpg,.jpeg,.png,.gif,.webp,.svg";
