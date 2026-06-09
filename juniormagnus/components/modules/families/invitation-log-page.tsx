"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import clsx from "clsx";
import { Copy, KeyRound, Mail, RefreshCw, Search, Send, SendHorizontal } from "lucide-react";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useInvitations, useSendBatchUserReminder } from "@/hooks/useInvitation";
import { useTranslations } from "@/i18n/useTranslations";
import type { InvitationLogItem } from "@/types/invitation";

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

function getStatusChipProps(statusName?: string) {
  const status = (statusName ?? "").toUpperCase();

  if (status === "COMPLETED") {
    return { color: "success" as const, className: "bg-emerald-100 text-emerald-700" };
  }
  if (status === "FAILED") {
    return { color: "danger" as const, className: "bg-red-100 text-red-700" };
  }
  if (status === "PENDING") {
    return { color: "warning" as const, className: "bg-amber-100 text-amber-800" };
  }
  if (status === "RETRY") {
    return { color: "primary" as const, className: "bg-orange-100 text-orange-700" };
  }

  return { color: "default" as const, className: "bg-gray-100 text-gray-700" };
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

function CredentialField({
  label,
  value,
  copyLabel,
  copiedLabel,
  unavailableLabel,
}: {
  label: string;
  value?: string | null;
  copyLabel: string;
  copiedLabel: string;
  unavailableLabel: string;
}) {
  const displayValue = value?.trim() || unavailableLabel;
  const canCopy = !!value?.trim();

  const handleCopy = async () => {
    if (!canCopy) return;
    try {
      await navigator.clipboard.writeText(value!.trim());
      addToast({ title: copiedLabel, color: "success" });
    } catch {
      addToast({ title: "Could not copy", color: "danger" });
    }
  };

  return (
    <div className="rounded-xl border border-default-200 bg-[#F8FAFC] p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-default-500">{label}</p>
      <div className="flex items-center justify-between gap-3">
        <p className={clsx("break-all font-mono text-base", canCopy ? "text-default-900" : "text-default-400")}>
          {displayValue}
        </p>
        {canCopy && (
          <Button
            isIconOnly
            aria-label={copyLabel}
            className="shrink-0 bg-white"
            radius="full"
            size="sm"
            variant="flat"
            onPress={handleCopy}
          >
            <Copy className="h-4 w-4 text-default-600" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function InvitationLogPage() {
  const t = useTranslations("dashboard");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [bulkSending, setBulkSending] = useState(false);
  const [credentialsRow, setCredentialsRow] = useState<InvitationLogItem | null>(null);

  const { data, isLoading, refetch, isFetching } = useInvitations({ page, limit: ROWS_PER_PAGE });
  const sendUser = useSendBatchUserReminder();

  const rows = data?.rows ?? [];

  useEffect(() => {
    setSelectedIds(new Set());
  }, [page]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r: InvitationLogItem) => {
      const email = r.invitee?.email?.toLowerCase() ?? "";
      const name = `${r.invitee?.firstname ?? ""} ${r.invitee?.lastname ?? ""}`.toLowerCase();
      return email.includes(q) || name.includes(q);
    });
  }, [rows, search]);

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((row) => selectedIds.has(row.id));

  const toggleRow = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((row) => next.delete(row.id));
        return next;
      });
      return;
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      filtered.forEach((row) => next.add(row.id));
      return next;
    });
  };

  const queueReminder = async (row: InvitationLogItem) => {
    const batchId = row.batch_id;
    const userId = row.user_id;
    if (!batchId || !userId) {
      throw new Error("Missing batch or user for this invitation");
    }
    await sendUser.mutateAsync({ batchId, userId });
  };

  const handleResend = async (row: InvitationLogItem) => {
    try {
      setResendingId(row.id);
      await queueReminder(row);
      addToast({ title: t("invitationLog.toast.reminderQueued"), color: "success" });
      refetch();
    } catch (e: unknown) {
      addToast({
        title: t("invitationLog.toast.failed"),
        description: e instanceof Error ? e.message : "Error",
        color: "danger",
      });
    } finally {
      setResendingId(null);
    }
  };

  const handleBulkResend = async () => {
    const selectedRows = filtered.filter((row) => selectedIds.has(row.id));
    if (!selectedRows.length) {
      addToast({ title: t("invitationLog.toast.noneSelected"), color: "warning" });
      return;
    }

    try {
      setBulkSending(true);
      await Promise.all(selectedRows.map((row) => queueReminder(row)));
      addToast({
        title: t("invitationLog.toast.bulkQueued", { count: selectedRows.length }),
        color: "success",
      });
      setSelectedIds(new Set());
      refetch();
    } catch (e: unknown) {
      addToast({
        title: t("invitationLog.toast.failed"),
        description: e instanceof Error ? e.message : "Error",
        color: "danger",
      });
    } finally {
      setBulkSending(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex flex-col gap-4 p-3">
          <h1 className="text-lg font-bold text-[var(--mainblue)] md:text-xl">
            {t("menu.invitationLog")}
          </h1>

          <div className="overflow-hidden rounded-xl border border-[var(--strokeGray)] bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-default-100 p-4">
              <Input
                className="max-w-sm"
                classNames={{
                  inputWrapper:
                    "h-10 rounded-full border border-default-200 bg-white shadow-none",
                }}
                placeholder={t("invitationLog.searchPlaceholder")}
                startContent={<Search className="h-4 w-4 text-default-400" />}
                value={search}
                onValueChange={setSearch}
              />

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  className="h-10 min-h-10"
                  isLoading={isFetching && !isLoading}
                  radius="full"
                  startContent={<RefreshCw className="h-4 w-4" />}
                  variant="flat"
                  onPress={() => refetch()}
                >
                  {t("invitationLog.refresh")}
                </Button>
                <Button
                  className="h-10 min-h-10 bg-[var(--primary-color)] font-medium text-white"
                  isDisabled={!selectedIds.size}
                  isLoading={bulkSending}
                  radius="full"
                  startContent={<SendHorizontal className="h-4 w-4" />}
                  onPress={handleBulkResend}
                >
                  {selectedIds.size
                    ? t("invitationLog.bulkResendCount", { count: selectedIds.size })
                    : t("invitationLog.bulkResend")}
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#F8FAFC] text-default-600">
                    <tr className="border-b border-default-200 text-left">
                      <th className="w-12 px-4 py-3">
                        <input
                          aria-label={t("invitationLog.selectAll")}
                          checked={allVisibleSelected}
                          className="h-4 w-4 rounded border-default-300 accent-[var(--primary-color)]"
                          type="checkbox"
                          onChange={toggleAllVisible}
                        />
                      </th>
                      <th className="px-4 py-3 font-semibold">{t("invitationLog.table.created")}</th>
                      <th className="px-4 py-3 font-semibold">{t("invitationLog.table.email")}</th>
                      <th className="px-4 py-3 font-semibold">
                        {t("invitationLog.table.departmentGroup")}
                      </th>
                      <th className="px-4 py-3 font-semibold">{t("invitationLog.table.status")}</th>
                      <th className="px-4 py-3 font-semibold">{t("invitationLog.table.lastSent")}</th>
                      <th className="px-4 py-3 text-center font-semibold">
                        {t("invitationLog.table.action")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default-100">
                    {filtered.map((row) => {
                      const statusProps = getStatusChipProps(row.status?.name);
                      const isSelected = selectedIds.has(row.id);

                      return (
                        <tr
                          key={row.id}
                          className={clsx(
                            "transition-colors hover:bg-default-50",
                            isSelected && "bg-orange-50/60"
                          )}
                        >
                          <td className="px-4 py-3">
                            <input
                              aria-label={`Select ${row.invitee?.email ?? row.id}`}
                              checked={isSelected}
                              className="h-4 w-4 rounded border-default-300 accent-[var(--primary-color)]"
                              type="checkbox"
                              onChange={() => toggleRow(row.id)}
                            />
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-default-700">
                            {formatDate(row.createdAt)}
                          </td>
                          <td className="px-4 py-3 font-medium text-default-800">
                            {row.invitee?.email ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-default-700">
                            {row.invitee?.department_name || row.invitee?.group_name || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Chip
                              className={clsx("border-none font-semibold", statusProps.className)}
                              color={statusProps.color}
                              size="sm"
                              variant="flat"
                            >
                              {getStatusLabel(row.status?.name, t)}
                            </Chip>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-default-700">
                            {formatDate(row.invitation_time)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                              <Button
                                isIconOnly
                                aria-label={t("invitationLog.table.viewLogin")}
                                className="bg-sky-50 text-sky-700"
                                radius="full"
                                size="sm"
                                variant="flat"
                                onPress={() => setCredentialsRow(row)}
                              >
                                <KeyRound className="h-4 w-4" />
                              </Button>
                              <Button
                                className="bg-orange-50 font-medium text-[var(--primary-color)]"
                                isLoading={resendingId === row.id}
                                radius="full"
                                size="sm"
                                startContent={<Send className="h-3.5 w-3.5" />}
                                variant="flat"
                                onPress={() => handleResend(row)}
                              >
                                {t("invitationLog.table.resend")}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {!filtered.length && (
                  <p className="py-12 text-center text-default-500">{t("invitationLog.empty")}</p>
                )}
              </div>
            )}

            <div className="flex flex-col items-center justify-between gap-3 border-t border-default-100 bg-[#F8FAFC] px-4 py-3 md:flex-row">
              <div className="flex items-center gap-2 text-xs font-medium text-default-500">
                <Mail className="h-4 w-4" />
                <span>{t("invitationLog.totalRecords", { total: data?.total_items ?? filtered.length })}</span>
              </div>

              {(data?.total_pages ?? 0) > 1 && (
                <Pagination
                  classNames={{
                    cursor: "bg-[var(--primary-color)] text-white",
                  }}
                  page={page}
                  radius="sm"
                  showControls
                  total={data?.total_pages ?? 1}
                  onChange={setPage}
                />
              )}
            </div>
          </div>

          <Modal
            isOpen={!!credentialsRow}
            placement="center"
            scrollBehavior="inside"
            onOpenChange={(open) => {
              if (!open) setCredentialsRow(null);
            }}
          >
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col gap-1 text-[var(--mainblue)]">
                    {t("invitationLog.credentialsModal.title")}
                    <p className="text-sm font-normal text-default-500">
                      {t("invitationLog.credentialsModal.description")}
                    </p>
                  </ModalHeader>
                  <ModalBody className="gap-4">
                    {credentialsRow?.invitee?.email && (
                      <p className="text-sm text-default-600">
                        <span className="font-semibold text-default-800">
                          {t("invitationLog.credentialsModal.email")}:{" "}
                        </span>
                        {credentialsRow.invitee.email}
                      </p>
                    )}
                    <CredentialField
                      copiedLabel={t("invitationLog.credentialsModal.copied")}
                      copyLabel={t("invitationLog.credentialsModal.copy")}
                      label={t("invitationLog.credentialsModal.loginSpace")}
                      unavailableLabel={t("invitationLog.credentialsModal.unavailable")}
                      value={credentialsRow?.invitee?.spacename}
                    />
                    <CredentialField
                      copiedLabel={t("invitationLog.credentialsModal.copied")}
                      copyLabel={t("invitationLog.credentialsModal.copy")}
                      label={t("invitationLog.credentialsModal.pinCode")}
                      unavailableLabel={t("invitationLog.credentialsModal.unavailable")}
                      value={credentialsRow?.invitee?.pin_code}
                    />
                  </ModalBody>
                  <ModalFooter>
                    <Button
                      className="bg-[var(--primary-color)] font-medium text-white"
                      radius="full"
                      onPress={onClose}
                    >
                      {t("invitationLog.credentialsModal.close")}
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
