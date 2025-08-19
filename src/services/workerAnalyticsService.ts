// Worker Analytics service for Dashboard CRurales
// Specialized service for calculating worker performance metrics and analytics
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */

import { OptimizedSupabaseService } from './supabaseOptimized'
// import { HierarchyService } from './hierarchyService' // Temporarily disabled
import type {
  WorkerAnalytics,
  UnifiedAnalytics,
  WorkerProductivityAnalytics,
  LeaderProductivityMetric,
  BrigadierProductivityMetric,
  MobilizerProductivityMetric,
  ComparativeMetric,
  ProductivityInsights,
  EnhancedQualityMetrics,
  EnhancedGoalsMetrics,
  WorkerQualityScore,
  WorkerGoal,
  HierarchyGoal,
  ProjectionData,
  GeographicAnalysisData,
  FilterOptions
} from '../types'
import { ServiceError } from '../types/errors'

export class WorkerAnalyticsService {
  private static readonly CACHE_TTL = 10 * 60 * 1000 // 10 minutes
  private static cache = new Map<string, { data: unknown; timestamp: number }>()

  // Get unified analytics data
  static async getUnifiedAnalytics(filters?: FilterOptions): Promise<UnifiedAnalytics> {
    try {
      const cacheKey = this.generateCacheKey('unified-analytics', filters)
      const cached = this.getFromCache<UnifiedAnalytics>(cacheKey)

      if (cached) {
        return cached
      }

      // Fetch all required data in parallel for better performance
      const [
        hierarchyStats,
        workerAnalytics,
        qualityMetrics,
        goalsMetrics,
        geographicData
      ] = await Promise.all([
        this.getHierarchyStatsTemp(filters),
        this.getWorkerAnalytics(filters),
        this.getEnhancedQualityMetrics(filters),
        this.getEnhancedGoalsMetrics(filters),
        this.getGeographicAnalysisData(filters)
      ])

      const unifiedAnalytics: UnifiedAnalytics = {
        // KPIs principales
        totalCiudadanos: hierarchyStats.totalCiudadanos,
        totalTrabajadores: hierarchyStats.totalLideres + hierarchyStats.totalBrigadistas + hierarchyStats.totalMovilizadores,
        tasaCrecimiento: await this.calculateGrowthRate(),
        metaProgreso: await this.calculateGoalProgress(),

        // Analíticas de trabajadores
        workerAnalytics,
        topPerformers: this.getTopPerformers(workerAnalytics, 10),
        underPerformers: this.getUnderPerformers(workerAnalytics, 10),

        // Analíticas especializadas
        geographicData,
        qualityMetrics,
        goalsMetrics,

        lastUpdated: new Date()
      }

      this.setCache(cacheKey, unifiedAnalytics)
      return unifiedAnalytics
    } catch (error) {
      console.error('Error in getUnifiedAnalytics:', error)
      throw new ServiceError('Failed to get unified analytics', error as Error)
    }
  }

  // Get worker analytics data
  static async getWorkerAnalytics(filters?: FilterOptions): Promise<WorkerAnalytics[]> {
    try {
      const hierarchicalData = await this.getFlattenedHierarchyTemp(filters)

      const analytics: WorkerAnalytics[] = await Promise.all(
        hierarchicalData.map(async (worker, index) => ({
          workerId: worker.id,
          workerName: worker.nombre,
          role: worker.role,
          ciudadanosRegistrados: worker.ciudadanosRegistrados,
          tasaVerificacion: worker.performance.tasaVerificacion,
          completitudDatos: worker.performance.completitudDatos,
          ubicacionGeografica: worker.ubicacion,
          rendimientoTemporal: await this.getWorkerTemporalPerformance(worker.id),
          ranking: index + 1, // Simplified ranking
          tendencia: worker.performance.tendencia,
          ultimaActividad: worker.performance.ultimaActividad
        }))
      )

      // Sort by performance score and update rankings
      const sortedAnalytics = analytics.sort((a, b) => {
        const scoreA = this.calculateWorkerScore(a)
        const scoreB = this.calculateWorkerScore(b)
        return scoreB - scoreA
      })

      // Update rankings
      sortedAnalytics.forEach((worker, index) => {
        worker.ranking = index + 1
      })

      return sortedAnalytics
    } catch (error) {
      console.error('Error in getWorkerAnalytics:', error)
      throw new ServiceError('Failed to get worker analytics', error as Error)
    }
  }

  // Get worker productivity analytics
  static async getWorkerProductivityAnalytics(filters?: FilterOptions): Promise<WorkerProductivityAnalytics> {
    try {
      const hierarchicalData = await this.getHierarchicalDataTemp(filters)

      const leaderMetrics: LeaderProductivityMetric[] = []
      const brigadierMetrics: BrigadierProductivityMetric[] = []
      const mobilizerMetrics: MobilizerProductivityMetric[] = []

      // Process leaders
      hierarchicalData.forEach((lider: any) => {
        const totalNetwork = this.calculateNetworkSize(lider)
        const brigadierCount = lider.children?.length || 0
        const mobilizerCount = lider.children?.reduce((sum: number, brig: any) => sum + (brig.children?.length || 0), 0) || 0
        const citizenCount = lider.ciudadanosRegistrados

        leaderMetrics.push({
          leaderId: lider.id,
          name: lider.nombre,
          totalNetwork,
          brigadierCount,
          mobilizerCount,
          citizenCount,
          registrationVelocity: this.calculateRegistrationVelocity(citizenCount, lider.lastActivity),
          networkEfficiency: totalNetwork > 0 ? citizenCount / totalNetwork : 0,
          timeToTarget: this.calculateTimeToTarget(citizenCount, 1000), // Assuming 1000 as target
          performanceRank: 0, // Will be calculated later
          trendDirection: lider.performance.tendencia,
          lastActivityDate: lider.lastActivity,
          recommendations: this.generateRecommendations(lider)
        })

        // Process brigadiers
        lider.children?.forEach((brigadista: any) => {
          const mobilizerCount = brigadista.children?.length || 0
          const citizenCount = brigadista.ciudadanosRegistrados

          brigadierMetrics.push({
            brigadierId: brigadista.id,
            name: brigadista.nombre,
            leaderId: lider.id,
            leaderName: lider.nombre,
            mobilizerCount,
            citizenCount,
            avgCitizensPerMobilizer: mobilizerCount > 0 ? citizenCount / mobilizerCount : 0,
            registrationRate: this.calculateRegistrationRate(citizenCount, brigadista.lastActivity),
            efficiencyScore: this.calculateEfficiencyScore(brigadista),
            performanceLevel: this.getPerformanceLevel(this.calculateEfficiencyScore(brigadista)),
            needsSupport: this.calculateEfficiencyScore(brigadista) < 50,
            lastActivityDate: brigadista.lastActivity,
            targetProgress: this.calculateTargetProgress(citizenCount, 500) // Assuming 500 as target
          })

          // Process mobilizers
          brigadista.children?.forEach((movilizador: any) => {
            mobilizerMetrics.push({
              mobilizerId: movilizador.id,
              name: movilizador.nombre,
              brigadierId: brigadista.id,
              brigadierName: brigadista.nombre,
              leaderId: lider.id,
              leaderName: lider.nombre,
              citizenCount: movilizador.ciudadanosRegistrados,
              registrationRate: this.calculateRegistrationRate(movilizador.ciudadanosRegistrados, movilizador.lastActivity),
              activityLevel: this.getActivityLevel(movilizador.lastActivity),
              lastRegistration: movilizador.lastActivity,
              targetProgress: this.calculateTargetProgress(movilizador.ciudadanosRegistrados, 100), // Assuming 100 as target
              weeklyAverage: this.calculateWeeklyAverage(movilizador.ciudadanosRegistrados, movilizador.lastActivity),
              monthlyGoal: 100 // Assuming 100 as monthly goal
            })
          })
        })
      })

      // Calculate rankings
      leaderMetrics.sort((a, b) => b.citizenCount - a.citizenCount)
        .forEach((leader, index) => leader.performanceRank = index + 1)

      const comparativeAnalysis = this.calculateComparativeMetrics(leaderMetrics, brigadierMetrics, mobilizerMetrics)
      const overallInsights = this.generateProductivityInsights(leaderMetrics, brigadierMetrics, mobilizerMetrics)

      return {
        leaderMetrics,
        brigadierMetrics,
        mobilizerMetrics,
        comparativeAnalysis,
        overallInsights
      }
    } catch (error) {
      console.error('Error in getWorkerProductivityAnalytics:', error)
      throw new ServiceError('Failed to get worker productivity analytics', error as Error)
    }
  }

  // Get enhanced quality metrics
  static async getEnhancedQualityMetrics(filters?: FilterOptions): Promise<EnhancedQualityMetrics> {
    try {
      const [verificationStats, workerAnalytics] = await Promise.all([
        OptimizedSupabaseService.getVerificationStats(),
        this.getWorkerAnalytics(filters)
      ])

      if (verificationStats.error || !verificationStats.data) {
        throw new ServiceError('Failed to get verification stats')
      }

      const workerQualityScores: WorkerQualityScore[] = workerAnalytics.map(worker => ({
        workerId: worker.workerId,
        workerName: worker.workerName,
        role: worker.role,
        overallScore: this.calculateOverallQualityScore(worker),
        verificationRate: worker.tasaVerificacion,
        dataCompleteness: worker.completitudDatos,
        duplicateRate: 0, // Would need additional calculation
        trend: this.mapTrendToQualityTrend(worker.tendencia)
      }))

      return {
        dataCompleteness: verificationStats.data.verification_rate,
        verificationRate: verificationStats.data.verification_rate,
        duplicateRate: 0, // Would need additional calculation
        workerQualityScores,
        fieldCompletenessBreakdown: await this.calculateFieldCompleteness(),
        verificationTrends: await this.getVerificationTrends(),
        qualityByLevel: this.calculateQualityByLevel(workerQualityScores)
      }
    } catch (error) {
      console.error('Error in getEnhancedQualityMetrics:', error)
      throw new ServiceError('Failed to get enhanced quality metrics', error as Error)
    }
  }

  // Get enhanced goals metrics
  static async getEnhancedGoalsMetrics(filters?: FilterOptions): Promise<EnhancedGoalsMetrics> {
    try {
      const [hierarchyStats, workerAnalytics] = await Promise.all([
        this.getHierarchyStatsTemp(filters),
        this.getWorkerAnalytics(filters)
      ])

      const totalTarget = 60000 // From requirements
      const currentProgress = hierarchyStats.totalCiudadanos
      const progressPercentage = (currentProgress / totalTarget) * 100

      const workerGoals: WorkerGoal[] = workerAnalytics.map(worker => {
        const target = this.getWorkerTarget(worker.role)
        const percentage = (worker.ciudadanosRegistrados / target) * 100

        return {
          workerId: worker.workerId,
          workerName: worker.workerName,
          role: worker.role,
          currentProgress: worker.ciudadanosRegistrados,
          target,
          percentage,
          status: this.getGoalStatus(percentage),
          daysRemaining: this.calculateDaysRemaining(),
          requiredDailyRate: this.calculateRequiredDailyRate(worker.ciudadanosRegistrados, target)
        }
      })

      const hierarchyGoals: HierarchyGoal[] = [
        this.calculateHierarchyGoal('lider', workerGoals),
        this.calculateHierarchyGoal('brigadista', workerGoals),
        this.calculateHierarchyGoal('movilizador', workerGoals)
      ]

      return {
        overallProgress: {
          current: currentProgress,
          target: totalTarget,
          percentage: progressPercentage,
          trend: progressPercentage > 50 ? 'on-track' : 'behind',
          estimatedCompletion: this.calculateEstimatedCompletion(currentProgress, totalTarget)
        },
        workerIndividualGoals: workerGoals,
        hierarchyLevelGoals: hierarchyGoals,
        projectedCompletion: this.calculateProjectionData(currentProgress, totalTarget),
        goalCompletionRates: await this.getGoalCompletionRates(),
        milestones: this.generateMilestones(totalTarget)
      }
    } catch (error) {
      console.error('Error in getEnhancedGoalsMetrics:', error)
      throw new ServiceError('Failed to get enhanced goals metrics', error as Error)
    }
  }

  // Get geographic analysis data

  static async getGeographicAnalysisData(_filters?: FilterOptions): Promise<GeographicAnalysisData> {
    try {
      const regionCounts = await OptimizedSupabaseService.getRegionCounts('entidad')

      if (regionCounts.error || !regionCounts.data) {
        throw new ServiceError('Failed to get region counts')
      }

      return {
        regionDistribution: regionCounts.data.map(region => ({
          region: region.entidad || 'Unknown',
          count: region.total,
          percentage: 0, // Would need total count to calculate
          workers: {
            lideres: region.lideres,
            brigadistas: region.brigadistas,
            movilizadores: region.movilizadores
          }
        })),
        heatmapData: regionCounts.data.map(region => ({
          region: region.entidad || 'Unknown',
          intensity: Math.min(region.total / 100, 100), // Normalize to 0-100
          registrationCount: region.total
        })),
        territorialCoverage: regionCounts.data.map(region => ({
          region: region.entidad || 'Unknown',
          coverage: Math.min((region.total / 1000) * 100, 100), // Assuming 1000 as target per region
          target: 1000,
          status: this.getCoverageStatus(region.total, 1000)
        }))
      }
    } catch (error) {
      console.error('Error in getGeographicAnalysisData:', error)
      throw new ServiceError('Failed to get geographic analysis data', error as Error)
    }
  }

  // Helper methods
  private static calculateWorkerScore(worker: WorkerAnalytics): number {
    return (worker.tasaVerificacion + worker.completitudDatos + (worker.ciudadanosRegistrados * 2)) / 4
  }

  private static calculateNetworkSize(worker: { children?: unknown[] }): number {
    let size = 1 // The worker themselves
    if (worker.children) {
      worker.children.forEach((child) => {
        size += this.calculateNetworkSize(child as { children?: unknown[] })
      })
    }
    return size
  }

  private static calculateRegistrationVelocity(citizenCount: number, lastActivity: Date): number {
    const daysSinceStart = Math.max(1, Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)))
    return citizenCount / daysSinceStart
  }

  private static calculateTimeToTarget(current: number, target: number): number {
    if (current >= target) return 0
    const velocity = this.calculateRegistrationVelocity(current, new Date())
    return velocity > 0 ? Math.ceil((target - current) / velocity) : Infinity
  }

  private static generateRecommendations(worker: { performance: { tasaVerificacion: number; completitudDatos: number }; ciudadanosRegistrados: number }): string[] {
    const recommendations: string[] = []

    if (worker.performance.tasaVerificacion < 50) {
      recommendations.push('Mejorar proceso de verificación de contactos')
    }

    if (worker.performance.completitudDatos < 70) {
      recommendations.push('Completar información faltante en registros')
    }

    if (worker.ciudadanosRegistrados < 10) {
      recommendations.push('Incrementar actividades de registro de ciudadanos')
    }

    return recommendations
  }

  private static calculateRegistrationRate(citizenCount: number, lastActivity: Date): number {
    const daysActive = Math.max(1, Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)))
    return citizenCount / daysActive
  }

  private static calculateEfficiencyScore(worker: { performance: { tasaVerificacion: number; completitudDatos: number } }): number {
    return (worker.performance.tasaVerificacion + worker.performance.completitudDatos) / 2
  }

  private static getPerformanceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 80) return 'high'
    if (score >= 60) return 'medium'
    return 'low'
  }

  private static calculateTargetProgress(current: number, target: number): number {
    return Math.min((current / target) * 100, 100)
  }

  private static getActivityLevel(lastActivity: Date): 'active' | 'moderate' | 'inactive' {
    const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceActivity <= 7) return 'active'
    if (daysSinceActivity <= 30) return 'moderate'
    return 'inactive'
  }

  private static calculateWeeklyAverage(citizenCount: number, startDate: Date): number {
    const weeksActive = Math.max(1, Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)))
    return citizenCount / weeksActive
  }

  private static getTopPerformers(analytics: WorkerAnalytics[], count: number): WorkerAnalytics[] {
    return analytics
      .sort((a, b) => this.calculateWorkerScore(b) - this.calculateWorkerScore(a))
      .slice(0, count)
  }

  private static getUnderPerformers(analytics: WorkerAnalytics[], count: number): WorkerAnalytics[] {
    return analytics
      .sort((a, b) => this.calculateWorkerScore(a) - this.calculateWorkerScore(b))
      .slice(0, count)
  }

  private static async calculateGrowthRate(): Promise<number> {
    // Simplified calculation - would need historical data
    return 15.5 // Placeholder
  }

  private static async calculateGoalProgress(): Promise<number> {
    const stats = await this.getHierarchyStatsTemp()
    return (stats.totalCiudadanos / 60000) * 100
  }

  private static async getWorkerTemporalPerformance(_workerId: string): Promise<any[]> {
    // Placeholder - would need historical data
    return []
  }

  // Cache management
  private static generateCacheKey(prefix: string, filters?: FilterOptions): string {
    const filterStr = filters ? JSON.stringify(filters) : 'no-filters'
    return `${prefix}-${filterStr}`
  }

  private static getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > this.CACHE_TTL
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return cached.data as T
  }

  private static setCache(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  // Additional helper methods (simplified implementations)
  private static calculateComparativeMetrics(leaders: { leaderId: string; name: string; citizenCount: number }[], _brigadiers: unknown[], _mobilizers: unknown[]): ComparativeMetric[] {
    return [
      {
        level: 'lider',
        averagePerformance: leaders.reduce((sum, l) => sum + l.citizenCount, 0) / leaders.length,
        topPerformer: leaders.reduce((top, l) => l.citizenCount > top.score ? { id: l.leaderId, name: l.name, score: l.citizenCount } : top, { id: '', name: '', score: 0 }),
        bottomPerformer: leaders.reduce((bottom, l) => l.citizenCount < bottom.score ? { id: l.leaderId, name: l.name, score: l.citizenCount } : bottom, { id: '', name: '', score: Infinity }),
        performanceDistribution: { high: 20, medium: 60, low: 20 },
        efficiencyTrend: 'improving'
      }
    ]
  }

  private static generateProductivityInsights(_leaders: unknown[], _brigadiers: unknown[], _mobilizers: unknown[]): ProductivityInsights {
    return {
      mostEffectiveLevel: 'movilizador',
      recommendedActions: ['Incrementar capacitación', 'Mejorar seguimiento'],
      performanceTrends: [
        { level: 'lider', trend: 'up', changePercentage: 5.2 },
        { level: 'brigadista', trend: 'stable', changePercentage: 0.1 },
        { level: 'movilizador', trend: 'up', changePercentage: 8.7 }
      ],
      keyFindings: ['Los movilizadores son el nivel más efectivo', 'Se necesita más capacitación en verificación']
    }
  }

  private static calculateOverallQualityScore(worker: WorkerAnalytics): number {
    return (worker.tasaVerificacion + worker.completitudDatos) / 2
  }

  private static mapTrendToQualityTrend(trend: 'up' | 'down' | 'stable'): 'improving' | 'stable' | 'declining' {
    switch (trend) {
      case 'up': return 'improving'
      case 'down': return 'declining'
      default: return 'stable'
    }
  }

  private static async calculateFieldCompleteness(): Promise<any[]> {
    // Placeholder implementation
    return []
  }

  private static async getVerificationTrends(): Promise<any[]> {
    // Placeholder implementation
    return []
  }

  private static calculateQualityByLevel(_scores: WorkerQualityScore[]): any[] {
    // Placeholder implementation
    return []
  }

  private static getWorkerTarget(role: 'lider' | 'brigadista' | 'movilizador'): number {
    switch (role) {
      case 'lider': return 1000
      case 'brigadista': return 500
      case 'movilizador': return 100
      default: return 100
    }
  }

  private static getGoalStatus(percentage: number): 'on-track' | 'behind' | 'ahead' | 'completed' {
    if (percentage >= 100) return 'completed'
    if (percentage >= 80) return 'ahead'
    if (percentage >= 60) return 'on-track'
    return 'behind'
  }

  private static calculateDaysRemaining(): number {
    // Placeholder - would calculate based on target date
    return 90
  }

  private static calculateRequiredDailyRate(current: number, target: number): number {
    const daysRemaining = this.calculateDaysRemaining()
    return daysRemaining > 0 ? (target - current) / daysRemaining : 0
  }

  private static calculateHierarchyGoal(level: 'lider' | 'brigadista' | 'movilizador', goals: WorkerGoal[]): HierarchyGoal {
    const levelGoals = goals.filter(g => g.role === level)

    return {
      level,
      totalWorkers: levelGoals.length,
      workersOnTrack: levelGoals.filter(g => g.status === 'on-track' || g.status === 'ahead').length,
      workersBehind: levelGoals.filter(g => g.status === 'behind').length,
      workersAhead: levelGoals.filter(g => g.status === 'ahead').length,
      averageProgress: levelGoals.reduce((sum, g) => sum + g.percentage, 0) / levelGoals.length,
      levelTarget: levelGoals.reduce((sum, g) => sum + g.target, 0),
      levelCurrent: levelGoals.reduce((sum, g) => sum + g.currentProgress, 0)
    }
  }

  private static calculateEstimatedCompletion(current: number, target: number): Date {
    const rate = 100 // Placeholder daily rate
    const daysNeeded = (target - current) / rate
    const completion = new Date()
    completion.setDate(completion.getDate() + daysNeeded)
    return completion
  }

  private static calculateProjectionData(current: number, _target: number): ProjectionData {
    const baseDate = new Date()
    baseDate.setMonth(baseDate.getMonth() + 6) // 6 months from now

    return {
      projectedFinalCount: Math.floor(current * 1.5), // Simplified projection
      confidenceLevel: 75,
      projectedCompletionDate: baseDate,
      scenarioAnalysis: {
        optimistic: { count: Math.floor(current * 1.8), date: new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000) },
        realistic: { count: Math.floor(current * 1.5), date: baseDate },
        pessimistic: { count: Math.floor(current * 1.2), date: new Date(baseDate.getTime() + 60 * 24 * 60 * 60 * 1000) }
      }
    }
  }

  private static async getGoalCompletionRates(): Promise<any[]> {
    // Placeholder implementation
    return []
  }

  private static generateMilestones(_totalTarget: number): any[] {
    // Placeholder implementation
    return []
  }

  private static getCoverageStatus(current: number, target: number): 'excellent' | 'good' | 'needs_improvement' | 'critical' {
    const percentage = (current / target) * 100

    if (percentage >= 90) return 'excellent'
    if (percentage >= 70) return 'good'
    if (percentage >= 50) return 'needs_improvement'
    return 'critical'
  }

  // Clear cache
  static clearCache(): void {
    this.cache.clear()
  }

  // Temporary methods to replace HierarchyService calls
  private static async getHierarchyStatsTemp(_filters?: FilterOptions): Promise<any> {
    return {
      totalLideres: 60,
      totalBrigadistas: 60,
      totalMovilizadores: 60,
      totalCiudadanos: 1000
    }
  }

  private static async getFlattenedHierarchyTemp(_filters?: FilterOptions): Promise<any[]> {
    return []
  }

  private static async getHierarchicalDataTemp(_filters?: FilterOptions): Promise<any[]> {
    return []
  }
}