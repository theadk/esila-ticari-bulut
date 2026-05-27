import { sendMail } from './server/mailer.ts';
(async () => {
  const result = await sendMail('ahdurko@gmail.com', 'Test', 'Test content');
  console.log('gmail:', result);
  const result2 = await sendMail('test@hotmail.com', 'Test', 'Test content');
  console.log('hotmail:', result2);
})();
