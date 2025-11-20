import { Router, Request, Response } from 'express';
import { TestGeneratorRequest, ApiResponse, TestGeneratorResponse } from '@healthit-care/shared';
import { generateTestCases } from '../services/testGenerator';

const router = Router();

// Generate test cases
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const request: TestGeneratorRequest = req.body;

    if (!request.interfaceSpec || !request.interfaceSpec.name) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Interface specification with name is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}`,
        },
      };
      return res.status(400).json(response);
    }

    if (!request.testScenarios || request.testScenarios.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'At least one test scenario is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}`,
        },
      };
      return res.status(400).json(response);
    }

    const result = await generateTestCases({
      ...request,
      count: request.count || 10,
    });

    const response: ApiResponse<TestGeneratorResponse> = {
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
        message: error instanceof Error ? error.message : 'Failed to generate test cases',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
      },
    };
    res.status(500).json(response);
  }
});

// Get available test scenarios
router.get('/scenarios', async (req: Request, res: Response) => {
  try {
    const scenarios = [
      { id: 'happy-path', name: 'Happy Path', description: 'Valid messages that should process successfully' },
      { id: 'missing-required', name: 'Missing Required Fields', description: 'Messages with required fields removed' },
      { id: 'invalid-data', name: 'Invalid Data', description: 'Messages with malformed or invalid data' },
      { id: 'edge-cases', name: 'Edge Cases', description: 'Boundary conditions and special characters' },
    ];

    const response: ApiResponse<typeof scenarios> = {
      success: true,
      data: scenarios,
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
        message: 'Failed to get scenarios',
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
