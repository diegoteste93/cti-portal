import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { Item, UserPreference, GroupPolicy } from '../database/entities';
import { User } from '../database/entities';

type DashboardRange = '1h' | '24h' | '7d' | '30d' | 'custom';

interface DashboardPeriod {
  startDate: Date;
  endDate: Date;
  label: string;
}

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Item) private itemRepo: Repository<Item>,
    @InjectRepository(UserPreference) private prefRepo: Repository<UserPreference>,
    @InjectRepository(GroupPolicy) private policyRepo: Repository<GroupPolicy>,
  ) {}

  async getPersonalizedFeed(user: User, page = 1, limit = 20) {
    // Get user preferences
    const userPref = await this.prefRepo.findOneBy({ userId: user.id });

    // Get group policies
    const groupIds = (user.groups || []).map((g) => g.id);
    const groupPolicies = groupIds.length > 0
      ? await this.policyRepo.find({ where: groupIds.map((id) => ({ groupId: id })) })
      : [];

    // Merge tags and categories
    const allTags = new Set<string>();
    const allCategories = new Set<string>();
    const allKeywordsInclude = new Set<string>();
    const allKeywordsExclude = new Set<string>();

    if (userPref) {
      (userPref.followedTags || []).forEach((t) => allTags.add(t));
      (userPref.followedCategories || []).forEach((c) => allCategories.add(c));
      (userPref.keywordsInclude || []).forEach((k) => allKeywordsInclude.add(k));
      (userPref.keywordsExclude || []).forEach((k) => allKeywordsExclude.add(k));
    }

    for (const policy of groupPolicies) {
      (policy.followedTags || []).forEach((t) => allTags.add(t));
      (policy.followedCategories || []).forEach((c) => allCategories.add(c));
      (policy.keywordsInclude || []).forEach((k) => allKeywordsInclude.add(k));
      (policy.keywordsExclude || []).forEach((k) => allKeywordsExclude.add(k));
    }

    let qb = this.itemRepo.createQueryBuilder('item');

    // Visibility
    if (user.role !== 'admin') {
      if (groupIds.length > 0) {
        qb.andWhere(
          `(item."visibilityScope" = 'public' OR (item."visibilityScope" = 'groups' AND (${groupIds.map((_, i) => `item."visibilityGroupIds" LIKE :gid${i}`).join(' OR ')})))`,
          groupIds.reduce((acc, gid, i) => ({ ...acc, [`gid${i}`]: `%${gid}%` }), {}),
        );
      } else {
        qb.andWhere(`item."visibilityScope" = 'public'`);
      }
    }

    // Apply relevance filtering (tags OR categories)
    const conditions: string[] = [];
    const params: Record<string, any> = {};

    if (allTags.size > 0) {
      const tags = Array.from(allTags);
      tags.forEach((tag, i) => {
        conditions.push(`item.tags LIKE :ftag${i}`);
        params[`ftag${i}`] = `%${tag}%`;
      });
    }

    if (allCategories.size > 0) {
      const cats = Array.from(allCategories);
      conditions.push(`EXISTS (
        SELECT 1
        FROM item_categories "itemCategory"
        INNER JOIN categories "feedCategory" ON "feedCategory".id = "itemCategory"."categoriesId"
        WHERE "itemCategory"."itemsId" = item.id
          AND "feedCategory".slug IN (:...feedCats)
      )`);
      params.feedCats = cats;
    }

    if (conditions.length > 0) {
      qb.andWhere(`(${conditions.join(' OR ')})`, params);
    }

    // Exclude keywords
    let excludeKeywordIndex = 0;
    for (const kw of allKeywordsExclude) {
      const normalizedKeyword = kw.trim();
      if (!normalizedKeyword) continue;

      const paramKey = `excludeKeyword${excludeKeywordIndex++}`;
      qb.andWhere(`item.title NOT ILIKE :${paramKey}`, {
        [paramKey]: `%${normalizedKeyword}%`,
      });
    }

    const paginatedIdsQuery = qb.clone()
      .select('item.id', 'id')
      .orderBy('item."collectedAt"', 'DESC')
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

  private resolveDashboardPeriod(range?: DashboardRange, from?: string, to?: string): DashboardPeriod {
    const now = new Date();

    if (range === 'custom' && from && to) {
      const startDate = new Date(from);
      const endDate = new Date(to);

      if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && startDate <= endDate) {
        return {
          startDate,
          endDate,
          label: `Personalizado (${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')})`,
        };
      }
    }

    if (range === '1h') {
      return {
        startDate: new Date(now.getTime() - 60 * 60 * 1000),
        endDate: now,
        label: 'Última hora',
      };
    }

    if (range === '24h') {
      return {
        startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        endDate: now,
        label: 'Últimas 24 horas',
      };
    }

    if (range === '30d') {
      return {
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: now,
        label: 'Últimos 30 dias',
      };
    }

    return {
      startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      endDate: now,
      label: 'Últimos 7 dias',
    };
  }

  private applyPeriodFilter(queryBuilder: SelectQueryBuilder<Item>, period: DashboardPeriod) {
    return queryBuilder
      .andWhere('item."collectedAt" >= :startDate', { startDate: period.startDate })
      .andWhere('item."collectedAt" <= :endDate', { endDate: period.endDate });
  }

  async getDashboardStats(user: User, range?: DashboardRange, from?: string, to?: string) {
    const period = this.resolveDashboardPeriod(range, from, to);

    const totalItems = await this.applyPeriodFilter(
      this.itemRepo.createQueryBuilder('item'),
      period,
    ).getCount();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const itemsTodayCount = await this.applyPeriodFilter(
      this.itemRepo.createQueryBuilder('item').where('item."collectedAt" >= :todayStart', { todayStart }),
      period,
    ).getCount();

    const itemsPeriodCount = totalItems;

    const catCounts = await this.applyPeriodFilter(
      this.itemRepo
        .createQueryBuilder('item')
        .leftJoin('item.categories', 'cat')
        .select('cat.slug', 'slug')
        .addSelect('COUNT(item.id)', 'count')
        .groupBy('cat.slug'),
      period,
    ).getRawMany();

    const byCategoryCount: Record<string, number> = {};
    for (const row of catCounts) {
      if (row.slug) byCategoryCount[row.slug] = parseInt(row.count, 10);
    }

    const recentWithCves = await this.applyPeriodFilter(
      this.itemRepo
        .createQueryBuilder('item')
        .where("item.cves != ''")
        .orderBy('item."collectedAt"', 'DESC')
        .take(50),
      period,
    ).getMany();

    const cveCount: Record<string, number> = {};
    for (const item of recentWithCves) {
      for (const cve of (item.cves || [])) {
        cveCount[cve] = (cveCount[cve] || 0) + 1;
      }
    }
    const topCves = Object.entries(cveCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([cve]) => cve);

    const recentWithTags = await this.applyPeriodFilter(
      this.itemRepo
        .createQueryBuilder('item')
        .where("item.tags != ''")
        .orderBy('item."collectedAt"', 'DESC')
        .take(100),
      period,
    ).getMany();

    const tagCount: Record<string, number> = {};
    for (const item of recentWithTags) {
      for (const tag of (item.tags || [])) {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      }
    }
    const topTagsEntries = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const topTags = topTagsEntries.map(([tag]) => tag);
    const topTagsCount = Object.fromEntries(topTagsEntries);

    const recentItems = await this.applyPeriodFilter(
      this.itemRepo
        .createQueryBuilder('item')
        .leftJoinAndSelect('item.categories', 'categories')
        .leftJoinAndSelect('item.source', 'source')
        .orderBy('item."collectedAt"', 'DESC')
        .take(30),
      period,
    ).getMany();

    const brazilKeywords = ['brasil', 'brazil', 'brazilian', 'brasileiro', 'brasileira', 'br'];
    const regionKeywords: Record<string, string[]> = {
      Norte: ['acre', 'amapá', 'amazonas', 'pará', 'rondônia', 'roraima', 'tocantins', 'norte'],
      Nordeste: ['bahia', 'ceará', 'maranhão', 'paraíba', 'pernambuco', 'piauí', 'sergipe', 'alagoas', 'rio grande do norte', 'nordeste'],
      'Centro-Oeste': ['goiás', 'goias', 'mato grosso', 'mato grosso do sul', 'distrito federal', 'brasília', 'centro-oeste'],
      Sudeste: ['são paulo', 'sao paulo', 'rio de janeiro', 'espírito santo', 'espirito santo', 'minas gerais', 'sudeste'],
      Sul: ['paraná', 'parana', 'rio grande do sul', 'santa catarina', 'sul'],
    };

    const brazilItems = recentItems.filter((item) => {
      const text = `${item.title || ''} ${item.summary || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
      return brazilKeywords.some((keyword) => text.includes(keyword));
    });

    const regions = Object.entries(regionKeywords).map(([label, keywords]) => {
      const matchedItems = brazilItems.filter((item) => {
        const text = `${item.title || ''} ${item.summary || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
        return keywords.some((keyword) => text.includes(keyword));
      });

      return {
        label,
        value: matchedItems.length,
        itemIds: matchedItems.slice(0, 8).map((item) => item.id),
      };
    });

    return {
      totalItems,
      itemsToday: itemsTodayCount,
      itemsThisWeek: itemsPeriodCount,
      byCategoryCount,
      topCves,
      topTags,
      topTagsCount,
      recentItems,
      rangeLabel: period.label,
      brazilEvents: {
        total: brazilItems.length,
        regions,
      },
    };
  }
}
