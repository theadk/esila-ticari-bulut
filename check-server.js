import { exec } from 'child_process';
exec('npx tsx server.ts', (err, stdout, stderr) => {
  if (err) console.error(err);
});
setTimeout(() => process.exit(0), 1000); // Wait 1 sec
