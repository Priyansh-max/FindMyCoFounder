import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";
import { useTheme } from '@/context/ThemeContext';

ChartJS.register(ArcElement, Tooltip);

const CircularProgress = ({ total, accepted, pending, rejected, content }) => {
  const { theme } = useTheme();
  const isZero = total === 0;

  // Define colors for light and dark themes
  const colors = {
    light: {
      empty: "#e5e7eb",
      accepted: "#22c55e", // green-500
      pending: "#eab308", // yellow-500
      rejected: "#ef4444", // red-500
    },
    dark: {
      empty: "#374151", // gray-700
      accepted: "#15803d", // green-700
      pending: "#a16207", // yellow-700
      rejected: "#b91c1c", // red-700
    },
  };

  const currentColors = colors[theme || 'light'];

  const data = {
    datasets: [
      {
        data: isZero ? [1] : [accepted, pending, rejected],
        backgroundColor: isZero 
          ? [currentColors.empty] 
          : [currentColors.accepted, currentColors.pending, currentColors.rejected],
        borderWidth: 0,
        hoverOffset: 4,
        cutout: "85%",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    events: [],
  };

  return (
    <div className="relative w-32 h-32 sm:w-56 sm:h-56">
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl sm:text-3xl font-bold text-foreground">{total}</span>
        <div className="text-sm sm:text-md text-muted-foreground max-w-[80%] break-words whitespace-pre-line">
          {content}
        </div>
      </div>
    </div>
  );
};

export default CircularProgress;
