import { awmClient } from "./httpClient";
import type {
    SystemDashboardOverview,
    SystemMonthlyCompletion,
    SystemStrugglingModules,
    SystemLeaderboard,
    OrganizationDashboardsResponse,
    OrganizationMonthlyCompletion,
    OrganizationStrugglingModulesResponse,
    OrganizationLeaderboardResponse,
    UserDashboardsResponse,
    AchievementStatisticsResponse,
    AchievementsResponse,
    AvatarStatisticsResponse,
    ScoreTypesResponse,
    ScoreLevelsResponse,
} from "../types/dashboard";

const BASE_URL = "/api/awm";

export const dashboardService = {
    // --- System Dashboard ---
    getSystemOverview: async () => {
        const { data } = await awmClient.get<SystemDashboardOverview>(
            `${BASE_URL}/dashboard/system/overview`
        );
        return data;
    },

    getSystemMonthlyCompletion: async (params?: { orgId?: number }) => {
        const { data } = await awmClient.get<SystemMonthlyCompletion>(
            `${BASE_URL}/dashboard/system/monthly-completion`,
            { params }
        );
        return data;
    },

    getSystemStrugglingModules: async () => {
        const { data } = await awmClient.get<SystemStrugglingModules>(
            `${BASE_URL}/dashboard/system/struggling-modules`
        );
        return data;
    },

    getSystemLeaderboard: async (params?: { count?: number; sortBy?: string }) => {
        const { data } = await awmClient.get<SystemLeaderboard>(
            `${BASE_URL}/dashboard/system/leaderboard`,
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
        const { data } = await awmClient.get<OrganizationDashboardsResponse>(
            `${BASE_URL}/dashboard/organizations`,
            { params }
        );
        return data;
    },

    getOrganizationMonthlyCompletion: async (params?: { campaignId?: number }) => {
        const { data } = await awmClient.get<OrganizationMonthlyCompletion>(
            `${BASE_URL}/dashboard/organizations/monthly-completion`,
            { params }
        );
        return data;
    },

    getOrganizationStrugglingModules: async (params?: { orgId?: number }) => {
        const { data } = await awmClient.get<OrganizationStrugglingModulesResponse>(
            `${BASE_URL}/dashboard/organizations/struggling-modules`,
            { params }
        );
        return data;
    },

    getOrganizationLeaderboard: async (params?: {
        count?: number;
        campaignId?: number;
        sortBy?: string;
    }) => {
        const { data } = await awmClient.get<OrganizationLeaderboardResponse>(
            `${BASE_URL}/dashboard/organizations/leaderboard`,
            { params }
        );
        return data;
    },

    // --- User Dashboard ---
    getUserDashboards: async (params?: {
        orgId?: number;
        userId?: number;
        limit?: number;
        offset?: number;
    }) => {
        const { data } = await awmClient.get<UserDashboardsResponse>(
            `${BASE_URL}/dashboard/users`,
            { params }
        );
        return data;
    },

    // --- Gamification ---
    getAchievementStatistics: async (params?: { orgId?: number }) => {
        const { data } = await awmClient.get<AchievementStatisticsResponse>(
            `${BASE_URL}/gamification/achievements/statistics`,
            { params }
        );
        return data;
    },

    getAchievements: async (params?: {
        limit?: number;
        offset?: number;
        sortBy?: string;
        sortOrder?: string;
    }) => {
        const { data } = await awmClient.get<AchievementsResponse>(
            `${BASE_URL}/gamification/achievements`,
            { params }
        );
        return data;
    },

    getAvatarStatistics: async (params?: { orgId?: number }) => {
        const { data } = await awmClient.get<AvatarStatisticsResponse>(
            `${BASE_URL}/gamification/avatar/statistics`,
            { params }
        );
        return data;
    },

    getScoreTypes: async () => {
        const { data } = await awmClient.get<ScoreTypesResponse>(
            `${BASE_URL}/gamification/scoretypes`
        );
        return data;
    },

    getScoreLevels: async () => {
        const { data } = await awmClient.get<ScoreLevelsResponse>(
            `${BASE_URL}/gamification/scorelevels`
        );
        return data;
    },

    getScoreLevelsByType: async (scoreTypeId: number) => {
        const { data } = await awmClient.get<ScoreLevelsResponse>(
            `${BASE_URL}/gamification/scorelevels/type/${scoreTypeId}`
        );
        return data;
    }
};
