"use client";

import { useState, useCallback } from "react";
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
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Check,
  X,
  SkipForward,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  FileQuestion,
} from "lucide-react";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useI18n } from "@/i18n/I18nProvider";
import { useOrgDepartmentsAndGroups } from "@/hooks/useOrgDepartmentsAndGroups";
import { useSurvey, useSurveyUserAnswers } from "@/hooks/useSurvey";

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

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
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

function getRiskBadgeColor(riskName?: string | null) {
  if (!riskName) return { bg: "bg-gray-100", text: "text-gray-600" };
  const lower = riskName.toLowerCase();
  if (lower.includes("very high"))
    return { bg: "bg-red-100", text: "text-red-700" };
  if (lower.includes("high"))
    return { bg: "bg-red-100", text: "text-red-700" };
  if (lower.includes("medium"))
    return { bg: "bg-yellow-100", text: "text-yellow-700" };
  return { bg: "bg-green-100", text: "text-green-700" };
}

export function SurveyUserAnswersPage() {
  const { dir } = useI18n();
  const isRtl = dir === "rtl";
  const searchParams = useSearchParams();
  const surveyId = Number(searchParams?.get("surveyId") ?? 0);
  const userId = Number(searchParams?.get("userId") ?? 0);

  // Fetch survey name
  const { data: survey, isLoading: surveyLoading } = useSurvey(surveyId, !!surveyId);
  const { getDepartmentName, getGroupName } = useOrgDepartmentsAndGroups();

  // Table state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState("");
  const [resultFilter, setResultFilter] = useState<string>("");
  const [sortField, setSortField] = useState<string>("submission_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch answers
  const { data: answersData, isLoading: answersLoading } = useSurveyUserAnswers(
    surveyId,
    userId,
    {
      page: currentPage,
      limit: perPage,
      search: searchQuery || undefined,
      result_filter: resultFilter || undefined,
    },
    !!surveyId && !!userId,
  );

  const userInfo = answersData?.user;
  const resolvedDepartmentName = userInfo
    ? getDepartmentName(userInfo.department_id, userInfo.department_name)
    : null;
  const resolvedGroupName = userInfo
    ? getGroupName(userInfo.group_id, userInfo.group_name)
    : null;
  const surveyInfo = answersData?.survey;
  const statistics = answersData?.statistics;
  const answers = answersData?.answers ?? [];
  const pagination = answersData?.pagination;
  const totalItems = pagination?.total_items ?? 0;
  const totalPages = pagination?.total_pages ?? 1;

  const startIndex = totalItems > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const endIndex = Math.min(currentPage * perPage, totalItems);

  const riskColors = getRiskBadgeColor(statistics?.risk_level_name);
  const initials =
    `${userInfo?.firstname?.[0] ?? ""}${userInfo?.lastname?.[0] ?? ""}`.toUpperCase() || "?";

  // Sort answers client-side (since the API handles pagination)
  const sortedAnswers = [...answers].sort((a, b) => {
    if (sortField === "submission_date") {
      const aVal = new Date(a.submission_date ?? 0).getTime();
      const bVal = new Date(b.submission_date ?? 0).getTime();
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  // Export CSV
  const handleExportCSV = useCallback(() => {
    if (!answers.length) return;
    const headers = [
      "#",
      "Submission Date",
      "Question",
      "Selected Answer",
      "Correct Answer",
      "Result",
    ];
    const rows = answers.map((a, i) => [
      i + 1,
      a.submission_date ? formatDateTime(a.submission_date) : "",
      a.question_description,
      a.is_skipped ? "Skipped" : (a.selected_answer_description ?? ""),
      a.correct_answer_description,
      a.is_skipped ? "Skipped" : a.is_correct ? "Pass" : "Fail",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a2 = document.createElement("a");
    a2.href = url;
    a2.download = `survey-${surveyId}-user-${userId}-answers.csv`;
    a2.click();
    URL.revokeObjectURL(url);
  }, [answers, surveyId, userId]);

  if (!surveyId || !userId) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-700">Invalid Parameters</h2>
              <p className="text-sm text-gray-500 mt-2">
                Please select a user from the survey user list
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
              {surveyLoading
                ? "Survey Details"
                : (surveyInfo?.name ?? survey?.name ?? "Survey Details")}
            </Link>
            <span className="text-gray-400">›</span>
            <Link
              className="hover:text-gray-700 transition"
              href={`/dashboard/survey/users?id=${surveyId}`}
            >
              User List
            </Link>
            <span className="text-gray-400">›</span>
            <span className="font-semibold text-gray-900">User Answers</span>
          </nav>

          <div className="flex flex-col px-3 gap-3 mt-2">
            {/* User Info Card */}
            {answersLoading ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-center py-4">
                  <Spinner color="primary" size="sm" />
                </div>
              </div>
            ) : userInfo ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
                      {initials}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {userInfo.firstname} {userInfo.lastname}
                      </h3>
                      <p className="text-xs text-gray-500">{userInfo.email}</p>
                      {(resolvedDepartmentName || resolvedGroupName) && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {resolvedDepartmentName}
                          {resolvedDepartmentName && resolvedGroupName && " • "}
                          {resolvedGroupName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-5 flex-wrap">
                    <div className="text-center px-3">
                      <p className="text-xl font-bold text-green-600">
                        {statistics?.correct_answers ?? 0}
                      </p>
                      <p className="text-[10px] text-gray-500">Correct</p>
                    </div>
                    <div className="text-center px-3">
                      <p className="text-xl font-bold text-red-600">
                        {statistics?.incorrect_answers ?? 0}
                      </p>
                      <p className="text-[10px] text-gray-500">Incorrect</p>
                    </div>
                    <div className="text-center px-3">
                      <p className="text-xl font-bold text-gray-600">
                        {statistics?.skipped_answers ?? 0}
                      </p>
                      <p className="text-[10px] text-gray-500">Skipped</p>
                    </div>
                    <div className="text-center border-l pl-5">
                      <p className="text-xl font-bold text-blue-600">
                        {statistics?.accuracy_percentage ?? 0}%
                      </p>
                      <p className="text-[10px] text-gray-500">Accuracy</p>
                    </div>
                    <div
                      className={clsx(
                        "px-3 py-1.5 rounded-full text-xs font-medium",
                        riskColors.bg,
                        riskColors.text,
                      )}
                    >
                      {statistics?.risk_level_name ?? "Pending"}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Title Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  isIconOnly
                  as={Link}
                  className="bg-white border border-gray-200"
                  href={`/dashboard/survey/users?id=${surveyId}`}
                  radius="full"
                  size="sm"
                  variant="flat"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h3 className="text-lg font-semibold">Survey Answers</h3>
                  <p className="text-xs text-gray-500">
                    {surveyLoading
                      ? "Loading survey..."
                      : (surveyInfo?.name ?? survey?.name ?? "")}
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

            {/* Search & Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded-t-xl border border-gray-100">
              <div className="flex flex-wrap gap-2 items-center">
                <h3 className="text-sm font-medium text-gray-900 mr-2">Answers</h3>
                <Input
                  classNames={{
                    base: "w-56",
                    inputWrapper:
                      "h-9 bg-white border border-gray-200 rounded-full hover:border-gray-300 focus-within:!border-blue-500",
                    input: "text-xs",
                  }}
                  placeholder="Search questions..."
                  startContent={<Search className="text-gray-400 w-4 h-4" />}
                  type="text"
                  value={searchQuery}
                  onValueChange={(value) => {
                    setSearchQuery(value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <Select
                  aria-label="Result filter"
                  classNames={{
                    base: "w-36",
                    trigger:
                      "h-9 bg-white border border-gray-200 rounded-full hover:border-gray-300",
                    value: "text-xs",
                  }}
                  placeholder="All Results"
                  selectedKeys={resultFilter ? [resultFilter] : []}
                  onSelectionChange={(keys) => {
                    const v = Array.from(keys as Set<string>)[0] ?? "";
                    setResultFilter(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectItem key="pass">Pass Only</SelectItem>
                  <SelectItem key="fail">Fail Only</SelectItem>
                  <SelectItem key="skipped">Skipped Only</SelectItem>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-b-xl overflow-hidden border border-gray-100 border-t-0">
              <div
                className="overflow-x-auto overflow-y-auto relative"
                style={{ maxHeight: "45vh", minHeight: "300px" }}
              >
                {answersLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white">
                    <div className="text-center py-12">
                      <Spinner className="mb-4" color="primary" size="lg" />
                      <p className="text-sm text-gray-500">Loading user answers...</p>
                    </div>
                  </div>
                ) : sortedAnswers.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white">
                    <div className="text-center py-12">
                      <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                        <FileQuestion className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        No Answers Found
                      </h3>
                      <p className="text-sm text-gray-500">
                        This user has not submitted any answers yet
                      </p>
                    </div>
                  </div>
                ) : (
                  <table className="w-full text-xs" aria-label="User answers table">
                    <thead className="bg-gray-50 text-gray-600 border-b sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3.5 text-left font-semibold w-12">#</th>
                        <th
                          className="px-4 py-3.5 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => {
                            if (sortField === "submission_date") {
                              setSortOrder((p) => (p === "asc" ? "desc" : "asc"));
                            } else {
                              setSortField("submission_date");
                              setSortOrder("desc");
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span>Submission Date</span>
                            <span
                              className={clsx(
                                sortField === "submission_date"
                                  ? "text-blue-600"
                                  : "text-gray-400",
                              )}
                            >
                              {sortField === "submission_date" && sortOrder === "asc" ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : sortField === "submission_date" && sortOrder === "desc" ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronsUpDown className="w-3.5 h-3.5" />
                              )}
                            </span>
                          </div>
                        </th>
                        <th
                          className="px-4 py-3.5 text-left font-semibold"
                          style={{ minWidth: "300px" }}
                        >
                          Question
                        </th>
                        <th
                          className="px-4 py-3.5 text-left font-semibold"
                          style={{ minWidth: "250px" }}
                        >
                          Selected Answer
                        </th>
                        <th className="px-4 py-3.5 text-center font-semibold w-32">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sortedAnswers.map((answer, idx) => (
                        <tr
                          key={answer.answer_id}
                          className={clsx(
                            "hover:bg-gray-50 transition-colors",
                            answer.is_skipped
                              ? "bg-gray-50/50"
                              : answer.is_correct
                                ? ""
                                : "bg-red-50/30",
                          )}
                        >
                          <td className="px-4 py-3.5 text-gray-500 font-medium">
                            {(currentPage - 1) * perPage + idx + 1}
                          </td>
                          <td className="px-4 py-3.5 text-gray-600">
                            {formatDateTime(answer.submission_date)}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="whitespace-normal max-w-md">
                              <p className="font-medium text-gray-800">
                                {answer.question_description}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {answer.question_type}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="whitespace-normal max-w-sm">
                              {answer.is_skipped ? (
                                <span className="text-gray-400 italic">Skipped</span>
                              ) : (
                                <>
                                  <p
                                    className={clsx(
                                      "font-medium",
                                      answer.is_correct ? "text-green-700" : "text-red-700",
                                    )}
                                  >
                                    {answer.selected_answer_description}
                                  </p>
                                  {!answer.is_correct && (
                                    <p className="text-[10px] text-green-600 mt-1">
                                      Correct: {answer.correct_answer_description}
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {answer.is_skipped ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                                <SkipForward className="w-3 h-3" /> Skipped
                              </span>
                            ) : answer.is_correct ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                                <Check className="w-3 h-3" /> Pass
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-red-100 text-red-700">
                                <X className="w-3 h-3" /> Fail
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
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
