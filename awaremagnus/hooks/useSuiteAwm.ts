import { useQuery } from "@tanstack/react-query";

import { suiteAwmService } from "@/services/suiteAwmService";
import { suiteSuiteService } from "@/services/suiteSuiteService";

export const SUITE_AWM_KEYS = {
  categories: ["suite-awm", "categories"] as const,
  category: (id: number) => ["suite-awm", "category", id] as const,
  contentTypes: ["suite-awm", "content-types"] as const,
  contentType: (id: number) => ["suite-awm", "content-type", id] as const,
  licenseInfo: ["suite", "management", "information"] as const,
  awmCategories: ["awm", "categories"] as const,
};

export function useCategories(enabled = true) {
  return useQuery({
    queryKey: SUITE_AWM_KEYS.categories,
    queryFn: () => suiteAwmService.getCategories(),
    enabled,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCategory(id: number, enabled = true) {
  return useQuery({
    queryKey: SUITE_AWM_KEYS.category(id),
    queryFn: () => suiteAwmService.getCategoryById(id),
    enabled: enabled && !!id,
  });
}

export function useContentTypes(enabled = true) {
  return useQuery({
    queryKey: SUITE_AWM_KEYS.contentTypes,
    queryFn: () => suiteAwmService.getContentTypes(),
    enabled,
  });
}

export function useContentType(id: number, enabled = true) {
  return useQuery({
    queryKey: SUITE_AWM_KEYS.contentType(id),
    queryFn: () => suiteAwmService.getContentTypeById(id),
    enabled: enabled && !!id,
  });
}

/**
 * Fetch license management info from service_suite.
 * GET /suite/management/information
 * Returns { ProductName: { Subscription: { TotalUserLicense, TotalAvailable, ... } } }
 */
export function useLicenseInfo(enabled = true) {
  return useQuery({
    queryKey: SUITE_AWM_KEYS.licenseInfo,
    queryFn: () => suiteSuiteService.getManagementInfo(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes — license info doesn't change often
  });
}

/**
 * Fetch global categories from service_suite backend.
 * GET /awm/categories (via suite client)
 * Returns SuiteCategory[]
 */
export function useAwmCategories(enabled = true) {
  return useQuery({
    queryKey: SUITE_AWM_KEYS.awmCategories,
    queryFn: () => suiteAwmService.getCategories(),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes — categories rarely change
  });
}

