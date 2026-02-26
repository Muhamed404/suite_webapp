"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Pagination } from "@heroui/pagination";
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
import { SUPPORTED_LANGUAGES, LANGUAGE_FLAGS } from "@/utils/supportedLanguages";
import type { SupportedLanguageId } from "@/utils/supportedLanguages";

// ── Static survey data (mirrors the JS reference) ──────────────
interface SurveyItem {
    id: number;
    moduleName: string;
    submitted: number;
    issued: string;
    deadline: string;
    completed: number;
}

const SURVEY_DATA: SurveyItem[] = [
    { id: 1, moduleName: "Physical Security", submitted: 6, issued: "21/5/2025", deadline: "21/5/2025", completed: 70 },
    { id: 2, moduleName: "Cyber Security", submitted: 8, issued: "15/5/2025", deadline: "28/5/2025", completed: 85 },
    { id: 3, moduleName: "Data Privacy", submitted: 5, issued: "10/5/2025", deadline: "25/5/2025", completed: 65 },
    { id: 4, moduleName: "Network Security", submitted: 9, issued: "1/5/2025", deadline: "20/5/2025", completed: 92 },
    { id: 5, moduleName: "Cloud Security", submitted: 4, issued: "22/5/2025", deadline: "5/6/2025", completed: 45 },
    { id: 6, moduleName: "GDPR Compliance", submitted: 7, issued: "12/5/2025", deadline: "30/5/2025", completed: 78 },
    { id: 7, moduleName: "Password Management", submitted: 10, issued: "5/5/2025", deadline: "22/5/2025", completed: 88 },
    { id: 8, moduleName: "Email Security", submitted: 6, issued: "18/5/2025", deadline: "2/6/2025", completed: 55 },
    { id: 9, moduleName: "Social Engineering", submitted: 5, issued: "20/5/2025", deadline: "3/6/2025", completed: 50 },
    { id: 10, moduleName: "ISO 27001", submitted: 8, issued: "8/5/2025", deadline: "25/5/2025", completed: 80 },
];

const ROWS_PER_PAGE = 8;

// ── Helpers ─────────────────────────────────────────────────────
type SortField = "moduleName" | "submitted" | "issued" | "deadline" | "completed";
type SortDirection = "asc" | "desc" | null;

function getCompletionColor(percentage: number) {
    if (percentage >= 80) return "bg-green-400";
    if (percentage >= 60) return "bg-blue-400";
    return "bg-orange-400";
}

// ── Component ───────────────────────────────────────────────────
export function SurveyManagementListPage() {
    const { dir } = useI18n();
    const isRtl = dir === "rtl";

    // Filters & search
    const [searchQuery, setSearchQuery] = useState("");
    const [languageFilter, setLanguageFilter] = useState<string>("1");
    const [sortField, setSortField] = useState<SortField | null>("moduleName");
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
        let result = [...SURVEY_DATA];

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter((s) => s.moduleName.toLowerCase().includes(query));
        }

        // Sort
        if (sortField && sortDirection) {
            result.sort((a, b) => {
                let aVal: string | number = "";
                let bVal: string | number = "";

                switch (sortField) {
                    case "moduleName":
                        aVal = a.moduleName.toLowerCase();
                        bVal = b.moduleName.toLowerCase();
                        return sortDirection === "asc"
                            ? (aVal as string).localeCompare(bVal as string)
                            : (bVal as string).localeCompare(aVal as string);
                    case "submitted":
                        aVal = a.submitted;
                        bVal = b.submitted;
                        break;
                    case "completed":
                        aVal = a.completed;
                        bVal = b.completed;
                        break;
                    case "issued":
                    case "deadline": {
                        // Parse dd/mm/yyyy
                        const parseDate = (str: string) => {
                            const parts = str.split("/");
                            return new Date(+parts[2], +parts[1] - 1, +parts[0]).getTime();
                        };
                        aVal = parseDate(a[sortField]);
                        bVal = parseDate(b[sortField]);
                        break;
                    }
                }

                if (typeof aVal === "number" && typeof bVal === "number") {
                    return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
                }
                return 0;
            });
        }

        return result;
    }, [searchQuery, sortField, sortDirection]);

    // Pagination
    const totalItems = filteredSurveys.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / ROWS_PER_PAGE));
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    const endIndex = Math.min(startIndex + ROWS_PER_PAGE, totalItems);
    const paginatedSurveys = filteredSurveys.slice(startIndex, endIndex);

    // Stats
    const totalSurveySent = SURVEY_DATA.reduce((acc, s) => acc + s.submitted, 0);
    const avgCompletion = Math.round(
        SURVEY_DATA.reduce((sum, s) => sum + s.completed, 0) / SURVEY_DATA.length
    );

    // ── Sortable Column Header ───────────────────────────────────
    const SortableHeader = ({ field, label }: { field: SortField; label: string }) => {
        const isActive = sortField === field;

        return (
            <div
                role="button"
                tabIndex={0}
                className="flex items-center justify-between cursor-pointer select-none outline-none focus:text-blue-600 gap-2"
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
                    {/* ── Header Section ─────────────────────────────── */}
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Survey Management</h2>
                        <div className="flex items-center gap-3">
                            <Button
                                as={Link}
                                href="/dashboard/quiz"
                                radius="full"
                                size="md"
                                className="flex items-center gap-2 px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium transition"
                                endContent={<ChevronRight className="w-4 h-4" />}
                            >
                                Open Quizzes and Questions
                            </Button>
                            <Button
                                as={Link}
                                href="/dashboard/survey/new"
                                radius="full"
                                size="md"
                                className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition"
                                startContent={<Plus className="w-4 h-4" />}
                            >
                                New Survey
                            </Button>
                        </div>
                    </div>

                    {/* ── Stats Cards ────────────────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        {/* Card 1 – Total Survey Sent */}
                        <div className="bg-white rounded-2xl p-3 flex justify-between items-start">
                            <div>
                                <p className="text-xs text-gray-500">Total Survey Sent</p>
                                <p className="text-lg font-semibold">{totalSurveySent}</p>
                            </div>
                            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <Send className="w-4 h-4 text-blue-500" />
                            </div>
                        </div>

                        {/* Card 2 – Unexpected Answer */}
                        <div className="bg-white rounded-2xl p-3 flex justify-between items-start">
                            <div>
                                <p className="text-xs text-gray-500">Unexpected Answer</p>
                                <p className="text-lg font-semibold">20</p>
                            </div>
                            <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <XCircle className="w-4 h-4 text-red-500" />
                            </div>
                        </div>

                        {/* Card 3 – Expected Answer */}
                        <div className="bg-white rounded-2xl p-3 flex justify-between items-start">
                            <div>
                                <p className="text-xs text-gray-500">Expected Answer</p>
                                <p className="text-lg font-semibold">18</p>
                            </div>
                            <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-4 h-4 text-teal-500" />
                            </div>
                        </div>

                        {/* Card 4 – Response Rate */}
                        <div className="bg-white rounded-2xl p-3 flex justify-between items-start">
                            <div>
                                <p className="text-xs text-gray-500">Response Rate</p>
                                <p className="text-lg font-semibold">{avgCompletion}%</p>
                            </div>
                            <div className="w-7 h-7 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <Zap className="w-4 h-4 text-yellow-500" />
                            </div>
                        </div>
                    </div>

                    {/* ── Survey List Section ────────────────────────── */}
                    <div className="flex flex-col">
                        {/* Table Header Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3.5 rounded-t-xl border border-gray-100">
                            <div className="flex items-center justify-between">
                                <h3 className="text-gray-900 font-medium">Survey List</h3>
                            </div>
                            <div className="flex flex-row gap-4">
                                {/* Search Input */}
                                <div className="flex flex-wrap gap-2 items-center">
                                    <Input
                                        type="text"
                                        placeholder="Search Campaign..."
                                        value={searchQuery}
                                        onValueChange={(value) => {
                                            setSearchQuery(value);
                                            setCurrentPage(1);
                                        }}
                                        startContent={<Search className="text-gray-400 w-4 h-4" />}
                                        classNames={{
                                            base: "w-64",
                                            inputWrapper:
                                                "h-10 bg-white border border-gray-200 rounded-full hover:border-gray-300 focus-within:!border-blue-500 focus-within:!ring-2 focus-within:!ring-blue-500/20",
                                            input: "text-xs",
                                        }}
                                    />
                                </div>
                                {/* Language Filter */}
                                <div className="flex items-center gap-2">
                                    <Select
                                        selectedKeys={[languageFilter]}
                                        onSelectionChange={(keys) => {
                                            const value = Array.from(keys as Set<string>)[0];
                                            if (value) {
                                                setLanguageFilter(value);
                                                setCurrentPage(1);
                                            }
                                        }}
                                        classNames={{
                                            base: "w-40",
                                            trigger:
                                                "h-10 bg-white border border-gray-200 rounded-full hover:border-gray-300 data-[focus=true]:border-blue-500",
                                            value: "text-xs",
                                        }}
                                        aria-label="Language filter"
                                    >
                                        {SUPPORTED_LANGUAGES.map((lang) => (
                                            <SelectItem key={String(lang.id)} textValue={lang.name}>
                                                <span className="flex items-center gap-2">
                                                    <span>{LANGUAGE_FLAGS[lang.id as SupportedLanguageId]}</span>
                                                    <span>{lang.name}</span>
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Table Container */}
                        <div className="bg-white rounded-b-xl overflow-hidden shadow-sm border border-gray-100 border-t-0">
                            {paginatedSurveys.length === 0 ? (
                                /* Empty State */
                                <div className="flex items-center justify-center py-20">
                                    <div className="text-center">
                                        <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                                            <SearchX className="w-10 h-10 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Content Found</h3>
                                        <p className="text-sm text-gray-500">Try adjusting your filters or search query</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Table with fixed height and scroll */}
                                    <div className="overflow-x-auto overflow-y-auto" style={{ height: "55vh", minHeight: "400px" }}>
                                        <table className="w-full text-xs whitespace-nowrap">
                                            <thead className="bg-gray-50 text-gray-600 border-b sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-6 py-3.5 text-left font-semibold">
                                                        <SortableHeader field="moduleName" label="Module Name" />
                                                    </th>
                                                    <th className="px-6 py-3.5 text-left font-semibold">
                                                        <SortableHeader field="submitted" label="Submitted" />
                                                    </th>
                                                    <th className="px-6 py-3.5 text-left font-semibold">
                                                        <SortableHeader field="issued" label="Issued" />
                                                    </th>
                                                    <th className="px-6 py-3.5 text-left font-semibold">
                                                        <SortableHeader field="deadline" label="Deadline" />
                                                    </th>
                                                    <th className="px-6 py-3.5 text-left font-semibold">
                                                        <SortableHeader field="completed" label="Completed" />
                                                    </th>
                                                    <th className="px-6 py-3.5 text-left font-semibold">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {paginatedSurveys.map((survey) => (
                                                    <tr
                                                        key={survey.id}
                                                        className="hover:bg-gray-50 transition-colors border-b border-gray-100"
                                                    >
                                                        {/* Module Name */}
                                                        <td className="px-6 py-3.5">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                                    <BookOpen className="w-4 h-4 text-blue-600" />
                                                                </div>
                                                                <span className="text-xs font-medium text-gray-700">
                                                                    {survey.moduleName}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Submitted */}
                                                        <td className="px-6 py-3.5 text-xs text-gray-600">
                                                            {survey.submitted}
                                                        </td>

                                                        {/* Issued */}
                                                        <td className="px-6 py-3.5 text-xs text-gray-600">
                                                            {survey.issued}
                                                        </td>

                                                        {/* Deadline */}
                                                        <td className="px-6 py-3.5 text-xs text-gray-600">
                                                            {survey.deadline}
                                                        </td>

                                                        {/* Completed – Progress Bar */}
                                                        <td className="px-6 py-3.5">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                                                    <div
                                                                        className={clsx(
                                                                            getCompletionColor(survey.completed),
                                                                            "h-2 rounded-full transition-all duration-500"
                                                                        )}
                                                                        style={{ width: `${survey.completed}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs font-medium text-gray-700">
                                                                    {survey.completed}%
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Action */}
                                                        <td className="px-6 py-3.5">
                                                            <Button
                                                                as={Link}
                                                                href={`/dashboard/survey/${survey.id}`}
                                                                size="sm"
                                                                radius="full"
                                                                className="inline-flex items-center gap-1 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition min-w-0 h-auto"
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

                                    {/* Pagination */}
                                    <div className="flex flex-col md:flex-row justify-between items-center px-4 py-3.5 border-t bg-gray-50 gap-3">
                                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                                            <span>
                                                Showing {totalItems > 0 ? startIndex + 1 : 0}–{endIndex} out of {totalItems}{" "}
                                                Entries
                                            </span>
                                        </div>
                                        <Pagination
                                            total={totalPages}
                                            page={currentPage}
                                            onChange={setCurrentPage}
                                            showControls
                                            size="sm"
                                            radius="sm"
                                            classNames={{
                                                wrapper: "gap-1.5",
                                                item: "min-w-8 h-8 text-xs font-medium bg-white border border-gray-200 hover:bg-gray-100",
                                                cursor: "bg-[#0ea5e9] text-white font-medium",
                                                prev: "min-w-8 h-8 bg-white border border-gray-200 hover:bg-gray-100",
                                                next: "min-w-8 h-8 bg-white border border-gray-200 hover:bg-gray-100",
                                            }}
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
