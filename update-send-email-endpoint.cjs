const fs = require('fs');

function updateSendEmailEndpoint(file) {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(
        /const \{ to, subject, html \} = req\.body;\s*const result = await sendMail\(to, subject, html\);/,
        'const { to, subject, html, wrapped } = req.body;\n      const result = await sendMail(to, subject, html, wrapped ?? false);'
    );
    fs.writeFileSync(file, code);
}

updateSendEmailEndpoint('server.ts');
updateSendEmailEndpoint('server2.ts');
console.log('Done.');
