const fs = require('fs');

function addCron(file) {
    let code = fs.readFileSync(file, 'utf8');
    
    if(!code.includes("import { startMailScheduler } from './server/mailScheduler.js';")) {
        code = code.replace("import { sendMail } from './server/mailer.js';", "import { sendMail } from './server/mailer.js';\nimport { startMailScheduler } from './server/mailScheduler.js';");
    }

    if(!code.includes("startMailScheduler();")) {
        code = code.replace("await initDb();", "await initDb();\n  startMailScheduler();");
    }

    fs.writeFileSync(file, code);
}

addCron('server.ts');
addCron('server2.ts');
console.log('Cron statements added.');
