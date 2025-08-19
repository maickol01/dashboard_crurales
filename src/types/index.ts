// Core types for Dashboard CRurales
// Migrated and adapted from dashboard_afiliados

// Base interface for all workers in the hierarchy
export interface BaseWorker {
  id: string;
  nombre: string;
  clave_electoral?: string;
  curp?: string;
  direccion?: string;
  colonia?: string;
  codigo_postal?: string;
  seccion?: string;
  entidad?: string;
  municipio?: string;
  numero_cel?: string;
  num_verificado: boolean;
  created_at: string;
}

// Specific worker types following the hierarchy
export interface Lider extends BaseWorker {
  // Lider is the top level, no parent reference needed
  role: 'lider';
}

export interface Brigadista extends BaseWorker {
  lider_id: string;
  role: 'brigadista';
}

export interface Movilizador extends BaseWorker {
  brigadista_id: string;
  role: 'movilizador';
}

export interface Ciudadano extends BaseWorker {
  movilizador_id: string;
  role: 'ciudadano';
}

// Hierarchical worker interface for tree structure
export interface HierarchicalWorker {
  id: string;
  nombre: string;
  role: 'lider' | 'brigadista' | 'movilizador';
  ciudadanosRegistrados: number;
  ubicacion: LocationInfo;
  children?: HierarchicalWorker[];
  performance: PerformanceMetrics;
  parentId?: string;
  isActive: boolean;
  lastActivity: Date;
}

// Location information
export interface LocationInfo {
  entidad?: string;
  municipio?: string;
  seccion?: string;
  colonia?: string;
  codigo_postal?: string;
}

// Performance metrics for workers
export interface PerformanceMetrics {
  ciudadanosRegistrados: number;
  tasaVerificacion: number;
  completitudDatos: number;
  ranking: number;
  tendencia: 'up' | 'down' | 'stable';
  ultimaActividad: Date;
}

// Date range interface
export interface DateRange {
  start: Date;
  end: Date;
}

// Filter options for data queries
export interface FilterOptions {
  dateRange?: DateRange;
  regions?: string[];
  roles?: ('lider' | 'brigadista' | 'movilizador')[];
  performanceRange?: { min: number; max: number };
  activeOnly?: boolean;
  searchTerm?: string;
}

// Export options for data export functionality
export interface ExportOptions {
  selectedWorkers: string[];
  exportType: 'complete' | 'by-level' | 'by-worker';
  specificLevel?: 'lider' | 'brigadista' | 'movilizador' | 'ciudadano';
  format: 'excel' | 'pdf';
  includeChildren?: boolean;
}

// Re-export error types for convenience
export {
  DatabaseError,
  NetworkError,
  ValidationError,
  ServiceError,
  RetryableError,
  isNetworkError,
  isDatabaseError,
  isRetryableError,
  isValidationError,
  classifyError
} from './errors';

// Re-export worker analytics types
export type {
  WorkerAnalytics,
  UnifiedAnalytics,
  WorkerProductivityAnalytics,
  WorkerQualityScore,
  WorkerGoal,
  HierarchyGoal,
  ProjectionData,
  EnhancedQualityMetrics,
  EnhancedGoalsMetrics,
  GeographicAnalysisData,
  TemporalPerformance,
  LeaderProductivityMetric,
  BrigadierProductivityMetric,
  MobilizerProductivityMetric,
  ComparativeMetric,
  ProductivityInsights
} from './analytics';

// Re-export hierarchy types
export type {
  HierarchyTableProps,
  HierarchyFiltersProps,
  HierarchyExportProps,
  HierarchyNode,
  HierarchyStats,
  HierarchySearchOptions,
  HierarchySortOptions,
  HierarchyViewOptions,
  HierarchyAction,
  HierarchyContextMenuItem,
  HierarchyPerformanceIndicator,
  HierarchyExpansionState,
  HierarchySelectionState,
  HierarchyVirtualizationOptions,
  HierarchyExportConfig,
  HierarchyLoadingState,
  HierarchyCacheConfig
} from './hierarchy';

// Re-export worker types
export type {
  WorkerRole,
  WorkerStatus,
  WorkerPerformanceLevel,
  WorkerContactInfo,
  WorkerLocationDetails,
  WorkerActivity,
  WorkerPerformanceSummary,
  WorkerTraining,
  WorkerGoalSetting,
  WorkerNetwork,
  WorkerAnalyticsSummary,
  WorkerFeedback,
  WorkerIncentive,
  WorkerCommunicationPreferences,
  WorkerSupport
} from './workers';

// Re-export database types
export type {
  Database,
  LideresRow,
  LideresInsert,
  LideresUpdate,
  BrigadistasRow,
  BrigadistasInsert,
  BrigadistasUpdate,
  MovilizadoresRow,
  MovilizadoresInsert,
  MovilizadoresUpdate,
  CiudadanosRow,
  CiudadanosInsert,
  CiudadanosUpdate,
  LiderWithHierarchy,
  BrigadistaWithHierarchy,
  MovilizadorWithHierarchy,
  WorkerCounts,
  RegionCounts,
  VerificationStats,
  RegistrationTrends,
  QueryOptions,
  DatabaseConfig,
  DatabaseResult,
  BatchInsertResult,
  BatchUpdateResult,
  RealtimeSubscription,
  RealtimePayload,
  IndexRecommendation,
  QueryPerformanceMetrics
} from './database';