/**
 * Role IDs (match AWM backend).
 * From JWT: use user.role.id or user.role_id after AWM normalizes the token.
 */
export const ROLE_IDS = {
  SUPER_MAGNUS: 1,
  SUB_MAGNUS: 2,
  SUPER_ORG_USER: 3,
  SUB_ORG_USER: 4,
  ORG_USER: 5,
} as const;

export type RoleId = (typeof ROLE_IDS)[keyof typeof ROLE_IDS];

/** Role metadata for labels and descriptions */
export const ROLES: Record<
  RoleId,
  { name: string; isPlatformAdmin: boolean; isOrgAdmin: boolean }
> = {
  [ROLE_IDS.SUPER_MAGNUS]: {
    name: "Super Magnus",
    isPlatformAdmin: true,
    isOrgAdmin: false,
  },
  [ROLE_IDS.SUB_MAGNUS]: {
    name: "Sub Magnus",
    isPlatformAdmin: true,
    isOrgAdmin: false,
  },
  [ROLE_IDS.SUPER_ORG_USER]: {
    name: "Super Org User",
    isPlatformAdmin: false,
    isOrgAdmin: true,
  },
  [ROLE_IDS.SUB_ORG_USER]: {
    name: "Sub Org User",
    isPlatformAdmin: false,
    isOrgAdmin: true,
  },
  [ROLE_IDS.ORG_USER]: {
    name: "Org User",
    isPlatformAdmin: false,
    isOrgAdmin: false,
  },
};

/** Helpers for role-based rendering */
export const isPlatformAdmin = (roleId?: number) =>
  roleId === ROLE_IDS.SUPER_MAGNUS || roleId === ROLE_IDS.SUB_MAGNUS;

export const isOrgAdmin = (roleId?: number) =>
  roleId === ROLE_IDS.SUPER_ORG_USER || roleId === ROLE_IDS.SUB_ORG_USER;

/** Org User = learner (role 5); limited to own org, learner view */
export const isOrgUser = (roleId?: number) => roleId === ROLE_IDS.ORG_USER;

/** Platform admins and org admins can access Assets & Materials */
export const canAccessAwarenessAssets = (roleId?: number) =>
  isPlatformAdmin(roleId) || isOrgAdmin(roleId);

/** Org admins can create and launch awareness campaigns; platform admins cannot */
export const canManageCampaigns = (roleId?: number) => isOrgAdmin(roleId);

/** Org admins can create surveys; platform admins cannot */
export const canManageSurveys = (roleId?: number) => isOrgAdmin(roleId);

export const getRoleName = (roleId: number) => ROLES[roleId as RoleId]?.name ?? "Unknown Role";

/**
 * Alias for isOrgUser. Kept for backward compatibility (e.g. dashboard page).
 */
export const isUser = (roleId?: number) => isOrgUser(roleId);
