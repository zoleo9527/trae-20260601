const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const remindersRouter = require('./src/routes/reminders');

const app = express();
const PORT = process.env.PORT || 8765;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', remindersRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`建材仓配系统已启动: http://localhost:${PORT}`);
});
