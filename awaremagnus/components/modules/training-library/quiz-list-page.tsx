"use client";

import type { Quiz } from "@/types/quiz";
import type { LibraryType } from "./library-page";

import Link from "next/link";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import { useState, useMemo, useCallback } from "react";
import clsx from "clsx";
import { Search, ChevronsUpDown, Pencil, Trash2, SearchX, Plus } from "lucide-react";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useI18n } from "@/i18n/I18nProvider";
import { useModule, useQuizzesByModule, useQuizTypes, useDeleteQuiz } from "@/hooks/useQuiz";

// API answer structure from the backend
interface ApiAnswer {
  id?: number;
  answer?: string;
  answer_text?: string;
  validity?: boolean;
  is_correct?: boolean;
}

interface QuizListPageProps {
  moduleId: number;
  libraryType: LibraryType;
}

type SortField = "category" | "question" | "language" | "correctAnswer" | "quizType";
type SortDirection = "asc" | "desc" | null;

const ITEMS_PER_PAGE = 10;

export function QuizListPage({ moduleId, libraryType }: QuizListPageProps) {
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const basePath = `/dashboard/training-library/${libraryType}`;
  const createPath = `${basePath}/${moduleId}/quizzes/create`;

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string>("en");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: moduleRes } = useModule(moduleId, !!moduleId);
  const { data: quizzesRes, isLoading } = useQuizzesByModule(moduleId, !!moduleId);
  const { data: quizTypesRes } = useQuizTypes();
  const deleteQuizMutation = useDeleteQuiz();

  const moduleData = moduleRes?.success ? moduleRes.data : null;
  const allQuizzes: Quiz[] =
    quizzesRes?.success && Array.isArray(quizzesRes.data) ? (quizzesRes.data as Quiz[]) : [];
  const contentMap: Record<number, string> =
    (quizzesRes as { contentMap?: Record<number, string> })?.contentMap ?? {};
  const quizTypes = quizTypesRes?.success ? (quizTypesRes.data ?? []) : [];

  // Get answer text from API answer (handles both answer and answer_text fields)
  const getAnswerText = useCallback((answers: ApiAnswer[] | undefined, index: number): string => {
    if (!answers || !answers[index]) return "—";
    const answer = answers[index];

    return answer.answer || answer.answer_text || "—";
  }, []);

  // Get correct answer using validity or is_correct field
  const getCorrectAnswer = useCallback((answers: ApiAnswer[] | undefined): string => {
    if (!answers || answers.length === 0) return "—";
    const correctAnswer = answers.find((a) => a.validity === true || a.is_correct === true);

    return correctAnswer?.answer || correctAnswer?.answer_text || "—";
  }, []);

  // Get content name for category
  const getContentName = useCallback(
    (quiz: Quiz): string => {
      const contentId =
        (quiz as unknown as { con_id?: number }).con_id ?? quiz.mod_content_id ?? quiz.content_id;

      if (contentId && contentMap[contentId]) {
        return contentMap[contentId];
      }

      return "—";
    },
    [contentMap]
  );

  // Filtered & sorted quizzes
  const filteredQuizzes = useMemo(() => {
    let result = [...allQuizzes];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      result = result.filter(
        (q) =>
          q.question?.toLowerCase().includes(query) ||
          q.quizType?.name?.toLowerCase().includes(query) ||
          getContentName(q).toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortField && sortDirection) {
      result.sort((a, b) => {
        let aVal = "";
        let bVal = "";

        switch (sortField) {
          case "category":
            aVal = getContentName(a);
            bVal = getContentName(b);
            break;
          case "question":
            aVal = a.question || "";
            bVal = b.question || "";
            break;
          case "quizType":
            aVal = a.quizType?.name || "";
            bVal = b.quizType?.name || "";
            break;
          case "correctAnswer":
            aVal = getCorrectAnswer(a.answers as ApiAnswer[]);
            bVal = getCorrectAnswer(b.answers as ApiAnswer[]);
            break;
          default:
            return 0;
        }

        if (sortDirection === "asc") {
          return aVal.localeCompare(bVal);
        } else {
          return bVal.localeCompare(aVal);
        }
      });
    }

    return result;
  }, [allQuizzes, searchQuery, sortField, sortDirection, getContentName, getCorrectAnswer]);

  // Pagination
  const totalItems = filteredQuizzes.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedQuizzes = filteredQuizzes.slice(startIndex, endIndex);

  // Handle sort
  const handleSort = (field: SortField) => {
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
  };

  // Handle delete
  const handleDelete = async (quizId: number) => {
    if (window.confirm("Are you sure you want to delete this quiz?")) {
      await deleteQuizMutation.mutateAsync(quizId);
    }
  };

  // Sortable column header component
  const SortableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <div
      className="flex items-center gap-2 cursor-pointer select-none outline-none focus:text-blue-600"
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
      <span className="text-gray-400">
        <ChevronsUpDown className="w-3.5 h-3.5" />
      </span>
    </div>
  );

  if (!moduleData) return null;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("flex flex-col p-3", isRtl && "text-right")}>
          {/* Header Section */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--mainblue)]">Quiz and Answer</h2>
            <div className="flex items-center gap-3">
              <Button
                as={Link}
                className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition"
                href={createPath}
                radius="full"
                size="md"
                startContent={<Plus className="w-4 h-4" />}
              >
                New Quiz
              </Button>
            </div>
          </div>

          {/* Quiz List Section */}
          <div className="flex flex-col">
            {/* Table Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3.5 rounded-t-xl border border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-900 font-medium">All Quizzes</h3>
              </div>
              <div className="flex flex-row gap-4">
                {/* Search Input */}
                <div className="flex flex-wrap gap-2 items-center">
                  <Input
                    classNames={{
                      base: "w-64",
                      inputWrapper:
                        "h-10 bg-white border border-gray-200 rounded-full hover:border-gray-300 focus-within:!border-blue-500 focus-within:!ring-2 focus-within:!ring-blue-500/20",
                      input: "text-xs",
                    }}
                    placeholder="Search Campaign..."
                    startContent={<Search className="text-gray-400 w-4 h-4" />}
                    type="text"
                    value={searchQuery}
                    onValueChange={(value) => {
                      setSearchQuery(value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
                {/* Language Filter */}
                <div className="flex items-center gap-2">
                  <Select
                    aria-label="Language filter"
                    classNames={{
                      base: "w-40",
                      trigger:
                        "h-10 bg-white border border-gray-200 rounded-full hover:border-gray-300 data-[focus=true]:border-blue-500",
                      value: "text-xs",
                    }}
                    selectedKeys={[languageFilter]}
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys as Set<string>)[0];

                      if (value) setLanguageFilter(value);
                    }}
                  >
                    <SelectItem key="en">English</SelectItem>
                    <SelectItem key="ar">عربي</SelectItem>
                  </Select>
                </div>
              </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-b-xl overflow-hidden shadow-sm border border-gray-100 border-t-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Spinner color="primary" size="lg" />
                </div>
              ) : paginatedQuizzes.length === 0 ? (
                /* Empty State */
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                      <SearchX className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Content Found</h3>
                    <p className="text-sm text-gray-500">
                      Try adjusting your filters or search query
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Table with fixed height and scroll */}
                  <div
                    className="overflow-x-auto overflow-y-auto"
                    style={{ height: "55vh", minHeight: "400px" }}
                  >
                    <Table
                      removeWrapper
                      aria-label="Quiz table"
                      classNames={{
                        base: "min-w-full",
                        table: "min-w-full",
                        thead: "bg-gray-50 sticky top-0 z-10",
                        th: "px-6 py-3.5 text-left font-semibold text-gray-600 text-xs bg-gray-50 first:rounded-none last:rounded-none",
                        td: "px-6 py-3.5 text-xs",
                        tr: "hover:bg-gray-50 transition border-b border-gray-100",
                      }}
                    >
                      <TableHeader>
                        <TableColumn>
                          <SortableHeader field="category" label="Category" />
                        </TableColumn>
                        <TableColumn>
                          <SortableHeader field="question" label="Question" />
                        </TableColumn>
                        <TableColumn>Answer 1</TableColumn>
                        <TableColumn>Answer 2</TableColumn>
                        <TableColumn>Answer 3</TableColumn>
                        <TableColumn>Answer 4</TableColumn>
                        <TableColumn>
                          <SortableHeader field="language" label="Language" />
                        </TableColumn>
                        <TableColumn>
                          <SortableHeader field="correctAnswer" label="Correct Answer" />
                        </TableColumn>
                        <TableColumn>
                          <SortableHeader field="quizType" label="Quiz Type" />
                        </TableColumn>
                        <TableColumn>Action</TableColumn>
                      </TableHeader>
                      <TableBody items={paginatedQuizzes}>
                        {(quiz) => (
                          <TableRow key={quiz.id}>
                            <TableCell className="text-gray-600">{getContentName(quiz)}</TableCell>
                            <TableCell className="text-gray-900 max-w-xs">
                              <span className="truncate block">{quiz.question || "—"}</span>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {getAnswerText(quiz.answers as ApiAnswer[], 0)}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {getAnswerText(quiz.answers as ApiAnswer[], 1)}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {getAnswerText(quiz.answers as ApiAnswer[], 2)}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {getAnswerText(quiz.answers as ApiAnswer[], 3)}
                            </TableCell>
                            <TableCell className="text-gray-600">EN</TableCell>
                            <TableCell className="text-green-600 font-medium">
                              {getCorrectAnswer(quiz.answers as ApiAnswer[])}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {quiz.quizType?.name ||
                                quizTypes.find((qt) => qt.id === quiz.quiz_type_id)?.name ||
                                "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  isIconOnly
                                  as={Link}
                                  className="min-w-0 h-8 w-8 p-0 bg-blue-50 text-blue-600 hover:bg-blue-100"
                                  href={`${basePath}/${moduleId}/quizzes/${quiz.id}/edit`}
                                  radius="full"
                                  size="sm"
                                  variant="flat"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  isIconOnly
                                  className="min-w-0 h-8 w-8 p-0 bg-red-50 text-red-600 hover:bg-red-100"
                                  isLoading={deleteQuizMutation.isPending}
                                  radius="full"
                                  size="sm"
                                  variant="flat"
                                  onPress={() => handleDelete(quiz.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
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
