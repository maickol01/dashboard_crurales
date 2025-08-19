// Hierarchy types for Dashboard CRurales
// Enhanced hierarchy table and related components

import type { HierarchicalWorker, FilterOptions, ExportOptions } from './index';

// Props for the enhanced hierarchy table component
export interface HierarchyTableProps {
  data: HierarchicalWorker[];
  loading?: boolean;
  onExport: (format: 'excel' | 'pdf', selectedItems: string[]) => void;
  onWorkerSelect?: (workerId: string) => void;
  onWorkerExpand?: (workerId: string, expanded: boolean) => void;
  optimizedRendering?: boolean;
  virtualScrolling?: boolean;
  maxHeight?: number;
  selectedWorkers?: string[];
  expandedWorkers?: string[];
}

// Props for hierarchy filters component
export interface HierarchyFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableRegions: string[];
  loading?: boolean;
  onReset: () => void;
}

// Props for hierarchy export component
export interface HierarchyExportProps {
  selectedWorkers: string[];
  totalWorkers: number;
  onExport: (options: ExportOptions) => void;
  loading?: boolean;
  disabled?: boolean;
}

// Hierarchy node interface for tree rendering
export interface HierarchyNode {
  id: string;
  name: string;
  role: 'lider' | 'brigadista' | 'movilizador';
  level: number;
  parentId?: string;
  children: HierarchyNode[];
  data: HierarchicalWorker;
  expanded: boolean;
  selected: boolean;
  visible: boolean;
}

// Hierarchy statistics
export interface HierarchyStats {
  totalLideres: number;
  totalBrigadistas: number;
  totalMovilizadores: number;
  totalCiudadanos: number;
  averageCiudadanosPorLider: number;
  averageCiudadanosPorBrigadista: number;
  averageCiudadanosPorMovilizador: number;
  deepestLevel: number;
  mostProductiveWorker: {
    id: string;
    name: string;
    role: string;
    ciudadanos: number;
  };
}

// Hierarchy search and filter options
export interface HierarchySearchOptions {
  searchTerm: string;
  searchFields: ('nombre' | 'ubicacion' | 'seccion')[];
  caseSensitive: boolean;
  exactMatch: boolean;
}

// Hierarchy sort options
export interface HierarchySortOptions {
  field: 'nombre' | 'ciudadanosRegistrados' | 'tasaVerificacion' | 'ultimaActividad';
  direction: 'asc' | 'desc';
  maintainHierarchy: boolean;
}

// Hierarchy view options
export interface HierarchyViewOptions {
  showPerformanceMetrics: boolean;
  showLocationInfo: boolean;
  showLastActivity: boolean;
  showChildrenCount: boolean;
  compactView: boolean;
  groupByRegion: boolean;
}

// Hierarchy action types for context menu
export type HierarchyAction = 
  | 'view-details'
  | 'edit-worker'
  | 'export-branch'
  | 'expand-all'
  | 'collapse-all'
  | 'add-child'
  | 'remove-worker';

// Hierarchy context menu item
export interface HierarchyContextMenuItem {
  action: HierarchyAction;
  label: string;
  icon?: string;
  disabled?: boolean;
  separator?: boolean;
}

// Hierarchy performance indicators
export interface HierarchyPerformanceIndicator {
  workerId: string;
  indicator: 'excellent' | 'good' | 'average' | 'poor' | 'inactive';
  score: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

// Hierarchy expansion state
export interface HierarchyExpansionState {
  expandedNodes: Set<string>;
  expandAll: boolean;
  collapseAll: boolean;
  rememberState: boolean;
}

// Hierarchy selection state
export interface HierarchySelectionState {
  selectedNodes: Set<string>;
  selectAll: boolean;
  selectNone: boolean;
  selectionMode: 'single' | 'multiple' | 'range';
}

// Hierarchy virtualization options
export interface HierarchyVirtualizationOptions {
  enabled: boolean;
  itemHeight: number;
  overscan: number;
  threshold: number; // Minimum items to enable virtualization
}

// Hierarchy export configuration
export interface HierarchyExportConfig {
  includeChildren: boolean;
  includePerformanceMetrics: boolean;
  includeLocationInfo: boolean;
  maxDepth?: number;
  customFields?: string[];
  fileName?: string;
  sheetName?: string;
}

// Hierarchy loading state
export interface HierarchyLoadingState {
  loading: boolean;
  loadingNodes: Set<string>;
  error?: string;
  retryCount: number;
}

// Hierarchy cache configuration
export interface HierarchyCacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of cached items
  strategy: 'lru' | 'fifo' | 'ttl';
}