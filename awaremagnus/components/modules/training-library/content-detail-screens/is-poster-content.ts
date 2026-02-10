/**
 * Posters content type id = 4 per contentTypeIcons / AWM API.
 * Used to route to the poster-specific detail screen.
 */
export function isPosterContentType(contentTypeId: number | undefined): boolean {
  return contentTypeId === 4;
}
