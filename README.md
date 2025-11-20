# HealthIT-Care

Healthcare IT utility applications for integration professionals. Generate optimized, compliant database schemas, transform healthcare messages, and manage integration workflows.

## Applications

### 1. SQL Schema Generator
Generate healthcare-compliant database schemas from requirements or existing schemas with HIPAA-compliant audit fields, soft delete patterns, and PHI encryption markers.

### 2. Message Transformer
Transform healthcare messages between formats (HL7v2, FHIR, CDA, etc.) and generate translation files for integration engines like Infor Cloverleaf.

### 3. Interface Documentation Generator
Generate comprehensive documentation for healthcare interfaces with data flow diagrams, endpoint catalogs, and data element mappings in Markdown, HTML, or JSON format.

### 4. Code Set / Terminology Mapper
Map healthcare codes between standard terminologies like ICD-10, SNOMED CT, LOINC, CPT, and RxNorm. Export to JSON, CSV, or Cloverleaf translation tables.

### 5. Integration Test Case Generator
Generate comprehensive test cases for healthcare integration interfaces including happy path, missing required fields, invalid data, and edge case scenarios.

### 6. Configuration Diff / Migration Tool
Compare configuration files between environments and generate migration scripts with impact assessment and detailed change reports.

### 7. Change Request Tracker
Track and manage interface change requests with priority management, status workflow, activity logging, and report generation.

### 8. HL7/FHIR Message Validator
Validate HL7 v2 and FHIR messages against standards and custom profiles with validation scoring, issue categorization, and structure parsing.

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Docker (for NAS deployment)

### Development

```bash
# Install dependencies
npm install

# Start development servers (backend + frontend)
npm run dev

# Or start individually
npm run dev:backend   # API on http://localhost:3001
npm run dev:frontend  # UI on http://localhost:3000
```

### Docker Deployment (NAS)

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

Access the application at `http://your-nas-ip:80`

---

## API Endpoints

### Schema Generator
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/schema/generate` | POST | Generate schema from requirements |
| `/api/v1/schema/analyze` | POST | Analyze existing schema |
| `/api/v1/schema/templates` | GET | Get healthcare templates |
| `/api/v1/schema/options` | GET | Get default options |

### Message Transformer
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/transform/convert` | POST | Transform message between formats |
| `/api/v1/transform/formats` | GET | Get supported formats |
| `/api/v1/transform/supported` | GET | Get supported transformations |

### Interface Documentation
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/docs/generate` | POST | Generate interface documentation |
| `/api/v1/docs/sample` | GET | Get sample interface template |

### Code Mapper
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/codemap/map` | POST | Map codes between systems |
| `/api/v1/codemap/systems` | GET | Get supported code systems |

### Test Generator
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/testgen/generate` | POST | Generate test cases |
| `/api/v1/testgen/scenarios` | GET | Get available test scenarios |

### Config Diff
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/configdiff/compare` | POST | Compare configurations |
| `/api/v1/configdiff/types` | GET | Get supported config types |

### Change Tracker
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/changes` | GET | List change requests |
| `/api/v1/changes` | POST | Create change request |
| `/api/v1/changes/:id` | GET/PUT/DELETE | Manage change request |
| `/api/v1/changes/:id/status` | PATCH | Update status |
| `/api/v1/changes/:id/notes` | POST | Add note |
| `/api/v1/changes/stats` | GET | Get statistics |
| `/api/v1/changes/report` | GET | Generate report |

### Message Validator
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/validate/check` | POST | Validate message |
| `/api/v1/validate/profiles` | GET | Get validation profiles |
| `/api/v1/validate/formats` | GET | Get supported formats |

### Health Check
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | API health check |

---

## Supported Healthcare Standards

### Message Formats
- **HL7 v2.x** - Legacy messaging standard
- **FHIR R4** - Modern healthcare data exchange (JSON/XML)
- **CDA** - Clinical Document Architecture
- **DICOM** - Medical imaging metadata
- **OpenEHR** - Clinical information models

### Code Systems
- **ICD-10/ICD-9** - Diagnosis codes
- **SNOMED CT** - Clinical terminology
- **LOINC** - Laboratory observations
- **CPT** - Procedure codes
- **HCPCS** - Healthcare coding system
- **RxNorm** - Drug terminology
- **NDC** - National drug codes

### Translation File Formats
- **XSLT** - XML stylesheet transformations
- **JSONata** - JSON query/transformation
- **Cloverleaf XLT** - TCL-based translations
- **Mapping Tables** - Markdown documentation

---

## Healthcare Compliance Features

### Audit Fields
All generated schemas include:
- `created_at`, `created_by` - Track record creation
- `updated_at`, `updated_by` - Track modifications
- `version` - Optimistic locking

### Soft Delete
Records are never physically deleted:
- `is_deleted` - Soft delete flag
- `deleted_at`, `deleted_by` - Deletion metadata

### PHI Encryption Markers
Fields containing Protected Health Information are marked:
- Automatic detection of PHI fields
- Encryption type and algorithm annotations
- Implementation guidance comments

---

## Project Structure

```
HealthIT-Care/
├── packages/
│   ├── shared/          # Shared types and utilities
│   │   └── src/
│   │       └── index.ts # Type definitions
│   ├── backend/         # Express API
│   │   └── src/
│   │       ├── api/     # API routes
│   │       ├── services/# Business logic
│   │       └── index.ts # Server entry
│   └── frontend/        # React UI
│       └── src/
│           ├── pages/   # Application pages
│           ├── services/# API client
│           └── App.tsx  # Router
├── docker/              # Docker configuration
├── docker-compose.yml   # Container orchestration
├── CLAUDE.md            # AI assistant guidelines
└── README.md            # This file
```

---

## NAS Deployment Notes

The Docker images are optimized for NAS deployment:
- Alpine-based for minimal footprint
- Health checks for container monitoring
- Nginx for efficient static file serving
- Bridge network for inter-container communication

### Synology Container Manager

1. Upload the project to your NAS
2. SSH into NAS and navigate to project directory
3. Run `docker-compose up -d`
4. Access via `http://nas-ip:80`

### Persistent Storage (Optional)

Uncomment the volumes section in `docker-compose.yml` to persist data.

---

## Contributing

See [CLAUDE.md](./CLAUDE.md) for development guidelines and healthcare compliance requirements.

## License

MIT

---

**Note**: These applications generate artifacts and configuration files for integration engines. They do not directly transform or process patient data. All generated output is intended for use in integration engines like Infor Cloverleaf.
