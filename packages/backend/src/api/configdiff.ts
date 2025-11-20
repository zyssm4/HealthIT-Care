import { Router, Request, Response } from 'express';
import { ConfigDiffRequest, ApiResponse, ConfigDiffResponse } from '@healthit-care/shared';
import { compareConfigs } from '../services/configDiff';

const router = Router();

// Compare configurations
router.post('/compare', async (req: Request, res: Response) => {
  try {
    const request: ConfigDiffRequest = req.body;

    if (!request.sourceConfig || !request.sourceConfig.content) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Source configuration is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}`,
        },
      };
      return res.status(400).json(response);
    }

    if (!request.targetConfig || !request.targetConfig.content) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Target configuration is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}`,
        },
      };
      return res.status(400).json(response);
    }

    const result = await compareConfigs(request);

    const response: ApiResponse<ConfigDiffResponse> = {
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
        code: 'COMPARISON_ERROR',
        message: error instanceof Error ? error.message : 'Failed to compare configurations',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
      },
    };
    res.status(500).json(response);
  }
});

// Get supported config types
router.get('/types', async (req: Request, res: Response) => {
  try {
    const types = [
      { id: 'properties', name: 'Properties File', extension: '.properties' },
      { id: 'json', name: 'JSON', extension: '.json' },
      { id: 'xml', name: 'XML', extension: '.xml' },
      { id: 'tcl', name: 'TCL Script', extension: '.tcl' },
      { id: 'xlt', name: 'Cloverleaf XLT', extension: '.xlt' },
    ];

    const response: ApiResponse<typeof types> = {
      success: true,
      data: types,
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
        message: 'Failed to get config types',
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
