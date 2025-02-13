// packages/advanced-agent/src/image-processor/visualization/progress.tsx

import React from 'react';

export const AnalysisProgress = ({ 
  progress,
  showRetryAttempt = false
}: { 
  progress: {
    currentStep: number;
    totalSteps: number;
    startTime: number;
    lastUpdate: number;
  };
  showRetryAttempt?: boolean;
}) => {
  const percentage = (progress.currentStep / progress.totalSteps) * 100;
  const duration = Date.now() - progress.startTime;

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm">
        <span>Processing{showRetryAttempt ? ' (Retry)' : ''}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded">
        <div 
          className="bg-blue-500 rounded h-2 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-gray-500">
        <span>Duration: {Math.round(duration / 1000)}s</span>
        {progress.lastUpdate && (
          <span className="ml-2">
            Last Update: {new Date(progress.lastUpdate).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
};

export const BatchProgress = ({ 
  analyses,
  batchId,
  onCancel
}: { 
  analyses: any[];
  batchId: string;
  onCancel?: () => void;
}) => {
  const completed = analyses.filter(a => a.status === 'completed').length;
  const failed = analyses.filter(a => a.status === 'failed').length;
  const total = analyses.length;
  const percentage = (completed / total) * 100;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Batch Progress: {batchId}</h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
          >
            Cancel Batch
          </button>
        )}
      </div>
      
      {/* Overall progress */}
      <div className="w-full bg-gray-200 rounded">
        <div 
          className="bg-blue-500 rounded h-2 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-50 p-2 rounded">
          <div className="text-lg font-semibold">{completed}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <div className="text-lg font-semibold">{failed}</div>
          <div className="text-sm text-gray-500">Failed</div>
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <div className="text-lg font-semibold">{total - completed - failed}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
      </div>

      {/* Individual analyses */}
      <div className="space-y-2">
        {analyses.map(analysis => (
          <div key={analysis.id} className="border p-2 rounded">
            <div className="flex justify-between text-sm mb-2">
              <span>{analysis.name}</span>
              <StatusBadge status={analysis.status} />
            </div>
            <AnalysisProgress progress={analysis.progress} />
          </div>
        ))}
      </div>
    </div>
  );
};

export const StatusBadge = ({ status }: { status: string }) => {
  const colors = {
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
};

export const BatchCancelledStatus = ({ batchId }: { batchId: string }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Batch Processing Cancelled
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>Batch ID: {batchId}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
