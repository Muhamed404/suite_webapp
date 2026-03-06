"use client";

import { useState } from "react";
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
  Send,
  CheckCircle,
  Users,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Copy,
} from "lucide-react";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useI18n } from "@/i18n/I18nProvider";
import { DonutChart } from "@/components/modules/dashboard/charts/donut-chart";
import { AreaChart } from "@/components/modules/dashboard/charts/area-chart";
import { SemiCircleChart } from "@/components/modules/dashboard/charts/semi-circle-chart";
import { useSurvey, useSurveyStatistics, useSurveyUsers } from "@/hooks/useSurvey";

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[10px] text-gray-600">{label}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color = "bg-blue-100",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5">
      <p className="text-gray-600 text-sm">{label}</p>
      <div className="flex justify-between items-center mt-2">
        <h3 className="text-3xl font-semibold">{value}</h3>
        <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center", color)}>
          {icon}
        </div>
      </div>
    </div>
  );
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

function getRiskBadge(riskName?: string | null) {
  if (!riskName) return <span className="text-[10px] text-gray-400">Pending</span>;
  const lower = riskName.toLowerCase();

  if (lower.includes("very high") || lower.includes("high")) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">
        <ShieldAlert className="w-3 h-3" /> {riskName}
      </span>
    );
  }
  if (lower.includes("medium")) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-700">
        <AlertTriangle className="w-3 h-3" /> {riskName}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
      <ShieldCheck className="w-3 h-3" /> {riskName}
    </span>
  );
}

export function SurveyStatsPage() {
  const { dir } = useI18n();
  const isRtl = dir === "rtl";
  const searchParams = useSearchParams();
  // useSearchParams can return null during initial render in some cases
  const surveyId = Number(searchParams?.get("id") ?? 0);

  // Fetch Data
  const { data: survey, isLoading: surveyLoading } = useSurvey(surveyId, !!surveyId);
  const { data: stats, isLoading: statsLoading } = useSurveyStatistics(surveyId, !!surveyId);

  // Users table state
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [submissionFilter, setSubmissionFilter] = useState<string>("all");
  const { data: usersData, isLoading: usersLoading } = useSurveyUsers(
    surveyId,
    {
      page: userPage,
      limit: 10,
      search: userSearch || undefined,
      submission_status: submissionFilter !== "all" ? submissionFilter : undefined,
    },
    !!surveyId
  );

  const isLoading = surveyLoading || statsLoading;

  // Chart data
  const donutColors = ["#FFA657", "#FFD57E", "#B18AEC", "#7C8DFF", "#3ACE89", "#FB5050"];
  const deptRisk = stats?.department_risk ?? [];
  const groupRisk = stats?.group_risk ?? [];
  const timeline = stats?.submission_timeline ?? [];

  const deptDonutValues = deptRisk.map((d) => d.total_employees);
  const deptDonutLabels = deptRisk.map((d) => d.department_name ?? `Dept ${d.department_id}`);
  const groupDonutValues = groupRisk.map((g) => g.total_employees);
  const groupDonutLabels = groupRisk.map((g) => g.group_name ?? `Group ${g.group_id}`);

  const timelineLabels = timeline.map((t) => {
    try {
      return new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return t.date;
    }
  });
  const timelineData = timeline.map((t) => t.total_submitted);

  const overall = stats?.overall_risk_level;

  const surveyLink = survey?.survey_unique_code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/survey/${survey.survey_unique_code}`
    : "";

  const handleCopyLink = () => {
    if (surveyLink) {
      navigator.clipboard.writeText(surveyLink);
    }
  };

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

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("p-3", isRtl && "text-right")}>
          {/* Back Button & Title */}
          <div className="flex items-center gap-3 mb-4">
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
            <div>
              <h2 className="text-xl font-semibold">
                {isLoading ? "Loading..." : (survey?.name ?? "Survey Details")}
              </h2>
              {surveyLink && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">Survey Link:</span>
                  <code className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {surveyLink}
                  </code>
                  <button
                    className="text-gray-400 hover:text-blue-500 transition"
                    onClick={handleCopyLink}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner color="primary" size="lg" />
            </div>
          ) : (
            <>
              {/* ─── Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                <StatCard
                  color="bg-green-100"
                  icon={<CheckCircle className="w-5 h-5 text-green-600" />}
                  label="Submitted Surveys"
                  value={stats?.survey_summary?.total_surveys_submitted ?? 0}
                />
                <StatCard
                  color="bg-yellow-100"
                  icon={<AlertTriangle className="w-5 h-5 text-yellow-600" />}
                  label="Risk Level"
                  value={
                    overall
                      ? overall.total_overall_risky_employees >
                        overall.total_overall_nonrisky_employees
                        ? "High"
                        : "Low"
                      : "—"
                  }
                />
                <StatCard
                  color="bg-blue-100"
                  icon={<Send className="w-5 h-5 text-blue-600" />}
                  label="Total Surveys Sent"
                  value={stats?.survey_summary?.total_surveys_sent ?? 0}
                />
                <StatCard
                  color="bg-purple-100"
                  icon={<Users className="w-5 h-5 text-purple-600" />}
                  label="Total Received"
                  value={stats?.survey_summary?.total_surveys_submitted ?? 0}
                />
              </div>

              {/* ─── Chart Row – 3 Charts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                {/* Department Risk Donut */}
                <div className="bg-white rounded-3xl p-6">
                  <p className="font-medium mb-4">Response Distribution by Department</p>
                  {deptRisk.length > 0 ? (
                    <div className="flex">
                      <div className="flex justify-center items-center">
                        <DonutChart
                          centerLabel={deptDonutLabels[0] ?? ""}
                          colors={donutColors.slice(0, deptRisk.length)}
                          height={192}
                          labels={deptDonutLabels}
                          values={deptDonutValues}
                        />
                      </div>
                      <div className="text-[10px] text-gray-600 space-y-2 flex flex-col justify-center">
                        {deptRisk.map((d, i) => (
                          <LegendDot
                            key={d.department_id}
                            color={donutColors[i % donutColors.length]}
                            label={d.department_name ?? `Dept ${d.department_id}`}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-8">No department data</p>
                  )}
                </div>

                {/* Group Risk Donut */}
                <div className="bg-white rounded-3xl p-6">
                  <p className="font-medium mb-4">Response Distribution by Group</p>
                  {groupRisk.length > 0 ? (
                    <div className="flex">
                      <div className="flex justify-center items-center">
                        <DonutChart
                          centerLabel={groupDonutLabels[0] ?? ""}
                          colors={donutColors.slice(0, groupRisk.length)}
                          height={192}
                          labels={groupDonutLabels}
                          values={groupDonutValues}
                        />
                      </div>
                      <div className="text-[10px] text-gray-600 space-y-2 flex flex-col justify-center">
                        {groupRisk.map((g, i) => (
                          <LegendDot
                            key={g.group_id}
                            color={donutColors[i % donutColors.length]}
                            label={g.group_name ?? `Group ${g.group_id}`}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-8">No group data</p>
                  )}
                </div>

                {/* Response Rate / Overall Risk */}
                <div className="bg-white rounded-3xl p-6 flex flex-col items-center">
                  <p className="font-medium mb-4">Response Rate</p>
                  <div className="w-72 h-72 flex items-center justify-center">
                    <SemiCircleChart
                      admin={overall?.total_overall_risky_employees ?? 0}
                      color1="#3ACE89"
                      color2="#BEC3C7"
                      color3="#FB5050"
                      opened={overall?.total_overall_non_submitted_employees ?? 0}
                      sent={overall?.total_overall_nonrisky_employees ?? 0}
                    />
                  </div>
                  <div className="flex gap-4 mt-2 text-[10px]">
                    <LegendDot color="#3ACE89" label="Non-Risky" />
                    <LegendDot color="#BEC3C7" label="Not Submitted" />
                    <LegendDot color="#FB5050" label="Risky" />
                  </div>
                </div>
              </div>

              {/* ─── Submission Timeline */}
              <div className="py-2 mt-2">
                <h2 className="text-xl font-semibold mb-2">Questions Analysis</h2>
                <div className="grid grid-cols-12 gap-2">
                  <div className="bg-white rounded-3xl col-span-12 lg:col-span-8 p-6">
                    <div className="flex justify-between mb-6">
                      <div>
                        <p className="font-medium">Submission Timeline</p>
                        <p className="text-gray-400 text-sm">
                          {survey?.name ?? "Survey"} responses over time
                        </p>
                      </div>
                    </div>
                    <div className="h-72">
                      {timeline.length > 0 ? (
                        <AreaChart
                          data={timelineData}
                          labels={timelineLabels}
                          seriesName="Submissions"
                          yLabel="Submissions"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          No submission data yet
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-white rounded-3xl col-span-12 lg:col-span-4 p-6 flex flex-col items-center">
                    <p className="font-medium mb-6">Employee Risk Rates</p>
                    <div className="w-72 h-72 flex items-center justify-center">
                      <SemiCircleChart
                        admin={stats?.response_chart?.total_incorrect_answers ?? 0}
                        color1="#3ACE89"
                        color2="#BEC3C7"
                        color3="#FB5050"
                        opened={stats?.response_chart?.total_not_submitted ?? 0}
                        sent={stats?.response_chart?.total_correct_answers ?? 0}
                      />
                    </div>
                    <div className="flex gap-4 mt-2 text-[10px]">
                      <LegendDot color="#3ACE89" label="Correct" />
                      <LegendDot color="#BEC3C7" label="Not Submitted" />
                      <LegendDot color="#FB5050" label="Incorrect" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Answers List / Users Table */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Answers List</h2>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  {/* Filters */}
                  <div className="flex flex-wrap gap-3 items-center px-4 py-3 border-b border-gray-100">
                    <Input
                      classNames={{
                        base: "w-64",
                        inputWrapper:
                          "h-9 bg-white border border-gray-200 rounded-full hover:border-gray-300 focus-within:!border-blue-500",
                        input: "text-xs",
                      }}
                      placeholder="Search by name or email..."
                      startContent={<Search className="text-gray-400 w-4 h-4" />}
                      type="text"
                      value={userSearch}
                      onValueChange={setUserSearch}
                    />
                    <Select
                      aria-label="Submission filter"
                      classNames={{
                        base: "w-40",
                        trigger:
                          "h-9 bg-white border border-gray-200 rounded-full hover:border-gray-300",
                        value: "text-xs",
                      }}
                      selectedKeys={[submissionFilter]}
                      onSelectionChange={(keys) => {
                        const v = Array.from(keys as Set<string>)[0];

                        if (v) setSubmissionFilter(v);
                      }}
                    >
                      <SelectItem key="all">All</SelectItem>
                      <SelectItem key="submitted">Submitted</SelectItem>
                      <SelectItem key="pending">Pending</SelectItem>
                    </Select>
                  </div>

                  {usersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Spinner color="primary" size="md" />
                    </div>
                  ) : (usersData?.users?.length ?? 0) === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-sm text-gray-400">No users found</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs whitespace-nowrap">
                          <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold">Name</th>
                              <th className="px-4 py-3 text-left font-semibold">Correct</th>
                              <th className="px-4 py-3 text-left font-semibold">Incorrect</th>
                              <th className="px-4 py-3 text-left font-semibold">Skipped</th>
                              <th className="px-4 py-3 text-left font-semibold">Risk Level</th>
                              <th className="px-4 py-3 text-left font-semibold">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {usersData?.users?.map((user) => (
                              <tr
                                key={user.invite_id}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-4 py-3">
                                  <div>
                                    <p className="font-medium text-gray-800">
                                      {user.firstname} {user.lastname}
                                    </p>
                                    <p className="text-[10px] text-gray-400">{user.email}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-green-600 font-medium">
                                  {user.correct_answers ?? "—"}
                                </td>
                                <td className="px-4 py-3 text-red-600 font-medium">
                                  {user.incorrect_answers ?? "—"}
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                  {user.skipped_answers ?? "—"}
                                </td>
                                <td className="px-4 py-3">{getRiskBadge(user.risk_level_name)}</td>
                                <td className="px-4 py-3">
                                  <Button
                                    as={Link}
                                    className="text-[10px] h-7 px-3 bg-blue-50 text-blue-600"
                                    href={`/dashboard/survey/stats?id=${surveyId}&userId=${user.user_id}`}
                                    radius="full"
                                    size="sm"
                                    startContent={<Eye className="w-3 h-3" />}
                                    variant="flat"
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
                      {usersData?.pagination && usersData.pagination.total_pages > 1 && (
                        <div className="flex justify-between items-center px-4 py-3 border-t bg-gray-50">
                          <span className="text-[10px] text-gray-400">
                            Page {usersData.pagination.current_page} of{" "}
                            {usersData.pagination.total_pages} ({usersData.pagination.total_items}{" "}
                            users)
                          </span>
                          <Pagination
                            showControls
                            classNames={{
                              wrapper: "gap-1",
                              item: "min-w-7 h-7 text-[10px] bg-white border border-gray-200",
                              cursor: "bg-[#0ea5e9] text-white",
                            }}
                            page={userPage}
                            size="sm"
                            total={usersData.pagination.total_pages}
                            onChange={setUserPage}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
