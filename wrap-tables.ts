import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find "<div ... overflow-hidden...><table" structure is hard with Regex.
  // Replacing `overflow-hidden` with `overflow-x-auto` everywhere in table cards.
  // Actually, let's just do a string replacement for the specific table wrappers:
  
  content = content.replace(/className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"/g, 
                            'className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto"');
                            
  fs.writeFileSync(filePath, content);
}
console.log("Done modifying table wrappers");
