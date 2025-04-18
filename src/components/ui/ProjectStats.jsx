import React, { useState, useEffect, useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';

const ProjectStats = ({ stats }) => {
  // For client-side rendering only
  const [mounted, setMounted] = useState(false);

  // Prepare the project ratings data - add a starting point and use the data from stats
  const projectRatings = useMemo(() => {
    // Create a starting point entry
    const startingPoint = { project: "Starting Point", rating: 0, totalRating: 0, date: stats.ratings[0]?.date ? new Date(new Date(stats.ratings[0].date).getTime() - 86400000).toISOString().split('T')[0] : "2024-01-01" };
    
    //no we dont need to sort get the data as it is already sorted
    const sortedRatings = stats.ratings;
    
    // Return the combined array with the starting point first
    return [startingPoint, ...sortedRatings];
  }, [stats.ratings]);

  // Setup client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Add global CSS to fix tooltip styling
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.innerHTML = `
        .apexcharts-tooltip {
          overflow: visible !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
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
        if (point.project === "Starting Point") return '';
        
        const previousRating = dataPointIndex > 0 ? projectRatings[dataPointIndex - 1].totalRating : 0;
        const ratingGained = dataPointIndex === 0 ? point.rating : point.totalRating - previousRating;
        const isNegative = ratingGained < 0;
        
        // Format date to "Jan 06, 2024" style
        let formattedDate = '';
        if (point.date) {
          const date = new Date(point.date);
          formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: '2-digit', 
            year: 'numeric' 
          });
        }
        
        return `
          <div style="position: relative; margin-bottom: 20px;">
            <div style="background: #0F172A; color: white; border-radius: 4px; padding: 10px 15px; min-width: 200px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <div style="font-size: 12px; color: #94A3B8;">${formattedDate}</div>
              </div>
              <div style="font-size: 14px; font-weight: 500; margin-bottom: 6px; color: white;">${point.project || 'undefined'}</div>
              <div style="display: flex; font-size: 12px;">
                <div style="margin-right: 16px;">
                  <span style="color: #94A3B8; margin-right: 4px;">Rating</span>
                  <span style="color: ${isNegative ? '#EF4444' : '#10B981'};">
                    ${isNegative ? '' : '+'}${ratingGained}
                  </span>
                </div>
                <div>
                  <span style="color: #94A3B8; margin-right: 4px;">Role</span>
                  <span style="color: #3B82F6;">
                    ${point.role ? point.role.charAt(0).toUpperCase() + point.role.slice(1) : 'Contributor'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        `;
      },
      fixed: {
        enabled: false
      },
      marker: {
        show: true
      },
      style: {
        fontSize: '12px',
        fontFamily: 'inherit'
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
    // Remove annotations to get rid of the "225" number
    annotations: {
      points: []
    }
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg border border-border p-4 sm:p-6 shadow-sm">
      {/* Header with Project Rating and Role */}
      <div className="mb-4 sm:mb-6">
        <h3 className="text-[13px] font-medium text-muted-foreground">Project Rating</h3>
        <div className="flex items-center">
          <p className="text-2xl sm:text-[32px] font-bold">
            {projectRatings.length > 1 ? projectRatings[projectRatings.length - 1].totalRating : 0}
          </p>
        </div>
      </div>

      {/* Rating Progress Graph */}
      <div className="relative h-[100px] sm:h-[140px]">
        {mounted && projectRatings.length > 1 ? (
          <ReactApexChart
            options={options}
            series={series}
            type="line"
            height="100%"
            width="100%"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">No project data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectStats; 