import app from './api/app';

const PORT = 3002;

app.listen(PORT, () => {
  console.log(`Test server ready on port ${PORT}`);
});
