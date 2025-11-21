import { Router, Request, Response } from 'express';
import { TranslationTableService } from '../services/translationTable';
import { ApiResponse, TranslationTableResponse } from '@healthit-care/shared';

const router = Router();
const service = new TranslationTableService();

// Generate translation table
router.post('/generate', (req: Request, res: Response) => {
  try {
    const result = service.generate(req.body);

    const response: ApiResponse<TranslationTableResponse> = {
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: result.id,
      },
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'GENERATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to generate translation table',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: 'error',
      },
    };

    res.status(400).json(response);
  }
});

// Get sample entries
router.get('/sample', (_req: Request, res: Response) => {
  const entries = service.getSampleEntries();

  const response: ApiResponse<{ entries: typeof entries }> = {
    success: true,
    data: { entries },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: 'sample',
    },
  };

  res.json(response);
});

// Get supported output formats
router.get('/formats', (_req: Request, res: Response) => {
  const formats = [
    { id: 'cloverleaf-xlt', name: 'Cloverleaf XLT', description: 'Infor Cloverleaf translation table format' },
    { id: 'json', name: 'JSON', description: 'JavaScript Object Notation' },
    { id: 'csv', name: 'CSV', description: 'Comma-separated values' },
    { id: 'xml', name: 'XML', description: 'Extensible Markup Language' },
    { id: 'properties', name: 'Properties', description: 'Java properties file format' },
  ];

  const response: ApiResponse<{ formats: typeof formats }> = {
    success: true,
    data: { formats },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: 'formats',
    },
  };

  res.json(response);
});

export default router;
