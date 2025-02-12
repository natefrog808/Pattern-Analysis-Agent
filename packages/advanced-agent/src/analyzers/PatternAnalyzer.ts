// packages/advanced-agent/src/analyzers/PatternAnalyzer.ts

import { 
  type TimeSeriesData,
  type HolisticAnalysis,
  type AnalysisOptions,
  AnalysisError,
  ErrorCode
} from '../types';
import { 
  computeLocalRegression,
  findPeaks,
  calculateAutocorrelation
} from './statistics';
import {
  analyzeTrends,
  analyzeSeasonality,
  detectChangePoints,
  findAnomalies
} from './detectors';
import {
  analyzeFinancialData,
  analyzeMedicalData,
  analyzeEnvironmentalData
} from './domain';

export class PatternAnalyzer {
  private data: number[];
  private timestamps: number[];
  private domain?: string;
  private contextWindow: number;

  constructor(
    data: number[], 
    timestamps: number[], 
    options: AnalysisOptions = {}
  ) {
    if (data.length !== timestamps.length) {
      throw new AnalysisError(
        'Data and timestamps must have same length',
        ErrorCode.INSUFFICIENT_DATA
      );
    }

    this.data = data;
    this.timestamps = timestamps;
    this.domain = options.domain;
    this.contextWindow = options.contextWindow || Math.max(10, Math.floor(data.length / 10));
  }

  public async analyzeHolistically(): Promise<HolisticAnalysis> {
    try {
      const timeSeries = await this.analyzeTimeSeries();
      const statistics = this.computeStatistics();
      const domainInsights = await this.analyzeDomainSpecific();
      const correlations = await this.analyzeCorrelations();

      return {
        timeSeries,
        statistics,
        domainInsights,
        correlations,
        metadata: {
          confidence: this.calculateOverallConfidence(timeSeries, statistics),
          quality: this.assessDataQuality(),
          recommendations: this.generateRecommendations(
            timeSeries, 
            statistics, 
            domainInsights
          )
        }
      };
    } catch (error) {
      throw new AnalysisError(
        'Analysis failed',
        ErrorCode.ANALYSIS_FAILED,
        { error }
      );
    }
  }

  private async analyzeTimeSeries() {
    const trends = await analyzeTrends(this.data, this.contextWindow);
    const seasonality = await analyzeSeasonality(this.data);
    const changePoints = await detectChangePoints(this.data);
    const anomalies = await findAnomalies(this.data);

    return {
      trends,
      seasonality,
      changePoints,
      anomalies
    };
  }

  private computeStatistics() {
    return {
      basic: this.computeBasicStats(),
      distribution: this.computeDistributionStats(),
      timeBased: this.computeTimeBasedStats()
    };
  }

  private computeBasicStats() {
    return {
      mean: _.mean(this.data),
      median: _.median(this.data),
      std: Math.sqrt(_.variance(this.data)),
      min: _.min(this.data),
      max: _.max(this.data)
    };
  }

  private computeDistributionStats() {
    return {
      skewness: this.calculateSkewness(),
      kurtosis: this.calculateKurtosis(),
      quantiles: this.calculateQuantiles()
    };
  }

  private computeTimeBasedStats() {
    return {
      volatility: this.calculateVolatility(),
      momentum: this.calculateMomentum(),
      velocity: this.calculateVelocity()
    };
  }

  private async analyzeDomainSpecific() {
    if (!this.domain) return null;

    switch (this.domain) {
      case 'financial':
        return analyzeFinancialData(this.data, this.timestamps);
      case 'medical':
        return analyzeMedicalData(this.data, this.timestamps);
      case 'environmental':
        return analyzeEnvironmentalData(this.data, this.timestamps);
      default:
        throw new AnalysisError(
          'Invalid domain specified',
          ErrorCode.INVALID_DOMAIN
        );
    }
  }

  private async analyzeCorrelations() {
    const correlations = [];
    const windows = this.generateWindows();

    for (const window of windows) {
      const correlation = calculateAutocorrelation(window.data);
      if (correlation.coefficient > 0.7) {
        correlations.push({
          variables: [window.start, window.end],
          ...correlation
        });
      }
    }

    return correlations;
  }

  private generateWindows() {
    const windows = [];
    for (let i = 0; i < this.data.length - this.contextWindow; i++) {
      windows.push({
        start: this.timestamps[i],
        end: this.timestamps[i + this.contextWindow],
        data: this.data.slice(i, i + this.contextWindow)
      });
    }
    return windows;
  }

  private calculateOverallConfidence(timeSeries: any, statistics: any) {
    const dataQuality = this.assessDataQuality();
    const patternStrength = this.assessPatternStrength(timeSeries);
    const statisticalSignificance = this.assessStatisticalSignificance(statistics);

    return (dataQuality + patternStrength + statisticalSignificance) / 3;
  }

  private assessDataQuality() {
    const completeness = 1 - (this.data.filter(x => x === null).length / this.data.length);
    const validity = this.data.every(x => !isNaN(x)) ? 1 : 0;
    const timeliness = this.assessTimeliness();

    return (completeness + validity + timeliness) / 3;
  }

  private assessTimeliness() {
    const timestamps = this.timestamps.slice().sort();
    const intervals = timestamps.slice(1).map((t, i) => t - timestamps[i]);
    const meanInterval = _.mean(intervals);
    const stdInterval = Math.sqrt(_.variance(intervals));

    return Math.exp(-stdInterval / meanInterval);
  }

  private assessPatternStrength(timeSeries: any) {
    const trendStrength = _.mean(timeSeries.trends.map((t: any) => t.confidence));
    const seasonalStrength = timeSeries.seasonality.strength;
    const anomalyConfidence = _.mean(timeSeries.anomalies.map((a: any) => a.confidence));

    return (trendStrength + seasonalStrength + anomalyConfidence) / 3;
  }

  private assessStatisticalSignificance(statistics: any) {
    const normalityScore = this.testNormality();
    const stationarityScore = this.testStationarity();
    const varianceScore = this.assessVarianceStability();

    return (normalityScore + stationarityScore + varianceScore) / 3;
  }

  private generateRecommendations(
    timeSeries: any,
    statistics: any,
    domainInsights: any
  ) {
    const recommendations = [];

    // Pattern-based recommendations
    if (timeSeries.trends.some((t: any) => t.confidence > 0.8)) {
      recommendations.push("Strong trends detected - consider trend-following strategies");
    }

    // Statistical recommendations
    if (statistics.distribution.skewness > 1) {
      recommendations.push("Significant positive skew - data may need transformation");
    }

    // Domain-specific recommendations
    if (domainInsights?.financial) {
      if (domainInsights.financial.metrics.volatility.daily > 0.2) {
        recommendations.push("High volatility detected - implement risk management");
      }
    }

    return recommendations;
  }
}
