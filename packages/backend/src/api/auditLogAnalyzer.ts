import { Router, Request, Response } from 'express';
import { AuditLogAnalyzerService } from '../services/auditLogAnalyzer';
import { ApiResponse, LogAnalysisResponse } from '@healthit-care/shared';

const router = Router();
const service = new AuditLogAnalyzerService();

// Analyze logs
router.post('/analyze', (req: Request, res: Response) => {
  try {
    const result = service.analyze(req.body);

    const response: ApiResponse<LogAnalysisResponse> = {
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
        code: 'ANALYSIS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to analyze logs',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: 'error',
      },
    };

    res.status(400).json(response);
  }
});

// Get sample logs
router.get('/sample', (_req: Request, res: Response) => {
  const logs = service.getSampleLogs();

  const response: ApiResponse<{ logs: string }> = {
    success: true,
    data: { logs },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: 'sample',
    },
  };

  res.json(response);
});

// Get supported log sources
router.get('/sources', (_req: Request, res: Response) => {
  const sources = [
    { id: 'cloverleaf', name: 'Cloverleaf', description: 'Infor Cloverleaf integration engine logs' },
    { id: 'mirth', name: 'Mirth Connect', description: 'NextGen Mirth Connect channel logs' },
    { id: 'rhapsody', name: 'Rhapsody', description: 'InterSystems Rhapsody logs' },
    { id: 'syslog', name: 'Syslog', description: 'Standard syslog format' },
    { id: 'generic', name: 'Generic', description: 'Generic log format with auto-detection' },
  ];

  const response: ApiResponse<{ sources: typeof sources }> = {
    success: true,
    data: { sources },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: 'sources',
    },
  };

  res.json(response);
});

export default router;
