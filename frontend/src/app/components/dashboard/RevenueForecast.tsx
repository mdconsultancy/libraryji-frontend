"use client";
import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RevenueChartPoint } from "@/types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const RANGE_OPTIONS = [
  { label: "Last 3 months", value: "3" },
  { label: "Last 6 months", value: "6" },
  { label: "Last 12 months", value: "12" },
];

interface RevenueForecastProps {
  data: RevenueChartPoint[];
  months: number;
  onMonthsChange: (months: number) => void;
}

const RevenueForecast = ({ data, months, onMonthsChange }: RevenueForecastProps) => {
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
        <Select value={String(months)} onValueChange={(v) => onMonthsChange(Number(v))}>
          <SelectTrigger className="h-8 w-[150px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
