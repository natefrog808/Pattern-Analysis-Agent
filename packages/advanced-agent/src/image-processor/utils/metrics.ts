export function generateProcessingMetrics(startTime: number, itemCount: number) {
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  return {
    startTime,
    endTime,
    duration,
    itemsProcessed: itemCount,
    averageTimePerItem: itemCount > 0 ? duration / itemCount : 0
  };
}
