import { FileRecord, OperationLog, Reminder, FileStatus, OperatorRole, ImperfectScenario, CollectionContext, HandoverRecord } from '../types';

const API_BASE_URL = '/api';

interface CurrentUser {
  id: string;
  name: string;
  role: OperatorRole;
}

let currentUser: CurrentUser | null = null;

export const setCurrentUser = (user: CurrentUser) => {
  currentUser = user;
};

export const getCurrentUser = () => currentUser;

class FileWorkflowAPI {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (currentUser) {
      headers['X-User-Id'] = currentUser.id;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: this.getHeaders(),
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '请求失败' }));
      throw new Error(error.error || '请求失败');
    }

    return response.json();
  }

  getFiles(status?: FileStatus, role?: OperatorRole): Promise<{ success: boolean; data: FileRecord[]; count: number }> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (role) params.append('role', role);

    return this.request(`/files?${params.toString()}`);
  }

  getFile(fileId: string): Promise<{ success: boolean; data: FileRecord }> {
    return this.request(`/files/${fileId}`);
  }

  startArchive(fileId: string): Promise<{ success: boolean; data: FileRecord; message: string }> {
    return this.request(`/files/${fileId}/archive/start`, {
      method: 'POST',
    });
  }

  completeArchive(
    fileId: string,
    archiveLocation: string,
    archiveReason: string,
    archiveNote: string,
    notarialApproval?: { notaryId: string; notaryName: string; approvalNote?: string }
  ): Promise<{ success: boolean; data: FileRecord; message: string }> {
    return this.request(`/files/${fileId}/archive/complete`, {
      method: 'POST',
      body: JSON.stringify({
        archiveLocation,
        archiveReason,
        archiveNote,
        notarialApproval,
      }),
    });
  }

  transferToCollection(
    fileId: string,
    assignedRole?: OperatorRole,
    assignedOperatorId?: string,
    assignedOperatorName?: string,
    transferReason?: string
  ): Promise<{
    success: boolean;
    data: FileRecord;
    handoverRecord: HandoverRecord;
    transferredContext: {
      responsiblePerson: FileRecord['responsiblePerson'];
      archiveInfo: FileRecord['archiveInfo'];
      responsibilityChain: FileRecord['responsibilityChain'];
      recentHistory: OperationLog[];
    };
    message: string;
  }> {
    return this.request(`/files/${fileId}/transfer-to-collection`, {
      method: 'POST',
      body: JSON.stringify({
        assignedRole,
        assignedOperatorId,
        assignedOperatorName,
        transferReason,
      }),
    });
  }

  getCollectionContext(
    fileId: string
  ): Promise<{
    success: boolean;
    data: {
      responsiblePerson?: FileRecord['responsiblePerson'];
      archiveInfo?: FileRecord['archiveInfo'];
      recentHistory: OperationLog[];
      collectionContext?: CollectionContext;
      pendingHandover?: HandoverRecord | null;
    };
  }> {
    return this.request(`/files/${fileId}/collection-context`);
  }

  getCollectionContextDetailed(
    fileId: string
  ): Promise<{
    success: boolean;
    data: {
      fileInfo: {
        id: string;
        appointmentNumber: string;
        applicationId: string;
        currentStatus: FileStatus;
        expiresAt?: Date | string;
      };
      archiveContext: CollectionContext['archiveContext'];
      handoverRecord: HandoverRecord;
      responsibilityChain: CollectionContext['responsibilityChain'];
      recentHistory: OperationLog[];
      pendingCorrections?: string[];
      allHistory: OperationLog[];
    };
  }> {
    return this.request(`/files/${fileId}/collection-context/detailed`);
  }

  confirmCollection(
    fileId: string,
    collectorName: string,
    collectorId: string,
    collectionNote: string
  ): Promise<{ success: boolean; data: FileRecord; message: string }> {
    return this.request(`/files/${fileId}/collection/confirm`, {
      method: 'POST',
      body: JSON.stringify({
        collectorName,
        collectorId,
        collectionNote,
      }),
    });
  }

  requestCorrection(
    fileId: string,
    correctionContent: string
  ): Promise<{ success: boolean; data: FileRecord; message: string }> {
    return this.request(`/files/${fileId}/correction`, {
      method: 'POST',
      body: JSON.stringify({
        correctionContent,
      }),
    });
  }

  getFileHistory(fileId: string): Promise<{ success: boolean; data: OperationLog[]; count: number }> {
    return this.request(`/files/${fileId}/history`);
  }

  getMyReminders(): Promise<{
    success: boolean;
    data: Reminder[];
    count: number;
    summary: {
      urgent: number;
      high: number;
      medium: number;
      low: number;
    };
  }> {
    return this.request('/files/reminders/my');
  }

  acknowledgeReminder(
    reminderId: string
  ): Promise<{ success: boolean; acknowledgedAt: Date | null; message: string }> {
    return this.request(`/files/reminders/${reminderId}/acknowledge`, {
      method: 'POST',
    });
  }

  getOperationLogs(fileId?: string): Promise<{ success: boolean; data: OperationLog[]; count: number }> {
    const params = fileId ? `?fileId=${fileId}` : '';
    return this.request(`/files/logs${params}`);
  }

  getPendingHandovers(): Promise<{
    success: boolean;
    data: Array<{
      file: FileRecord;
      handover: HandoverRecord | undefined;
      collectionContext: CollectionContext | null;
    }>;
    count: number;
  }> {
    return this.request('/files/handover/pending');
  }

  acknowledgeHandover(
    handoverId: string
  ): Promise<{ success: boolean; acknowledgedAt: Date | null; message: string }> {
    return this.request(`/files/handover/${handoverId}/acknowledge`, {
      method: 'POST',
    });
  }

  getImperfectScenarios(): Promise<{
    success: boolean;
    data: ImperfectScenario[];
    count: number;
    message: string;
  }> {
    return this.request('/files/scenarios/imperfect');
  }

  triggerScenarioReminder(
    scenarioId: string
  ): Promise<{ success: boolean; data: Reminder; message: string }> {
    return this.request(`/files/scenarios/${scenarioId}/trigger-reminder`, {
      method: 'POST',
    });
  }
}

export const api = new FileWorkflowAPI();
