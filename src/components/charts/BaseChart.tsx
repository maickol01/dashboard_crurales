// Base Chart component - foundation for all chart components
// Provides common functionality and styling for charts

import React from 'react'
import { Loader2, Download, Maximize2 } from 'lucide-react'

export interface BaseChartProps {
  title?: string
  subtitle?: string
  loading?: boolean
  error?: string
  height?: number
  className?: string
  children: React.ReactNode
  onExport?: (format: 'png' | 'svg' | 'pdf') => void
  onFullscreen?: () => void
  showControls?: boolean
}

const BaseChart: React.FC<BaseChartProps> = ({
  title,
  subtitle,
  loading = false,
  error,
  height = 400,
  className = '',
  children,
  onExport,
  onFullscreen,
  showControls = true
}) => {
  const handleExport = (format: 'png' | 'svg' | 'pdf') => {
    if (onExport) {
      onExport(format)
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Chart Header */}
      {(title || showControls) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-medium text-gray-900">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">
                  {subtitle}
                </p>
              )}
            </div>
            
            {showControls && (
              <div className="flex items-center space-x-2">
                {onExport && (
                  <div className="relative group">
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                      title="Exportar gráfico"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    
                    {/* Export dropdown */}
                    <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <div className="py-1">
                        <button
                          onClick={() => handleExport('png')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          PNG
                        </button>
                        <button
                          onClick={() => handleExport('svg')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          SVG
                        </button>
                        <button
                          onClick={() => handleExport('pdf')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          PDF
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {onFullscreen && (
                  <button
                    onClick={onFullscreen}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                    title="Pantalla completa"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chart Content */}
      <div className="p-6">
        <div style={{ height: `${height}px` }} className="relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
              <div className="flex items-center space-x-2 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Cargando gráfico...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-red-500 text-sm font-medium">
                  Error al cargar el gráfico
                </div>
                <div className="text-gray-500 text-xs mt-1">
                  {error}
                </div>
              </div>
            </div>
          )}
          
          {!loading && !error && children}
        </div>
      </div>
    </div>
  )
}

export default BaseChart