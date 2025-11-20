import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@healthit-care/shared';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err.message);

  const response: ApiResponse<null> = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An internal error occurred'
        : err.message,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || 'N/A',
    },
  };

  res.status(500).json(response);
}

export function validateSchemaRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { mode, input, options } = req.body;

  const errors: string[] = [];

  if (!mode || !['requirements', 'existing'].includes(mode)) {
    errors.push('Invalid mode. Must be "requirements" or "existing"');
  }

  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    errors.push('Input is required and must be a non-empty string');
  }

  if (options) {
    if (options.databaseType && !['postgresql', 'mysql', 'mssql'].includes(options.databaseType)) {
      errors.push('Invalid databaseType. Must be postgresql, mysql, or mssql');
    }
    if (options.namingConvention && !['snake_case', 'camelCase', 'PascalCase'].includes(options.namingConvention)) {
      errors.push('Invalid namingConvention');
    }
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: errors,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || 'N/A',
      },
    });
    return;
  }

  next();
}
