"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import clsx from "clsx";
import {
  Search,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  SearchX,
  Plus,
  ArrowLeft,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useI18n } from "@/i18n/I18nProvider";
import { useSurveyQuestions, useDeleteSurveyQuestion } from "@/hooks/useSurvey";
import { useCategories } from "@/hooks/useSuiteAwm";

const ROWS_PER_PAGE = 10;

type SortField = "question" | "category" | "questType";
type SortDirection = "asc" | "desc" | null;

function getQuizTypeName(id?: number) {
  switch (id) {
    case 1:
      return "True/False";
    case 2:
      return "Single Choice";
    case 3:
      return "Multiple Answers";
    default:
      return "—";
  }
}

export function SurveyQuestionsPage() {
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const queryParams = {
    ...(categoryFilter !== "all" ? { category_id: Number(categoryFilter) } : {}),
    ...(typeFilter !== "all" ? { ques_type_id: Number(typeFilter) } : {}),
  };
  const { data: questions = [], isLoading, error } = useSurveyQuestions(queryParams);
  const { data: categories = [] } = useCategories();
  const deleteQuestion = useDeleteSurveyQuestion();

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        if (sortDirection === "asc") setSortDirection("desc");
        else if (sortDirection === "desc") {
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

  const filteredQuestions = useMemo(() => {
    let result = Array.isArray(questions) ? [...questions] : [];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();

      result = result.filter(
        (item) =>
          item.question?.toLowerCase().includes(q) || item.category?.name?.toLowerCase().includes(q)
      );
    }

    if (sortField && sortDirection) {
      result.sort((a, b) => {
        let aVal = "";
        let bVal = "";

        switch (sortField) {
          case "question":
            aVal = (a.question ?? "").toLowerCase();
            bVal = (b.question ?? "").toLowerCase();
            break;
          case "category":
            aVal = (a.category?.name ?? "").toLowerCase();
            bVal = (b.category?.name ?? "").toLowerCase();
            break;
          case "questType":
            aVal = (a.questType?.name ?? "").toLowerCase();
            bVal = (b.questType?.name ?? "").toLowerCase();
            break;
        }

        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }

    return result;
  }, [questions, searchQuery, sortField, sortDirection]);

  const totalItems = filteredQuestions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ROWS_PER_PAGE));
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = Math.min(startIndex + ROWS_PER_PAGE, totalItems);
  const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      try {
        await deleteQuestion.mutateAsync(id);
      } catch {
        // Error handled by react-query
      }
    }
  };

  const SortableHeader = ({ field, label }: { field: SortField; label: string }) => {
    const isActive = sortField === field;

    return (
      <div
        className="flex items-center gap-1 cursor-pointer select-none"
        role="button"
        tabIndex={0}
        onClick={() => handleSort(field)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleSort(field);
        }}
      >
        <span>{label}</span>
        <span className={clsx(isActive ? "text-blue-600" : "text-gray-400")}>
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
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                isIconOnly
                as={Link}
                className="bg-white border border-gray-200"
                href="/dashboard/survey"
                radius="full"
                size="sm"
                variant="flat"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-lg font-semibold">Quiz and Questions</h2>
            </div>
            <Button
              as={Link}
              className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition"
              href="/dashboard/survey/questions/create"
              radius="full"
              size="md"
              startContent={<Plus className="w-4 h-4" />}
            >
              New Quiz/Question
            </Button>
          </div>

          {/* Table */}
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3.5 rounded-t-xl border border-gray-100">
              <h3 className="text-gray-900 font-medium">Questions List</h3>
              <div className="flex flex-row gap-3">
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
                  onValueChange={(v) => {
                    setSearchQuery(v);
                    setCurrentPage(1);
                  }}
                />
                <Select
                  aria-label="Category filter"
                  classNames={{
                    base: "w-36",
                    trigger: "h-9 bg-white border border-gray-200 rounded-full",
                    value: "text-xs",
                  }}
                  items={[
                    { id: "all", name: "All Categories" },
                    ...(categories as any[]).map((cat: any) => ({
                      id: String(cat.id),
                      name: cat.name,
                    })),
                  ]}
                  selectedKeys={[categoryFilter]}
                  onSelectionChange={(keys) => {
                    const v = Array.from(keys as Set<string>)[0];

                    if (v) {
                      setCategoryFilter(v);
                      setCurrentPage(1);
                    }
                  }}
                >
                  {(item: any) => (
                    <SelectItem key={item.id} textValue={item.name}>
                      {item.name}
                    </SelectItem>
                  )}
                </Select>
                <Select
                  aria-label="Type filter"
                  classNames={{
                    base: "w-36",
                    trigger: "h-9 bg-white border border-gray-200 rounded-full",
                    value: "text-xs",
                  }}
                  selectedKeys={[typeFilter]}
                  onSelectionChange={(keys) => {
                    const v = Array.from(keys as Set<string>)[0];

                    if (v) {
                      setTypeFilter(v);
                      setCurrentPage(1);
                    }
                  }}
                >
                  <SelectItem key="all">All Types</SelectItem>
                  <SelectItem key="1">True/False</SelectItem>
                  <SelectItem key="2">Single Choice</SelectItem>
                  <SelectItem key="3">Multiple Answers</SelectItem>
                </Select>
              </div>
            </div>

            <div className="bg-white rounded-b-xl overflow-hidden shadow-sm border border-gray-100 border-t-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Spinner color="primary" size="lg" />
                </div>
              ) : paginatedQuestions.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                      <SearchX className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Questions Found</h3>
                    <p className="text-sm text-gray-500">Create your first quiz question</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: "55vh" }}>
                    <table className="w-full text-xs whitespace-nowrap">
                      <thead className="bg-gray-50 text-gray-600 border-b sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold w-12">#</th>
                          <th className="px-4 py-3 text-left font-semibold">
                            <SortableHeader field="category" label="Category" />
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            <SortableHeader field="question" label="Question" />
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">Answers</th>
                          <th className="px-4 py-3 text-left font-semibold">Correct</th>
                          <th className="px-4 py-3 text-left font-semibold">
                            <SortableHeader field="questType" label="Quiz Type" />
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginatedQuestions.map((q, idx) => {
                          const correctAnswer = q.answers?.find((a) => a.validity);

                          return (
                            <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-gray-400">{startIndex + idx + 1}</td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium">
                                  {q.category?.name ?? "—"}
                                </span>
                              </td>
                              <td className="px-4 py-3 max-w-xs truncate text-gray-700">
                                {q.question}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-0.5">
                                  {q.answers?.slice(0, 4).map((a, i) => (
                                    <span
                                      key={a.id ?? i}
                                      className={clsx(
                                        "text-[10px] flex items-center gap-1",
                                        a.validity ? "text-green-600 font-medium" : "text-gray-500"
                                      )}
                                    >
                                      {a.validity ? (
                                        <CheckCircle className="w-3 h-3" />
                                      ) : (
                                        <XCircle className="w-3 h-3" />
                                      )}
                                      {a.answer}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-green-600 font-medium text-[10px]">
                                {correctAnswer?.answer ?? "—"}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">
                                  {q.questType?.name ?? getQuizTypeName(q.ques_type_id)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <Button
                                    isIconOnly
                                    className="text-gray-400 hover:text-blue-500"
                                    size="sm"
                                    variant="light"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    isIconOnly
                                    className="text-gray-400 hover:text-red-500"
                                    isLoading={deleteQuestion.isPending}
                                    size="sm"
                                    variant="light"
                                    onPress={() => handleDelete(q.id)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex flex-col md:flex-row justify-between items-center px-4 py-3 border-t bg-gray-50 gap-3">
                      <span className="text-[10px] text-gray-400 font-medium">
                        Showing {startIndex + 1}–{endIndex} of {totalItems}
                      </span>
                      <Pagination
                        showControls
                        classNames={{
                          wrapper: "gap-1",
                          item: "min-w-7 h-7 text-[10px] bg-white border border-gray-200",
                          cursor: "bg-[#0ea5e9] text-white",
                        }}
                        page={currentPage}
                        size="sm"
                        total={totalPages}
                        onChange={setCurrentPage}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
