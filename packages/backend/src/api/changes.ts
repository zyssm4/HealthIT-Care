import { Router, Request, Response } from 'express';
import { ChangeRequest, ApiResponse, ChangeRequestStats } from '@healthit-care/shared';
import {
  createChangeRequest,
  getChangeRequest,
  updateChangeRequest,
  deleteChangeRequest,
  listChangeRequests,
  getChangeRequestStats,
  addNote,
  updateStatus,
  generateChangeRequestReport,
} from '../services/changeTracker';

const router = Router();

// List all change requests
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string | undefined,
      priority: req.query.priority as string | undefined,
      affectedSystem: req.query.system as string | undefined,
    };

    const requests = await listChangeRequests(filters);

    const response: ApiResponse<ChangeRequest[]> = {
      success: true,
      data: requests,
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
        message: 'Failed to list change requests',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
      },
    };
    res.status(500).json(response);
  }
});

// Get statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getChangeRequestStats();

    const response: ApiResponse<ChangeRequestStats> = {
      success: true,
      data: stats,
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
        message: 'Failed to get statistics',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
      },
    };
    res.status(500).json(response);
  }
});

// Generate report
router.get('/report', async (req: Request, res: Response) => {
  try {
    const requests = await listChangeRequests();
    const report = generateChangeRequestReport(requests);

    const response: ApiResponse<{ report: string }> = {
      success: true,
      data: { report },
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
        message: 'Failed to generate report',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
      },
    };
    res.status(500).json(response);
  }
});

// Get single change request
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const changeRequest = await getChangeRequest(req.params.id);

    if (!changeRequest) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Change request not found',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}`,
        },
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<ChangeRequest> = {
      success: true,
      data: changeRequest,
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
        message: 'Failed to get change request',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
      },
    };
    res.status(500).json(response);
  }
});

// Create change request
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = req.body;

    if (!data.title) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Title is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}`,
        },
      };
      return res.status(400).json(response);
    }

    const changeRequest = await createChangeRequest({
      title: data.title,
      description: data.description || '',
      requestor: data.requestor || 'Unknown',
      priority: data.priority || 'medium',
      status: 'new',
      affectedSystems: data.affectedSystems || [],
      affectedInterfaces: data.affectedInterfaces || [],
      estimatedEffort: data.estimatedEffort || '',
      targetDate: data.targetDate,
      notes: data.notes || [],
    });

    const response: ApiResponse<ChangeRequest> = {
      success: true,
      data: changeRequest,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'ERROR',
        message: 'Failed to create change request',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
      },
    };
    res.status(500).json(response);
  }
});

// Update change request
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await updateChangeRequest(req.params.id, req.body);

    if (!updated) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Change request not found',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}`,
        },
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<ChangeRequest> = {
      success: true,
      data: updated,
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
        message: 'Failed to update change request',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
      },
    };
    res.status(500).json(response);
  }
});

// Update status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, note } = req.body;

    if (!status) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Status is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}`,
        },
      };
      return res.status(400).json(response);
    }

    const updated = await updateStatus(req.params.id, status, note);

    if (!updated) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Change request not found',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}`,
        },
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<ChangeRequest> = {
      success: true,
      data: updated,
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
        message: 'Failed to update status',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
      },
    };
    res.status(500).json(response);
  }
});

// Add note
router.post('/:id/notes', async (req: Request, res: Response) => {
  try {
    const { note } = req.body;

    if (!note) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Note content is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}`,
        },
      };
      return res.status(400).json(response);
    }

    const updated = await addNote(req.params.id, note);

    if (!updated) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Change request not found',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}`,
        },
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<ChangeRequest> = {
      success: true,
      data: updated,
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
        message: 'Failed to add note',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
      },
    };
    res.status(500).json(response);
  }
});

// Delete change request
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await deleteChangeRequest(req.params.id);

    if (!deleted) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Change request not found',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}`,
        },
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<{ deleted: boolean }> = {
      success: true,
      data: { deleted: true },
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
        message: 'Failed to delete change request',
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
