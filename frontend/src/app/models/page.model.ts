export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface DashboardEntry {
  serviceId: string;
  serviceName: string;
  serviceType: string;
  active: boolean;
  status: 'UP' | 'DOWN' | 'UNKNOWN';
  responseTimeMs: number | null;
  httpStatus: number | null;
  errorMessage: string | null;
  checkedAt: string | null;
}
