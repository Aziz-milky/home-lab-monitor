export interface DiagnosticReport {
  serviceId: string;
  serviceName: string;
  serviceType: string;
  currentStatus: string;
  healthScore: number;
  uptime1h: number;
  uptime24h: number;
  uptime7d: number;
  avgResponseTimeMs: number;
  totalChecks: number;
  flapping: boolean;
  flappingRate: number;
  trend: string;
  trendSlope: number;
  anomalyScore: number;
  activeAlerts: number;
  issues: DiagnosticIssue[];
  aiInsight: string | null;
  aiAvailable: boolean;
}

export interface DiagnosticIssue {
  severity: string;
  type: string;
  description: string;
  suggestedAction: string;
}
