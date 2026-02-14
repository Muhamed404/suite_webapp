import type { AWMResponseBody } from "./awmResponse";

import { normalizeAWMResponse } from "./awmResponse";
import { suiteClient } from "./httpClient";

/** Department interface matching service_suite response */
export interface Department {
  id: number;
  name: string;
  organization_id: number;
  is_Active?: boolean;
  is_Deleted?: boolean;
  user_count?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Group interface matching service_suite response */
export interface Group {
  id: number;
  name: string;
  description?: string;
  organization_id: number;
  is_Active?: boolean;
  is_Deleted?: boolean;
  user_count?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** User interface for manual user selection */
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  organization_id: number;
}

async function request<T>(fn: () => Promise<{ data: any }>): Promise<T> {
  const { data } = await fn();
  
  // service_suite returns various formats, try to extract array
  if (data.success && data.message && Array.isArray(data.message)) {
    return data.message as T;
  }
  
  if (data.success && data.object && Array.isArray(data.object)) {
    return data.object as T;
  }
  
  if (data.message !== undefined && Array.isArray(data.message)) {
    return data.message as T;
  }
  
  if (data.object !== undefined && Array.isArray(data.object)) {
    return data.object as T;
  }

  // Check for common array properties like 'users', 'data', etc.
  if (data.users && Array.isArray(data.users)) {
    return data.users as T;
  }

  if (data.data && Array.isArray(data.data)) {
    return data.data as T;
  }
  
  // Fallback to data itself
  return data as T;
}

/**
 * Normalize user data from API to interface
 * API returns snake_case, interface expects camelCase
 */
function normalizeUser(apiUser: any): User {
  return {
    id: apiUser.id,
    firstName: apiUser.firstName || apiUser.first_name || "",
    lastName: apiUser.lastName || apiUser.last_name || "",
    email: apiUser.email || "",
    organization_id: apiUser.organization_id,
  };
}

/**
 * Service Suite API client for departments, groups, and users
 * These endpoints are from service_suite (used by phishmagnus)
 * 
 * Routes are mounted at the root level:
 * - protectedRouter.use("/department", DepartmentRoute)
 * - protectedRouter.use("/group", GroupRoutes)
 */
export const suiteSuiteService = {
  /**
   * GET /department/list/:orgId?
   * Get all departments for an organization
   */
  getDepartments: async (orgId?: number) => {
    const url = orgId 
      ? `/department/list/${orgId}` 
      : `/department/list`;
    
    return request<Department[]>(() => suiteClient.get(url));
  },

  /**
   * GET /group/findByOrganization/:organizationId
   * Get all groups for an organization
   */
  getGroups: async (organizationId: number) => {
    return request<Group[]>(() => 
      suiteClient.get(`/group/findByOrganization/${organizationId}`)
    );
  },

  /**
   * GET /external/department/:departmentId/users
   * Get all users in a department (external API)
   */
  getDepartmentUsers: async (departmentId: number) => {
    const users = await request<any[]>(() => 
      suiteClient.get(`/external/department/${departmentId}/users`)
    );
    return users?.map(normalizeUser) || [];
  },

  /**
   * GET /external/group/:groupId/users
   * Get all users in a group (external API)
   */
  getGroupUsers: async (groupId: number) => {
    const users = await request<any[]>(() => 
      suiteClient.get(`/external/group/${groupId}/users`)
    );
    return users?.map(normalizeUser) || [];
  },

  /**
   * GET /department/unassigned-users/:organizationId?
   * Get unassigned users by organization (for manual user selection)
   */
  getUnassignedUsers: async (organizationId?: number) => {
    const url = organizationId
      ? `/department/unassigned-users/${organizationId}`
      : `/department/unassigned-users`;
    
    const users = await request<any[]>(() => suiteClient.get(url));
    // Normalize user data from API format to interface format
    return users?.map(normalizeUser) || [];
  },
};
