import { Router, Request, Response } from 'express';
import { FHIRExplorerService } from '../services/fhirExplorer';
import { ApiResponse, FHIRExploreResponse } from '@healthit-care/shared';

const router = Router();
const service = new FHIRExplorerService();

// Explore FHIR resource
router.post('/explore', (req: Request, res: Response) => {
  try {
    const result = service.explore(req.body);

    const response: ApiResponse<FHIRExploreResponse> = {
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
        code: 'EXPLORE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to explore FHIR resource',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: 'error',
      },
    };

    res.status(400).json(response);
  }
});

// Get sample resource
router.get('/sample', (_req: Request, res: Response) => {
  const resource = service.getSampleResource();

  const response: ApiResponse<{ resource: string }> = {
    success: true,
    data: { resource },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: 'sample',
    },
  };

  res.json(response);
});

// Get supported resource types
router.get('/resource-types', (_req: Request, res: Response) => {
  const resourceTypes = [
    { id: 'Patient', name: 'Patient', description: 'Demographics and administrative information' },
    { id: 'Practitioner', name: 'Practitioner', description: 'Healthcare provider information' },
    { id: 'Organization', name: 'Organization', description: 'Healthcare organization' },
    { id: 'Encounter', name: 'Encounter', description: 'Healthcare encounter/visit' },
    { id: 'Observation', name: 'Observation', description: 'Measurements and assertions' },
    { id: 'Condition', name: 'Condition', description: 'Clinical condition or diagnosis' },
    { id: 'Medication', name: 'Medication', description: 'Medication definition' },
    { id: 'MedicationRequest', name: 'MedicationRequest', description: 'Prescription order' },
    { id: 'DiagnosticReport', name: 'DiagnosticReport', description: 'Diagnostic report' },
    { id: 'Procedure', name: 'Procedure', description: 'Clinical procedure' },
    { id: 'AllergyIntolerance', name: 'AllergyIntolerance', description: 'Allergy or intolerance' },
    { id: 'Immunization', name: 'Immunization', description: 'Immunization record' },
    { id: 'DocumentReference', name: 'DocumentReference', description: 'Reference to document' },
    { id: 'Bundle', name: 'Bundle', description: 'Collection of resources' },
  ];

  const response: ApiResponse<{ resourceTypes: typeof resourceTypes }> = {
    success: true,
    data: { resourceTypes },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: 'resource-types',
    },
  };

  res.json(response);
});

export default router;
