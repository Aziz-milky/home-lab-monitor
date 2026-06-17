export interface ServiceDependency {
  id: string;
  sourceService: { id: string; name: string; serviceType: string };
  targetService: { id: string; name: string; serviceType: string };
  label: string;
}
