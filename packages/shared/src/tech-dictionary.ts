export interface TechEntry {
  key: string;
  label: string;
  aliases: string[];
  category: 'language' | 'framework' | 'runtime' | 'tool' | 'package_manager' | 'platform';
}

export const TECH_DICTIONARY: TechEntry[] = [
  { key: 'java', label: 'Java', aliases: ['java', 'jdk', 'jre', 'openjdk'], category: 'language' },
  { key: 'spring', label: 'Spring', aliases: ['spring', 'spring framework', 'springframework'], category: 'framework' },
  { key: 'spring_boot', label: 'Spring Boot', aliases: ['spring boot', 'spring-boot', 'springboot'], category: 'framework' },
  { key: 'node_js', label: 'Node.js', aliases: ['node.js', 'nodejs', 'node js'], category: 'runtime' },
  { key: 'npm', label: 'npm', aliases: ['npm', 'npmjs', 'npm registry'], category: 'package_manager' },
  { key: 'react', label: 'React', aliases: ['react', 'reactjs', 'react.js'], category: 'framework' },
  { key: 'react_native', label: 'React Native', aliases: ['react native', 'react-native', 'reactnative'], category: 'framework' },
  { key: 'typescript', label: 'TypeScript', aliases: ['typescript'], category: 'language' },
  { key: 'javascript', label: 'JavaScript', aliases: ['javascript', 'ecmascript'], category: 'language' },
  { key: 'postgresql', label: 'PostgreSQL', aliases: ['postgresql', 'postgres', 'psql'], category: 'tool' },
  { key: 'redis', label: 'Redis', aliases: ['redis'], category: 'tool' },
  { key: 'docker', label: 'Docker', aliases: ['docker', 'dockerfile', 'docker-compose'], category: 'tool' },
  { key: 'kubernetes', label: 'Kubernetes', aliases: ['kubernetes', 'k8s', 'kubectl'], category: 'platform' },
  { key: 'nginx', label: 'Nginx', aliases: ['nginx'], category: 'tool' },
  { key: 'apache', label: 'Apache', aliases: ['apache', 'httpd', 'apache2'], category: 'tool' },
  { key: 'maven', label: 'Maven', aliases: ['maven', 'mvn', 'pom.xml'], category: 'tool' },
  { key: 'gradle', label: 'Gradle', aliases: ['gradle', 'build.gradle'], category: 'tool' },
  { key: 'webpack', label: 'Webpack', aliases: ['webpack'], category: 'tool' },
  { key: 'next_js', label: 'Next.js', aliases: ['next.js', 'nextjs', 'next js'], category: 'framework' },
  { key: 'express', label: 'Express', aliases: ['express', 'expressjs', 'express.js'], category: 'framework' },
  { key: 'nestjs', label: 'NestJS', aliases: ['nestjs', 'nest.js', 'nest'], category: 'framework' },
  { key: 'android', label: 'Android', aliases: ['android'], category: 'platform' },
  { key: 'ios', label: 'iOS', aliases: ['ios', 'iphone', 'ipad'], category: 'platform' },
  { key: 'log4j', label: 'Log4j', aliases: ['log4j', 'log4j2', 'log4shell'], category: 'tool' },
  { key: 'jackson', label: 'Jackson', aliases: ['jackson', 'jackson-databind'], category: 'tool' },
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function aliasMatches(text: string, alias: string): boolean {
  const normalizedAlias = alias.toLowerCase().trim();
  if (!normalizedAlias) return false;

  // Require token boundaries to avoid false positives like matching `ts` inside random words.
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegex(normalizedAlias)}([^a-z0-9]|$)`, 'i');
  return pattern.test(text);
}

export function detectTechnologies(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();

  for (const tech of TECH_DICTIONARY) {
    for (const alias of tech.aliases) {
      if (aliasMatches(lower, alias)) {
        found.add(tech.key);
        break;
      }
    }
  }

  return Array.from(found);
}
