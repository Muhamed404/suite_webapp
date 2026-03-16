"use client";

import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import clsx from "clsx";
import {
  ArrowLeft,
  Search,
  Download,
  Eye,
  Users,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  SearchX,
  XCircle,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Link as LinkIcon,
} from "lucide-react";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useI18n } from "@/i18n/I18nProvider";
import { useSurvey, useSurveyUsers, useRetrySurveyUserFetch } from "@/hooks/useSurvey";

type SortField = "name" | "submission_date" | "risk_level";
type SortDirection = "asc" | "desc";

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getRiskBadge(riskName?: string | null) {
  if (!riskName)
    return <span className="text-[10px] text-gray-400 italic">Pending</span>;

  const lower = riskName.toLowerCase();

  if (lower.includes("very high")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">
        <ShieldAlert className="w-3 h-3" /> Very High
      </span>
    );
  }
  if (lower.includes("high")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">
        <ShieldAlert className="w-3 h-3" /> High
      </span>
    );
  }
  if (lower.includes("medium")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-700">
        <AlertTriangle className="w-3 h-3" /> Medium
      </span>
    );
  }
  if (lower.includes("low")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
        <ShieldCheck className="w-3 h-3" /> {riskName}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
      <ShieldCheck className="w-3 h-3" /> {riskName}
    </span>
  );
}

export function SurveyUserListPage() {
  const { dir } = useI18n();
  const isRtl = dir === "rtl";
  const searchParams = useSearchParams();
  const surveyId = Number(searchParams?.get("id") ?? 0);

  // Fetch survey name
  const { data: survey, isLoading: surveyLoading } = useSurvey(surveyId, !!surveyId);

  // Table state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("submission_date");
  const [sortOrder, setSortOrder] = useState<SortDirection>("desc");
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [groupFilter, setGroupFilter] = useState<string>("");
  const [submissionFilter, setSubmissionFilter] = useState<string>("");

  const retryFetchMutation = useRetrySurveyUserFetch();

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useSurveyUsers(
    surveyId,
    {
      page: currentPage,
      limit: perPage,
      sort_by: sortBy,
      sort_order: sortOrder,
      search: searchQuery || undefined,
      risk_level_id: riskLevelFilter ? Number(riskLevelFilter) : undefined,
      department_id: departmentFilter ? Number(departmentFilter) : undefined,
      group_id: groupFilter ? Number(groupFilter) : undefined,
      submission_status: submissionFilter || undefined,
    },
    !!surveyId,
  );

  const users = usersData?.users ?? [];
  const pagination = usersData?.pagination;
  const filters = usersData?.filters;
  const totalItems = pagination?.total_items ?? 0;
  const totalPages = pagination?.total_pages ?? 1;

  // Sort handler
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortBy === field) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(field);
        setSortOrder("asc");
      }
      setCurrentPage(1);
    },
    [sortBy],
  );

  // Sortable header
  const SortableHeader = ({ field, label }: { field: SortField; label: string }) => {
    const isActive = sortBy === field;

    return (
      <div
        className="flex items-center gap-2 cursor-pointer select-none"
        role="button"
        tabIndex={0}
        onClick={() => handleSort(field)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleSort(field);
          }
        }}
      >
        <span>{label}</span>
        <span className={clsx(isActive ? "text-blue-600" : "text-gray-400")}>
          {isActive && sortOrder === "asc" ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : isActive && sortOrder === "desc" ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronsUpDown className="w-3.5 h-3.5" />
          )}
        </span>
      </div>
    );
  };

  // Export CSV
  const handleExportCSV = useCallback(() => {
    if (!users.length) return;
    const headers = [
      "Name",
      "Email",
      "Submission Date",
      "Risk Level",
      "Correct",
      "Incorrect",
      "Skipped",
      "Group",
      "Department",
    ];
    const rows = users.map((u: typeof users[number]) => [
      `${u.firstname} ${u.lastname}`,
      u.email,
      u.submission_date ? formatDate(u.submission_date) : "Pending",
      u.risk_level_name ?? "Pending",
      u.correct_answers ?? "",
      u.incorrect_answers ?? "",
      u.skipped_answers ?? "",
      u.group_name ?? "",
      u.department_name ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c: string | number | null | undefined) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `survey-${surveyId}-users.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [users, surveyId]);

  const startIndex = totalItems > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const endIndex = Math.min(currentPage * perPage, totalItems);

  if (!surveyId) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-700">No Survey Selected</h2>
              <p className="text-sm text-gray-500 mt-2">
                Please select a survey from the management page
              </p>
              <Button
                as={Link}
                className="mt-4 bg-blue-500 text-white"
                href="/dashboard/survey"
                radius="full"
              >
                Back to Surveys
              </Button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // Summary stats from current data
  const submittedCount = users.filter((u) => u.submission_date).length;
  const pendingCount = users.length - submittedCount;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("flex flex-col", isRtl && "text-right")}>
          {/* Breadcrumb */}
          <nav className="flex items-center text-xs text-gray-500 gap-1.5 p-3 pb-0">
            <Link className="hover:text-gray-700 transition" href="/dashboard/survey">
              Survey
            </Link>
            <span className="text-gray-400">›</span>
            <Link
              className="hover:text-gray-700 transition"
              href={`/dashboard/survey/stats?id=${surveyId}`}
            >
              {surveyLoading ? "Survey Details" : (survey?.name ?? "Survey Details")}
            </Link>
            <span className="text-gray-400">›</span>
            <span className="font-semibold text-gray-900">User List</span>
          </nav>

          <div className="flex flex-col px-3 gap-3 mt-2">
            {/* Title Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  isIconOnly
                  as={Link}
                  className="bg-white border border-gray-200"
                  href={`/dashboard/survey/stats?id=${surveyId}`}
                  radius="full"
                  size="sm"
                  variant="flat"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h3 className="text-lg font-semibold">Survey User Report</h3>
                  <p className="text-xs text-gray-500">
                    {surveyLoading ? "Loading survey..." : (survey?.name ?? "")}
                  </p>
                </div>
              </div>
              <Button
                className="flex items-center gap-2 px-5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition"
                radius="full"
                size="sm"
                startContent={<Download className="w-4 h-4" />}
                variant="bordered"
                onPress={handleExportCSV}
              >
                Export CSV
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-4">
                <p className="text-gray-500 text-xs">Total Users</p>
                <div className="flex justify-between items-center mt-1.5">
                  <h3 className="text-2xl font-semibold">{totalItems}</h3>
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4">
                <p className="text-gray-500 text-xs">Submitted</p>
                <div className="flex justify-between items-center mt-1.5">
                  <h3 className="text-2xl font-semibold text-green-600">{submittedCount}</h3>
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4">
                <p className="text-gray-500 text-xs">Pending</p>
                <div className="flex justify-between items-center mt-1.5">
                  <h3 className="text-2xl font-semibold text-amber-600">{pendingCount}</h3>
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded-t-xl border border-gray-100">
              <div className="flex flex-wrap gap-2 items-center">
                <h3 className="text-sm font-medium text-gray-900 mr-2">User List</h3>
                <Input
                  classNames={{
                    base: "w-56",
                    inputWrapper:
                      "h-9 bg-white border border-gray-200 rounded-full hover:border-gray-300 focus-within:!border-blue-500",
                    input: "text-xs",
                  }}
                  placeholder="Search by name or email..."
                  startContent={<Search className="text-gray-400 w-4 h-4" />}
                  type="text"
                  value={searchQuery}
                  onValueChange={(value) => {
                    setSearchQuery(value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select
                  aria-label="Risk level filter"
                  classNames={{
                    base: "w-36",
                    trigger:
                      "h-9 bg-white border border-gray-200 rounded-full hover:border-gray-300",
                    value: "text-xs",
                  }}
                  placeholder="All Risk Levels"
                  selectedKeys={riskLevelFilter ? [riskLevelFilter] : []}
                  onSelectionChange={(keys) => {
                    const v = Array.from(keys as Set<string>)[0] ?? "";
                    setRiskLevelFilter(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectItem key="1">Very Low</SelectItem>
                  <SelectItem key="2">Low</SelectItem>
                  <SelectItem key="3">Medium</SelectItem>
                  <SelectItem key="4">High</SelectItem>
                  <SelectItem key="5">Very High</SelectItem>
                </Select>

                {(filters?.departments?.length ?? 0) > 0 && (
                  <Select
                    aria-label="Department filter"
                    classNames={{
                      base: "w-36",
                      trigger:
                        "h-9 bg-white border border-gray-200 rounded-full hover:border-gray-300",
                      value: "text-xs",
                    }}
                    placeholder="All Departments"
                    selectedKeys={departmentFilter ? [departmentFilter] : []}
                    onSelectionChange={(keys) => {
                      const v = Array.from(keys as Set<string>)[0] ?? "";
                      setDepartmentFilter(v);
                      setCurrentPage(1);
                    }}
                  >
                    {(filters?.departments ?? []).map((d) => (
                      <SelectItem key={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </Select>
                )}

                {(filters?.groups?.length ?? 0) > 0 && (
                  <Select
                    aria-label="Group filter"
                    classNames={{
                      base: "w-36",
                      trigger:
                        "h-9 bg-white border border-gray-200 rounded-full hover:border-gray-300",
                      value: "text-xs",
                    }}
                    placeholder="All Groups"
                    selectedKeys={groupFilter ? [groupFilter] : []}
                    onSelectionChange={(keys) => {
                      const v = Array.from(keys as Set<string>)[0] ?? "";
                      setGroupFilter(v);
                      setCurrentPage(1);
                    }}
                  >
                    {(filters?.groups ?? []).map((g) => (
                      <SelectItem key={String(g.id)}>{g.name}</SelectItem>
                    ))}
                  </Select>
                )}

                <Select
                  aria-label="Submission status filter"
                  classNames={{
                    base: "w-36",
                    trigger:
                      "h-9 bg-white border border-gray-200 rounded-full hover:border-gray-300",
                    value: "text-xs",
                  }}
                  placeholder="All Users"
                  selectedKeys={submissionFilter ? [submissionFilter] : []}
                  onSelectionChange={(keys) => {
                    const v = Array.from(keys as Set<string>)[0] ?? "";
                    setSubmissionFilter(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectItem key="submitted">Submitted</SelectItem>
                  <SelectItem key="pending">Pending</SelectItem>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-b-xl overflow-hidden border border-gray-100 border-t-0">
              <div
                className="overflow-x-auto overflow-y-auto relative"
                style={{ maxHeight: "55vh", minHeight: "350px" }}
              >
                {usersLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white">
                    <div className="text-center py-12">
                      <Spinner className="mb-4" color="primary" size="lg" />
                      <p className="text-sm text-gray-500">Loading survey users...</p>
                    </div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white">
                    <div className="text-center py-12">
                      <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                        <Users className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">No Users Found</h3>
                      {searchQuery ||
                      riskLevelFilter ||
                      departmentFilter ||
                      groupFilter ||
                      submissionFilter ? (
                        <p className="text-sm text-gray-500">
                          Try adjusting your filters or search query.
                        </p>
                      ) : (
                        <>
                          <p className="text-sm text-gray-500 mb-4">
                            No invitations have been loaded for this survey yet. You can trigger a
                            retry to fetch users from groups and departments for testing.
                          </p>
                          <Button
                            radius="full"
                            size="sm"
                            color="primary"
                            isLoading={retryFetchMutation.isPending}
                            className="px-6 text-xs font-medium"
                            onPress={() => {
                              if (!surveyId) return;
                              retryFetchMutation.mutate(surveyId);
                            }}
                          >
                            Retry user fetch
                          </Button>
                          {retryFetchMutation.isError && (
                            <p className="mt-2 text-xs text-red-500">
                              Failed to retry user fetch. Please try again.
                            </p>
                          )}
                          {retryFetchMutation.isSuccess && (
                            <p className="mt-2 text-xs text-green-600">
                              Retry triggered. Users will appear once the background fetch
                              completes.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <table
                    className="w-full text-xs whitespace-nowrap"
                    aria-label="Survey user report table"
                  >
                    <thead className="bg-gray-50 text-gray-600 border-b sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3.5 text-left font-semibold">
                          <SortableHeader field="name" label="User" />
                        </th>
                        <th className="px-4 py-3.5 text-left font-semibold">
                          <SortableHeader field="submission_date" label="Submission Date" />
                        </th>
                        <th className="px-4 py-3.5 text-left font-semibold">
                          <SortableHeader field="risk_level" label="Risk Level" />
                        </th>
                        <th className="px-4 py-3.5 text-center font-semibold">Correct</th>
                        <th className="px-4 py-3.5 text-center font-semibold">Incorrect</th>
                        <th className="px-4 py-3.5 text-center font-semibold">Skipped</th>
                        <th className="px-4 py-3.5 text-left font-semibold">Group</th>
                        <th className="px-4 py-3.5 text-left font-semibold">Department</th>
                        <th className="px-4 py-3.5 text-center font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map((user) => {
                        const initials =
                          `${user.firstname?.[0] ?? ""}${user.lastname?.[0] ?? ""}`.toUpperCase() ||
                          "?";

                        return (
                          <tr
                            key={user.invite_id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                                  {initials}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800">
                                    {user.firstname} {user.lastname}
                                  </p>
                                  <p className="text-[10px] text-gray-400">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-gray-600">
                              {user.submission_date ? (
                                formatDate(user.submission_date)
                              ) : (
                                <span className="text-gray-400 italic">Pending</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              {getRiskBadge(user.risk_level_name)}
                            </td>
                            <td className="px-4 py-3.5 text-center text-green-600 font-medium">
                              {user.correct_answers ?? "—"}
                            </td>
                            <td className="px-4 py-3.5 text-center text-red-600 font-medium">
                              {user.incorrect_answers ?? "—"}
                            </td>
                            <td className="px-4 py-3.5 text-center text-gray-500">
                              {user.skipped_answers ?? "—"}
                            </td>
                            <td className="px-4 py-3.5 text-gray-600">
                              {user.group_name ?? "—"}
                            </td>
                            <td className="px-4 py-3.5 text-gray-600">
                              {user.department_name ?? "—"}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <div className="flex flex-col items-center gap-1">
                                {user.submission_date ? (
                                  <Button
                                    as={Link}
                                    className="text-[10px] h-7 px-3 bg-blue-50 text-blue-600"
                                    href={`/dashboard/survey/users/answers?surveyId=${surveyId}&userId=${user.user_id}`}
                                    radius="full"
                                    size="sm"
                                    startContent={<Eye className="w-3 h-3" />}
                                    variant="flat"
                                  >
                                    View
                                  </Button>
                                ) : (
                                  <span className="text-[10px] text-gray-400 italic">
                                    No submission
                                  </span>
                                )}
                                {survey?.survey_unique_code && (
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700"
                                    onClick={() => {
                                      const origin =
                                        typeof window !== "undefined"
                                          ? window.location.origin
                                          : "";
                                      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
                                      const url = `${origin}${basePath}/survey/${surveyId}?invitation_id=${user.invite_id}&survey_code=${encodeURIComponent(
                                        survey.survey_unique_code!,
                                      )}`;
                                      if (navigator.clipboard?.writeText) {
                                        navigator.clipboard.writeText(url);
                                      }
                                    }}
                                  >
                                    <LinkIcon className="w-3 h-3" />
                                    Copy link
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              <div className="flex flex-col md:flex-row justify-between items-center px-4 py-3.5 border-t bg-gray-50 gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                    <span>
                      Showing {startIndex}–{endIndex} out of {totalItems} Entries
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">Per page:</span>
                    <select
                      className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                      value={perPage}
                      onChange={(e) => {
                        setPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
                {totalPages > 1 && (
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
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
