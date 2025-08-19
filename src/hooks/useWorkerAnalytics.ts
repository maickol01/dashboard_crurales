// Custom hook for managing worker analytics data
// Provides optimized data fetching, caching, and state management for worker performance metrics

import { useState, useEffect, useCallback, useMemo } from 'react'
import { WorkerAnalyticsService } from '../services/workerAnalyticsService'
import type {
  WorkerAnalytics,
  UnifiedAnalytics,
  WorkerProductivityAnalytics,
  EnhancedQualityMetrics,
  EnhancedGoalsMetrics,
  GeographicAnalysisData,
  FilterOptions
} from '../types'
import { ServiceError } from '../types/errors'

// Hook options interface
interface UseWorkerAnalyticsOptions {
  autoFetch?: boolean
  enableCache?: boolean
  refreshInterval?: number
  filters?: FilterOptions
  includeProductivity?: boolean
  includeQuality?: boolean
  includeGoals?: boolean
  includeGeographic?: boolean
}

// Hook return type
interface UseWorkerAnalyticsReturn {
  // Main analytics data
  unifiedAnalytics: UnifiedAnalytics | null
  workerAnalytics: WorkerAnalytics[]
  productivityAnalytics: WorkerProductivityAnalytics | null
  qualityMetrics: EnhancedQualityMetrics | null
  goalsMetrics: EnhancedGoalsMetrics | null
  geographicData: GeographicAnalysisData | null
  
  // Loading states
  loading: boolean
  loadingUnified: boolean
  loadingProductivity: boolean
  loadingQuality: boolean
  loadingGoals: boolean
  loadingGeographic: boolean
  error: string | null
  
  // Actions
  fetchUnifiedAnalytics: () => Promise<void>
  fetchWorkerAnalytics: () => Promise<void>
  fetchProductivityAnalytics: () => Promise<void>
  fetchQualityMetrics: () => Promise<void>
  fetchGoalsMetrics: () => Promise<void>
  fetchGeographicData: () => Promise<void>
  refreshAll: () => Promise<void>
  clearCache: () => void
  
  // Data manipulation
  getTopPerformers: (count?: number) => WorkerAnalytics[]
  getUnderPerformers: (count?: number) => WorkerAnalytics[]
  getWorkersByRole: (role: 'lider' | 'brigadista' | 'movilizador') => WorkerAnalytics[]
  getWorkerById: (id: string) => WorkerAnalytics | null
  
  // Metrics calculations
  calculateOverallScore: (worker: WorkerAnalytics) => number
  getPerformanceTrend: (workerId: string) => 'up' | 'down' | 'stable' | null
  getGoalProgress: (workerId: string) => number | null
  
  // Filtering and sorting
  filterWorkers: (predicate: (worker: WorkerAnalytics) => boolean) => WorkerAnalytics[]
  sortWorkers: (sortBy: 'ranking' | 'ciudadanos' | 'verificacion' | 'completitud') => WorkerAnalytics[]
}

export function useWorkerAnalytics(options: UseWorkerAnalyticsOptions = {}): UseWorkerAnalyticsReturn {
  const {
    autoFetch = true,
    enableCache = true,
    refreshInterval,
    filters,
    includeProductivity = true,
    includeQuality = true,
    includeGoals = true,
    includeGeographic = true
  } = options

  // State management
  const [unifiedAnalytics, setUnifiedAnalytics] = useState<UnifiedAnalytics | null>(null)
  const [workerAnalytics, setWorkerAnalytics] = useState<WorkerAnalytics[]>([])
  const [productivityAnalytics, setProductivityAnalytics] = useState<WorkerProductivityAnalytics | null>(null)
  const [qualityMetrics, setQualityMetrics] = useState<EnhancedQualityMetrics | null>(null)
  const [goalsMetrics, setGoalsMetrics] = useState<EnhancedGoalsMetrics | null>(null)
  const [geographicData, setGeographicData] = useState<GeographicAnalysisData | null>(null)
  
  // Loading states
  const [loadingUnified, setLoadingUnified] = useState(false)
  const [loadingProductivity, setLoadingProductivity] = useState(false)
  const [loadingQuality, setLoadingQuality] = useState(false)
  const [loadingGoals, setLoadingGoals] = useState(false)
  const [loadingGeographic, setLoadingGeographic] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Computed loading state
  const loading = loadingUnified || loadingProductivity || loadingQuality || loadingGoals || loadingGeographic

  // Fetch unified analytics
  const fetchUnifiedAnalytics = useCallback(async () => {
    if (loadingUnified) return

    setLoadingUnified(true)
    setError(null)

    try {
      const analytics = await WorkerAnalyticsService.getUnifiedAnalytics(filters)
      setUnifiedAnalytics(analytics)
      
      // Extract worker analytics from unified data
      if (analytics.workerAnalytics) {
        setWorkerAnalytics(analytics.workerAnalytics)
      }
    } catch (err) {
      const errorMessage = err instanceof ServiceError ? err.message : 'Failed to fetch unified analytics'
      setError(errorMessage)
      console.error('Error fetching unified analytics:', err)
    } finally {
      setLoadingUnified(false)
    }
  }, [filters, loadingUnified])

  // Fetch worker analytics
  const fetchWorkerAnalytics = useCallback(async () => {
    try {
      const analytics = await WorkerAnalyticsService.getWorkerAnalytics(filters)
      setWorkerAnalytics(analytics)
    } catch (err) {
      console.error('Error fetching worker analytics:', err)
    }
  }, [filters])

  // Fetch productivity analytics
  const fetchProductivityAnalytics = useCallback(async () => {
    if (!includeProductivity || loadingProductivity) return

    setLoadingProductivity(true)

    try {
      const analytics = await WorkerAnalyticsService.getWorkerProductivityAnalytics(filters)
      setProductivityAnalytics(analytics)
    } catch (err) {
      console.error('Error fetching productivity analytics:', err)
    } finally {
      setLoadingProductivity(false)
    }
  }, [filters, includeProductivity, loadingProductivity])

  // Fetch quality metrics
  const fetchQualityMetrics = useCallback(async () => {
    if (!includeQuality || loadingQuality) return

    setLoadingQuality(true)

    try {
      const metrics = await WorkerAnalyticsService.getEnhancedQualityMetrics(filters)
      setQualityMetrics(metrics)
    } catch (err) {
      console.error('Error fetching quality metrics:', err)
    } finally {
      setLoadingQuality(false)
    }
  }, [filters, includeQuality, loadingQuality])

  // Fetch goals metrics
  const fetchGoalsMetrics = useCallback(async () => {
    if (!includeGoals || loadingGoals) return

    setLoadingGoals(true)

    try {
      const metrics = await WorkerAnalyticsService.getEnhancedGoalsMetrics(filters)
      setGoalsMetrics(metrics)
    } catch (err) {
      console.error('Error fetching goals metrics:', err)
    } finally {
      setLoadingGoals(false)
    }
  }, [filters, includeGoals, loadingGoals])

  // Fetch geographic data
  const fetchGeographicData = useCallback(async () => {
    if (!includeGeographic || loadingGeographic) return

    setLoadingGeographic(true)

    try {
      const data = await WorkerAnalyticsService.getGeographicAnalysisData(filters)
      setGeographicData(data)
    } catch (err) {
      console.error('Error fetching geographic data:', err)
    } finally {
      setLoadingGeographic(false)
    }
  }, [filters, includeGeographic, loadingGeographic])

  // Refresh all data
  const refreshAll = useCallback(async () => {
    if (enableCache) {
      WorkerAnalyticsService.clearCache()
    }

    const promises = [fetchUnifiedAnalytics()]
    
    if (includeProductivity) promises.push(fetchProductivityAnalytics())
    if (includeQuality) promises.push(fetchQualityMetrics())
    if (includeGoals) promises.push(fetchGoalsMetrics())
    if (includeGeographic) promises.push(fetchGeographicData())

    await Promise.all(promises)
  }, [
    enableCache,
    fetchUnifiedAnalytics,
    fetchProductivityAnalytics,
    fetchQualityMetrics,
    fetchGoalsMetrics,
    fetchGeographicData,
    includeProductivity,
    includeQuality,
    includeGoals,
    includeGeographic
  ])

  // Clear cache
  const clearCache = useCallback(() => {
    WorkerAnalyticsService.clearCache()
  }, [])

  // Data manipulation functions
  const getTopPerformers = useCallback((count: number = 10): WorkerAnalytics[] => {
    return workerAnalytics
      .sort((a, b) => a.ranking - b.ranking)
      .slice(0, count)
  }, [workerAnalytics])

  const getUnderPerformers = useCallback((count: number = 10): WorkerAnalytics[] => {
    return workerAnalytics
      .sort((a, b) => b.ranking - a.ranking)
      .slice(0, count)
  }, [workerAnalytics])

  const getWorkersByRole = useCallback((role: 'lider' | 'brigadista' | 'movilizador'): WorkerAnalytics[] => {
    return workerAnalytics.filter(worker => worker.role === role)
  }, [workerAnalytics])

  const getWorkerById = useCallback((id: string): WorkerAnalytics | null => {
    return workerAnalytics.find(worker => worker.workerId === id) || null
  }, [workerAnalytics])

  // Metrics calculations
  const calculateOverallScore = useCallback((worker: WorkerAnalytics): number => {
    const { tasaVerificacion, completitudDatos, ciudadanosRegistrados } = worker
    const registrationScore = Math.min(ciudadanosRegistrados * 2, 100) // Cap at 100
    return (tasaVerificacion + completitudDatos + registrationScore) / 3
  }, [])

  const getPerformanceTrend = useCallback((workerId: string): 'up' | 'down' | 'stable' | null => {
    const worker = getWorkerById(workerId)
    return worker ? worker.tendencia : null
  }, [getWorkerById])

  const getGoalProgress = useCallback((workerId: string): number | null => {
    if (!goalsMetrics) return null
    
    const workerGoal = goalsMetrics.workerIndividualGoals.find(goal => goal.workerId === workerId)
    return workerGoal ? workerGoal.percentage : null
  }, [goalsMetrics])

  // Filtering and sorting
  const filterWorkers = useCallback((predicate: (worker: WorkerAnalytics) => boolean): WorkerAnalytics[] => {
    return workerAnalytics.filter(predicate)
  }, [workerAnalytics])

  const sortWorkers = useCallback((sortBy: 'ranking' | 'ciudadanos' | 'verificacion' | 'completitud'): WorkerAnalytics[] => {
    const sorted = [...workerAnalytics]
    
    switch (sortBy) {
      case 'ranking':
        return sorted.sort((a, b) => a.ranking - b.ranking)
      case 'ciudadanos':
        return sorted.sort((a, b) => b.ciudadanosRegistrados - a.ciudadanosRegistrados)
      case 'verificacion':
        return sorted.sort((a, b) => b.tasaVerificacion - a.tasaVerificacion)
      case 'completitud':
        return sorted.sort((a, b) => b.completitudDatos - a.completitudDatos)
      default:
        return sorted
    }
  }, [workerAnalytics])

  // Auto-fetch on mount and filter changes
  useEffect(() => {
    if (autoFetch) {
      fetchUnifiedAnalytics()
      
      if (includeProductivity) fetchProductivityAnalytics()
      if (includeQuality) fetchQualityMetrics()
      if (includeGoals) fetchGoalsMetrics()
      if (includeGeographic) fetchGeographicData()
    }
  }, [
    autoFetch,
    fetchUnifiedAnalytics,
    fetchProductivityAnalytics,
    fetchQualityMetrics,
    fetchGoalsMetrics,
    fetchGeographicData,
    includeProductivity,
    includeQuality,
    includeGoals,
    includeGeographic
  ])

  // Setup refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        refreshAll()
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [refreshInterval, refreshAll])

  // Memoized return object
  return useMemo(() => ({
    // Main analytics data
    unifiedAnalytics,
    workerAnalytics,
    productivityAnalytics,
    qualityMetrics,
    goalsMetrics,
    geographicData,
    
    // Loading states
    loading,
    loadingUnified,
    loadingProductivity,
    loadingQuality,
    loadingGoals,
    loadingGeographic,
    error,
    
    // Actions
    fetchUnifiedAnalytics,
    fetchWorkerAnalytics,
    fetchProductivityAnalytics,
    fetchQualityMetrics,
    fetchGoalsMetrics,
    fetchGeographicData,
    refreshAll,
    clearCache,
    
    // Data manipulation
    getTopPerformers,
    getUnderPerformers,
    getWorkersByRole,
    getWorkerById,
    
    // Metrics calculations
    calculateOverallScore,
    getPerformanceTrend,
    getGoalProgress,
    
    // Filtering and sorting
    filterWorkers,
    sortWorkers
  }), [
    unifiedAnalytics,
    workerAnalytics,
    productivityAnalytics,
    qualityMetrics,
    goalsMetrics,
    geographicData,
    loading,
    loadingUnified,
    loadingProductivity,
    loadingQuality,
    loadingGoals,
    loadingGeographic,
    error,
    fetchUnifiedAnalytics,
    fetchWorkerAnalytics,
    fetchProductivityAnalytics,
    fetchQualityMetrics,
    fetchGoalsMetrics,
    fetchGeographicData,
    refreshAll,
    clearCache,
    getTopPerformers,
    getUnderPerformers,
    getWorkersByRole,
    getWorkerById,
    calculateOverallScore,
    getPerformanceTrend,
    getGoalProgress,
    filterWorkers,
    sortWorkers
  ])
}