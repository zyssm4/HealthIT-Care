import { v4 as uuidv4 } from 'uuid';
import {
  TransformRequest,
  TransformResponse,
  TranslationFile,
  FieldMapping,
  TransformWarning,
  TransformMetadata,
  MessageFormat,
  TransformOptions,
} from '@healthit-care/shared';

export class MessageTransformerService {
  transform(request: TransformRequest): TransformResponse {
    const { inputMessage, inputFormat, outputFormat, options } = request;

    // Parse input message
    const parsedInput = this.parseMessage(inputMessage, inputFormat);

    // Transform to output format
    const transformedMessage = this.transformMessage(parsedInput, inputFormat, outputFormat, options);

    // Generate field mappings
    const mappings = this.generateMappings(parsedInput, inputFormat, outputFormat);

    // Generate translation file
    const translationFile = this.generateTranslationFile(mappings, inputFormat, outputFormat, options);

    // Generate warnings
    const warnings = this.generateWarnings(parsedInput, mappings, inputFormat, outputFormat);

    // Calculate metadata
    const metadata = this.calculateMetadata(mappings, inputFormat, outputFormat);

    return {
      id: request.id || uuidv4(),
      request,
      transformedMessage,
      translationFile,
      mappings,
      warnings,
      metadata,
      createdAt: new Date().toISOString(),
    };
  }

  private parseMessage(message: string, format: MessageFormat): any {
    switch (format) {
      case 'hl7v2':
        return this.parseHL7v2(message);
      case 'fhir-json':
      case 'json':
      case 'dicom-json':
        return JSON.parse(message);
      case 'fhir-xml':
      case 'cda':
        return this.parseXML(message);
      case 'csv':
        return this.parseCSV(message);
      case 'openehr':
        return JSON.parse(message);
      default:
        return { raw: message };
    }
  }

  private parseHL7v2(message: string): any {
    const segments: any = {};
    const lines = message.split(/[\r\n]+/).filter(l => l.trim());

    for (const line of lines) {
      const fields = line.split('|');
      const segmentName = fields[0];

      if (!segments[segmentName]) {
        segments[segmentName] = [];
      }

      const segmentData: any = { _raw: line };
      fields.forEach((field, index) => {
        if (index > 0) {
          segmentData[`${segmentName}-${index}`] = field;

          // Parse subfields
          if (field.includes('^')) {
            const subfields = field.split('^');
            subfields.forEach((sf, si) => {
              segmentData[`${segmentName}-${index}.${si + 1}`] = sf;
            });
          }
        }
      });

      segments[segmentName].push(segmentData);
    }

    return segments;
  }

  private parseXML(xml: string): any {
    // Simple XML to object conversion
    const result: any = {};
    const tagRegex = /<(\w+)([^>]*)>([^<]*)<\/\1>/g;
    let match;

    while ((match = tagRegex.exec(xml)) !== null) {
      result[match[1]] = match[3].trim();
    }

    return result;
  }

  private parseCSV(csv: string): any {
    const lines = csv.split('\n').filter(l => l.trim());
    if (lines.length === 0) return { rows: [] };

    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const values = line.split(',');
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || '';
      });
      return row;
    });

    return { headers, rows };
  }

  private transformMessage(
    parsed: any,
    inputFormat: MessageFormat,
    outputFormat: MessageFormat,
    options: TransformOptions
  ): string {
    // HL7v2 to FHIR transformation
    if (inputFormat === 'hl7v2' && (outputFormat === 'fhir-json' || outputFormat === 'fhir-xml')) {
      return this.hl7v2ToFHIR(parsed, outputFormat, options);
    }

    // FHIR to HL7v2 transformation
    if ((inputFormat === 'fhir-json' || inputFormat === 'fhir-xml') && outputFormat === 'hl7v2') {
      return this.fhirToHL7v2(parsed, options);
    }

    // FHIR JSON to XML
    if (inputFormat === 'fhir-json' && outputFormat === 'fhir-xml') {
      return this.jsonToXML(parsed, options);
    }

    // FHIR XML to JSON
    if (inputFormat === 'fhir-xml' && outputFormat === 'fhir-json') {
      return this.formatJSON(parsed, options);
    }

    // DICOM to FHIR
    if (inputFormat === 'dicom-json' && outputFormat === 'fhir-json') {
      return this.dicomToFHIR(parsed, options);
    }

    // CSV to FHIR
    if (inputFormat === 'csv' && outputFormat === 'fhir-json') {
      return this.csvToFHIR(parsed, options);
    }

    // Default: JSON output
    return this.formatJSON(parsed, options);
  }

  private hl7v2ToFHIR(hl7: any, outputFormat: MessageFormat, options: TransformOptions): string {
    const bundle: any = {
      resourceType: 'Bundle',
      type: 'message',
      timestamp: new Date().toISOString(),
      entry: [],
    };

    // Extract patient from PID segment
    if (hl7.PID && hl7.PID[0]) {
      const pid = hl7.PID[0];
      const patient: any = {
        resourceType: 'Patient',
        id: uuidv4(),
        identifier: [],
        name: [],
        telecom: [],
        address: [],
      };

      // Patient ID
      if (pid['PID-3']) {
        patient.identifier.push({
          system: 'urn:oid:2.16.840.1.113883.2.1.4.1',
          value: pid['PID-3.1'] || pid['PID-3'],
        });
      }

      // Patient Name
      if (pid['PID-5']) {
        patient.name.push({
          family: pid['PID-5.1'] || '',
          given: [pid['PID-5.2'] || ''].filter(Boolean),
        });
      }

      // Date of Birth
      if (pid['PID-7']) {
        patient.birthDate = this.formatHL7Date(pid['PID-7']);
      }

      // Gender
      if (pid['PID-8']) {
        patient.gender = this.mapHL7Gender(pid['PID-8']);
      }

      // Phone
      if (pid['PID-13']) {
        patient.telecom.push({
          system: 'phone',
          value: pid['PID-13.1'] || pid['PID-13'],
          use: 'home',
        });
      }

      // Address
      if (pid['PID-11']) {
        patient.address.push({
          line: [pid['PID-11.1'] || ''].filter(Boolean),
          city: pid['PID-11.3'] || '',
          state: pid['PID-11.4'] || '',
          postalCode: pid['PID-11.5'] || '',
          country: pid['PID-11.6'] || '',
        });
      }

      bundle.entry.push({
        resource: patient,
        request: {
          method: 'POST',
          url: 'Patient',
        },
      });
    }

    // Extract encounter from PV1 segment
    if (hl7.PV1 && hl7.PV1[0]) {
      const pv1 = hl7.PV1[0];
      const encounter: any = {
        resourceType: 'Encounter',
        id: uuidv4(),
        status: 'finished',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: this.mapHL7PatientClass(pv1['PV1-2']),
        },
      };

      if (pv1['PV1-44']) {
        encounter.period = {
          start: this.formatHL7Date(pv1['PV1-44']),
        };
      }

      bundle.entry.push({
        resource: encounter,
        request: {
          method: 'POST',
          url: 'Encounter',
        },
      });
    }

    // Extract observations from OBX segments
    if (hl7.OBX) {
      for (const obx of hl7.OBX) {
        const observation: any = {
          resourceType: 'Observation',
          id: uuidv4(),
          status: 'final',
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: obx['OBX-3.1'] || obx['OBX-3'] || 'unknown',
              display: obx['OBX-3.2'] || '',
            }],
          },
        };

        if (obx['OBX-5']) {
          observation.valueString = obx['OBX-5'];
        }

        if (obx['OBX-6']) {
          observation.valueQuantity = {
            value: parseFloat(obx['OBX-5']) || 0,
            unit: obx['OBX-6'],
          };
        }

        bundle.entry.push({
          resource: observation,
          request: {
            method: 'POST',
            url: 'Observation',
          },
        });
      }
    }

    if (outputFormat === 'fhir-xml') {
      return this.jsonToXML(bundle, options);
    }

    return this.formatJSON(bundle, options);
  }

  private fhirToHL7v2(fhir: any, options: TransformOptions): string {
    const segments: string[] = [];
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

    // MSH segment
    segments.push(`MSH|^~\\&|FHIR_CONVERTER|HEALTHIT|RECEIVER|FACILITY|${timestamp}||ADT^A01|${uuidv4().slice(0, 8)}|P|2.5.1`);

    // Process Bundle entries or single resource
    const resources = fhir.entry ? fhir.entry.map((e: any) => e.resource) : [fhir];

    for (const resource of resources) {
      if (resource.resourceType === 'Patient') {
        const pid = this.patientToPID(resource);
        segments.push(pid);
      }

      if (resource.resourceType === 'Encounter') {
        const pv1 = this.encounterToPV1(resource);
        segments.push(pv1);
      }

      if (resource.resourceType === 'Observation') {
        const obx = this.observationToOBX(resource);
        segments.push(obx);
      }
    }

    return segments.join('\r\n');
  }

  private patientToPID(patient: any): string {
    const fields = ['PID', '', ''];

    // PID-3: Patient ID
    const id = patient.identifier?.[0]?.value || '';
    fields.push(id);

    fields.push(''); // PID-4

    // PID-5: Patient Name
    const name = patient.name?.[0];
    const nameStr = name ? `${name.family || ''}^${(name.given || []).join(' ')}` : '';
    fields.push(nameStr);

    fields.push(''); // PID-6

    // PID-7: DOB
    fields.push(patient.birthDate?.replace(/-/g, '') || '');

    // PID-8: Gender
    const genderMap: any = { male: 'M', female: 'F', other: 'O', unknown: 'U' };
    fields.push(genderMap[patient.gender] || 'U');

    return fields.join('|');
  }

  private encounterToPV1(encounter: any): string {
    const fields = ['PV1', ''];

    // PV1-2: Patient Class
    const classCode = encounter.class?.code || 'AMB';
    fields.push(classCode);

    return fields.join('|');
  }

  private observationToOBX(observation: any): string {
    const fields = ['OBX', '1', 'ST'];

    // OBX-3: Observation ID
    const code = observation.code?.coding?.[0];
    fields.push(code ? `${code.code}^${code.display || ''}` : '');

    fields.push(''); // OBX-4

    // OBX-5: Value
    if (observation.valueQuantity) {
      fields.push(String(observation.valueQuantity.value));
      fields.push(observation.valueQuantity.unit || '');
    } else {
      fields.push(observation.valueString || '');
      fields.push('');
    }

    return fields.join('|');
  }

  private dicomToFHIR(dicom: any, options: TransformOptions): string {
    const imagingStudy: any = {
      resourceType: 'ImagingStudy',
      id: uuidv4(),
      status: 'available',
      subject: {
        reference: 'Patient/' + uuidv4(),
      },
    };

    // Map DICOM fields
    if (dicom['00100020']) {
      imagingStudy.identifier = [{
        system: 'urn:dicom:uid',
        value: dicom['00100020'].Value?.[0] || '',
      }];
    }

    if (dicom['00080060']) {
      imagingStudy.modality = [{
        system: 'http://dicom.nema.org/resources/ontology/DCM',
        code: dicom['00080060'].Value?.[0] || '',
      }];
    }

    return this.formatJSON(imagingStudy, options);
  }

  private csvToFHIR(csv: any, options: TransformOptions): string {
    const bundle: any = {
      resourceType: 'Bundle',
      type: 'collection',
      entry: [],
    };

    // Try to create Patient resources from CSV rows
    for (const row of csv.rows || []) {
      const patient: any = {
        resourceType: 'Patient',
        id: uuidv4(),
      };

      // Map common column names
      if (row.patient_id || row.id || row.mrn) {
        patient.identifier = [{
          value: row.patient_id || row.id || row.mrn,
        }];
      }

      if (row.first_name || row.last_name || row.name) {
        patient.name = [{
          family: row.last_name || '',
          given: [row.first_name || row.name || ''].filter(Boolean),
        }];
      }

      if (row.dob || row.birth_date || row.birthdate) {
        patient.birthDate = row.dob || row.birth_date || row.birthdate;
      }

      if (row.gender || row.sex) {
        patient.gender = (row.gender || row.sex || '').toLowerCase();
      }

      bundle.entry.push({
        resource: patient,
      });
    }

    return this.formatJSON(bundle, options);
  }

  private jsonToXML(obj: any, options: TransformOptions): string {
    const indent = options.prettyPrint ? '  ' : '';
    const newline = options.prettyPrint ? '\n' : '';

    const toXML = (data: any, level: number = 0): string => {
      if (typeof data !== 'object' || data === null) {
        return String(data);
      }

      const prefix = indent.repeat(level);
      let xml = '';

      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
          for (const item of value) {
            xml += `${prefix}<${key}>${newline}${toXML(item, level + 1)}${prefix}</${key}>${newline}`;
          }
        } else if (typeof value === 'object' && value !== null) {
          xml += `${prefix}<${key}>${newline}${toXML(value, level + 1)}${prefix}</${key}>${newline}`;
        } else {
          xml += `${prefix}<${key}>${value}</${key}>${newline}`;
        }
      }

      return xml;
    };

    return `<?xml version="1.0" encoding="UTF-8"?>${newline}${toXML(obj)}`;
  }

  private formatJSON(obj: any, options: TransformOptions): string {
    return JSON.stringify(obj, null, options.prettyPrint ? 2 : 0);
  }

  private formatHL7Date(date: string): string {
    if (!date || date.length < 8) return date;
    return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
  }

  private mapHL7Gender(gender: string): string {
    const map: any = { M: 'male', F: 'female', O: 'other', U: 'unknown' };
    return map[gender.toUpperCase()] || 'unknown';
  }

  private mapHL7PatientClass(cls: string): string {
    const map: any = { I: 'IMP', O: 'AMB', E: 'EMER', R: 'OBSENC' };
    return map[cls?.toUpperCase()] || 'AMB';
  }

  private generateMappings(
    parsed: any,
    inputFormat: MessageFormat,
    outputFormat: MessageFormat
  ): FieldMapping[] {
    const mappings: FieldMapping[] = [];

    if (inputFormat === 'hl7v2' && outputFormat.includes('fhir')) {
      // HL7v2 to FHIR mappings
      mappings.push(
        {
          sourceField: 'PID-3',
          sourcePath: 'PID.3',
          targetField: 'Patient.identifier',
          targetPath: 'Patient.identifier[0].value',
          transformation: 'Direct mapping',
          notes: 'Patient identifier from HL7v2 PID segment',
        },
        {
          sourceField: 'PID-5',
          sourcePath: 'PID.5',
          targetField: 'Patient.name',
          targetPath: 'Patient.name[0]',
          transformation: 'Split by ^ delimiter: family^given',
          notes: 'Name components separated by caret',
        },
        {
          sourceField: 'PID-7',
          sourcePath: 'PID.7',
          targetField: 'Patient.birthDate',
          targetPath: 'Patient.birthDate',
          transformation: 'Date format: YYYYMMDD to YYYY-MM-DD',
          notes: 'HL7v2 date format conversion',
        },
        {
          sourceField: 'PID-8',
          sourcePath: 'PID.8',
          targetField: 'Patient.gender',
          targetPath: 'Patient.gender',
          transformation: 'Code mapping: M→male, F→female, O→other, U→unknown',
          notes: 'Administrative gender code translation',
        },
        {
          sourceField: 'PID-11',
          sourcePath: 'PID.11',
          targetField: 'Patient.address',
          targetPath: 'Patient.address[0]',
          transformation: 'Split by ^ delimiter into address components',
          notes: 'Street^City^State^Postal^Country',
        },
        {
          sourceField: 'PID-13',
          sourcePath: 'PID.13',
          targetField: 'Patient.telecom',
          targetPath: 'Patient.telecom[0]',
          transformation: 'Map to telecom with system=phone',
          notes: 'Home phone number',
        },
        {
          sourceField: 'PV1-2',
          sourcePath: 'PV1.2',
          targetField: 'Encounter.class',
          targetPath: 'Encounter.class.code',
          transformation: 'Code mapping: I→IMP, O→AMB, E→EMER',
          notes: 'Patient class to encounter class',
        },
        {
          sourceField: 'OBX-3',
          sourcePath: 'OBX.3',
          targetField: 'Observation.code',
          targetPath: 'Observation.code.coding[0]',
          transformation: 'Map to LOINC coding system',
          notes: 'Observation identifier code',
        },
        {
          sourceField: 'OBX-5',
          sourcePath: 'OBX.5',
          targetField: 'Observation.value',
          targetPath: 'Observation.valueQuantity or valueString',
          transformation: 'Type-dependent value mapping',
          notes: 'Observation value with optional units from OBX-6',
        }
      );
    }

    if (inputFormat.includes('fhir') && outputFormat === 'hl7v2') {
      // FHIR to HL7v2 mappings (reverse)
      mappings.push(
        {
          sourceField: 'Patient.identifier',
          sourcePath: 'Patient.identifier[0].value',
          targetField: 'PID-3',
          targetPath: 'PID.3',
          transformation: 'Direct mapping',
          notes: 'Patient identifier to PID segment',
        },
        {
          sourceField: 'Patient.name',
          sourcePath: 'Patient.name[0]',
          targetField: 'PID-5',
          targetPath: 'PID.5',
          transformation: 'Combine: family^given[0]',
          notes: 'Name components joined by caret',
        },
        {
          sourceField: 'Patient.birthDate',
          sourcePath: 'Patient.birthDate',
          targetField: 'PID-7',
          targetPath: 'PID.7',
          transformation: 'Date format: YYYY-MM-DD to YYYYMMDD',
          notes: 'Remove dashes from date',
        },
        {
          sourceField: 'Patient.gender',
          sourcePath: 'Patient.gender',
          targetField: 'PID-8',
          targetPath: 'PID.8',
          transformation: 'Code mapping: male→M, female→F, other→O, unknown→U',
          notes: 'Gender code translation',
        }
      );
    }

    return mappings;
  }

  private generateTranslationFile(
    mappings: FieldMapping[],
    inputFormat: MessageFormat,
    outputFormat: MessageFormat,
    options: TransformOptions
  ): TranslationFile {
    const format = options.translationFileFormat;

    switch (format) {
      case 'xslt':
        return this.generateXSLT(mappings, inputFormat, outputFormat);
      case 'jsonata':
        return this.generateJSONata(mappings, inputFormat, outputFormat);
      case 'cloverleaf-xlt':
        return this.generateCloverleafXLT(mappings, inputFormat, outputFormat);
      case 'mapping-table':
      default:
        return this.generateMappingTable(mappings, inputFormat, outputFormat);
    }
  }

  private generateXSLT(
    mappings: FieldMapping[],
    inputFormat: MessageFormat,
    outputFormat: MessageFormat
  ): TranslationFile {
    let xslt = `<?xml version="1.0" encoding="UTF-8"?>
<!--
  XSLT Transformation: ${inputFormat.toUpperCase()} to ${outputFormat.toUpperCase()}
  Generated by HealthIT-Care Message Transformer
  Generated: ${new Date().toISOString()}
-->
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:fhir="http://hl7.org/fhir">

  <xsl:output method="xml" indent="yes" encoding="UTF-8"/>

  <!-- Root template -->
  <xsl:template match="/">
    <Bundle xmlns="http://hl7.org/fhir">
      <type value="message"/>
      <timestamp value="{current-dateTime()}"/>
      <xsl:apply-templates/>
    </Bundle>
  </xsl:template>

`;

    // Add templates for each mapping
    if (inputFormat === 'hl7v2') {
      xslt += `  <!-- Patient from PID segment -->
  <xsl:template match="PID">
    <entry>
      <resource>
        <Patient>
          <!-- Identifier from PID-3 -->
          <identifier>
            <system value="urn:oid:2.16.840.1.113883.2.1.4.1"/>
            <value>
              <xsl:attribute name="value">
                <xsl:value-of select="PID.3/CX.1"/>
              </xsl:attribute>
            </value>
          </identifier>

          <!-- Name from PID-5 -->
          <name>
            <family>
              <xsl:attribute name="value">
                <xsl:value-of select="PID.5/XPN.1"/>
              </xsl:attribute>
            </family>
            <given>
              <xsl:attribute name="value">
                <xsl:value-of select="PID.5/XPN.2"/>
              </xsl:attribute>
            </given>
          </name>

          <!-- Birth Date from PID-7 -->
          <birthDate>
            <xsl:attribute name="value">
              <xsl:value-of select="concat(
                substring(PID.7, 1, 4), '-',
                substring(PID.7, 5, 2), '-',
                substring(PID.7, 7, 2))"/>
            </xsl:attribute>
          </birthDate>

          <!-- Gender from PID-8 -->
          <gender>
            <xsl:attribute name="value">
              <xsl:choose>
                <xsl:when test="PID.8 = 'M'">male</xsl:when>
                <xsl:when test="PID.8 = 'F'">female</xsl:when>
                <xsl:when test="PID.8 = 'O'">other</xsl:when>
                <xsl:otherwise>unknown</xsl:otherwise>
              </xsl:choose>
            </xsl:attribute>
          </gender>
        </Patient>
      </resource>
    </entry>
  </xsl:template>

  <!-- Observation from OBX segment -->
  <xsl:template match="OBX">
    <entry>
      <resource>
        <Observation>
          <status value="final"/>
          <code>
            <coding>
              <system value="http://loinc.org"/>
              <code>
                <xsl:attribute name="value">
                  <xsl:value-of select="OBX.3/CE.1"/>
                </xsl:attribute>
              </code>
              <display>
                <xsl:attribute name="value">
                  <xsl:value-of select="OBX.3/CE.2"/>
                </xsl:attribute>
              </display>
            </coding>
          </code>
          <valueString>
            <xsl:attribute name="value">
              <xsl:value-of select="OBX.5"/>
            </xsl:attribute>
          </valueString>
        </Observation>
      </resource>
    </entry>
  </xsl:template>

`;
    }

    xslt += `</xsl:stylesheet>`;

    return {
      filename: `transform_${inputFormat}_to_${outputFormat}.xslt`,
      format: 'XSLT 2.0',
      content: xslt,
      description: `XSLT stylesheet for transforming ${inputFormat.toUpperCase()} messages to ${outputFormat.toUpperCase()} format`,
    };
  }

  private generateJSONata(
    mappings: FieldMapping[],
    inputFormat: MessageFormat,
    outputFormat: MessageFormat
  ): TranslationFile {
    let jsonata = `/*
 * JSONata Expression: ${inputFormat.toUpperCase()} to ${outputFormat.toUpperCase()}
 * Generated by HealthIT-Care Message Transformer
 * Generated: ${new Date().toISOString()}
 */

{
  "resourceType": "Bundle",
  "type": "message",
  "timestamp": $now(),
  "entry": [
`;

    if (inputFormat === 'hl7v2') {
      jsonata += `    /* Patient Resource from PID segment */
    {
      "resource": {
        "resourceType": "Patient",
        "identifier": [
          {
            "system": "urn:oid:2.16.840.1.113883.2.1.4.1",
            "value": PID[0].\`PID-3\`
          }
        ],
        "name": [
          {
            "family": $split(PID[0].\`PID-5\`, "^")[0],
            "given": [$split(PID[0].\`PID-5\`, "^")[1]]
          }
        ],
        "birthDate": $substring(PID[0].\`PID-7\`, 0, 4) & "-" &
                     $substring(PID[0].\`PID-7\`, 4, 2) & "-" &
                     $substring(PID[0].\`PID-7\`, 6, 2),
        "gender": $lookup({
          "M": "male",
          "F": "female",
          "O": "other",
          "U": "unknown"
        }, PID[0].\`PID-8\`)
      }
    },

    /* Observations from OBX segments */
    OBX.{
      "resource": {
        "resourceType": "Observation",
        "status": "final",
        "code": {
          "coding": [
            {
              "system": "http://loinc.org",
              "code": \`OBX-3.1\`,
              "display": \`OBX-3.2\`
            }
          ]
        },
        "valueString": \`OBX-5\`
      }
    }
`;
    }

    jsonata += `  ]
}`;

    return {
      filename: `transform_${inputFormat}_to_${outputFormat}.jsonata`,
      format: 'JSONata',
      content: jsonata,
      description: `JSONata expression for transforming ${inputFormat.toUpperCase()} to ${outputFormat.toUpperCase()}`,
    };
  }

  private generateCloverleafXLT(
    mappings: FieldMapping[],
    inputFormat: MessageFormat,
    outputFormat: MessageFormat
  ): TranslationFile {
    let xlt = `######################################################################
# Cloverleaf XLT Translation File
# ${inputFormat.toUpperCase()} to ${outputFormat.toUpperCase()}
# Generated by HealthIT-Care Message Transformer
# Generated: ${new Date().toISOString()}
######################################################################

BEGIN {
    # Initialize output message
    set outMsg [msgcreate -type hl7]
}

`;

    if (inputFormat === 'hl7v2' && outputFormat.includes('fhir')) {
      xlt += `# Transform HL7v2 to FHIR Bundle
proc transform_to_fhir {inMsg} {
    # Extract PID segment data
    set pid [msgget $inMsg PID]

    # Patient ID (PID-3)
    set patientId [lindex [split [msgget $inMsg PID.3] "^"] 0]

    # Patient Name (PID-5)
    set nameComponents [split [msgget $inMsg PID.5] "^"]
    set familyName [lindex $nameComponents 0]
    set givenName [lindex $nameComponents 1]

    # Date of Birth (PID-7) - Convert YYYYMMDD to YYYY-MM-DD
    set dob [msgget $inMsg PID.7]
    set fhirDob "[string range $dob 0 3]-[string range $dob 4 5]-[string range $dob 6 7]"

    # Gender (PID-8) - Map to FHIR values
    set gender [msgget $inMsg PID.8]
    switch $gender {
        "M" { set fhirGender "male" }
        "F" { set fhirGender "female" }
        "O" { set fhirGender "other" }
        default { set fhirGender "unknown" }
    }

    # Build FHIR Patient resource
    set fhirPatient [dict create \\
        resourceType Patient \\
        identifier [list [dict create value $patientId]] \\
        name [list [dict create family $familyName given [list $givenName]]] \\
        birthDate $fhirDob \\
        gender $fhirGender \\
    ]

    return $fhirPatient
}

# Process OBX segments for Observations
proc transform_obx_to_observation {obxSegment} {
    set code [lindex [split [msgget $obxSegment OBX.3] "^"] 0]
    set display [lindex [split [msgget $obxSegment OBX.3] "^"] 1]
    set value [msgget $obxSegment OBX.5]
    set units [msgget $obxSegment OBX.6]

    set observation [dict create \\
        resourceType Observation \\
        status final \\
        code [dict create \\
            coding [list [dict create \\
                system "http://loinc.org" \\
                code $code \\
                display $display \\
            ]] \\
        ] \\
    ]

    if {$units ne ""} {
        dict set observation valueQuantity [dict create \\
            value $value \\
            unit $units \\
        ]
    } else {
        dict set observation valueString $value
    }

    return $observation
}

END {
    # Finalize and output message
    msgwrite $outMsg
}
`;
    } else {
      xlt += `# Generic field mapping
proc transform_message {inMsg} {
`;
      for (const mapping of mappings) {
        xlt += `    # ${mapping.sourceField} -> ${mapping.targetField}
    # ${mapping.transformation}
    set ${mapping.targetField.replace(/\./g, '_')} [msgget $inMsg ${mapping.sourcePath}]

`;
      }
      xlt += `    return $outMsg
}
`;
    }

    return {
      filename: `transform_${inputFormat}_to_${outputFormat}.xlt`,
      format: 'Cloverleaf XLT (TCL)',
      content: xlt,
      description: `Infor Cloverleaf translation file for ${inputFormat.toUpperCase()} to ${outputFormat.toUpperCase()}`,
    };
  }

  private generateMappingTable(
    mappings: FieldMapping[],
    inputFormat: MessageFormat,
    outputFormat: MessageFormat
  ): TranslationFile {
    let table = `# Field Mapping Table
# ${inputFormat.toUpperCase()} to ${outputFormat.toUpperCase()}
# Generated: ${new Date().toISOString()}

| Source Field | Source Path | Target Field | Target Path | Transformation | Notes |
|--------------|-------------|--------------|-------------|----------------|-------|
`;

    for (const mapping of mappings) {
      table += `| ${mapping.sourceField} | ${mapping.sourcePath} | ${mapping.targetField} | ${mapping.targetPath} | ${mapping.transformation} | ${mapping.notes || ''} |\n`;
    }

    return {
      filename: `mapping_${inputFormat}_to_${outputFormat}.md`,
      format: 'Markdown Table',
      content: table,
      description: `Field mapping table for ${inputFormat.toUpperCase()} to ${outputFormat.toUpperCase()} transformation`,
    };
  }

  private generateWarnings(
    parsed: any,
    mappings: FieldMapping[],
    inputFormat: MessageFormat,
    outputFormat: MessageFormat
  ): TransformWarning[] {
    const warnings: TransformWarning[] = [];

    // Check for missing required fields
    if (inputFormat === 'hl7v2') {
      if (!parsed.PID || parsed.PID.length === 0) {
        warnings.push({
          severity: 'warning',
          message: 'No PID segment found in HL7v2 message',
          recommendation: 'Patient demographics will not be included in the output',
        });
      }

      if (!parsed.MSH || parsed.MSH.length === 0) {
        warnings.push({
          severity: 'error',
          message: 'No MSH segment found - invalid HL7v2 message',
          recommendation: 'Ensure message starts with MSH segment',
        });
      }
    }

    // Warn about data loss
    if (inputFormat === 'hl7v2' && outputFormat.includes('fhir')) {
      warnings.push({
        severity: 'info',
        message: 'Some HL7v2 fields may not have direct FHIR equivalents',
        recommendation: 'Review unmapped fields in the mapping table',
      });
    }

    // Warn about format-specific issues
    if (outputFormat === 'hl7v2') {
      warnings.push({
        severity: 'info',
        message: 'HL7v2 output uses default encoding characters: ^~\\&',
        recommendation: 'Modify MSH-2 if different encoding is required',
      });
    }

    return warnings;
  }

  private calculateMetadata(
    mappings: FieldMapping[],
    inputFormat: MessageFormat,
    outputFormat: MessageFormat
  ): TransformMetadata {
    const totalPossibleMappings = this.getExpectedMappingCount(inputFormat, outputFormat);
    const fieldsMapped = mappings.length;
    const fieldsUnmapped = Math.max(0, totalPossibleMappings - fieldsMapped);

    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    if (fieldsMapped > 20) {
      complexity = 'complex';
    } else if (fieldsMapped > 10) {
      complexity = 'moderate';
    }

    const estimatedAccuracy = Math.min(95, 70 + (fieldsMapped / totalPossibleMappings) * 25);

    return {
      inputFormat,
      outputFormat,
      fieldsMapped,
      fieldsUnmapped,
      transformationComplexity: complexity,
      estimatedAccuracy: Math.round(estimatedAccuracy),
    };
  }

  private getExpectedMappingCount(inputFormat: MessageFormat, outputFormat: MessageFormat): number {
    // Estimate based on common transformation scenarios
    if (inputFormat === 'hl7v2' && outputFormat.includes('fhir')) return 25;
    if (inputFormat.includes('fhir') && outputFormat === 'hl7v2') return 20;
    if (inputFormat === 'csv') return 10;
    return 15;
  }

  getSupportedFormats(): object {
    return {
      formats: [
        { id: 'hl7v2', name: 'HL7 v2.x', description: 'Health Level Seven version 2 messaging' },
        { id: 'fhir-json', name: 'FHIR (JSON)', description: 'Fast Healthcare Interoperability Resources' },
        { id: 'fhir-xml', name: 'FHIR (XML)', description: 'FHIR in XML format' },
        { id: 'cda', name: 'CDA', description: 'Clinical Document Architecture' },
        { id: 'dicom-json', name: 'DICOM JSON', description: 'DICOM metadata in JSON' },
        { id: 'openehr', name: 'OpenEHR', description: 'OpenEHR archetype-based data' },
        { id: 'csv', name: 'CSV', description: 'Comma-separated values' },
        { id: 'json', name: 'Generic JSON', description: 'Generic JSON format' },
      ],
    };
  }
}
