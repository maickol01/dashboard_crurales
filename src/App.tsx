import Layout from './components/layout/Layout'
import { KPICards } from './components/common'
import { BarChart, AreaChart } from './components/charts'
import { Target, TrendingUp, CheckCircle } from 'lucide-react'
import type { KPIData } from './components/common'
import type { BarChartData, AreaChartDataPoint } from './components/charts'
import './App.css'

function App() {
  // Sample KPI data
  const kpiData: KPIData = {
    totalCiudadanos: 45230,
    totalTrabajadores: 180,
    tasaCrecimiento: 12.5,
    metaCumplimiento: 75.4,
    tasaVerificacion: 87.2,
    registrosHoy: 234,
    tendenciaSemanal: 8.3,
    progresoMeta: 45230
  }

  // Sample bar chart data
  const barChartData: BarChartData[] = [
    { label: 'Líderes', value: 60, color: '#3B82F6' },
    { label: 'Brigadistas', value: 60, color: '#10B981' },
    { label: 'Movilizadores', value: 60, color: '#F59E0B' },
    { label: 'Ciudadanos', value: 45230, color: '#EF4444' }
  ]

  // Sample area chart data
  const areaChartData: AreaChartDataPoint[] = [
    { x: 'Lun', y: 120 },
    { x: 'Mar', y: 148.5 },
    { x: 'Mié', y: 177 },
    { x: 'Jue', y: 205.5 },
    { x: 'Vie', y: 234 },
    { x: 'Sáb', y: 190 },
    { x: 'Dom', y: 160 }
  ]

  return (
    <Layout currentPage="analytics">
      <div className="space-y-6">
        {/* Métricas principales - matching original layout */}
        <KPICards 
          data={kpiData}
          onCardClick={(cardType) => console.log('Clicked:', cardType)}
        />

        {/* Progreso hacia meta general - movido aquí */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Progreso hacia Meta Anual</h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progreso actual</span>
              <span>45,230 / 60,000</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all duration-500"
                style={{ width: '75.4%' }}
              ></div>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold text-primary">75.4%</span>
              <span className="text-gray-600 ml-2">completado</span>
            </div>
          </div>
        </div>

        {/* KPIs mejorados - matching original style */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow-md rounded-lg">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-primary">75.4%</div>
                  <div className="text-sm font-medium text-gray-900 mt-1">Tasa de Conversión</div>
                  <div className="text-xs text-gray-500 mt-1">Porcentaje de ciudadanos registrados vs contactados</div>
                </div>
                <Target className="h-8 w-8 text-primary" />
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow-md rounded-lg">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-secondary">12.5%</div>
                  <div className="text-sm font-medium text-gray-900 mt-1">Tasa de Crecimiento</div>
                  <div className="text-xs text-gray-500 mt-1">Crecimiento mensual promedio</div>
                </div>
                <TrendingUp className="h-8 w-8 text-secondary" />
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow-md rounded-lg">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-accent">87.2%</div>
                  <div className="text-sm font-medium text-gray-900 mt-1">Calidad de Datos</div>
                  <div className="text-xs text-gray-500 mt-1">Completitud de información registrada</div>
                </div>
                <CheckCircle className="h-8 w-8 text-accent" />
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos principales - Layout mejorado para mejor visibilidad */}
        <div className="space-y-6">
          {/* Gráfico de registros - ancho completo para mejor visibilidad */}
          <AreaChart
            title="Ciudadanos Registrados por Día"
            data={areaChartData}
            height={350}
            showGrid={true}
            showDots={true}
            fillColor="#235b4e"
            strokeColor="#235b4e"
            strokeWidth={3}
            onPointClick={(point) => console.log('Point clicked:', point)}
          />

          {/* Gráfico de distribución */}
          <BarChart
            title="Distribución por Tipo de Trabajador"
            data={barChartData}
            height={350}
            showValues={true}
            orientation="vertical"
            onBarClick={(data) => console.log('Bar clicked:', data)}
          />
        </div>

        {/* Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Tarea 5 completada: Componentes comunes migrados y mejorados
              </p>
              <p className="text-sm text-green-600">
                Layout, KPI Cards, Error Boundaries, Charts y utilidades responsivas implementados
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default App
