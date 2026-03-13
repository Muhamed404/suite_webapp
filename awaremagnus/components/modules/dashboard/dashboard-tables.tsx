"use client";

import { Card, CardBody } from "@heroui/card";
import { Select, SelectItem } from "@heroui/select";
import { Button } from "@heroui/button";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { useState } from "react";

import { useAuthStore } from "@/hooks/useAuthStore";
import { useSystemLeaderboard, useOrganizationLeaderboard } from "@/hooks/useDashboard";
import { useTranslations } from "@/i18n/useTranslations";
import { isPlatformAdmin as getIsPlatformAdmin, isUser as getIsUser } from "@/utils/roles";

export const DashboardTables = () => {
  const t = useTranslations("dashboard");
  const { user } = useAuthStore();
  const [highRiskPage, setHighRiskPage] = useState(1);
  const [lowRiskPage, setLowRiskPage] = useState(1);
  const itemsPerPage = 5;

  const isPlatformAdmin = getIsPlatformAdmin(user?.role_id);
  const _isOrgUser = getIsUser(user?.role_id);
  // Org Admin (3, 4) and Org User (5) use Organization Leaderboard.
  // Platform Admin (1, 2) uses System Leaderboard.

  // Actually, Org User (5) can see leaderboard too (Access ✅).

  const { data: systemLeaderboard } = useSystemLeaderboard(20, "compliance_score");
  const { data: orgLeaderboard } = useOrganizationLeaderboard({ count: 20 });

  let highRiskData: any[] = [];
  let lowRiskData: any[] = [];

  if (isPlatformAdmin) {
    if (systemLeaderboard?.statusCode === 200) {
      highRiskData = systemLeaderboard?.data?.top_high_risk_employees ?? [];
      lowRiskData = systemLeaderboard?.data?.top_low_risk_employees ?? [];
    }
  } else {
    if (orgLeaderboard?.statusCode === 200) {
      highRiskData = orgLeaderboard?.data?.top_high_risk_employees ?? [];
      lowRiskData = orgLeaderboard?.data?.top_low_risk_employees ?? [];
    }
  }

  const highRiskPaginated = highRiskData.slice(
    (highRiskPage - 1) * itemsPerPage,
    highRiskPage * itemsPerPage
  );
  const lowRiskPaginated = lowRiskData.slice(
    (lowRiskPage - 1) * itemsPerPage,
    lowRiskPage * itemsPerPage
  );

  const renderCell = (item: any, columnKey: React.Key) => {
    // Map API fields to columns
    // API: user_id/org_id, modules_completed, risk_level, compliance_score, etc.
    // Columns: User Id, Modules Completed, Achievement Count, Avatar Level, Risk Level

    const name =
      item.user_name ||
      item.org_name ||
      (item.user_id ? `User #${item.user_id}` : `Org #${item.org_id}`);
    const _uniqueId = item.user_id || item.org_id; // For key

    switch (columnKey) {
      case "userId":
        return <div className="text-sm font-medium">{item.user_id || item.org_id}</div>;
      case "modulesCompleted":
        return <div className="text-sm">{item.modules_completed || 0}</div>;
      case "achievementCount":
        return <div className="text-sm">{item.achievement_count || 0}</div>;
      case "avatarLevel":
        return <div className="text-sm">{item.avatar_current_level || 0}</div>;
      case "streak":
        return <div className="text-sm">{item.streak_day ?? 0}</div>;
      case "riskLevel":
        return <div className="text-sm">{item.risk_level || "N/A"}</div>;
      default:
        return <div className="text-sm">{(item as any)[columnKey as string]}</div>;
    }
  };

  return (
    <div className="grid lg:grid-cols-2 grid-cols-1 gap-2 mt-4">
      {/* High Risk Table */}
      <Card className="rounded-2xl shadow-none">
        <CardBody className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--mainblue)] whitespace-nowrap">
              {t("tables.topHighRisk")}
            </h2>
            <Select
              aria-label={t("tables.sortBy")}
              className="w-36"
              classNames={{
                trigger: "h-10 min-h-10 px-4 pr-10 rounded-full border border-gray-300 text-sm",
              }}
              placeholder={t("tables.sortBy")}
            >
              <SelectItem key="default">{t("tables.sortBy")}</SelectItem>
              <SelectItem key="risk">{t("cards.inRisk")}</SelectItem>
              <SelectItem key="compliance">{t("cards.totalComplianceScore")}</SelectItem>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table removeWrapper aria-label="High risk table">
              <TableHeader>
                <TableColumn key="userId">{t("tables.userId")}</TableColumn>
                <TableColumn key="modulesCompleted">{t("tables.modulesCompleted")}</TableColumn>
                <TableColumn key="achievementCount">{t("tables.achievementCount")}</TableColumn>
                <TableColumn key="avatarLevel">{t("tables.avatarLevel")}</TableColumn>
                <TableColumn key="streak">Streak</TableColumn>
                <TableColumn key="riskLevel">{t("tables.riskLevel")}</TableColumn>
              </TableHeader>
              <TableBody items={highRiskPaginated}>
                {(item: any) => (
                  <TableRow key={item.user_id || item.org_id || Math.random()}>
                    {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-xs whitespace-nowrap">
              {t("tables.showingOf", {
                shown: highRiskPaginated.length,
                total: highRiskData.length,
              })}
            </p>
            <div className="flex items-center gap-2">
              <Button
                isIconOnly
                className="w-8 h-8 min-w-8"
                isDisabled={highRiskPage === 1}
                size="sm"
                variant="bordered"
                onPress={() => setHighRiskPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </Button>
              <span className="text-sm">{highRiskPage}</span>
              <Button
                isIconOnly
                className="w-8 h-8 min-w-8"
                isDisabled={highRiskPage * itemsPerPage >= highRiskData.length}
                size="sm"
                variant="bordered"
                onPress={() => setHighRiskPage((p) => p + 1)}
              >
                ›
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Low Risk Table */}
      <Card className="rounded-2xl shadow-none">
        <CardBody className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--mainblue)] whitespace-nowrap">
              {t("tables.topLowRisk")}
            </h2>
            <Select
              aria-label={t("tables.sortBy")}
              className="w-36"
              classNames={{
                trigger: "h-10 min-h-10 px-4 pr-10 rounded-full border border-gray-300 text-sm",
              }}
              placeholder={t("tables.sortBy")}
            >
              <SelectItem key="default">{t("tables.sortBy")}</SelectItem>
              <SelectItem key="risk">{t("cards.inRisk")}</SelectItem>
              <SelectItem key="compliance">{t("cards.totalComplianceScore")}</SelectItem>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table removeWrapper aria-label="Low risk table">
              <TableHeader>
                <TableColumn key="userId">{t("tables.userId")}</TableColumn>
                <TableColumn key="modulesCompleted">{t("tables.modulesCompleted")}</TableColumn>
                <TableColumn key="achievementCount">{t("tables.achievementCount")}</TableColumn>
                <TableColumn key="avatarLevel">{t("tables.avatarLevel")}</TableColumn>
                <TableColumn key="streak">Streak</TableColumn>
                <TableColumn key="riskLevel">{t("tables.riskLevel")}</TableColumn>
              </TableHeader>
              <TableBody items={lowRiskPaginated}>
                {(item: any) => (
                  <TableRow key={item.user_id || item.org_id || Math.random()}>
                    {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-xs whitespace-nowrap">
              {t("tables.showingOf", {
                shown: lowRiskPaginated.length,
                total: lowRiskData.length,
              })}
            </p>
            <div className="flex items-center gap-2">
              <Button
                isIconOnly
                className="w-8 h-8 min-w-8"
                isDisabled={lowRiskPage === 1}
                size="sm"
                variant="bordered"
                onPress={() => setLowRiskPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </Button>
              <span className="text-sm">{lowRiskPage}</span>
              <Button
                isIconOnly
                className="w-8 h-8 min-w-8"
                isDisabled={lowRiskPage * itemsPerPage >= lowRiskData.length}
                size="sm"
                variant="bordered"
                onPress={() => setLowRiskPage((p) => p + 1)}
              >
                ›
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
