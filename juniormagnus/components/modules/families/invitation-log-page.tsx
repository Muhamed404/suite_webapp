"use client";

import { useMemo, useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import { Search, Send } from "lucide-react";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useInvitations, useSendBatchReminders, useSendBatchUserReminder } from "@/hooks/useInvitation";

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

export function InvitationLogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = useInvitations({ page, limit: ROWS_PER_PAGE });
  const sendAll = useSendBatchReminders();
  const sendUser = useSendBatchUserReminder();

  const rows = data?.rows ?? [];
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r: any) => {
      const email = r.invitee?.email?.toLowerCase() ?? "";
      const name = `${r.invitee?.firstname ?? ""} ${r.invitee?.lastname ?? ""}`.toLowerCase();
      return email.includes(q) || name.includes(q);
    });
  }, [rows, search]);

  const handleResend = async (row: any) => {
    const batchId = row.batch_id;
    const userId = row.user_id;
    try {
      if (batchId && userId) {
        await sendUser.mutateAsync({ batchId, userId });
      }
      addToast({ title: "Reminder queued", color: "success" });
      refetch();
    } catch (e: unknown) {
      addToast({ title: "Failed", description: e instanceof Error ? e.message : "Error", color: "danger" });
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-4 rounded-2xl border border-default-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              className="max-w-sm"
              placeholder="Search email or name"
              startContent={<Search className="h-4 w-4 text-default-400" />}
              value={search}
              onValueChange={setSearch}
            />
            <Button variant="flat" onPress={() => refetch()}>
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-default-500">
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Department / Group</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Last sent</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row: any) => (
                    <tr key={row.id} className="border-b border-default-100">
                      <td className="py-3 pr-4">{formatDate(row.createdAt)}</td>
                      <td className="py-3 pr-4">{row.invitee?.email ?? "—"}</td>
                      <td className="py-3 pr-4">
                        {row.invitee?.department_name || row.invitee?.group_name || "—"}
                      </td>
                      <td className="py-3 pr-4">{row.status?.name ?? "—"}</td>
                      <td className="py-3 pr-4">{formatDate(row.invitation_time)}</td>
                      <td className="py-3">
                        <Button size="sm" variant="flat" startContent={<Send className="h-3 w-3" />} onPress={() => handleResend(row)}>
                          Resend
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filtered.length && <p className="py-8 text-center text-default-500">No invitations yet.</p>}
            </div>
          )}

          {(data?.total_pages ?? 0) > 1 && (
            <Pagination page={page} total={data?.total_pages ?? 1} onChange={setPage} />
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
