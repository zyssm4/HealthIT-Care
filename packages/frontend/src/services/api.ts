import {
  SchemaRequest,
  SchemaResponse,
  TransformResponse,
  ApiResponse,
  SchemaOptions,
  TransformOptions,
  MessageFormat,
  DEFAULT_SCHEMA_OPTIONS,
  DEFAULT_TRANSFORM_OPTIONS,
} from '@healthit-care/shared';

// Use environment variable for API URL in production, or relative path for development
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1';

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

// Message Transformer API

export async function transformMessage(
  inputMessage: string,
  inputFormat: MessageFormat,
  outputFormat: MessageFormat,
  options?: Partial<TransformOptions>
): Promise<TransformResponse> {
  const response = await fetch(`${API_BASE}/transform/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputMessage,
      inputFormat,
      outputFormat,
      options: {
        ...DEFAULT_TRANSFORM_OPTIONS,
        ...options,
      },
    }),
  });

  const data: ApiResponse<TransformResponse> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error?.message || 'Failed to transform message');
  }

  return data.data;
}

export async function getSupportedFormats(): Promise<object> {
  const response = await fetch(`${API_BASE}/transform/formats`);
  const data: ApiResponse<object> = await response.json();

  if (!data.success || !data.data) {
    return { formats: [] };
  }

  return data.data;
}

export async function getSupportedTransformations(): Promise<object> {
  const response = await fetch(`${API_BASE}/transform/supported`);
  const data: ApiResponse<object> = await response.json();

  if (!data.success || !data.data) {
    return { transformations: [] };
  }

  return data.data;
}
