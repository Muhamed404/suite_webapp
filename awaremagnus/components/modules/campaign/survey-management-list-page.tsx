"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import clsx from "clsx";
import {
  Search,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  SearchX,
  Plus,
  Send,
  XCircle,
  CheckCircle,
  Zap,
  Eye,
  BookOpen,
} from "lucide-react";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useI18n } from "@/i18n/I18nProvider";
import { useSurveyListAndStats } from "@/hooks/useSurvey";

const ROWS_PER_PAGE = 8;

type SortField =
  | "survey_name"
  | "total_submitted"
  | "issue_date"
  | "deadline_date"
  | "progress_percentage";
type SortDirection = "asc" | "desc" | null;

function getCompletionColor(percentage: number) {
  if (percentage >= 80) return "bg-green-400";
  if (percentage >= 60) return "bg-blue-400";

  return "bg-orange-400";
}

function getStatusBadge(statusName: string) {
  switch (statusName?.toUpperCase()) {
    case "COMPLETED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3" /> Completed
        </span>
      );
    case "CANCELLED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">
          <XCircle className="w-3 h-3" /> Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">
          <Zap className="w-3 h-3" /> In Progress
        </span>
      );
  }
}

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

export function SurveyManagementListPage() {
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const { data: surveyListData, isLoading, error } = useSurveyListAndStats();

  const metaStats = surveyListData?.meta_statistics;
  const surveys = surveyListData?.surveys ?? [];

  // Filters & search
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField | null>("survey_name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);

  // Sort handler
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        if (sortDirection === "asc") {
          setSortDirection("desc");
        } else if (sortDirection === "desc") {
          setSortField(null);
          setSortDirection(null);
        }
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
      setCurrentPage(1);
    },
    [sortField, sortDirection]
  );

  // Filtered & sorted data
  const filteredSurveys = useMemo(() => {
    let result = [...surveys];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      result = result.filter((s) => s.survey_name.toLowerCase().includes(query));
    }

    if (sortField && sortDirection) {
      result.sort((a, b) => {
        let aVal: string | number = "";
        let bVal: string | number = "";

        switch (sortField) {
          case "survey_name":
            aVal = a.survey_name.toLowerCase();
            bVal = b.survey_name.toLowerCase();

            return sortDirection === "asc"
              ? (aVal as string).localeCompare(bVal as string)
              : (bVal as string).localeCompare(aVal as string);
          case "total_submitted":
            aVal = a.total_submitted;
            bVal = b.total_submitted;
            break;
          case "progress_percentage":
            aVal = a.progress_percentage;
            bVal = b.progress_percentage;
            break;
          case "issue_date":
          case "deadline_date":
            aVal = new Date(a[sortField] ?? 0).getTime();
            bVal = new Date(b[sortField] ?? 0).getTime();
            break;
        }

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }

        return 0;
      });
    }

    return result;
  }, [surveys, searchQuery, sortField, sortDirection]);

  // Pagination
  const totalItems = filteredSurveys.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ROWS_PER_PAGE));
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = Math.min(startIndex + ROWS_PER_PAGE, totalItems);
  const paginatedSurveys = filteredSurveys.slice(startIndex, endIndex);

  // Sortable Column Header
  const SortableHeader = ({ field, label }: { field: SortField; label: string }) => {
    const isActive = sortField === field;

    return (
      <div
        className="flex items-center justify-between cursor-pointer select-none outline-none focus:text-blue-600 gap-2"
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
        <span className={clsx("ml-1", isActive ? "text-blue-600" : "text-gray-400")}>
          {isActive && sortDirection === "asc" ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : isActive && sortDirection === "desc" ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronsUpDown className="w-3.5 h-3.5" />
          )}
        </span>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("flex flex-col p-3", isRtl && "text-right")}>
          {/* ── Header Section */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Survey Management</h2>
            <div className="flex items-center gap-3">
              <Button
                as={Link}
                className="flex items-center gap-2 px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium transition"
                endContent={<ChevronRight className="w-4 h-4" />}
                href="/dashboard/survey/questions"
                radius="full"
                size="md"
              >
                Quiz and Questions
              </Button>
              <Button
                as={Link}
                className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition"
                href="/dashboard/survey/new"
                radius="full"
                size="md"
                startContent={<Plus className="w-4 h-4" />}
              >
                New Survey
              </Button>
            </div>
          </div>

          {/* ── Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-2xl p-3 flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500">Total Survey Sent</p>
                <p className="text-lg font-semibold">
                  {isLoading ? "…" : (metaStats?.total_surveys_sent ?? 0)}
                </p>
              </div>
              <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Send className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-3 flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500">Unexpected Answers</p>
                <p className="text-lg font-semibold">
                  {isLoading ? "…" : (metaStats?.total_users_ignored_submission ?? 0)}
                </p>
              </div>
              <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle className="w-4 h-4 text-red-500" />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-3 flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500">Expected Answers</p>
                <p className="text-lg font-semibold">
                  {isLoading ? "…" : (metaStats?.total_users_submissions ?? 0)}
                </p>
              </div>
              <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-teal-500" />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-3 flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500">Response Rate</p>
                <p className="text-lg font-semibold">
                  {isLoading ? "…" : `${metaStats?.response_rate?.toFixed(1) ?? 0}%`}
                </p>
              </div>
              <div className="w-7 h-7 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* ── Survey List Section */}
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3.5 rounded-t-xl border border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-900 font-medium">Survey List</h3>
              </div>
              <div className="flex flex-row gap-4">
                <div className="flex flex-wrap gap-2 items-center">
                  <Input
                    classNames={{
                      base: "w-64",
                      inputWrapper:
                        "h-10 bg-white border border-gray-200 rounded-full hover:border-gray-300 focus-within:!border-blue-500 focus-within:!ring-2 focus-within:!ring-blue-500/20",
                      input: "text-xs",
                    }}
                    placeholder="Search Survey..."
                    startContent={<Search className="text-gray-400 w-4 h-4" />}
                    type="text"
                    value={searchQuery}
                    onValueChange={(value) => {
                      setSearchQuery(value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-b-xl overflow-hidden shadow-sm border border-gray-100 border-t-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Spinner color="primary" size="lg" />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="bg-red-100 p-4 rounded-full inline-block mb-4">
                      <XCircle className="w-10 h-10 text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Error Loading Surveys
                    </h3>
                    <p className="text-sm text-gray-500">Please try again later</p>
                  </div>
                </div>
              ) : paginatedSurveys.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                      <SearchX className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Surveys Found</h3>
                    <p className="text-sm text-gray-500">
                      Try adjusting your search or create a new survey
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className="overflow-x-auto overflow-y-auto"
                    style={{ height: "55vh", minHeight: "400px" }}
                  >
                    <table className="w-full text-xs whitespace-nowrap">
                      <thead className="bg-gray-50 text-gray-600 border-b sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-3.5 text-left font-semibold">
                            <SortableHeader field="survey_name" label="Survey Name" />
                          </th>
                          <th className="px-6 py-3.5 text-left font-semibold">
                            <SortableHeader field="total_submitted" label="Submitted" />
                          </th>
                          <th className="px-6 py-3.5 text-left font-semibold">
                            <SortableHeader field="issue_date" label="Issued" />
                          </th>
                          <th className="px-6 py-3.5 text-left font-semibold">
                            <SortableHeader field="deadline_date" label="Deadline" />
                          </th>
                          <th className="px-6 py-3.5 text-left font-semibold">
                            <SortableHeader field="progress_percentage" label="Completed" />
                          </th>
                          <th className="px-6 py-3.5 text-left font-semibold">Status</th>
                          <th className="px-6 py-3.5 text-left font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginatedSurveys.map((survey) => (
                          <tr
                            key={survey.survey_id}
                            className="hover:bg-gray-50 transition-colors border-b border-gray-100"
                          >
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <BookOpen className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="text-xs font-medium text-gray-700">
                                  {survey.survey_name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-3.5 text-xs text-gray-600">
                              {survey.total_submitted ?? 0}
                            </td>
                            <td className="px-6 py-3.5 text-xs text-gray-600">
                              {formatDate(survey.issue_date)}
                            </td>
                            <td className="px-6 py-3.5 text-xs text-gray-600">
                              {formatDate(survey.deadline_date)}
                            </td>
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={clsx(
                                      getCompletionColor(survey.progress_percentage ?? 0),
                                      "h-2 rounded-full transition-all duration-500"
                                    )}
                                    style={{
                                      width: `${Math.min(survey.progress_percentage ?? 0, 100)}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-gray-700">
                                  {(survey.progress_percentage ?? 0).toFixed(0)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-3.5">{getStatusBadge(survey.status?.name)}</td>
                            <td className="px-6 py-3.5">
                              <Button
                                as={Link}
                                className="inline-flex items-center gap-1 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition min-w-0 h-auto"
                                href={`/dashboard/survey/stats?id=${survey.survey_id}`}
                                radius="full"
                                size="sm"
                                startContent={<Eye className="w-3.5 h-3.5" />}
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-center px-4 py-3.5 border-t bg-gray-50 gap-3">
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                      <span>
                        Showing {totalItems > 0 ? startIndex + 1 : 0}–{endIndex} out of {totalItems}{" "}
                        Entries
                      </span>
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
                </>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
