"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface AreaChartProps {
  data?: number[];
  labels?: string[];
}

export const AreaChart = ({
  data = [22, 18, 25, 20, 30, 26],
  labels = ["7 June", "8 June", "9 June", "10 June", "11 June", "12 June"],
}: AreaChartProps) => {
  const chartOptions = useMemo(
    () => ({
      chart: {
        type: "area" as const,
        height: 300,
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      stroke: {
        curve: "smooth" as const,
        width: 3,
        colors: ["#4BA6FF"],
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.05,
          stops: [0, 100],
          colorStops: [
            {
              offset: 0,
              color: "#4BA6FF",
              opacity: 0.4,
            },
            {
              offset: 100,
              color: "#CFE2FF",
              opacity: 0.1,
            },
          ],
        },
      },
      grid: {
        borderColor: "#E5E7EB",
        strokeDashArray: 4,
        padding: { left: 10, right: 10 },
      },
      dataLabels: { enabled: false },
      series: [
        {
          name: "Campaign A",
          data,
        },
      ],
      xaxis: {
        categories: labels,
        labels: {
          style: {
            colors: "#9CA3AF",
            fontSize: "12px",
          },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        min: 0,
        max: 40,
        tickAmount: 4,
        labels: {
          style: { colors: "#9CA3AF", fontSize: "12px" },
        },
      },
      tooltip: {
        theme: "light",
        style: { fontSize: "12px" },
        y: {
          formatter: (val: number) => `${val} Topics`,
        },
      },
      colors: ["#4BA6FF"],
    }),
    [labels],
  );

  const series = [
    {
      name: "Campaign A",
      data,
    },
  ];

  return (
    <Chart height={300} options={chartOptions} series={series} type="area" />
  );
};
