import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export interface BatchProgressProps {
  analyses: Array<{
    id: string;
    name: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: {
      currentStep: number;
      totalSteps: number;
      startTime: number;
      lastUpdate: number;
    };
  }>;
  batchId: string;
  onCancel?: () => void;
}

export const BatchProgress: React.FC<BatchProgressProps> = ({ 
  analyses,
  batchId,
  onCancel
}) => {
  const completed = analyses.filter(a => a.status === 'completed').length;
  const failed = analyses.filter(a => a.status === 'failed').length;
  const total = analyses.length;
  const percentage = (completed / total) * 100;

  return (
    <div className="space-y-4">
      {/* Header with Cancel Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Batch Progress: {batchId}</h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 rounded border border-red-600 hover:border-red-800"
          >
            Cancel Batch
          </button>
        )}
      </div>
      
      {/* Overall Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <StatusCard 
          label="Completed" 
          value={completed} 
          color="bg-green-50 text-green-700"
        />
        <StatusCard 
          label="Failed" 
          value={failed} 
          color="bg-red-50 text-red-700"
        />
        <StatusCard 
          label="Pending" 
          value={total - completed - failed} 
          color="bg-yellow-50 text-yellow-700"
        />
      </div>

      {/* Individual Analysis Progress */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {analyses.map(analysis => (
          <AnalysisCard key={analysis.id} analysis={analysis} />
        ))}
      </div>

      {/* Performance Chart */}
      <BatchPerformanceChart analyses={analyses} />
    </div>
  );
};

const StatusCard: React.FC<{
  label: string;
  value: number;
  color: string;
}> = ({ label, value, color }) => (
  <div className={`p-4 rounded-lg ${color}`}>
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-sm">{label}</div>
  </div>
);

const AnalysisCard: React.FC<{
  analysis: BatchProgressProps['analyses'][0];
}> = ({ analysis }) => {
  const percentage = (analysis.progress.currentStep / analysis.progress.totalSteps) * 100;
  const duration = Date.now() - analysis.progress.startTime;

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium">{analysis.name}</span>
        <StatusBadge status={analysis.status} />
      </div>
      
      <div className="space-y-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <div className="flex justify-between text-sm text-gray-500">
          <span>{Math.round(percentage)}% Complete</span>
          <span>{Math.round(duration / 1000)}s</span>
        </div>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{
  status: string;
}> = ({ status }) => {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const BatchPerformanceChart: React.FC<{
  analyses: BatchProgressProps['analyses'];
}> = ({ analyses }) => {
  const data = analyses.map(analysis => ({
    name: analysis.name,
    duration: (analysis.progress.lastUpdate - analysis.progress.startTime) / 1000,
    status: analysis.status
  }));

  return (
    <div className="h-48">
      <LineChart width={600} height={200} data={data}>
        <XAxis dataKey="name" />
        <YAxis label={{ value: 'Duration (s)', angle: -90, position: 'insideLeft' }} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="bg-white p-2 border rounded shadow">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-sm">
                  Duration: {payload[0].value.toFixed(2)}s
                </p>
                <p className="text-sm">
                  Status: {payload[0].payload.status}
                </p>
              </div>
            );
          }}
        />
        <Line 
          type="monotone" 
          dataKey="duration" 
          stroke="#8884d8"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </div>
  );
};

export const BatchCancelledStatus: React.FC<{
  batchId: string;
  timestamp?: number;
}> = ({ batchId, timestamp }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <svg 
          className="h-6 w-6 text-red-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M6 18L18 6M6 6l12 12" 
          />
        </svg>
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-red-800">
          Batch Processing Cancelled
        </h3>
        <div className="mt-2 text-sm text-red-700">
          <p>Batch ID: {batchId}</p>
          {timestamp && (
            <p className="mt-1">
              Cancelled at: {new Date(timestamp).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
);
