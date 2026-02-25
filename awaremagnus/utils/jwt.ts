/**
 * JWT Utility Functions
 * Decodes and extracts information from JWT tokens
 */

export interface JwtPayload {
  userId?: number;
  id?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  organization_id?: number;
  org_id?: number;
  role?: {
    id: number;
    name?: string;
  };
  permissions?: Array<{
    module: string;
    name: string;
  }>;
  [key: string]: any;
}

/**
 * Safely decode a JWT token without verification (client-side only)
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export const decodeJwt = (token: string | null | undefined): JwtPayload | null => {
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
};

/**
 * Extract user display name from JWT payload
 * Tries: first_name + last_name, name, email (before @), or fallback
 * Handles both root-level and nested user field structures
 */
export const extractUserDisplayName = (payload: JwtPayload | null): string => {
  if (!payload) return "User";

  // Handle nested user structure (when payload has { user: { ... } })
  const userData = (payload as any)?.user || payload;

  // Try full name first
  if (userData.first_name || userData.last_name) {
    return `${userData.first_name || ""} ${userData.last_name || ""}`.trim();
  }

  // Try name field
  if (userData.name) {
    return userData.name;
  }

  // Extract from email (before @)
  if (userData.email) {
    const namePart = userData.email.split("@")[0];
    // Convert snake_case, dot notation, or numbers to title case
    return namePart
      .split(/[._\-]/)
      .filter((part: string) => part && isNaN(Number(part))) // Filter out numbers and empty
      .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ")
      .trim() || "User"; // Fallback if all parts were numbers
  }

  return "User";
};

/**
 * Extract user email from JWT payload
 * Handles both root-level and nested user field structures
 */
export const extractUserEmail = (payload: JwtPayload | null): string => {
  if (!payload) return "user@example.com";
  
  const userData = (payload as any)?.user || payload;
  return userData?.email || "user@example.com";
};

/**
 * Extract user ID from JWT payload
 * Handles both userId and id field names
 */
export const extractUserId = (payload: JwtPayload | null): number | null => {
  if (!payload) return null;
  
  const userData = (payload as any)?.user || payload;
  return userData?.userId || userData?.id || null;
};
