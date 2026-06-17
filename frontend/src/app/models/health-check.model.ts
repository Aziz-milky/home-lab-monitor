export interface HealthCheck {
  id: string;
  service: { id: string };
  status: 'UP' | 'DOWN';
  responseTimeMs: number;
  httpStatus: number;
  errorMessage: string | null;
  checkedAt: string;
}
