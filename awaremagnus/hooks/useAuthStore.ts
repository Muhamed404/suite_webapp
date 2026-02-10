"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { RoleId } from "@/utils/roles";

/** Tracks when persisted auth state has been rehydrated from storage (avoids redirect-to-login on reload). */
export const useAuthRehydratedStore = create<{
  hasRehydrated: boolean;
  setRehydrated: (v: boolean) => void;
}>((set) => ({
  hasRehydrated: false,
  setRehydrated: (v) => set({ hasRehydrated: v }),
}));

export type AuthRoleId = RoleId;

export interface AuthUser {
  id: number;
  email: string;
  organization_id?: number;
  org_id?: number;
  role_id?: AuthRoleId;
  permissions?: Array<{
    module: string;
    name: string;
  }>;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      setUser: (user) =>
        set((state) => ({
          ...state,
          user,
          isAuthenticated: !!user,
        })),
      setToken: (token) =>
        set((state) => ({
          ...state,
          token,
        })),
      setLoading: (isLoading) =>
        set((state) => ({
          ...state,
          isLoading,
        })),
      reset: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    {
      name: "aware-magnus-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => () => {
        useAuthRehydratedStore.getState().setRehydrated(true);
      },
    }
  )
);
