import { Router, Request, Response } from 'express';
import { AzureArchitectService } from '../services/azureArchitect';
import { ApiResponse, AzureArchitectResponse, ServiceRecommendationResponse } from '@healthit-care/shared';

const router = Router();
const service = new AzureArchitectService();

// Ask a question about Azure healthcare architecture
router.post('/ask', (req: Request, res: Response) => {
  try {
    const result = service.ask(req.body);

    const response: ApiResponse<AzureArchitectResponse> = {
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
        code: 'QUERY_ERROR',
        message: error instanceof Error ? error.message : 'Failed to process query',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: 'error',
      },
    };

    res.status(400).json(response);
  }
});

// Get service recommendations for a use case
router.post('/recommend', (req: Request, res: Response) => {
  try {
    const result = service.getRecommendation(req.body);

    const response: ApiResponse<ServiceRecommendationResponse> = {
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
        code: 'RECOMMENDATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to generate recommendations',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: 'error',
      },
    };

    res.status(400).json(response);
  }
});

// Get all architecture templates
router.get('/architectures', (_req: Request, res: Response) => {
  const architectures = service.getArchitectures();

  const response: ApiResponse<typeof architectures> = {
    success: true,
    data: architectures,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: 'architectures',
    },
  };

  res.json(response);
});

// Get all Azure services
router.get('/services', (_req: Request, res: Response) => {
  const services = service.getServices();

  const response: ApiResponse<typeof services> = {
    success: true,
    data: services,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: 'services',
    },
  };

  res.json(response);
});

// Get best practices
router.get('/best-practices', (_req: Request, res: Response) => {
  const practices = service.getBestPractices();

  const response: ApiResponse<typeof practices> = {
    success: true,
    data: practices,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: 'best-practices',
    },
  };

  res.json(response);
});

// Get available use cases
router.get('/use-cases', (_req: Request, res: Response) => {
  const useCases = service.getUseCases();

  const response: ApiResponse<typeof useCases> = {
    success: true,
    data: useCases,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: 'use-cases',
    },
  };

  res.json(response);
});

export default router;
