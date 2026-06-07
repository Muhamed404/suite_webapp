"use client";

import { Spinner } from "@heroui/spinner";
import { useQuery } from "@tanstack/react-query";
import Chart from "react-apexcharts";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { DashboardAboutWidget } from "@/components/modules/dashboard/dashboard-about-widget";
import { DashboardSummaryCards } from "@/components/modules/dashboard/dashboard-summary-cards";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useTranslations } from "@/i18n/useTranslations";
import { jnrClient, API_BASE } from "@/services/httpClient";
import { normalizeJnrResponse, type JnrResponseBody } from "@/services/jnrResponse";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const orgId = useAuthStore((s) => s.user?.org_id ?? s.user?.organization_id);

  const { data: orgDashboard, isLoading } = useQuery({
    queryKey: ["jnr-dashboard-org", orgId],
    queryFn: async () => {
      const { data } = await jnrClient.get<JnrResponseBody>(`${API_BASE}/dashboard/organizations`);
      const n = normalizeJnrResponse<{ data: Array<Record<string, unknown>> }>(data);
      if (!n.success) throw new Error(n.message);
      const rows =
        (n.data as { data?: Array<Record<string, unknown>> })?.data ??
        (n.data as unknown as Array<Record<string, unknown>>);
      return Array.isArray(rows) ? rows[0] : rows;
    },
    enabled: !!orgId,
  });

  const { data: monthly } = useQuery({
    queryKey: ["jnr-dashboard-monthly", orgId],
    queryFn: async () => {
      const { data } = await jnrClient.get<JnrResponseBody>(
        `${API_BASE}/dashboard/organizations/monthly-completion`
      );
      const n = normalizeJnrResponse<{ series: { month: string; modules_completed: number }[] }>(
        data
      );
      if (!n.success) throw new Error(n.message);
      return n.data;
    },
    enabled: !!orgId,
  });

  const chartSeries = [
    {
      name: t("charts.modulesCompleted"),
      data: (monthly?.series ?? []).map((p) => p.modules_completed),
    },
  ];
  const chartCategories = (monthly?.series ?? []).map((p) => p.month);

  const childrenEnrolled = Number(orgDashboard?.total_children_profiles ?? 0);
  const totalParents = Number(orgDashboard?.total_families_registered ?? 0);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex flex-col gap-4 p-3">
          <h1 className="text-lg font-bold text-[var(--mainblue)] md:text-xl">
            {t("welcome.title")}
          </h1>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <DashboardSummaryCards
              childrenEnrolled={childrenEnrolled}
              totalParents={totalParents}
            />
          )}

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-8">
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-[var(--mainblue)]">
                  {t("charts.modulesCompletedByChildren")}
                </h2>
                <Chart
                  height={320}
                  options={{
                    chart: { toolbar: { show: false } },
                    xaxis: { categories: chartCategories },
                    stroke: { curve: "smooth", width: 2 },
                    fill: {
                      type: "gradient",
                      gradient: {
                        shadeIntensity: 1,
                        opacityFrom: 0.35,
                        opacityTo: 0.05,
                      },
                    },
                    colors: ["#FF6B35"],
                    grid: { borderColor: "#E5E7EB" },
                  }}
                  series={chartSeries}
                  type="area"
                />
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 lg:flex">
              <DashboardAboutWidget />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
