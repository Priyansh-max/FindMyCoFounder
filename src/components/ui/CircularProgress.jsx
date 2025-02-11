import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";

ChartJS.register(ArcElement, Tooltip);

const CircularProgress = ({ total, accepted, pending, rejected, content }) => {
  const isZero = total === 0;

  const data = {
    datasets: [
      {
        data: isZero ? [1] : [accepted, pending, rejected],
        backgroundColor: isZero ? ["#e5e7eb"] : ["#2ecc71", "#f1c40f", "#e74c3c"],
        borderWidth: 0,
        hoverOffset: 4,
        cutout: "84%",
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
        enabled: false, // Disable default tooltips
      },
    },
    events: [], // Disable all events
  };

  return (
    <div className="relative w-32 h-32 sm:w-56 sm:h-56"> 
      {/* Adjust chart size on small screens */}
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl sm:text-3xl font-bold">{total}</span> 
        {/* Decrease font size on small screens */}
        <div className="text-sm sm:text-md text-gray-500 max-w-[80%] break-words whitespace-pre-line">
          {content}
        </div>
      </div>
    </div>
  );
};

export default CircularProgress;
