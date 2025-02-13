// packages/advanced-agent/src/image-processor/visualization/components.tsx

import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceDot } from 'recharts';

export const AnalysisResultVisualization = ({ 
  results, 
  imageData 
}: { 
  results: any; 
  imageData: string;
}) => {
  return (
    <div className="w-full space-y-4">
      {/* Original Image with Overlays */}
      <div className="relative">
        <img 
          src={`data:image/jpeg;base64,${imageData}`} 
          alt="Original" 
          className="w-full h-auto"
        />
        {results.boxes && (
          <DetectionOverlay boxes={results.boxes} />
        )}
        {results.segments && (
          <SegmentationOverlay segments={results.segments} />
        )}
      </div>

      {/* Confidence Scores */}
      <div className="h-48">
        <ConfidenceChart data={results.confidenceScores} />
      </div>

      {/* Results Table */}
      <ResultsTable findings={results.findings} />

      {/* Analysis Metrics */}
      <MetricsDisplay metrics={results.metrics} />
    </div>
  );
};

export const DetectionOverlay = ({ boxes }: { boxes: any[] }) => {
  return (
    <div className="absolute inset-0">
      {boxes.map((box, i) => (
        <div
          key={i}
          className="absolute border-2 border-red-500"
          style={{
            left: `${box.x}%`,
            top: `${box.y}%`,
            width: `${box.width}%`,
            height: `${box.height}%`
          }}
        >
          <span className="absolute -top-6 left-0 bg-red-500 text-white px-2 py-1 text-sm rounded">
            {box.label} ({Math.round(box.confidence * 100)}%)
          </span>
        </div>
      ))}
    </div>
  );
};

export const SegmentationOverlay = ({ segments }: { segments: any[] }) => {
  return (
    <div className="absolute inset-0">
      <svg className="w-full h-full">
        {segments.map((segment, i) => (
          <path
            key={i}
            d={segment.path}
            fill={`rgba(${segment.color}, 0.5)`}
            stroke={`rgb(${segment.color})`}
            strokeWidth="1"
          />
        ))}
      </svg>
    </div>
  );
};

export const ConfidenceChart = ({ data }: { data: any[] }) => {
  return (
    <LineChart width={600} height={200} data={data}>
      <XAxis dataKey="label" />
      <YAxis domain={[0, 1]} />
      <Tooltip 
        content={({ active, payload }) => {
          if (!active || !payload?.length) return null;
          return (
            <div className="bg-white p-2 border rounded shadow">
              <p className="text-sm">
                {payload[0].payload.label}: {(payload[0].value * 100).toFixed(1)}%
              </p>
            </div>
          );
        }}
      />
      <Line 
        type="monotone" 
        dataKey="confidence" 
        stroke="#8884d8" 
        dot={{ r: 4 }}
      />
    </LineChart>
  );
};

export const ResultsTable = ({ findings }: { findings: any[] }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {findings.map((finding, i) => (
            <tr key={i}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{finding.type}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{finding.content}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {Math.round(finding.confidence * 100)}%
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {finding.location ? `${finding.location.x}, ${finding.location.y}` : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const MetricsDisplay = ({ metrics }: { metrics: any }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Object.entries(metrics).map(([key, value]) => (
        <div key={key} className="bg-gray-50 p-4 rounded">
          <h4 className="text-sm font-medium text-gray-500 uppercase">{key}</h4>
          <p className="mt-1 text-lg font-semibold">{typeof value === 'number' ? value.toFixed(2) : value}</p>
        </div>
      ))}
    </div>
  );
};
