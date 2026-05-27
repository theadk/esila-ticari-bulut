import { sendMail } from './server/mailer.js';
(async () => {
  const result = await sendMail('ahdurko@gmail.com', 'Test', 'Test content');
  console.log('gmail:', result);
  const result2 = await sendMail('test@hotmail.com', 'Test', 'Test content');
  console.log('hotmail:', result2);
})();
