import {
  SchemaRequest,
  SchemaResponse,
  ApiResponse,
  SchemaOptions,
  DEFAULT_SCHEMA_OPTIONS,
} from '@healthit-care/shared';

const API_BASE = '/api/v1';

export async function generateSchema(
  mode: 'requirements' | 'existing',
  input: string,
  additionalRequests?: string,
  options?: Partial<SchemaOptions>
): Promise<SchemaResponse> {
  const request: SchemaRequest = {
    mode,
    input,
    additionalRequests,
    options: {
      ...DEFAULT_SCHEMA_OPTIONS,
      ...options,
    },
  };

  const response = await fetch(`${API_BASE}/schema/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data: ApiResponse<SchemaResponse> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error?.message || 'Failed to generate schema');
  }

  return data.data;
}

export async function getDefaultOptions(): Promise<SchemaOptions> {
  const response = await fetch(`${API_BASE}/schema/options`);
  const data: ApiResponse<SchemaOptions> = await response.json();

  if (!data.success || !data.data) {
    return DEFAULT_SCHEMA_OPTIONS;
  }

  return data.data;
}

export async function getHealthcareTemplates(): Promise<object> {
  const response = await fetch(`${API_BASE}/schema/templates`);
  const data: ApiResponse<object> = await response.json();

  if (!data.success || !data.data) {
    return { templates: [] };
  }

  return data.data;
}

export async function analyzeSchema(schema: string): Promise<object> {
  const response = await fetch(`${API_BASE}/schema/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ schema }),
  });

  const data: ApiResponse<object> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error?.message || 'Failed to analyze schema');
  }

  return data.data;
}
