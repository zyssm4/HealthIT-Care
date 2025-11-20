// Schema Generator Types

export interface SchemaRequest {
  id?: string;
  mode: 'requirements' | 'existing';
  input: string;
  additionalRequests?: string;
  options: SchemaOptions;
  createdAt?: string;
}

export interface SchemaOptions {
  includeAuditFields: boolean;
  includeSoftDelete: boolean;
  includeEncryptionMarkers: boolean;
  includeIndexes: boolean;
  namingConvention: 'snake_case' | 'camelCase' | 'PascalCase';
  databaseType: 'postgresql' | 'mysql' | 'mssql';
  includeComments: boolean;
  healthcareCompliance: boolean;
}

export interface SchemaResponse {
  id: string;
  request: SchemaRequest;
  generatedSchema: string;
  explanations: SchemaExplanation[];
  warnings: SchemaWarning[];
  suggestions: SchemaSuggestion[];
  metadata: SchemaMetadata;
  createdAt: string;
}

export interface SchemaExplanation {
  section: string;
  explanation: string;
  reasoning: string;
  relatedTables?: string[];
}

export interface SchemaWarning {
  severity: 'low' | 'medium' | 'high';
  message: string;
  recommendation: string;
  affectedElements?: string[];
}

export interface SchemaSuggestion {
  type: 'performance' | 'compliance' | 'best-practice' | 'security';
  title: string;
  description: string;
  implementation?: string;
}

export interface SchemaMetadata {
  tableCount: number;
  columnCount: number;
  indexCount: number;
  foreignKeyCount: number;
  estimatedComplexity: 'simple' | 'moderate' | 'complex';
  complianceScore: number;
}

// Healthcare-specific field definitions
export interface HealthcareAuditFields {
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  version: number;
}

export interface SoftDeleteFields {
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface EncryptionMarker {
  field: string;
  encryptionType: 'PHI' | 'PII' | 'sensitive';
  algorithm: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string[];
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

// Table and Column definitions for parsing
export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
  primaryKey?: string[];
  foreignKeys?: ForeignKeyDefinition[];
  indexes?: IndexDefinition[];
  constraints?: ConstraintDefinition[];
  comment?: string;
}

export interface ColumnDefinition {
  name: string;
  dataType: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey?: boolean;
  isUnique?: boolean;
  comment?: string;
  encryptionMarker?: EncryptionMarker;
}

export interface ForeignKeyDefinition {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  isUnique?: boolean;
  type?: 'btree' | 'hash' | 'gin' | 'gist';
}

export interface ConstraintDefinition {
  name: string;
  type: 'CHECK' | 'UNIQUE' | 'EXCLUDE';
  definition: string;
}

// Healthcare data model templates
export const HEALTHCARE_TEMPLATES = {
  PATIENT: 'patient',
  ENCOUNTER: 'encounter',
  OBSERVATION: 'observation',
  MEDICATION: 'medication',
  PRACTITIONER: 'practitioner',
  ORGANIZATION: 'organization',
  APPOINTMENT: 'appointment',
  DIAGNOSTIC_REPORT: 'diagnostic_report',
  ALLERGY: 'allergy',
  IMMUNIZATION: 'immunization',
} as const;

export type HealthcareTemplate = typeof HEALTHCARE_TEMPLATES[keyof typeof HEALTHCARE_TEMPLATES];

// Default options
export const DEFAULT_SCHEMA_OPTIONS: SchemaOptions = {
  includeAuditFields: true,
  includeSoftDelete: true,
  includeEncryptionMarkers: true,
  includeIndexes: true,
  namingConvention: 'snake_case',
  databaseType: 'postgresql',
  includeComments: true,
  healthcareCompliance: true,
};
