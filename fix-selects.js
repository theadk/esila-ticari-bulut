import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Regex to match value={...} inside <select tags or just value={...} generally where it might be null
  // Actually, we can just replace value={x} with value={x || ""} for all selects.
  // To avoid breaking things, we'll parse line by line. Let's just find value={x} where x doesn't contain || or " "
  
  // A safer regex: value={([^}"'|]+)}
  // but let's only do it for things that are variables/object paths like value={formData.type}
  
  content = content.replace(/value=\{([a-zA-Z0-9_?.]+)\}/g, (match, p1) => {
    // skip if it's just a number or boolean
    if (/^(true|false|[0-9]+)$/.test(p1)) return match;
    // skip if it's already got ||
    if (match.includes("||")) return match;
    changed = true;
    return `value={${p1} || ""}`;
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
