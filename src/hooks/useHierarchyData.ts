// Custom hook for managing hierarchical worker data
// Provides optimized data fetching, caching, and state management for hierarchy operations

import { useState, useEffect, useCallback, useMemo } from 'react'
import { HierarchyService } from '../services/hierarchyService'
import type {
  HierarchicalWorker,
  FilterOptions,
  HierarchyStats
} from '../types'
import { ServiceError } from '../types/errors'

// Hook options interface
interface UseHierarchyDataOptions {
  autoFetch?: boolean
  enableCache?: boolean
  refreshInterval?: number
  filters?: FilterOptions
}

// Hook return type
interface UseHierarchyDataReturn {
  // Data
  data: HierarchicalWorker[]
  flattenedData: HierarchicalWorker[]
  stats: HierarchyStats | null
  
  // Loading states
  loading: boolean
  loadingStats: boolean
  error: string | null
  
  // Actions
  fetchData: () => Promise<void>
  fetchStats: () => Promise<void>
  refreshData: () => Promise<void>
  clearCache: () => void
  
  // Search and filtering
  searchWorkers: (searchTerm: string) => Promise<HierarchicalWorker[]>
  filterByPerformance: (level: 'excellent' | 'good' | 'average' | 'poor') => Promise<HierarchicalWorker[]>
  
  // Expansion state management
  expandedNodes: Set<string>
  toggleExpansion: (nodeId: string) => void
  expandAll: () => void
  collapseAll: () => void
  
  // Selection state management
  selectedNodes: Set<string>
  toggleSelection: (nodeId: string) => void
  selectAll: () => void
  selectNone: () => void
  
  // Utility functions
  getWorkerById: (id: string) => HierarchicalWorker | null
  getWorkerPath: (id: string) => HierarchicalWorker[]
  getChildrenCount: (id: string) => number
}

export function useHierarchyData(options: UseHierarchyDataOptions = {}): UseHierarchyDataReturn {
  const {
    autoFetch = true,
    enableCache = true,
    refreshInterval,
    filters
  } = options

  // State management
  const [data, setData] = useState<HierarchicalWorker[]>([])
  const [flattenedData, setFlattenedData] = useState<HierarchicalWorker[]>([])
  const [stats, setStats] = useState<HierarchyStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingStats, setLoadingStats] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Expansion state
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  
  // Selection state
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set())

  // Fetch hierarchical data
  const fetchData = useCallback(async () => {
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      const hierarchicalData = await HierarchyService.getHierarchicalData(filters)
      const flattened = await HierarchyService.getFlattenedHierarchy(filters)
      
      setData(hierarchicalData)
      setFlattenedData(flattened)
    } catch (err) {
      const errorMessage = err instanceof ServiceError ? err.message : 'Failed to fetch hierarchy data'
      setError(errorMessage)
      console.error('Error fetching hierarchy data:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, loading])

  // Fetch hierarchy statistics
  const fetchStats = useCallback(async () => {
    if (loadingStats) return

    setLoadingStats(true)

    try {
      const hierarchyStats = await HierarchyService.getHierarchyStats(filters)
      setStats(hierarchyStats)
    } catch (err) {
      console.error('Error fetching hierarchy stats:', err)
      // Don't set error for stats as it's not critical
    } finally {
      setLoadingStats(false)
    }
  }, [filters, loadingStats])

  // Refresh data (force refetch)
  const refreshData = useCallback(async () => {
    if (enableCache) {
      HierarchyService.clearCache()
    }
    await Promise.all([fetchData(), fetchStats()])
  }, [fetchData, fetchStats, enableCache])

  // Clear cache
  const clearCache = useCallback(() => {
    HierarchyService.clearCache()
  }, [])

  // Search workers
  const searchWorkers = useCallback(async (searchTerm: string): Promise<HierarchicalWorker[]> => {
    try {
      return await HierarchyService.searchWorkers(searchTerm, filters)
    } catch (err) {
      console.error('Error searching workers:', err)
      return []
    }
  }, [filters])

  // Filter by performance level
  const filterByPerformance = useCallback(async (level: 'excellent' | 'good' | 'average' | 'poor'): Promise<HierarchicalWorker[]> => {
    try {
      return await HierarchyService.getWorkersByPerformance(level, filters)
    } catch (err) {
      console.error('Error filtering by performance:', err)
      return []
    }
  }, [filters])

  // Expansion state management
  const toggleExpansion = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }, [])

  const expandAll = useCallback(() => {
    const allNodeIds = new Set<string>()
    
    const collectNodeIds = (workers: HierarchicalWorker[]) => {
      workers.forEach(worker => {
        allNodeIds.add(worker.id)
        if (worker.children && worker.children.length > 0) {
          collectNodeIds(worker.children)
        }
      })
    }
    
    collectNodeIds(data)
    setExpandedNodes(allNodeIds)
  }, [data])

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set())
  }, [])

  // Selection state management
  const toggleSelection = useCallback((nodeId: string) => {
    setSelectedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }, [])

  const selectAll = useCallback(() => {
    const allNodeIds = new Set<string>()
    
    const collectNodeIds = (workers: HierarchicalWorker[]) => {
      workers.forEach(worker => {
        allNodeIds.add(worker.id)
        if (worker.children && worker.children.length > 0) {
          collectNodeIds(worker.children)
        }
      })
    }
    
    collectNodeIds(data)
    setSelectedNodes(allNodeIds)
  }, [data])

  const selectNone = useCallback(() => {
    setSelectedNodes(new Set())
  }, [])

  // Utility functions
  const getWorkerById = useCallback((id: string): HierarchicalWorker | null => {
    const findWorker = (workers: HierarchicalWorker[]): HierarchicalWorker | null => {
      for (const worker of workers) {
        if (worker.id === id) {
          return worker
        }
        if (worker.children && worker.children.length > 0) {
          const found = findWorker(worker.children)
          if (found) return found
        }
      }
      return null
    }
    
    return findWorker(data)
  }, [data])

  const getWorkerPath = useCallback((id: string): HierarchicalWorker[] => {
    const path: HierarchicalWorker[] = []
    
    const findPath = (workers: HierarchicalWorker[], targetId: string): boolean => {
      for (const worker of workers) {
        path.push(worker)
        
        if (worker.id === targetId) {
          return true
        }
        
        if (worker.children && worker.children.length > 0) {
          if (findPath(worker.children, targetId)) {
            return true
          }
        }
        
        path.pop()
      }
      return false
    }
    
    findPath(data, id)
    return path
  }, [data])

  const getChildrenCount = useCallback((id: string): number => {
    const worker = getWorkerById(id)
    if (!worker) return 0
    
    const countChildren = (w: HierarchicalWorker): number => {
      let count = 0
      if (w.children && w.children.length > 0) {
        count += w.children.length
        w.children.forEach(child => {
          count += countChildren(child)
        })
      }
      return count
    }
    
    return countChildren(worker)
  }, [getWorkerById])

  // Auto-fetch on mount and filter changes
  useEffect(() => {
    if (autoFetch) {
      fetchData()
      fetchStats()
    }
  }, [autoFetch, fetchData, fetchStats])

  // Setup refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        refreshData()
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [refreshInterval, refreshData])

  // Memoized return object
  return useMemo(() => ({
    // Data
    data,
    flattenedData,
    stats,
    
    // Loading states
    loading,
    loadingStats,
    error,
    
    // Actions
    fetchData,
    fetchStats,
    refreshData,
    clearCache,
    
    // Search and filtering
    searchWorkers,
    filterByPerformance,
    
    // Expansion state management
    expandedNodes,
    toggleExpansion,
    expandAll,
    collapseAll,
    
    // Selection state management
    selectedNodes,
    toggleSelection,
    selectAll,
    selectNone,
    
    // Utility functions
    getWorkerById,
    getWorkerPath,
    getChildrenCount
  }), [
    data,
    flattenedData,
    stats,
    loading,
    loadingStats,
    error,
    fetchData,
    fetchStats,
    refreshData,
    clearCache,
    searchWorkers,
    filterByPerformance,
    expandedNodes,
    toggleExpansion,
    expandAll,
    collapseAll,
    selectedNodes,
    toggleSelection,
    selectAll,
    selectNone,
    getWorkerById,
    getWorkerPath,
    getChildrenCount
  ])
}