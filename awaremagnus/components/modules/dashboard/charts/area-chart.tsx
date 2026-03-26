"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import { useTranslations } from "@/i18n/useTranslations";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface AreaChartProps {
  data?: number[];
  labels?: string[];
  seriesName?: string;
  yLabel?: string;
}

export const AreaChart = ({
  data = [],
  labels = [],
  seriesName = "Campaign A",
  yLabel = "Topics",
}: AreaChartProps) => {
  const t = useTranslations("dashboard");

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        {t("cards.noCompletionData")}
      </div>
    );
  }

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
          name: seriesName,
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
          formatter: (val: number) => `${val} ${yLabel}`,
        },
      },
      colors: ["#4BA6FF"],
    }),
    [labels, seriesName, yLabel]
  );

  const series = [
    {
      name: seriesName,
      data,
    },
  ];

  return <Chart height={300} options={chartOptions} series={series} type="area" />;
};
