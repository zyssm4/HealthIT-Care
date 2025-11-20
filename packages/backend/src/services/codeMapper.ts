import {
  CodeSystem,
  CodeMapping,
  CodeMapperRequest,
  CodeMapperResponse,
} from '@healthit-care/shared';
import { v4 as uuidv4 } from 'uuid';

// Simulated code mappings database
const CODE_MAPPINGS: Record<string, CodeMapping[]> = {
  'ICD10-SNOMED': [
    {
      sourceCode: 'E11.9',
      sourceSystem: 'ICD10',
      sourceDisplay: 'Type 2 diabetes mellitus without complications',
      targetCode: '44054006',
      targetSystem: 'SNOMED',
      targetDisplay: 'Diabetes mellitus type 2',
      equivalence: 'equivalent',
    },
    {
      sourceCode: 'I10',
      sourceSystem: 'ICD10',
      sourceDisplay: 'Essential (primary) hypertension',
      targetCode: '59621000',
      targetSystem: 'SNOMED',
      targetDisplay: 'Essential hypertension',
      equivalence: 'equivalent',
    },
    {
      sourceCode: 'J06.9',
      sourceSystem: 'ICD10',
      sourceDisplay: 'Acute upper respiratory infection, unspecified',
      targetCode: '54150009',
      targetSystem: 'SNOMED',
      targetDisplay: 'Upper respiratory infection',
      equivalence: 'equivalent',
    },
    {
      sourceCode: 'K21.0',
      sourceSystem: 'ICD10',
      sourceDisplay: 'Gastro-esophageal reflux disease with esophagitis',
      targetCode: '235595009',
      targetSystem: 'SNOMED',
      targetDisplay: 'Gastroesophageal reflux disease with esophagitis',
      equivalence: 'equivalent',
    },
  ],
  'SNOMED-ICD10': [
    {
      sourceCode: '44054006',
      sourceSystem: 'SNOMED',
      sourceDisplay: 'Diabetes mellitus type 2',
      targetCode: 'E11.9',
      targetSystem: 'ICD10',
      targetDisplay: 'Type 2 diabetes mellitus without complications',
      equivalence: 'wider',
      notes: 'SNOMED concept maps to broader ICD-10 category',
    },
  ],
  'LOINC-SNOMED': [
    {
      sourceCode: '2339-0',
      sourceSystem: 'LOINC',
      sourceDisplay: 'Glucose [Mass/volume] in Blood',
      targetCode: '33747003',
      targetSystem: 'SNOMED',
      targetDisplay: 'Blood glucose measurement',
      equivalence: 'equivalent',
    },
    {
      sourceCode: '718-7',
      sourceSystem: 'LOINC',
      sourceDisplay: 'Hemoglobin [Mass/volume] in Blood',
      targetCode: '104141003',
      targetSystem: 'SNOMED',
      targetDisplay: 'Hemoglobin measurement',
      equivalence: 'equivalent',
    },
  ],
};

export async function mapCodes(request: CodeMapperRequest): Promise<CodeMapperResponse> {
  const id = uuidv4();
  const mappings: CodeMapping[] = [];
  const unmappedCodes: string[] = [];

  for (const sourceCode of request.sourceCodes) {
    const mapping = findMapping(sourceCode.code, sourceCode.system, request.targetSystem);
    if (mapping) {
      mappings.push({
        ...mapping,
        sourceDisplay: sourceCode.display || mapping.sourceDisplay,
      });
    } else {
      unmappedCodes.push(sourceCode.code);
      // Add placeholder for unmapped codes
      mappings.push({
        sourceCode: sourceCode.code,
        sourceSystem: sourceCode.system,
        sourceDisplay: sourceCode.display || sourceCode.code,
        targetCode: '',
        targetSystem: request.targetSystem,
        targetDisplay: 'No mapping found',
        equivalence: 'unmatched',
        notes: 'Manual review required',
      });
    }
  }

  const outputFile = generateOutputFile(mappings, request.outputFormat);

  return {
    id,
    mappings,
    unmappedCodes,
    outputFile,
    statistics: {
      total: request.sourceCodes.length,
      mapped: mappings.filter(m => m.equivalence !== 'unmatched').length,
      unmapped: unmappedCodes.length,
      accuracy: request.sourceCodes.length > 0
        ? Math.round((mappings.filter(m => m.equivalence !== 'unmatched').length / request.sourceCodes.length) * 100)
        : 0,
    },
    generatedAt: new Date().toISOString(),
  };
}

function findMapping(code: string, sourceSystem: CodeSystem, targetSystem: CodeSystem): CodeMapping | null {
  const key = `${sourceSystem}-${targetSystem}`;
  const mappings = CODE_MAPPINGS[key];

  if (mappings) {
    return mappings.find(m => m.sourceCode === code) || null;
  }

  return null;
}

function generateOutputFile(mappings: CodeMapping[], format: string): string {
  if (format === 'csv') {
    let csv = 'Source Code,Source System,Source Display,Target Code,Target System,Target Display,Equivalence,Notes\n';
    mappings.forEach(m => {
      csv += `"${m.sourceCode}","${m.sourceSystem}","${m.sourceDisplay}","${m.targetCode}","${m.targetSystem}","${m.targetDisplay}","${m.equivalence}","${m.notes || ''}"\n`;
    });
    return csv;
  }

  if (format === 'cloverleaf-table') {
    let tcl = `# Cloverleaf Translation Table\n`;
    tcl += `# Generated: ${new Date().toISOString()}\n`;
    tcl += `# Format: source_code|target_code|equivalence\n\n`;
    tcl += `proc xlateInit {} {\n`;
    tcl += `    global xlateTable\n`;
    tcl += `    array set xlateTable {\n`;
    mappings.forEach(m => {
      if (m.equivalence !== 'unmatched') {
        tcl += `        "${m.sourceCode}" "${m.targetCode}"\n`;
      }
    });
    tcl += `    }\n`;
    tcl += `}\n\n`;
    tcl += `proc xlateCode {code} {\n`;
    tcl += `    global xlateTable\n`;
    tcl += `    if {[info exists xlateTable($code)]} {\n`;
    tcl += `        return $xlateTable($code)\n`;
    tcl += `    }\n`;
    tcl += `    return $code\n`;
    tcl += `}\n`;
    return tcl;
  }

  // JSON format
  return JSON.stringify(mappings, null, 2);
}

export function getSupportedCodeSystems(): { system: CodeSystem; name: string; description: string }[] {
  return [
    { system: 'ICD10', name: 'ICD-10', description: 'International Classification of Diseases, 10th Revision' },
    { system: 'ICD9', name: 'ICD-9', description: 'International Classification of Diseases, 9th Revision' },
    { system: 'SNOMED', name: 'SNOMED CT', description: 'Systematized Nomenclature of Medicine Clinical Terms' },
    { system: 'LOINC', name: 'LOINC', description: 'Logical Observation Identifiers Names and Codes' },
    { system: 'CPT', name: 'CPT', description: 'Current Procedural Terminology' },
    { system: 'HCPCS', name: 'HCPCS', description: 'Healthcare Common Procedure Coding System' },
    { system: 'RxNorm', name: 'RxNorm', description: 'Normalized names for clinical drugs' },
    { system: 'NDC', name: 'NDC', description: 'National Drug Code' },
    { system: 'LOCAL', name: 'Local Codes', description: 'Institution-specific codes' },
  ];
}
