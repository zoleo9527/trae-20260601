import express from 'express';
import cors from 'cors';
import renewalsRouter from './routes/renewals';
import communicationsRouter from './routes/communications';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/renewals', renewalsRouter);
app.use('/api/communications', communicationsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
