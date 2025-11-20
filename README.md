# HealthIT-Care

Healthcare IT utility applications for integration professionals. Generate optimized, compliant database schemas and integration artifacts.

## Schema Generator

A fullstack application that generates healthcare-compliant database schemas from requirements or existing schemas.

### Features

- **Requirements Mode**: Describe what you need in plain text, get optimized SQL
- **Existing Schema Mode**: Paste existing SQL, get improvement recommendations
- **Healthcare Compliance**: Automatic audit fields, soft deletes, PHI encryption markers
- **Multiple Databases**: PostgreSQL, MySQL, SQL Server support
- **Detailed Explanations**: Understand why each design decision was made
- **Warnings & Suggestions**: Identify compliance gaps and optimization opportunities

### Quick Start

#### Prerequisites

- Node.js 18+
- npm 9+
- Docker (for NAS deployment)

#### Development

```bash
# Install dependencies
npm install

# Start development servers (backend + frontend)
npm run dev

# Or start individually
npm run dev:backend   # API on http://localhost:3001
npm run dev:frontend  # UI on http://localhost:3000
```

#### Docker Deployment (NAS)

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

Access the application at `http://your-nas-ip:80`

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/schema/generate` | POST | Generate schema from requirements |
| `/api/v1/schema/analyze` | POST | Analyze existing schema |
| `/api/v1/schema/templates` | GET | Get healthcare templates |
| `/api/v1/schema/options` | GET | Get default options |
| `/health` | GET | Health check |

### Example Request

```json
{
  "mode": "requirements",
  "input": "Patient table:\\n- MRN: unique identifier\\n- Name: required\\n- Date of Birth: required\\n- Email: optional",
  "options": {
    "databaseType": "postgresql",
    "includeAuditFields": true,
    "includeSoftDelete": true,
    "includeEncryptionMarkers": true
  }
}
```

### Healthcare Compliance Features

#### Audit Fields
All tables automatically include:
- `created_at`, `created_by` - Track record creation
- `updated_at`, `updated_by` - Track modifications
- `version` - Optimistic locking

#### Soft Delete
Records are never physically deleted:
- `is_deleted` - Soft delete flag
- `deleted_at`, `deleted_by` - Deletion metadata

#### PHI Encryption Markers
Fields containing Protected Health Information are marked:
- Automatic detection of PHI fields (names, SSN, addresses, etc.)
- Encryption type and algorithm annotations
- Comments for implementation guidance

### Project Structure

```
HealthIT-Care/
├── packages/
│   ├── shared/          # Shared types and utilities
│   ├── backend/         # Express API
│   └── frontend/        # React UI
├── docker/              # Docker configuration
├── docker-compose.yml   # Container orchestration
└── CLAUDE.md            # AI assistant guidelines
```

### NAS Deployment Notes

The Docker images are optimized for NAS deployment:
- Alpine-based for minimal footprint
- Health checks for container monitoring
- Nginx for efficient static file serving
- Bridge network for inter-container communication

#### Synology Container Manager

1. Upload the project to your NAS
2. SSH into NAS and navigate to project directory
3. Run `docker-compose up -d`
4. Access via `http://nas-ip:80`

#### Persistent Storage (Optional)

Uncomment the volumes section in `docker-compose.yml` to persist generated schemas.

### Contributing

See [CLAUDE.md](./CLAUDE.md) for development guidelines and healthcare compliance requirements.

### License

MIT

---

**Note**: This application generates schema artifacts and configurations. It does not directly transform or process patient data. All generated output is intended for use in integration engines like Infor Cloverleaf.
