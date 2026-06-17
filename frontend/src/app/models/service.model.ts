export interface Service {
  id: string;
  name: string;
  host: string;
  port: number;
  serviceType: ServiceType;
  checkUrl: string;
  active: boolean;
  createdAt: string;
}

export type ServiceType = 'PROXMOX' | 'TRUENAS' | 'PIHOLE' | 'GRAFANA' | 'OLLAMA' | 'GENERIC';

export const SERVICE_TYPES: ServiceType[] = [
  'PROXMOX', 'TRUENAS', 'PIHOLE', 'GRAFANA', 'OLLAMA', 'GENERIC'
];
