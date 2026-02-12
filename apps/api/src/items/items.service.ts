import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { Item } from '../database/entities';
import { VisibilityScope } from '@cti/shared';
import { User } from '../database/entities';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item) private itemRepo: Repository<Item>,
  ) {}

  async findAll(filters: any, user: User) {
    const page = Number(filters.page) || 1;
    const limit = Math.min(Number(filters.limit) || 20, 100);
    const normalizedFilters = {
      ...filters,
      categories: this.normalizeArrayFilter(filters.categories),
      sourceIds: this.normalizeArrayFilter(filters.sourceIds),
      tags: this.normalizeArrayFilter(filters.tags),
      search: typeof filters.search === 'string' ? filters.search.trim() : '',
    };

    let query = this.buildListQuery(normalizedFilters, user, true);

    try {
      return await this.executePagedQuery(query, page, limit);
    } catch (error) {
      if (!normalizedFilters.search || !this.shouldFallbackSearch(error)) {
        throw error;
      }

      query = this.buildListQuery(normalizedFilters, user, false);
      return this.executePagedQuery(query, page, limit);
    }
  }

  async findById(id: string, user: User) {
    const item = await this.itemRepo.findOne({
      where: { id },
      relations: ['categories', 'source'],
    });
    if (!item) throw new NotFoundException('Item não encontrado');

    // Check visibility
    if (item.visibilityScope === VisibilityScope.GROUPS) {
      const userGroupIds = (user.groups || []).map((g) => g.id);
      const itemGroupIds = item.visibilityGroupIds || [];
      const hasAccess = itemGroupIds.some((gid) => userGroupIds.includes(gid));
      if (!hasAccess && user.role !== 'admin') {
        throw new ForbiddenException('Acesso negado');
      }
    }
    return item;
  }

  private buildListQuery(filters: any, user: User, useFullTextSearch: boolean) {
    let qb = this.itemRepo.createQueryBuilder('item');

    // Visibility: PUBLIC or user's groups
    qb = this.applyVisibility(qb, user);

    if (filters.search) {
      if (useFullTextSearch) {
        qb.andWhere(
          `item."searchVector" @@ plainto_tsquery('english', :search)`,
          { search: filters.search },
        );
        qb.addOrderBy(
          `ts_rank(item."searchVector", plainto_tsquery('english', :search))`,
          'DESC',
        );
      } else {
        qb.andWhere(
          `(
            item.title ILIKE :searchLike
            OR item.summary ILIKE :searchLike
            OR item.url ILIKE :searchLike
            OR item.tags ILIKE :searchLike
            OR item.cves ILIKE :searchLike
          )`,
          { searchLike: `%${filters.search}%` },
        );
      }
    }

    // Category filter
    if (filters.categories.length) {
      qb.andWhere((subQb) => {
        const subQuery = subQb
          .subQuery()
          .select('1')
          .from('item_categories', 'itemCategory')
          .innerJoin('categories', 'filterCategory', 'filterCategory.id = itemCategory."categoriesId"')
          .where('itemCategory."itemsId" = item.id')
          .andWhere('filterCategory.slug IN (:...categories)')
          .getQuery();

        return `EXISTS ${subQuery}`;
      }, { categories: filters.categories });
    }

    // Source filter
    if (filters.sourceIds.length) {
      qb.andWhere('item."sourceId" IN (:...sourceIds)', { sourceIds: filters.sourceIds });
    }

    // Tag filter
    if (filters.tags.length) {
      for (let i = 0; i < filters.tags.length; i++) {
        qb.andWhere(`item.tags ILIKE :tag${i}`, { [`tag${i}`]: `%${filters.tags[i]}%` });
      }
    }

    // CVE filter
    if (filters.cve) {
      qb.andWhere('item.cves ILIKE :cve', { cve: `%${filters.cve}%` });
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

    if (!filters.search || !useFullTextSearch) {
      qb.orderBy('item."collectedAt"', 'DESC');
    }

    return qb;
  }

  private async executePagedQuery(qb: SelectQueryBuilder<Item>, page: number, limit: number) {
    const paginatedIdsQuery = qb.clone()
      .select('item.id', 'id')
      .skip((page - 1) * limit)
      .take(limit);

    const countQuery = qb.clone();

    const [rawIds, total] = await Promise.all([
      paginatedIdsQuery.getRawMany<{ id: string }>(),
      countQuery.getCount(),
    ]);

    const itemIds = rawIds.map((row) => row.id);

    if (itemIds.length === 0) {
      return { data: [], total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    const items = await this.itemRepo.find({
      where: { id: In(itemIds) },
      relations: ['categories', 'source'],
    });

    const order = new Map(itemIds.map((id, index) => [id, index]));
    const data = items.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private normalizeArrayFilter(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map((entry) => String(entry).trim()).filter(Boolean);
    }

    if (typeof value === 'string') {
      return value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
    }

    return [];
  }

  private shouldFallbackSearch(error: unknown) {
    if (!error || typeof error !== 'object') return false;

    const message = 'message' in error ? String(error.message || '') : '';
    return (
      message.includes('searchVector')
      || message.includes('plainto_tsquery')
      || message.includes('tsvector')
      || message.includes('function ts_rank')
    );
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
