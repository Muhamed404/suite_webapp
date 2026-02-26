"use client";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useI18n } from "@/i18n/I18nProvider";
import { DonutChart } from "@/components/modules/dashboard/charts/donut-chart";
import { AreaChart } from "@/components/modules/dashboard/charts/area-chart";
import { SemiCircleChart } from "@/components/modules/dashboard/charts/semi-circle-chart";
import clsx from "clsx";

// ── Legend item helper ──────────────────────────────────────────
function LegendDot({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-gray-600">{label}</span>
        </div>
    );
}

// ── Stat card helper ────────────────────────────────────────────
function StatCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-2xl p-5">
            <p className="text-gray-600 text-sm">{label}</p>
            <div className="flex justify-between items-center mt-2">
                <h3 className="text-3xl font-semibold">{value}</h3>
                <div className="rounded-full">{icon}</div>
            </div>
        </div>
    );
}

// ── Main page component ─────────────────────────────────────────
export function SurveyStatsPage() {
    const { dir } = useI18n();
    const isRtl = dir === "rtl";

    // Shared chart data
    const donutColors = ["#FFA657", "#FFD57E", "#B18AEC", "#7C8DFF"];
    const donutLabels = ["Department A", "Department", "Department C", "Department B"];

    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className={clsx("p-3", isRtl && "text-right")}>
                    {/* ─── Heading ──────────────────────────────────────── */}
                    <h2 className="text-xl font-semibold mb-6">Survey Statistics</h2>

                    {/* ─── Stats Row ────────────────────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                        <StatCard
                            label="Total Survey Sent"
                            value={50}
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" viewBox="0 0 48 48">
                                    <circle cx="24" cy="24" r="20" fill="#FEF3C7" />
                                    <path d="M24 14v10l6 4" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                                </svg>
                            }
                        />
                        <StatCard
                            label="Submitted Survey"
                            value={20}
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" viewBox="0 0 48 48">
                                    <circle cx="24" cy="24" r="20" fill="#DBEAFE" />
                                    <path d="M12 22l12-6 12 6-12 6z" fill="#3B82F6" />
                                    <path d="M18 25v6l6 3 6-3v-6" stroke="#3B82F6" strokeWidth="2" fill="none" />
                                </svg>
                            }
                        />
                        <StatCard
                            label="Surveys Completed"
                            value={18}
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" viewBox="0 0 48 48">
                                    <circle cx="24" cy="24" r="20" fill="#D1FAE5" />
                                    <path d="M24 14v10l6 4" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                                </svg>
                            }
                        />
                        <StatCard
                            label="Response Rate"
                            value="36%"
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" viewBox="0 0 48 48">
                                    <circle cx="24" cy="24" r="20" fill="#FEE2E2" />
                                    <path d="M12 22l12-6 12 6-12 6z" fill="#EF4444" />
                                    <path d="M18 25v6l6 3 6-3v-6" stroke="#EF4444" strokeWidth="2" fill="none" />
                                </svg>
                            }
                        />
                    </div>

                    {/* ─── Chart Row – 3 Donut Charts ───────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {/* Donut 1 – Response Rate Of Department */}
                        <div className="bg-white rounded-3xl p-6">
                            <p className="font-medium mb-4">Response Rate Of Department</p>
                            <div className="flex">
                                <div className="flex justify-center items-center">
                                    <DonutChart
                                        values={[6, 4, 3, 3]}
                                        colors={donutColors}
                                        labels={donutLabels}
                                        centerLabel="Department A"
                                        height={192}
                                    />
                                </div>
                                <div className="text-[10px] text-gray-600 space-y-2 flex flex-col justify-center">
                                    <LegendDot color="#FFA657" label="Department A" />
                                    <LegendDot color="#FFD57E" label="Department" />
                                    <LegendDot color="#B18AEC" label="Department C" />
                                    <LegendDot color="#7C8DFF" label="Department B" />
                                </div>
                            </div>
                        </div>

                        {/* Donut 2 – Response Rate Of Group */}
                        <div className="bg-white rounded-3xl p-6">
                            <p className="font-medium mb-4">Response Rate Of Group</p>
                            <div className="flex">
                                <div className="flex justify-center items-center">
                                    <DonutChart
                                        values={[5, 3, 4, 2]}
                                        colors={donutColors}
                                        labels={donutLabels}
                                        centerLabel="Group A"
                                        height={192}
                                    />
                                </div>
                                <div className="text-[10px] text-gray-600 space-y-2 flex flex-col justify-center">
                                    <LegendDot color="#FFA657" label="Department A" />
                                    <LegendDot color="#FFD57E" label="Department" />
                                    <LegendDot color="#B18AEC" label="Department C" />
                                    <LegendDot color="#7C8DFF" label="Department B" />
                                </div>
                            </div>
                        </div>

                        {/* Donut 3 – Response Rate */}
                        <div className="bg-white rounded-3xl p-6">
                            <p className="font-medium mb-4">Response Rate</p>
                            <div className="flex">
                                <div className="flex justify-center items-center">
                                    <DonutChart
                                        values={[9, 4, 2, 1]}
                                        colors={donutColors}
                                        labels={donutLabels}
                                        centerLabel="Dept A"
                                        height={192}
                                    />
                                </div>
                                <div className="text-[10px] text-gray-600 space-y-2 flex flex-col justify-center">
                                    <LegendDot color="#FFA657" label="Department A" />
                                    <LegendDot color="#FFD57E" label="Department" />
                                    <LegendDot color="#B18AEC" label="Department C" />
                                    <LegendDot color="#7C8DFF" label="Department B" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── Question Analysis Section ─────────────────────── */}
                    <div className="py-2 mt-2">
                        <h2 className="text-xl font-semibold mb-2">Question Analysis</h2>

                        <div className="grid grid-cols-12 gap-2">
                            {/* Area Chart – col-span-8 */}
                            <div className="bg-white rounded-3xl col-span-12 lg:col-span-8 p-6">
                                <div className="flex justify-between mb-6">
                                    <div>
                                        <p className="font-medium">Security Awareness Campaign</p>
                                        <p className="text-gray-400 text-sm">Last Campaign Date: 1/23/05</p>
                                    </div>
                                    <span className="text-sm text-blue-500 cursor-pointer hover:underline">
                                        View All
                                    </span>
                                </div>
                                <div className="h-72">
                                    <AreaChart
                                        data={[22, 18, 25, 20, 30, 26]}
                                        labels={["7 June", "8 June", "9 June", "10 June", "11 June", "12 June"]}
                                        seriesName="Campaign A"
                                        yLabel="Topics"
                                    />
                                </div>
                            </div>

                            {/* Semi Donut – col-span-4 */}
                            <div className="bg-white rounded-3xl col-span-12 lg:col-span-4 p-6 flex flex-col items-center">
                                <p className="font-medium mb-6">Employee Risk Rates</p>
                                <div className="w-72 h-72 flex items-center justify-center">
                                    <SemiCircleChart
                                        sent={120}
                                        opened={90}
                                        admin={30}
                                        color1="#3ACE89"
                                        color2="#BEC3C7"
                                        color3="#FB5050"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
