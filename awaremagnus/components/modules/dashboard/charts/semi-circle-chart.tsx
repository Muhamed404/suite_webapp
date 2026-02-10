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
}

export const SemiCircleChart = ({
  sent,
  opened,
  admin,
  color1,
  color2,
  color3,
}: SemiCircleChartProps) => {
  const total = sent + opened + admin;
  const sentPercent = (sent / total) * 100;
  const openedPercent = (opened / total) * 100;
  const adminPercent = (admin / total) * 100;

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
      labels: ["Sent", "Opened", "Admin"],
      colors: [color1, color2, color3],
      legend: {
        show: true,
        position: "bottom" as const,
        formatter: function (seriesName: string, opts: any) {
          const _value = opts.w.globals.series[opts.seriesIndex];
          const label =
            seriesName === "Sent"
              ? `Sent (${sent})`
              : seriesName === "Opened"
                ? `Opened (${opened})`
                : `Admin (${admin})`;

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
    [sent, opened, admin, color1, color2, color3]
  );

  const series = [sentPercent, openedPercent, adminPercent];

  return <Chart height={200} options={chartOptions} series={series} type="donut" />;
};
