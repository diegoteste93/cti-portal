import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { Group } from './entities/group.entity';
import { GroupPolicy } from './entities/group-policy.entity';
import { Category } from './entities/category.entity';
import { Source } from './entities/source.entity';
import { SourceType, VisibilityScope } from '@cti/shared';

async function seed() {
  const ds = await AppDataSource.initialize();
  console.log('Connected to database.');

  const categoryRepo = ds.getRepository(Category);
  const groupRepo = ds.getRepository(Group);
  const policyRepo = ds.getRepository(GroupPolicy);
  const sourceRepo = ds.getRepository(Source);

  // ---- Categories ----
  const categorySeedData = [
    { name: 'Vulnerabilities', slug: 'vulnerability', description: 'CVEs, security advisories, and vulnerability disclosures' },
    { name: 'Exploits & Attacks', slug: 'exploit', description: 'Active exploits, attack techniques and PoCs' },
    { name: 'Ransomware', slug: 'ransomware', description: 'Ransomware campaigns, groups, and incidents' },
    { name: 'Fraud', slug: 'fraud', description: 'Fraud schemes, scams, and social engineering' },
    { name: 'Data Leaks', slug: 'data_leak', description: 'Data breaches and leaked information' },
    { name: 'Malware', slug: 'malware', description: 'Malware analysis and campaigns' },
    { name: 'Phishing', slug: 'phishing', description: 'Phishing campaigns and techniques' },
    { name: 'Supply Chain', slug: 'supply_chain', description: 'Supply chain attacks and compromises' },
    { name: 'General', slug: 'general', description: 'General threat intelligence and news' },
  ];

  const categories: Record<string, Category> = {};
  for (const cat of categorySeedData) {
    let existing = await categoryRepo.findOneBy({ slug: cat.slug });
    if (!existing) {
      existing = await categoryRepo.save(categoryRepo.create(cat));
      console.log(`  Created category: ${cat.name}`);
    }
    categories[cat.slug] = existing;
  }

  // ---- Groups ----
  const groupSeedData = [
    {
      name: 'Arquitetura',
      description: 'Architecture team',
      policy: {
        followedTags: ['java', 'spring', 'spring_boot', 'node_js', 'react', 'react_native', 'docker', 'kubernetes'],
        followedCategories: ['vulnerability', 'exploit', 'supply_chain'],
        keywordsInclude: [],
        keywordsExclude: [],
      },
    },
    {
      name: 'Dev React (Web)',
      description: 'React Web developers',
      policy: {
        followedTags: ['react', 'javascript', 'typescript', 'npm', 'next_js', 'webpack'],
        followedCategories: ['vulnerability', 'exploit', 'supply_chain'],
        keywordsInclude: ['react', 'npm', 'javascript'],
        keywordsExclude: [],
      },
    },
    {
      name: 'Dev React Native (Mobile)',
      description: 'React Native mobile developers',
      policy: {
        followedTags: ['react_native', 'react', 'javascript', 'typescript', 'npm', 'android', 'ios'],
        followedCategories: ['vulnerability', 'exploit', 'supply_chain', 'malware'],
        keywordsInclude: ['react native', 'mobile', 'android', 'ios'],
        keywordsExclude: [],
      },
    },
    {
      name: 'Dev Node.js (Backend)',
      description: 'Node.js backend developers',
      policy: {
        followedTags: ['node_js', 'npm', 'express', 'nestjs', 'javascript', 'typescript'],
        followedCategories: ['vulnerability', 'exploit', 'supply_chain'],
        keywordsInclude: ['node', 'npm', 'express'],
        keywordsExclude: [],
      },
    },
    {
      name: 'Dev Java (Backend)',
      description: 'Java backend developers',
      policy: {
        followedTags: ['java', 'spring', 'spring_boot', 'maven', 'gradle', 'log4j', 'jackson'],
        followedCategories: ['vulnerability', 'exploit', 'supply_chain'],
        keywordsInclude: ['java', 'spring', 'maven'],
        keywordsExclude: [],
      },
    },
    {
      name: 'Gerente de Projeto (PM)',
      description: 'Project managers',
      policy: {
        followedTags: [],
        followedCategories: ['ransomware', 'data_leak', 'fraud', 'general'],
        keywordsInclude: [],
        keywordsExclude: [],
      },
    },
    {
      name: 'Segurança (SecOps/AppSec)',
      description: 'Security operations and AppSec',
      policy: {
        followedTags: ['java', 'spring', 'spring_boot', 'node_js', 'npm', 'react', 'react_native'],
        followedCategories: ['vulnerability', 'exploit', 'ransomware', 'data_leak', 'fraud', 'malware', 'phishing', 'supply_chain'],
        keywordsInclude: [],
        keywordsExclude: [],
      },
    },
  ];

  for (const g of groupSeedData) {
    let existing = await groupRepo.findOneBy({ name: g.name });
    if (!existing) {
      existing = await groupRepo.save(groupRepo.create({ name: g.name, description: g.description }));
      console.log(`  Created group: ${g.name}`);
    }
    let policy = await policyRepo.findOneBy({ groupId: existing.id });
    if (!policy) {
      policy = policyRepo.create({
        groupId: existing.id,
        followedTags: g.policy.followedTags,
        followedCategories: g.policy.followedCategories,
        keywordsInclude: g.policy.keywordsInclude,
        keywordsExclude: g.policy.keywordsExclude,
      });
      await policyRepo.save(policy);
      console.log(`  Created policy for group: ${g.name}`);
    }
  }

  // ---- Default OSINT Sources ----
  const sourceSeedData = [
    {
      name: 'NVD - National Vulnerability Database',
      type: SourceType.GENERIC_API,
      url: 'https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=50',
      scheduleCron: '0 */4 * * *',
      categorySlug: 'vulnerability',
    },
    {
      name: 'CISA Known Exploited Vulnerabilities',
      type: SourceType.GENERIC_API,
      url: 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
      scheduleCron: '0 */6 * * *',
      categorySlug: 'exploit',
    },
    {
      name: 'GitHub Advisory Database',
      type: SourceType.GENERIC_API,
      url: 'https://api.github.com/advisories?per_page=50',
      scheduleCron: '0 */4 * * *',
      categorySlug: 'vulnerability',
    },
    {
      name: 'The Hacker News',
      type: SourceType.RSS,
      url: 'https://feeds.feedburner.com/TheHackersNews',
      scheduleCron: '0 */2 * * *',
      categorySlug: 'general',
    },
    {
      name: 'BleepingComputer',
      type: SourceType.RSS,
      url: 'https://www.bleepingcomputer.com/feed/',
      scheduleCron: '0 */2 * * *',
      categorySlug: 'general',
    },
    {
      name: 'Krebs on Security',
      type: SourceType.RSS,
      url: 'https://krebsonsecurity.com/feed/',
      scheduleCron: '0 */3 * * *',
      categorySlug: 'general',
    },
    {
      name: 'NIST NVD RSS',
      type: SourceType.RSS,
      url: 'https://nvd.nist.gov/feeds/xml/cve/misc/nvd-rss-analyzed.xml',
      scheduleCron: '0 */4 * * *',
      categorySlug: 'vulnerability',
    },
    {
      name: 'npm Security Advisories (GitHub)',
      type: SourceType.GENERIC_API,
      url: 'https://api.github.com/advisories?ecosystem=npm&per_page=50',
      scheduleCron: '0 */4 * * *',
      categorySlug: 'supply_chain',
    },
    {
      name: 'Maven Security Advisories (GitHub)',
      type: SourceType.GENERIC_API,
      url: 'https://api.github.com/advisories?ecosystem=maven&per_page=50',
      scheduleCron: '0 */4 * * *',
      categorySlug: 'supply_chain',
    },
  ];

  for (const s of sourceSeedData) {
    const existing = await sourceRepo.findOneBy({ name: s.name });
    if (!existing) {
      const category = categories[s.categorySlug];
      const source = sourceRepo.create({
        name: s.name,
        type: s.type,
        url: s.url,
        scheduleCron: s.scheduleCron,
        visibilityScope: VisibilityScope.PUBLIC,
      });
      const saved = await sourceRepo.save(source);
      // Link category via query since ManyToMany
      if (category) {
        await ds.query(
          `INSERT INTO "source_categories" ("sourcesId", "categoriesId") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [saved.id, category.id]
        );
      }
      console.log(`  Created source: ${s.name}`);
    }
  }

  console.log('Seed completed successfully!');
  await ds.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
