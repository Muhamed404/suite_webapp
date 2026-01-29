import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authService, type LoginPayload } from "./authService";
import { useAuthStore } from "@/hooks/useAuthStore";
import { registerAuthTokenGetter, registerOnUnauthorizedHandler } from "./httpClient";

const AUTH_QUERY_KEY = ["auth", "me"];

// Register token getter and unauthorized handler once when this module is loaded (client-side)
if (typeof window !== "undefined") {
  registerAuthTokenGetter(() => useAuthStore.getState().token);
  registerOnUnauthorizedHandler(() => {
    useAuthStore.getState().reset();
  });
}

export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, setToken, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: (payload: LoginPayload) => {
      setLoading(true);
      return authService.login(payload);
    },
    onSuccess: async ({ user, token, mfaRequired }) => {
      // MFA flow can be handled here in the future if needed
      setUser(user);
      setToken(token);
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




