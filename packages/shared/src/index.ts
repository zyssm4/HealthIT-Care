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

// =============================================================================
// Interface Documentation Generator Types
// =============================================================================

export interface InterfaceDoc {
  id: string;
  name: string;
  description: string;
  sourceSystem: string;
  targetSystem: string;
  protocol: 'HL7v2' | 'FHIR' | 'REST' | 'SOAP' | 'FILE' | 'DATABASE';
  direction: 'inbound' | 'outbound' | 'bidirectional';
  messageTypes: string[];
  endpoints: EndpointConfig[];
  dataElements: DataElement[];
  notes?: string;
}

export interface EndpointConfig {
  name: string;
  type: 'sender' | 'receiver';
  host?: string;
  port?: number;
  path?: string;
  authentication?: string;
}

export interface DataElement {
  name: string;
  sourcePath: string;
  targetPath: string;
  dataType: string;
  required: boolean;
  description?: string;
}

export interface DocGeneratorRequest {
  interfaces: InterfaceDoc[];
  outputFormat: 'markdown' | 'html' | 'json';
  includeDataFlowDiagram: boolean;
  includeEndpointCatalog: boolean;
}

export interface DocGeneratorResponse {
  id: string;
  documentation: string;
  format: string;
  interfaceCount: number;
  generatedAt: string;
}

// =============================================================================
// Code Set / Terminology Mapper Types
// =============================================================================

export type CodeSystem = 'ICD10' | 'ICD9' | 'SNOMED' | 'LOINC' | 'CPT' | 'HCPCS' | 'RxNorm' | 'NDC' | 'LOCAL';

export interface CodeMapping {
  sourceCode: string;
  sourceSystem: CodeSystem;
  sourceDisplay: string;
  targetCode: string;
  targetSystem: CodeSystem;
  targetDisplay: string;
  equivalence: 'equivalent' | 'wider' | 'narrower' | 'inexact' | 'unmatched';
  notes?: string;
}

export interface CodeMapperRequest {
  sourceCodes: Array<{ code: string; system: CodeSystem; display?: string }>;
  targetSystem: CodeSystem;
  outputFormat: 'json' | 'csv' | 'cloverleaf-table';
}

export interface CodeMapperResponse {
  id: string;
  mappings: CodeMapping[];
  unmappedCodes: string[];
  outputFile: string;
  statistics: {
    total: number;
    mapped: number;
    unmapped: number;
    accuracy: number;
  };
  generatedAt: string;
}

// =============================================================================
// Integration Test Case Generator Types
// =============================================================================

export interface TestCase {
  id: string;
  name: string;
  description: string;
  interfaceName: string;
  inputMessage: string;
  expectedOutput: string;
  validationRules: ValidationRule[];
  tags: string[];
}

export interface ValidationRule {
  field: string;
  operator: 'equals' | 'contains' | 'exists' | 'notEmpty' | 'matches';
  expectedValue?: string;
  description: string;
}

export interface TestGeneratorRequest {
  interfaceSpec: {
    name: string;
    messageType: string;
    format: MessageFormat;
    sampleMessage?: string;
  };
  testScenarios: Array<'happy-path' | 'missing-required' | 'invalid-data' | 'edge-cases'>;
  count: number;
}

export interface TestGeneratorResponse {
  id: string;
  testCases: TestCase[];
  testSuite: string;
  format: string;
  generatedAt: string;
}

// =============================================================================
// Configuration Diff / Migration Tool Types
// =============================================================================

export interface ConfigFile {
  name: string;
  environment: 'dev' | 'test' | 'staging' | 'prod';
  content: string;
  type: 'xlt' | 'properties' | 'json' | 'xml' | 'tcl';
}

export interface ConfigDiff {
  field: string;
  sourceValue: string;
  targetValue: string;
  changeType: 'added' | 'removed' | 'modified';
  impact: 'low' | 'medium' | 'high';
}

export interface ConfigDiffRequest {
  sourceConfig: ConfigFile;
  targetConfig: ConfigFile;
  ignoreWhitespace: boolean;
  ignoreComments: boolean;
}

export interface ConfigDiffResponse {
  id: string;
  differences: ConfigDiff[];
  summary: {
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
  };
  migrationScript?: string;
  report: string;
  generatedAt: string;
}

// =============================================================================
// Change Request Tracker Types
// =============================================================================

export interface ChangeRequest {
  id: string;
  title: string;
  description: string;
  requestor: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'analysis' | 'approved' | 'in-progress' | 'testing' | 'deployed' | 'closed';
  affectedSystems: string[];
  affectedInterfaces: string[];
  estimatedEffort: string;
  targetDate?: string;
  notes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChangeRequestStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  recentlyUpdated: ChangeRequest[];
}

// =============================================================================
// HL7/FHIR Message Validator Types
// =============================================================================

export interface ValidationProfile {
  name: string;
  format: MessageFormat;
  rules: MessageValidationRule[];
}

export interface MessageValidationRule {
  id: string;
  field: string;
  rule: 'required' | 'format' | 'length' | 'value-set' | 'regex' | 'custom';
  parameters?: Record<string, any>;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface ValidatorRequest {
  message: string;
  format: MessageFormat;
  profile?: string;
  customRules?: MessageValidationRule[];
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  value?: string;
  rule: string;
}

export interface ValidatorResponse {
  id: string;
  isValid: boolean;
  issues: ValidationIssue[];
  score: number;
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
  parsedStructure?: object;
  generatedAt: string;
}

// =============================================================================
// HL7v2 Message Viewer/Parser Types
// =============================================================================

export interface HL7v2Segment {
  name: string;
  sequence: number;
  fields: HL7v2Field[];
  raw: string;
}

export interface HL7v2Field {
  position: number;
  name: string;
  value: string;
  components: HL7v2Component[];
  dataType?: string;
  maxLength?: number;
  required?: boolean;
}

export interface HL7v2Component {
  position: number;
  value: string;
  subcomponents: string[];
}

export interface HL7v2ParseRequest {
  message: string;
  version?: '2.3' | '2.4' | '2.5' | '2.5.1' | '2.6' | '2.7' | '2.8';
  includeFieldNames?: boolean;
  highlightErrors?: boolean;
}

export interface HL7v2ParseResponse {
  id: string;
  messageType: string;
  triggerEvent: string;
  version: string;
  sendingApp: string;
  sendingFacility: string;
  receivingApp: string;
  receivingFacility: string;
  timestamp: string;
  controlId: string;
  segments: HL7v2Segment[];
  segmentCount: number;
  errors: HL7v2ParseError[];
  raw: string;
  generatedAt: string;
}

export interface HL7v2ParseError {
  segment: string;
  field: number;
  component?: number;
  message: string;
  severity: 'error' | 'warning';
}

// =============================================================================
// Translation Table Generator Types
// =============================================================================

export interface TranslationTableEntry {
  key: string;
  value: string;
  description?: string;
  category?: string;
  active: boolean;
}

export interface TranslationTable {
  id: string;
  name: string;
  description: string;
  sourceSystem: string;
  targetSystem: string;
  entries: TranslationTableEntry[];
  metadata: {
    version: string;
    lastModified: string;
    author: string;
  };
}

export interface TranslationTableRequest {
  name: string;
  description?: string;
  sourceSystem: string;
  targetSystem: string;
  entries: Array<{
    key: string;
    value: string;
    description?: string;
    category?: string;
  }>;
  outputFormat: 'cloverleaf-xlt' | 'json' | 'csv' | 'xml' | 'properties';
  includeComments: boolean;
}

export interface TranslationTableResponse {
  id: string;
  table: TranslationTable;
  outputFile: {
    filename: string;
    content: string;
    format: string;
  };
  statistics: {
    totalEntries: number;
    categories: number;
    duplicateKeys: string[];
  };
  generatedAt: string;
}

// =============================================================================
// FHIR Resource Explorer Types
// =============================================================================

export type FHIRResourceType =
  | 'Patient'
  | 'Practitioner'
  | 'Organization'
  | 'Encounter'
  | 'Observation'
  | 'Condition'
  | 'Medication'
  | 'MedicationRequest'
  | 'DiagnosticReport'
  | 'Procedure'
  | 'AllergyIntolerance'
  | 'Immunization'
  | 'DocumentReference'
  | 'Bundle';

export interface FHIRReference {
  reference: string;
  display?: string;
  type?: string;
}

export interface FHIRResourceNode {
  path: string;
  name: string;
  value: any;
  dataType: string;
  children: FHIRResourceNode[];
  isArray: boolean;
  isReference: boolean;
  referenceTarget?: string;
}

export interface FHIRExploreRequest {
  resource: string;
  format: 'json' | 'xml';
  validateProfile?: string;
  resolveReferences?: boolean;
}

export interface FHIRExploreResponse {
  id: string;
  resourceType: FHIRResourceType;
  resourceId: string;
  version: string;
  lastUpdated?: string;
  tree: FHIRResourceNode;
  references: FHIRReference[];
  validation: {
    isValid: boolean;
    profile?: string;
    issues: ValidationIssue[];
  };
  metadata: {
    elementCount: number;
    referenceCount: number;
    extensionCount: number;
  };
  raw: string;
  generatedAt: string;
}

// =============================================================================
// Audit Log Analyzer Types
// =============================================================================

export type LogSource = 'cloverleaf' | 'mirth' | 'rhapsody' | 'generic' | 'syslog';

export interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  source: string;
  message: string;
  messageId?: string;
  interface?: string;
  details?: Record<string, any>;
}

export interface LogPattern {
  name: string;
  count: number;
  firstOccurrence: string;
  lastOccurrence: string;
  sampleMessages: string[];
  severity: 'info' | 'warning' | 'critical';
}

export interface LogAnalysisRequest {
  logs: string;
  source: LogSource;
  timeRange?: {
    start: string;
    end: string;
  };
  filterLevel?: Array<'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'>;
  filterInterface?: string;
  groupBy?: 'hour' | 'day' | 'interface' | 'error-type';
}

export interface LogAnalysisResponse {
  id: string;
  entries: LogEntry[];
  summary: {
    totalEntries: number;
    byLevel: Record<string, number>;
    byInterface: Record<string, number>;
    timeRange: {
      start: string;
      end: string;
    };
  };
  patterns: LogPattern[];
  errors: {
    count: number;
    topErrors: Array<{
      message: string;
      count: number;
      lastOccurrence: string;
    }>;
  };
  timeline: Array<{
    timestamp: string;
    count: number;
    errors: number;
  }>;
  report: string;
  generatedAt: string;
}

