import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../database/entities';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
  ) {}

  async log(
    actorUserId: string | null,
    action: string,
    objectType: string,
    objectId?: string,
    diffJson?: Record<string, unknown>,
  ): Promise<AuditLog> {
    const entry = this.auditRepo.create({
      actorUserId: actorUserId ?? undefined,
      action,
      objectType,
      objectId,
      diffJson,
    });
    return this.auditRepo.save(entry);
  }

  async findAll(page = 1, limit = 50) {
    const [data, total] = await this.auditRepo.findAndCount({
      relations: ['actor'],
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
