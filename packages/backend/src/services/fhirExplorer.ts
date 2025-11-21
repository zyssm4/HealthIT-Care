import { v4 as uuidv4 } from 'uuid';
import {
  FHIRExploreRequest,
  FHIRExploreResponse,
  FHIRResourceNode,
  FHIRReference,
  FHIRResourceType,
  ValidationIssue,
} from '@healthit-care/shared';

export class FHIRExplorerService {
  explore(request: FHIRExploreRequest): FHIRExploreResponse {
    const { resource, format, validateProfile, resolveReferences = false } = request;

    let parsedResource: any;

    try {
      if (format === 'json') {
        parsedResource = JSON.parse(resource);
      } else {
        // Basic XML parsing - convert to JSON-like structure
        parsedResource = this.parseXmlToObject(resource);
      }
    } catch (error) {
      throw new Error(`Failed to parse ${format.toUpperCase()} resource: ${error}`);
    }

    const resourceType = parsedResource.resourceType as FHIRResourceType;
    if (!resourceType) {
      throw new Error('Invalid FHIR resource: missing resourceType');
    }

    // Build tree structure
    const tree = this.buildTree(parsedResource, '', resourceType);

    // Extract references
    const references = this.extractReferences(parsedResource);

    // Validate resource
    const validation = this.validateResource(parsedResource, validateProfile);

    // Calculate metadata
    const metadata = {
      elementCount: this.countElements(parsedResource),
      referenceCount: references.length,
      extensionCount: this.countExtensions(parsedResource),
    };

    return {
      id: uuidv4(),
      resourceType,
      resourceId: parsedResource.id || 'unknown',
      version: parsedResource.meta?.versionId || '1',
      lastUpdated: parsedResource.meta?.lastUpdated,
      tree,
      references,
      validation,
      metadata,
      raw: format === 'json' ? JSON.stringify(parsedResource, null, 2) : resource,
      generatedAt: new Date().toISOString(),
    };
  }

  private buildTree(obj: any, path: string, name: string): FHIRResourceNode {
    const isArray = Array.isArray(obj);
    const isReference = this.isReference(obj);

    const children: FHIRResourceNode[] = [];

    if (obj && typeof obj === 'object' && !isArray) {
      Object.keys(obj).forEach(key => {
        const childPath = path ? `${path}.${key}` : key;
        const childValue = obj[key];

        if (Array.isArray(childValue)) {
          childValue.forEach((item, index) => {
            children.push(this.buildTree(item, `${childPath}[${index}]`, `${key}[${index}]`));
          });
        } else if (childValue && typeof childValue === 'object') {
          children.push(this.buildTree(childValue, childPath, key));
        } else {
          children.push({
            path: childPath,
            name: key,
            value: childValue,
            dataType: this.getDataType(childValue),
            children: [],
            isArray: false,
            isReference: false,
          });
        }
      });
    } else if (isArray) {
      obj.forEach((item: any, index: number) => {
        children.push(this.buildTree(item, `${path}[${index}]`, `[${index}]`));
      });
    }

    return {
      path: path || name,
      name,
      value: this.isPrimitive(obj) ? obj : null,
      dataType: this.getDataType(obj),
      children,
      isArray,
      isReference,
      referenceTarget: isReference ? obj.reference : undefined,
    };
  }

  private extractReferences(obj: any, refs: FHIRReference[] = []): FHIRReference[] {
    if (!obj || typeof obj !== 'object') return refs;

    if (this.isReference(obj)) {
      refs.push({
        reference: obj.reference,
        display: obj.display,
        type: obj.type,
      });
    }

    if (Array.isArray(obj)) {
      obj.forEach(item => this.extractReferences(item, refs));
    } else {
      Object.values(obj).forEach(value => this.extractReferences(value, refs));
    }

    return refs;
  }

  private validateResource(resource: any, profile?: string): {
    isValid: boolean;
    profile?: string;
    issues: ValidationIssue[];
  } {
    const issues: ValidationIssue[] = [];

    // Basic validation rules
    if (!resource.resourceType) {
      issues.push({
        severity: 'error',
        field: 'resourceType',
        message: 'Missing required field: resourceType',
        rule: 'required',
      });
    }

    // Resource-specific validation
    switch (resource.resourceType) {
      case 'Patient':
        this.validatePatient(resource, issues);
        break;
      case 'Observation':
        this.validateObservation(resource, issues);
        break;
      case 'Encounter':
        this.validateEncounter(resource, issues);
        break;
    }

    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      profile,
      issues,
    };
  }

  private validatePatient(resource: any, issues: ValidationIssue[]) {
    if (!resource.name || resource.name.length === 0) {
      issues.push({
        severity: 'warning',
        field: 'name',
        message: 'Patient should have at least one name',
        rule: 'required',
      });
    }

    if (!resource.identifier || resource.identifier.length === 0) {
      issues.push({
        severity: 'warning',
        field: 'identifier',
        message: 'Patient should have at least one identifier',
        rule: 'required',
      });
    }

    if (resource.birthDate && !this.isValidDate(resource.birthDate)) {
      issues.push({
        severity: 'error',
        field: 'birthDate',
        message: 'Invalid date format for birthDate',
        value: resource.birthDate,
        rule: 'format',
      });
    }
  }

  private validateObservation(resource: any, issues: ValidationIssue[]) {
    if (!resource.status) {
      issues.push({
        severity: 'error',
        field: 'status',
        message: 'Missing required field: status',
        rule: 'required',
      });
    }

    if (!resource.code) {
      issues.push({
        severity: 'error',
        field: 'code',
        message: 'Missing required field: code',
        rule: 'required',
      });
    }
  }

  private validateEncounter(resource: any, issues: ValidationIssue[]) {
    if (!resource.status) {
      issues.push({
        severity: 'error',
        field: 'status',
        message: 'Missing required field: status',
        rule: 'required',
      });
    }

    if (!resource.class) {
      issues.push({
        severity: 'error',
        field: 'class',
        message: 'Missing required field: class',
        rule: 'required',
      });
    }
  }

  private isReference(obj: any): boolean {
    return obj && typeof obj === 'object' && 'reference' in obj;
  }

  private isPrimitive(value: any): boolean {
    return value === null || ['string', 'number', 'boolean'].includes(typeof value);
  }

  private getDataType(value: any): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (this.isReference(value)) return 'Reference';
    return typeof value;
  }

  private countElements(obj: any): number {
    if (!obj || typeof obj !== 'object') return 1;
    if (Array.isArray(obj)) {
      return obj.reduce((sum, item) => sum + this.countElements(item), 0);
    }
    return Object.values(obj).reduce((sum: number, value) => sum + this.countElements(value), 1);
  }

  private countExtensions(obj: any): number {
    if (!obj || typeof obj !== 'object') return 0;
    let count = 0;
    if (obj.extension) count += Array.isArray(obj.extension) ? obj.extension.length : 1;
    if (Array.isArray(obj)) {
      count += obj.reduce((sum, item) => sum + this.countExtensions(item), 0);
    } else {
      count += Object.values(obj).reduce((sum: number, value) => sum + this.countExtensions(value), 0);
    }
    return count;
  }

  private isValidDate(dateStr: string): boolean {
    const dateRegex = /^\d{4}(-\d{2}(-\d{2})?)?$/;
    return dateRegex.test(dateStr);
  }

  private parseXmlToObject(xml: string): any {
    // Basic XML to JSON conversion for demonstration
    // In production, use a proper XML parser
    const resourceTypeMatch = xml.match(/<(\w+)\s+xmlns/);
    if (!resourceTypeMatch) {
      throw new Error('Could not determine resource type from XML');
    }

    return {
      resourceType: resourceTypeMatch[1],
      _note: 'XML parsing simplified for demonstration',
    };
  }

  getSampleResource(): string {
    return JSON.stringify({
      resourceType: 'Patient',
      id: 'example',
      meta: {
        versionId: '1',
        lastUpdated: '2023-11-20T10:30:00Z',
      },
      identifier: [
        {
          use: 'official',
          system: 'http://hospital.org/patients',
          value: '12345',
        },
      ],
      active: true,
      name: [
        {
          use: 'official',
          family: 'Doe',
          given: ['John', 'Michael'],
        },
      ],
      telecom: [
        {
          system: 'phone',
          value: '555-123-4567',
          use: 'home',
        },
        {
          system: 'email',
          value: 'john.doe@email.com',
        },
      ],
      gender: 'male',
      birthDate: '1980-01-15',
      address: [
        {
          use: 'home',
          line: ['123 Main Street'],
          city: 'Anytown',
          state: 'CA',
          postalCode: '12345',
          country: 'USA',
        },
      ],
      contact: [
        {
          relationship: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v2-0131',
                  code: 'N',
                  display: 'Next-of-Kin',
                },
              ],
            },
          ],
          name: {
            family: 'Doe',
            given: ['Jane'],
          },
          telecom: [
            {
              system: 'phone',
              value: '555-987-6543',
            },
          ],
        },
      ],
      generalPractitioner: [
        {
          reference: 'Practitioner/789',
          display: 'Dr. Smith',
        },
      ],
    }, null, 2);
  }
}
