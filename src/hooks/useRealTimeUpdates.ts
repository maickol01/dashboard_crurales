// Custom hook for real-time data synchronization
// Provides live data updates and synchronization capabilities
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
// import { ServiceError } from '../types/errors' // Not used in this hook

// Real-time event types
type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*'
type TableName = 'lideres' | 'brigadistas' | 'movilizadores' | 'ciudadanos'

// Subscription configuration
interface SubscriptionConfig {
  table: TableName
  event: RealtimeEventType
  filter?: string
  enabled?: boolean
}

// Real-time update payload
interface RealtimeUpdate<T = any> {
  eventType: RealtimeEventType
  table: TableName
  old?: T
  new?: T
  timestamp: Date
}

// Hook options
interface UseRealTimeUpdatesOptions {
  subscriptions: SubscriptionConfig[]
  onUpdate?: (update: RealtimeUpdate) => void
  onError?: (error: Error) => void
  autoConnect?: boolean
  reconnectAttempts?: number
  reconnectDelay?: number
}

// Hook return type
interface UseRealTimeUpdatesReturn {
  // Connection state
  connected: boolean
  connecting: boolean
  error: string | null
  
  // Update data
  updates: RealtimeUpdate[]
  lastUpdate: RealtimeUpdate | null
  updateCount: number
  
  // Connection controls
  connect: () => void
  disconnect: () => void
  reconnect: () => void
  clearUpdates: () => void
  
  // Subscription management
  addSubscription: (config: SubscriptionConfig) => void
  removeSubscription: (table: TableName, event?: RealtimeEventType) => void
  
  // Statistics
  connectionStats: {
    connectTime: Date | null
    disconnectTime: Date | null
    reconnectCount: number
    totalUpdates: number
    updatesByTable: Record<TableName, number>
  }
}

export function useRealTimeUpdates(options: UseRealTimeUpdatesOptions): UseRealTimeUpdatesReturn {
  const {
    subscriptions: initialSubscriptions,
    onUpdate,
    onError,
    autoConnect = true,
    reconnectAttempts = 3,
    reconnectDelay = 2000
  } = options

  // State management
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updates, setUpdates] = useState<RealtimeUpdate[]>([])
  const [lastUpdate, setLastUpdate] = useState<RealtimeUpdate | null>(null)
  const [subscriptions, setSubscriptions] = useState<SubscriptionConfig[]>(initialSubscriptions)
  const [connectionStats, setConnectionStats] = useState({
    connectTime: null as Date | null,
    disconnectTime: null as Date | null,
    reconnectCount: 0,
    totalUpdates: 0,
    updatesByTable: {
      lideres: 0,
      brigadistas: 0,
      movilizadores: 0,
      ciudadanos: 0
    } as Record<TableName, number>
  })

  // Refs for cleanup and reconnection
  const channelRef = useRef<RealtimeChannel | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  // Computed values
  const updateCount = updates.length

  // Handle real-time updates
  const handleUpdate = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    const update: RealtimeUpdate = {
      eventType: payload.eventType as RealtimeEventType,
      table: payload.table as TableName,
      old: payload.old,
      new: payload.new,
      timestamp: new Date()
    }

    setUpdates(prev => [...prev, update])
    setLastUpdate(update)

    // Update statistics
    setConnectionStats(prev => ({
      ...prev,
      totalUpdates: prev.totalUpdates + 1,
      updatesByTable: {
        ...prev.updatesByTable,
        [update.table]: prev.updatesByTable[update.table] + 1
      }
    }))

    // Call user-provided callback
    if (onUpdate) {
      try {
        onUpdate(update)
      } catch (err) {
        console.error('Error in onUpdate callback:', err)
      }
    }
  }, [onUpdate])

  // Handle connection errors
  const handleError = useCallback((err: Error) => {
    const errorMessage = err.message || 'Real-time connection error'
    setError(errorMessage)
    setConnected(false)
    setConnecting(false)

    console.error('Real-time error:', err)

    if (onError) {
      try {
        onError(err)
      } catch (callbackErr) {
        console.error('Error in onError callback:', callbackErr)
      }
    }

    // Attempt reconnection
    if (reconnectAttemptsRef.current < reconnectAttempts) {
      reconnectAttemptsRef.current++
      
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log(`Attempting reconnection ${reconnectAttemptsRef.current}/${reconnectAttempts}`)
        // Use a local reconnect function to avoid dependency issues
        disconnect()
        setTimeout(() => connect(), 1000)
      }, reconnectDelay * reconnectAttemptsRef.current)
    }
  }, [onError, reconnectAttempts, reconnectDelay])

  // Connect to real-time updates
  const connect = useCallback(() => {
    if (connected || connecting) return

    setConnecting(true)
    setError(null)

    try {
      // Create a new channel
      const channel = supabase.channel('dashboard-updates')

      // Add subscriptions
      subscriptions.forEach(config => {
        if (!config.enabled) return

        channel.on(
          'postgres_changes' as any,
          {
            event: config.event,
            schema: 'public',
            table: config.table,
            filter: config.filter
          },
          handleUpdate
        )

        console.log(`Subscribed to ${config.table} ${config.event} events`)
      })

      // Handle channel events
      channel
        .on('system', {}, (payload) => {
          console.log('Real-time system event:', payload)
        })
        .subscribe((status) => {
          console.log('Real-time subscription status:', status)
          
          if (status === 'SUBSCRIBED') {
            setConnected(true)
            setConnecting(false)
            setError(null)
            reconnectAttemptsRef.current = 0
            
            setConnectionStats(prev => ({
              ...prev,
              connectTime: new Date()
            }))
          } else if (status === 'CHANNEL_ERROR') {
            handleError(new Error('Channel subscription error'))
          } else if (status === 'TIMED_OUT') {
            handleError(new Error('Channel subscription timed out'))
          }
        })

      channelRef.current = channel
    } catch (err) {
      handleError(err as Error)
    }
  }, [connected, connecting, subscriptions, handleUpdate, handleError])

  // Disconnect from real-time updates
  const disconnect = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    setConnected(false)
    setConnecting(false)
    setError(null)
    
    setConnectionStats(prev => ({
      ...prev,
      disconnectTime: new Date()
    }))
  }, [])

  // Reconnect to real-time updates
  const reconnect = useCallback(() => {
    disconnect()
    
    setConnectionStats(prev => ({
      ...prev,
      reconnectCount: prev.reconnectCount + 1
    }))
    
    setTimeout(() => {
      connect()
    }, 1000)
  }, [disconnect, connect])

  // Clear updates history
  const clearUpdates = useCallback(() => {
    setUpdates([])
    setLastUpdate(null)
  }, [])

  // Add new subscription
  const addSubscription = useCallback((config: SubscriptionConfig) => {
    setSubscriptions(prev => {
      // Check if subscription already exists
      const exists = prev.some(sub => 
        sub.table === config.table && 
        sub.event === config.event && 
        sub.filter === config.filter
      )
      
      if (exists) {
        console.warn(`Subscription for ${config.table} ${config.event} already exists`)
        return prev
      }
      
      return [...prev, config]
    })

    // If connected, reconnect to apply new subscription
    if (connected) {
      reconnect()
    }
  }, [connected, reconnect])

  // Remove subscription
  const removeSubscription = useCallback((table: TableName, event?: RealtimeEventType) => {
    setSubscriptions(prev => 
      prev.filter(sub => 
        !(sub.table === table && (event === undefined || sub.event === event))
      )
    )

    // If connected, reconnect to apply changes
    if (connected) {
      reconnect()
    }
  }, [connected, reconnect])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && subscriptions.length > 0) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, subscriptions.length, connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    // Connection state
    connected,
    connecting,
    error,
    
    // Update data
    updates,
    lastUpdate,
    updateCount,
    
    // Connection controls
    connect,
    disconnect,
    reconnect,
    clearUpdates,
    
    // Subscription management
    addSubscription,
    removeSubscription,
    
    // Statistics
    connectionStats
  }
}