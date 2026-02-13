import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item, UserPreference, GroupPolicy, Category } from '../database/entities';
import { User } from '../database/entities';
import { VisibilityScope } from '@cti/shared';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Item) private itemRepo: Repository<Item>,
    @InjectRepository(UserPreference) private prefRepo: Repository<UserPreference>,
    @InjectRepository(GroupPolicy) private policyRepo: Repository<GroupPolicy>,
    @InjectRepository(Category) private catRepo: Repository<Category>,
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

    let qb = this.itemRepo.createQueryBuilder('item')
      .leftJoinAndSelect('item.categories', 'category')
      .leftJoinAndSelect('item.source', 'source');

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
      conditions.push(`category.slug IN (:...feedCats)`);
      params.feedCats = cats;
    }

    if (conditions.length > 0) {
      qb.andWhere(`(${conditions.join(' OR ')})`, params);
    }

    // Exclude keywords
    for (const kw of allKeywordsExclude) {
      qb.andWhere(`item.title NOT ILIKE :excl_${kw.replace(/\s/g, '_')}`, {
        [`excl_${kw.replace(/\s/g, '_')}`]: `%${kw}%`,
      });
    }

    qb.orderBy('item."collectedAt"', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getDashboardStats(user: User) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    const totalItems = await this.itemRepo.count();
    const itemsToday = await this.itemRepo.count({
      where: { collectedAt: new Date(todayStart.toISOString()) as any },
    });

    // Simpler approach: use query builder for date comparisons
    const itemsTodayCount = await this.itemRepo.createQueryBuilder('item')
      .where('item."collectedAt" >= :todayStart', { todayStart })
      .getCount();

    const itemsWeekCount = await this.itemRepo.createQueryBuilder('item')
      .where('item."collectedAt" >= :weekStart', { weekStart })
      .getCount();

    // Category counts
    const catCounts = await this.itemRepo
      .createQueryBuilder('item')
      .leftJoin('item.categories', 'cat')
      .select('cat.slug', 'slug')
      .addSelect('COUNT(item.id)', 'count')
      .groupBy('cat.slug')
      .getRawMany();

    const byCategoryCount: Record<string, number> = {};
    for (const row of catCounts) {
      if (row.slug) byCategoryCount[row.slug] = parseInt(row.count, 10);
    }

    // Top CVEs
    const recentWithCves = await this.itemRepo
      .createQueryBuilder('item')
      .where("item.cves != ''")
      .orderBy('item."collectedAt"', 'DESC')
      .take(50)
      .getMany();

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

    // Top tags
    const recentWithTags = await this.itemRepo
      .createQueryBuilder('item')
      .where("item.tags != ''")
      .orderBy('item."collectedAt"', 'DESC')
      .take(100)
      .getMany();

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

    // Recent items
    const recentItems = await this.itemRepo.find({
      relations: ['categories', 'source'],
      order: { collectedAt: 'DESC' },
      take: 10,
    });

    return {
      totalItems,
      itemsToday: itemsTodayCount,
      itemsThisWeek: itemsWeekCount,
      byCategoryCount,
      topCves,
      topTags,
      topTagsCount,
      recentItems,
    };
  }
}
