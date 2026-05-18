"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { orgBrandingService } from "@/services/orgBrandingService";
import { useAuthStore } from "@/hooks/useAuthStore";

/** Query key for org branding data */
const ORG_BRANDING_KEY = ["org", "branding", "logo"];

/**
 * Fetch the current org's logo URL.
 * Enabled for all authenticated org users.
 */
export function useOrgLogo() {
  const { user } = useAuthStore();
  const orgId = user?.org_id ?? user?.organization_id;

  return useQuery({
    queryKey: [...ORG_BRANDING_KEY, orgId],
    queryFn: async () => {
      const result = await orgBrandingService.getOrgLogo();
      return result.data ?? null;
    },
    enabled: !!user && orgId != null,
    staleTime: 5 * 60 * 1000, // 5 minutes – logo doesn't change often
    refetchOnWindowFocus: false,
  });
}

/**
 * Upload or replace the organization logo.
 * Invalidates org branding query cache on success.
 */
export function useUploadOrgLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => orgBrandingService.uploadOrgLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORG_BRANDING_KEY });
    },
  });
}

/**
 * Remove the organization logo (revert to default branding).
 * Invalidates org branding query cache on success.
 */
export function useRemoveOrgLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => orgBrandingService.removeOrgLogo(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORG_BRANDING_KEY });
    },
  });
}
