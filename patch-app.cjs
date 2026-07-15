const fs = require('fs');

let content = fs.readFileSync('App.tsx', 'utf8');

content = content.replace(
  "import { safeSessionStorage } from './lib/storage';\nimport React, { useState, useEffect } from 'react';",
  "import { safeSessionStorage } from './lib/storage';\nimport { ErrorBoundary } from './components/ErrorBoundary';\nimport React, { useState, useEffect } from 'react';"
);

content = content.replace(
  "  return (\n    <div className=\"flex h-screen bg-gray-50 overflow-hidden\">\n      <Toaster position=\"top-right\" />",
  "  return (\n    <ErrorBoundary>\n      <div className=\"flex h-screen bg-gray-50 overflow-hidden\">\n        <Toaster position=\"top-right\" />"
);

content = content.replace(
  "      <InstallPrompt />\n    </div>\n  );\n};",
  "      <InstallPrompt />\n      </div>\n    </ErrorBoundary>\n  );\n};"
);

fs.writeFileSync('App.tsx', content);
