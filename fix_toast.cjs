const fs = require('fs');
let code = fs.readFileSync('pages/Ayarlar.tsx', 'utf8');

if (!code.includes('import { toast } from')) {
    code = code.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { toast } from 'react-hot-toast';");
}

fs.writeFileSync('pages/Ayarlar.tsx', code);
console.log("Fixed toast import");
