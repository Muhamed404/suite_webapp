"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface SemiCircleChartProps {
  sent: number;
  opened: number;
  admin: number;
  color1: string;
  color2: string;
  color3: string;
  labels?: string[];
  showLegend?: boolean;
  hideZeroLegendEntries?: boolean;
  showLowRiskCounter?: boolean;
  lowRiskCounterLabel?: string;
  /** Legend segment share (0–100); default uses `toFixed(2)`. */
  formatLegendPercent?: (value: number) => string;
  /** Tooltip share (0–100); default uses one decimal + % */
  formatTooltipPercent?: (value: number) => string;
  /** Count beside low-risk label; default raw number */
  formatCount?: (value: number) => string;
}

export const SemiCircleChart = ({
  sent,
  opened,
  admin,
  color1,
  color2,
  color3,
  labels = ["Sent", "Opened", "Admin"],
  showLegend = true,
  hideZeroLegendEntries = false,
  showLowRiskCounter = false,
  lowRiskCounterLabel = "Low risk employees",
  formatLegendPercent,
  formatTooltipPercent,
  formatCount,
}: SemiCircleChartProps) => {
  const total = sent + opened + admin;
  const sentPercent = total === 0 ? 0 : (sent / total) * 100;
  const openedPercent = total === 0 ? 0 : (opened / total) * 100;
  const adminPercent = total === 0 ? 0 : (admin / total) * 100;

  const chartOptions = useMemo(
    () => ({
      chart: {
        type: "donut" as const,
        height: 200,
      },
      plotOptions: {
        pie: {
          donut: {
            size: "70%",
            labels: {
              show: !showLowRiskCounter,
            },
          },
          startAngle: -90,
          endAngle: 90,
        },
      },
      labels: labels,
      colors: [color1, color2, color3],
      legend: {
        show: showLegend,
        position: "bottom" as const,
        formatter: function (seriesName: string, opts: any) {
          const value = opts.w.globals.series[opts.seriesIndex];
          const pct = formatLegendPercent ? formatLegendPercent(value) : value.toFixed(2);
          const label = `${labels[opts.seriesIndex]} (${pct})`;

          if (hideZeroLegendEntries && value === 0) {
            return "";
          }

          return label;
        },
      },
      dataLabels: {
        enabled: false,
      },
      tooltip: {
        y: {
          formatter: (val: number) =>
            formatTooltipPercent ? formatTooltipPercent(val) : `${val.toFixed(1)}%`,
        },
      },
    }),
    [
      sent,
      opened,
      admin,
      color1,
      color2,
      color3,
      labels,
      showLowRiskCounter,
      formatLegendPercent,
      formatTooltipPercent,
    ]
  );

  const series = [sentPercent, openedPercent, adminPercent];

  return (
    <div className="w-full flex flex-col items-center">
      {showLowRiskCounter && (
        <p className="text-sm font-medium text-gray-700 mb-2">
          {lowRiskCounterLabel}: {formatCount ? formatCount(sent) : sent}
        </p>
      )}
      <Chart options={chartOptions} series={series} type="donut" />
    </div>
  );
};
