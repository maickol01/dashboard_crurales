// Hierarchy service for Dashboard CRurales
// Optimized for handling hierarchical worker data with recursive queries
/* eslint-disable @typescript-eslint/no-explicit-any */

import { OptimizedSupabaseService } from './supabaseOptimized'
import type {
    HierarchicalWorker,
    FilterOptions,
    HierarchyStats,
    PerformanceMetrics,
    LocationInfo
} from '../types'
import type {
    LiderWithHierarchy,
    BrigadistaWithHierarchy,
    MovilizadorWithHierarchy
} from '../types/database'
import { ServiceError } from '../types/errors'

export class HierarchyService {
    private static readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
    private static cache = new Map<string, { data: unknown; timestamp: number }>()

    // Get hierarchical data with optimized recursive queries
    static async getHierarchicalData(filters?: FilterOptions): Promise<HierarchicalWorker[]> {
        try {
            const cacheKey = this.generateCacheKey('hierarchical-data', filters)
            const cached = this.getFromCache(cacheKey)

            if (cached) {
                return cached as HierarchicalWorker[]
            }

            const result = await OptimizedSupabaseService.getHierarchicalData({
                filters: this.convertFiltersToQuery(filters),
                orderBy: 'created_at',
                ascending: false
            })

            if (result.error || !result.data) {
                throw new ServiceError('Failed to fetch hierarchical data', result.error ? new Error(result.error.message) : undefined)
            }

            const hierarchicalData = this.transformToHierarchicalWorkers(result.data)
            this.setCache(cacheKey, hierarchicalData)

            return hierarchicalData
        } catch (error) {
            console.error('Error in getHierarchicalData:', error)
            throw error instanceof ServiceError ? error : new ServiceError('Hierarchy service error', error as Error)
        }
    }

    // Transform database result to HierarchicalWorker format
    private static transformToHierarchicalWorkers(data: LiderWithHierarchy[]): HierarchicalWorker[] {
        return data.map(lider => this.transformLiderToHierarchicalWorker(lider))
    }

    private static transformLiderToHierarchicalWorker(lider: LiderWithHierarchy): HierarchicalWorker {
        const brigadistas = (lider.brigadistas || []).map(brigadista =>
            this.transformBrigadistaToHierarchicalWorker(brigadista, lider.id)
        )

        const totalCiudadanos = this.calculateTotalCiudadanos(lider)

        return {
            id: lider.id,
            nombre: lider.nombre,
            role: 'lider',
            ciudadanosRegistrados: totalCiudadanos,
            ubicacion: this.extractLocationInfo(lider),
            children: brigadistas,
            performance: this.calculatePerformanceMetrics(lider, totalCiudadanos),
            isActive: this.isWorkerActive(lider.created_at),
            lastActivity: new Date(lider.created_at)
        }
    }

    private static transformBrigadistaToHierarchicalWorker(
        brigadista: BrigadistaWithHierarchy,
        parentId: string
    ): HierarchicalWorker {
        const movilizadores = (brigadista.movilizadores || []).map(movilizador =>
            this.transformMovilizadorToHierarchicalWorker(movilizador, brigadista.id)
        )

        const totalCiudadanos = brigadista.movilizadores?.reduce(
            (sum, mov) => sum + (mov.ciudadanos?.length || 0), 0
        ) || 0

        return {
            id: brigadista.id,
            nombre: brigadista.nombre,
            role: 'brigadista',
            ciudadanosRegistrados: totalCiudadanos,
            ubicacion: this.extractLocationInfo(brigadista),
            children: movilizadores,
            parentId,
            performance: this.calculatePerformanceMetrics(brigadista, totalCiudadanos),
            isActive: this.isWorkerActive(brigadista.created_at),
            lastActivity: new Date(brigadista.created_at)
        }
    }

    private static transformMovilizadorToHierarchicalWorker(
        movilizador: MovilizadorWithHierarchy,
        parentId: string
    ): HierarchicalWorker {
        const totalCiudadanos = movilizador.ciudadanos?.length || 0

        return {
            id: movilizador.id,
            nombre: movilizador.nombre,
            role: 'movilizador',
            ciudadanosRegistrados: totalCiudadanos,
            ubicacion: this.extractLocationInfo(movilizador),
            children: [], // Movilizadores don't have children in the hierarchy display
            parentId,
            performance: this.calculatePerformanceMetrics(movilizador, totalCiudadanos),
            isActive: this.isWorkerActive(movilizador.created_at),
            lastActivity: new Date(movilizador.created_at)
        }
    }

    // Calculate total ciudadanos for a lider (recursive)
    private static calculateTotalCiudadanos(lider: LiderWithHierarchy): number {
        return (lider.brigadistas || []).reduce((total, brigadista) => {
            return total + (brigadista.movilizadores || []).reduce((brigTotal, movilizador) => {
                return brigTotal + (movilizador.ciudadanos?.length || 0)
            }, 0)
        }, 0)
    }

    // Extract location information from worker record
    private static extractLocationInfo(worker: any): LocationInfo {
        return {
            entidad: worker.entidad,
            municipio: worker.municipio,
            seccion: worker.seccion,
            colonia: worker.colonia,
            codigo_postal: worker.codigo_postal
        }
    }

    // Calculate performance metrics for a worker
    private static calculatePerformanceMetrics(worker: any, ciudadanosCount: number): PerformanceMetrics {
        const verificationRate = worker.num_verificado ? 100 : 0
        const completitudDatos = this.calculateDataCompleteness(worker)

        return {
            ciudadanosRegistrados: ciudadanosCount,
            tasaVerificacion: verificationRate,
            completitudDatos,
            ranking: 0, // Will be calculated separately
            tendencia: this.calculateTrend(worker),
            ultimaActividad: new Date(worker.created_at)
        }
    }

    // Calculate data completeness percentage
    private static calculateDataCompleteness(worker: any): number {
        const fields = [
            'nombre', 'clave_electoral', 'curp', 'direccion', 'colonia',
            'codigo_postal', 'seccion', 'entidad', 'municipio', 'numero_cel'
        ]

        const completedFields = fields.filter(field => worker[field] && worker[field].trim() !== '').length
        return (completedFields / fields.length) * 100
    }

    // Calculate trend based on recent activity (simplified)
    private static calculateTrend(worker: any): 'up' | 'down' | 'stable' {
        // This is a simplified implementation
        // In a real scenario, you'd compare with historical data
        const daysSinceCreation = Math.floor(
            (Date.now() - new Date(worker.created_at).getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysSinceCreation < 7) return 'up'
        if (daysSinceCreation > 30) return 'down'
        return 'stable'
    }

    // Check if worker is considered active
    private static isWorkerActive(createdAt: string): boolean {
        const daysSinceCreation = Math.floor(
            (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
        )
        return daysSinceCreation <= 90 // Consider active if created within last 90 days
    }

    // Get hierarchy statistics
    static async getHierarchyStats(filters?: FilterOptions): Promise<HierarchyStats> {
        try {
            const hierarchicalData = await this.getHierarchicalData(filters)

            let totalLideres = 0
            let totalBrigadistas = 0
            let totalMovilizadores = 0
            let totalCiudadanos = 0
            let mostProductiveWorker = { id: '', name: '', role: '', ciudadanos: 0 }
            let deepestLevel = 1

            hierarchicalData.forEach(lider => {
                totalLideres++
                const liderCiudadanos = lider.ciudadanosRegistrados

                if (liderCiudadanos > mostProductiveWorker.ciudadanos) {
                    mostProductiveWorker = {
                        id: lider.id,
                        name: lider.nombre,
                        role: 'lider',
                        ciudadanos: liderCiudadanos
                    }
                }

                lider.children?.forEach(brigadista => {
                    totalBrigadistas++
                    deepestLevel = Math.max(deepestLevel, 2)

                    if (brigadista.ciudadanosRegistrados > mostProductiveWorker.ciudadanos) {
                        mostProductiveWorker = {
                            id: brigadista.id,
                            name: brigadista.nombre,
                            role: 'brigadista',
                            ciudadanos: brigadista.ciudadanosRegistrados
                        }
                    }

                    brigadista.children?.forEach(movilizador => {
                        totalMovilizadores++
                        deepestLevel = Math.max(deepestLevel, 3)
                        totalCiudadanos += movilizador.ciudadanosRegistrados

                        if (movilizador.ciudadanosRegistrados > mostProductiveWorker.ciudadanos) {
                            mostProductiveWorker = {
                                id: movilizador.id,
                                name: movilizador.nombre,
                                role: 'movilizador',
                                ciudadanos: movilizador.ciudadanosRegistrados
                            }
                        }
                    })
                })
            })

            return {
                totalLideres,
                totalBrigadistas,
                totalMovilizadores,
                totalCiudadanos,
                averageCiudadanosPorLider: totalLideres > 0 ? totalCiudadanos / totalLideres : 0,
                averageCiudadanosPorBrigadista: totalBrigadistas > 0 ? totalCiudadanos / totalBrigadistas : 0,
                averageCiudadanosPorMovilizador: totalMovilizadores > 0 ? totalCiudadanos / totalMovilizadores : 0,
                deepestLevel,
                mostProductiveWorker
            }
        } catch (error) {
            console.error('Error in getHierarchyStats:', error)
            throw new ServiceError('Failed to calculate hierarchy statistics', error as Error)
        }
    }

    // Get flattened hierarchy for table display
    static async getFlattenedHierarchy(filters?: FilterOptions): Promise<HierarchicalWorker[]> {
        try {
            const hierarchicalData = await this.getHierarchicalData(filters)
            return this.flattenHierarchy(hierarchicalData)
        } catch (error) {
            console.error('Error in getFlattenedHierarchy:', error)
            throw new ServiceError('Failed to flatten hierarchy', error as Error)
        }
    }

    // Flatten hierarchical data for table display
    private static flattenHierarchy(data: HierarchicalWorker[]): HierarchicalWorker[] {
        const flattened: HierarchicalWorker[] = []

        const flatten = (workers: HierarchicalWorker[], level: number = 0) => {
            workers.forEach(worker => {
                flattened.push({
                    ...worker,
                    // Add level information for indentation
                    level
                } as HierarchicalWorker & { level: number })

                if (worker.children && worker.children.length > 0) {
                    flatten(worker.children, level + 1)
                }
            })
        }

        flatten(data)
        return flattened
    }

    // Search workers by name or location
    static async searchWorkers(searchTerm: string, filters?: FilterOptions): Promise<HierarchicalWorker[]> {
        try {
            const hierarchicalData = await this.getHierarchicalData(filters)
            const flattened = this.flattenHierarchy(hierarchicalData)

            const searchLower = searchTerm.toLowerCase()

            return flattened.filter(worker =>
                worker.nombre.toLowerCase().includes(searchLower) ||
                worker.ubicacion.entidad?.toLowerCase().includes(searchLower) ||
                worker.ubicacion.municipio?.toLowerCase().includes(searchLower) ||
                worker.ubicacion.colonia?.toLowerCase().includes(searchLower) ||
                worker.ubicacion.seccion?.toLowerCase().includes(searchLower)
            )
        } catch (error) {
            console.error('Error in searchWorkers:', error)
            throw new ServiceError('Failed to search workers', error as Error)
        }
    }

    // Get workers by performance level
    static async getWorkersByPerformance(
        level: 'excellent' | 'good' | 'average' | 'poor',
        filters?: FilterOptions
    ): Promise<HierarchicalWorker[]> {
        try {
            const hierarchicalData = await this.getHierarchicalData(filters)
            const flattened = this.flattenHierarchy(hierarchicalData)

            return flattened.filter(worker => {
                const score = this.calculateOverallPerformanceScore(worker)

                switch (level) {
                    case 'excellent': return score >= 90
                    case 'good': return score >= 70 && score < 90
                    case 'average': return score >= 50 && score < 70
                    case 'poor': return score < 50
                    default: return false
                }
            })
        } catch (error) {
            console.error('Error in getWorkersByPerformance:', error)
            throw new ServiceError('Failed to get workers by performance', error as Error)
        }
    }

    // Calculate overall performance score
    private static calculateOverallPerformanceScore(worker: HierarchicalWorker): number {
        const { tasaVerificacion, completitudDatos } = worker.performance
        const activityScore = worker.isActive ? 100 : 0
        const registrationScore = Math.min(worker.ciudadanosRegistrados * 10, 100) // Cap at 100

        return (tasaVerificacion + completitudDatos + activityScore + registrationScore) / 4
    }

    // Convert filters to database query format
    private static convertFiltersToQuery(filters?: FilterOptions): Record<string, any> | undefined {
        if (!filters) return undefined

        const query: Record<string, any> = {}

        if (filters.regions && filters.regions.length > 0) {
            query.entidad = filters.regions[0] // Simplified - in production, handle multiple regions
        }

        if (filters.activeOnly) {
            // This would need to be handled differently in the actual query
            // For now, we'll filter after fetching
        }

        return Object.keys(query).length > 0 ? query : undefined
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

    private static setCache(key: string, data: any): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        })

        // Clean up old cache entries
        if (this.cache.size > 100) {
            const oldestKey = this.cache.keys().next().value
            if (oldestKey) {
                this.cache.delete(oldestKey)
            }
        }
    }

    // Clear cache
    static clearCache(): void {
        this.cache.clear()
    }
}