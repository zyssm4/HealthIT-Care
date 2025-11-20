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

// =============================================================================
// Message Transformer Types
// =============================================================================

export type MessageFormat =
  | 'hl7v2'
  | 'fhir-json'
  | 'fhir-xml'
  | 'cda'
  | 'dicom-json'
  | 'openehr'
  | 'csv'
  | 'json';

export interface TransformRequest {
  id?: string;
  inputMessage: string;
  inputFormat: MessageFormat;
  outputFormat: MessageFormat;
  options: TransformOptions;
  createdAt?: string;
}

export interface TransformOptions {
  generateTranslationFile: boolean;
  translationFileFormat: 'xslt' | 'jsonata' | 'mapping-table' | 'cloverleaf-xlt';
  includeComments: boolean;
  prettyPrint: boolean;
  validateOutput: boolean;
  preserveExtensions: boolean;
}

export interface TransformResponse {
  id: string;
  request: TransformRequest;
  transformedMessage: string;
  translationFile: TranslationFile;
  mappings: FieldMapping[];
  warnings: TransformWarning[];
  metadata: TransformMetadata;
  createdAt: string;
}

export interface TranslationFile {
  filename: string;
  format: string;
  content: string;
  description: string;
}

export interface FieldMapping {
  sourceField: string;
  sourcePath: string;
  targetField: string;
  targetPath: string;
  transformation: string;
  notes?: string;
}

export interface TransformWarning {
  severity: 'info' | 'warning' | 'error';
  message: string;
  sourceField?: string;
  recommendation?: string;
}

export interface TransformMetadata {
  inputFormat: MessageFormat;
  outputFormat: MessageFormat;
  fieldsMapped: number;
  fieldsUnmapped: number;
  transformationComplexity: 'simple' | 'moderate' | 'complex';
  estimatedAccuracy: number;
}

export const MESSAGE_FORMATS: Record<MessageFormat, { name: string; description: string }> = {
  'hl7v2': {
    name: 'HL7 v2.x',
    description: 'Health Level Seven version 2 messaging standard',
  },
  'fhir-json': {
    name: 'FHIR (JSON)',
    description: 'Fast Healthcare Interoperability Resources in JSON format',
  },
  'fhir-xml': {
    name: 'FHIR (XML)',
    description: 'Fast Healthcare Interoperability Resources in XML format',
  },
  'cda': {
    name: 'CDA',
    description: 'Clinical Document Architecture (HL7 CDA)',
  },
  'dicom-json': {
    name: 'DICOM JSON',
    description: 'DICOM metadata in JSON format',
  },
  'openehr': {
    name: 'OpenEHR',
    description: 'OpenEHR archetype-based clinical data',
  },
  'csv': {
    name: 'CSV',
    description: 'Comma-separated values',
  },
  'json': {
    name: 'Generic JSON',
    description: 'Generic JSON format',
  },
};

export const SUPPORTED_TRANSFORMATIONS: Array<{ from: MessageFormat; to: MessageFormat[] }> = [
  { from: 'hl7v2', to: ['fhir-json', 'fhir-xml', 'cda', 'json', 'csv'] },
  { from: 'fhir-json', to: ['hl7v2', 'fhir-xml', 'cda', 'json', 'csv'] },
  { from: 'fhir-xml', to: ['hl7v2', 'fhir-json', 'cda', 'json'] },
  { from: 'cda', to: ['fhir-json', 'fhir-xml', 'json'] },
  { from: 'dicom-json', to: ['fhir-json', 'json'] },
  { from: 'openehr', to: ['fhir-json', 'json'] },
  { from: 'csv', to: ['fhir-json', 'json', 'hl7v2'] },
  { from: 'json', to: ['fhir-json', 'csv'] },
];

export const DEFAULT_TRANSFORM_OPTIONS: TransformOptions = {
  generateTranslationFile: true,
  translationFileFormat: 'xslt',
  includeComments: true,
  prettyPrint: true,
  validateOutput: true,
  preserveExtensions: false,
};
