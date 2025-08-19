// Responsive design hook - provides responsive utilities and breakpoint detection
// Enhanced for mobile-first dashboard design

import { useState, useEffect } from 'react'

export interface BreakpointConfig {
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
}

export interface ResponsiveState {
  width: number
  height: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isLargeDesktop: boolean
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  orientation: 'portrait' | 'landscape'
}

const defaultBreakpoints: BreakpointConfig = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
}

export const useResponsive = (customBreakpoints?: Partial<BreakpointConfig>): ResponsiveState => {
  const breakpoints = { ...defaultBreakpoints, ...customBreakpoints }
  
  const [state, setState] = useState<ResponsiveState>(() => {
    // Initialize with default values for SSR compatibility
    const initialWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
    const initialHeight = typeof window !== 'undefined' ? window.innerHeight : 768
    
    return {
      width: initialWidth,
      height: initialHeight,
      isMobile: initialWidth < breakpoints.md,
      isTablet: initialWidth >= breakpoints.md && initialWidth < breakpoints.lg,
      isDesktop: initialWidth >= breakpoints.lg && initialWidth < breakpoints.xl,
      isLargeDesktop: initialWidth >= breakpoints.xl,
      breakpoint: getBreakpoint(initialWidth, breakpoints),
      orientation: initialHeight > initialWidth ? 'portrait' : 'landscape'
    }
  })

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setState({
        width,
        height,
        isMobile: width < breakpoints.md,
        isTablet: width >= breakpoints.md && width < breakpoints.lg,
        isDesktop: width >= breakpoints.lg && width < breakpoints.xl,
        isLargeDesktop: width >= breakpoints.xl,
        breakpoint: getBreakpoint(width, breakpoints),
        orientation: height > width ? 'portrait' : 'landscape'
      })
    }

    // Set initial state
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [breakpoints])

  return state
}

function getBreakpoint(width: number, breakpoints: BreakpointConfig): ResponsiveState['breakpoint'] {
  if (width >= breakpoints['2xl']) return '2xl'
  if (width >= breakpoints.xl) return 'xl'
  if (width >= breakpoints.lg) return 'lg'
  if (width >= breakpoints.md) return 'md'
  if (width >= breakpoints.sm) return 'sm'
  return 'xs'
}

// Hook for detecting mobile devices
export const useMobileDetection = () => {
  const [isMobileDevice, setIsMobileDevice] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    // Detect mobile device
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
    setIsMobileDevice(mobileRegex.test(navigator.userAgent))

    // Detect touch capability
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  return {
    isMobileDevice,
    isTouchDevice,
    isDesktopDevice: !isMobileDevice,
    hasTouch: isTouchDevice
  }
}

// Hook for responsive grid columns
export const useResponsiveGrid = (
  columns: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  } = {}
) => {
  const { breakpoint } = useResponsive()
  
  const defaultColumns = {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
    '2xl': 6
  }
  
  const gridColumns = { ...defaultColumns, ...columns }
  
  return {
    columns: gridColumns[breakpoint],
    gridClass: `grid-cols-${gridColumns[breakpoint]}`,
    breakpoint
  }
}

// Hook for responsive chart dimensions
export const useResponsiveChart = () => {
  const { isMobile, isTablet, width } = useResponsive()
  
  return {
    height: isMobile ? 250 : isTablet ? 300 : 400,
    aspectRatio: isMobile ? '16:9' : '16:10',
    showLegend: !isMobile,
    showGrid: true,
    fontSize: isMobile ? 'xs' : 'sm',
    padding: isMobile ? 2 : 4,
    containerWidth: width > 1200 ? 'max-w-7xl' : width > 768 ? 'max-w-5xl' : 'max-w-full'
  }
}

export default useResponsive