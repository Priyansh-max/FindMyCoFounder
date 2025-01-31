import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";

ChartJS.register(ArcElement, Tooltip);

const CircularProgress = ({ total, accepted, pending, rejected }) => {
  const data = {
    datasets: [
      {
        data: [accepted, pending, rejected], // Values for the sections
        backgroundColor: ["#2ecc71", "#f1c40f", "#e74c3c"], // Green, Yellow, Red
        borderWidth: 0,
        hoverOffset: 4,
        cutout: "75%", // Creates the hollow effect
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false }, // Hide default legend
      tooltip: { enabled: true }, // Show tooltips on hover
    },
  };

  return (
    <div className="mt-2 ml-4 relative w-48 h-48">
      {/* Chart */}
      <Doughnut data={data} options={options} />

      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{total}</span>
        <span className="text-sm text-gray-500">Applications</span>
      </div>
    </div>
  );
};

export default CircularProgress;
