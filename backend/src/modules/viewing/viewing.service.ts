import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AuditService } from '../audit/audit.service';

export interface ViewingFeedback {
  satisfaction: 'satisfied' | 'neutral' | 'unsatisfied';
  notes: string;
  followUpAction?: string;
  submittedAt: Date;
}

export interface Viewing {
  id: string;
  propertyId: string;
  consultantId: string;
  consultantName: string;
  viewerName: string;
  viewerCompany: string;
  viewerContact: string;
  viewDate: Date;
  feedback?: ViewingFeedback;
  createdAt: Date;
}

export interface ViewingFilters {
  propertyId?: string;
  consultantId?: string;
  feedback?: string;
  from?: string;
  to?: string;
}

export interface PropertyViewingSummary {
  totalViewings: number;
  satisfiedCount: number;
  unsatisfiedCount: number;
  neutralCount: number;
  latestFeedback: ViewingFeedback | null;
}

@Injectable()
export class ViewingService {
  private readonly viewings: Viewing[] = [];

  constructor(private readonly auditService: AuditService) {}

  create(data: Omit<Viewing, 'id' | 'createdAt'>, userId: string, userName: string, userRole: string): Viewing {
    const viewing: Viewing = {
      id: uuidv4(),
      ...data,
      createdAt: new Date(),
    };
    this.viewings.push(viewing);
    this.auditService.log({
      userId,
      userName,
      userRole,
      action: 'create',
      entity: 'viewing',
      entityId: viewing.id,
      after: viewing,
    });
    return viewing;
  }

  findAll(filters?: ViewingFilters): Viewing[] {
    let result = [...this.viewings];

    if (filters?.propertyId) {
      result = result.filter((v) => v.propertyId === filters.propertyId);
    }
    if (filters?.consultantId) {
      result = result.filter((v) => v.consultantId === filters.consultantId);
    }
    if (filters?.feedback !== undefined) {
      const hasFeedback = String(filters.feedback) === 'true';
      result = result.filter((v) =>
        hasFeedback ? v.feedback !== undefined : v.feedback === undefined,
      );
    }
    if (filters?.from) {
      const fromDate = new Date(filters.from);
      result = result.filter((v) => v.viewDate >= fromDate);
    }
    if (filters?.to) {
      const toDate = new Date(filters.to);
      result = result.filter((v) => v.viewDate <= toDate);
    }

    result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return result;
  }

  findOne(id: string): Viewing {
    const viewing = this.viewings.find((v) => v.id === id);
    if (!viewing) {
      throw new NotFoundException(`Viewing with id "${id}" not found`);
    }
    return viewing;
  }

  addFeedback(
    id: string,
    feedback: { satisfaction: 'satisfied' | 'neutral' | 'unsatisfied'; notes: string; followUpAction?: string },
    userId: string,
    userName: string,
    userRole: string,
  ): Viewing {
    const viewing = this.findOne(id);
    const before = { ...viewing };

    viewing.feedback = {
      ...feedback,
      submittedAt: new Date(),
    };

    this.auditService.log({
      userId,
      userName,
      userRole,
      action: 'add_feedback',
      entity: 'viewing',
      entityId: viewing.id,
      before,
      after: viewing,
    });

    return viewing;
  }

  getPropertyViewingSummary(propertyId: string): PropertyViewingSummary {
    const propertyViewings = this.viewings.filter(
      (v) => v.propertyId === propertyId,
    );

    const withFeedback = propertyViewings.filter((v) => v.feedback);

    const satisfiedCount = withFeedback.filter(
      (v) => v.feedback!.satisfaction === 'satisfied',
    ).length;
    const unsatisfiedCount = withFeedback.filter(
      (v) => v.feedback!.satisfaction === 'unsatisfied',
    ).length;
    const neutralCount = withFeedback.filter(
      (v) => v.feedback!.satisfaction === 'neutral',
    ).length;

    const sortedByFeedbackDate = [...withFeedback].sort(
      (a, b) =>
        b.feedback!.submittedAt.getTime() - a.feedback!.submittedAt.getTime(),
    );

    return {
      totalViewings: propertyViewings.length,
      satisfiedCount,
      unsatisfiedCount,
      neutralCount,
      latestFeedback: sortedByFeedbackDate[0]?.feedback ?? null,
    };
  }
}
