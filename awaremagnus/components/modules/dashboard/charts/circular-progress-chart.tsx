"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface CircularProgressChartProps {
  value: number;
  color: string;
  size?: number;
  /** Radial center label; receives chart value (0–100). Default: `${val}%`. */
  formatRadialValue?: (val: number) => string;
}

export const CircularProgressChart = ({
  value,
  color,
  size = 128,
  formatRadialValue,
}: CircularProgressChartProps) => {
  const chartOptions = useMemo(
    () => ({
      chart: {
        type: "radialBar" as const,
        height: size,
      },
      plotOptions: {
        radialBar: {
          hollow: {
            size: "60%",
          },
          dataLabels: {
            name: {
              show: false,
            },
            value: {
              show: true,
              fontSize: "14px",
              fontWeight: 500,
              color: "#474646",
              formatter: (val: number) => (formatRadialValue ? formatRadialValue(val) : `${val}%`),
              offsetY: 8,
            },
          },
          track: {
            background: "#F1F5F8",
          },
        },
      },
      fill: {
        colors: [color],
      },
      stroke: {
        lineCap: "round" as const,
      },
      labels: [""],
    }),
    [color, size, formatRadialValue]
  );

  const series = [value];

  return <Chart height={size} options={chartOptions} series={series} type="radialBar" />;
};
