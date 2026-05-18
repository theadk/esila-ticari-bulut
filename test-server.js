import { spawn } from 'child_process';
const child = spawn('npx', ['tsx', 'server.ts'], { env: { ...process.env, PORT: '3006' } });
child.stdout.on('data', d => console.log(d.toString()));
child.stderr.on('data', d => console.error(d.toString()));

setTimeout(() => {
  fetch('http://localhost:3006/api/users')
    .then(r => r.json())
    .then(d => { console.log("FETCHED:", d); child.kill(); process.exit(0); })
    .catch(e => { console.error(e); child.kill(); process.exit(1); });
}, 3000);
