// Data Error Boundary component - migrated and enhanced from dashboard_afiliados
// Specialized error boundary for data loading and processing errors

import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Database, RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  onRetry?: () => void
  retryable?: boolean
  dataSource?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  isRetrying: boolean
}

class DataErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log data errors with additional context
    if (process.env.NODE_ENV === 'development') {
      console.error('DataErrorBoundary caught a data error:', {
        error,
        errorInfo,
        dataSource: this.props.dataSource,
        timestamp: new Date().toISOString()
      })
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  handleRetry = async () => {
    this.setState({ isRetrying: true })

    try {
      // Call custom retry handler if provided
      if (this.props.onRetry) {
        await this.props.onRetry()
      }

      // Reset error state after a short delay to allow for re-rendering
      this.retryTimeoutId = setTimeout(() => {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          isRetrying: false
        })
      }, 500)
    } catch (retryError) {
      console.error('Retry failed:', retryError)
      this.setState({ isRetrying: false })
    }
  }

  getErrorType = (error: Error): 'network' | 'database' | 'parsing' | 'unknown' => {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network'
    }
    if (message.includes('database') || message.includes('supabase') || message.includes('sql')) {
      return 'database'
    }
    if (message.includes('json') || message.includes('parse') || message.includes('syntax')) {
      return 'parsing'
    }
    return 'unknown'
  }

  getErrorIcon = (errorType: string) => {
    switch (errorType) {
      case 'network':
        return <WifiOff className="h-8 w-8 text-red-500" />
      case 'database':
        return <Database className="h-8 w-8 text-red-500" />
      default:
        return <AlertCircle className="h-8 w-8 text-red-500" />
    }
  }

  getErrorMessage = (errorType: string, dataSource?: string) => {
    const source = dataSource ? ` de ${dataSource}` : ''
    
    switch (errorType) {
      case 'network':
        return {
          title: 'Error de Conexión',
          description: `No se pudo conectar al servidor${source}. Verifica tu conexión a internet.`
        }
      case 'database':
        return {
          title: 'Error de Base de Datos',
          description: `Hubo un problema al acceder a los datos${source}. El servicio podría estar temporalmente no disponible.`
        }
      case 'parsing':
        return {
          title: 'Error de Datos',
          description: `Los datos${source} no tienen el formato esperado. Esto podría ser un problema temporal.`
        }
      default:
        return {
          title: 'Error de Datos',
          description: `Ocurrió un error inesperado al cargar los datos${source}.`
        }
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      const errorType = this.getErrorType(this.state.error)
      const errorMessage = this.getErrorMessage(errorType, this.props.dataSource)
      const isOnline = navigator.onLine

      // Default data error UI
      return (
        <div className="bg-white border border-red-200 rounded-lg p-6 m-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {this.getErrorIcon(errorType)}
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                {errorMessage.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {errorMessage.description}
              </p>

              {/* Network status indicator */}
              {errorType === 'network' && (
                <div className="mt-3 flex items-center text-sm">
                  {isOnline ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-green-600">Conectado a internet</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-red-600">Sin conexión a internet</span>
                    </>
                  )}
                </div>
              )}

              {/* Retry button */}
              {this.props.retryable !== false && (
                <div className="mt-4">
                  <button
                    onClick={this.handleRetry}
                    disabled={this.state.isRetrying || !isOnline}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                    {this.state.isRetrying ? 'Reintentando...' : 'Reintentar'}
                  </button>
                </div>
              )}

              {/* Error details in development */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4">
                  <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                    Detalles técnicos (desarrollo)
                  </summary>
                  <pre className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-auto max-h-32">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default DataErrorBoundary