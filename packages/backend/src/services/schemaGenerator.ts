import { v4 as uuidv4 } from 'uuid';
import {
  SchemaRequest,
  SchemaResponse,
  SchemaExplanation,
  SchemaWarning,
  SchemaSuggestion,
  SchemaMetadata,
  TableDefinition,
  ColumnDefinition,
  SchemaOptions,
  HEALTHCARE_TEMPLATES,
} from '@healthit-care/shared';

export class SchemaGeneratorService {
  generateSchema(request: SchemaRequest): SchemaResponse {
    const tables: TableDefinition[] = request.mode === 'requirements'
      ? this.parseRequirements(request.input, request.options)
      : this.parseExistingSchema(request.input, request.additionalRequests, request.options);

    const generatedSchema = this.generateDDL(tables, request.options);
    const explanations = this.generateExplanations(tables, request.options);
    const warnings = this.generateWarnings(tables, request.options);
    const suggestions = this.generateSuggestions(tables, request.options);
    const metadata = this.calculateMetadata(tables);

    return {
      id: request.id || uuidv4(),
      request,
      generatedSchema,
      explanations,
      warnings,
      suggestions,
      metadata,
      createdAt: new Date().toISOString(),
    };
  }

  private parseRequirements(requirements: string, options: SchemaOptions): TableDefinition[] {
    const tables: TableDefinition[] = [];
    const lines = requirements.split('\n').filter(l => l.trim());

    let currentTable: TableDefinition | null = null;

    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();

      // Detect table definitions
      if (trimmed.includes('table') || trimmed.includes('entity') || trimmed.match(/^[a-z_]+:$/)) {
        if (currentTable) {
          tables.push(this.enhanceTable(currentTable, options));
        }

        const tableName = this.extractTableName(line, options.namingConvention);
        currentTable = {
          name: tableName,
          columns: [],
          indexes: [],
          foreignKeys: [],
        };
      }
      // Detect column definitions
      else if (currentTable && (trimmed.includes(':') || trimmed.includes('-'))) {
        const column = this.parseColumnRequirement(line, options);
        if (column) {
          currentTable.columns.push(column);
        }
      }
      // Detect relationships
      else if (trimmed.includes('reference') || trimmed.includes('foreign') || trimmed.includes('relates')) {
        if (currentTable) {
          const fk = this.parseRelationship(line, currentTable.name);
          if (fk) {
            currentTable.foreignKeys = currentTable.foreignKeys || [];
            currentTable.foreignKeys.push(fk);
          }
        }
      }
    }

    if (currentTable) {
      tables.push(this.enhanceTable(currentTable, options));
    }

    // If no tables were parsed, create a default based on common patterns
    if (tables.length === 0) {
      return this.generateFromFreeformRequirements(requirements, options);
    }

    return tables;
  }

  private parseExistingSchema(
    schema: string,
    additionalRequests: string | undefined,
    options: SchemaOptions
  ): TableDefinition[] {
    const tables = this.extractTablesFromSQL(schema);

    // Apply additional requests/modifications
    if (additionalRequests) {
      this.applyModifications(tables, additionalRequests, options);
    }

    // Enhance with healthcare compliance
    return tables.map(table => this.enhanceTable(table, options));
  }

  private extractTablesFromSQL(sql: string): TableDefinition[] {
    const tables: TableDefinition[] = [];
    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"]?(\w+)[`"]?\s*\(([\s\S]*?)\);/gi;

    let match;
    while ((match = createTableRegex.exec(sql)) !== null) {
      const tableName = match[1];
      const columnsStr = match[2];

      const columns = this.parseColumnsFromSQL(columnsStr);

      tables.push({
        name: tableName,
        columns,
        indexes: [],
        foreignKeys: [],
      });
    }

    return tables;
  }

  private parseColumnsFromSQL(columnsStr: string): ColumnDefinition[] {
    const columns: ColumnDefinition[] = [];
    const lines = columnsStr.split(',').map(l => l.trim()).filter(l => l);

    for (const line of lines) {
      // Skip constraints
      if (line.toUpperCase().match(/^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT)/)) {
        continue;
      }

      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        const name = parts[0].replace(/[`"]/g, '');
        const dataType = parts[1];

        columns.push({
          name,
          dataType,
          nullable: !line.toUpperCase().includes('NOT NULL'),
          isPrimaryKey: line.toUpperCase().includes('PRIMARY KEY'),
          isUnique: line.toUpperCase().includes('UNIQUE'),
        });
      }
    }

    return columns;
  }

  private enhanceTable(table: TableDefinition, options: SchemaOptions): TableDefinition {
    const enhanced = { ...table };

    // Add ID if not present
    if (!enhanced.columns.find(c => c.name === 'id')) {
      enhanced.columns.unshift({
        name: 'id',
        dataType: options.databaseType === 'postgresql' ? 'UUID' : 'CHAR(36)',
        nullable: false,
        isPrimaryKey: true,
        comment: 'Primary key identifier',
      });
    }

    // Add audit fields
    if (options.includeAuditFields) {
      const auditFields: ColumnDefinition[] = [
        {
          name: this.formatName('created_at', options.namingConvention),
          dataType: 'TIMESTAMP',
          nullable: false,
          defaultValue: 'CURRENT_TIMESTAMP',
          comment: 'Record creation timestamp',
        },
        {
          name: this.formatName('created_by', options.namingConvention),
          dataType: 'VARCHAR(255)',
          nullable: false,
          comment: 'User who created the record',
        },
        {
          name: this.formatName('updated_at', options.namingConvention),
          dataType: 'TIMESTAMP',
          nullable: false,
          defaultValue: 'CURRENT_TIMESTAMP',
          comment: 'Last update timestamp',
        },
        {
          name: this.formatName('updated_by', options.namingConvention),
          dataType: 'VARCHAR(255)',
          nullable: true,
          comment: 'User who last updated the record',
        },
        {
          name: 'version',
          dataType: 'INTEGER',
          nullable: false,
          defaultValue: '1',
          comment: 'Optimistic locking version',
        },
      ];

      enhanced.columns.push(...auditFields.filter(af =>
        !enhanced.columns.find(c => c.name === af.name)
      ));
    }

    // Add soft delete fields
    if (options.includeSoftDelete) {
      const softDeleteFields: ColumnDefinition[] = [
        {
          name: this.formatName('is_deleted', options.namingConvention),
          dataType: 'BOOLEAN',
          nullable: false,
          defaultValue: 'FALSE',
          comment: 'Soft delete flag',
        },
        {
          name: this.formatName('deleted_at', options.namingConvention),
          dataType: 'TIMESTAMP',
          nullable: true,
          comment: 'Deletion timestamp',
        },
        {
          name: this.formatName('deleted_by', options.namingConvention),
          dataType: 'VARCHAR(255)',
          nullable: true,
          comment: 'User who deleted the record',
        },
      ];

      enhanced.columns.push(...softDeleteFields.filter(sf =>
        !enhanced.columns.find(c => c.name === sf.name)
      ));
    }

    // Add indexes
    if (options.includeIndexes) {
      enhanced.indexes = enhanced.indexes || [];

      // Index on created_at for time-based queries
      if (options.includeAuditFields) {
        enhanced.indexes.push({
          name: `idx_${table.name}_created_at`,
          columns: [this.formatName('created_at', options.namingConvention)],
        });
      }

      // Index on is_deleted for soft delete queries
      if (options.includeSoftDelete) {
        enhanced.indexes.push({
          name: `idx_${table.name}_is_deleted`,
          columns: [this.formatName('is_deleted', options.namingConvention)],
        });
      }
    }

    // Mark PHI fields with encryption markers
    if (options.includeEncryptionMarkers) {
      this.markPHIFields(enhanced);
    }

    return enhanced;
  }

  private markPHIFields(table: TableDefinition): void {
    const phiPatterns = [
      'ssn', 'social_security', 'name', 'first_name', 'last_name',
      'address', 'phone', 'email', 'dob', 'date_of_birth', 'birth_date',
      'mrn', 'medical_record', 'patient_id', 'insurance', 'diagnosis',
    ];

    for (const column of table.columns) {
      const nameLower = column.name.toLowerCase();
      if (phiPatterns.some(pattern => nameLower.includes(pattern))) {
        column.encryptionMarker = {
          field: column.name,
          encryptionType: 'PHI',
          algorithm: 'AES-256-GCM',
        };
        column.comment = (column.comment || '') + ' [ENCRYPTED - PHI]';
      }
    }
  }

  private generateDDL(tables: TableDefinition[], options: SchemaOptions): string {
    let ddl = '';

    ddl += `-- Healthcare Database Schema\n`;
    ddl += `-- Generated: ${new Date().toISOString()}\n`;
    ddl += `-- Database: ${options.databaseType.toUpperCase()}\n`;
    ddl += `-- Compliance: ${options.healthcareCompliance ? 'Healthcare (HIPAA)' : 'Standard'}\n\n`;

    for (const table of tables) {
      ddl += this.generateTableDDL(table, options);
      ddl += '\n';
    }

    return ddl;
  }

  private generateTableDDL(table: TableDefinition, options: SchemaOptions): string {
    let ddl = '';

    if (options.includeComments && table.comment) {
      ddl += `-- ${table.comment}\n`;
    }

    ddl += `CREATE TABLE ${table.name} (\n`;

    const columnDefs: string[] = [];

    for (const column of table.columns) {
      let colDef = `  ${column.name} ${column.dataType}`;

      if (!column.nullable) {
        colDef += ' NOT NULL';
      }

      if (column.defaultValue) {
        colDef += ` DEFAULT ${column.defaultValue}`;
      }

      if (column.isUnique) {
        colDef += ' UNIQUE';
      }

      if (options.includeComments && column.comment) {
        if (options.databaseType === 'mysql') {
          colDef += ` COMMENT '${column.comment}'`;
        }
      }

      columnDefs.push(colDef);
    }

    // Primary key
    const pkColumns = table.columns.filter(c => c.isPrimaryKey).map(c => c.name);
    if (pkColumns.length > 0) {
      columnDefs.push(`  PRIMARY KEY (${pkColumns.join(', ')})`);
    }

    // Foreign keys
    if (table.foreignKeys) {
      for (const fk of table.foreignKeys) {
        columnDefs.push(
          `  CONSTRAINT ${fk.name} FOREIGN KEY (${fk.columns.join(', ')}) ` +
          `REFERENCES ${fk.referencedTable} (${fk.referencedColumns.join(', ')})` +
          (fk.onDelete ? ` ON DELETE ${fk.onDelete}` : '') +
          (fk.onUpdate ? ` ON UPDATE ${fk.onUpdate}` : '')
        );
      }
    }

    ddl += columnDefs.join(',\n');
    ddl += '\n);\n';

    // Indexes
    if (table.indexes) {
      for (const index of table.indexes) {
        ddl += `CREATE${index.isUnique ? ' UNIQUE' : ''} INDEX ${index.name} `;
        ddl += `ON ${table.name} (${index.columns.join(', ')});\n`;
      }
    }

    // PostgreSQL comments
    if (options.databaseType === 'postgresql' && options.includeComments) {
      for (const column of table.columns) {
        if (column.comment) {
          ddl += `COMMENT ON COLUMN ${table.name}.${column.name} IS '${column.comment}';\n`;
        }
      }
    }

    return ddl;
  }

  private generateExplanations(tables: TableDefinition[], options: SchemaOptions): SchemaExplanation[] {
    const explanations: SchemaExplanation[] = [];

    // Overall design explanation
    explanations.push({
      section: 'Schema Design Overview',
      explanation: `Generated ${tables.length} table(s) optimized for healthcare data management.`,
      reasoning: 'The schema follows healthcare industry best practices including audit trails, ' +
        'soft deletes for compliance, and encryption markers for PHI fields.',
    });

    // Audit fields explanation
    if (options.includeAuditFields) {
      explanations.push({
        section: 'Audit Fields',
        explanation: 'All tables include created_at, created_by, updated_at, updated_by, and version fields.',
        reasoning: 'HIPAA requires maintaining audit trails for all healthcare data. ' +
          'These fields track who accessed/modified records and when. ' +
          'Version field enables optimistic locking to prevent concurrent update conflicts.',
        relatedTables: tables.map(t => t.name),
      });
    }

    // Soft delete explanation
    if (options.includeSoftDelete) {
      explanations.push({
        section: 'Soft Delete Pattern',
        explanation: 'Records are never physically deleted. Instead, is_deleted flag is set to true.',
        reasoning: 'Healthcare regulations require data retention for specific periods (often 7+ years). ' +
          'Soft deletes preserve data for compliance audits while hiding from normal queries. ' +
          'This also enables data recovery if needed.',
        relatedTables: tables.map(t => t.name),
      });
    }

    // PHI encryption explanation
    if (options.includeEncryptionMarkers) {
      const phiTables = tables.filter(t =>
        t.columns.some(c => c.encryptionMarker)
      );

      if (phiTables.length > 0) {
        explanations.push({
          section: 'PHI Encryption Markers',
          explanation: 'Fields containing Protected Health Information (PHI) are marked for encryption.',
          reasoning: 'HIPAA requires PHI to be encrypted at rest and in transit. ' +
            'Fields like names, SSN, addresses, and medical records must use AES-256-GCM encryption. ' +
            'Application layer should implement the actual encryption/decryption.',
          relatedTables: phiTables.map(t => t.name),
        });
      }
    }

    // UUID explanation
    explanations.push({
      section: 'UUID Primary Keys',
      explanation: 'Using UUID instead of auto-increment integers for primary keys.',
      reasoning: 'UUIDs provide better security (non-guessable), support distributed systems, ' +
        'prevent information leakage about record counts, and enable easier data migration.',
      relatedTables: tables.map(t => t.name),
    });

    // Index explanations
    if (options.includeIndexes) {
      explanations.push({
        section: 'Index Strategy',
        explanation: 'Indexes added on timestamp and soft-delete columns.',
        reasoning: 'Time-based queries are common in healthcare (e.g., "records from last 30 days"). ' +
          'Indexing is_deleted improves query performance when filtering active records.',
        relatedTables: tables.map(t => t.name),
      });
    }

    return explanations;
  }

  private generateWarnings(tables: TableDefinition[], options: SchemaOptions): SchemaWarning[] {
    const warnings: SchemaWarning[] = [];

    // Check for missing PHI protection
    for (const table of tables) {
      const unprotectedPHI = table.columns.filter(c => {
        const nameLower = c.name.toLowerCase();
        const isPotentialPHI = ['ssn', 'name', 'address', 'phone', 'email', 'dob'].some(
          pattern => nameLower.includes(pattern)
        );
        return isPotentialPHI && !c.encryptionMarker;
      });

      if (unprotectedPHI.length > 0 && !options.includeEncryptionMarkers) {
        warnings.push({
          severity: 'high',
          message: `Table ${table.name} contains potential PHI fields without encryption markers`,
          recommendation: 'Enable encryption markers option or manually encrypt these fields',
          affectedElements: unprotectedPHI.map(c => `${table.name}.${c.name}`),
        });
      }
    }

    // Check for missing audit fields
    if (!options.includeAuditFields) {
      warnings.push({
        severity: 'high',
        message: 'Audit fields are disabled',
        recommendation: 'Healthcare applications typically require audit trails. ' +
          'Enable audit fields for HIPAA compliance.',
      });
    }

    // Check for soft delete
    if (!options.includeSoftDelete) {
      warnings.push({
        severity: 'medium',
        message: 'Soft delete is disabled',
        recommendation: 'Consider enabling soft delete for data retention compliance ' +
          'and recoverability.',
      });
    }

    // Check for large varchar
    for (const table of tables) {
      const largeVarchars = table.columns.filter(c =>
        c.dataType.toUpperCase().includes('VARCHAR') &&
        parseInt(c.dataType.match(/\d+/)?.[0] || '0') > 1000
      );

      if (largeVarchars.length > 0) {
        warnings.push({
          severity: 'low',
          message: `Table ${table.name} has very large VARCHAR columns`,
          recommendation: 'Consider using TEXT type for columns > 1000 characters',
          affectedElements: largeVarchars.map(c => `${table.name}.${c.name}`),
        });
      }
    }

    return warnings;
  }

  private generateSuggestions(tables: TableDefinition[], options: SchemaOptions): SchemaSuggestion[] {
    const suggestions: SchemaSuggestion[] = [];

    // Performance suggestions
    suggestions.push({
      type: 'performance',
      title: 'Consider partitioning for large tables',
      description: 'If tables will contain millions of records, consider time-based partitioning ' +
        '(e.g., partition by created_at month) to improve query performance.',
      implementation: options.databaseType === 'postgresql'
        ? 'CREATE TABLE table_name (...) PARTITION BY RANGE (created_at);'
        : undefined,
    });

    // Compliance suggestions
    suggestions.push({
      type: 'compliance',
      title: 'Implement row-level security',
      description: 'Add row-level security policies to restrict data access based on user roles. ' +
        'This ensures users only see data they are authorized to access.',
      implementation: options.databaseType === 'postgresql'
        ? 'ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;\n' +
          'CREATE POLICY policy_name ON table_name USING (tenant_id = current_setting(\'app.tenant_id\'));'
        : undefined,
    });

    // Best practice suggestions
    suggestions.push({
      type: 'best-practice',
      title: 'Add table-level comments',
      description: 'Document the purpose of each table for better maintainability.',
      implementation: options.databaseType === 'postgresql'
        ? 'COMMENT ON TABLE table_name IS \'Description of table purpose\';'
        : undefined,
    });

    // Security suggestions
    suggestions.push({
      type: 'security',
      title: 'Create separate schemas for different data sensitivity levels',
      description: 'Organize tables into schemas based on data classification ' +
        '(e.g., public, internal, confidential, PHI) for better access control.',
      implementation: 'CREATE SCHEMA phi;\nCREATE SCHEMA internal;\nCREATE SCHEMA public;',
    });

    // Check if any encryption is needed
    const hasEncryptedFields = tables.some(t =>
      t.columns.some(c => c.encryptionMarker)
    );

    if (hasEncryptedFields) {
      suggestions.push({
        type: 'security',
        title: 'Implement application-level encryption',
        description: 'Fields marked for encryption should be encrypted/decrypted at the application layer. ' +
          'Consider using a key management service (KMS) for encryption key rotation.',
      });
    }

    return suggestions;
  }

  private calculateMetadata(tables: TableDefinition[]): SchemaMetadata {
    let columnCount = 0;
    let indexCount = 0;
    let foreignKeyCount = 0;

    for (const table of tables) {
      columnCount += table.columns.length;
      indexCount += table.indexes?.length || 0;
      foreignKeyCount += table.foreignKeys?.length || 0;
    }

    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    if (tables.length > 10 || columnCount > 100) {
      complexity = 'complex';
    } else if (tables.length > 3 || columnCount > 30) {
      complexity = 'moderate';
    }

    // Calculate compliance score
    let complianceScore = 50; // Base score
    complianceScore += tables.every(t => t.columns.some(c => c.name.includes('created_at'))) ? 15 : 0;
    complianceScore += tables.every(t => t.columns.some(c => c.name.includes('is_deleted'))) ? 10 : 0;
    complianceScore += tables.some(t => t.columns.some(c => c.encryptionMarker)) ? 15 : 0;
    complianceScore += indexCount > 0 ? 10 : 0;

    return {
      tableCount: tables.length,
      columnCount,
      indexCount,
      foreignKeyCount,
      estimatedComplexity: complexity,
      complianceScore: Math.min(100, complianceScore),
    };
  }

  analyzeSchema(schema: string): object {
    const tables = this.extractTablesFromSQL(schema);

    return {
      tables: tables.map(t => ({
        name: t.name,
        columnCount: t.columns.length,
        columns: t.columns.map(c => ({
          name: c.name,
          dataType: c.dataType,
          nullable: c.nullable,
        })),
      })),
      summary: {
        tableCount: tables.length,
        totalColumns: tables.reduce((sum, t) => sum + t.columns.length, 0),
      },
    };
  }

  getHealthcareTemplates(): object {
    return {
      templates: Object.values(HEALTHCARE_TEMPLATES),
      descriptions: {
        patient: 'Patient demographics and identifiers',
        encounter: 'Clinical encounters and visits',
        observation: 'Clinical observations and measurements',
        medication: 'Medication orders and administration',
        practitioner: 'Healthcare providers',
        organization: 'Healthcare organizations',
        appointment: 'Scheduled appointments',
        diagnostic_report: 'Lab results and diagnostic reports',
        allergy: 'Patient allergies and intolerances',
        immunization: 'Vaccination records',
      },
    };
  }

  private extractTableName(line: string, namingConvention: string): string {
    const match = line.match(/[a-zA-Z_][a-zA-Z0-9_]*/);
    const rawName = match ? match[0] : 'unknown_table';
    return this.formatName(rawName, namingConvention);
  }

  private parseColumnRequirement(line: string, options: SchemaOptions): ColumnDefinition | null {
    const parts = line.split(/[:\-–]/);
    if (parts.length < 2) return null;

    const name = this.formatName(parts[0].trim().replace(/[^a-zA-Z0-9_]/g, '_'), options.namingConvention);
    const description = parts.slice(1).join(':').trim().toLowerCase();

    let dataType = 'VARCHAR(255)';
    let nullable = true;

    if (description.includes('id') || description.includes('identifier')) {
      dataType = options.databaseType === 'postgresql' ? 'UUID' : 'CHAR(36)';
      nullable = false;
    } else if (description.includes('date') || description.includes('time')) {
      dataType = description.includes('time') ? 'TIMESTAMP' : 'DATE';
    } else if (description.includes('number') || description.includes('count') || description.includes('integer')) {
      dataType = 'INTEGER';
    } else if (description.includes('decimal') || description.includes('amount') || description.includes('price')) {
      dataType = 'DECIMAL(10,2)';
    } else if (description.includes('boolean') || description.includes('flag') || description.includes('is_')) {
      dataType = 'BOOLEAN';
    } else if (description.includes('text') || description.includes('description') || description.includes('notes')) {
      dataType = 'TEXT';
    } else if (description.includes('email')) {
      dataType = 'VARCHAR(255)';
    } else if (description.includes('phone')) {
      dataType = 'VARCHAR(20)';
    }

    if (description.includes('required') || description.includes('mandatory') || description.includes('not null')) {
      nullable = false;
    }

    return {
      name,
      dataType,
      nullable,
      comment: parts.slice(1).join(':').trim(),
    };
  }

  private parseRelationship(line: string, tableName: string): any {
    const match = line.match(/references?\s+(\w+)/i);
    if (!match) return null;

    const referencedTable = match[1];
    return {
      name: `fk_${tableName}_${referencedTable}`,
      columns: [`${referencedTable}_id`],
      referencedTable,
      referencedColumns: ['id'],
      onDelete: 'RESTRICT',
    };
  }

  private applyModifications(tables: TableDefinition[], modifications: string, options: SchemaOptions): void {
    const modLines = modifications.split('\n').filter(l => l.trim());

    for (const mod of modLines) {
      const lower = mod.toLowerCase();

      if (lower.includes('add column') || lower.includes('add field')) {
        // Parse and add new column
        const tableMatch = mod.match(/to\s+(\w+)/i);
        if (tableMatch) {
          const table = tables.find(t => t.name.toLowerCase() === tableMatch[1].toLowerCase());
          if (table) {
            const column = this.parseColumnRequirement(mod, options);
            if (column) {
              table.columns.push(column);
            }
          }
        }
      } else if (lower.includes('add index')) {
        // Add index
        const tableMatch = mod.match(/on\s+(\w+)/i);
        const columnMatch = mod.match(/\((\w+)\)/i);
        if (tableMatch && columnMatch) {
          const table = tables.find(t => t.name.toLowerCase() === tableMatch[1].toLowerCase());
          if (table) {
            table.indexes = table.indexes || [];
            table.indexes.push({
              name: `idx_${table.name}_${columnMatch[1]}`,
              columns: [columnMatch[1]],
            });
          }
        }
      }
    }
  }

  private generateFromFreeformRequirements(requirements: string, options: SchemaOptions): TableDefinition[] {
    // Simple pattern matching for common healthcare entities
    const tables: TableDefinition[] = [];
    const lower = requirements.toLowerCase();

    if (lower.includes('patient')) {
      tables.push(this.createPatientTable(options));
    }
    if (lower.includes('appointment') || lower.includes('scheduling')) {
      tables.push(this.createAppointmentTable(options));
    }
    if (lower.includes('medication') || lower.includes('prescription')) {
      tables.push(this.createMedicationTable(options));
    }
    if (lower.includes('encounter') || lower.includes('visit')) {
      tables.push(this.createEncounterTable(options));
    }
    if (lower.includes('practitioner') || lower.includes('doctor') || lower.includes('provider')) {
      tables.push(this.createPractitionerTable(options));
    }

    // If still no tables, create a generic one based on the requirements
    if (tables.length === 0) {
      tables.push({
        name: 'entity',
        columns: [
          { name: 'name', dataType: 'VARCHAR(255)', nullable: false },
          { name: 'description', dataType: 'TEXT', nullable: true },
          { name: 'status', dataType: 'VARCHAR(50)', nullable: false, defaultValue: "'active'" },
        ],
        indexes: [],
        foreignKeys: [],
        comment: 'Generated from requirements',
      });
    }

    return tables.map(t => this.enhanceTable(t, options));
  }

  private createPatientTable(options: SchemaOptions): TableDefinition {
    return {
      name: this.formatName('patient', options.namingConvention),
      columns: [
        { name: 'mrn', dataType: 'VARCHAR(50)', nullable: false, isUnique: true, comment: 'Medical Record Number' },
        { name: 'first_name', dataType: 'VARCHAR(100)', nullable: false },
        { name: 'last_name', dataType: 'VARCHAR(100)', nullable: false },
        { name: 'date_of_birth', dataType: 'DATE', nullable: false },
        { name: 'gender', dataType: 'VARCHAR(20)', nullable: true },
        { name: 'email', dataType: 'VARCHAR(255)', nullable: true },
        { name: 'phone', dataType: 'VARCHAR(20)', nullable: true },
        { name: 'address', dataType: 'TEXT', nullable: true },
        { name: 'emergency_contact', dataType: 'VARCHAR(255)', nullable: true },
        { name: 'insurance_id', dataType: 'VARCHAR(100)', nullable: true },
      ],
      indexes: [
        { name: 'idx_patient_mrn', columns: ['mrn'], isUnique: true },
        { name: 'idx_patient_name', columns: ['last_name', 'first_name'] },
      ],
      foreignKeys: [],
      comment: 'Patient demographics and identifiers',
    };
  }

  private createAppointmentTable(options: SchemaOptions): TableDefinition {
    return {
      name: this.formatName('appointment', options.namingConvention),
      columns: [
        { name: 'patient_id', dataType: options.databaseType === 'postgresql' ? 'UUID' : 'CHAR(36)', nullable: false },
        { name: 'practitioner_id', dataType: options.databaseType === 'postgresql' ? 'UUID' : 'CHAR(36)', nullable: false },
        { name: 'appointment_date', dataType: 'DATE', nullable: false },
        { name: 'start_time', dataType: 'TIME', nullable: false },
        { name: 'end_time', dataType: 'TIME', nullable: false },
        { name: 'status', dataType: 'VARCHAR(50)', nullable: false, defaultValue: "'scheduled'" },
        { name: 'appointment_type', dataType: 'VARCHAR(100)', nullable: true },
        { name: 'reason', dataType: 'TEXT', nullable: true },
        { name: 'notes', dataType: 'TEXT', nullable: true },
      ],
      indexes: [
        { name: 'idx_appointment_patient', columns: ['patient_id'] },
        { name: 'idx_appointment_date', columns: ['appointment_date'] },
      ],
      foreignKeys: [
        {
          name: 'fk_appointment_patient',
          columns: ['patient_id'],
          referencedTable: 'patient',
          referencedColumns: ['id'],
          onDelete: 'RESTRICT',
        },
      ],
      comment: 'Patient appointments and scheduling',
    };
  }

  private createMedicationTable(options: SchemaOptions): TableDefinition {
    return {
      name: this.formatName('medication', options.namingConvention),
      columns: [
        { name: 'patient_id', dataType: options.databaseType === 'postgresql' ? 'UUID' : 'CHAR(36)', nullable: false },
        { name: 'medication_name', dataType: 'VARCHAR(255)', nullable: false },
        { name: 'dosage', dataType: 'VARCHAR(100)', nullable: false },
        { name: 'frequency', dataType: 'VARCHAR(100)', nullable: false },
        { name: 'route', dataType: 'VARCHAR(50)', nullable: true },
        { name: 'start_date', dataType: 'DATE', nullable: false },
        { name: 'end_date', dataType: 'DATE', nullable: true },
        { name: 'prescriber_id', dataType: options.databaseType === 'postgresql' ? 'UUID' : 'CHAR(36)', nullable: true },
        { name: 'status', dataType: 'VARCHAR(50)', nullable: false, defaultValue: "'active'" },
        { name: 'notes', dataType: 'TEXT', nullable: true },
      ],
      indexes: [
        { name: 'idx_medication_patient', columns: ['patient_id'] },
      ],
      foreignKeys: [],
      comment: 'Medication orders and prescriptions',
    };
  }

  private createEncounterTable(options: SchemaOptions): TableDefinition {
    return {
      name: this.formatName('encounter', options.namingConvention),
      columns: [
        { name: 'patient_id', dataType: options.databaseType === 'postgresql' ? 'UUID' : 'CHAR(36)', nullable: false },
        { name: 'practitioner_id', dataType: options.databaseType === 'postgresql' ? 'UUID' : 'CHAR(36)', nullable: true },
        { name: 'encounter_date', dataType: 'TIMESTAMP', nullable: false },
        { name: 'encounter_type', dataType: 'VARCHAR(100)', nullable: false },
        { name: 'status', dataType: 'VARCHAR(50)', nullable: false },
        { name: 'chief_complaint', dataType: 'TEXT', nullable: true },
        { name: 'diagnosis', dataType: 'TEXT', nullable: true },
        { name: 'notes', dataType: 'TEXT', nullable: true },
      ],
      indexes: [
        { name: 'idx_encounter_patient', columns: ['patient_id'] },
        { name: 'idx_encounter_date', columns: ['encounter_date'] },
      ],
      foreignKeys: [],
      comment: 'Clinical encounters and visits',
    };
  }

  private createPractitionerTable(options: SchemaOptions): TableDefinition {
    return {
      name: this.formatName('practitioner', options.namingConvention),
      columns: [
        { name: 'npi', dataType: 'VARCHAR(20)', nullable: true, isUnique: true, comment: 'National Provider Identifier' },
        { name: 'first_name', dataType: 'VARCHAR(100)', nullable: false },
        { name: 'last_name', dataType: 'VARCHAR(100)', nullable: false },
        { name: 'specialty', dataType: 'VARCHAR(100)', nullable: true },
        { name: 'email', dataType: 'VARCHAR(255)', nullable: true },
        { name: 'phone', dataType: 'VARCHAR(20)', nullable: true },
        { name: 'license_number', dataType: 'VARCHAR(100)', nullable: true },
        { name: 'status', dataType: 'VARCHAR(50)', nullable: false, defaultValue: "'active'" },
      ],
      indexes: [
        { name: 'idx_practitioner_npi', columns: ['npi'], isUnique: true },
        { name: 'idx_practitioner_name', columns: ['last_name', 'first_name'] },
      ],
      foreignKeys: [],
      comment: 'Healthcare practitioners and providers',
    };
  }

  private formatName(name: string, convention: string): string {
    const words = name.toLowerCase().replace(/[^a-z0-9]/g, '_').split('_').filter(w => w);

    switch (convention) {
      case 'camelCase':
        return words.map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join('');
      case 'PascalCase':
        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
      case 'snake_case':
      default:
        return words.join('_');
    }
  }
}
