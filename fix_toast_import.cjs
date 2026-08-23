const fs = require('fs');
let code = fs.readFileSync('pages/Urunler.tsx', 'utf8');

if (!code.includes('react-hot-toast')) {
  code = code.replace(
    "import { useSpeechRecognition } from '../lib/useSpeechRecognition';",
    "import { useSpeechRecognition } from '../lib/useSpeechRecognition';\nimport toast from 'react-hot-toast';"
  );
  fs.writeFileSync('pages/Urunler.tsx', code);
}
