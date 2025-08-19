// Analytics types for Dashboard CRurales
// Enhanced and adapted from dashboard_afiliados

import type { LocationInfo } from './index';

// Date range interface
export interface DateRange {
  start: Date;
  end: Date;
}

// Worker analytics interface
export interface WorkerAnalytics {
  workerId: string;
  workerName: string;
  role: 'lider' | 'brigadista' | 'movilizador';
  ciudadanosRegistrados: number;
  tasaVerificacion: number;
  completitudDatos: number;
  ubicacionGeografica: LocationInfo;
  rendimientoTemporal: TemporalPerformance[];
  ranking: number;
  tendencia: 'up' | 'down' | 'stable';
  ultimaActividad: Date;
}

// Temporal performance data
export interface TemporalPerformance {
  fecha: string;
  registros: number;
  acumulado: number;
}

// Unified analytics interface containing all analytics data
export interface UnifiedAnalytics {
  // KPIs principales
  totalCiudadanos: number;
  totalTrabajadores: number;
  tasaCrecimiento: number;
  metaProgreso: number;
  
  // Analíticas de trabajadores
  workerAnalytics: WorkerAnalytics[];
  topPerformers: WorkerAnalytics[];
  underPerformers: WorkerAnalytics[];
  
  // Analíticas geográficas (reutilizadas)
  geographicData: GeographicAnalysisData;
  
  // Métricas de calidad (mejoradas)
  qualityMetrics: EnhancedQualityMetrics;
  
  // Metas y objetivos (mejorados)
  goalsMetrics: EnhancedGoalsMetrics;
  
  // Timestamp de última actualización
  lastUpdated: Date;
}

// Geographic analysis data (reused from dashboard_afiliados)
export interface GeographicAnalysisData {
  regionDistribution: RegionDistribution[];
  heatmapData: HeatmapData[];
  territorialCoverage: TerritorialCoverage[];
}

export interface RegionDistribution {
  region: string;
  count: number;
  percentage: number;
  workers: {
    lideres: number;
    brigadistas: number;
    movilizadores: number;
  };
}

export interface HeatmapData {
  region: string;
  intensity: number;
  coordinates?: [number, number];
  registrationCount: number;
}

export interface TerritorialCoverage {
  region: string;
  coverage: number;
  target: number;
  status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
}

// Enhanced quality metrics
export interface EnhancedQualityMetrics {
  // Métricas existentes
  dataCompleteness: number;
  verificationRate: number;
  duplicateRate: number;
  
  // Nuevas métricas específicas de trabajadores
  workerQualityScores: WorkerQualityScore[];
  fieldCompletenessBreakdown: FieldCompleteness[];
  verificationTrends: VerificationTrend[];
  qualityByLevel: QualityByLevel[];
}

export interface WorkerQualityScore {
  workerId: string;
  workerName: string;
  role: 'lider' | 'brigadista' | 'movilizador';
  overallScore: number;
  verificationRate: number;
  dataCompleteness: number;
  duplicateRate: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface FieldCompleteness {
  fieldName: string;
  completenessRate: number;
  byWorkerLevel: {
    lider: number;
    brigadista: number;
    movilizador: number;
  };
}

export interface VerificationTrend {
  date: string;
  verificationRate: number;
  totalVerified: number;
  totalRegistrations: number;
}

export interface QualityByLevel {
  level: 'lider' | 'brigadista' | 'movilizador';
  averageQuality: number;
  bestPerformer: {
    id: string;
    name: string;
    score: number;
  };
  worstPerformer: {
    id: string;
    name: string;
    score: number;
  };
}

// Enhanced goals and objectives metrics
export interface EnhancedGoalsMetrics {
  // Meta general
  overallProgress: ProgressMetric;
  
  // Metas específicas de trabajadores
  workerIndividualGoals: WorkerGoal[];
  hierarchyLevelGoals: HierarchyGoal[];
  projectedCompletion: ProjectionData;
  
  // Análisis de cumplimiento
  goalCompletionRates: GoalCompletionRate[];
  milestones: Milestone[];
}

export interface ProgressMetric {
  current: number;
  target: number;
  percentage: number;
  trend: 'on-track' | 'behind' | 'ahead';
  estimatedCompletion: Date;
}

export interface WorkerGoal {
  workerId: string;
  workerName: string;
  role: 'lider' | 'brigadista' | 'movilizador';
  currentProgress: number;
  target: number;
  percentage: number;
  status: 'on-track' | 'behind' | 'ahead' | 'completed';
  daysRemaining: number;
  requiredDailyRate: number;
}

export interface HierarchyGoal {
  level: 'lider' | 'brigadista' | 'movilizador';
  totalWorkers: number;
  workersOnTrack: number;
  workersBehind: number;
  workersAhead: number;
  averageProgress: number;
  levelTarget: number;
  levelCurrent: number;
}

export interface ProjectionData {
  projectedFinalCount: number;
  confidenceLevel: number;
  projectedCompletionDate: Date;
  scenarioAnalysis: {
    optimistic: { count: number; date: Date };
    realistic: { count: number; date: Date };
    pessimistic: { count: number; date: Date };
  };
}

export interface GoalCompletionRate {
  period: string;
  completionRate: number;
  targetsSet: number;
  targetsAchieved: number;
  averageDaysToComplete: number;
}

export interface Milestone {
  id: string;
  description: string;
  targetDate: Date;
  targetCount: number;
  currentCount: number;
  completed: boolean;
  completionDate?: Date;
  priority: 'high' | 'medium' | 'low';
}

// Worker productivity analytics (enhanced from dashboard_afiliados)
export interface WorkerProductivityAnalytics {
  leaderMetrics: LeaderProductivityMetric[];
  brigadierMetrics: BrigadierProductivityMetric[];
  mobilizerMetrics: MobilizerProductivityMetric[];
  comparativeAnalysis: ComparativeMetric[];
  overallInsights: ProductivityInsights;
}

export interface LeaderProductivityMetric {
  leaderId: string;
  name: string;
  totalNetwork: number;
  brigadierCount: number;
  mobilizerCount: number;
  citizenCount: number;
  registrationVelocity: number;
  networkEfficiency: number;
  timeToTarget: number;
  performanceRank: number;
  trendDirection: 'up' | 'down' | 'stable';
  lastActivityDate: Date;
  recommendations: string[];
}

export interface BrigadierProductivityMetric {
  brigadierId: string;
  name: string;
  leaderId: string;
  leaderName: string;
  mobilizerCount: number;
  citizenCount: number;
  avgCitizensPerMobilizer: number;
  registrationRate: number;
  efficiencyScore: number;
  performanceLevel: 'high' | 'medium' | 'low';
  needsSupport: boolean;
  lastActivityDate: Date;
  targetProgress: number;
}

export interface MobilizerProductivityMetric {
  mobilizerId: string;
  name: string;
  brigadierId: string;
  brigadierName: string;
  leaderId: string;
  leaderName: string;
  citizenCount: number;
  registrationRate: number;
  activityLevel: 'active' | 'moderate' | 'inactive';
  lastRegistration: Date;
  targetProgress: number;
  weeklyAverage: number;
  monthlyGoal: number;
}

export interface ComparativeMetric {
  level: 'lider' | 'brigadista' | 'movilizador';
  averagePerformance: number;
  topPerformer: {
    id: string;
    name: string;
    score: number;
  };
  bottomPerformer: {
    id: string;
    name: string;
    score: number;
  };
  performanceDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  efficiencyTrend: 'improving' | 'declining' | 'stable';
}

export interface ProductivityInsights {
  mostEffectiveLevel: 'lider' | 'brigadista' | 'movilizador';
  recommendedActions: string[];
  performanceTrends: {
    level: string;
    trend: 'up' | 'down' | 'stable';
    changePercentage: number;
  }[];
  keyFindings: string[];
}