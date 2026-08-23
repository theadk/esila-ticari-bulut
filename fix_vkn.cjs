const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// The error showed many places where `vkn` is used but not defined.
// We can use a regex to inject `const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";`
// right after `app.(get|post|put|delete)("...", async (req, res) => {`
// but only if it's not already there.

code = code.replace(/app\.(get|post|put|delete)\("([^"]+)",\s*async\s*\((req,\s*res|req,\s*res,\s*next)\)\s*=>\s*\{/g, (match) => {
  return match + '\n    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";';
});

// Since some already have it, let's remove duplicates.
code = code.replace(/const vkn = \(req\.headers\["x-tenant-id"\] as string\) \|\| "1111111111";\s*const vkn = /g, 'const vkn = ');

fs.writeFileSync('server.ts', code);
console.log('Fixed');
