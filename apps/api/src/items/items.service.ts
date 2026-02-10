import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Item } from '../database/entities';
import { VisibilityScope } from '@cti/shared';
import { User } from '../database/entities';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item) private itemRepo: Repository<Item>,
  ) {}

  async findAll(filters: any, user: User) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);

    let qb = this.itemRepo.createQueryBuilder('item')
      .leftJoinAndSelect('item.categories', 'category')
      .leftJoinAndSelect('item.source', 'source');

    // Visibility: PUBLIC or user's groups
    qb = this.applyVisibility(qb, user);

    // Full-text search
    if (filters.search) {
      qb.andWhere(
        `item."searchVector" @@ plainto_tsquery('english', :search)`,
        { search: filters.search },
      );
      qb.addOrderBy(
        `ts_rank(item."searchVector", plainto_tsquery('english', :search))`,
        'DESC',
      );
    }

    // Category filter
    if (filters.categories?.length) {
      qb.andWhere('category.slug IN (:...categories)', { categories: filters.categories });
    }

    // Source filter
    if (filters.sourceIds?.length) {
      qb.andWhere('item."sourceId" IN (:...sourceIds)', { sourceIds: filters.sourceIds });
    }

    // Tag filter
    if (filters.tags?.length) {
      for (let i = 0; i < filters.tags.length; i++) {
        qb.andWhere(`item.tags LIKE :tag${i}`, { [`tag${i}`]: `%${filters.tags[i]}%` });
      }
    }

    // CVE filter
    if (filters.cve) {
      qb.andWhere('item.cves LIKE :cve', { cve: `%${filters.cve}%` });
    }

    // Severity filter
    if (filters.severity) {
      qb.andWhere('item.severity = :severity', { severity: filters.severity });
    }

    // Date filters
    if (filters.dateFrom) {
      qb.andWhere('item."collectedAt" >= :dateFrom', { dateFrom: filters.dateFrom });
    }
    if (filters.dateTo) {
      qb.andWhere('item."collectedAt" <= :dateTo', { dateTo: filters.dateTo });
    }

    if (!filters.search) {
      qb.orderBy('item."collectedAt"', 'DESC');
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string, user: User) {
    const item = await this.itemRepo.findOne({
      where: { id },
      relations: ['categories', 'source'],
    });
    if (!item) throw new NotFoundException('Item not found');

    // Check visibility
    if (item.visibilityScope === VisibilityScope.GROUPS) {
      const userGroupIds = (user.groups || []).map((g) => g.id);
      const itemGroupIds = item.visibilityGroupIds || [];
      const hasAccess = itemGroupIds.some((gid) => userGroupIds.includes(gid));
      if (!hasAccess && user.role !== 'admin') {
        throw new ForbiddenException('Access denied');
      }
    }
    return item;
  }

  private applyVisibility(qb: SelectQueryBuilder<Item>, user: User) {
    if (user.role === 'admin') return qb;

    const userGroupIds = (user.groups || []).map((g) => g.id);
    if (userGroupIds.length > 0) {
      qb.andWhere(
        `(item."visibilityScope" = 'public' OR (item."visibilityScope" = 'groups' AND (${userGroupIds.map((_, i) => `item."visibilityGroupIds" LIKE :gid${i}`).join(' OR ')})))`,
        userGroupIds.reduce((acc, gid, i) => ({ ...acc, [`gid${i}`]: `%${gid}%` }), {}),
      );
    } else {
      qb.andWhere(`item."visibilityScope" = 'public'`);
    }
    return qb;
  }
}
