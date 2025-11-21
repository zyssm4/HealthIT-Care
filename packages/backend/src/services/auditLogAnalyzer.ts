import { v4 as uuidv4 } from 'uuid';
import {
  LogAnalysisRequest,
  LogAnalysisResponse,
  LogEntry,
  LogPattern,
  LogSource,
} from '@healthit-care/shared';

export class AuditLogAnalyzerService {
  analyze(request: LogAnalysisRequest): LogAnalysisResponse {
    const { logs, source, filterLevel, filterInterface, groupBy } = request;

    // Parse log entries based on source format
    let entries = this.parseLogEntries(logs, source);

    // Apply filters
    if (filterLevel && filterLevel.length > 0) {
      entries = entries.filter(e => filterLevel.includes(e.level));
    }

    if (filterInterface) {
      entries = entries.filter(e => e.interface === filterInterface);
    }

    // Calculate summary
    const summary = this.calculateSummary(entries);

    // Find patterns
    const patterns = this.findPatterns(entries);

    // Analyze errors
    const errors = this.analyzeErrors(entries);

    // Generate timeline
    const timeline = this.generateTimeline(entries, groupBy);

    // Generate report
    const report = this.generateReport(summary, patterns, errors);

    return {
      id: uuidv4(),
      entries,
      summary,
      patterns,
      errors,
      timeline,
      report,
      generatedAt: new Date().toISOString(),
    };
  }

  private parseLogEntries(logs: string, source: LogSource): LogEntry[] {
    const lines = logs.split('\n').filter(line => line.trim());
    const entries: LogEntry[] = [];

    lines.forEach(line => {
      const entry = this.parseLogLine(line, source);
      if (entry) {
        entries.push(entry);
      }
    });

    return entries;
  }

  private parseLogLine(line: string, source: LogSource): LogEntry | null {
    try {
      switch (source) {
        case 'cloverleaf':
          return this.parseCloverleafLog(line);
        case 'mirth':
          return this.parseMirthLog(line);
        case 'syslog':
          return this.parseSyslog(line);
        case 'generic':
        default:
          return this.parseGenericLog(line);
      }
    } catch {
      return null;
    }
  }

  private parseCloverleafLog(line: string): LogEntry | null {
    // Cloverleaf format: YYYY-MM-DD HH:MM:SS LEVEL [PROCESS] MESSAGE
    const match = line.match(/^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(DEBUG|INFO|WARN|ERROR|FATAL)\s+\[([^\]]+)\]\s+(.+)$/);
    if (!match) return this.parseGenericLog(line);

    const [, timestamp, level, source, message] = match;
    const interfaceMatch = message.match(/interface[:\s]+(\w+)/i);
    const msgIdMatch = message.match(/msg[_\s]?id[:\s]+(\w+)/i);

    return {
      timestamp,
      level: level as LogEntry['level'],
      source,
      message,
      interface: interfaceMatch?.[1],
      messageId: msgIdMatch?.[1],
    };
  }

  private parseMirthLog(line: string): LogEntry | null {
    // Mirth format: [YYYY-MM-DD HH:MM:SS,mmm] LEVEL  (ChannelName): MESSAGE
    const match = line.match(/^\[(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2},\d{3})\]\s+(DEBUG|INFO|WARN|ERROR|FATAL)\s+\(([^)]+)\):\s+(.+)$/);
    if (!match) return this.parseGenericLog(line);

    const [, timestamp, level, channel, message] = match;

    return {
      timestamp: timestamp.replace(',', '.'),
      level: level as LogEntry['level'],
      source: 'Mirth',
      message,
      interface: channel,
    };
  }

  private parseSyslog(line: string): LogEntry | null {
    // Syslog format: Mon DD HH:MM:SS hostname process[pid]: MESSAGE
    const match = line.match(/^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+(\S+)\[(\d+)\]:\s+(.+)$/);
    if (!match) return this.parseGenericLog(line);

    const [, timestamp, , process, , message] = match;
    const level = this.inferLogLevel(message);

    return {
      timestamp,
      level,
      source: process,
      message,
    };
  }

  private parseGenericLog(line: string): LogEntry | null {
    // Try to extract timestamp and level from generic format
    const timestampMatch = line.match(/(\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2})/);
    const levelMatch = line.match(/\b(DEBUG|INFO|WARN(?:ING)?|ERROR|FATAL)\b/i);

    const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();
    const level = levelMatch ? this.normalizeLevel(levelMatch[1]) : 'INFO';

    return {
      timestamp,
      level,
      source: 'generic',
      message: line,
    };
  }

  private normalizeLevel(level: string): LogEntry['level'] {
    const upper = level.toUpperCase();
    if (upper === 'WARNING') return 'WARN';
    if (['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'].includes(upper)) {
      return upper as LogEntry['level'];
    }
    return 'INFO';
  }

  private inferLogLevel(message: string): LogEntry['level'] {
    const lower = message.toLowerCase();
    if (lower.includes('error') || lower.includes('exception') || lower.includes('failed')) return 'ERROR';
    if (lower.includes('warn')) return 'WARN';
    if (lower.includes('debug')) return 'DEBUG';
    return 'INFO';
  }

  private calculateSummary(entries: LogEntry[]) {
    const byLevel: Record<string, number> = {};
    const byInterface: Record<string, number> = {};
    let minTime = entries[0]?.timestamp;
    let maxTime = entries[0]?.timestamp;

    entries.forEach(entry => {
      byLevel[entry.level] = (byLevel[entry.level] || 0) + 1;

      if (entry.interface) {
        byInterface[entry.interface] = (byInterface[entry.interface] || 0) + 1;
      }

      if (entry.timestamp < minTime) minTime = entry.timestamp;
      if (entry.timestamp > maxTime) maxTime = entry.timestamp;
    });

    return {
      totalEntries: entries.length,
      byLevel,
      byInterface,
      timeRange: {
        start: minTime || '',
        end: maxTime || '',
      },
    };
  }

  private findPatterns(entries: LogEntry[]): LogPattern[] {
    const messageGroups: Record<string, LogEntry[]> = {};

    // Group similar messages
    entries.forEach(entry => {
      // Normalize message for grouping (remove specific values)
      const normalized = entry.message
        .replace(/\b\d+\b/g, 'N')
        .replace(/\b[A-F0-9]{8,}\b/gi, 'ID')
        .replace(/\d{4}-\d{2}-\d{2}/g, 'DATE');

      if (!messageGroups[normalized]) {
        messageGroups[normalized] = [];
      }
      messageGroups[normalized].push(entry);
    });

    // Convert to patterns (only groups with multiple occurrences)
    const patterns: LogPattern[] = [];

    Object.entries(messageGroups)
      .filter(([, group]) => group.length > 1)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10)
      .forEach(([name, group]) => {
        const hasErrors = group.some(e => ['ERROR', 'FATAL'].includes(e.level));
        const hasWarnings = group.some(e => e.level === 'WARN');

        patterns.push({
          name: name.substring(0, 100),
          count: group.length,
          firstOccurrence: group[0].timestamp,
          lastOccurrence: group[group.length - 1].timestamp,
          sampleMessages: group.slice(0, 3).map(e => e.message),
          severity: hasErrors ? 'critical' : hasWarnings ? 'warning' : 'info',
        });
      });

    return patterns;
  }

  private analyzeErrors(entries: LogEntry[]) {
    const errorEntries = entries.filter(e => ['ERROR', 'FATAL'].includes(e.level));
    const errorGroups: Record<string, { count: number; lastOccurrence: string }> = {};

    errorEntries.forEach(entry => {
      const key = entry.message.substring(0, 100);
      if (!errorGroups[key]) {
        errorGroups[key] = { count: 0, lastOccurrence: entry.timestamp };
      }
      errorGroups[key].count++;
      if (entry.timestamp > errorGroups[key].lastOccurrence) {
        errorGroups[key].lastOccurrence = entry.timestamp;
      }
    });

    const topErrors = Object.entries(errorGroups)
      .map(([message, data]) => ({ message, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      count: errorEntries.length,
      topErrors,
    };
  }

  private generateTimeline(entries: LogEntry[], groupBy?: string) {
    const buckets: Record<string, { count: number; errors: number }> = {};

    entries.forEach(entry => {
      let key: string;
      const date = new Date(entry.timestamp);

      switch (groupBy) {
        case 'hour':
          key = `${date.toISOString().substring(0, 13)}:00`;
          break;
        case 'day':
          key = date.toISOString().substring(0, 10);
          break;
        default:
          // Default to hour
          key = `${date.toISOString().substring(0, 13)}:00`;
      }

      if (!buckets[key]) {
        buckets[key] = { count: 0, errors: 0 };
      }
      buckets[key].count++;
      if (['ERROR', 'FATAL'].includes(entry.level)) {
        buckets[key].errors++;
      }
    });

    return Object.entries(buckets)
      .map(([timestamp, data]) => ({ timestamp, ...data }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  private generateReport(
    summary: any,
    patterns: LogPattern[],
    errors: any
  ): string {
    let report = '# Audit Log Analysis Report\n\n';

    report += '## Summary\n\n';
    report += `- **Total Entries**: ${summary.totalEntries}\n`;
    report += `- **Time Range**: ${summary.timeRange.start} to ${summary.timeRange.end}\n`;
    report += `- **Error Count**: ${errors.count}\n\n`;

    report += '### By Log Level\n\n';
    Object.entries(summary.byLevel).forEach(([level, count]) => {
      report += `- ${level}: ${count}\n`;
    });

    if (Object.keys(summary.byInterface).length > 0) {
      report += '\n### By Interface\n\n';
      Object.entries(summary.byInterface).forEach(([iface, count]) => {
        report += `- ${iface}: ${count}\n`;
      });
    }

    if (errors.topErrors.length > 0) {
      report += '\n## Top Errors\n\n';
      errors.topErrors.slice(0, 5).forEach((err: any, idx: number) => {
        report += `${idx + 1}. **${err.message}** (${err.count} occurrences)\n`;
        report += `   Last seen: ${err.lastOccurrence}\n\n`;
      });
    }

    if (patterns.length > 0) {
      report += '\n## Patterns Detected\n\n';
      patterns.slice(0, 5).forEach((pattern, idx) => {
        report += `${idx + 1}. **${pattern.name.substring(0, 50)}...** (${pattern.count} occurrences)\n`;
        report += `   Severity: ${pattern.severity}\n\n`;
      });
    }

    return report;
  }

  getSampleLogs(): string {
    return `2023-11-20 10:15:30 INFO [ADT_INBOUND] Received ADT^A01 message, msg_id: MSG001
2023-11-20 10:15:31 INFO [ADT_INBOUND] Processing patient admit for MRN: 12345
2023-11-20 10:15:32 INFO [ADT_INBOUND] Message routed to downstream systems
2023-11-20 10:16:45 WARN [LAB_OUTBOUND] Slow response from Lab system (2500ms)
2023-11-20 10:17:00 ERROR [ADT_INBOUND] Connection timeout to Epic ADT interface
2023-11-20 10:17:05 INFO [ADT_INBOUND] Retry attempt 1 of 3
2023-11-20 10:17:10 INFO [ADT_INBOUND] Connection restored
2023-11-20 10:18:00 ERROR [ORU_INBOUND] Failed to parse HL7 message: Invalid MSH segment
2023-11-20 10:18:01 INFO [ORU_INBOUND] Message moved to error queue
2023-11-20 10:20:15 INFO [ADT_INBOUND] Received ADT^A03 message, msg_id: MSG002
2023-11-20 10:20:16 INFO [ADT_INBOUND] Processing patient discharge
2023-11-20 10:25:00 WARN [LAB_OUTBOUND] Message queue depth: 150 (threshold: 100)
2023-11-20 10:30:00 INFO [SYSTEM] Scheduled maintenance check completed
2023-11-20 10:35:00 ERROR [ADT_INBOUND] Connection timeout to Epic ADT interface
2023-11-20 10:35:05 ERROR [ADT_INBOUND] Retry attempt 1 of 3 failed
2023-11-20 10:35:10 ERROR [ADT_INBOUND] Retry attempt 2 of 3 failed
2023-11-20 10:35:15 INFO [ADT_INBOUND] Connection restored on attempt 3`;
  }
}
