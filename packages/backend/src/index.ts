import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { schemaRouter } from './api/schema';
import { transformRouter } from './api/transform';
import docsRouter from './api/docs';
import codemapRouter from './api/codemap';
import testgenRouter from './api/testgen';
import configdiffRouter from './api/configdiff';
import changesRouter from './api/changes';
import validateRouter from './api/validate';
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
      applications: [
        'schema-generator',
        'message-transformer',
        'interface-docs',
        'code-mapper',
        'test-generator',
        'config-diff',
        'change-tracker',
        'message-validator',
      ],
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
app.use('/api/v1/docs', docsRouter);
app.use('/api/v1/codemap', codemapRouter);
app.use('/api/v1/testgen', testgenRouter);
app.use('/api/v1/configdiff', configdiffRouter);
app.use('/api/v1/changes', changesRouter);
app.use('/api/v1/validate', validateRouter);

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
  console.log(`  - Interface Docs: /api/v1/docs`);
  console.log(`  - Code Mapper: /api/v1/codemap`);
  console.log(`  - Test Generator: /api/v1/testgen`);
  console.log(`  - Config Diff: /api/v1/configdiff`);
  console.log(`  - Change Tracker: /api/v1/changes`);
  console.log(`  - Message Validator: /api/v1/validate`);
});

export default app;
