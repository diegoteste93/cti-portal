import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { User } from './entities/user.entity';
import { Group } from './entities/group.entity';
import { GroupPolicy } from './entities/group-policy.entity';
import { Category } from './entities/category.entity';
import { Source } from './entities/source.entity';
import { SourceType, VisibilityScope, Role, UserStatus } from '@cti/shared';

async function seed() {
  const ds = await AppDataSource.initialize();
  console.log('Conectado ao banco de dados.');

  const userRepo = ds.getRepository(User);
  const categoryRepo = ds.getRepository(Category);
  const groupRepo = ds.getRepository(Group);
  const policyRepo = ds.getRepository(GroupPolicy);
  const sourceRepo = ds.getRepository(Source);

  // ---- Usuário administrador principal ----
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@ctiportal.local';
  const adminName = process.env.ADMIN_NAME || 'Administrador CTI';
  let adminUser = await userRepo.findOneBy({ email: adminEmail });
  if (!adminUser) {
    adminUser = userRepo.create({
      email: adminEmail,
      name: adminName,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    });
    adminUser = await userRepo.save(adminUser);
    console.log(`  Usuário administrador criado: ${adminEmail}`);
  } else {
    console.log(`  Usuário administrador já existe: ${adminEmail}`);
  }

  // Atribui administrador ao grupo Segurança (após criação dos grupos)
  const assignAdminToSecGroup = async () => {
    const secGroup = await groupRepo.findOneBy({ name: 'Segurança (SecOps/AppSec)' });
    if (secGroup && adminUser) {
      const freshAdmin = await userRepo.findOne({ where: { id: adminUser.id }, relations: ['groups'] });
      if (freshAdmin && !freshAdmin.groups.some((g) => g.id === secGroup.id)) {
        freshAdmin.groups = [...freshAdmin.groups, secGroup];
        await userRepo.save(freshAdmin);
        console.log(`  Administrador atribuído ao grupo: ${secGroup.name}`);
      }
    }
  };

  // ---- Categorias ----
  const categorySeedData = [
    { name: 'Vulnerabilidades', slug: 'vulnerability', description: 'CVEs, boletins de segurança e divulgações de vulnerabilidades' },
    { name: 'Exploits e Ataques', slug: 'exploit', description: 'Exploits ativos, técnicas de ataque e PoCs' },
    { name: 'Ransomware', slug: 'ransomware', description: 'Campanhas, grupos e incidentes de ransomware' },
    { name: 'Fraude', slug: 'fraud', description: 'Esquemas de fraude, golpes e engenharia social' },
    { name: 'Vazamentos de Dados', slug: 'data_leak', description: 'Violações de dados e informações vazadas' },
    { name: 'Malware', slug: 'malware', description: 'Análises e campanhas de malware' },
    { name: 'Phishing', slug: 'phishing', description: 'Campanhas e técnicas de phishing' },
    { name: 'Cadeia de Suprimentos', slug: 'supply_chain', description: 'Ataques e comprometimentos na cadeia de suprimentos' },
    { name: 'Geral', slug: 'general', description: 'Inteligência de ameaças e notícias gerais' },
  ];

  const categories: Record<string, Category> = {};
  for (const cat of categorySeedData) {
    let existing = await categoryRepo.findOneBy({ slug: cat.slug });
    if (!existing) {
      existing = await categoryRepo.save(categoryRepo.create(cat));
      console.log(`  Categoria criada: ${cat.name}`);
    }
    categories[cat.slug] = existing;
  }

  // ---- Grupos ----
  const groupSeedData = [
    {
      name: 'Arquitetura',
      description: 'Time de arquitetura',
      policy: {
        followedTags: ['java', 'spring', 'spring_boot', 'node_js', 'react', 'react_native', 'docker', 'kubernetes'],
        followedCategories: ['vulnerability', 'exploit', 'supply_chain'],
        keywordsInclude: [],
        keywordsExclude: [],
      },
    },
    {
      name: 'Dev React (Web)',
      description: 'Desenvolvedores React Web',
      policy: {
        followedTags: ['react', 'javascript', 'typescript', 'npm', 'next_js', 'webpack'],
        followedCategories: ['vulnerability', 'exploit', 'supply_chain'],
        keywordsInclude: ['react', 'npm', 'javascript'],
        keywordsExclude: [],
      },
    },
    {
      name: 'Dev React Native (Mobile)',
      description: 'Desenvolvedores mobile React Native',
      policy: {
        followedTags: ['react_native', 'react', 'javascript', 'typescript', 'npm', 'android', 'ios'],
        followedCategories: ['vulnerability', 'exploit', 'supply_chain', 'malware'],
        keywordsInclude: ['react native', 'mobile', 'android', 'ios'],
        keywordsExclude: [],
      },
    },
    {
      name: 'Dev Node.js (Backend)',
      description: 'Desenvolvedores backend Node.js',
      policy: {
        followedTags: ['node_js', 'npm', 'express', 'nestjs', 'javascript', 'typescript'],
        followedCategories: ['vulnerability', 'exploit', 'supply_chain'],
        keywordsInclude: ['node', 'npm', 'express'],
        keywordsExclude: [],
      },
    },
    {
      name: 'Dev Java (Backend)',
      description: 'Desenvolvedores backend Java',
      policy: {
        followedTags: ['java', 'spring', 'spring_boot', 'maven', 'gradle', 'log4j', 'jackson'],
        followedCategories: ['vulnerability', 'exploit', 'supply_chain'],
        keywordsInclude: ['java', 'spring', 'maven'],
        keywordsExclude: [],
      },
    },
    {
      name: 'Gerente de Projeto (PM)',
      description: 'Gerentes de projeto',
      policy: {
        followedTags: [],
        followedCategories: ['ransomware', 'data_leak', 'fraud', 'general'],
        keywordsInclude: [],
        keywordsExclude: [],
      },
    },
    {
      name: 'Segurança (SecOps/AppSec)',
      description: 'Operações de segurança e AppSec',
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
      console.log(`  Grupo criado: ${g.name}`);
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
      console.log(`  Política criada para o grupo: ${g.name}`);
    }
  }

  // ---- Fontes OSINT padrão ----
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
      console.log(`  Fonte criada: ${s.name}`);
    }
  }

  // Atribui o usuário administrador ao grupo Segurança
  await assignAdminToSecGroup();

  console.log('Seed concluído com sucesso!');
  console.log(`\n  >>> Login do administrador: ${adminEmail}`);
  console.log(`  >>> Use POST /api/auth/dev-login { "email": "${adminEmail}" } para obter um token JWT\n`);
  await ds.destroy();
}

seed().catch((err) => {
  console.error('Falha no seed:', err);
  process.exit(1);
});
