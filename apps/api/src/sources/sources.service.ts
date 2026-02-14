import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { Source, Category } from '../database/entities';
import { QUEUE_NAMES, JOB_NAMES } from '@cti/shared';
import { AuditService } from '../audit/audit.service';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SourcesService {
  private readonly encKey: Buffer;

  constructor(
    @InjectRepository(Source) private sourceRepo: Repository<Source>,
    @InjectRepository(Category) private catRepo: Repository<Category>,
    @InjectQueue(QUEUE_NAMES.INGEST) private ingestQueue: Queue,
    private auditService: AuditService,
    private config: ConfigService,
  ) {
    const key = this.config.get('ENCRYPTION_KEY', 'change_me_32_byte_hex_key_000000');
    this.encKey = Buffer.from(key.padEnd(32, '0').slice(0, 32));
  }

  private encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', this.encKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(text: string): string {
    const [ivHex, encrypted] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = createDecipheriv('aes-256-cbc', this.encKey, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async findAll(page = 1, limit = 20) {
    const [data, total] = await this.sourceRepo.findAndCount({
      relations: ['categories'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const source = await this.sourceRepo.findOne({ where: { id }, relations: ['categories'] });
    if (!source) throw new NotFoundException('Fonte não encontrada');
    return source;
  }

  async findEnabled() {
    return this.sourceRepo.find({ where: { enabled: true }, relations: ['categories'] });
  }

  async create(data: any, actorId: string) {
    if (data.authConfig) {
      data.authConfigEncrypted = this.encrypt(JSON.stringify(data.authConfig));
      delete data.authConfig;
    }
    let categories: Category[] = [];
    if (data.categoryIds) {
      categories = await this.catRepo.findByIds(data.categoryIds);
      delete data.categoryIds;
    }
    const source = this.sourceRepo.create(data as Partial<Source>);
    source.categories = categories;
    const saved = await this.sourceRepo.save(source);
    await this.auditService.log(actorId, 'SOURCE_CREATED', 'source', saved.id);
    return saved;
  }

  async update(id: string, data: any, actorId: string) {
    const source = await this.findById(id);
    if (data.authConfig) {
      data.authConfigEncrypted = this.encrypt(JSON.stringify(data.authConfig));
      delete data.authConfig;
    }
    if (data.categoryIds) {
      source.categories = await this.catRepo.findByIds(data.categoryIds);
      delete data.categoryIds;
    }
    Object.assign(source, data);
    const saved = await this.sourceRepo.save(source);
    await this.auditService.log(actorId, 'SOURCE_UPDATED', 'source', id);
    return saved;
  }

  async delete(id: string, actorId: string) {
    const source = await this.findById(id);
    await this.sourceRepo.remove(source);
    await this.auditService.log(actorId, 'SOURCE_DELETED', 'source', id);
    return { message: 'Fonte removida com sucesso' };
  }

  async triggerFetch(id: string, actorId: string) {
    const source = await this.findById(id);
    await this.ingestQueue.add(JOB_NAMES.FETCH_SOURCE, { sourceId: source.id });
    await this.auditService.log(actorId, 'SOURCE_FETCH_TRIGGERED', 'source', id);
    return { message: 'Coleta enfileirada' };
  }

  getDecryptedAuth(source: Source): Record<string, string> | null {
    if (!source.authConfigEncrypted) return null;
    try {
      return JSON.parse(this.decrypt(source.authConfigEncrypted));
    } catch {
      return null;
    }
  }
}
