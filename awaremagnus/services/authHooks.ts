import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authService, type LoginPayload } from "./authService";
import { setAuthTokenCookie, clearAuthTokenCookie } from "./httpClient";

import { useAuthStore } from "@/hooks/useAuthStore";

const AUTH_QUERY_KEY = ["auth", "me"];

// Token getter is registered in authBootstrap (imported from LayoutWrapper) so all
// pages send the Bearer token. No need to register here.

export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, setToken, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: (payload: LoginPayload) => {
      setLoading(true);

      return authService.login(payload);
    },
    onSuccess: async ({ user, token, mfaRequired: _mfaRequired }) => {
      setUser(user);
      setToken(token);
      if (token) setAuthTokenCookie(token);
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      router.push("/dashboard");
    },
    onError: () => {
      // keep store state; error is handled by caller
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const reset = useAuthStore((state) => state.reset);

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: async () => {
      clearAuthTokenCookie();
      reset();
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      router.push("/login");
    },
  });
};

export const useCurrentUser = () => {
  const { setUser, setLoading } = useAuthStore();

  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      setLoading(true);
      const user = await authService.getCurrentUser();

      setUser(user);

      return user;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: false, // opt-in by calling refetch in a client component
  });
};
