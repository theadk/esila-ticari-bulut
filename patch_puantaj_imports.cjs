const fs = require('fs');
let code = fs.readFileSync('components/PuantajMaasView.tsx', 'utf8');

if (!code.includes('PerformanceScore')) {
  code = code.replace(
    'import { AttendanceRecord, SalaryAdjustment } from "../types";',
    'import { AttendanceRecord, SalaryAdjustment, PerformanceScore } from "../types";'
  );
  code = code.replace(
    'CheckCircle, XCircle } from "lucide-react";',
    'CheckCircle, XCircle, Star } from "lucide-react";'
  );
  fs.writeFileSync('components/PuantajMaasView.tsx', code);
  console.log('patched imports');
}
