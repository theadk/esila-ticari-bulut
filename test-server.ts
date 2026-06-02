import express from 'express';
export const testApp = express();
testApp.use(express.json());
testApp.post('/test', (req, res) => {
  console.log('Received body attachments:', req.body.attachments);
  res.json({ ok: true });
});
testApp.listen(3001, () => console.log('test server running'));
