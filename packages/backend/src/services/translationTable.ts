import { v4 as uuidv4 } from 'uuid';
import {
  TranslationTableRequest,
  TranslationTableResponse,
  TranslationTable,
  TranslationTableEntry,
} from '@healthit-care/shared';

export class TranslationTableService {
  generate(request: TranslationTableRequest): TranslationTableResponse {
    const {
      name,
      description = '',
      sourceSystem,
      targetSystem,
      entries,
      outputFormat,
      includeComments,
    } = request;

    // Build the translation table
    const tableEntries: TranslationTableEntry[] = entries.map(entry => ({
      key: entry.key,
      value: entry.value,
      description: entry.description,
      category: entry.category,
      active: true,
    }));

    // Check for duplicate keys
    const keyCount: Record<string, number> = {};
    const duplicateKeys: string[] = [];
    entries.forEach(entry => {
      keyCount[entry.key] = (keyCount[entry.key] || 0) + 1;
      if (keyCount[entry.key] === 2) {
        duplicateKeys.push(entry.key);
      }
    });

    // Count unique categories
    const categories = new Set(entries.map(e => e.category).filter(Boolean));

    const table: TranslationTable = {
      id: uuidv4(),
      name,
      description,
      sourceSystem,
      targetSystem,
      entries: tableEntries,
      metadata: {
        version: '1.0',
        lastModified: new Date().toISOString(),
        author: 'HealthIT-Care',
      },
    };

    // Generate output file based on format
    let outputContent: string;
    let filename: string;

    switch (outputFormat) {
      case 'cloverleaf-xlt':
        outputContent = this.generateCloverleafXLT(table, includeComments);
        filename = `${name.replace(/\s+/g, '_')}.xlt`;
        break;
      case 'json':
        outputContent = this.generateJSON(table, includeComments);
        filename = `${name.replace(/\s+/g, '_')}.json`;
        break;
      case 'csv':
        outputContent = this.generateCSV(table, includeComments);
        filename = `${name.replace(/\s+/g, '_')}.csv`;
        break;
      case 'xml':
        outputContent = this.generateXML(table, includeComments);
        filename = `${name.replace(/\s+/g, '_')}.xml`;
        break;
      case 'properties':
        outputContent = this.generateProperties(table, includeComments);
        filename = `${name.replace(/\s+/g, '_')}.properties`;
        break;
      default:
        outputContent = this.generateJSON(table, includeComments);
        filename = `${name.replace(/\s+/g, '_')}.json`;
    }

    return {
      id: uuidv4(),
      table,
      outputFile: {
        filename,
        content: outputContent,
        format: outputFormat,
      },
      statistics: {
        totalEntries: entries.length,
        categories: categories.size,
        duplicateKeys,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  private generateCloverleafXLT(table: TranslationTable, includeComments: boolean): string {
    let output = '';

    if (includeComments) {
      output += `# Cloverleaf Translation Table\n`;
      output += `# Name: ${table.name}\n`;
      output += `# Description: ${table.description}\n`;
      output += `# Source: ${table.sourceSystem} -> Target: ${table.targetSystem}\n`;
      output += `# Generated: ${table.metadata.lastModified}\n`;
      output += `# Version: ${table.metadata.version}\n`;
      output += `#\n`;
    }

    // Group by category if present
    const byCategory: Record<string, TranslationTableEntry[]> = {};
    table.entries.forEach(entry => {
      const cat = entry.category || 'default';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(entry);
    });

    for (const [category, categoryEntries] of Object.entries(byCategory)) {
      if (includeComments && category !== 'default') {
        output += `\n# Category: ${category}\n`;
      }

      categoryEntries.forEach(entry => {
        if (includeComments && entry.description) {
          output += `# ${entry.description}\n`;
        }
        output += `${entry.key}\t${entry.value}\n`;
      });
    }

    return output;
  }

  private generateJSON(table: TranslationTable, includeComments: boolean): string {
    const jsonOutput: any = {
      name: table.name,
      description: table.description,
      sourceSystem: table.sourceSystem,
      targetSystem: table.targetSystem,
      version: table.metadata.version,
      lastModified: table.metadata.lastModified,
      mappings: {},
    };

    if (includeComments) {
      jsonOutput._comments = table.entries
        .filter(e => e.description)
        .reduce((acc, e) => {
          acc[e.key] = e.description!;
          return acc;
        }, {} as Record<string, string>);
    }

    table.entries.forEach(entry => {
      jsonOutput.mappings[entry.key] = entry.value;
    });

    return JSON.stringify(jsonOutput, null, 2);
  }

  private generateCSV(table: TranslationTable, includeComments: boolean): string {
    let output = '';

    if (includeComments) {
      output += `# ${table.name} - ${table.description}\n`;
      output += `# ${table.sourceSystem} -> ${table.targetSystem}\n`;
    }

    output += 'key,value,description,category\n';

    table.entries.forEach(entry => {
      const desc = (entry.description || '').replace(/"/g, '""');
      const cat = (entry.category || '').replace(/"/g, '""');
      output += `"${entry.key}","${entry.value}","${desc}","${cat}"\n`;
    });

    return output;
  }

  private generateXML(table: TranslationTable, includeComments: boolean): string {
    let output = '<?xml version="1.0" encoding="UTF-8"?>\n';

    if (includeComments) {
      output += `<!-- Translation Table: ${table.name} -->\n`;
      output += `<!-- ${table.description} -->\n`;
      output += `<!-- ${table.sourceSystem} -> ${table.targetSystem} -->\n`;
    }

    output += '<translationTable>\n';
    output += `  <name>${this.escapeXml(table.name)}</name>\n`;
    output += `  <description>${this.escapeXml(table.description)}</description>\n`;
    output += `  <sourceSystem>${this.escapeXml(table.sourceSystem)}</sourceSystem>\n`;
    output += `  <targetSystem>${this.escapeXml(table.targetSystem)}</targetSystem>\n`;
    output += `  <version>${table.metadata.version}</version>\n`;
    output += '  <entries>\n';

    table.entries.forEach(entry => {
      output += '    <entry>\n';
      output += `      <key>${this.escapeXml(entry.key)}</key>\n`;
      output += `      <value>${this.escapeXml(entry.value)}</value>\n`;
      if (entry.description) {
        output += `      <description>${this.escapeXml(entry.description)}</description>\n`;
      }
      if (entry.category) {
        output += `      <category>${this.escapeXml(entry.category)}</category>\n`;
      }
      output += '    </entry>\n';
    });

    output += '  </entries>\n';
    output += '</translationTable>\n';

    return output;
  }

  private generateProperties(table: TranslationTable, includeComments: boolean): string {
    let output = '';

    if (includeComments) {
      output += `# Translation Table: ${table.name}\n`;
      output += `# ${table.description}\n`;
      output += `# Source: ${table.sourceSystem}\n`;
      output += `# Target: ${table.targetSystem}\n`;
      output += `# Generated: ${table.metadata.lastModified}\n`;
      output += '\n';
    }

    table.entries.forEach(entry => {
      if (includeComments && entry.description) {
        output += `# ${entry.description}\n`;
      }
      // Escape special characters in properties format
      const key = entry.key.replace(/[=:]/g, '\\$&');
      const value = entry.value.replace(/\\/g, '\\\\');
      output += `${key}=${value}\n`;
    });

    return output;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  getSampleEntries(): Array<{ key: string; value: string; description?: string; category?: string }> {
    return [
      { key: 'M', value: 'Male', description: 'Male gender', category: 'Gender' },
      { key: 'F', value: 'Female', description: 'Female gender', category: 'Gender' },
      { key: 'U', value: 'Unknown', description: 'Unknown gender', category: 'Gender' },
      { key: 'I', value: 'Inpatient', description: 'Inpatient class', category: 'Patient Class' },
      { key: 'O', value: 'Outpatient', description: 'Outpatient class', category: 'Patient Class' },
      { key: 'E', value: 'Emergency', description: 'Emergency class', category: 'Patient Class' },
      { key: 'A01', value: 'Admit', description: 'ADT Admit event', category: 'Event Type' },
      { key: 'A02', value: 'Transfer', description: 'ADT Transfer event', category: 'Event Type' },
      { key: 'A03', value: 'Discharge', description: 'ADT Discharge event', category: 'Event Type' },
    ];
  }
}
