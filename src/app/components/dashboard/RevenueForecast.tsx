"use client";
import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import type { RevenueChartPoint } from "@/types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const RevenueForecast = ({ data }: { data: RevenueChartPoint[] }) => {
  const optionsBarChart: ApexOptions = {
    chart: {
      offsetX: 0,
      offsetY: 10,
      stacked: true,
      animations: { speed: 500 },
      toolbar: { show: false },
    },
    colors: ["var(--color-primary)"],
    dataLabels: { enabled: false },
    grid: {
      show: true,
      borderColor: "#90A4AE50",
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } },
    },
    stroke: { curve: "smooth", width: 2 },
    plotOptions: {
      bar: {
        horizontal: false,
        barHeight: "60%",
        columnWidth: "40%",
        borderRadius: 5,
        borderRadiusApplication: "end",
        borderRadiusWhenStacked: "all",
      },
    },
    xaxis: {
      categories: data.map((d) => d.month),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: { show: false },
    tooltip: { theme: "dark" },
  };

  const series = [{ name: "Revenue", data: data.map((d) => d.revenue) }];

  return (
    <div className="rounded-xl shadow-xs bg-white dark:bg-darkgray p-6 relative w-full words-break">
      <div className="flex justify-between items-center">
        <h5 className="card-title">Revenue Forecast</h5>
        <p className="text-sm text-darklink">Last 6 months</p>
      </div>

      <div className="-ms-4 -me-3 mt-2">
        <Chart
          options={optionsBarChart}
          series={series}
          type="bar"
          height="315px"
          width="100%"
        />
      </div>
    </div>
  );
};

export default RevenueForecast;
