import {
  TestCase,
  ValidationRule,
  TestGeneratorRequest,
  TestGeneratorResponse,
  MessageFormat,
} from '@healthit-care/shared';
import { v4 as uuidv4 } from 'uuid';

export async function generateTestCases(request: TestGeneratorRequest): Promise<TestGeneratorResponse> {
  const id = uuidv4();
  const testCases: TestCase[] = [];

  const scenarioGenerators: Record<string, () => TestCase[]> = {
    'happy-path': () => generateHappyPathTests(request),
    'missing-required': () => generateMissingRequiredTests(request),
    'invalid-data': () => generateInvalidDataTests(request),
    'edge-cases': () => generateEdgeCaseTests(request),
  };

  for (const scenario of request.testScenarios) {
    const generator = scenarioGenerators[scenario];
    if (generator) {
      const tests = generator();
      testCases.push(...tests.slice(0, Math.ceil(request.count / request.testScenarios.length)));
    }
  }

  // Ensure we have exactly the requested count
  while (testCases.length < request.count && testCases.length > 0) {
    const template = testCases[testCases.length % testCases.length];
    testCases.push({
      ...template,
      id: uuidv4(),
      name: `${template.name} (variation ${testCases.length})`,
    });
  }

  const testSuite = generateTestSuite(testCases, request);

  return {
    id,
    testCases: testCases.slice(0, request.count),
    testSuite,
    format: request.interfaceSpec.format,
    generatedAt: new Date().toISOString(),
  };
}

function generateHappyPathTests(request: TestGeneratorRequest): TestCase[] {
  const tests: TestCase[] = [];
  const { interfaceSpec } = request;

  if (interfaceSpec.format === 'hl7v2') {
    tests.push({
      id: uuidv4(),
      name: `${interfaceSpec.name} - Valid ADT A01 Message`,
      description: 'Test successful processing of a valid ADT A01 admission message',
      interfaceName: interfaceSpec.name,
      inputMessage: interfaceSpec.sampleMessage || generateSampleHL7v2('ADT^A01'),
      expectedOutput: 'ACK^A01',
      validationRules: [
        {
          field: 'MSA.1',
          operator: 'equals',
          expectedValue: 'AA',
          description: 'Acknowledgment code should be AA (Application Accept)',
        },
        {
          field: 'MSA.2',
          operator: 'exists',
          description: 'Message control ID should be present',
        },
      ],
      tags: ['happy-path', 'adt', 'admission'],
    });

    tests.push({
      id: uuidv4(),
      name: `${interfaceSpec.name} - Valid ORM O01 Message`,
      description: 'Test successful processing of a valid ORM O01 order message',
      interfaceName: interfaceSpec.name,
      inputMessage: generateSampleHL7v2('ORM^O01'),
      expectedOutput: 'ORR^O02',
      validationRules: [
        {
          field: 'MSA.1',
          operator: 'equals',
          expectedValue: 'AA',
          description: 'Acknowledgment code should be AA',
        },
        {
          field: 'ORC.1',
          operator: 'equals',
          expectedValue: 'OK',
          description: 'Order control should be OK',
        },
      ],
      tags: ['happy-path', 'orm', 'order'],
    });
  } else if (interfaceSpec.format === 'fhir-json') {
    tests.push({
      id: uuidv4(),
      name: `${interfaceSpec.name} - Valid Patient Resource`,
      description: 'Test successful creation of a valid Patient resource',
      interfaceName: interfaceSpec.name,
      inputMessage: interfaceSpec.sampleMessage || generateSampleFHIR('Patient'),
      expectedOutput: '201 Created',
      validationRules: [
        {
          field: 'resourceType',
          operator: 'equals',
          expectedValue: 'Patient',
          description: 'Resource type should be Patient',
        },
        {
          field: 'id',
          operator: 'exists',
          description: 'Resource ID should be assigned',
        },
      ],
      tags: ['happy-path', 'fhir', 'patient'],
    });
  }

  return tests;
}

function generateMissingRequiredTests(request: TestGeneratorRequest): TestCase[] {
  const tests: TestCase[] = [];
  const { interfaceSpec } = request;

  if (interfaceSpec.format === 'hl7v2') {
    tests.push({
      id: uuidv4(),
      name: `${interfaceSpec.name} - Missing PID Segment`,
      description: 'Test error handling when required PID segment is missing',
      interfaceName: interfaceSpec.name,
      inputMessage: `MSH|^~\\&|SENDER|FACILITY|RECEIVER|DEST|${getCurrentTimestamp()}||ADT^A01|MSG${Date.now()}|P|2.5.1\nEVN|A01|${getCurrentTimestamp()}`,
      expectedOutput: 'ACK with AE',
      validationRules: [
        {
          field: 'MSA.1',
          operator: 'equals',
          expectedValue: 'AE',
          description: 'Acknowledgment code should be AE (Application Error)',
        },
        {
          field: 'ERR.1',
          operator: 'exists',
          description: 'Error segment should be present',
        },
      ],
      tags: ['negative', 'missing-required', 'pid'],
    });

    tests.push({
      id: uuidv4(),
      name: `${interfaceSpec.name} - Missing Patient ID`,
      description: 'Test error handling when patient identifier is empty',
      interfaceName: interfaceSpec.name,
      inputMessage: `MSH|^~\\&|SENDER|FACILITY|RECEIVER|DEST|${getCurrentTimestamp()}||ADT^A01|MSG${Date.now()}|P|2.5.1\nPID|||^^^MRN||Doe^John||19800115|M`,
      expectedOutput: 'ACK with AE',
      validationRules: [
        {
          field: 'MSA.1',
          operator: 'equals',
          expectedValue: 'AE',
          description: 'Should reject message with empty patient ID',
        },
      ],
      tags: ['negative', 'missing-required', 'patient-id'],
    });
  } else if (interfaceSpec.format === 'fhir-json') {
    tests.push({
      id: uuidv4(),
      name: `${interfaceSpec.name} - Missing resourceType`,
      description: 'Test error handling when resourceType is missing',
      interfaceName: interfaceSpec.name,
      inputMessage: JSON.stringify({
        id: 'test-patient',
        name: [{ family: 'Doe', given: ['John'] }],
      }),
      expectedOutput: '400 Bad Request',
      validationRules: [
        {
          field: 'issue[0].severity',
          operator: 'equals',
          expectedValue: 'error',
          description: 'Should return error severity',
        },
      ],
      tags: ['negative', 'missing-required', 'resourceType'],
    });
  }

  return tests;
}

function generateInvalidDataTests(request: TestGeneratorRequest): TestCase[] {
  const tests: TestCase[] = [];
  const { interfaceSpec } = request;

  if (interfaceSpec.format === 'hl7v2') {
    tests.push({
      id: uuidv4(),
      name: `${interfaceSpec.name} - Invalid Date Format`,
      description: 'Test error handling for malformed date in DOB field',
      interfaceName: interfaceSpec.name,
      inputMessage: `MSH|^~\\&|SENDER|FACILITY|RECEIVER|DEST|${getCurrentTimestamp()}||ADT^A01|MSG${Date.now()}|P|2.5.1\nPID|||12345^^^MRN||Doe^John||INVALID-DATE|M`,
      expectedOutput: 'ACK with AE',
      validationRules: [
        {
          field: 'MSA.1',
          operator: 'equals',
          expectedValue: 'AE',
          description: 'Should reject invalid date format',
        },
      ],
      tags: ['negative', 'invalid-data', 'date-format'],
    });

    tests.push({
      id: uuidv4(),
      name: `${interfaceSpec.name} - Invalid Gender Code`,
      description: 'Test handling of non-standard gender code',
      interfaceName: interfaceSpec.name,
      inputMessage: `MSH|^~\\&|SENDER|FACILITY|RECEIVER|DEST|${getCurrentTimestamp()}||ADT^A01|MSG${Date.now()}|P|2.5.1\nPID|||12345^^^MRN||Doe^John||19800115|X`,
      expectedOutput: 'ACK with warning or error',
      validationRules: [
        {
          field: 'MSA.1',
          operator: 'matches',
          expectedValue: '^(AE|AA)$',
          description: 'May accept with warning or reject',
        },
      ],
      tags: ['negative', 'invalid-data', 'gender'],
    });
  }

  return tests;
}

function generateEdgeCaseTests(request: TestGeneratorRequest): TestCase[] {
  const tests: TestCase[] = [];
  const { interfaceSpec } = request;

  tests.push({
    id: uuidv4(),
    name: `${interfaceSpec.name} - Maximum Field Length`,
    description: 'Test handling of fields at maximum allowed length',
    interfaceName: interfaceSpec.name,
    inputMessage: interfaceSpec.format === 'hl7v2'
      ? `MSH|^~\\&|SENDER|FACILITY|RECEIVER|DEST|${getCurrentTimestamp()}||ADT^A01|MSG${Date.now()}|P|2.5.1\nPID|||12345^^^MRN||${'A'.repeat(200)}^John||19800115|M`
      : JSON.stringify({
          resourceType: 'Patient',
          name: [{ family: 'A'.repeat(200), given: ['John'] }],
        }),
    expectedOutput: 'Processed or truncated',
    validationRules: [
      {
        field: interfaceSpec.format === 'hl7v2' ? 'MSA.1' : 'resourceType',
        operator: 'exists',
        description: 'Should process or handle gracefully',
      },
    ],
    tags: ['edge-case', 'max-length'],
  });

  tests.push({
    id: uuidv4(),
    name: `${interfaceSpec.name} - Special Characters`,
    description: 'Test handling of special characters in text fields',
    interfaceName: interfaceSpec.name,
    inputMessage: interfaceSpec.format === 'hl7v2'
      ? `MSH|^~\\&|SENDER|FACILITY|RECEIVER|DEST|${getCurrentTimestamp()}||ADT^A01|MSG${Date.now()}|P|2.5.1\nPID|||12345^^^MRN||O'Brien^Mary-Jane||19800115|F`
      : JSON.stringify({
          resourceType: 'Patient',
          name: [{ family: "O'Brien", given: ['Mary-Jane'] }],
        }),
    expectedOutput: 'Processed correctly',
    validationRules: [
      {
        field: interfaceSpec.format === 'hl7v2' ? 'MSA.1' : 'resourceType',
        operator: 'exists',
        description: 'Should handle special characters',
      },
    ],
    tags: ['edge-case', 'special-characters'],
  });

  return tests;
}

function generateSampleHL7v2(messageType: string): string {
  const timestamp = getCurrentTimestamp();
  const msgId = `MSG${Date.now()}`;

  if (messageType === 'ADT^A01') {
    return `MSH|^~\\&|SENDER|FACILITY|RECEIVER|DEST|${timestamp}||ADT^A01|${msgId}|P|2.5.1
EVN|A01|${timestamp}
PID|||12345^^^MRN||Doe^John^A||19800115|M|||123 Main St^^City^ST^12345||555-123-4567
PV1||I|ICU^101^A||||1234^Smith^Jane|||MED||||||||${msgId}|||||||||||||||||||||||||${timestamp}`;
  }

  if (messageType === 'ORM^O01') {
    return `MSH|^~\\&|SENDER|FACILITY|RECEIVER|DEST|${timestamp}||ORM^O01|${msgId}|P|2.5.1
PID|||12345^^^MRN||Doe^John^A||19800115|M
ORC|NW|${msgId}||||||${timestamp}|||1234^Smith^Jane
OBR|1|${msgId}||80053^Comprehensive Metabolic Panel^CPT|||${timestamp}`;
  }

  return `MSH|^~\\&|SENDER|FACILITY|RECEIVER|DEST|${timestamp}||${messageType}|${msgId}|P|2.5.1`;
}

function generateSampleFHIR(resourceType: string): string {
  if (resourceType === 'Patient') {
    return JSON.stringify({
      resourceType: 'Patient',
      identifier: [
        {
          system: 'http://hospital.org/mrn',
          value: '12345',
        },
      ],
      name: [
        {
          family: 'Doe',
          given: ['John', 'A'],
        },
      ],
      gender: 'male',
      birthDate: '1980-01-15',
      address: [
        {
          line: ['123 Main St'],
          city: 'City',
          state: 'ST',
          postalCode: '12345',
        },
      ],
    }, null, 2);
  }

  return JSON.stringify({ resourceType }, null, 2);
}

function generateTestSuite(testCases: TestCase[], request: TestGeneratorRequest): string {
  let suite = `# Test Suite: ${request.interfaceSpec.name}\n`;
  suite += `# Generated: ${new Date().toISOString()}\n`;
  suite += `# Format: ${request.interfaceSpec.format}\n`;
  suite += `# Total Tests: ${testCases.length}\n\n`;

  suite += `## Test Scenarios\n`;
  request.testScenarios.forEach(scenario => {
    suite += `- ${scenario}\n`;
  });
  suite += `\n---\n\n`;

  testCases.forEach((tc, idx) => {
    suite += `## Test ${idx + 1}: ${tc.name}\n\n`;
    suite += `**Description:** ${tc.description}\n\n`;
    suite += `**Tags:** ${tc.tags.join(', ')}\n\n`;
    suite += `### Input Message\n\`\`\`\n${tc.inputMessage}\n\`\`\`\n\n`;
    suite += `### Expected Output\n${tc.expectedOutput}\n\n`;
    suite += `### Validation Rules\n`;
    tc.validationRules.forEach(rule => {
      suite += `- **${rule.field}** ${rule.operator}${rule.expectedValue ? ` "${rule.expectedValue}"` : ''}: ${rule.description}\n`;
    });
    suite += `\n---\n\n`;
  });

  return suite;
}

function getCurrentTimestamp(): string {
  return new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
}
