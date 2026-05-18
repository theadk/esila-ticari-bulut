import { spawn } from 'child_process';
const child = spawn('npx', ['tsx', 'server.ts'], { env: { ...process.env, PORT: '3006' } });
setTimeout(() => {
  fetch('http://localhost:3006/api/test-users')
    .then(r => r.text())
    .then(d => { console.log("FETCHED 3006:", d.substring(0, 50)); child.kill(); process.exit(0); })
    .catch(e => { console.error(e); child.kill(); process.exit(1); });
}, 3000);
