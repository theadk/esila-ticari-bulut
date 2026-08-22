const fs = require('fs');
let code = fs.readFileSync('pages/Teklifler.tsx', 'utf8');

code = code.replace(
  "import { FileBadge, Plus, Search, FileText, Printer, CheckCircle, XCircle, Trash2, Share2, Mail, MessageCircle } from 'lucide-react';",
  "import { FileBadge, Plus, Search, FileText, Printer, CheckCircle, XCircle, Trash2, Share2, Mail, MessageCircle, Package } from 'lucide-react';"
);

fs.writeFileSync('pages/Teklifler.tsx', code);
