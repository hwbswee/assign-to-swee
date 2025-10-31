import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { monthLabels } from '../data/clinicians';

// Color palette for different clinicians (muted colors)
const colors = [
  '#7fa3c9', // blue
  '#8b97a8', // gray-blue
  '#73c6b6', // teal
  '#b4a5a5', // gray-pink
  '#8b9dc3', // light blue
  '#9d8b97', // mauve
  '#7f8b9d', // slate
  '#97a58b', // sage
  '#c69d7f', // tan
  '#a5b4a5', // mint
  '#8b7f9d', // purple-gray
];

const WorkloadGraph = ({ clinicians }) => {
  // Transform data for recharts
  const chartData = monthLabels.map((month, index) => {
    const dataPoint = { month };
    clinicians.forEach((clinician) => {
      const displayName = clinician.fullName || clinician.name;
      dataPoint[displayName] = clinician.monthlyHours2025[index];
    });
    return dataPoint;
  });

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label} 2025</p>
          {payload
            .sort((a, b) => b.value - a.value)
            .map((entry, index) => (
              <p key={index} style={{ color: entry.color }}>
                {entry.name}: {entry.value.toFixed(1)}h
              </p>
            ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="workload-graph">
      <div className="graph-header">
        <h2 className="graph-title">2025 Monthly Hours Trend</h2>
        <p className="graph-subtitle">Clinical hours per clinician by month</p>
      </div>
      <div className="graph-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e1e4e8" />
            <XAxis
              dataKey="month"
              stroke="#636e72"
              style={{ fontSize: '0.875rem' }}
            />
            <YAxis
              stroke="#636e72"
              style={{ fontSize: '0.875rem' }}
              label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fill: '#636e72' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '0.875rem' }}
              iconType="line"
            />
            {clinicians.map((clinician, index) => {
              const displayName = clinician.fullName || clinician.name;
              return (
                <Line
                  key={displayName}
                  type="monotone"
                  dataKey={displayName}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WorkloadGraph;
