/**
 * Interactive Contents = 1 per contentTypeIcons / AWM API.
 * Used to route to the interactive training detail screen (embed/iframe).
 */
export function isInteractiveContentType(contentTypeId: number | undefined): boolean {
  return contentTypeId === 1;
}
