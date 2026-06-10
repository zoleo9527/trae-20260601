import { IdempotentRepository } from '../repositories/IdempotentRepository'

export class IdempotentService {
  private idempotentRepository: IdempotentRepository

  constructor() {
    this.idempotentRepository = new IdempotentRepository()
  }

  async checkAndLock(requestId: string): Promise<{ isNew: boolean; response?: string }> {
    const existing = await this.idempotentRepository.findById(requestId)
    
    if (!existing) {
      await this.idempotentRepository.create(requestId)
      return { isNew: true }
    }

    if (existing.status === 'completed') {
      return { isNew: false, response: existing.response }
    }

    if (existing.status === 'processing') {
      throw new Error('请求正在处理中，请稍后重试')
    }

    await this.idempotentRepository.create(requestId)
    return { isNew: true }
  }

  async complete(requestId: string, response: string): Promise<void> {
    await this.idempotentRepository.complete(requestId, response)
  }

  async fail(requestId: string): Promise<void> {
    await this.idempotentRepository.fail(requestId)
  }
}