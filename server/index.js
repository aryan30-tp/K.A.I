import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import apiRouter from './src/routes/api.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Enable CORS for requests from the frontend. Set CORS_ORIGIN (comma-separated) to restrict.
const corsOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = corsOrigins.includes('*')
  ? { origin: '*' }
  : {
      origin: (origin, callback) => {
        // Allow same-origin or non-browser requests without Origin header.
        if (!origin || corsOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
    };

app.use(cors(corsOptions));

// Routes
app.use('/api', apiRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Express API!' });
});

// Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
