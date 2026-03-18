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
          const label = `${labels[opts.seriesIndex]} (${value.toFixed(2)})`;

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
          formatter: (val: number) => `${val.toFixed(1)}%`,
        },
      },
    }),
    [sent, opened, admin, color1, color2, color3, labels]
  );

  const series = [sentPercent, openedPercent, adminPercent];

  return <Chart options={chartOptions} series={series} type="donut" />;
};
