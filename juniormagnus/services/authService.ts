import type { AuthUser } from "@/hooks/useAuthStore";

import { jnrClient, API_BASE, suiteClient } from "./httpClient";

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  object?: {
    userToken?: string;
    mfaRequired?: boolean;
  };
}

interface JwtUserPayload {
  userId: number;
  email: string;
  organization_id?: number | null;
  org_id?: number | null;
  permissions?: Array<{
    module: string;
    name: string;
  }>;
  role?: {
    id: number;
  };
}

interface DecodedJwt {
  user?: JwtUserPayload;
  iss?: string;
  sub?: string;
  iat?: number;
  exp?: number;
}

const decodeJwt = (token: string): DecodedJwt | null => {
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

    return JSON.parse(jsonPayload) as DecodedJwt;
  } catch {
    return null;
  }
};

export const authService = {
  async login(
    payload: LoginPayload
  ): Promise<{ user: AuthUser; token: string | null; mfaRequired: boolean }> {
    const response = await suiteClient.post<LoginResponse>("/login", {
      ...payload,
      product: "jnr",
    });

    const token = response.data.object?.userToken ?? null;
    const mfaRequired = response.data.object?.mfaRequired ?? false;

    if (!token) {
      throw new Error("Invalid login response: missing userToken");
    }

    const decoded = decodeJwt(token);
    const jwtUser = decoded?.user;

    if (!jwtUser) {
      throw new Error("Invalid login token: missing user payload");
    }

    return {
      user: {
        id: jwtUser.userId,
        email: jwtUser.email,
        organization_id: jwtUser.organization_id ?? undefined,
        org_id: jwtUser.org_id ?? undefined,
        role_id: jwtUser.role?.id as AuthUser["role_id"],
        permissions: jwtUser.permissions,
      },
      token,
      mfaRequired,
    };
  },

  async logout(): Promise<void> {
    try {
      await suiteClient.get("/logout");
    } catch (error: any) {
      // If logout endpoint doesn't exist (404) or any other error, just continue
      // The frontend will clear auth state and redirect to login
      if (error?.response?.status === 404) {
        console.info("Logout endpoint not found; clearing session locally");
      } else {
        console.warn("Logout API call failed:", error?.message);
      }
      // Continue without failing - JWT expiry will handle session termination
    }
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    // This assumes an endpoint that returns the currently authenticated user
    // aligned with the validateSessionMiddleware described in the docs.
    const response = await jnrClient.get<{ user: AuthUser | null }>(`${API_BASE}/auth/me`);

    return response.data.user ?? null;
  },

  /**
   * Generate JWT token for development/testing (AWM API: POST /auth/generate-token).
   * Role IDs: 1=Super Magnus, 2=Sub Magnus, 3=Super Org User, 4=Sub Org User, 5=Org User.
   */
  async generateTestToken(payload: {
    user_id: number;
    org_id: number;
    email: string;
    role_id: number;
  }): Promise<{ token: string; expiresIn: string; payload: Record<string, unknown> }> {
    const response = await jnrClient.post<{
      message?: string;
      statusCode?: number;
      alertType?: string;
      object?: { token: string; expiresIn: string; payload: Record<string, unknown> };
    }>(`${API_BASE}/auth/generate-token`, payload);
    const obj = response.data.object;

    if (!obj?.token) {
      throw new Error(response.data.message ?? "Failed to generate token");
    }

    return { token: obj.token, expiresIn: obj.expiresIn ?? "24h", payload: obj.payload ?? {} };
  },

  /**
   * Parse a JWT token (e.g. from redirect hash) into auth state without a network call.
   * Used when landing from suite "View Dashboard" redirect with #token=...
   */
  parseTokenForAuth(token: string): { user: AuthUser; token: string } | null {
    if (!token?.trim()) return null;
    const decoded = decodeJwt(token);
    const jwtUser = decoded?.user;

    if (!jwtUser) return null;

    return {
      user: {
        id: jwtUser.userId,
        email: jwtUser.email,
        organization_id: jwtUser.organization_id ?? undefined,
        org_id: jwtUser.org_id ?? undefined,
        role_id: jwtUser.role?.id as AuthUser["role_id"],
        permissions: jwtUser.permissions,
      },
      token,
    };
  },
};
