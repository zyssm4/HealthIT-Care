import {
  InterfaceDoc,
  DocGeneratorRequest,
  DocGeneratorResponse,
} from '@healthit-care/shared';
import { v4 as uuidv4 } from 'uuid';

export async function generateDocumentation(
  request: DocGeneratorRequest
): Promise<DocGeneratorResponse> {
  const id = uuidv4();

  let documentation = '';

  if (request.outputFormat === 'markdown') {
    documentation = generateMarkdownDoc(request);
  } else if (request.outputFormat === 'html') {
    documentation = generateHtmlDoc(request);
  } else {
    documentation = JSON.stringify(request.interfaces, null, 2);
  }

  return {
    id,
    documentation,
    format: request.outputFormat,
    interfaceCount: request.interfaces.length,
    generatedAt: new Date().toISOString(),
  };
}

function generateMarkdownDoc(request: DocGeneratorRequest): string {
  let doc = `# Interface Documentation\n\n`;
  doc += `Generated: ${new Date().toISOString()}\n\n`;
  doc += `Total Interfaces: ${request.interfaces.length}\n\n`;
  doc += `---\n\n`;

  if (request.includeDataFlowDiagram) {
    doc += `## Data Flow Overview\n\n`;
    doc += '```mermaid\ngraph LR\n';
    request.interfaces.forEach((iface, idx) => {
      doc += `  ${iface.sourceSystem.replace(/\s+/g, '_')}[${iface.sourceSystem}] -->|${iface.protocol}| ${iface.targetSystem.replace(/\s+/g, '_')}[${iface.targetSystem}]\n`;
    });
    doc += '```\n\n';
  }

  if (request.includeEndpointCatalog) {
    doc += `## Endpoint Catalog\n\n`;
    doc += `| Interface | Protocol | Direction | Endpoints |\n`;
    doc += `|-----------|----------|-----------|----------|\n`;
    request.interfaces.forEach(iface => {
      const endpoints = iface.endpoints.map(e => `${e.name} (${e.type})`).join(', ');
      doc += `| ${iface.name} | ${iface.protocol} | ${iface.direction} | ${endpoints} |\n`;
    });
    doc += `\n`;
  }

  request.interfaces.forEach((iface, idx) => {
    doc += `## ${idx + 1}. ${iface.name}\n\n`;
    doc += `**Description:** ${iface.description}\n\n`;
    doc += `### Overview\n\n`;
    doc += `| Property | Value |\n`;
    doc += `|----------|-------|\n`;
    doc += `| Source System | ${iface.sourceSystem} |\n`;
    doc += `| Target System | ${iface.targetSystem} |\n`;
    doc += `| Protocol | ${iface.protocol} |\n`;
    doc += `| Direction | ${iface.direction} |\n`;
    doc += `| Message Types | ${iface.messageTypes.join(', ')} |\n\n`;

    if (iface.endpoints.length > 0) {
      doc += `### Endpoints\n\n`;
      iface.endpoints.forEach(endpoint => {
        doc += `#### ${endpoint.name} (${endpoint.type})\n\n`;
        if (endpoint.host) doc += `- **Host:** ${endpoint.host}\n`;
        if (endpoint.port) doc += `- **Port:** ${endpoint.port}\n`;
        if (endpoint.path) doc += `- **Path:** ${endpoint.path}\n`;
        if (endpoint.authentication) doc += `- **Authentication:** ${endpoint.authentication}\n`;
        doc += `\n`;
      });
    }

    if (iface.dataElements.length > 0) {
      doc += `### Data Elements\n\n`;
      doc += `| Name | Source Path | Target Path | Data Type | Required | Description |\n`;
      doc += `|------|-------------|-------------|-----------|----------|-------------|\n`;
      iface.dataElements.forEach(elem => {
        doc += `| ${elem.name} | ${elem.sourcePath} | ${elem.targetPath} | ${elem.dataType} | ${elem.required ? 'Yes' : 'No'} | ${elem.description || '-'} |\n`;
      });
      doc += `\n`;
    }

    if (iface.notes) {
      doc += `### Notes\n\n${iface.notes}\n\n`;
    }

    doc += `---\n\n`;
  });

  return doc;
}

function generateHtmlDoc(request: DocGeneratorRequest): string {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interface Documentation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px; }
    h2 { color: #1e3a8a; margin-top: 30px; }
    h3 { color: #374151; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 10px; text-align: left; border: 1px solid #e5e7eb; }
    th { background: #f3f4f6; font-weight: 600; }
    .interface-card { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-right: 5px; }
    .badge-protocol { background: #dbeafe; color: #1e40af; }
    .badge-direction { background: #d1fae5; color: #065f46; }
    .meta { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Interface Documentation</h1>
    <p class="meta">Generated: ${new Date().toISOString()} | Total Interfaces: ${request.interfaces.length}</p>
`;

  if (request.includeEndpointCatalog) {
    html += `<h2>Endpoint Catalog</h2>
    <table>
      <thead>
        <tr><th>Interface</th><th>Protocol</th><th>Direction</th><th>Source</th><th>Target</th></tr>
      </thead>
      <tbody>`;
    request.interfaces.forEach(iface => {
      html += `<tr>
        <td>${iface.name}</td>
        <td><span class="badge badge-protocol">${iface.protocol}</span></td>
        <td><span class="badge badge-direction">${iface.direction}</span></td>
        <td>${iface.sourceSystem}</td>
        <td>${iface.targetSystem}</td>
      </tr>`;
    });
    html += `</tbody></table>`;
  }

  request.interfaces.forEach((iface, idx) => {
    html += `
    <div class="interface-card">
      <h2>${idx + 1}. ${iface.name}</h2>
      <p>${iface.description}</p>
      <table>
        <tr><th>Source System</th><td>${iface.sourceSystem}</td></tr>
        <tr><th>Target System</th><td>${iface.targetSystem}</td></tr>
        <tr><th>Protocol</th><td>${iface.protocol}</td></tr>
        <tr><th>Direction</th><td>${iface.direction}</td></tr>
        <tr><th>Message Types</th><td>${iface.messageTypes.join(', ')}</td></tr>
      </table>`;

    if (iface.dataElements.length > 0) {
      html += `<h3>Data Elements</h3>
      <table>
        <thead>
          <tr><th>Name</th><th>Source Path</th><th>Target Path</th><th>Data Type</th><th>Required</th></tr>
        </thead>
        <tbody>`;
      iface.dataElements.forEach(elem => {
        html += `<tr>
          <td>${elem.name}</td>
          <td><code>${elem.sourcePath}</code></td>
          <td><code>${elem.targetPath}</code></td>
          <td>${elem.dataType}</td>
          <td>${elem.required ? 'Yes' : 'No'}</td>
        </tr>`;
      });
      html += `</tbody></table>`;
    }

    html += `</div>`;
  });

  html += `
  </div>
</body>
</html>`;

  return html;
}

export function createSampleInterface(): InterfaceDoc {
  return {
    id: uuidv4(),
    name: 'ADT Feed',
    description: 'Patient admission, discharge, and transfer notifications',
    sourceSystem: 'Epic EHR',
    targetSystem: 'Clinical Data Warehouse',
    protocol: 'HL7v2',
    direction: 'outbound',
    messageTypes: ['ADT^A01', 'ADT^A02', 'ADT^A03', 'ADT^A08'],
    endpoints: [
      {
        name: 'Epic ADT Out',
        type: 'sender',
        host: 'epic-interface.hospital.local',
        port: 5000,
      },
      {
        name: 'CDW ADT In',
        type: 'receiver',
        host: 'cdw-interface.hospital.local',
        port: 5001,
      },
    ],
    dataElements: [
      {
        name: 'Patient MRN',
        sourcePath: 'PID.3.1',
        targetPath: 'patient_mrn',
        dataType: 'string',
        required: true,
        description: 'Medical Record Number',
      },
      {
        name: 'Patient Name',
        sourcePath: 'PID.5',
        targetPath: 'patient_name',
        dataType: 'XPN',
        required: true,
        description: 'Patient full name',
      },
      {
        name: 'Admit Date',
        sourcePath: 'PV1.44',
        targetPath: 'admit_datetime',
        dataType: 'datetime',
        required: true,
        description: 'Admission date and time',
      },
    ],
  };
}
