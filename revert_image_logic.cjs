const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Remove the processAndSaveImage calls from app.post and app.put
const imageProcessingSnippet = `
        for (const key of Object.keys(req.body)) {
          if (typeof req.body[key] === 'string' && req.body[key].startsWith('data:image/')) {
            req.body[key] = processAndSaveImage(req.body[key], vkn);
          }
        }
`;

code = code.replace(imageProcessingSnippet, '');
code = code.replace(imageProcessingSnippet, '');

// Also remove from products specific routes
code = code.replace(
  '    if (req.body.image) {\n       req.body.image = processAndSaveImage(req.body.image, vkn);\n    }',
  ''
);
code = code.replace(
  '    if (req.body.image) {\n       req.body.image = processAndSaveImage(req.body.image, vkn);\n    }',
  ''
);

fs.writeFileSync('server.ts', code);
