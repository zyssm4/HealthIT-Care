import {
  ChangeRequest,
  ChangeRequestStats,
} from '@healthit-care/shared';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for demo purposes
// In production, this would use a database
const changeRequests: Map<string, ChangeRequest> = new Map();

export async function createChangeRequest(
  data: Omit<ChangeRequest, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ChangeRequest> {
  const now = new Date().toISOString();
  const changeRequest: ChangeRequest = {
    ...data,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };

  changeRequests.set(changeRequest.id, changeRequest);
  return changeRequest;
}

export async function getChangeRequest(id: string): Promise<ChangeRequest | null> {
  return changeRequests.get(id) || null;
}

export async function updateChangeRequest(
  id: string,
  updates: Partial<Omit<ChangeRequest, 'id' | 'createdAt'>>
): Promise<ChangeRequest | null> {
  const existing = changeRequests.get(id);
  if (!existing) return null;

  const updated: ChangeRequest = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  changeRequests.set(id, updated);
  return updated;
}

export async function deleteChangeRequest(id: string): Promise<boolean> {
  return changeRequests.delete(id);
}

export async function listChangeRequests(filters?: {
  status?: string;
  priority?: string;
  affectedSystem?: string;
}): Promise<ChangeRequest[]> {
  let results = Array.from(changeRequests.values());

  if (filters) {
    if (filters.status) {
      results = results.filter(cr => cr.status === filters.status);
    }
    if (filters.priority) {
      results = results.filter(cr => cr.priority === filters.priority);
    }
    if (filters.affectedSystem) {
      results = results.filter(cr =>
        cr.affectedSystems.some(s =>
          s.toLowerCase().includes(filters.affectedSystem!.toLowerCase())
        )
      );
    }
  }

  // Sort by updated date, most recent first
  return results.sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getChangeRequestStats(): Promise<ChangeRequestStats> {
  const all = Array.from(changeRequests.values());

  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};

  all.forEach(cr => {
    byStatus[cr.status] = (byStatus[cr.status] || 0) + 1;
    byPriority[cr.priority] = (byPriority[cr.priority] || 0) + 1;
  });

  const recentlyUpdated = all
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return {
    total: all.length,
    byStatus,
    byPriority,
    recentlyUpdated,
  };
}

export async function addNote(id: string, note: string): Promise<ChangeRequest | null> {
  const existing = changeRequests.get(id);
  if (!existing) return null;

  const timestamp = new Date().toISOString();
  const formattedNote = `[${timestamp}] ${note}`;

  return updateChangeRequest(id, {
    notes: [...existing.notes, formattedNote],
  });
}

export async function updateStatus(
  id: string,
  status: ChangeRequest['status'],
  note?: string
): Promise<ChangeRequest | null> {
  const existing = changeRequests.get(id);
  if (!existing) return null;

  const updates: Partial<ChangeRequest> = { status };

  if (note) {
    const timestamp = new Date().toISOString();
    updates.notes = [...existing.notes, `[${timestamp}] Status changed to ${status}: ${note}`];
  }

  return updateChangeRequest(id, updates);
}

// Initialize with sample data
function initializeSampleData() {
  const sampleRequests: Omit<ChangeRequest, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      title: 'Add new lab result interface',
      description: 'Implement HL7 ORU interface for receiving laboratory results from Quest Diagnostics',
      requestor: 'Dr. Smith',
      priority: 'high',
      status: 'in-progress',
      affectedSystems: ['Lab System', 'EHR', 'Results Portal'],
      affectedInterfaces: ['LAB_IN_01', 'EHR_UPDATE'],
      estimatedEffort: '40 hours',
      targetDate: '2025-12-15',
      notes: [
        '[2025-11-01] Initial request submitted',
        '[2025-11-05] Requirements gathering completed',
        '[2025-11-10] Development started',
      ],
    },
    {
      title: 'Update ADT interface for new patient fields',
      description: 'Add support for preferred language and ethnicity fields in ADT messages',
      requestor: 'Registration Dept',
      priority: 'medium',
      status: 'analysis',
      affectedSystems: ['EHR', 'Registration System'],
      affectedInterfaces: ['ADT_OUT_01', 'ADT_IN_01'],
      estimatedEffort: '16 hours',
      notes: [
        '[2025-11-15] Request submitted',
        '[2025-11-18] Analyzing HL7 v2.5.1 specification for field mapping',
      ],
    },
    {
      title: 'Fix medication allergy alerts',
      description: 'Resolve issue where certain drug allergies are not triggering alerts in CPOE',
      requestor: 'Pharmacy',
      priority: 'critical',
      status: 'testing',
      affectedSystems: ['CPOE', 'Pharmacy System', 'Allergy Database'],
      affectedInterfaces: ['RDE_OUT_01', 'ALLERGY_CHECK'],
      estimatedEffort: '24 hours',
      targetDate: '2025-11-25',
      notes: [
        '[2025-11-10] Critical issue reported',
        '[2025-11-11] Root cause identified - missing NDC mapping',
        '[2025-11-15] Fix implemented',
        '[2025-11-18] In QA testing',
      ],
    },
    {
      title: 'Implement FHIR R4 patient endpoint',
      description: 'Create FHIR R4 compliant Patient resource endpoint for mobile app integration',
      requestor: 'IT Development',
      priority: 'medium',
      status: 'approved',
      affectedSystems: ['EHR', 'Mobile App', 'API Gateway'],
      affectedInterfaces: ['FHIR_PATIENT_API'],
      estimatedEffort: '60 hours',
      targetDate: '2026-01-15',
      notes: [
        '[2025-11-01] Project proposal submitted',
        '[2025-11-10] Architecture review completed',
        '[2025-11-19] Approved by IT steering committee',
      ],
    },
    {
      title: 'Decommission legacy radiology interface',
      description: 'Retire old DICOM interface after migration to cloud PACS',
      requestor: 'Radiology',
      priority: 'low',
      status: 'new',
      affectedSystems: ['PACS', 'RIS'],
      affectedInterfaces: ['DICOM_LEGACY_01'],
      estimatedEffort: '8 hours',
      notes: [
        '[2025-11-20] Request submitted - awaiting scheduling',
      ],
    },
  ];

  sampleRequests.forEach(request => {
    createChangeRequest(request);
  });
}

// Initialize sample data on module load
initializeSampleData();

export function generateChangeRequestReport(requests: ChangeRequest[]): string {
  let report = `# Change Request Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n`;
  report += `Total Requests: ${requests.length}\n\n`;

  report += `## Summary by Status\n\n`;
  const byStatus: Record<string, ChangeRequest[]> = {};
  requests.forEach(cr => {
    if (!byStatus[cr.status]) byStatus[cr.status] = [];
    byStatus[cr.status].push(cr);
  });

  for (const [status, reqs] of Object.entries(byStatus)) {
    report += `### ${status} (${reqs.length})\n\n`;
    reqs.forEach(req => {
      report += `- **${req.title}** [${req.priority}]\n`;
      report += `  - Requestor: ${req.requestor}\n`;
      report += `  - Systems: ${req.affectedSystems.join(', ')}\n`;
      if (req.targetDate) {
        report += `  - Target: ${req.targetDate}\n`;
      }
      report += `\n`;
    });
  }

  return report;
}
