import type {
  SystemDashboardOverview,
  SystemMonthlyCompletion,
  SystemStrugglingModules,
  SystemLeaderboard,
  OrganizationDashboardsResponse,
  OrganizationMonthlyCompletion,
  OrganizationStrugglingModulesResponse,
  OrganizationLeaderboardResponse,
  OrganizationCampaignCompletionsResponse,
  UserDashboardsResponse,
  AchievementStatisticsResponse,
  AchievementsResponse,
  AvatarStatisticsResponse,
  ScoreTypesResponse,
  ScoreLevelsResponse,
  UserAssignmentsResponse,
  UserGameAchievementsResponse,
} from "../types/dashboard";

import { jnrClient, API_BASE } from "./httpClient";

export const dashboardService = {
  // --- System Dashboard ---
  getSystemOverview: async () => {
    const { data } = await jnrClient.get<SystemDashboardOverview>(
      `${API_BASE}/dashboard/system/overview`
    );

    return data;
  },

  getSystemMonthlyCompletion: async (params?: { orgId?: number }) => {
    const { data } = await jnrClient.get<SystemMonthlyCompletion>(
      `${API_BASE}/dashboard/system/monthly-completion`,
      { params }
    );

    return data;
  },

  getSystemStrugglingModules: async () => {
    const { data } = await jnrClient.get<SystemStrugglingModules>(
      `${API_BASE}/dashboard/system/struggling-modules`
    );

    return data;
  },

  getSystemLeaderboard: async (params?: { count?: number; sortBy?: string }) => {
    const { data } = await jnrClient.get<SystemLeaderboard>(
      `${API_BASE}/dashboard/organizations/leaderboard`,
      { params }
    );

    return data;
  },

  // --- Organization Dashboard ---
  getOrganizationDashboards: async (params?: {
    orgId?: number;
    limit?: number;
    offset?: number;
  }) => {
    const { data } = await jnrClient.get<OrganizationDashboardsResponse>(
      `${API_BASE}/dashboard/organizations`,
      { params }
    );

    return data;
  },

  getOrganizationMonthlyCompletion: async (params?: { campaignId?: number }) => {
    const { data } = await jnrClient.get<OrganizationMonthlyCompletion>(
      `${API_BASE}/dashboard/organizations/monthly-completion`,
      { params }
    );

    return data;
  },

  getOrganizationStrugglingModules: async (params?: { orgId?: number }) => {
    const { data } = await jnrClient.get<OrganizationStrugglingModulesResponse>(
      `${API_BASE}/dashboard/organizations/struggling-modules`,
      { params }
    );

    return data;
  },

  getOrganizationLeaderboard: async (params?: {
    count?: number;
    campaignId?: number;
    sortBy?: string;
  }) => {
    const { data } = await jnrClient.get<OrganizationLeaderboardResponse>(
      `${API_BASE}/dashboard/organizations/leaderboard`,
      { params }
    );

    return data;
  },

  getOrganizationCampaignCompletions: async (params?: {
    campaign_id?: number;
    user_id?: number;
    language_id?: number;
  }) => {
    const { data } = await jnrClient.get<OrganizationCampaignCompletionsResponse>(
      `${API_BASE}/dashboard/organizations/campaign/completions`,
      { params }
    );

    return data;
  },

  // --- User Dashboard ---
  recomputeDashboardOrganizations: async (params?: { orgId?: number }) => {
    const { data } = await jnrClient.post<OrganizationDashboardsResponse>(
      `${API_BASE}/dashboard/organizations/recompute`,
      null,
      { params }
    );

    return data;
  },

  getUserDashboards: async (params?: {
    orgId?: number;
    userId?: number;
    limit?: number;
    offset?: number;
  }) => {
    const { data } = await jnrClient.get<UserDashboardsResponse>(`${API_BASE}/dashboard/users`, {
      params,
    });

    return data;
  },

  // --- Gamification ---
  getAchievementStatistics: async (params?: { orgId?: number; campaignId?: number }) => {
    const { data } = await jnrClient.get<AchievementStatisticsResponse>(
      `${API_BASE}/gamification/achievements/statistics`,
      { params }
    );

    return data;
  },

  getAchievementStatisticsByCampaign: async (campaignId: number) => {
    const { data } = await jnrClient.get<AchievementStatisticsResponse>(
      `${API_BASE}/gamification/achievements/statistics?campaignId=${campaignId}`
    );

    return data;
  },

  getAchievements: async (params?: {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const { data } = await jnrClient.get<AchievementsResponse>(
      `${API_BASE}/gamification/achievements`,
      { params }
    );

    return data;
  },

  getAvatarStatistics: async (params?: { orgId?: number; campaignId?: number }) => {
    const { data } = await jnrClient.get<AvatarStatisticsResponse>(
      `${API_BASE}/gamification/avatar/statistics`,
      { params }
    );

    return data;
  },

  getScoreTypes: async () => {
    const { data } = await jnrClient.get<ScoreTypesResponse>(`${API_BASE}/gamification/scoretypes`);

    return data;
  },

  getScoreLevels: async () => {
    const { data } = await jnrClient.get<ScoreLevelsResponse>(
      `${API_BASE}/gamification/scorelevels`
    );

    return data;
  },

  getScoreLevelsByType: async (scoreTypeId: number) => {
    const { data } = await jnrClient.get<ScoreLevelsResponse>(
      `${API_BASE}/gamification/scorelevels/type/${scoreTypeId}`
    );

    return data;
  },

  // --- User Assignments ---
  getUserAssignments: async (params?: { language_id?: number }) => {
    const { data } = await jnrClient.get<UserAssignmentsResponse>(
      `${API_BASE}/campaign/assignments`,
      { params }
    );

    return data;
  },

  // --- User Game Achievements ---
  // `userId` is optional: org users should pass it explicitly so the backend
  // can return achievements for the correct user. Platform/admin calls may
  // omit it since the token determines the user.
  getUserGameAchievements: async (params?: { userId?: number }) => {
    const { data } = await jnrClient.get<UserGameAchievementsResponse>(
      `${API_BASE}/usergame/achievements`,
      { params }
    );

    return data;
  },
};
