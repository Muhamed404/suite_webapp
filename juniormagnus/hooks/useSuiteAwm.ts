import { useQuery } from "@tanstack/react-query";

import { suiteAwmService } from "@/services/suiteAwmService";
import { suiteSuiteService } from "@/services/suiteSuiteService";
import { quizService } from "@/services/quizService";

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
    queryFn: () => quizService.getCategories(),
    enabled,
    staleTime: 10 * 60 * 1000,
    select: (data) => data?.object?.categories ?? data?.data?.categories ?? [],
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
 * Fetch global categories from SERVICE_JNR backend.
 * GET /api/jnr/category
 * Returns { success, data: { categories: [...], count } }
 */
export function useAwmCategories(enabled = true) {
  return useQuery({
    queryKey: SUITE_AWM_KEYS.awmCategories,
    queryFn: () => quizService.getCategories(),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes — categories rarely change
    select: (data) => data?.object?.categories ?? data?.data?.categories ?? [],
  });
}
