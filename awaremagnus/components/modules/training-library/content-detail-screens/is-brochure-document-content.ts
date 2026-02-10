/**
 * Brochures = 3, Documents/PDF = 7 per contentTypeIcons / AWM API.
 * Used to route to the brochure/document detail screen with PDF viewer.
 */
export function isBrochureDocumentContentType(contentTypeId: number | undefined): boolean {
  return contentTypeId === 3 || contentTypeId === 7;
}
