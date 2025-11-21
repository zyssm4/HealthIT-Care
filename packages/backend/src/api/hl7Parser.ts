import { Router, Request, Response } from 'express';
import { HL7ParserService } from '../services/hl7Parser';
import { ApiResponse, HL7v2ParseResponse } from '@healthit-care/shared';

const router = Router();
const service = new HL7ParserService();

// Parse HL7v2 message
router.post('/parse', (req: Request, res: Response) => {
  try {
    const result = service.parse(req.body);

    const response: ApiResponse<HL7v2ParseResponse> = {
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: result.id,
      },
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'PARSE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to parse HL7v2 message',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: 'error',
      },
    };

    res.status(400).json(response);
  }
});

// Get sample message
router.get('/sample', (_req: Request, res: Response) => {
  const sample = service.getSampleMessage();

  const response: ApiResponse<{ message: string }> = {
    success: true,
    data: { message: sample },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: 'sample',
    },
  };

  res.json(response);
});

// Get field names for a segment
router.get('/fields/:segment', (req: Request, res: Response) => {
  const segmentFields: Record<string, string[]> = {
    MSH: ['Field Separator', 'Encoding Characters', 'Sending Application', 'Sending Facility',
          'Receiving Application', 'Receiving Facility', 'Date/Time of Message', 'Security',
          'Message Type', 'Message Control ID', 'Processing ID', 'Version ID'],
    PID: ['Set ID', 'Patient ID', 'Patient Identifier List', 'Alternate Patient ID', 'Patient Name',
          'Mother\'s Maiden Name', 'Date/Time of Birth', 'Administrative Sex', 'Patient Alias',
          'Race', 'Patient Address', 'County Code', 'Phone Number - Home', 'Phone Number - Business'],
    PV1: ['Set ID', 'Patient Class', 'Assigned Patient Location', 'Admission Type', 'Preadmit Number',
          'Prior Patient Location', 'Attending Doctor', 'Referring Doctor', 'Consulting Doctor'],
    OBR: ['Set ID', 'Placer Order Number', 'Filler Order Number', 'Universal Service Identifier',
          'Priority', 'Requested Date/Time', 'Observation Date/Time', 'Observation End Date/Time'],
    OBX: ['Set ID', 'Value Type', 'Observation Identifier', 'Observation Sub-ID', 'Observation Value',
          'Units', 'References Range', 'Abnormal Flags', 'Probability'],
  };

  const segment = req.params.segment.toUpperCase();
  const fields = segmentFields[segment] || [];

  const response: ApiResponse<{ segment: string; fields: string[] }> = {
    success: true,
    data: { segment, fields },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: 'fields',
    },
  };

  res.json(response);
});

export default router;
