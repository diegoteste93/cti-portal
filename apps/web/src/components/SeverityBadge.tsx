export default function SeverityBadge({ severity }: { severity?: string }) {
  if (!severity) return null;
  const classes: Record<string, string> = {
    CRITICAL: 'badge badge-critical',
    HIGH: 'badge badge-high',
    MEDIUM: 'badge badge-medium',
    LOW: 'badge badge-low',
  };
  return <span className={classes[severity] || 'badge bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}>{severity}</span>;
}
