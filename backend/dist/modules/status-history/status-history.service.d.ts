import { Repository } from 'typeorm';
import { StatusChangeHistory, EntityType } from '../../entities/status-change-history.entity';
import { User } from '../../entities/user.entity';
export declare class StatusChangeHistoryService {
    private historyRepository;
    private userRepository;
    constructor(historyRepository: Repository<StatusChangeHistory>, userRepository: Repository<User>);
    recordStatusChange(entityType: EntityType, entityId: string, fromStatus: string, toStatus: string, changedById: string, reason?: string, remarks?: string): Promise<StatusChangeHistory>;
    getHistoryByEntity(entityType: EntityType, entityId: string): Promise<any[]>;
    getLatestStatusChange(entityType: EntityType, entityId: string): Promise<StatusChangeHistory | null>;
}
