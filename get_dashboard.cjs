const fs = require('fs');
let code = fs.readFileSync('pages/Dashboard.tsx', 'utf8');
console.log(code.substring(code.indexOf("const installmentStats = useMemo(() => {"), code.indexOf("const chartData = useMemo(() => {")));
