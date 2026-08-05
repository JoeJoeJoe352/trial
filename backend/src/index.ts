import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT ?? 3000;

app.use(cors());

app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Hello World' });
});

app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
