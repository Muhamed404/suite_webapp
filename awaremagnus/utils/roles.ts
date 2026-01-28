export enum RoleId {
    SUPER_ADMIN = 1,
    SYSTEM_ADMIN = 2,
    ORG_ADMIN = 3,
    ORG_MANAGER = 4,
    USER = 5,
}

export const isPlatformAdmin = (roleId?: number) =>
    roleId === RoleId.SUPER_ADMIN || roleId === RoleId.SYSTEM_ADMIN;

export const isOrgAdmin = (roleId?: number) =>
    roleId === RoleId.ORG_ADMIN || roleId === RoleId.ORG_MANAGER;

export const isUser = (roleId?: number) => roleId === RoleId.USER;
