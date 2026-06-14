import { Injectable } from '@nestjs/common';
import { InMemoryStore } from '../store/in-memory.store';

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
}
