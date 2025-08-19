// Area Chart component - for daily registrations visualization
// Built with SVG for smooth area fills and animations

import React, { useMemo } from 'react'
import BaseChart from './BaseChart'
import type { BaseChartProps } from './BaseChart'

export interface AreaChartDataPoint {
  x: string | number
  y: number
  label?: string
  metadata?: Record<string, any>
}

interface AreaChartProps extends Omit<BaseChartProps, 'children'> {
  data: AreaChartDataPoint[]
  showGrid?: boolean
  showDots?: boolean
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
  onPointClick?: (point: AreaChartDataPoint, index: number) => void
}

const AreaChart: React.FC<AreaChartProps> = ({
  data,
  showGrid = true,
  showDots = true,
  fillColor = '#235b4e',
  strokeColor = '#235b4e',
  strokeWidth = 3,
  onPointClick,
  ...baseProps
}) => {
  const { processedData, yMin, yMax, chartDimensions } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        processedData: [],
        yMin: 0,
        yMax: 100,
        chartDimensions: { width: 800, height: 300, paddingTop: 20, paddingRight: 40, paddingBottom: 60, paddingLeft: 80 }
      }
    }

    // Find min and max Y values
    const yValues = data.map(d => d.y)
    const yMin = Math.min(...yValues)
    const yMax = Math.max(...yValues)
    const yRange = yMax - yMin || 1

    // Chart dimensions - using actual pixel values for better control
    const chartDimensions = {
      width: 800, // actual pixels
      height: 300, // actual pixels
      paddingTop: 20,
      paddingRight: 40,
      paddingBottom: 60,
      paddingLeft: 80
    }

    // Process data points
    const processedData = data.map((point, index) => {
      const x = (index / (data.length - 1)) * (chartDimensions.width - chartDimensions.paddingLeft - chartDimensions.paddingRight) + chartDimensions.paddingLeft
      const y = chartDimensions.height - chartDimensions.paddingBottom - ((point.y - yMin) / yRange) * (chartDimensions.height - chartDimensions.paddingTop - chartDimensions.paddingBottom)
      
      return {
        ...point,
        x: x,
        y: y,
        originalX: point.x,
        originalY: point.y,
        index
      }
    })

    return {
      processedData,
      yMin,
      yMax,
      chartDimensions
    }
  }, [data])

  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toLocaleString('es-ES')
  }

  const createAreaPath = (points: any[]) => {
    if (points.length === 0) return ''
    
    let path = `M ${chartDimensions.paddingLeft} ${chartDimensions.height - chartDimensions.paddingBottom}`
    path += ` L ${points[0].x} ${points[0].y}`
    
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`
    }
    
    path += ` L ${points[points.length - 1].x} ${chartDimensions.height - chartDimensions.paddingBottom}`
    path += ` L ${chartDimensions.paddingLeft} ${chartDimensions.height - chartDimensions.paddingBottom}`
    path += ' Z'
    
    return path
  }

  const createLinePath = (points: any[]) => {
    if (points.length === 0) return ''
    
    let path = `M ${points[0].x} ${points[0].y}`
    
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`
    }
    
    return path
  }

  if (processedData.length === 0) {
    return (
      <BaseChart {...baseProps}>
        <div className="w-full h-full flex items-center justify-center text-gray-500">
          No hay datos disponibles para mostrar
        </div>
      </BaseChart>
    )
  }

  return (
    <BaseChart {...baseProps}>
      <div className="w-full h-full relative">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${chartDimensions.width} ${chartDimensions.height}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
        >
          {/* Grid lines */}
          {showGrid && (
            <g className="grid">
              {/* Horizontal grid lines */}
              {[0, 25, 50, 75, 100].map((percentage) => {
                const y = chartDimensions.height - chartDimensions.paddingBottom - (percentage / 100) * (chartDimensions.height - chartDimensions.paddingTop - chartDimensions.paddingBottom)
                return (
                  <g key={`h-grid-${percentage}`}>
                    <line
                      x1={chartDimensions.paddingLeft}
                      y1={y}
                      x2={chartDimensions.width - chartDimensions.paddingRight}
                      y2={y}
                      stroke="#E5E7EB"
                      strokeWidth="0.5"
                    />
                    <text
                      x={chartDimensions.paddingLeft - 5}
                      y={y + 2}
                      textAnchor="end"
                      className="text-xs fill-gray-500"
                    >
                      {formatValue(yMin + (yMax - yMin) * (percentage / 100))}
                    </text>
                  </g>
                )
              })}
              
              {/* Vertical grid lines */}
              {processedData.map((point, index) => {
                if (index % Math.ceil(processedData.length / 6) !== 0) return null
                return (
                  <g key={`v-grid-${index}`}>
                    <line
                      x1={point.x}
                      y1={chartDimensions.paddingTop}
                      x2={point.x}
                      y2={chartDimensions.height - chartDimensions.paddingBottom}
                      stroke="#E5E7EB"
                      strokeWidth="0.5"
                    />
                    <text
                      x={point.x}
                      y={chartDimensions.height - chartDimensions.paddingBottom + 15}
                      textAnchor="middle"
                      className="text-xs fill-gray-500"
                    >
                      {point.originalX}
                    </text>
                  </g>
                )
              })}
            </g>
          )}

          {/* Area fill */}
          <path
            d={createAreaPath(processedData)}
            fill={`${fillColor}20`}
            className="transition-all duration-300"
          />

          {/* Line stroke */}
          <path
            d={createLinePath(processedData)}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            className="transition-all duration-300"
          />
          
          {/* Data points */}
          {showDots && processedData.map((point, index) => (
            <circle
              key={`point-${index}`}
              cx={point.x}
              cy={point.y}
              r="4"
              fill={strokeColor}
              stroke="white"
              strokeWidth="2"
              className={`transition-all duration-200 ${
                onPointClick ? 'cursor-pointer hover:r-6' : ''
              }`}
              onClick={() => onPointClick?.(
                { x: point.originalX, y: point.originalY, label: point.label, metadata: point.metadata },
                index
              )}
            >
              <title>
                {point.originalX}: {formatValue(point.originalY)}
              </title>
            </circle>
          ))}
        </svg>
      </div>
    </BaseChart>
  )
}

export default AreaChart