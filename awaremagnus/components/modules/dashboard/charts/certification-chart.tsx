"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface CertificationChartProps {
  value: number;
  color: string;
  color2: string;
}

export const CertificationChart = ({
  value = 50,
  color = "#3ACE89",
  color2 = "#FB5050",
}: CertificationChartProps) => {
  const chartOptions = useMemo(
    () => ({
      chart: {
        type: "radialBar" as const,
        height: 240,
      },
      plotOptions: {
        radialBar: {
          hollow: {
            size: "70%",
          },
          dataLabels: {
            name: {
              show: false,
            },
            value: {
              show: true,
              fontSize: "28px",
              fontWeight: 200,
              color: "#192030",
              formatter: (val: number) => `${val}%`,
              offsetY: 0,
            },
            total: {
              show: false,
            },
          },
          track: {
            background: "#F1F5F8",
          },
        },
      },
      fill: {
        type: "gradient",
        gradient: {
          shade: "light",
          type: "horizontal",
          shadeIntensity: 0.5,
          gradientToColors: [color, color2],
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100],
        },
      },
      stroke: {
        lineCap: "round" as const,
      },
      labels: [""],
    }),
    [color, color2]
  );

  const series = [value];

  return <Chart height={240} options={chartOptions} series={series} type="radialBar" />;
};
