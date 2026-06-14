export interface ExportTask {
  id: string;
  taskNo: string;
  type: 'LEAVE' | 'MAKEUP';
  format: 'CSV' | 'EXCEL';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  requestedBy: string;
  requestedByName: string;
  filters: Record<string, any>;
  fileUrl: string | null;
  createdAt: string;
  completedAt: string | null;
}
