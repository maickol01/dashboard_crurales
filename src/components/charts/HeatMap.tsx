// Heat Map component - reusable heatmap for geographic and categorical data
// Built with SVG for scalable visualization

import React, { useMemo } from 'react'
import BaseChart from './BaseChart'
import type { BaseChartProps } from './BaseChart'

export interface HeatMapDataPoint {
  x: string | number
  y: string | number
  value: number
  label?: string
  metadata?: Record<string, any>
}

interface HeatMapProps extends Omit<BaseChartProps, 'children'> {
  data: HeatMapDataPoint[]
  colorScale?: string[]
  showValues?: boolean
  showLabels?: boolean
  cellSize?: number
  onCellClick?: (data: HeatMapDataPoint) => void
}

const HeatMap: React.FC<HeatMapProps> = ({
  data,
  colorScale = ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF'],
  showValues = true,
  showLabels = true,
  cellSize = 40,
  onCellClick,
  ...baseProps
}) => {
  const { processedData, xLabels, yLabels, minValue, maxValue } = useMemo(() => {
    // Extract unique labels
    const xLabels = Array.from(new Set(data.map(d => d.x))).sort()
    const yLabels = Array.from(new Set(data.map(d => d.y))).sort()
    
    // Find min and max values for color scaling
    const values = data.map(d => d.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const valueRange = maxValue - minValue || 1

    // Process data with positions and colors
    const processedData = data.map(point => {
      const xIndex = xLabels.indexOf(point.x)
      const yIndex = yLabels.indexOf(point.y)
      const normalizedValue = (point.value - minValue) / valueRange
      const colorIndex = Math.floor(normalizedValue * (colorScale.length - 1))
      
      return {
        ...point,
        xIndex,
        yIndex,
        normalizedValue,
        color: colorScale[colorIndex] || colorScale[colorScale.length - 1]
      }
    })

    return {
      processedData,
      xLabels,
      yLabels,
      minValue,
      maxValue
    }
  }, [data, colorScale])

  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toLocaleString('es-ES')
  }

  const svgWidth = xLabels.length * cellSize + (showLabels ? 100 : 20)
  const svgHeight = yLabels.length * cellSize + (showLabels ? 60 : 20)
  const startX = showLabels ? 80 : 10
  const startY = showLabels ? 10 : 10

  return (
    <BaseChart {...baseProps}>
      <div className="w-full h-full overflow-auto">
        <svg
          width={svgWidth}
          height={svgHeight}
          className="min-w-full"
        >
          {/* Y-axis labels */}
          {showLabels && yLabels.map((label, index) => (
            <text
              key={`y-label-${index}`}
              x={startX - 10}
              y={startY + index * cellSize + cellSize / 2 + 4}
              textAnchor="end"
              className="text-xs fill-gray-600"
            >
              {label}
            </text>
          ))}

          {/* X-axis labels */}
          {showLabels && xLabels.map((label, index) => (
            <text
              key={`x-label-${index}`}
              x={startX + index * cellSize + cellSize / 2}
              y={startY + yLabels.length * cellSize + 20}
              textAnchor="middle"
              className="text-xs fill-gray-600"
              transform={`rotate(-45, ${startX + index * cellSize + cellSize / 2}, ${startY + yLabels.length * cellSize + 20})`}
            >
              {label}
            </text>
          ))}

          {/* Heat map cells */}
          {processedData.map((point, index) => {
            const x = startX + point.xIndex * cellSize
            const y = startY + point.yIndex * cellSize
            
            return (
              <g key={`cell-${index}`}>
                {/* Cell rectangle */}
                <rect
                  x={x}
                  y={y}
                  width={cellSize - 1}
                  height={cellSize - 1}
                  fill={point.color}
                  stroke="#ffffff"
                  strokeWidth="1"
                  className={`transition-all duration-200 ${
                    onCellClick ? 'cursor-pointer hover:stroke-gray-400 hover:stroke-2' : ''
                  }`}
                  onClick={() => onCellClick?.(point)}
                >
                  <title>
                    {point.x} - {point.y}: {formatValue(point.value)}
                    {point.label && ` (${point.label})`}
                  </title>
                </rect>

                {/* Cell value text */}
                {showValues && (
                  <text
                    x={x + cellSize / 2}
                    y={y + cellSize / 2 + 4}
                    textAnchor="middle"
                    className={`text-xs pointer-events-none ${
                      point.normalizedValue > 0.5 ? 'fill-white' : 'fill-gray-800'
                    }`}
                  >
                    {formatValue(point.value)}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {/* Color scale legend */}
        <div className="mt-4 flex items-center justify-center space-x-2">
          <span className="text-xs text-gray-500">
            {formatValue(minValue)}
          </span>
          <div className="flex">
            {colorScale.map((color, index) => (
              <div
                key={`legend-${index}`}
                className="w-4 h-4 border border-white"
                style={{ backgroundColor: color }}
                title={`${formatValue(minValue + ((maxValue - minValue) / (colorScale.length - 1)) * index)}`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">
            {formatValue(maxValue)}
          </span>
        </div>
      </div>
    </BaseChart>
  )
}

export default HeatMap