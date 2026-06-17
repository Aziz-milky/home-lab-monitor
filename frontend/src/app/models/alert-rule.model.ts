export interface AlertRule {
  id: string;
  service: { id: string };
  ruleType: 'RESPONSE_TIME' | 'FAILURE_COUNT';
  thresholdMs: number | null;
  failureCount: number | null;
  enabled: boolean;
}
