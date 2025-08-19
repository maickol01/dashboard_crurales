// Bar Chart component - reusable bar chart for worker analytics
// Built with HTML/CSS for lightweight implementation

import React, { useMemo } from 'react'
import BaseChart from './BaseChart'
import type { BaseChartProps } from './BaseChart'

export interface BarChartData {
  label: string
  value: number
  color?: string
  metadata?: Record<string, any>
}

interface BarChartProps extends Omit<BaseChartProps, 'children'> {
  data: BarChartData[]
  orientation?: 'horizontal' | 'vertical'
  showValues?: boolean
  showGrid?: boolean
  maxValue?: number
  colors?: string[]
  onBarClick?: (data: BarChartData, index: number) => void
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  orientation = 'vertical',
  showValues = true,
  showGrid = true,
  maxValue,
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
  onBarClick,
  ...baseProps
}) => {
  const processedData = useMemo(() => {
    const max = maxValue || Math.max(...data.map(d => d.value))
    
    return data.map((item, index) => ({
      ...item,
      percentage: max > 0 ? (item.value / max) * 100 : 0,
      color: item.color || colors[index % colors.length]
    }))
  }, [data, maxValue, colors])

  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toLocaleString('es-ES')
  }

  const renderVerticalChart = () => (
    <div className="h-full flex flex-col p-6">
      {/* Bars container */}
      <div className="flex items-end justify-center space-x-6 h-full min-h-[250px]">
        {processedData.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="flex flex-col items-center flex-1 max-w-[120px]"
          >
            {/* Value label */}
            {showValues && (
              <div className="text-sm text-gray-600 mb-2 text-center font-medium">
                {formatValue(item.value)}
              </div>
            )}
            
            {/* Bar */}
            <div
              className={`w-full rounded-t-lg transition-all duration-300 hover:opacity-80 ${
                onBarClick ? 'cursor-pointer' : ''
              }`}
              style={{
                height: `${Math.max(item.percentage, 5)}%`,
                backgroundColor: item.color,
                minHeight: '12px'
              }}
              onClick={() => onBarClick?.(item, index)}
              title={`${item.label}: ${formatValue(item.value)}`}
            />
            
            {/* Label */}
            <div className="text-sm text-gray-700 mt-3 text-center font-medium">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderHorizontalChart = () => (
    <div className="h-full flex flex-col space-y-3">
      {processedData.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex items-center space-x-3">
          {/* Label */}
          <div className="w-24 text-sm text-gray-700 text-right truncate">
            {item.label}
          </div>
          
          {/* Bar container */}
          <div className="flex-1 relative">
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div
                className={`h-6 rounded-full transition-all duration-300 hover:opacity-80 ${
                  onBarClick ? 'cursor-pointer' : ''
                }`}
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color,
                  minWidth: item.value > 0 ? '8px' : '0px'
                }}
                onClick={() => onBarClick?.(item, index)}
                title={`${item.label}: ${formatValue(item.value)}`}
              />
            </div>
            
            {/* Value label */}
            {showValues && (
              <div className="absolute right-0 top-0 h-6 flex items-center pr-2">
                <span className="text-xs text-gray-600">
                  {formatValue(item.value)}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <BaseChart {...baseProps}>
      <div className="w-full h-full">
        {orientation === 'vertical' ? renderVerticalChart() : renderHorizontalChart()}
      </div>
    </BaseChart>
  )
}

export default BarChart