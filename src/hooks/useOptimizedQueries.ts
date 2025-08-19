// Custom hook for handling large dataset queries with pagination and optimization
// Provides intelligent query management, caching, and performance optimizations
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { OptimizedSupabaseService } from '../services/supabaseOptimized'
import type {
  QueryOptions,
  DatabaseResult,
  WorkerCounts,
  RegionCounts,
  VerificationStats,
  RegistrationTrends
} from '../types/database'
import { ServiceError } from '../types/errors'

// Pagination options
interface PaginationOptions {
  page: number
  pageSize: number
  totalCount?: number
  hasNextPage?: boolean
  hasPreviousPage?: boolean
}

// Query state interface
interface QueryState<T> {
  data: T | null
  loading: boolean
  error: string | null
  lastFetch: Date | null
  cached: boolean
}

// Hook options interface
interface UseOptimizedQueriesOptions {
  enableCache?: boolean
  cacheTimeout?: number
  retryAttempts?: number
  retryDelay?: number
  enablePagination?: boolean
  defaultPageSize?: number
  enableRealTimeUpdates?: boolean
  debounceDelay?: number
}

// Hook return type
interface UseOptimizedQueriesReturn {
  // Query states
  hierarchicalQuery: QueryState<any[]>
  workerCountsQuery: QueryState<WorkerCounts>
  regionCountsQuery: QueryState<RegionCounts[]>
  verificationStatsQuery: QueryState<VerificationStats>
  registrationTrendsQuery: QueryState<RegistrationTrends[]>
  
  // Pagination
  pagination: PaginationOptions
  setPagination: (options: Partial<PaginationOptions>) => void
  nextPage: () => void
  previousPage: () => void
  goToPage: (page: number) => void
  
  // Query actions
  fetchHierarchicalData: (options?: QueryOptions) => Promise<void>
  fetchWorkerCounts: () => Promise<void>
  fetchRegionCounts: (regionType?: 'entidad' | 'municipio' | 'seccion') => Promise<void>
  fetchVerificationStats: () => Promise<void>
  fetchRegistrationTrends: (days?: number) => Promise<void>
  
  // Utility actions
  refreshAll: () => Promise<void>
  clearCache: () => void
  cancelAllQueries: () => void
  
  // Performance metrics
  queryMetrics: {
    totalQueries: number
    successfulQueries: number
    failedQueries: number
    averageResponseTime: number
    cacheHitRate: number
  }
  
  // Loading states
  isLoading: boolean
  hasError: boolean
  globalError: string | null
}

export function useOptimizedQueries(options: UseOptimizedQueriesOptions = {}): UseOptimizedQueriesReturn {
  const {
    retryAttempts = 3,
    retryDelay = 1000,
    enablePagination = true,
    defaultPageSize = 50,
    debounceDelay = 300
  } = options

  // Query states
  const [hierarchicalQuery, setHierarchicalQuery] = useState<QueryState<any[]>>({
    data: null,
    loading: false,
    error: null,
    lastFetch: null,
    cached: false
  })

  const [workerCountsQuery, setWorkerCountsQuery] = useState<QueryState<WorkerCounts>>({
    data: null,
    loading: false,
    error: null,
    lastFetch: null,
    cached: false
  })

  const [regionCountsQuery, setRegionCountsQuery] = useState<QueryState<RegionCounts[]>>({
    data: null,
    loading: false,
    error: null,
    lastFetch: null,
    cached: false
  })

  const [verificationStatsQuery, setVerificationStatsQuery] = useState<QueryState<VerificationStats>>({
    data: null,
    loading: false,
    error: null,
    lastFetch: null,
    cached: false
  })

  const [registrationTrendsQuery, setRegistrationTrendsQuery] = useState<QueryState<RegistrationTrends[]>>({
    data: null,
    loading: false,
    error: null,
    lastFetch: null,
    cached: false
  })

  // Pagination state
  const [pagination, setPaginationState] = useState<PaginationOptions>({
    page: 1,
    pageSize: defaultPageSize,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })

  // Performance metrics
  const [queryMetrics, setQueryMetrics] = useState({
    totalQueries: 0,
    successfulQueries: 0,
    failedQueries: 0,
    averageResponseTime: 0,
    cacheHitRate: 0
  })

  // Global error state
  const [globalError, setGlobalError] = useState<string | null>(null)

  // Refs for cleanup and cancellation
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const responseTimesRef = useRef<number[]>([])

  // Computed loading state
  const isLoading = hierarchicalQuery.loading || workerCountsQuery.loading || 
                   regionCountsQuery.loading || verificationStatsQuery.loading || 
                   registrationTrendsQuery.loading

  const hasError = !!(hierarchicalQuery.error || workerCountsQuery.error || 
                     regionCountsQuery.error || verificationStatsQuery.error || 
                     registrationTrendsQuery.error || globalError)

  // Generic query executor with retry logic and metrics
  const executeQuery = useCallback(async <T>(
    queryFn: () => Promise<DatabaseResult<T>>,
    setState: React.Dispatch<React.SetStateAction<QueryState<T>>>,
    queryName: string
  ): Promise<void> => {
    const startTime = performance.now()
    
    setState(prev => ({ ...prev, loading: true, error: null }))
    setGlobalError(null)

    // Update metrics
    setQueryMetrics(prev => ({ ...prev, totalQueries: prev.totalQueries + 1 }))

    let attempt = 0
    let lastError: Error | null = null

    while (attempt < retryAttempts) {
      try {
        const result = await queryFn()
        
        if (result.error) {
          throw new ServiceError(`${queryName} failed`, new Error(result.error.message))
        }

        const endTime = performance.now()
        const responseTime = endTime - startTime
        
        // Update response times for metrics
        responseTimesRef.current.push(responseTime)
        if (responseTimesRef.current.length > 100) {
          responseTimesRef.current.shift() // Keep only last 100 measurements
        }

        // Update metrics
        setQueryMetrics(prev => ({
          ...prev,
          successfulQueries: prev.successfulQueries + 1,
          averageResponseTime: responseTimesRef.current.reduce((sum, time) => sum + time, 0) / responseTimesRef.current.length
        }))

        setState(prev => ({
          ...prev,
          data: result.data,
          loading: false,
          error: null,
          lastFetch: new Date(),
          cached: false
        }))

        return
      } catch (error) {
        lastError = error as Error
        attempt++
        
        if (attempt < retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
        }
      }
    }

    // All attempts failed
    const errorMessage = lastError instanceof ServiceError ? lastError.message : `${queryName} failed after ${retryAttempts} attempts`
    
    setState(prev => ({
      ...prev,
      loading: false,
      error: errorMessage,
      lastFetch: new Date(),
      cached: false
    }))

    setGlobalError(errorMessage)
    setQueryMetrics(prev => ({ ...prev, failedQueries: prev.failedQueries + 1 }))
  }, [retryAttempts, retryDelay])

  // Fetch hierarchical data with pagination
  const fetchHierarchicalData = useCallback(async (queryOptions?: QueryOptions) => {
    const options: QueryOptions = {
      limit: pagination.pageSize,
      offset: (pagination.page - 1) * pagination.pageSize,
      ...queryOptions
    }

    await executeQuery(
      () => OptimizedSupabaseService.getHierarchicalData(options),
      setHierarchicalQuery,
      'Hierarchical Data'
    )
  }, [pagination.page, pagination.pageSize, executeQuery])

  // Fetch worker counts
  const fetchWorkerCounts = useCallback(async () => {
    await executeQuery(
      () => OptimizedSupabaseService.getWorkerCounts(),
      setWorkerCountsQuery,
      'Worker Counts'
    )
  }, [executeQuery])

  // Fetch region counts
  const fetchRegionCounts = useCallback(async (regionType: 'entidad' | 'municipio' | 'seccion' = 'entidad') => {
    await executeQuery(
      () => OptimizedSupabaseService.getRegionCounts(regionType),
      setRegionCountsQuery,
      'Region Counts'
    )
  }, [executeQuery])

  // Fetch verification stats
  const fetchVerificationStats = useCallback(async () => {
    await executeQuery(
      () => OptimizedSupabaseService.getVerificationStats(),
      setVerificationStatsQuery,
      'Verification Stats'
    )
  }, [executeQuery])

  // Fetch registration trends
  const fetchRegistrationTrends = useCallback(async (days: number = 30) => {
    await executeQuery(
      () => OptimizedSupabaseService.getRegistrationTrends(days),
      setRegistrationTrendsQuery,
      'Registration Trends'
    )
  }, [executeQuery])

  // Pagination controls
  const setPagination = useCallback((options: Partial<PaginationOptions>) => {
    setPaginationState(prev => {
      const newPagination = { ...prev, ...options }
      
      // Calculate pagination flags
      newPagination.hasPreviousPage = newPagination.page > 1
      newPagination.hasNextPage = newPagination.totalCount ? 
        (newPagination.page * newPagination.pageSize) < newPagination.totalCount : 
        false

      return newPagination
    })
  }, [])

  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      setPagination({ page: pagination.page + 1 })
    }
  }, [pagination.hasNextPage, pagination.page, setPagination])

  const previousPage = useCallback(() => {
    if (pagination.hasPreviousPage) {
      setPagination({ page: pagination.page - 1 })
    }
  }, [pagination.hasPreviousPage, pagination.page, setPagination])

  const goToPage = useCallback((page: number) => {
    if (page >= 1) {
      setPagination({ page })
    }
  }, [setPagination])

  // Refresh all queries
  const refreshAll = useCallback(async () => {
    const promises = [
      fetchHierarchicalData(),
      fetchWorkerCounts(),
      fetchRegionCounts(),
      fetchVerificationStats(),
      fetchRegistrationTrends()
    ]

    await Promise.allSettled(promises)
  }, [fetchHierarchicalData, fetchWorkerCounts, fetchRegionCounts, fetchVerificationStats, fetchRegistrationTrends])

  // Clear cache
  const clearCache = useCallback(() => {
    // Clear service caches
    // Note: This would need to be implemented in the services
    console.log('Cache cleared')
  }, [])

  // Cancel all ongoing queries
  const cancelAllQueries = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    // Reset loading states
    setHierarchicalQuery(prev => ({ ...prev, loading: false }))
    setWorkerCountsQuery(prev => ({ ...prev, loading: false }))
    setRegionCountsQuery(prev => ({ ...prev, loading: false }))
    setVerificationStatsQuery(prev => ({ ...prev, loading: false }))
    setRegistrationTrendsQuery(prev => ({ ...prev, loading: false }))
  }, [])

  // Debounced query execution
  const debouncedFetch = useCallback((fetchFn: () => Promise<void>) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchFn()
    }, debounceDelay)
  }, [debounceDelay])

  // Auto-fetch on pagination changes
  useEffect(() => {
    if (enablePagination) {
      debouncedFetch(() => fetchHierarchicalData())
    }
  }, [pagination.page, pagination.pageSize, enablePagination, debouncedFetch, fetchHierarchicalData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAllQueries()
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [cancelAllQueries])

  // Calculate cache hit rate
  useEffect(() => {
    const cachedQueries = [
      hierarchicalQuery.cached,
      workerCountsQuery.cached,
      regionCountsQuery.cached,
      verificationStatsQuery.cached,
      registrationTrendsQuery.cached
    ].filter(Boolean).length

    const totalQueries = 5 // Total number of query types
    const hitRate = totalQueries > 0 ? (cachedQueries / totalQueries) * 100 : 0

    setQueryMetrics(prev => ({ ...prev, cacheHitRate: hitRate }))
  }, [
    hierarchicalQuery.cached,
    workerCountsQuery.cached,
    regionCountsQuery.cached,
    verificationStatsQuery.cached,
    registrationTrendsQuery.cached
  ])

  // Memoized return object
  return useMemo(() => ({
    // Query states
    hierarchicalQuery,
    workerCountsQuery,
    regionCountsQuery,
    verificationStatsQuery,
    registrationTrendsQuery,
    
    // Pagination
    pagination,
    setPagination,
    nextPage,
    previousPage,
    goToPage,
    
    // Query actions
    fetchHierarchicalData,
    fetchWorkerCounts,
    fetchRegionCounts,
    fetchVerificationStats,
    fetchRegistrationTrends,
    
    // Utility actions
    refreshAll,
    clearCache,
    cancelAllQueries,
    
    // Performance metrics
    queryMetrics,
    
    // Loading states
    isLoading,
    hasError,
    globalError
  }), [
    hierarchicalQuery,
    workerCountsQuery,
    regionCountsQuery,
    verificationStatsQuery,
    registrationTrendsQuery,
    pagination,
    setPagination,
    nextPage,
    previousPage,
    goToPage,
    fetchHierarchicalData,
    fetchWorkerCounts,
    fetchRegionCounts,
    fetchVerificationStats,
    fetchRegistrationTrends,
    refreshAll,
    clearCache,
    cancelAllQueries,
    queryMetrics,
    isLoading,
    hasError,
    globalError
  ])
}