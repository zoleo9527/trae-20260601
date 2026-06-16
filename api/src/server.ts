import express from 'express';
import cors from 'cors';

import stockRequestsRouter from './routes/stockRequests';
import productsRouter from './routes/products';
import inspectionsRouter from './routes/inspections';
import differencesRouter from './routes/differences';
import storesRouter from './routes/stores';
import usersRouter from './routes/users';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/stock-requests', stockRequestsRouter);
app.use('/api/products', productsRouter);
app.use('/api/inspections', inspectionsRouter);
app.use('/api/differences', differencesRouter);
app.use('/api/stores', storesRouter);
app.use('/api/users', usersRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
