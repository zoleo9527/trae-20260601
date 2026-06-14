import { Injectable } from '@nestjs/common';
import { InMemoryStore, IdemRecord } from '../store/in-memory.store';

export type EntityType = 'LEAVE' | 'MAKEUP' | 'EXPORT';

@Injectable()
export class IdempotencyService {
  constructor(private readonly store: InMemoryStore) {}

  checkLeave(key: string) {
    if (!key) return null;
    return this.store.findLeaveByIdemKey(key);
  }

  checkMakeup(key: string) {
    if (!key) return null;
    return this.store.findMakeupByIdemKey(key);
  }

  checkExportTask(key: string) {
    if (!key) return null;
    return this.store.findExportTaskByIdemKey(key);
  }

  /**
   * 统一操作级幂等：检查+注册原子性
   * @returns 如果已存在则返回历史记录，返回 null 表示是首次请求，调用方继续执行
   */
  consumeOperation(
    idemKey: string,
    entityType: EntityType,
    entityId: string | null,
    action: string,
    actorId: string,
  ): IdemRecord | null {
    return this.store.checkAndSetOperationIdem(
      idemKey,
      entityType,
      entityId,
      action,
      actorId,
    );
  }

  findOperation(key: string): IdemRecord | undefined {
    return this.store.findOperationIdem(key);
  }
}
