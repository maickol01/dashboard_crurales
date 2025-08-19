// Database types for Supabase integration
// Based on the existing database schema from dashboard_afiliados

// Database table interfaces matching Supabase schema
export interface Database {
  public: {
    Tables: {
      lideres: {
        Row: LideresRow;
        Insert: LideresInsert;
        Update: LideresUpdate;
      };
      brigadistas: {
        Row: BrigadistasRow;
        Insert: BrigadistasInsert;
        Update: BrigadistasUpdate;
      };
      movilizadores: {
        Row: MovilizadoresRow;
        Insert: MovilizadoresInsert;
        Update: MovilizadoresUpdate;
      };
      ciudadanos: {
        Row: CiudadanosRow;
        Insert: CiudadanosInsert;
        Update: CiudadanosUpdate;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Lideres table types
export interface LideresRow {
  id: string;
  nombre: string;
  clave_electoral?: string;
  curp?: string;
  direccion?: string;
  colonia?: string;
  codigo_postal?: string;
  seccion?: string;
  entidad?: string;
  municipio?: string;
  numero_cel?: string;
  num_verificado: boolean;
  created_at: string;
}

export interface LideresInsert {
  id?: string;
  nombre: string;
  clave_electoral?: string;
  curp?: string;
  direccion?: string;
  colonia?: string;
  codigo_postal?: string;
  seccion?: string;
  entidad?: string;
  municipio?: string;
  numero_cel?: string;
  num_verificado?: boolean;
  created_at?: string;
}

export interface LideresUpdate {
  id?: string;
  nombre?: string;
  clave_electoral?: string;
  curp?: string;
  direccion?: string;
  colonia?: string;
  codigo_postal?: string;
  seccion?: string;
  entidad?: string;
  municipio?: string;
  numero_cel?: string;
  num_verificado?: boolean;
  created_at?: string;
}

// Brigadistas table types
export interface BrigadistasRow {
  id: string;
  lider_id: string;
  nombre: string;
  clave_electoral?: string;
  curp?: string;
  direccion?: string;
  colonia?: string;
  codigo_postal?: string;
  seccion?: string;
  entidad?: string;
  municipio?: string;
  numero_cel?: string;
  num_verificado: boolean;
  created_at: string;
}

export interface BrigadistasInsert {
  id?: string;
  lider_id: string;
  nombre: string;
  clave_electoral?: string;
  curp?: string;
  direccion?: string;
  colonia?: string;
  codigo_postal?: string;
  seccion?: string;
  entidad?: string;
  municipio?: string;
  numero_cel?: string;
  num_verificado?: boolean;
  created_at?: string;
}

export interface BrigadistasUpdate {
  id?: string;
  lider_id?: string;
  nombre?: string;
  clave_electoral?: string;
  curp?: string;
  direccion?: string;
  colonia?: string;
  codigo_postal?: string;
  seccion?: string;
  entidad?: string;
  municipio?: string;
  numero_cel?: string;
  num_verificado?: boolean;
  created_at?: string;
}

// Movilizadores table types
export interface MovilizadoresRow {
  id: string;
  brigadista_id: string;
  nombre: string;
  clave_electoral: string;
  curp: string;
  direccion: string;
  colonia: string;
  codigo_postal?: string;
  seccion?: string;
  entidad?: string;
  municipio?: string;
  numero_cel?: string;
  num_verificado: boolean;
  created_at: string;
}

export interface MovilizadoresInsert {
  id?: string;
  brigadista_id: string;
  nombre: string;
  clave_electoral: string;
  curp: string;
  direccion: string;
  colonia: string;
  codigo_postal?: string;
  seccion?: string;
  entidad?: string;
  municipio?: string;
  numero_cel?: string;
  num_verificado?: boolean;
  created_at?: string;
}

export interface MovilizadoresUpdate {
  id?: string;
  brigadista_id?: string;
  nombre?: string;
  clave_electoral?: string;
  curp?: string;
  direccion?: string;
  colonia?: string;
  codigo_postal?: string;
  seccion?: string;
  entidad?: string;
  municipio?: string;
  numero_cel?: string;
  num_verificado?: boolean;
  created_at?: string;
}

// Ciudadanos table types
export interface CiudadanosRow {
  id: string;
  movilizador_id: string;
  nombre: string;
  direccion: string;
  clave_electoral: string;
  curp: string;
  colonia: string;
  codigo_postal?: string;
  seccion?: string;
  entidad?: string;
  municipio?: string;
  numero_cel?: string;
  num_verificado: boolean;
  created_at: string;
}

export interface CiudadanosInsert {
  id?: string;
  movilizador_id: string;
  nombre: string;
  direccion: string;
  clave_electoral: string;
  curp: string;
  colonia: string;
  codigo_postal?: string;
  seccion?: string;
  entidad?: string;
  municipio?: string;
  numero_cel?: string;
  num_verificado?: boolean;
  created_at?: string;
}

export interface CiudadanosUpdate {
  id?: string;
  movilizador_id?: string;
  nombre?: string;
  direccion?: string;
  clave_electoral?: string;
  curp?: string;
  colonia?: string;
  codigo_postal?: string;
  seccion?: string;
  entidad?: string;
  municipio?: string;
  numero_cel?: string;
  num_verificado?: boolean;
  created_at?: string;
}

// Nested query result types for hierarchical data
export interface LiderWithHierarchy extends LideresRow {
  brigadistas: BrigadistaWithHierarchy[];
}

export interface BrigadistaWithHierarchy extends BrigadistasRow {
  movilizadores: MovilizadorWithHierarchy[];
}

export interface MovilizadorWithHierarchy extends MovilizadoresRow {
  ciudadanos: CiudadanosRow[];
}

// Query result types for analytics
export interface WorkerCounts {
  lideres: number;
  brigadistas: number;
  movilizadores: number;
  ciudadanos: number;
}

export interface RegionCounts {
  entidad: string;
  municipio?: string;
  seccion?: string;
  lideres: number;
  brigadistas: number;
  movilizadores: number;
  ciudadanos: number;
  total: number;
}

export interface VerificationStats {
  total_records: number;
  verified_records: number;
  verification_rate: number;
  by_role: {
    lideres: { total: number; verified: number; rate: number };
    brigadistas: { total: number; verified: number; rate: number };
    movilizadores: { total: number; verified: number; rate: number };
    ciudadanos: { total: number; verified: number; rate: number };
  };
}

export interface RegistrationTrends {
  date: string;
  lideres: number;
  brigadistas: number;
  movilizadores: number;
  ciudadanos: number;
  total: number;
}

// Database query options
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  filters?: Record<string, unknown>;
}

// Database connection configuration
export interface DatabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  schema?: string;
  autoRefreshToken?: boolean;
  persistSession?: boolean;
  detectSessionInUrl?: boolean;
}

// Database operation results
export interface DatabaseResult<T> {
  data: T | null;
  error: DatabaseError | null;
  count?: number;
}

export interface DatabaseError {
  message: string;
  code?: string;
  details?: unknown;
  hint?: string;
}

// Batch operation types
export interface BatchInsertResult {
  successful: number;
  failed: number;
  errors: DatabaseError[];
}

export interface BatchUpdateResult {
  successful: number;
  failed: number;
  errors: DatabaseError[];
}

// Real-time subscription types
export interface RealtimeSubscription {
  table: 'lideres' | 'brigadistas' | 'movilizadores' | 'ciudadanos';
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  callback: (payload: RealtimePayload) => void;
}

export interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
  table: string;
  schema: string;
  commit_timestamp: string;
}

// Index recommendations for query optimization
export interface IndexRecommendation {
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  reason: string;
  estimatedImprovement: string;
}

// Query performance metrics
export interface QueryPerformanceMetrics {
  query: string;
  executionTime: number;
  rowsReturned: number;
  planningTime: number;
  executionPlan?: string;
  suggestions: string[];
}