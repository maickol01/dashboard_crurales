// Optimized Supabase service layer for Dashboard CRurales
// Enhanced with performance optimizations and error handling

import { supabase } from '../lib/supabase'
import {
  DatabaseError,
  NetworkError,
  ServiceError,
  classifyError
} from '../types/errors'
import type {
  LiderWithHierarchy,
  WorkerCounts,
  RegionCounts,
  VerificationStats,
  RegistrationTrends,
  QueryOptions,
  DatabaseResult,
  BatchInsertResult
} from '../types/database'

// Circuit breaker for database operations
class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open'
      } else {
        throw new ServiceError('Circuit breaker is open')
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failures = 0
    this.state = 'closed'
  }

  private onFailure() {
    this.failures++
    this.lastFailureTime = Date.now()
    if (this.failures >= this.threshold) {
      this.state = 'open'
    }
  }
}

// Retry utility with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      const errorInfo = classifyError(error)

      if (!errorInfo.isRetryable || attempt === maxRetries) {
        throw error
      }

      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

export class OptimizedSupabaseService {
  private static circuitBreaker = new CircuitBreaker(5, 60000)
  private static readonly BATCH_SIZE = 1000
  // private static readonly QUERY_TIMEOUT = 30000 // Reserved for future use

  // Connection validation
  static async validateConnection(): Promise<void> {
    try {
      const { error } = await supabase
        .from('lideres')
        .select('id')
        .limit(1)

      if (error) {
        throw new NetworkError('Database connection failed', new Error(error.message))
      }
    } catch (error) {
      if (error instanceof NetworkError) throw error
      throw new NetworkError('Network connectivity issue', error as Error)
    }
  }

  // Optimized hierarchical data fetching with single nested query
  static async getHierarchicalData(options?: QueryOptions): Promise<DatabaseResult<LiderWithHierarchy[]>> {
    return this.circuitBreaker.execute(async () => {
      return withRetry(async () => {
        try {
          await this.validateConnection()

          let query = supabase
            .from('lideres')
            .select(`
              *,
              brigadistas (
                *,
                movilizadores (
                  *,
                  ciudadanos (*)
                )
              )
            `)

          // Apply filters if provided
          if (options?.filters) {
            Object.entries(options.filters).forEach(([key, value]) => {
              query = query.eq(key, value)
            })
          }

          // Apply ordering
          if (options?.orderBy) {
            query = query.order(options.orderBy, { 
              ascending: options.ascending ?? false 
            })
          } else {
            query = query.order('created_at', { ascending: false })
          }

          // Apply pagination
          if (options?.limit) {
            query = query.limit(options.limit)
          }
          if (options?.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 100) - 1)
          }

          const { data, error, count } = await query

          if (error) {
            throw new DatabaseError(
              'Failed to fetch hierarchical data',
              error.code,
              error.details as unknown as Record<string, unknown>,
              error.hint
            )
          }

          return {
            data: data as LiderWithHierarchy[] || [],
            error: null,
            count: count || 0
          }
        } catch (error) {
          const enhancedError = this.enhanceError(error, 'getHierarchicalData')
          return {
            data: null,
            error: enhancedError,
            count: 0
          }
        }
      })
    })
  }

  // Optimized worker counts with single aggregation query
  static async getWorkerCounts(): Promise<DatabaseResult<WorkerCounts>> {
    return this.circuitBreaker.execute(async () => {
      return withRetry(async () => {
        try {
          // Use parallel queries for better performance
          const [lideresResult, brigadistasResult, movilizadoresResult, ciudadanosResult] = await Promise.all([
            supabase.from('lideres').select('id', { count: 'exact', head: true }),
            supabase.from('brigadistas').select('id', { count: 'exact', head: true }),
            supabase.from('movilizadores').select('id', { count: 'exact', head: true }),
            supabase.from('ciudadanos').select('id', { count: 'exact', head: true })
          ])

          // Check for errors
          const errors = [lideresResult.error, brigadistasResult.error, movilizadoresResult.error, ciudadanosResult.error]
            .filter(Boolean)

          if (errors.length > 0) {
            throw new DatabaseError('Failed to fetch worker counts', errors[0]?.code)
          }

          const counts: WorkerCounts = {
            lideres: lideresResult.count || 0,
            brigadistas: brigadistasResult.count || 0,
            movilizadores: movilizadoresResult.count || 0,
            ciudadanos: ciudadanosResult.count || 0
          }

          return {
            data: counts,
            error: null
          }
        } catch (error) {
          return {
            data: null,
            error: this.enhanceError(error, 'getWorkerCounts')
          }
        }
      })
    })
  }

  // Optimized region-based counts
  static async getRegionCounts(regionType: 'entidad' | 'municipio' | 'seccion' = 'entidad'): Promise<DatabaseResult<RegionCounts[]>> {
    return this.circuitBreaker.execute(async () => {
      return withRetry(async () => {
        try {
          // Use a single query with aggregation for better performance
          const { data, error } = await supabase.rpc('get_region_counts', {
            region_type: regionType
          })

          if (error) {
            // Fallback to manual aggregation if RPC function doesn't exist
            return this.getRegionCountsFallback(regionType)
          }

          return {
            data: data || [],
            error: null
          }
        } catch (error) {
          return {
            data: null,
            error: this.enhanceError(error, 'getRegionCounts')
          }
        }
      })
    })
  }

  // Fallback method for region counts without RPC
  private static async getRegionCountsFallback(regionType: 'entidad' | 'municipio' | 'seccion'): Promise<DatabaseResult<RegionCounts[]>> {
    try {
      // This is a simplified fallback - in production, you'd want to optimize this further
      const { data: hierarchicalData, error } = await this.getHierarchicalData()

      if (error || !hierarchicalData) {
        throw new DatabaseError('Failed to fetch data for region counts')
      }

      const regionMap = new Map<string, RegionCounts>()

      // Process hierarchical data to count by region
      hierarchicalData.forEach(lider => {
        const regionKey = lider[regionType] || 'Unknown'
        
        if (!regionMap.has(regionKey)) {
          const regionCount: RegionCounts = {
            entidad: regionType === 'entidad' ? regionKey : '',
            municipio: regionType === 'municipio' ? regionKey : undefined,
            seccion: regionType === 'seccion' ? regionKey : undefined,
            lideres: 0,
            brigadistas: 0,
            movilizadores: 0,
            ciudadanos: 0,
            total: 0
          }
          regionMap.set(regionKey, regionCount)
        }

        const regionCount = regionMap.get(regionKey)!
        regionCount.lideres++

        lider.brigadistas?.forEach(brigadista => {
          regionCount.brigadistas++
          
          brigadista.movilizadores?.forEach(movilizador => {
            regionCount.movilizadores++
            regionCount.ciudadanos += movilizador.ciudadanos?.length || 0
          })
        })

        regionCount.total = regionCount.lideres + regionCount.brigadistas + regionCount.movilizadores + regionCount.ciudadanos
      })

      return {
        data: Array.from(regionMap.values()),
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error: this.enhanceError(error, 'getRegionCountsFallback')
      }
    }
  }

  // Optimized verification statistics
  static async getVerificationStats(): Promise<DatabaseResult<VerificationStats>> {
    return this.circuitBreaker.execute(async () => {
      return withRetry(async () => {
        try {
          // Use parallel queries for better performance
          const [lideresStats, brigadistasStats, movilizadoresStats, ciudadanosStats] = await Promise.all([
            this.getTableVerificationStats('lideres'),
            this.getTableVerificationStats('brigadistas'),
            this.getTableVerificationStats('movilizadores'),
            this.getTableVerificationStats('ciudadanos')
          ])

          const totalRecords = lideresStats.total + brigadistasStats.total + movilizadoresStats.total + ciudadanosStats.total
          const totalVerified = lideresStats.verified + brigadistasStats.verified + movilizadoresStats.verified + ciudadanosStats.verified

          const stats: VerificationStats = {
            total_records: totalRecords,
            verified_records: totalVerified,
            verification_rate: totalRecords > 0 ? (totalVerified / totalRecords) * 100 : 0,
            by_role: {
              lideres: {
                total: lideresStats.total,
                verified: lideresStats.verified,
                rate: lideresStats.total > 0 ? (lideresStats.verified / lideresStats.total) * 100 : 0
              },
              brigadistas: {
                total: brigadistasStats.total,
                verified: brigadistasStats.verified,
                rate: brigadistasStats.total > 0 ? (brigadistasStats.verified / brigadistasStats.total) * 100 : 0
              },
              movilizadores: {
                total: movilizadoresStats.total,
                verified: movilizadoresStats.verified,
                rate: movilizadoresStats.total > 0 ? (movilizadoresStats.verified / movilizadoresStats.total) * 100 : 0
              },
              ciudadanos: {
                total: ciudadanosStats.total,
                verified: ciudadanosStats.verified,
                rate: ciudadanosStats.total > 0 ? (ciudadanosStats.verified / ciudadanosStats.total) * 100 : 0
              }
            }
          }

          return {
            data: stats,
            error: null
          }
        } catch (error) {
          return {
            data: null,
            error: this.enhanceError(error, 'getVerificationStats')
          }
        }
      })
    })
  }

  // Helper method to get verification stats for a specific table
  private static async getTableVerificationStats(tableName: string): Promise<{ total: number; verified: number }> {
    const [totalResult, verifiedResult] = await Promise.all([
      supabase.from(tableName).select('id', { count: 'exact', head: true }),
      supabase.from(tableName).select('id', { count: 'exact', head: true }).eq('num_verificado', true)
    ])

    return {
      total: totalResult.count || 0,
      verified: verifiedResult.count || 0
    }
  }

  // Registration trends with optimized date queries
  static async getRegistrationTrends(days: number = 30): Promise<DatabaseResult<RegistrationTrends[]>> {
    return this.circuitBreaker.execute(async () => {
      return withRetry(async () => {
        try {
          const startDate = new Date()
          startDate.setDate(startDate.getDate() - days)

          // Use RPC function for better performance if available
          const { data, error } = await supabase.rpc('get_registration_trends', {
            start_date: startDate.toISOString(),
            end_date: new Date().toISOString()
          })

          if (error) {
            // Fallback to manual aggregation
            return this.getRegistrationTrendsFallback(days)
          }

          return {
            data: data || [],
            error: null
          }
        } catch (error) {
          return {
            data: null,
            error: this.enhanceError(error, 'getRegistrationTrends')
          }
        }
      })
    })
  }

  // Fallback method for registration trends
  private static async getRegistrationTrendsFallback(days: number): Promise<DatabaseResult<RegistrationTrends[]>> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Get data from all tables with date filtering
      const [lideresData, brigadistasData, movilizadoresData, ciudadanosData] = await Promise.all([
        supabase.from('lideres').select('created_at').gte('created_at', startDate.toISOString()),
        supabase.from('brigadistas').select('created_at').gte('created_at', startDate.toISOString()),
        supabase.from('movilizadores').select('created_at').gte('created_at', startDate.toISOString()),
        supabase.from('ciudadanos').select('created_at').gte('created_at', startDate.toISOString())
      ])

      // Process and aggregate by date
      const dateMap = new Map<string, RegistrationTrends>()

      const processData = (data: { created_at: string }[], role: keyof Omit<RegistrationTrends, 'date' | 'total'>) => {
        data?.forEach(record => {
          const date = new Date(record.created_at).toISOString().split('T')[0]
          
          if (!dateMap.has(date)) {
            dateMap.set(date, {
              date,
              lideres: 0,
              brigadistas: 0,
              movilizadores: 0,
              ciudadanos: 0,
              total: 0
            })
          }

          const trend = dateMap.get(date)!
          trend[role]++
          trend.total++
        })
      }

      processData(lideresData.data || [], 'lideres')
      processData(brigadistasData.data || [], 'brigadistas')
      processData(movilizadoresData.data || [], 'movilizadores')
      processData(ciudadanosData.data || [], 'ciudadanos')

      const trends = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date))

      return {
        data: trends,
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error: this.enhanceError(error, 'getRegistrationTrendsFallback')
      }
    }
  }

  // Batch operations for better performance
  static async batchInsert<T>(tableName: string, records: T[]): Promise<BatchInsertResult> {
    const result: BatchInsertResult = {
      successful: 0,
      failed: 0,
      errors: []
    }

    // Process in batches to avoid timeout
    for (let i = 0; i < records.length; i += this.BATCH_SIZE) {
      const batch = records.slice(i, i + this.BATCH_SIZE)
      
      try {
        const { error } = await supabase.from(tableName).insert(batch)
        
        if (error) {
          result.failed += batch.length
          result.errors.push({
            message: error.message,
            code: error.code,
            details: error.details
          })
        } else {
          result.successful += batch.length
        }
      } catch (error) {
        result.failed += batch.length
        result.errors.push({
          message: (error as Error).message
        })
      }
    }

    return result
  }

  // Enhanced error handling
  private static enhanceError(error: unknown, context: string): DatabaseError {
    if (error instanceof DatabaseError) {
      return error
    }

    const errorInfo = classifyError(error)
    
    return new DatabaseError(
      `${context}: ${errorInfo.message}`,
      errorInfo.type,
      { context, originalError: error }
    )
  }

  // Query performance monitoring
  static async executeWithMetrics<T>(
    queryName: string,
    operation: () => Promise<T>
  ): Promise<{ result: T; metrics: { executionTime: number; success: boolean } }> {
    const startTime = performance.now()
    let success = false

    try {
      const result = await operation()
      success = true
      return {
        result,
        metrics: {
          executionTime: performance.now() - startTime,
          success
        }
      }
    } finally {
      const executionTime = performance.now() - startTime
      console.log(`Query ${queryName}: ${executionTime.toFixed(2)}ms, Success: ${success}`)
    }
  }
}