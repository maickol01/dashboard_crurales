// KPI Card component - migrated and adapted from dashboard_afiliados
// Enhanced for worker-specific metrics

import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  icon?: LucideIcon
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo'
  loading?: boolean
  onClick?: () => void
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  color = 'blue',
  loading = false,
  onClick
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      border: 'border-blue-200'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      border: 'border-green-200'
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      border: 'border-yellow-200'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      border: 'border-red-200'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      border: 'border-purple-200'
    },
    indigo: {
      bg: 'bg-indigo-50',
      icon: 'text-indigo-600',
      border: 'border-indigo-200'
    }
  }

  const getTrendIcon = () => {
    if (!trend) return null
    
    if (trend.value > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />
    } else if (trend.value < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />
    } else {
      return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = () => {
    if (!trend) return 'text-gray-500'
    
    if (trend.isPositive !== undefined) {
      return trend.isPositive ? 'text-green-600' : 'text-red-600'
    }
    
    if (trend.value > 0) {
      return 'text-green-600'
    } else if (trend.value < 0) {
      return 'text-red-600'
    } else {
      return 'text-gray-500'
    }
  }

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      // Format large numbers with commas
      return val.toLocaleString('es-ES')
    }
    return val
  }

  if (loading) {
    return (
      <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              <div className="mt-2 h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`bg-white overflow-hidden shadow-sm rounded-lg border ${colorClasses[color].border} ${
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-center">
          {Icon && (
            <div className={`flex-shrink-0 p-2 rounded-md ${colorClasses[color].bg}`}>
              <Icon className={`h-6 w-6 ${colorClasses[color].icon}`} />
            </div>
          )}
          <div className={Icon ? 'ml-4' : ''}>
            <p className="text-sm font-medium text-gray-500 truncate">
              {title}
            </p>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">
              {formatValue(value)}
            </p>
            {trend && (
              <div className="ml-2 flex items-center">
                {getTrendIcon()}
                <span className={`ml-1 text-sm font-medium ${getTrendColor()}`}>
                  {Math.abs(trend.value)}%
                </span>
              </div>
            )}
          </div>
          
          {(subtitle || trend?.label) && (
            <p className="mt-1 text-sm text-gray-500">
              {subtitle}
              {trend?.label && (
                <span className={`ml-1 ${getTrendColor()}`}>
                  {trend.label}
                </span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default KPICard