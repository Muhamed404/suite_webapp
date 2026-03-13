"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface CircularProgressChartProps {
  value: number;
  color: string;
  size?: number;
}

export const CircularProgressChart = ({ value, color, size = 128 }: CircularProgressChartProps) => {
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
              formatter: (val: number) => `${val}%`,
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
    [color, size]
  );

  const series = [value];

  return <Chart height={size} options={chartOptions} series={series} type="radialBar" />;
};
