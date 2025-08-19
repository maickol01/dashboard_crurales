// Worker types for Dashboard CRurales
// Specific types for worker management and analytics

// Worker role enumeration
export type WorkerRole = 'lider' | 'brigadista' | 'movilizador';

// Worker status enumeration
export type WorkerStatus = 'active' | 'inactive' | 'suspended' | 'pending';

// Worker performance level enumeration
export type WorkerPerformanceLevel = 'excellent' | 'good' | 'average' | 'poor';

// Worker contact information
export interface WorkerContactInfo {
  numero_cel?: string;
  num_verificado: boolean;
  email?: string;
  preferredContactMethod: 'phone' | 'email' | 'whatsapp';
  lastContactDate?: Date;
  contactAttempts: number;
}

// Worker location details
export interface WorkerLocationDetails {
  direccion?: string;
  colonia?: string;
  codigo_postal?: string;
  seccion?: string;
  entidad?: string;
  municipio?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  territoryAssigned?: string[];
}

// Worker activity tracking
export interface WorkerActivity {
  workerId: string;
  activityType: 'registration' | 'verification' | 'contact' | 'meeting' | 'training';
  description: string;
  timestamp: Date;
  relatedCitizenId?: string;
  location?: string;
  notes?: string;
}

// Worker performance summary
export interface WorkerPerformanceSummary {
  workerId: string;
  workerName: string;
  role: WorkerRole;
  performanceLevel: WorkerPerformanceLevel;
  
  // Registration metrics
  totalRegistrations: number;
  monthlyRegistrations: number;
  weeklyRegistrations: number;
  dailyAverage: number;
  
  // Quality metrics
  verificationRate: number;
  dataCompletenessRate: number;
  duplicateRate: number;
  
  // Activity metrics
  lastActivityDate: Date;
  activeDays: number;
  totalActivities: number;
  
  // Goal tracking
  monthlyGoal: number;
  goalProgress: number;
  goalStatus: 'on-track' | 'behind' | 'ahead' | 'completed';
  
  // Ranking and comparison
  rankInLevel: number;
  totalInLevel: number;
  percentileRank: number;
  
  // Trends
  performanceTrend: 'improving' | 'stable' | 'declining';
  trendPercentage: number;
}

// Worker training and development
export interface WorkerTraining {
  workerId: string;
  trainingType: 'onboarding' | 'skills' | 'leadership' | 'technology' | 'compliance';
  trainingName: string;
  completionDate?: Date;
  score?: number;
  certificateUrl?: string;
  expirationDate?: Date;
  required: boolean;
  status: 'not-started' | 'in-progress' | 'completed' | 'expired';
}

// Worker goal setting and tracking
export interface WorkerGoalSetting {
  workerId: string;
  goalType: 'registrations' | 'verifications' | 'quality' | 'activity';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  targetValue: number;
  currentValue: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  notes?: string;
}

// Worker network structure
export interface WorkerNetwork {
  workerId: string;
  role: WorkerRole;
  parentId?: string;
  parentName?: string;
  childrenIds: string[];
  childrenNames: string[];
  networkSize: number;
  networkDepth: number;
  directReports: number;
  totalDownline: number;
}

// Worker analytics summary
export interface WorkerAnalyticsSummary {
  workerId: string;
  workerName: string;
  role: WorkerRole;
  
  // Performance indicators
  kpis: {
    registrations: number;
    verificationRate: number;
    qualityScore: number;
    activityScore: number;
    overallScore: number;
  };
  
  // Comparative metrics
  rankings: {
    overall: number;
    inRole: number;
    inRegion: number;
  };
  
  // Time-based analysis
  trends: {
    last7Days: number;
    last30Days: number;
    last90Days: number;
    yearToDate: number;
  };
  
  // Efficiency metrics
  efficiency: {
    registrationsPerDay: number;
    verificationsPerDay: number;
    costPerRegistration: number;
    timeToComplete: number;
  };
  
  // Predictive analytics
  predictions: {
    monthEndProjection: number;
    quarterEndProjection: number;
    riskScore: number;
    churnProbability: number;
  };
}

// Worker feedback and evaluation
export interface WorkerFeedback {
  workerId: string;
  evaluatorId: string;
  evaluatorName: string;
  evaluationType: 'self' | 'supervisor' | 'peer' | '360';
  evaluationDate: Date;
  
  ratings: {
    performance: number;
    quality: number;
    communication: number;
    leadership: number;
    teamwork: number;
  };
  
  strengths: string[];
  areasForImprovement: string[];
  actionItems: string[];
  overallRating: number;
  comments?: string;
}

// Worker incentives and recognition
export interface WorkerIncentive {
  workerId: string;
  incentiveType: 'bonus' | 'recognition' | 'promotion' | 'training' | 'equipment';
  title: string;
  description: string;
  value?: number;
  currency?: string;
  awardDate: Date;
  criteria: string;
  status: 'pending' | 'approved' | 'delivered' | 'cancelled';
}

// Worker communication preferences
export interface WorkerCommunicationPreferences {
  workerId: string;
  preferredLanguage: 'es' | 'en';
  communicationFrequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  preferredTime: 'morning' | 'afternoon' | 'evening';
  channels: {
    sms: boolean;
    whatsapp: boolean;
    email: boolean;
    phone: boolean;
    inPerson: boolean;
  };
  notifications: {
    goals: boolean;
    performance: boolean;
    training: boolean;
    announcements: boolean;
  };
}

// Worker support and assistance
export interface WorkerSupport {
  workerId: string;
  supportType: 'technical' | 'training' | 'personal' | 'administrative';
  requestDate: Date;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  assignedTo?: string;
  resolutionDate?: Date;
  resolutionNotes?: string;
  satisfactionRating?: number;
}