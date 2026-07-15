import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import fs from 'fs';

(async () => {
  // start prod server
  const prod = spawn('node', ['dist/server.cjs'], { env: { ...process.env, NODE_ENV: 'production', PORT: '3000' } });
  
  prod.stdout.on('data', d => console.log('PROD STDOUT:', d.toString()));
  prod.stderr.on('data', d => console.log('PROD STDERR:', d.toString()));

  await new Promise(r => setTimeout(r, 4000));

  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().toLowerCase().includes('error')) {
      console.log('PAGE ERROR LOG:', msg.text());
    }
  });
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' }).catch(e => console.log(e));
  
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({ path: 'screenshot-prod.png' });
  
  await browser.close();
  prod.kill();
})();
