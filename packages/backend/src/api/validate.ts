import { Router, Request, Response } from 'express';
import { ValidatorRequest, ApiResponse, ValidatorResponse } from '@healthit-care/shared';
import { validateMessage, getValidationProfiles } from '../services/messageValidator';

const router = Router();

// Validate a message
router.post('/check', async (req: Request, res: Response) => {
  try {
    const request: ValidatorRequest = req.body;

    if (!request.message) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Message content is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}`,
        },
      };
      return res.status(400).json(response);
    }

    if (!request.format) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Message format is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}`,
        },
      };
      return res.status(400).json(response);
    }

    const result = await validateMessage(request);

    const response: ApiResponse<ValidatorResponse> = {
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
        code: 'VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to validate message',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
      },
    };
    res.status(500).json(response);
  }
});

// Get available validation profiles
router.get('/profiles', async (req: Request, res: Response) => {
  try {
    const profiles = getValidationProfiles();

    const response: ApiResponse<typeof profiles> = {
      success: true,
      data: profiles,
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
        message: 'Failed to get validation profiles',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
      },
    };
    res.status(500).json(response);
  }
});

// Get supported formats
router.get('/formats', async (req: Request, res: Response) => {
  try {
    const formats = [
      { id: 'hl7v2', name: 'HL7 v2.x', description: 'HL7 version 2 messages' },
      { id: 'fhir-json', name: 'FHIR JSON', description: 'FHIR R4 resources in JSON format' },
      { id: 'fhir-xml', name: 'FHIR XML', description: 'FHIR R4 resources in XML format' },
      { id: 'cda', name: 'CDA', description: 'Clinical Document Architecture' },
    ];

    const response: ApiResponse<typeof formats> = {
      success: true,
      data: formats,
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
        message: 'Failed to get formats',
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
