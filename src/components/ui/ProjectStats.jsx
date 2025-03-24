import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';

const ProjectStats = ({ stats }) => {
  // For client-side rendering only
  const [mounted, setMounted] = useState(false);

  // Example data structure for project completion ratings
  const projectRatings = [
    { project: "Starting Point", rating: 0, totalRating: 0, date: "2024-01-01" },
    { project: "Project A", rating: 150, totalRating: 150, date: "2024-01-15" },
    { project: "Project B", rating: 280, totalRating: 430, date: "2024-02-01" },
    { project: "Project C", rating: 420, totalRating: 850, date: "2024-02-15" },
    { project: "Project D", rating: 520, totalRating: 1370, date: "2024-03-01" },
    { project: "Project E", rating: -620, totalRating: 750, date: "2024-03-01" },
    { project: "Project F", rating: 1000, totalRating: 1200, date: "2024-03-01" },

  ];

  // Setup client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prepare data for ApexCharts
  const series = [{
    name: 'Project Rating',
    data: projectRatings.map(point => point.totalRating)
  }];

  // ApexCharts options
  const options = {
    chart: {
      type: 'line',
      height: 140,
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      },
      background: 'transparent',
      fontFamily: 'inherit',
    },
    colors: ['#3B82F6'], // Primary blue
    stroke: {
      width: 2,
      curve: 'straight',
    },
    markers: {
      size: 5,
      colors: ['#3B82F6'], // Primary blue
      strokeWidth: 0,
    },
    grid: {
      show: false,
    },
    tooltip: {
      enabled: true,
      theme: 'dark',
      custom: ({ series, seriesIndex, dataPointIndex }) => {
        const point = projectRatings[dataPointIndex];
        const previousRating = dataPointIndex > 0 ? projectRatings[dataPointIndex - 1].totalRating : 0;
        const ratingGained = dataPointIndex === 0 ? point.rating : point.totalRating - previousRating;
        const isNegative = ratingGained < 0;
        const textColorClass = isNegative ? 'text-red-400' : 'text-emerald-400';
        const sign = isNegative ? '' : '+'; // Only add plus sign for positive values
        
        return `<div class="p-2 bg-[#1E293B] rounded text-white">
          <div class="font-medium">${point.project}</div>
          <div class="text-sm text-gray-300">Total: ${point.totalRating} pts</div>
          <div class="text-xs font-medium ${textColorClass}">${sign}${ratingGained} pts ${isNegative ? 'lost' : 'gained'}</div>
        </div>`;
      }
    },
    xaxis: {
      categories: projectRatings.map(point => point.project),
      labels: {
        show: false,
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        show: false
      }
    },
    dataLabels: {
      enabled: false,
    },
    // Add an annotation for Project C (850 points)
    annotations: {
      points: [{
        x: 'Project C',
        y: 850,
        marker: {
          size: 0
        },
        label: {
          text: '850',
          offsetY: -15,
          borderWidth: 0,
          borderRadius: 4,
          style: {
            background: '#1E293B',
            color: '#fff',
            padding: {
              left: 10,
              right: 10,
              top: 5,
              bottom: 5
            },
            fontSize: '14px'
          }
        }
      }]
    }
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm">
      {/* Header with Project Rating */}
      <div className="mb-6">
        <h3 className="text-[13px] font-medium text-muted-foreground">Project Rating</h3>
        <p className="text-[32px] font-bold">{projectRatings[projectRatings.length - 1].totalRating}</p>
      </div>

      {/* Rating Progress Graph */}
      <div className="relative" style={{ height: '140px' }}>
        {mounted && (
          <ReactApexChart
            options={options}
            series={series}
            type="line"
            height="100%"
            width="100%"
          />
        )}
      </div>
    </div>
  );
};

export default ProjectStats; 