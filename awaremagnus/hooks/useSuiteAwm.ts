import { useQuery } from "@tanstack/react-query";

import { suiteAwmService } from "@/services/suiteAwmService";

export const SUITE_AWM_KEYS = {
  categories: ["suite-awm", "categories"] as const,
  category: (id: number) => ["suite-awm", "category", id] as const,
  contentTypes: ["suite-awm", "content-types"] as const,
  contentType: (id: number) => ["suite-awm", "content-type", id] as const,
};

export function useCategories(enabled = true) {
  return useQuery({
    queryKey: SUITE_AWM_KEYS.categories,
    queryFn: () => suiteAwmService.getCategories(),
    enabled,
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
