import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  TransformRequest,
  TransformResponse,
  ApiResponse,
  DEFAULT_TRANSFORM_OPTIONS,
  SUPPORTED_TRANSFORMATIONS,
} from '@healthit-care/shared';
import { MessageTransformerService } from '../services/messageTransformer';

const router = Router();
const transformService = new MessageTransformerService();

// Transform message
router.post('/convert', async (req: Request, res: Response) => {
  try {
    const requestId = uuidv4();
    const timestamp = new Date().toISOString();

    const { inputMessage, inputFormat, outputFormat, options } = req.body;

    // Validate required fields
    if (!inputMessage || !inputFormat || !outputFormat) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'inputMessage, inputFormat, and outputFormat are required',
        },
        meta: { timestamp, requestId },
      });
      return;
    }

    // Check if transformation is supported
    const supported = SUPPORTED_TRANSFORMATIONS.find(t => t.from === inputFormat);
    if (!supported || !supported.to.includes(outputFormat)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'UNSUPPORTED_TRANSFORMATION',
          message: `Transformation from ${inputFormat} to ${outputFormat} is not supported`,
        },
        meta: { timestamp, requestId },
      });
      return;
    }

    const transformRequest: TransformRequest = {
      id: requestId,
      inputMessage,
      inputFormat,
      outputFormat,
      options: {
        ...DEFAULT_TRANSFORM_OPTIONS,
        ...options,
      },
      createdAt: timestamp,
    };

    const result = transformService.transform(transformRequest);

    const response: ApiResponse<TransformResponse> = {
      success: true,
      data: result,
      meta: { timestamp, requestId },
    };

    res.json(response);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      error: {
        code: 'TRANSFORMATION_ERROR',
        message: err.message,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || 'N/A',
      },
    });
  }
});

// Get supported formats
router.get('/formats', (req: Request, res: Response) => {
  const formats = transformService.getSupportedFormats();

  res.json({
    success: true,
    data: formats,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: uuidv4(),
    },
  });
});

// Get supported transformations
router.get('/supported', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      transformations: SUPPORTED_TRANSFORMATIONS,
    },
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
    data: DEFAULT_TRANSFORM_OPTIONS,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: uuidv4(),
    },
  });
});

export { router as transformRouter };
