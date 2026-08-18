const fs = require('fs');
const path = require('path');
const files = [];
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (f.endsWith('.tsx') && !f.includes('i18n')) files.push(full);
  }
}
walk('src');
const cnRe = /[\u4e00-\u9fff]/;
let found = 0;
files.forEach(file => {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
    if (trimmed.startsWith('import')) return;
    if (!cnRe.test(line)) return;
    const codePart = line.split('//')[0];
    if (cnRe.test(codePart)) {
      const rel = file.replace(/\\/g, '/');
      console.log(rel + ':' + (i + 1) + ': ' + trimmed.slice(0, 120));
      found++;
    }
  });
});
console.log('---', found, 'lines with Chinese in code');
