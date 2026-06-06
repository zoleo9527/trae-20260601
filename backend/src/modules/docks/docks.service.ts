import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dock } from '../../entities/dock.entity';
import { DockStatus } from '../../common/enums';

@Injectable()
export class DocksService {
  constructor(
    @InjectRepository(Dock)
    private docksRepository: Repository<Dock>,
  ) {}

  async findAll() {
    return this.docksRepository.find({ order: { code: 'ASC' } });
  }

  async findAvailable() {
    return this.docksRepository.find({ where: { status: DockStatus.AVAILABLE }, order: { code: 'ASC' } });
  }

  async findOne(id: string) {
    return this.docksRepository.findOne({ where: { id } });
  }
}
