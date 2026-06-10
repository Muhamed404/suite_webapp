import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/hooks/useAuthStore";
import { suiteSuiteService, type Department, type Group } from "@/services/suiteSuiteService";

export const ORG_DEPARTMENTS_GROUPS_KEY = ["org-departments-groups"] as const;

export function useOrgDepartmentsAndGroups(enabled = true) {
  const { user } = useAuthStore();
  const orgId = user?.organization_id ?? user?.org_id;

  const { data, isLoading } = useQuery({
    queryKey: [...ORG_DEPARTMENTS_GROUPS_KEY, orgId],
    queryFn: async () => {
      if (orgId == null) {
        return { departments: [] as Department[], groups: [] as Group[] };
      }

      const [departments, groups] = await Promise.all([
        suiteSuiteService.getDepartments(orgId),
        suiteSuiteService.getGroups(orgId),
      ]);

      return {
        departments: departments ?? [],
        groups: groups ?? [],
      };
    },
    enabled: enabled && orgId != null,
    staleTime: 5 * 60 * 1000,
  });

  const departmentNameById = useMemo(() => {
    const map = new Map<number, string>();
    (data?.departments ?? []).forEach((department) => {
      if (department.id != null && department.name) {
        map.set(Number(department.id), department.name);
      }
    });
    return map;
  }, [data?.departments]);

  const groupNameById = useMemo(() => {
    const map = new Map<number, string>();
    (data?.groups ?? []).forEach((group) => {
      if (group.id != null && group.name) {
        map.set(Number(group.id), group.name);
      }
    });
    return map;
  }, [data?.groups]);

  const getDepartmentName = (id?: number | null, storedName?: string | null) => {
    if (storedName) return storedName;
    if (id == null) return null;
    return departmentNameById.get(Number(id)) ?? null;
  };

  const getGroupName = (id?: number | null, storedName?: string | null) => {
    if (storedName) return storedName;
    if (id == null) return null;
    return groupNameById.get(Number(id)) ?? null;
  };

  return {
    departments: data?.departments ?? [],
    groups: data?.groups ?? [],
    departmentNameById,
    groupNameById,
    getDepartmentName,
    getGroupName,
    isLoading,
  };
}
