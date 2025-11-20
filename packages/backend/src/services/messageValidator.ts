import {
  MessageFormat,
  ValidatorRequest,
  ValidatorResponse,
  ValidationIssue,
  MessageValidationRule,
} from '@healthit-care/shared';
import { v4 as uuidv4 } from 'uuid';

export async function validateMessage(request: ValidatorRequest): Promise<ValidatorResponse> {
  const id = uuidv4();
  const issues: ValidationIssue[] = [];
  let parsedStructure: object | undefined;

  // Parse and validate based on format
  if (request.format === 'hl7v2') {
    const result = validateHL7v2(request.message, request.customRules);
    issues.push(...result.issues);
    parsedStructure = result.parsed;
  } else if (request.format === 'fhir-json') {
    const result = validateFHIRJson(request.message, request.customRules);
    issues.push(...result.issues);
    parsedStructure = result.parsed;
  } else if (request.format === 'fhir-xml') {
    const result = validateFHIRXml(request.message);
    issues.push(...result.issues);
  } else if (request.format === 'cda') {
    const result = validateCDA(request.message);
    issues.push(...result.issues);
  } else {
    issues.push({
      severity: 'warning',
      field: 'format',
      message: `Limited validation available for ${request.format} format`,
      rule: 'format-support',
    });
  }

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  // Calculate score (100 - penalties)
  const score = Math.max(0, 100 - (errorCount * 20) - (warningCount * 5) - (infoCount * 1));

  return {
    id,
    isValid: errorCount === 0,
    issues,
    score,
    summary: {
      errors: errorCount,
      warnings: warningCount,
      info: infoCount,
    },
    parsedStructure,
    generatedAt: new Date().toISOString(),
  };
}

function validateHL7v2(
  message: string,
  customRules?: MessageValidationRule[]
): { issues: ValidationIssue[]; parsed: object } {
  const issues: ValidationIssue[] = [];
  const parsed: Record<string, any> = { segments: [] };

  const lines = message.split(/\r?\n/).filter(line => line.trim());

  if (lines.length === 0) {
    issues.push({
      severity: 'error',
      field: 'message',
      message: 'Message is empty',
      rule: 'required',
    });
    return { issues, parsed };
  }

  // Check for MSH segment
  if (!lines[0].startsWith('MSH')) {
    issues.push({
      severity: 'error',
      field: 'MSH',
      message: 'Message must start with MSH segment',
      rule: 'required',
    });
    return { issues, parsed };
  }

  // Parse MSH segment
  const mshLine = lines[0];
  const fieldSeparator = mshLine[3] || '|';
  const mshFields = mshLine.split(fieldSeparator);

  // Validate MSH fields
  if (mshFields.length < 12) {
    issues.push({
      severity: 'error',
      field: 'MSH',
      message: `MSH segment has insufficient fields (${mshFields.length}, expected at least 12)`,
      value: mshLine,
      rule: 'required',
    });
  }

  // Check encoding characters (MSH-2)
  const encodingChars = mshFields[1];
  if (!encodingChars || encodingChars.length < 4) {
    issues.push({
      severity: 'error',
      field: 'MSH.2',
      message: 'Invalid encoding characters',
      value: encodingChars,
      rule: 'format',
    });
  }

  // Check sending application (MSH-3)
  if (!mshFields[2]) {
    issues.push({
      severity: 'warning',
      field: 'MSH.3',
      message: 'Sending application is empty',
      rule: 'required',
    });
  }

  // Check message type (MSH-9)
  const messageType = mshFields[8];
  if (!messageType) {
    issues.push({
      severity: 'error',
      field: 'MSH.9',
      message: 'Message type is required',
      rule: 'required',
    });
  } else {
    const typeParts = messageType.split('^');
    if (typeParts.length < 2) {
      issues.push({
        severity: 'warning',
        field: 'MSH.9',
        message: 'Message type should include trigger event (e.g., ADT^A01)',
        value: messageType,
        rule: 'format',
      });
    }
    parsed.messageType = messageType;
  }

  // Check control ID (MSH-10)
  if (!mshFields[9]) {
    issues.push({
      severity: 'error',
      field: 'MSH.10',
      message: 'Message control ID is required',
      rule: 'required',
    });
  } else {
    parsed.controlId = mshFields[9];
  }

  // Check processing ID (MSH-11)
  const processingId = mshFields[10];
  if (!processingId) {
    issues.push({
      severity: 'warning',
      field: 'MSH.11',
      message: 'Processing ID is missing',
      rule: 'required',
    });
  } else if (!['P', 'D', 'T'].includes(processingId)) {
    issues.push({
      severity: 'warning',
      field: 'MSH.11',
      message: `Unexpected processing ID: ${processingId} (expected P, D, or T)`,
      value: processingId,
      rule: 'value-set',
    });
  }

  // Check version (MSH-12)
  const version = mshFields[11];
  if (!version) {
    issues.push({
      severity: 'warning',
      field: 'MSH.12',
      message: 'HL7 version is missing',
      rule: 'required',
    });
  } else {
    parsed.version = version;
  }

  // Parse and validate other segments
  const segmentCounts: Record<string, number> = { MSH: 1 };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const segmentName = line.substring(0, 3);
    segmentCounts[segmentName] = (segmentCounts[segmentName] || 0) + 1;

    const fields = line.split(fieldSeparator);
    parsed.segments.push({
      name: segmentName,
      fields: fields.slice(1),
    });

    // Segment-specific validation
    if (segmentName === 'PID') {
      validatePIDSegment(fields, issues);
    } else if (segmentName === 'PV1') {
      validatePV1Segment(fields, issues);
    } else if (segmentName === 'OBR') {
      validateOBRSegment(fields, issues);
    }
  }

  // Check for common required segments based on message type
  if (messageType?.startsWith('ADT')) {
    if (!segmentCounts['PID']) {
      issues.push({
        severity: 'error',
        field: 'PID',
        message: 'PID segment is required for ADT messages',
        rule: 'required',
      });
    }
    if (!segmentCounts['PV1']) {
      issues.push({
        severity: 'warning',
        field: 'PV1',
        message: 'PV1 segment is typically required for ADT messages',
        rule: 'required',
      });
    }
  }

  // Apply custom rules
  if (customRules) {
    for (const rule of customRules) {
      const customIssue = applyCustomRule(message, rule, fieldSeparator);
      if (customIssue) {
        issues.push(customIssue);
      }
    }
  }

  return { issues, parsed };
}

function validatePIDSegment(fields: string[], issues: ValidationIssue[]): void {
  // PID-3: Patient Identifier List
  if (!fields[3]) {
    issues.push({
      severity: 'error',
      field: 'PID.3',
      message: 'Patient identifier is required',
      rule: 'required',
    });
  }

  // PID-5: Patient Name
  if (!fields[5]) {
    issues.push({
      severity: 'warning',
      field: 'PID.5',
      message: 'Patient name is missing',
      rule: 'required',
    });
  }

  // PID-7: Date of Birth
  if (fields[7]) {
    if (!/^\d{8}(\d{6})?$/.test(fields[7])) {
      issues.push({
        severity: 'warning',
        field: 'PID.7',
        message: 'Date of birth format may be invalid (expected YYYYMMDD)',
        value: fields[7],
        rule: 'format',
      });
    }
  }

  // PID-8: Sex
  if (fields[8] && !['M', 'F', 'O', 'U', 'A', 'N'].includes(fields[8])) {
    issues.push({
      severity: 'warning',
      field: 'PID.8',
      message: `Non-standard sex code: ${fields[8]}`,
      value: fields[8],
      rule: 'value-set',
    });
  }
}

function validatePV1Segment(fields: string[], issues: ValidationIssue[]): void {
  // PV1-2: Patient Class
  if (!fields[2]) {
    issues.push({
      severity: 'warning',
      field: 'PV1.2',
      message: 'Patient class is missing',
      rule: 'required',
    });
  } else if (!['I', 'O', 'E', 'P', 'R', 'B'].includes(fields[2])) {
    issues.push({
      severity: 'info',
      field: 'PV1.2',
      message: `Non-standard patient class: ${fields[2]}`,
      value: fields[2],
      rule: 'value-set',
    });
  }
}

function validateOBRSegment(fields: string[], issues: ValidationIssue[]): void {
  // OBR-4: Universal Service Identifier
  if (!fields[4]) {
    issues.push({
      severity: 'error',
      field: 'OBR.4',
      message: 'Universal service identifier is required',
      rule: 'required',
    });
  }
}

function applyCustomRule(
  message: string,
  rule: MessageValidationRule,
  fieldSeparator: string
): ValidationIssue | null {
  // Extract field value
  const fieldPath = rule.field.split('.');
  const segmentName = fieldPath[0];
  const fieldIndex = parseInt(fieldPath[1]) || 0;

  const lines = message.split(/\r?\n/);
  const segmentLine = lines.find(l => l.startsWith(segmentName));

  if (!segmentLine) {
    if (rule.rule === 'required') {
      return {
        severity: rule.severity,
        field: rule.field,
        message: rule.message,
        rule: rule.rule,
      };
    }
    return null;
  }

  const fields = segmentLine.split(fieldSeparator);
  const value = fields[fieldIndex] || '';

  switch (rule.rule) {
    case 'required':
      if (!value) {
        return {
          severity: rule.severity,
          field: rule.field,
          message: rule.message,
          value,
          rule: rule.rule,
        };
      }
      break;
    case 'regex':
      const pattern = new RegExp(rule.parameters?.pattern || '');
      if (!pattern.test(value)) {
        return {
          severity: rule.severity,
          field: rule.field,
          message: rule.message,
          value,
          rule: rule.rule,
        };
      }
      break;
    case 'length':
      const maxLength = rule.parameters?.max || 0;
      if (value.length > maxLength) {
        return {
          severity: rule.severity,
          field: rule.field,
          message: rule.message,
          value,
          rule: rule.rule,
        };
      }
      break;
  }

  return null;
}

function validateFHIRJson(
  message: string,
  customRules?: MessageValidationRule[]
): { issues: ValidationIssue[]; parsed: object } {
  const issues: ValidationIssue[] = [];
  let parsed: any = {};

  try {
    parsed = JSON.parse(message);
  } catch (e) {
    issues.push({
      severity: 'error',
      field: 'json',
      message: `Invalid JSON: ${(e as Error).message}`,
      rule: 'format',
    });
    return { issues, parsed };
  }

  // Check resourceType
  if (!parsed.resourceType) {
    issues.push({
      severity: 'error',
      field: 'resourceType',
      message: 'FHIR resources must have a resourceType',
      rule: 'required',
    });
  }

  // Resource-specific validation
  if (parsed.resourceType === 'Patient') {
    validateFHIRPatient(parsed, issues);
  } else if (parsed.resourceType === 'Observation') {
    validateFHIRObservation(parsed, issues);
  } else if (parsed.resourceType === 'Bundle') {
    validateFHIRBundle(parsed, issues);
  }

  // Check for id
  if (!parsed.id && parsed.resourceType !== 'Bundle') {
    issues.push({
      severity: 'info',
      field: 'id',
      message: 'Resource has no id (will be assigned on creation)',
      rule: 'required',
    });
  }

  // Check meta
  if (!parsed.meta) {
    issues.push({
      severity: 'info',
      field: 'meta',
      message: 'Resource has no meta element',
      rule: 'required',
    });
  }

  return { issues, parsed };
}

function validateFHIRPatient(resource: any, issues: ValidationIssue[]): void {
  // Check identifier
  if (!resource.identifier || resource.identifier.length === 0) {
    issues.push({
      severity: 'warning',
      field: 'identifier',
      message: 'Patient should have at least one identifier',
      rule: 'required',
    });
  }

  // Check name
  if (!resource.name || resource.name.length === 0) {
    issues.push({
      severity: 'warning',
      field: 'name',
      message: 'Patient should have at least one name',
      rule: 'required',
    });
  }

  // Check gender
  if (resource.gender && !['male', 'female', 'other', 'unknown'].includes(resource.gender)) {
    issues.push({
      severity: 'error',
      field: 'gender',
      message: `Invalid gender value: ${resource.gender}`,
      value: resource.gender,
      rule: 'value-set',
    });
  }

  // Check birthDate format
  if (resource.birthDate && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(resource.birthDate)) {
    issues.push({
      severity: 'error',
      field: 'birthDate',
      message: 'Invalid birthDate format (expected YYYY, YYYY-MM, or YYYY-MM-DD)',
      value: resource.birthDate,
      rule: 'format',
    });
  }
}

function validateFHIRObservation(resource: any, issues: ValidationIssue[]): void {
  // Check status
  if (!resource.status) {
    issues.push({
      severity: 'error',
      field: 'status',
      message: 'Observation status is required',
      rule: 'required',
    });
  }

  // Check code
  if (!resource.code) {
    issues.push({
      severity: 'error',
      field: 'code',
      message: 'Observation code is required',
      rule: 'required',
    });
  }

  // Check subject
  if (!resource.subject) {
    issues.push({
      severity: 'warning',
      field: 'subject',
      message: 'Observation should have a subject reference',
      rule: 'required',
    });
  }
}

function validateFHIRBundle(resource: any, issues: ValidationIssue[]): void {
  // Check type
  if (!resource.type) {
    issues.push({
      severity: 'error',
      field: 'type',
      message: 'Bundle type is required',
      rule: 'required',
    });
  }

  // Check entries
  if (resource.entry) {
    resource.entry.forEach((entry: any, index: number) => {
      if (!entry.resource) {
        issues.push({
          severity: 'warning',
          field: `entry[${index}].resource`,
          message: 'Bundle entry should have a resource',
          rule: 'required',
        });
      }
    });
  }
}

function validateFHIRXml(message: string): { issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];

  // Basic XML validation
  if (!message.trim().startsWith('<')) {
    issues.push({
      severity: 'error',
      field: 'xml',
      message: 'Message does not appear to be valid XML',
      rule: 'format',
    });
    return { issues };
  }

  // Check for FHIR namespace
  if (!message.includes('http://hl7.org/fhir')) {
    issues.push({
      severity: 'warning',
      field: 'namespace',
      message: 'FHIR namespace not found',
      rule: 'required',
    });
  }

  // Check for resourceType
  const resourceTypeMatch = message.match(/<(\w+)\s+xmlns/);
  if (!resourceTypeMatch) {
    issues.push({
      severity: 'error',
      field: 'resourceType',
      message: 'Could not determine resource type from XML',
      rule: 'required',
    });
  }

  return { issues };
}

function validateCDA(message: string): { issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];

  // Check for CDA document element
  if (!message.includes('ClinicalDocument')) {
    issues.push({
      severity: 'error',
      field: 'ClinicalDocument',
      message: 'CDA document must have ClinicalDocument root element',
      rule: 'required',
    });
  }

  // Check for required header elements
  const requiredElements = ['typeId', 'id', 'effectiveTime', 'recordTarget'];
  for (const element of requiredElements) {
    if (!message.includes(`<${element}`)) {
      issues.push({
        severity: 'error',
        field: element,
        message: `Required CDA header element missing: ${element}`,
        rule: 'required',
      });
    }
  }

  return { issues };
}

export function getValidationProfiles(): { name: string; description: string; format: MessageFormat }[] {
  return [
    { name: 'HL7v2 Basic', description: 'Basic HL7 v2.x message validation', format: 'hl7v2' },
    { name: 'FHIR R4 Core', description: 'FHIR R4 core resource validation', format: 'fhir-json' },
    { name: 'US Core', description: 'US Core Implementation Guide validation', format: 'fhir-json' },
    { name: 'CDA Basic', description: 'Basic CDA document validation', format: 'cda' },
  ];
}
