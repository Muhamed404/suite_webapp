"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface DonutChartProps {
  values: number[];
  colors: string[];
  labels: string[];
  centerLabel?: string;
  height?: number;
  formatTooltipValue?: (val: number) => string;
}

export const DonutChart = ({
  values,
  colors,
  labels,
  centerLabel = "",
  height = 200,
  formatTooltipValue,
}: DonutChartProps) => {
  const chartOptions = useMemo(
    () => ({
      chart: {
        type: "donut" as const,
        height,
      },
      plotOptions: {
        pie: {
          donut: {
            size: "65%",
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: "12px",
                fontWeight: 600,
                color: "#374151",
                offsetY: -4,
              },
              value: {
                show: false,
              },
              total: {
                show: true,
                showAlways: true,
                label: centerLabel,
                fontSize: "11px",
                fontWeight: 600,
                color: "#6B7280",
              },
            },
          },
        },
      },
      labels,
      colors,
      legend: {
        show: false,
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: 2,
        colors: ["#fff"],
      },
      tooltip: {
        y: {
          formatter: (val: number) => (formatTooltipValue ? formatTooltipValue(val) : `${val}`),
        },
      },
    }),
    [colors, labels, centerLabel, height, formatTooltipValue]
  );

  return <Chart height={height} options={chartOptions} series={values} type="donut" />;
};
