// Dead code analysis: build import graph and find orphan files
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(process.cwd(), 'src');
const IGNORE = /node_modules/;

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (IGNORE.test(full)) continue;
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

const files = walk(SRC).map(f => path.relative(SRC, f));
const fileSet = new Set(files);

function resolveImport(fromFile, spec) {
  let base;
  if (spec.startsWith('@/')) {
    base = path.join(SRC, spec.slice(2));
  } else if (spec.startsWith('.')) {
    base = path.resolve(path.dirname(path.join(SRC, fromFile)), spec);
  } else {
    return null; // package import
  }
  const candidates = [base, base + '.ts', base + '.tsx', base + '.js', base + '.jsx',
    path.join(base, 'index.ts'), path.join(base, 'index.tsx')];
  for (const c of candidates) {
    const rel = path.relative(SRC, c);
    if (fileSet.has(rel)) return rel;
  }
  return null;
}

// Build reverse dependency map: file -> who imports it
const importedBy = new Map();
files.forEach(f => importedBy.set(f, []));

const importers = new Map(); // file -> list of imports (for type-only detection later)
files.forEach(f => importers.set(f, []));

for (const f of files) {
  const content = fs.readFileSync(path.join(SRC, f), 'utf8');
  // Match static import statements (including type imports and re-exports)
  const re = /import\s+(?:type\s+)?[\s\S]*?from\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|from\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const spec = m[1] || m[2] || m[3];
    const resolved = resolveImport(f, spec);
    if (resolved) {
      importedBy.get(resolved).push(f);
      importers.get(f).push(resolved);
    }
  }
  // Also match side-effect imports: import './x'
  const re2 = /import\s+['"]([^'"]+)['"]/g;
  while ((m = re2.exec(content)) !== null) {
    const resolved = resolveImport(f, m[1]);
    if (resolved) {
      importedBy.get(resolved).push(f);
      importers.get(f).push(resolved);
    }
  }
}

const ENTRY = ['main.tsx'];

// Find files with no importers (orphans) - excluding entry
const orphans = files.filter(f => !ENTRY.includes(f) && importedBy.get(f).length === 0);

console.log('=== ORPHAN FILES (never imported by anyone) ===');
orphans.sort().forEach(f => console.log(f));
console.log(`\nTotal orphans: ${orphans.length} / ${files.length} files`);

// Files only imported by dev/ directory or dev pages
const devOnly = files.filter(f => {
  const imp = importedBy.get(f);
  return imp.length > 0 && imp.every(i => i.startsWith('dev/') || i.includes('TestPage') || i.includes('Tester'));
});
console.log('\n=== FILES ONLY USED BY DEV/TEST CODE ===');
devOnly.sort().forEach(f => console.log(f));
console.log(`\nTotal dev-only: ${devOnly.length}`);

// Write full graph to file for reference
const out = {};
files.forEach(f => { out[f] = importedBy.get(f); });
fs.writeFileSync(path.join(__dirname, '..', '.deadcode-analysis.json'), JSON.stringify(out, null, 2));
console.log('\nFull graph written to .deadcode-analysis.json');
