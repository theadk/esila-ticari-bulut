const fs = require('fs');

function updateServer(file) {
  let content = fs.readFileSync(file, 'utf8');
  // Only replace inside app.post('/api/tenants'
  // But wait! There are other res.json({success: true}) in the file for other routes.
  // We should specifically replace "res.json({success: true});" inside the POST /api/tenants block.
  
  // It appears around line 618 and 638 currently.
  // We can just find "await sendRegistrationMail(data.email, data.name);" and the following res.json.
  
  content = content.replace(
    /await sendRegistrationMail\(data\.email, data\.name\);\s*return res\.json\(\{success: true\}\);/g,
    "await sendRegistrationMail(data.email, data.name);\n        return res.json({success: true, password: newAdminPass});"
  );
  
  content = content.replace(
    /await sendRegistrationMail\(data\.email, data\.name\);\s*res\.json\(\{success: true\}\);/g,
    "await sendRegistrationMail(data.email, data.name);\n      res.json({success: true, password: newAdminPass});"
  );

  fs.writeFileSync(file, content);
}

updateServer('server.ts');
updateServer('server2.ts');
console.log('done');
