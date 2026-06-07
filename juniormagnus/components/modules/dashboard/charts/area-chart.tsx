"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import type { Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";
import { formatLocaleInteger } from "@/i18n/localeFormat";
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
  const { locale } = useI18n();
  const loc = (locale === "ar" ? "ar" : "en") as Locale;
  const maxDataValue = useMemo(() => Math.max(0, ...data), [data]);
  const yAxisMax = useMemo(() => {
    if (maxDataValue <= 1) return 2;
    if (maxDataValue <= 5) return maxDataValue + 1;

    return Math.ceil(maxDataValue * 1.25);
  }, [maxDataValue]);
  const yAxisTickAmount = useMemo(() => {
    if (yAxisMax <= 5) return yAxisMax;
    if (yAxisMax <= 10) return 5;

    return 6;
  }, [yAxisMax]);

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
      markers: {
        size: 6,
        colors: ["#4BA6FF"],
        strokeColors: "#FFFFFF",
        strokeWidth: 2,
        hover: {
          size: 6,
        },
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
        max: yAxisMax,
        tickAmount: yAxisTickAmount,
        decimalsInFloat: 0,
        labels: {
          formatter: (val: number) => formatLocaleInteger(loc, Math.round(val)),
          style: { colors: "#9CA3AF", fontSize: "12px" },
        },
      },
      tooltip: {
        theme: "light" as const,
        style: { fontSize: "12px" },
        y: {
          formatter: (val: number) => `${formatLocaleInteger(loc, Math.round(val))} ${yLabel}`,
        },
      },
      colors: ["#4BA6FF"],
    }),
    [labels, seriesName, yLabel, data, yAxisMax, yAxisTickAmount, loc]
  );

  const series = [
    {
      name: seriesName,
      data,
    },
  ];

  return <Chart height={300} options={chartOptions} series={series} type="area" />;
};
