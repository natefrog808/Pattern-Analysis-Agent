export abstract class ImageProcessor {
  abstract type: string;
  
  abstract process(imageData: string, options?: Record<string, any>): Promise<any>;
  
  abstract validateInput(imageData: string): Promise<boolean>;
  
  protected async preprocessImage(imageData: string) {
    // Base preprocessing logic
    return imageData;
  }

  protected validateResults(results: any) {
    if (!results) {
      throw new Error('Processing returned no results');
    }
    return results;
  }

  protected async handleError(error: Error, context: any = {}) {
    console.error(`Error in ${this.type} processor:`, {
      error: error.message,
      context
    });
    throw error;
  }
}

export interface ProcessingMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  itemsProcessed: number;
  averageTimePerItem: number;
}
