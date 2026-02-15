const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', 'src');
const conflictRegex = /^(<<<<<<<|=======|>>>>>>>)/m;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (/\.(ts|tsx|js|jsx|css|md)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

const offenders = walk(rootDir).filter((filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  return conflictRegex.test(content);
});

if (offenders.length > 0) {
  console.error('Merge conflict markers found in web source files:');
  for (const filePath of offenders) {
    console.error(`- ${path.relative(path.resolve(__dirname, '..'), filePath)}`);
  }
  process.exit(1);
}

console.log('No merge conflict markers found in apps/web/src.');
