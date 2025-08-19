// Line Chart component - reusable line chart for trend analysis
// Built with SVG for smooth lines and animations

import React, { useMemo } from 'react'
import BaseChart from './BaseChart'
import type { BaseChartProps } from './BaseChart'

export interface LineChartDataPoint {
  x: string | number
  y: number
  label?: string
  metadata?: Record<string, any>
}

export interface LineChartSeries {
  name: string
  data: LineChartDataPoint[]
  color?: string
  strokeWidth?: number
  showDots?: boolean
}

interface LineChartProps extends Omit<BaseChartProps, 'children'> {
  series: LineChartSeries[]
  showGrid?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  colors?: string[]
  onPointClick?: (point: LineChartDataPoint, seriesIndex: number, pointIndex: number) => void
}

const LineChart: React.FC<LineChartProps> = ({
  series,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
  onPointClick,
  ...baseProps
}) => {
  const { processedSeries, xLabels, yMin, yMax, chartDimensions } = useMemo(() => {
    // Collect all unique x values
    const allXValues = Array.from(
      new Set(series.flatMap(s => s.data.map(d => d.x)))
    ).sort()

    // Find min and max Y values
    const allYValues = series.flatMap(s => s.data.map(d => d.y))
    const yMin = Math.min(...allYValues)
    const yMax = Math.max(...allYValues)
    const yRange = yMax - yMin || 1

    // Chart dimensions (accounting for padding)
    const chartDimensions = {
      width: 100, // percentage
      height: 100, // percentage
      paddingTop: 10,
      paddingRight: 10,
      paddingBottom: 20,
      paddingLeft: 40
    }

    // Process series data
    const processedSeries = series.map((s, index) => ({
      ...s,
      color: s.color || colors[index % colors.length],
      strokeWidth: s.strokeWidth || 2,
      showDots: s.showDots !== false,
      points: s.data.map((point, pointIndex) => {
        const xIndex = allXValues.indexOf(point.x)
        const x = (xIndex / (allXValues.length - 1)) * (chartDimensions.width - chartDimensions.paddingLeft - chartDimensions.paddingRight) + chartDimensions.paddingLeft
        const y = chartDimensions.height - chartDimensions.paddingBottom - ((point.y - yMin) / yRange) * (chartDimensions.height - chartDimensions.paddingTop - chartDimensions.paddingBottom)
        
        return {
          ...point,
          x: x,
          y: y,
          originalX: point.x,
          originalY: point.y,
          seriesIndex: index,
          pointIndex
        }
      })
    }))

    return {
      processedSeries,
      xLabels: allXValues,
      yMin,
      yMax,
      chartDimensions
    }
  }, [series, colors])

  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toLocaleString('es-ES')
  }

  const createPath = (points: any[]) => {
    if (points.length === 0) return ''
    
    let path = `M ${points[0].x} ${points[0].y}`
    
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`
    }
    
    return path
  }

  return (
    <BaseChart {...baseProps}>
      <div className="w-full h-full relative">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${chartDimensions.width} ${chartDimensions.height}`}
          className="overflow-visible"
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
              {xLabels.map((label, index) => {
                const x = (index / (xLabels.length - 1)) * (chartDimensions.width - chartDimensions.paddingLeft - chartDimensions.paddingRight) + chartDimensions.paddingLeft
                return (
                  <g key={`v-grid-${index}`}>
                    <line
                      x1={x}
                      y1={chartDimensions.paddingTop}
                      x2={x}
                      y2={chartDimensions.height - chartDimensions.paddingBottom}
                      stroke="#E5E7EB"
                      strokeWidth="0.5"
                    />
                    <text
                      x={x}
                      y={chartDimensions.height - chartDimensions.paddingBottom + 15}
                      textAnchor="middle"
                      className="text-xs fill-gray-500"
                    >
                      {label}
                    </text>
                  </g>
                )
              })}
            </g>
          )}

          {/* Lines and points */}
          {processedSeries.map((s, seriesIndex) => (
            <g key={`series-${seriesIndex}`}>
              {/* Line path */}
              <path
                d={createPath(s.points)}
                fill="none"
                stroke={s.color}
                strokeWidth={s.strokeWidth}
                className="transition-all duration-300"
              />
              
              {/* Data points */}
              {s.showDots && s.points.map((point, pointIndex) => (
                <circle
                  key={`point-${seriesIndex}-${pointIndex}`}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill={s.color}
                  stroke="white"
                  strokeWidth="2"
                  className={`transition-all duration-200 ${
                    onPointClick ? 'cursor-pointer hover:r-6' : ''
                  }`}
                  onClick={() => onPointClick?.(
                    { x: point.originalX, y: point.originalY, label: point.label, metadata: point.metadata },
                    seriesIndex,
                    pointIndex
                  )}
                >
                  {showTooltip && (
                    <title>
                      {s.name}: {point.originalX} - {formatValue(point.originalY)}
                    </title>
                  )}
                </circle>
              ))}
            </g>
          ))}
        </svg>

        {/* Legend */}
        {showLegend && series.length > 1 && (
          <div className="absolute top-0 right-0 bg-white border border-gray-200 rounded-md p-2 shadow-sm">
            {processedSeries.map((s, index) => (
              <div key={`legend-${index}`} className="flex items-center space-x-2 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-gray-700">{s.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </BaseChart>
  )
}

export default LineChart