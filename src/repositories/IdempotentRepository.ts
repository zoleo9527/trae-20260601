import Idempotent, { IIdempotent } from '../models/Idempotent'

export class IdempotentRepository {
  async create(requestId: string): Promise<IIdempotent> {
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)
    
    const idempotent = new Idempotent({
      requestId,
      status: 'processing',
      expiresAt
    })
    return await idempotent.save()
  }

  async findById(requestId: string): Promise<IIdempotent | null> {
    return await Idempotent.findOne({ requestId })
  }

  async complete(requestId: string, response: string): Promise<IIdempotent | null> {
    return await Idempotent.findOneAndUpdate(
      { requestId },
      { status: 'completed', response },
      { new: true }
    )
  }

  async fail(requestId: string): Promise<IIdempotent | null> {
    return await Idempotent.findOneAndUpdate(
      { requestId },
      { status: 'failed' },
      { new: true }
    )
  }
}