export interface Alert {
  id: string;
  service: { id: string };
  severity: Severity;
  message: string;
  acknowledged: boolean;
  triggeredAt: string;
  acknowledgedAt: string | null;
}

export type Severity = 'INFO' | 'WARNING' | 'CRITICAL';
