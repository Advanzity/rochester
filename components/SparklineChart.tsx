"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartOptions,
  ScriptableContext,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler);

interface SparklineChartProps {
  data: number[];
  accentColor: string; // e.g. "#f97316"
}

// tiny helper to make soft alpha variants of the accent color
function hexToRgba(hex: string, alpha: number) {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return hex; // fall back if it's not hex

  const r = parseInt(match[1], 16);
  const g = parseInt(match[2], 16);
  const b = parseInt(match[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function SparklineChart({ data, accentColor }: SparklineChartProps) {
  const chartData = {
    labels: data.map((_, i) => i.toString()),
    datasets: [
      {
        data,
        borderColor: accentColor,
        borderWidth: 2,
        borderCapStyle: "round" as const,
        borderJoinStyle: "round" as const,
        tension: 0.45,
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: "start",
        backgroundColor: (context: ScriptableContext<"line">) => {
          const { chart } = context;
          const { ctx, chartArea } = chart;

          if (!chartArea) return "rgba(0, 0, 0, 0)";

          const gradient = ctx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom
          );

          // strong near the line, then quickly fade out
          gradient.addColorStop(0, hexToRgba(accentColor, 0.35));
          gradient.addColorStop(0.4, hexToRgba(accentColor, 0.18));
          gradient.addColorStop(1, hexToRgba(accentColor, 0));

          return gradient;
        },
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    interaction: {
      mode: "nearest",
      intersect: false,
    },
  };

  return (
    <div className="h-16 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}
