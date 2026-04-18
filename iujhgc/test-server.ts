import express from 'express';

const app = express();
app.use(express.json());

app.get('/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ status: 'works' });
});

app.listen(5001, () => {
  console.log('Test server on 5001');
});