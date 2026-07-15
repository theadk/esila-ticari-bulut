import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('Error')) {
      console.log('PAGE ERROR LOG:', msg.text());
    }
  });
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem('esila_tenant_id', '1111111111');
    sessionStorage.setItem('esila_user_id', 'user_id_here');
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' }).catch(e => console.log(e));
  
  // wait a bit for react to render
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
