import { v4 as uuidv4 } from 'uuid';
import {
  HL7v2ParseRequest,
  HL7v2ParseResponse,
  HL7v2Segment,
  HL7v2Field,
  HL7v2Component,
  HL7v2ParseError,
} from '@healthit-care/shared';

// HL7v2 field names by segment
const HL7_FIELD_NAMES: Record<string, string[]> = {
  MSH: ['Field Separator', 'Encoding Characters', 'Sending Application', 'Sending Facility',
        'Receiving Application', 'Receiving Facility', 'Date/Time of Message', 'Security',
        'Message Type', 'Message Control ID', 'Processing ID', 'Version ID'],
  PID: ['Set ID', 'Patient ID', 'Patient Identifier List', 'Alternate Patient ID', 'Patient Name',
        'Mother\'s Maiden Name', 'Date/Time of Birth', 'Administrative Sex', 'Patient Alias',
        'Race', 'Patient Address', 'County Code', 'Phone Number - Home', 'Phone Number - Business',
        'Primary Language', 'Marital Status', 'Religion', 'Patient Account Number', 'SSN Number'],
  PV1: ['Set ID', 'Patient Class', 'Assigned Patient Location', 'Admission Type', 'Preadmit Number',
        'Prior Patient Location', 'Attending Doctor', 'Referring Doctor', 'Consulting Doctor',
        'Hospital Service', 'Temporary Location', 'Preadmit Test Indicator', 'Re-admission Indicator',
        'Admit Source', 'Ambulatory Status', 'VIP Indicator', 'Admitting Doctor', 'Patient Type'],
  OBR: ['Set ID', 'Placer Order Number', 'Filler Order Number', 'Universal Service Identifier',
        'Priority', 'Requested Date/Time', 'Observation Date/Time', 'Observation End Date/Time',
        'Collection Volume', 'Collector Identifier', 'Specimen Action Code', 'Danger Code'],
  OBX: ['Set ID', 'Value Type', 'Observation Identifier', 'Observation Sub-ID', 'Observation Value',
        'Units', 'References Range', 'Abnormal Flags', 'Probability', 'Nature of Abnormal Test',
        'Observation Result Status', 'Effective Date of Reference Range'],
  NK1: ['Set ID', 'Name', 'Relationship', 'Address', 'Phone Number', 'Business Phone Number',
        'Contact Role', 'Start Date', 'End Date', 'Job Title', 'Job Code/Class'],
  IN1: ['Set ID', 'Insurance Plan ID', 'Insurance Company ID', 'Insurance Company Name',
        'Insurance Company Address', 'Insurance Co Contact Person', 'Insurance Co Phone Number'],
  DG1: ['Set ID', 'Diagnosis Coding Method', 'Diagnosis Code', 'Diagnosis Description',
        'Diagnosis Date/Time', 'Diagnosis Type', 'Major Diagnostic Category'],
  AL1: ['Set ID', 'Allergen Type Code', 'Allergen Code', 'Allergy Severity Code',
        'Allergy Reaction Code', 'Identification Date'],
};

export class HL7ParserService {
  parse(request: HL7v2ParseRequest): HL7v2ParseResponse {
    const { message, version = '2.5', includeFieldNames = true, highlightErrors = true } = request;

    const errors: HL7v2ParseError[] = [];
    const lines = message.trim().split(/\r?\n|\r/);
    const segments: HL7v2Segment[] = [];

    // Parse MSH first to get delimiters
    const mshLine = lines.find(line => line.startsWith('MSH'));
    if (!mshLine) {
      errors.push({
        segment: 'MSH',
        field: 0,
        message: 'Missing MSH segment',
        severity: 'error',
      });

      return {
        id: uuidv4(),
        messageType: 'UNKNOWN',
        triggerEvent: 'UNKNOWN',
        version: version,
        sendingApp: '',
        sendingFacility: '',
        receivingApp: '',
        receivingFacility: '',
        timestamp: '',
        controlId: '',
        segments: [],
        segmentCount: 0,
        errors,
        raw: message,
        generatedAt: new Date().toISOString(),
      };
    }

    const fieldSeparator = mshLine[3] || '|';
    const encodingChars = mshLine.substring(4, 8);
    const componentSeparator = encodingChars[0] || '^';
    const repetitionSeparator = encodingChars[1] || '~';
    const escapeCharacter = encodingChars[2] || '\\';
    const subcomponentSeparator = encodingChars[3] || '&';

    // Parse each segment
    lines.forEach((line, index) => {
      if (!line.trim()) return;

      const segmentName = line.substring(0, 3);
      let fields: string[];

      // Special handling for MSH segment
      if (segmentName === 'MSH') {
        fields = ['', fieldSeparator, ...line.substring(4).split(fieldSeparator)];
      } else {
        fields = line.split(fieldSeparator);
      }

      const parsedFields: HL7v2Field[] = fields.slice(1).map((fieldValue, fieldIndex) => {
        const components = fieldValue.split(componentSeparator).map((compValue, compIndex) => {
          const subcomponents = compValue.split(subcomponentSeparator);
          return {
            position: compIndex + 1,
            value: compValue,
            subcomponents,
          } as HL7v2Component;
        });

        const fieldNames = HL7_FIELD_NAMES[segmentName] || [];
        const fieldName = includeFieldNames && fieldNames[fieldIndex]
          ? fieldNames[fieldIndex]
          : `${segmentName}-${fieldIndex + 1}`;

        return {
          position: fieldIndex + 1,
          name: fieldName,
          value: fieldValue,
          components,
        } as HL7v2Field;
      });

      segments.push({
        name: segmentName,
        sequence: index + 1,
        fields: parsedFields,
        raw: line,
      });
    });

    // Extract header info from MSH
    const mshSegment = segments.find(s => s.name === 'MSH');
    const getFieldValue = (seg: HL7v2Segment | undefined, fieldNum: number): string => {
      if (!seg || !seg.fields[fieldNum - 1]) return '';
      return seg.fields[fieldNum - 1].value;
    };

    // Parse message type (MSH-9)
    const messageTypeField = getFieldValue(mshSegment, 9);
    const [messageType, triggerEvent] = messageTypeField.split(componentSeparator);

    // Validate required fields
    if (highlightErrors) {
      if (!messageType) {
        errors.push({
          segment: 'MSH',
          field: 9,
          message: 'Missing Message Type',
          severity: 'error',
        });
      }

      if (!getFieldValue(mshSegment, 10)) {
        errors.push({
          segment: 'MSH',
          field: 10,
          message: 'Missing Message Control ID',
          severity: 'error',
        });
      }

      // Check for PID in patient messages
      if (['ADT', 'ORM', 'ORU', 'RDE'].includes(messageType)) {
        const hasPID = segments.some(s => s.name === 'PID');
        if (!hasPID) {
          errors.push({
            segment: 'PID',
            field: 0,
            message: `Missing PID segment for ${messageType} message`,
            severity: 'warning',
          });
        }
      }
    }

    return {
      id: uuidv4(),
      messageType: messageType || 'UNKNOWN',
      triggerEvent: triggerEvent || '',
      version: getFieldValue(mshSegment, 12) || version,
      sendingApp: getFieldValue(mshSegment, 3),
      sendingFacility: getFieldValue(mshSegment, 4),
      receivingApp: getFieldValue(mshSegment, 5),
      receivingFacility: getFieldValue(mshSegment, 6),
      timestamp: getFieldValue(mshSegment, 7),
      controlId: getFieldValue(mshSegment, 10),
      segments,
      segmentCount: segments.length,
      errors,
      raw: message,
      generatedAt: new Date().toISOString(),
    };
  }

  getFieldPath(segmentName: string, fieldNum: number, componentNum?: number, subcomponentNum?: number): string {
    let path = `${segmentName}-${fieldNum}`;
    if (componentNum) {
      path += `-${componentNum}`;
      if (subcomponentNum) {
        path += `-${subcomponentNum}`;
      }
    }
    return path;
  }

  getSampleMessage(): string {
    return `MSH|^~\\&|EPIC|HOSPITAL|LAB|FACILITY|20231120143052||ADT^A01|MSG00001|P|2.5
EVN|A01|20231120143052
PID|1||12345678^^^HOSP^MR||DOE^JOHN^MIDDLE||19800115|M|||123 MAIN ST^^ANYTOWN^ST^12345^USA||^PRN^PH^^^555^1234567
NK1|1|DOE^JANE|SPO|123 MAIN ST^^ANYTOWN^ST^12345^USA|^PRN^PH^^^555^7654321
PV1|1|I|ICU^101^A^HOSP||||1234^SMITH^ATTENDING|||MED||||||||V123456|||||||||||||||||||||||||20231120143000
DG1|1||J18.9^Pneumonia, unspecified organism^ICD10|||A
IN1|1|BC001|123456|BLUE CROSS|PO BOX 123^^CITY^ST^12345|||GROUP123`;
  }
}
