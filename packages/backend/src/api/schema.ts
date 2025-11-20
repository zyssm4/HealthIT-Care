import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  SchemaRequest,
  SchemaResponse,
  ApiResponse,
  DEFAULT_SCHEMA_OPTIONS,
} from '@healthit-care/shared';
import { SchemaGeneratorService } from '../services/schemaGenerator';
import { validateSchemaRequest } from './middleware';

const router = Router();
const schemaService = new SchemaGeneratorService();

// Generate schema from requirements or existing schema
router.post('/generate', validateSchemaRequest, async (req: Request, res: Response) => {
  try {
    const requestId = uuidv4();
    const timestamp = new Date().toISOString();

    const schemaRequest: SchemaRequest = {
      id: requestId,
      mode: req.body.mode,
      input: req.body.input,
      additionalRequests: req.body.additionalRequests,
      options: {
        ...DEFAULT_SCHEMA_OPTIONS,
        ...req.body.options,
      },
      createdAt: timestamp,
    };

    const result = await schemaService.generateSchema(schemaRequest);

    const response: ApiResponse<SchemaResponse> = {
      success: true,
      data: result,
      meta: {
        timestamp,
        requestId,
      },
    };

    res.json(response);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      error: {
        code: 'GENERATION_ERROR',
        message: err.message,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || 'N/A',
      },
    });
  }
});

// Analyze existing schema
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const requestId = uuidv4();
    const { schema } = req.body;

    if (!schema || typeof schema !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Schema is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      });
      return;
    }

    const analysis = schemaService.analyzeSchema(schema);

    res.json({
      success: true,
      data: analysis,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYSIS_ERROR',
        message: err.message,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || 'N/A',
      },
    });
  }
});

// Get healthcare templates
router.get('/templates', (req: Request, res: Response) => {
  const templates = schemaService.getHealthcareTemplates();

  res.json({
    success: true,
    data: templates,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: uuidv4(),
    },
  });
});

// Get default options
router.get('/options', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: DEFAULT_SCHEMA_OPTIONS,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: uuidv4(),
    },
  });
});

export { router as schemaRouter };
