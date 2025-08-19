// KPI Cards container component - migrated and adapted from dashboard_afiliados
// Enhanced for worker analytics and unified dashboard view

import React from 'react'
import { Users, TrendingUp, Clock } from 'lucide-react'
// import KPICard from './KPICard'
import type { KPICardProps } from './KPICard'

export interface KPIData {
  totalCiudadanos: number
  totalTrabajadores: number
  tasaCrecimiento: number
  metaCumplimiento: number
  tasaVerificacion: number
  registrosHoy: number
  tendenciaSemanal?: number
  progresoMeta?: number
}

interface KPICardsProps {
  data: KPIData
  loading?: boolean
  onCardClick?: (cardType: string) => void
}

const KPICards: React.FC<KPICardsProps> = ({ 
  data, 
  loading = false,
  onCardClick 
}) => {
  const kpiCards: (KPICardProps & { type: string })[] = [
    {
      type: 'trabajadores',
      title: 'Trabajadores',
      value: data.totalTrabajadores,
      subtitle: 'Líderes, Brigadistas y Movilizadores',
      icon: Users,
      color: 'green',
      loading,
      onClick: onCardClick ? () => onCardClick('trabajadores') : undefined
    },
    {
      type: 'crecimiento',
      title: 'Crecimiento',
      value: `${data.tasaCrecimiento.toFixed(1)}%`,
      subtitle: 'Crecimiento mensual',
      trend: {
        value: data.tasaCrecimiento,
        label: 'este mes',
        isPositive: data.tasaCrecimiento > 0
      },
      icon: TrendingUp,
      color: data.tasaCrecimiento > 0 ? 'green' : 'red',
      loading,
      onClick: onCardClick ? () => onCardClick('crecimiento') : undefined
    },
    {
      type: 'registros_hoy',
      title: 'Registros Hoy',
      value: data.registrosHoy,
      subtitle: 'Nuevos registros del día',
      icon: Clock,
      color: 'purple',
      loading,
      onClick: onCardClick ? () => onCardClick('registros_hoy') : undefined
    }
  ]

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {kpiCards.map((card) => (
        <div key={card.type} className="bg-white overflow-hidden shadow-md rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="mr-5 w-0 flex-1 text-center">
                <dl>
                  <dt className="text-sm font-medium text-gray-500">{card.title}</dt>
                  <dd className="flex items-center justify-center">
                    <span className="text-lg font-semibold text-gray-900">
                      {typeof card.value === 'number' ? card.value.toLocaleString('es-ES') : card.value}
                    </span>
                    {card.trend && (
                      <span className={`ml-2 text-sm font-medium ${
                        card.trend.value > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {card.trend.value > 0 ? '+' : ''}{card.trend.value}%
                      </span>
                    )}
                  </dd>
                </dl>
              </div>
              <div className="shrink-0">
                <div className={`${card.color === 'blue' ? 'bg-primary' : 
                  card.color === 'green' ? 'bg-secondary' : 
                  card.color === 'yellow' ? 'bg-accent' : 
                  card.color === 'red' ? 'bg-neutral' : 
                  card.color === 'purple' ? 'bg-purple-600' : 'bg-indigo-600'} p-3 rounded-md`}>
                  {card.icon && <card.icon className="h-6 w-6 text-white" />}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default KPICards