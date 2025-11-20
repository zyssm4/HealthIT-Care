import {
  ConfigFile,
  ConfigDiff,
  ConfigDiffRequest,
  ConfigDiffResponse,
} from '@healthit-care/shared';
import { v4 as uuidv4 } from 'uuid';

export async function compareConfigs(request: ConfigDiffRequest): Promise<ConfigDiffResponse> {
  const id = uuidv4();

  const sourceLines = parseConfig(request.sourceConfig, request.ignoreWhitespace, request.ignoreComments);
  const targetLines = parseConfig(request.targetConfig, request.ignoreWhitespace, request.ignoreComments);

  const differences = findDifferences(sourceLines, targetLines);
  const summary = {
    added: differences.filter(d => d.changeType === 'added').length,
    removed: differences.filter(d => d.changeType === 'removed').length,
    modified: differences.filter(d => d.changeType === 'modified').length,
    unchanged: Math.max(Object.keys(sourceLines).length, Object.keys(targetLines).length) - differences.length,
  };

  const migrationScript = generateMigrationScript(differences, request.sourceConfig, request.targetConfig);
  const report = generateReport(differences, request, summary);

  return {
    id,
    differences,
    summary,
    migrationScript,
    report,
    generatedAt: new Date().toISOString(),
  };
}

function parseConfig(
  config: ConfigFile,
  ignoreWhitespace: boolean,
  ignoreComments: boolean
): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = config.content.split('\n');

  if (config.type === 'properties' || config.type === 'tcl') {
    lines.forEach((line, idx) => {
      let processedLine = line;

      if (ignoreWhitespace) {
        processedLine = processedLine.trim();
      }

      if (ignoreComments) {
        // Remove comments based on file type
        if (config.type === 'properties') {
          processedLine = processedLine.replace(/#.*$/, '').trim();
        } else if (config.type === 'tcl') {
          processedLine = processedLine.replace(/#.*$/, '').trim();
        }
      }

      if (processedLine) {
        // Parse key-value pairs
        const match = processedLine.match(/^([^=]+)=(.*)$/);
        if (match) {
          result[match[1].trim()] = match[2].trim();
        } else if (config.type === 'tcl') {
          // TCL set commands
          const setMatch = processedLine.match(/^set\s+(\w+)\s+(.*)$/);
          if (setMatch) {
            result[setMatch[1]] = setMatch[2].replace(/[{}]/g, '').trim();
          } else {
            result[`line_${idx}`] = processedLine;
          }
        } else {
          result[`line_${idx}`] = processedLine;
        }
      }
    });
  } else if (config.type === 'json') {
    try {
      const parsed = JSON.parse(config.content);
      flattenObject(parsed, '', result);
    } catch {
      result['_parse_error'] = 'Invalid JSON';
    }
  } else if (config.type === 'xml' || config.type === 'xlt') {
    // Simplified XML parsing - extract key elements
    const elementRegex = /<(\w+)[^>]*>([^<]*)<\/\1>/g;
    let match;
    while ((match = elementRegex.exec(config.content)) !== null) {
      const key = match[1];
      const value = match[2].trim();
      if (value) {
        if (result[key]) {
          // Handle multiple same-named elements
          let counter = 1;
          while (result[`${key}_${counter}`]) counter++;
          result[`${key}_${counter}`] = value;
        } else {
          result[key] = value;
        }
      }
    }
  }

  return result;
}

function flattenObject(obj: any, prefix: string, result: Record<string, string>): void {
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      flattenObject(obj[key], newKey, result);
    } else {
      result[newKey] = JSON.stringify(obj[key]);
    }
  }
}

function findDifferences(
  source: Record<string, string>,
  target: Record<string, string>
): ConfigDiff[] {
  const differences: ConfigDiff[] = [];
  const allKeys = new Set([...Object.keys(source), ...Object.keys(target)]);

  for (const key of allKeys) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (sourceValue === undefined && targetValue !== undefined) {
      differences.push({
        field: key,
        sourceValue: '',
        targetValue,
        changeType: 'added',
        impact: assessImpact(key, '', targetValue),
      });
    } else if (sourceValue !== undefined && targetValue === undefined) {
      differences.push({
        field: key,
        sourceValue,
        targetValue: '',
        changeType: 'removed',
        impact: assessImpact(key, sourceValue, ''),
      });
    } else if (sourceValue !== targetValue) {
      differences.push({
        field: key,
        sourceValue: sourceValue || '',
        targetValue: targetValue || '',
        changeType: 'modified',
        impact: assessImpact(key, sourceValue || '', targetValue || ''),
      });
    }
  }

  return differences.sort((a, b) => {
    const impactOrder = { high: 0, medium: 1, low: 2 };
    return impactOrder[a.impact] - impactOrder[b.impact];
  });
}

function assessImpact(key: string, oldValue: string, newValue: string): 'low' | 'medium' | 'high' {
  // High impact patterns
  const highImpactPatterns = [
    /host/i, /port/i, /password/i, /secret/i, /key/i, /credential/i,
    /database/i, /connection/i, /endpoint/i, /url/i, /timeout/i,
  ];

  // Medium impact patterns
  const mediumImpactPatterns = [
    /path/i, /dir/i, /file/i, /name/i, /id/i, /version/i,
    /format/i, /encoding/i, /charset/i,
  ];

  for (const pattern of highImpactPatterns) {
    if (pattern.test(key)) return 'high';
  }

  for (const pattern of mediumImpactPatterns) {
    if (pattern.test(key)) return 'medium';
  }

  return 'low';
}

function generateMigrationScript(
  differences: ConfigDiff[],
  source: ConfigFile,
  target: ConfigFile
): string {
  let script = `#!/bin/bash\n`;
  script += `# Migration Script: ${source.environment} -> ${target.environment}\n`;
  script += `# Generated: ${new Date().toISOString()}\n`;
  script += `# Config Type: ${source.type}\n\n`;

  script += `echo "Starting configuration migration..."\n\n`;

  if (differences.length === 0) {
    script += `echo "No differences found. Configurations are identical."\n`;
    return script;
  }

  script += `# High Impact Changes (review carefully)\n`;
  const highImpact = differences.filter(d => d.impact === 'high');
  if (highImpact.length > 0) {
    script += `echo "WARNING: ${highImpact.length} high-impact changes detected"\n`;
    highImpact.forEach(diff => {
      script += `# ${diff.changeType.toUpperCase()}: ${diff.field}\n`;
      if (diff.changeType === 'removed') {
        script += `# OLD: ${diff.sourceValue}\n`;
      } else if (diff.changeType === 'added') {
        script += `# NEW: ${diff.targetValue}\n`;
      } else {
        script += `# OLD: ${diff.sourceValue}\n`;
        script += `# NEW: ${diff.targetValue}\n`;
      }
      script += `\n`;
    });
  }

  script += `\n# Apply changes\n`;

  if (source.type === 'properties') {
    differences.forEach(diff => {
      if (diff.changeType === 'added' || diff.changeType === 'modified') {
        script += `# Set ${diff.field}\n`;
        script += `sed -i 's/^${diff.field}=.*/${diff.field}=${diff.targetValue.replace(/\//g, '\\/')}/' config.properties\n`;
      } else if (diff.changeType === 'removed') {
        script += `# Remove ${diff.field}\n`;
        script += `sed -i '/^${diff.field}=/d' config.properties\n`;
      }
    });
  } else {
    script += `# Manual review required for ${source.type} file type\n`;
    script += `# Please apply the following changes manually:\n`;
    differences.forEach(diff => {
      script += `#   ${diff.changeType}: ${diff.field} = ${diff.targetValue || '(removed)'}\n`;
    });
  }

  script += `\necho "Migration script completed. Please verify all changes."\n`;

  return script;
}

function generateReport(
  differences: ConfigDiff[],
  request: ConfigDiffRequest,
  summary: { added: number; removed: number; modified: number; unchanged: number }
): string {
  let report = `# Configuration Comparison Report\n\n`;
  report += `## Overview\n\n`;
  report += `| Property | Value |\n`;
  report += `|----------|-------|\n`;
  report += `| Source Config | ${request.sourceConfig.name} (${request.sourceConfig.environment}) |\n`;
  report += `| Target Config | ${request.targetConfig.name} (${request.targetConfig.environment}) |\n`;
  report += `| File Type | ${request.sourceConfig.type} |\n`;
  report += `| Generated | ${new Date().toISOString()} |\n\n`;

  report += `## Summary\n\n`;
  report += `| Change Type | Count |\n`;
  report += `|-------------|-------|\n`;
  report += `| Added | ${summary.added} |\n`;
  report += `| Removed | ${summary.removed} |\n`;
  report += `| Modified | ${summary.modified} |\n`;
  report += `| Unchanged | ${summary.unchanged} |\n`;
  report += `| **Total Changes** | **${summary.added + summary.removed + summary.modified}** |\n\n`;

  if (differences.length === 0) {
    report += `## Result\n\nNo differences found. Configurations are identical.\n`;
    return report;
  }

  report += `## Changes by Impact\n\n`;

  const byImpact: Record<string, ConfigDiff[]> = {
    high: differences.filter(d => d.impact === 'high'),
    medium: differences.filter(d => d.impact === 'medium'),
    low: differences.filter(d => d.impact === 'low'),
  };

  for (const [impact, diffs] of Object.entries(byImpact)) {
    if (diffs.length > 0) {
      report += `### ${impact.charAt(0).toUpperCase() + impact.slice(1)} Impact (${diffs.length})\n\n`;
      report += `| Field | Change | Source Value | Target Value |\n`;
      report += `|-------|--------|--------------|---------------|\n`;
      diffs.forEach(diff => {
        report += `| ${diff.field} | ${diff.changeType} | ${diff.sourceValue || '-'} | ${diff.targetValue || '-'} |\n`;
      });
      report += `\n`;
    }
  }

  report += `## Recommendations\n\n`;

  if (byImpact.high.length > 0) {
    report += `- **Review high-impact changes carefully** before deploying to ${request.targetConfig.environment}\n`;
    report += `- Test in a staging environment first\n`;
  }

  if (byImpact.high.some(d => d.field.toLowerCase().includes('password') || d.field.toLowerCase().includes('secret'))) {
    report += `- **Security**: Credential changes detected - ensure secure handling\n`;
  }

  report += `- Backup current configuration before applying changes\n`;
  report += `- Monitor system after deployment for any issues\n`;

  return report;
}
