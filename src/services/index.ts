// Services index for Dashboard CRurales
// Centralized exports for all service modules

export { OptimizedSupabaseService } from './supabaseOptimized'
// export { HierarchyService } from './hierarchyService' // Temporarily disabled
export { WorkerAnalyticsService } from './workerAnalyticsService'

// Re-export types for convenience
export type {
  DatabaseResult,
  QueryOptions,
  BatchInsertResult,
  BatchUpdateResult
} from '../types/database'

export type {
  FilterOptions,
  HierarchicalWorker,
  HierarchyStats,
  WorkerAnalytics,
  UnifiedAnalytics,
  WorkerProductivityAnalytics
} from '../types'