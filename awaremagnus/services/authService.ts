import { awmClient, suiteClient } from "./httpClient";
import type { AuthUser } from "@/hooks/useAuthStore";

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
        .join(""),
    );

    return JSON.parse(jsonPayload) as DecodedJwt;
  } catch {
    return null;
  }
};

export const authService = {
  async login(
    payload: LoginPayload,
  ): Promise<{ user: AuthUser; token: string | null; mfaRequired: boolean }> {
    const response = await suiteClient.post<LoginResponse>("/login", payload);

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
    await suiteClient.get("/logout");
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    // This assumes an endpoint that returns the currently authenticated user
    // aligned with the validateSessionMiddleware described in the docs.
    const response = await awmClient.get<{ user: AuthUser | null }>("/api/awm/auth/me");
    return response.data.user ?? null;
  },
};




