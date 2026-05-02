import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import apiRouter from './src/routes/api.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Enable CORS for requests from the frontend. Set `CORS_ORIGIN` in env to restrict.
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

// Routes
app.use('/api', apiRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Express API!' });
});

// Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
