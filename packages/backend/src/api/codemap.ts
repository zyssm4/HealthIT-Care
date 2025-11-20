import { Router, Request, Response } from 'express';
import { CodeMapperRequest, ApiResponse, CodeMapperResponse } from '@healthit-care/shared';
import { mapCodes, getSupportedCodeSystems } from '../services/codeMapper';

const router = Router();

// Map codes between systems
router.post('/map', async (req: Request, res: Response) => {
  try {
    const request: CodeMapperRequest = req.body;

    if (!request.sourceCodes || request.sourceCodes.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'At least one source code is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}`,
        },
      };
      return res.status(400).json(response);
    }

    if (!request.targetSystem) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Target code system is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}`,
        },
      };
      return res.status(400).json(response);
    }

    const result = await mapCodes(request);

    const response: ApiResponse<CodeMapperResponse> = {
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
        code: 'MAPPING_ERROR',
        message: error instanceof Error ? error.message : 'Failed to map codes',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
      },
    };
    res.status(500).json(response);
  }
});

// Get supported code systems
router.get('/systems', async (req: Request, res: Response) => {
  try {
    const systems = getSupportedCodeSystems();

    const response: ApiResponse<typeof systems> = {
      success: true,
      data: systems,
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
        message: 'Failed to get code systems',
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
