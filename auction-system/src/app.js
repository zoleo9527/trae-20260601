const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger');

const authRoutes = require('./routes/authRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const itemRoutes = require('./routes/itemRoutes');
const attachmentRoutes = require('./routes/attachmentRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api/auth', authRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/attachments', attachmentRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Auction System API' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});