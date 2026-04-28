"use client";

import { useMemo, useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import clsx from "clsx";
import { BellRing, Mail, Search, SearchX, Send } from "lucide-react";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useI18n } from "@/i18n/I18nProvider";
import { useTranslations } from "@/i18n/useTranslations";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useSurveys } from "@/hooks/useSurvey";
import {
  useCampaignInvitations,
  useInvitations,
  useSendCampaignReminders,
  useSendCampaignUserReminder,
  useSendSurveyReminders,
  useSendSurveyUserReminder,
  useSurveyInvitations,
} from "@/hooks/useInvitation";
import type { InvitationLogItem } from "@/types/invitation";

type InvitationTypeFilter = "all" | "campaign" | "survey";

const ROWS_PER_PAGE = 10;

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function getStatusTone(statusName?: string) {
  const status = (statusName ?? "").toUpperCase();

  if (status === "COMPLETED") return "bg-green-100 text-green-700";
  if (status === "FAILED") return "bg-red-100 text-red-700";
  if (status === "PENDING") return "bg-amber-100 text-amber-700";
  if (status === "RETRY") return "bg-orange-100 text-orange-700";

  return "bg-gray-100 text-gray-700";
}

function getStatusLabel(
  statusName: string | undefined,
  t: (key: string, values?: Record<string, unknown>) => string
) {
  const status = (statusName ?? "").toUpperCase();
  if (status === "COMPLETED") return t("invitationLog.status.completed");
  if (status === "FAILED") return t("invitationLog.status.failed");
  if (status === "PENDING") return t("invitationLog.status.pending");
  if (status === "RETRY") return t("invitationLog.status.retry");
  return statusName ?? t("invitationLog.status.unknown");
}

export function InvitationLogPage() {
  const { dir } = useI18n();
  const t = useTranslations("surveyManagement");
  const isRtl = dir === "rtl";

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [invitationType, setInvitationType] = useState<InvitationTypeFilter>("campaign");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [surveyFilter, setSurveyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isReminderFilter, setIsReminderFilter] = useState("");

  const { data: campaignsData } = useCampaigns();
  const { data: surveysData } = useSurveys();

  const selectedCampaignId = campaignFilter ? Number(campaignFilter) : 0;
  const selectedSurveyId = surveyFilter ? Number(surveyFilter) : 0;
  const selectedStatusId = statusFilter ? Number(statusFilter) : undefined;
  const selectedReminderFilter =
    isReminderFilter === "" ? undefined : isReminderFilter === "true";

  const sharedPagination = { page: currentPage, limit: ROWS_PER_PAGE };

  const allInvitationsQuery = useInvitations(
    {
      ...sharedPagination,
      invitation_type: invitationType === "all" ? undefined : invitationType,
      campaign_id: invitationType === "campaign" && selectedCampaignId ? selectedCampaignId : undefined,
      status_id: selectedStatusId,
      is_reminder: selectedReminderFilter,
    },
    invitationType === "all" ||
      (invitationType === "campaign" && !selectedCampaignId) ||
      (invitationType === "survey" && !selectedSurveyId)
  );

  const campaignInvitationsQuery = useCampaignInvitations(
    selectedCampaignId,
    sharedPagination,
    invitationType === "campaign" && !!selectedCampaignId
  );

  const surveyInvitationsQuery = useSurveyInvitations(
    selectedSurveyId,
    sharedPagination,
    invitationType === "survey" && !!selectedSurveyId
  );

  const sendCampaignReminders = useSendCampaignReminders();
  const sendCampaignUserReminder = useSendCampaignUserReminder();
  const sendSurveyReminders = useSendSurveyReminders();
  const sendSurveyUserReminder = useSendSurveyUserReminder();

  const activeQuery =
    invitationType === "campaign" && selectedCampaignId
      ? campaignInvitationsQuery
      : invitationType === "survey" && selectedSurveyId
        ? surveyInvitationsQuery
        : allInvitationsQuery;

  const invitationRows = activeQuery.data?.rows ?? [];
  const totalItems = activeQuery.data?.total_items ?? 0;
  const totalPages = Math.max(1, activeQuery.data?.total_pages ?? 1);
  const isLoading = activeQuery.isLoading;

  const campaignOptions = useMemo(() => {
    const source = Array.isArray(campaignsData)
      ? campaignsData
      : campaignsData?.campaigns ?? campaignsData?.object?.campaigns ?? [];

    return source
      .map((campaign: any) => ({
        id: Number(campaign.id),
        name: campaign.name ?? `Campaign ${campaign.id}`,
      }))
      .filter((item: { id: number }) => Number.isFinite(item.id));
  }, [campaignsData]);

  const surveyOptions = useMemo(
    () =>
      (surveysData ?? []).map((survey) => ({
        id: survey.id,
        name: survey.name ?? `Survey ${survey.id}`,
      })),
    [surveysData]
  );

  const statusOptions = useMemo(() => {
    const statusMap = new Map<number, string>();
    invitationRows.forEach((row) => {
      if (row.status?.id) {
        statusMap.set(row.status.id, row.status.name ?? `Status ${row.status.id}`);
      }
    });
    return Array.from(statusMap.entries()).map(([id, name]) => ({ id, name }));
  }, [invitationRows]);

  const filteredRows = useMemo(() => {
    let rows = invitationRows;

    if (selectedStatusId) {
      rows = rows.filter((row) => row.status_id === selectedStatusId);
    }

    if (selectedReminderFilter !== undefined) {
      rows = rows.filter((row) => row.is_reminder === selectedReminderFilter);
    }

    if (!searchQuery.trim()) return rows;

    const q = searchQuery.toLowerCase().trim();
    return rows.filter((row) => {
      const fullName = `${row.invitee?.firstname ?? ""} ${row.invitee?.lastname ?? ""}`.toLowerCase();
      const email = (row.invitee?.email ?? "").toLowerCase();
      const campaignName = (row.campaign?.name ?? "").toLowerCase();
      const surveyName = (row.survey?.name ?? "").toLowerCase();
      return (
        fullName.includes(q) || email.includes(q) || campaignName.includes(q) || surveyName.includes(q)
      );
    });
  }, [invitationRows, searchQuery, selectedStatusId, selectedReminderFilter]);

  const handleSendAllReminders = async () => {
    try {
      if (invitationType === "campaign" && selectedCampaignId) {
        const response = await sendCampaignReminders.mutateAsync(selectedCampaignId);
        addToast({
          title: t("invitationLog.toast.remindersQueuedTitle"),
          description: t("invitationLog.toast.campaignRemindersQueuedDescription", {
            count: response.reminders_enqueued,
          }),
          color: "success",
        });
        return;
      }
      if (invitationType === "survey" && selectedSurveyId) {
        const response = await sendSurveyReminders.mutateAsync(selectedSurveyId);
        addToast({
          title: t("invitationLog.toast.remindersQueuedTitle"),
          description: t("invitationLog.toast.surveyRemindersQueuedDescription", {
            count: response.reminders_enqueued,
          }),
          color: "success",
        });
        return;
      }

      addToast({
        title: t("invitationLog.toast.selectTargetTitle"),
        description: t("invitationLog.toast.selectTargetDescription"),
        color: "warning",
      });
    } catch (error: any) {
      addToast({
        title: t("invitationLog.toast.reminderFailedTitle"),
        description: error?.message ?? t("invitationLog.toast.unableToQueueReminders"),
        color: "danger",
      });
    }
  };

  const handleSendUserReminder = async (row: InvitationLogItem) => {
    try {
      if (row.invitation_type === "campaign" && row.campaign_id && row.user_id) {
        const response = await sendCampaignUserReminder.mutateAsync({
          campaignId: row.campaign_id,
          userId: row.user_id,
        });
        addToast({
          title: t("invitationLog.toast.reminderQueuedTitle"),
          description: t("invitationLog.toast.userReminderQueuedDescription", {
            count: response.reminders_enqueued,
            email: row.invitee?.email ?? t("invitationLog.userFallback"),
          }),
          color: "success",
        });
        return;
      }

      if (row.invitation_type === "survey" && row.survey_id && row.user_id) {
        const response = await sendSurveyUserReminder.mutateAsync({
          surveyId: row.survey_id,
          userId: row.user_id,
        });
        addToast({
          title: t("invitationLog.toast.reminderQueuedTitle"),
          description: t("invitationLog.toast.userReminderQueuedDescription", {
            count: response.reminders_enqueued,
            email: row.invitee?.email ?? t("invitationLog.userFallback"),
          }),
          color: "success",
        });
        return;
      }

      addToast({
        title: t("invitationLog.toast.reminderUnavailableTitle"),
        description: t("invitationLog.toast.reminderUnavailableDescription"),
        color: "warning",
      });
    } catch (error: any) {
      addToast({
        title: t("invitationLog.toast.reminderFailedTitle"),
        description: error?.message ?? t("invitationLog.toast.unableToQueueUserReminder"),
        color: "danger",
      });
    }
  };

  const bulkReminderLoading = sendCampaignReminders.isPending || sendSurveyReminders.isPending;
  const rowReminderLoading = sendCampaignUserReminder.isPending || sendSurveyUserReminder.isPending;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("flex flex-col p-3", isRtl && "text-right")}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold">{t("invitationLog.title")}</h2>
            <Button
              className="bg-blue-500 text-white"
              radius="full"
              size="sm"
              startContent={<BellRing className="w-4 h-4" />}
              isLoading={bulkReminderLoading}
              onPress={handleSendAllReminders}
            >
              {t("invitationLog.actions.sendReminder")}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-2xl p-3">
              <p className="text-xs text-gray-500">{t("invitationLog.cards.totalInvitations")}</p>
              <p className="text-xl font-semibold">{totalItems}</p>
            </div>
            <div className="bg-white rounded-2xl p-3">
              <p className="text-xs text-gray-500">{t("invitationLog.cards.campaignInvitations")}</p>
              <p className="text-xl font-semibold">
                {invitationRows.filter((item) => item.invitation_type === "campaign").length}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-3">
              <p className="text-xs text-gray-500">{t("invitationLog.cards.surveyInvitations")}</p>
              <p className="text-xl font-semibold">
                {invitationRows.filter((item) => item.invitation_type === "survey").length}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-3">
              <p className="text-xs text-gray-500">{t("invitationLog.cards.reminderAttempts")}</p>
              <p className="text-xl font-semibold">
                {invitationRows.filter((item) => item.is_reminder).length}
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-3 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                classNames={{
                  base: "w-72",
                  inputWrapper:
                    "h-10 bg-white border border-gray-200 rounded-full hover:border-gray-300 focus-within:!border-blue-500",
                  input: "text-xs",
                }}
                placeholder={t("invitationLog.filters.searchPlaceholder")}
                startContent={<Search className="text-gray-400 w-4 h-4" />}
                value={searchQuery}
                onValueChange={setSearchQuery}
              />

              <Select
                aria-label={t("invitationLog.filters.invitationType")}
                classNames={{ base: "w-40", trigger: "h-10 rounded-full border border-gray-200", value: "text-xs" }}
                selectedKeys={[invitationType]}
                onSelectionChange={(keys) => {
                  const value = (Array.from(keys as Set<string>)[0] ?? "campaign") as InvitationTypeFilter;
                  setInvitationType(value);
                  setCurrentPage(1);
                }}
              >
                <SelectItem key="all">{t("invitationLog.filters.allTypes")}</SelectItem>
                <SelectItem key="campaign">{t("invitationLog.filters.campaign")}</SelectItem>
                <SelectItem key="survey">{t("invitationLog.filters.survey")}</SelectItem>
              </Select>

              <Select
                aria-label={t("invitationLog.filters.campaignFilter")}
                classNames={{ base: "w-56", trigger: "h-10 rounded-full border border-gray-200", value: "text-xs" }}
                placeholder={t("invitationLog.filters.filterByCampaign")}
                selectedKeys={campaignFilter ? [campaignFilter] : []}
                isDisabled={invitationType === "survey"}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys as Set<string>)[0] ?? "";
                  setCampaignFilter(value);
                  setCurrentPage(1);
                }}
              >
                {campaignOptions.map((campaign) => (
                  <SelectItem key={String(campaign.id)}>{campaign.name}</SelectItem>
                ))}
              </Select>

              <Select
                aria-label={t("invitationLog.filters.surveyFilter")}
                classNames={{ base: "w-56", trigger: "h-10 rounded-full border border-gray-200", value: "text-xs" }}
                placeholder={t("invitationLog.filters.filterBySurvey")}
                selectedKeys={surveyFilter ? [surveyFilter] : []}
                isDisabled={invitationType === "campaign"}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys as Set<string>)[0] ?? "";
                  setSurveyFilter(value);
                  setCurrentPage(1);
                }}
              >
                {surveyOptions.map((survey) => (
                  <SelectItem key={String(survey.id)}>{survey.name}</SelectItem>
                ))}
              </Select>

              <Select
                aria-label={t("invitationLog.filters.statusFilter")}
                classNames={{ base: "w-44", trigger: "h-10 rounded-full border border-gray-200", value: "text-xs" }}
                placeholder={t("invitationLog.table.status")}
                selectedKeys={statusFilter ? [statusFilter] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys as Set<string>)[0] ?? "";
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                {statusOptions.map((status) => (
                  <SelectItem key={String(status.id)}>{status.name}</SelectItem>
                ))}
              </Select>

              <Select
                aria-label={t("invitationLog.filters.reminderFilter")}
                classNames={{ base: "w-44", trigger: "h-10 rounded-full border border-gray-200", value: "text-xs" }}
                placeholder={t("invitationLog.filters.reminder")}
                selectedKeys={isReminderFilter ? [isReminderFilter] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys as Set<string>)[0] ?? "";
                  setIsReminderFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectItem key="true">{t("invitationLog.filters.reminderOnly")}</SelectItem>
                <SelectItem key="false">{t("invitationLog.filters.initialInvite")}</SelectItem>
              </Select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto" style={{ height: "55vh", minHeight: "400px" }}>
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Spinner color="primary" size="lg" />
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                      <SearchX className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      {t("invitationLog.states.emptyTitle")}
                    </h3>
                    <p className="text-sm text-gray-500">{t("invitationLog.states.emptyDescription")}</p>
                  </div>
                </div>
              ) : (
                <table className="w-full text-xs whitespace-nowrap">
                  <thead className="bg-gray-50 text-gray-600 border-b sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">{t("invitationLog.table.invitee")}</th>
                      <th className="px-4 py-3 text-left font-semibold">{t("invitationLog.table.type")}</th>
                      <th className="px-4 py-3 text-left font-semibold">
                        {t("invitationLog.table.campaignOrSurvey")}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">{t("invitationLog.table.status")}</th>
                      <th className="px-4 py-3 text-left font-semibold">{t("invitationLog.table.attempts")}</th>
                      <th className="px-4 py-3 text-left font-semibold">{t("invitationLog.table.lastAttempt")}</th>
                      <th className="px-4 py-3 text-left font-semibold">
                        {t("invitationLog.table.invitationTime")}
                      </th>
                      <th className="px-4 py-3 text-center font-semibold">{t("invitationLog.table.action")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-800">
                              {row.invitee?.firstname} {row.invitee?.lastname}
                            </p>
                            <p className="text-[10px] text-gray-500">{row.invitee?.email ?? "—"}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 capitalize text-gray-700">{row.invitation_type}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.invitation_type === "survey"
                            ? row.survey?.name ??
                              t("invitationLog.fallback.surveyWithId", {
                                id: row.survey_id ?? "—",
                              })
                            : row.campaign?.name ??
                              t("invitationLog.fallback.campaignWithId", {
                                id: row.campaign_id ?? "—",
                              })}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={clsx(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium",
                              getStatusTone(row.status?.name)
                            )}
                          >
                            {getStatusLabel(row.status?.name, t)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{row.attempt_count}</td>
                        <td className="px-4 py-3 text-gray-700">{formatDate(row.last_attempt_at)}</td>
                        <td className="px-4 py-3 text-gray-700">{formatDate(row.invitation_time)}</td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            size="sm"
                            radius="full"
                            variant="flat"
                            className="bg-blue-50 text-blue-600"
                            startContent={<Send className="w-3.5 h-3.5" />}
                            isLoading={rowReminderLoading}
                            onPress={() => handleSendUserReminder(row)}
                          >
                            {t("invitationLog.actions.reminder")}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center px-4 py-3.5 border-t bg-gray-50 gap-3">
              <div className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                <span>{t("invitationLog.pagination.totalRecords", { total: totalItems })}</span>
              </div>
              <Pagination
                showControls
                classNames={{
                  wrapper: "gap-1.5",
                  item: "min-w-8 h-8 text-xs font-medium bg-white border border-gray-200 hover:bg-gray-100",
                  cursor: "bg-[#0ea5e9] text-white font-medium",
                  prev: "min-w-8 h-8 bg-white border border-gray-200 hover:bg-gray-100",
                  next: "min-w-8 h-8 bg-white border border-gray-200 hover:bg-gray-100",
                }}
                page={currentPage}
                radius="sm"
                size="sm"
                total={totalPages}
                onChange={setCurrentPage}
              />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
