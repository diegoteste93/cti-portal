import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../database/entities';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private catRepo: Repository<Category>,
    private auditService: AuditService,
  ) {}

  async findAll() {
    return this.catRepo.find({ order: { name: 'ASC' } });
  }

  async findById(id: string) {
    const cat = await this.catRepo.findOneBy({ id });
    if (!cat) throw new NotFoundException('Categoria não encontrada');
    return cat;
  }

  async create(data: { name: string; slug: string; description?: string }, actorId: string) {
    const cat = this.catRepo.create(data);
    const saved = await this.catRepo.save(cat);
    await this.auditService.log(actorId, 'CATEGORY_CREATED', 'category', saved.id);
    return saved;
  }

  async update(id: string, data: Partial<Category>, actorId: string) {
    const cat = await this.findById(id);
    Object.assign(cat, data);
    const saved = await this.catRepo.save(cat);
    await this.auditService.log(actorId, 'CATEGORY_UPDATED', 'category', id);
    return saved;
  }

  async delete(id: string, actorId: string) {
    const cat = await this.findById(id);
    await this.catRepo.remove(cat);
    await this.auditService.log(actorId, 'CATEGORY_DELETED', 'category', id);
  }
}
