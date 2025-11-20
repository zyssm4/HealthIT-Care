import { Router, Request, Response } from 'express';
import { DocGeneratorRequest, ApiResponse, DocGeneratorResponse } from '@healthit-care/shared';
import { generateDocumentation, createSampleInterface } from '../services/docGenerator';

const router = Router();

// Generate interface documentation
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const request: DocGeneratorRequest = req.body;

    if (!request.interfaces || request.interfaces.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'At least one interface definition is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}`,
        },
      };
      return res.status(400).json(response);
    }

    const result = await generateDocumentation(request);

    const response: ApiResponse<DocGeneratorResponse> = {
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
      },
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'GENERATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to generate documentation',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
      },
    };
    res.status(500).json(response);
  }
});

// Get sample interface template
router.get('/sample', async (req: Request, res: Response) => {
  try {
    const sample = createSampleInterface();

    const response: ApiResponse<typeof sample> = {
      success: true,
      data: sample,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
      },
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'ERROR',
        message: 'Failed to get sample interface',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
      },
    };
    res.status(500).json(response);
  }
});

export default router;
