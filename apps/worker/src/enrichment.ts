import { CVE_REGEX, CWE_REGEX, detectTechnologies } from '@cti/shared';

export interface EnrichmentResult {
  cves: string[];
  cwes: string[];
  tags: string[];
  vendors: string[];
  products: string[];
  severity?: string;
}

export function enrichItem(title: string, summary: string, content: string): EnrichmentResult {
  const fullText = `${title} ${summary} ${content}`;

  // Extract CVEs
  const cveMatches = fullText.match(CVE_REGEX) || [];
  const cves = [...new Set(cveMatches.map((c) => c.toUpperCase()))];

  // Extract CWEs
  const cweMatches = fullText.match(CWE_REGEX) || [];
  const cwes = [...new Set(cweMatches.map((c) => c.toUpperCase()))];

  // Detect technologies
  const tags = detectTechnologies(fullText);

  // Basic vendor/product extraction (heuristic)
  const vendors: string[] = [];
  const products: string[] = [];

  const knownVendors: Record<string, string[]> = {
    'Microsoft': ['windows', 'azure', 'office', 'exchange', 'teams'],
    'Google': ['chrome', 'android', 'gmail', 'gcp'],
    'Apple': ['macos', 'ios', 'safari', 'iphone', 'xcode'],
    'Apache': ['log4j', 'struts', 'tomcat', 'httpd', 'kafka'],
    'Oracle': ['java', 'mysql', 'weblogic', 'virtualbox'],
    'VMware': ['vsphere', 'esxi', 'vcenter'],
    'Cisco': ['ios-xe', 'asa', 'firepower'],
    'Fortinet': ['fortigate', 'fortios', 'fortimanager'],
    'Palo Alto': ['pan-os', 'cortex', 'prisma'],
  };

  const lowerText = fullText.toLowerCase();
  for (const [vendor, prods] of Object.entries(knownVendors)) {
    if (lowerText.includes(vendor.toLowerCase())) {
      vendors.push(vendor);
    }
    for (const prod of prods) {
      if (lowerText.includes(prod.toLowerCase())) {
        if (!vendors.includes(vendor)) vendors.push(vendor);
        products.push(prod);
      }
    }
  }

  // Basic severity heuristic
  let severity: string | undefined;
  if (/critical|cvss\s*(9|10)/i.test(fullText)) severity = 'CRITICAL';
  else if (/\bhigh\b|cvss\s*(7|8)/i.test(fullText)) severity = 'HIGH';
  else if (/\bmedium\b|cvss\s*(4|5|6)/i.test(fullText)) severity = 'MEDIUM';
  else if (/\blow\b|cvss\s*(1|2|3)/i.test(fullText)) severity = 'LOW';

  return { cves, cwes, tags, vendors: [...new Set(vendors)], products: [...new Set(products)], severity };
}
