import { useQuery } from "@tanstack/react-query";

import { dashboardService } from "@/services/dashboardService";

export const DASHBOARD_KEYS = {
  system: {
    overview: ["dashboard", "system", "overview"],
    monthlyCompletion: (orgId?: number) => ["dashboard", "system", "monthlyCompletion", { orgId }],
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
    leaderboard: (params?: { count?: number; campaignId?: number; sortBy?: string }) => [
      "dashboard",
      "organization",
      "leaderboard",
      params,
    ],
    campaignCompletions: (params?: { campaign_id?: number; user_id?: number; language_id?: number }) => [
      "dashboard",
      "organization",
      "campaignCompletions",
      params,
    ],
  },
  user: {
    list: (params?: { orgId?: number; userId?: number; limit?: number; offset?: number }) => [
      "dashboard",
      "user",
      "list",
      params,
    ],
    assignments: (params?: { language_id?: number }) => [
      "dashboard",
      "user",
      "assignments",
      params,
    ],
    gameAchievements: (userId?: number) => ["dashboard", "user", "gameAchievements", { userId }],
  },
  gamification: {
    achievementStats: (orgId?: number) => ["gamification", "achievements", "statistics", { orgId }],
    achievementStatsByCampaign: (campaignId: number) => ["gamification", "achievements", "statistics", { campaignId }],
    achievements: (params?: {
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: string;
    }) => ["gamification", "achievements", "list", params],
    avatarStats: (orgId?: number) => ["gamification", "avatar", "statistics", { orgId }],
    avatarStatsByCampaign: (campaignId: number) => ["gamification", "avatar", "statistics", { campaignId }],
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

export const useSystemOverview = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.system.overview,
    queryFn: dashboardService.getSystemOverview,
    // allow caller to disable when not needed (e.g. non-platform users)
    ...options,
  });
};

export const useSystemMonthlyCompletion = (orgId?: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.system.monthlyCompletion(orgId),
    queryFn: () => dashboardService.getSystemMonthlyCompletion({ orgId }),
    ...options,
  });
};

export const useSystemStrugglingModules = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.system.strugglingModules,
    queryFn: dashboardService.getSystemStrugglingModules,
    ...options,
  });
};

export const useSystemLeaderboard = (
  count?: number,
  sortBy?: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.system.leaderboard(count, sortBy),
    queryFn: () => dashboardService.getSystemLeaderboard({ count, sortBy }),
    ...options,
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
    queryFn: () => dashboardService.getOrganizationMonthlyCompletion({ campaignId }),
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

export const useOrganizationCampaignCompletions = (params?: {
  campaign_id?: number;
  user_id?: number;
  language_id?: number;
}, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.organization.campaignCompletions(params),
    queryFn: () => dashboardService.getOrganizationCampaignCompletions(params),
    ...options,
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

export const useUserAssignments = (params?: { language_id?: number }) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.user.assignments(params),
    queryFn: () => dashboardService.getUserAssignments(params),
  });
};

export const useUserGameAchievements = (userId?: number) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.user.gameAchievements(userId),
    queryFn: () => dashboardService.getUserGameAchievements({ userId }),
  });
};

// --- Gamification Hooks ---

export const useAchievementStatistics = (orgId?: number) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.gamification.achievementStats(orgId),
    queryFn: () => dashboardService.getAchievementStatistics({ orgId }),
  });
};

export const useAchievementStatisticsByCampaign = (campaignId: number) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.gamification.achievementStatsByCampaign(campaignId),
    queryFn: () => dashboardService.getAchievementStatisticsByCampaign(campaignId),
    enabled: !!campaignId,
  });
};

export const useAchievementStatisticsWithCampaign = (campaignId: number) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.gamification.achievementStats(campaignId),
    queryFn: () => dashboardService.getAchievementStatistics({ campaignId }),
    enabled: !!campaignId,
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

export const useAvatarStatisticsByCampaign = (campaignId: number) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.gamification.avatarStatsByCampaign(campaignId),
    queryFn: () => dashboardService.getAvatarStatistics({ campaignId }),
    enabled: !!campaignId,
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
