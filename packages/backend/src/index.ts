import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { schemaRouter } from './api/schema';
import { transformRouter } from './api/transform';
import { errorHandler } from './api/middleware';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'healthit-care-api',
      version: '1.0.0',
      applications: ['schema-generator', 'message-transformer'],
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || 'N/A',
    },
  });
});

// API routes
app.use('/api/v1/schema', schemaRouter);
app.use('/api/v1/transform', transformRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || 'N/A',
    },
  });
});

app.listen(PORT, () => {
  console.log(`HealthIT-Care API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Available APIs:`);
  console.log(`  - Schema Generator: /api/v1/schema`);
  console.log(`  - Message Transformer: /api/v1/transform`);
});

export default app;
