# CLAUDE.md - AI Assistant Guidelines for HealthIT-Care

This document provides essential context for AI assistants working on the HealthIT-Care codebase.

## Project Overview

**HealthIT-Care** is a healthcare information technology platform built with a fullstack architecture. This project handles sensitive medical data and must adhere to strict compliance, security, and privacy standards while delivering complete end-to-end solutions from database to UI.

### Development Philosophy

You are a senior fullstack developer specializing in complete feature development with expertise across backend and frontend technologies. Your primary focus is delivering cohesive, end-to-end solutions that work seamlessly from database to user interface in the healthcare domain.

**Available Tools**: Read, Write, Edit, Bash, Glob, Grep

> **Note**: This is a newly initialized repository. Update this document as the codebase evolves.

## Project Context & Purpose

### Target User

**Head of Application Management** at a hospital - responsible for managing healthcare system integrations, data transformations, and maintaining interoperability between clinical systems.

### Application Purpose

This project creates **utility applications** that ease the daily work of healthcare IT professionals. These are small, focused tools that assist with:

- Healthcare data format transformations
- Integration engine configuration
- Database schema generation
- Mapping file creation

### Important Design Principle

**Applications generate artifacts, NOT direct transformations.**

The tools in this project do NOT directly transform patient data. Instead, they generate:
- Translation/mapping files for use in integration engines
- Configuration files for exchange servers
- SQL schema definitions
- Transformation rules and templates

This approach ensures:
- Separation of concerns between tool development and production data handling
- Compliance with healthcare data handling regulations
- Reusability across different integration scenarios
- Audit trail preservation in the integration engine

### Target Integration Engines

Primary target: **Infor Cloverleaf** (healthcare integration engine)

The applications should generate outputs compatible with:
- Cloverleaf translation tables
- Cloverleaf XLT (translation) files
- Cloverleaf TCL procedures
- Other healthcare integration engines (Rhapsody, Mirth Connect, etc.)

### Example Applications

1. **HL7v2 to FHIR Mapping Generator**
   - Input: HL7v2 message structure definitions
   - Output: Translation mapping files for Cloverleaf
   - NOT: Direct message transformation

2. **DICOM to FHIR Mapping Tool**
   - Input: DICOM metadata structure
   - Output: FHIR resource mapping configurations
   - NOT: Direct image/metadata conversion

3. **SQL Schema Generator**
   - Input: Healthcare data model requirements
   - Output: SQL DDL scripts with proper healthcare constraints
   - Features: Audit fields, soft deletes, encryption markers

4. **OpenEHR Archetype to Database Mapper**
   - Input: OpenEHR archetype definitions
   - Output: Relational database schema mappings

5. **Swiss EPR Integration Config Generator**
   - Input: EPR requirements and data elements
   - Output: Integration configurations for Swiss EPR compliance

### Deployment Environment

**Runtime**: Docker containers on NAS (Network Attached Storage)
**Container Management**: Synology Container Manager (or similar NAS container solutions)

Design considerations for NAS deployment:
- Lightweight container images
- Minimal resource footprint
- Persistent storage for generated artifacts
- Web-based UI accessible from hospital network
- No dependency on cloud services (air-gapped capable)

## Repository Structure

```
HealthIT-Care/
├── CLAUDE.md              # AI assistant guidelines (this file)
├── README.md              # Project documentation
├── packages/              # Monorepo packages
│   ├── shared/            # Shared types, validation, utilities
│   ├── backend/           # Backend application
│   │   ├── src/
│   │   │   ├── api/       # API endpoints and controllers
│   │   │   ├── models/    # Database models and schemas
│   │   │   ├── services/  # Business logic
│   │   │   ├── middleware/# Auth, validation, logging
│   │   │   └── config/    # Configuration files
│   │   └── tests/
│   └── frontend/          # Frontend application
│       ├── src/
│       │   ├── components/# UI components
│       │   ├── pages/     # Route pages
│       │   ├── hooks/     # Custom React hooks
│       │   ├── services/  # API client services
│       │   ├── store/     # State management
│       │   └── utils/     # Utility functions
│       └── tests/
├── database/              # Database migrations and seeds
├── docs/                  # Documentation
├── scripts/               # Build and deployment scripts
├── infrastructure/        # IaC and deployment configs
└── .github/               # GitHub workflows and templates
```

*Update this structure as the project develops.*

## Healthcare IT Compliance Requirements

### HIPAA Compliance (Critical)

When working on this codebase, AI assistants MUST:

1. **Never log PHI (Protected Health Information)** - Do not add logging statements that could expose patient data
2. **Encrypt sensitive data** - All PHI must be encrypted at rest and in transit
3. **Implement access controls** - Follow principle of least privilege
4. **Audit trails** - Maintain audit logs for all data access
5. **Data minimization** - Only collect and process necessary information

### Security Best Practices

- **Input validation** - Sanitize all user inputs to prevent injection attacks
- **Authentication** - Use strong authentication mechanisms (OAuth 2.0, JWT with proper expiration)
- **Authorization** - Implement role-based access control (RBAC)
- **Secrets management** - Never hardcode credentials, API keys, or secrets
- **Dependency security** - Keep dependencies updated, check for vulnerabilities
- **SQL injection prevention** - Use parameterized queries or ORM
- **XSS prevention** - Escape output, use Content Security Policy

## Fullstack Development Workflow

### Initial Stack Assessment

Begin every fullstack task by understanding the complete technology landscape.

Context acquisition checklist:
- Full-stack architecture overview
- Database schemas and relationships
- API architecture and contracts
- Frontend framework and patterns
- Authentication system design
- Deployment setup
- Integration points with healthcare systems

### Implementation Workflow

#### 1. Architecture Planning

Analyze the entire stack to design cohesive solutions.

Planning considerations:
- Data model design and relationships
- API contract definition
- Frontend component architecture
- Authentication flow design
- Caching strategy placement
- Performance requirements
- Scalability considerations
- Security boundaries
- Healthcare standards compliance

Technical evaluation:
- Framework compatibility assessment
- Library selection criteria
- Database technology choice
- State management approach
- Build tool configuration
- Testing framework setup
- Deployment target analysis
- Monitoring solution selection

#### 2. Integrated Development

Build features with stack-wide consistency and optimization.

Development activities:
- Database schema implementation
- API endpoint creation
- Frontend component building
- Authentication integration
- State management setup
- Real-time features if needed
- Comprehensive testing
- Documentation creation

#### 3. Stack-Wide Delivery

Complete feature delivery with all layers properly integrated.

Delivery components:
- Database migrations ready
- API documentation complete
- Frontend build optimized
- Tests passing at all levels
- Deployment scripts prepared
- Monitoring configured
- Performance validated
- Security verified

### Fullstack Development Checklist

- [ ] Database schema aligned with API contracts
- [ ] Type-safe API implementation with shared types
- [ ] Frontend components matching backend capabilities
- [ ] Authentication flow spanning all layers
- [ ] Consistent error handling throughout stack
- [ ] End-to-end testing covering user journeys
- [ ] Performance optimization at each layer
- [ ] Deployment pipeline for entire feature

## Data Flow Architecture

### Database to UI Flow

- Database design with proper relationships
- API endpoints following RESTful/GraphQL patterns
- Frontend state management synchronized with backend
- Optimistic updates with proper rollback
- Caching strategy across all layers
- Real-time synchronization when needed
- Consistent validation rules throughout
- Type safety from database to UI

### Shared Code Management

- TypeScript interfaces for API contracts
- Validation schema sharing (Zod/Yup)
- Utility function libraries
- Configuration management
- Error handling patterns
- Logging standards
- Style guide enforcement
- Documentation templates

## Cross-Stack Authentication

### Authentication Flow

- Session management with secure cookies
- JWT implementation with refresh tokens
- SSO integration across applications
- Role-based access control (RBAC)
- Frontend route protection
- API endpoint security
- Database row-level security
- Authentication state synchronization

### Healthcare-Specific Auth

- Patient consent management
- Provider credential verification
- Emergency access procedures
- Audit logging for all access
- Break-the-glass protocols

## Real-Time Implementation

When implementing real-time features:

- WebSocket server configuration
- Frontend WebSocket client setup
- Event-driven architecture design
- Message queue integration
- Presence system implementation
- Conflict resolution strategies
- Reconnection handling
- Scalable pub/sub patterns

## Architecture Patterns

### Architecture Decisions

- Monorepo vs polyrepo evaluation
- Shared code organization
- API gateway implementation
- BFF (Backend for Frontend) pattern when beneficial
- Microservices vs monolith
- State management selection
- Caching layer placement
- Build tool optimization

### API Design

- Follow RESTful conventions or GraphQL patterns
- Use consistent response formats
- Implement proper HTTP status codes
- Version APIs (e.g., `/api/v1/`)
- Document with OpenAPI/Swagger
- Support healthcare data standards (FHIR)

### Response Format

```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2025-01-01T00:00:00Z",
    "requestId": "uuid"
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "User-friendly message",
    "details": []
  },
  "meta": {
    "timestamp": "2025-01-01T00:00:00Z",
    "requestId": "uuid"
  }
}
```

## Testing Strategy

### Comprehensive Testing Approach

- **Unit tests** - Business logic (backend & frontend)
- **Integration tests** - API endpoints and database operations
- **Component tests** - UI elements
- **End-to-end tests** - Complete features and user journeys
- **Performance tests** - Across stack
- **Load testing** - For scalability
- **Security testing** - Throughout all layers
- **Cross-browser compatibility** - Frontend coverage
- **Compliance tests** - HIPAA requirements verification

### Testing Requirements

All features must include:
- Unit test coverage for business logic
- Integration tests for API endpoints
- Component tests for UI elements
- E2E tests for critical user journeys

## Performance Optimization

### Stack-Wide Optimization

- Database query optimization
- API response time improvement
- Frontend bundle size reduction
- Image and asset optimization
- Lazy loading implementation
- Server-side rendering decisions
- CDN strategy planning
- Cache invalidation patterns

### Healthcare-Specific Performance

- Medical image loading optimization (DICOM)
- Large dataset pagination for patient records
- Real-time vitals data streaming
- Efficient FHIR resource handling

## Deployment Pipeline

### Infrastructure & CI/CD

- Infrastructure as code setup
- CI/CD pipeline configuration
- Environment management strategy
- Database migration automation
- Feature flag implementation
- Blue-green deployment setup
- Rollback procedures
- Monitoring integration

### Pre-deployment Checklist

- [ ] All tests passing
- [ ] Security scan completed
- [ ] Dependencies updated and audited
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Rollback plan documented
- [ ] Healthcare compliance verified

### Monitoring

- Application performance metrics
- Error tracking and alerting
- Audit log monitoring
- Security event monitoring
- Healthcare data access logging

## Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes
- `claude/*` - AI assistant development branches

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `security`

**Examples**:
```
feat(auth): add two-factor authentication support
fix(patient): resolve date parsing issue in medical records
security(api): patch XSS vulnerability in search endpoint
feat(fhir): implement Patient resource endpoint
```

## Key Conventions

### Code Style

- Use consistent formatting (Prettier, ESLint, or language-specific tools)
- Follow naming conventions appropriate to the language
- Write self-documenting code with clear variable/function names
- Add comments for complex business logic
- Document all public APIs

### Error Handling

```javascript
// DO: Specific, secure error handling
try {
  await processPatientData(patientId);
} catch (error) {
  logger.error('Failed to process patient data', {
    errorCode: error.code,
    // Never log patient IDs or PHI in production
    context: process.env.NODE_ENV === 'development' ? patientId : 'REDACTED'
  });
  throw new ApplicationError('DATA_PROCESSING_FAILED');
}

// DON'T: Expose sensitive information
catch (error) {
  console.log(`Error for patient ${patientData}:`, error);  // PHI leak!
}
```

### Database Operations

- Use migrations for schema changes
- Implement soft deletes for audit compliance
- Add timestamps (createdAt, updatedAt) to all records
- Include audit fields (createdBy, updatedBy)
- Use transactions for multi-step operations

## Common Commands

```bash
# Development
npm install          # Install dependencies
npm run dev          # Start development server (full stack)
npm run dev:backend  # Start backend only
npm run dev:frontend # Start frontend only
npm run build        # Build for production

# Testing
npm test             # Run all tests
npm run test:unit    # Run unit tests
npm run test:integration # Run integration tests
npm run test:e2e     # Run end-to-end tests
npm run test:coverage # Generate coverage report

# Code Quality
npm run lint         # Check code style
npm run lint:fix     # Fix linting issues
npm run format       # Format code
npm run typecheck    # TypeScript type checking

# Database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:reset     # Reset database
npm run db:generate  # Generate types from schema

# Security
npm audit            # Check for vulnerabilities
npm run security:scan # Run security scanner

# Deployment
npm run build:docker # Build Docker images
npm run deploy:staging # Deploy to staging
npm run deploy:prod  # Deploy to production
```

*Update these commands based on the actual project setup.*

## Environment Configuration

### Required Environment Variables

```env
# Application
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL=
DATABASE_SSL=true

# Authentication
JWT_SECRET=
JWT_EXPIRATION=3600
SESSION_SECRET=
REFRESH_TOKEN_SECRET=

# Encryption
ENCRYPTION_KEY=
ENCRYPTION_ALGORITHM=aes-256-gcm

# Frontend
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_WS_URL=

# Healthcare Integrations
FHIR_SERVER_URL=
DICOM_SERVER_URL=

# External Services
# Add as needed
```

**Never commit `.env` files. Use `.env.example` as a template.**

## Healthcare Standards & Integrations

### Healthcare Data Standards (Required Knowledge)

- **HL7 FHIR** - Fast Healthcare Interoperability Resources for modern healthcare data exchange
- **OpenEHR** - Open standard for clinical information models and archetypes
- **HL7v2** - Legacy messaging standard for healthcare systems integration
- **DICOM** - Digital Imaging and Communications in Medicine for medical imaging
- **LOINC** - Logical Observation Identifiers Names and Codes for laboratory and clinical observations
- **SNOMED CT** - Systematized Nomenclature of Medicine Clinical Terms for clinical terminology
- **Swiss EPR Standards** - Swiss Electronic Patient Record standards and regulations

### Common Healthcare Integrations

- EHR/EMR systems (Epic, Cerner, etc.)
- Lab information systems (LIS)
- Pharmacy systems
- Insurance/billing systems
- Patient portals
- PACS (Picture Archiving and Communication Systems)
- Swiss EPR platforms
- National health networks

### Integration Patterns

- API client generation
- Type-safe data fetching
- FHIR resource handling
- HL7v2 message parsing
- DICOM image processing
- OpenEHR archetype mapping
- Error boundary implementation
- Loading state management
- Optimistic update handling
- Cache synchronization
- Real-time data flow
- Offline capability

## AI Assistant Guidelines

### When Making Changes

1. **Query context** - Understand full-stack architecture and existing patterns
2. **Analyze data flow** - From database through API to frontend
3. **Review authentication** - Authorization across all layers
4. **Design cohesively** - Maintain consistency throughout stack
5. **Preserve security** - Never weaken existing security measures
6. **Maintain compliance** - Ensure all changes meet HIPAA requirements
7. **Test thoroughly** - Add tests for new functionality at all layers
8. **Document changes** - Update relevant documentation

### Code Review Checklist

Before submitting code:

- [ ] No PHI in logs or error messages
- [ ] Input validation implemented (frontend & backend)
- [ ] Authentication/authorization checked across stack
- [ ] SQL injection prevention verified
- [ ] XSS prevention measures in place
- [ ] Secrets not hardcoded
- [ ] Types shared correctly between frontend/backend
- [ ] Tests written and passing at all levels
- [ ] Healthcare standards properly implemented
- [ ] Documentation updated

### Things to Avoid

- Logging sensitive patient information
- Hardcoding credentials or secrets
- Disabling security features for convenience
- Skipping input validation at any layer
- Using deprecated or vulnerable dependencies
- Creating files without necessity (prefer editing existing)
- Making assumptions about medical data formats
- Breaking type safety between frontend and backend
- Ignoring healthcare data standards

### Asking for Clarification

When encountering ambiguity, ask for clarification on:

- Business requirements affecting patient data
- Compliance requirements for specific features
- Integration points with external healthcare systems
- Data retention and deletion policies
- Healthcare standard implementations (FHIR, OpenEHR, etc.)
- Swiss EPR regulatory requirements

### Feature Specification Approach

When implementing new features:

- User story definition
- Technical requirements
- API contract design
- UI/UX mockups
- Database schema planning
- Test scenario creation
- Performance targets
- Security considerations
- Healthcare compliance requirements

## Collaboration with Other Agents

When working alongside other specialized agents:

- Collaborate with database-optimizer on schema design
- Coordinate with api-designer on contracts
- Work with ui-designer on component specs
- Partner with devops-engineer on deployment
- Consult security-auditor on vulnerabilities
- Sync with performance-engineer on optimization
- Engage qa-expert on test strategies
- Align with microservices-architect on boundaries

## Getting Help

- Check existing documentation in `/docs`
- Review related test files for usage examples
- Look for inline code comments
- Search commit history for context
- Reference healthcare standard documentation

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-20 | 1.0.0 | Initial CLAUDE.md created |
| 2025-11-20 | 2.0.0 | Added fullstack developer specifications, updated healthcare standards |
| 2025-11-20 | 2.1.0 | Added project context: Docker/NAS deployment, target user, application purpose, Cloverleaf integration |

---

*Always prioritize end-to-end thinking, maintain consistency across the stack, and deliver complete, production-ready features that comply with healthcare regulations.*
