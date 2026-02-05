import { useQuery } from "@tanstack/react-query";

import { dashboardService } from "@/services/dashboardService";

export const DASHBOARD_KEYS = {
  system: {
    overview: ["dashboard", "system", "overview"],
    monthlyCompletion: (orgId?: number) => [
      "dashboard",
      "system",
      "monthlyCompletion",
      { orgId },
    ],
    strugglingModules: ["dashboard", "system", "strugglingModules"],
    leaderboard: (count?: number, sortBy?: string) => [
      "dashboard",
      "system",
      "leaderboard",
      { count, sortBy },
    ],
  },
  organization: {
    list: (params?: { orgId?: number; limit?: number; offset?: number }) => [
      "dashboard",
      "organization",
      "list",
      params,
    ],
    monthlyCompletion: (campaignId?: number) => [
      "dashboard",
      "organization",
      "monthlyCompletion",
      { campaignId },
    ],
    strugglingModules: (orgId?: number) => [
      "dashboard",
      "organization",
      "strugglingModules",
      { orgId },
    ],
    leaderboard: (params?: {
      count?: number;
      campaignId?: number;
      sortBy?: string;
    }) => ["dashboard", "organization", "leaderboard", params],
  },
  user: {
    list: (params?: {
      orgId?: number;
      userId?: number;
      limit?: number;
      offset?: number;
    }) => ["dashboard", "user", "list", params],
  },
  gamification: {
    achievementStats: (orgId?: number) => [
      "gamification",
      "achievements",
      "statistics",
      { orgId },
    ],
    achievements: (params?: {
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: string;
    }) => ["gamification", "achievements", "list", params],
    avatarStats: (orgId?: number) => [
      "gamification",
      "avatar",
      "statistics",
      { orgId },
    ],
    scoreTypes: ["gamification", "scoreTypes"],
    scoreLevels: ["gamification", "scoreLevels"],
    scoreLevelsByType: (scoreTypeId: number) => [
      "gamification",
      "scoreLevels",
      "byType",
      scoreTypeId,
    ],
  },
};

// --- System Dashboard Hooks ---

export const useSystemOverview = () => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.system.overview,
    queryFn: dashboardService.getSystemOverview,
  });
};

export const useSystemMonthlyCompletion = (orgId?: number) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.system.monthlyCompletion(orgId),
    queryFn: () => dashboardService.getSystemMonthlyCompletion({ orgId }),
  });
};

export const useSystemStrugglingModules = () => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.system.strugglingModules,
    queryFn: dashboardService.getSystemStrugglingModules,
  });
};

export const useSystemLeaderboard = (count?: number, sortBy?: string) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.system.leaderboard(count, sortBy),
    queryFn: () => dashboardService.getSystemLeaderboard({ count, sortBy }),
  });
};

// --- Organization Dashboard Hooks ---

export const useOrganizationDashboards = (params?: {
  orgId?: number;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.organization.list(params),
    queryFn: () => dashboardService.getOrganizationDashboards(params),
  });
};

export const useOrganizationMonthlyCompletion = (campaignId?: number) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.organization.monthlyCompletion(campaignId),
    queryFn: () =>
      dashboardService.getOrganizationMonthlyCompletion({ campaignId }),
  });
};

export const useOrganizationStrugglingModules = (orgId?: number) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.organization.strugglingModules(orgId),
    // For Org Admin/User, orgId param is optional/ignored by service as it uses token
    // For Platform Admin, it might be passed.
    queryFn: () => dashboardService.getOrganizationStrugglingModules({ orgId }),
  });
};

export const useOrganizationLeaderboard = (params?: {
  count?: number;
  campaignId?: number;
  sortBy?: string;
}) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.organization.leaderboard(params),
    queryFn: () => dashboardService.getOrganizationLeaderboard(params),
  });
};

// --- User Dashboard Hooks ---

export const useUserDashboards = (params?: {
  orgId?: number;
  userId?: number;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.user.list(params),
    queryFn: () => dashboardService.getUserDashboards(params),
  });
};

// --- Gamification Hooks ---

export const useAchievementStatistics = (orgId?: number) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.gamification.achievementStats(orgId),
    queryFn: () => dashboardService.getAchievementStatistics({ orgId }),
  });
};

export const useAchievements = (params?: {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: string;
}) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.gamification.achievements(params),
    queryFn: () => dashboardService.getAchievements(params),
  });
};

export const useAvatarStatistics = (orgId?: number) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.gamification.avatarStats(orgId),
    queryFn: () => dashboardService.getAvatarStatistics({ orgId }),
  });
};

export const useScoreTypes = () => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.gamification.scoreTypes,
    queryFn: dashboardService.getScoreTypes,
  });
};

export const useScoreLevels = () => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.gamification.scoreLevels,
    queryFn: dashboardService.getScoreLevels,
  });
};

export const useScoreLevelsByType = (scoreTypeId: number) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.gamification.scoreLevelsByType(scoreTypeId),
    queryFn: () => dashboardService.getScoreLevelsByType(scoreTypeId),
    enabled: !!scoreTypeId,
  });
};
