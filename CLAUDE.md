# CLAUDE.md - AI Assistant Guidelines for HealthIT-Care

This document provides essential context for AI assistants working on the HealthIT-Care codebase.

## Project Overview

**HealthIT-Care** is a healthcare information technology platform. This project handles sensitive medical data and must adhere to strict compliance, security, and privacy standards.

> **Note**: This is a newly initialized repository. Update this document as the codebase evolves.

## Repository Structure

```
HealthIT-Care/
├── CLAUDE.md              # AI assistant guidelines (this file)
├── README.md              # Project documentation
├── src/                   # Source code
│   ├── api/               # API endpoints and controllers
│   ├── models/            # Data models and schemas
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   └── config/            # Configuration files
├── tests/                 # Test suites
├── docs/                  # Documentation
├── scripts/               # Build and deployment scripts
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

## Development Workflow

### Branch Strategy

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
```

### Code Review Requirements

All code changes must:
- Pass automated tests
- Include appropriate test coverage
- Follow coding standards
- Be reviewed for security implications
- Not introduce PHI logging

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

### Testing Requirements

- **Unit tests** - All business logic
- **Integration tests** - API endpoints and database operations
- **Security tests** - Authentication, authorization, input validation
- **Compliance tests** - HIPAA requirements verification

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
npm run dev          # Start development server
npm run build        # Build for production

# Testing
npm test             # Run all tests
npm run test:unit    # Run unit tests
npm run test:e2e     # Run end-to-end tests
npm run test:coverage # Generate coverage report

# Code Quality
npm run lint         # Check code style
npm run lint:fix     # Fix linting issues
npm run format       # Format code

# Database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:reset     # Reset database

# Security
npm audit            # Check for vulnerabilities
npm run security:scan # Run security scanner
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

# Encryption
ENCRYPTION_KEY=
ENCRYPTION_ALGORITHM=aes-256-gcm

# External Services
# Add as needed
```

**Never commit `.env` files. Use `.env.example` as a template.**

## Architecture Patterns

### API Design

- Follow RESTful conventions
- Use consistent response formats
- Implement proper HTTP status codes
- Version APIs (e.g., `/api/v1/`)
- Document with OpenAPI/Swagger

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

## AI Assistant Guidelines

### When Making Changes

1. **Understand context** - Read related files and documentation before modifying
2. **Preserve security** - Never weaken existing security measures
3. **Maintain compliance** - Ensure all changes meet HIPAA requirements
4. **Test thoroughly** - Add tests for new functionality
5. **Document changes** - Update relevant documentation

### Code Review Checklist

Before submitting code:

- [ ] No PHI in logs or error messages
- [ ] Input validation implemented
- [ ] Authentication/authorization checked
- [ ] SQL injection prevention verified
- [ ] XSS prevention measures in place
- [ ] Secrets not hardcoded
- [ ] Tests written and passing
- [ ] Documentation updated

### Things to Avoid

- Logging sensitive patient information
- Hardcoding credentials or secrets
- Disabling security features for convenience
- Skipping input validation
- Using deprecated or vulnerable dependencies
- Creating files without necessity (prefer editing existing)
- Making assumptions about medical data formats

### Asking for Clarification

When encountering ambiguity, ask for clarification on:

- Business requirements affecting patient data
- Compliance requirements for specific features
- Integration points with external healthcare systems
- Data retention and deletion policies

## External Dependencies & Integrations

### Healthcare Standards

- **HL7 FHIR** - Healthcare data exchange format
- **ICD-10** - Medical diagnosis codes
- **CPT** - Medical procedure codes
- **SNOMED CT** - Clinical terminology

### Common Integrations

- EHR/EMR systems
- Lab information systems
- Pharmacy systems
- Insurance/billing systems
- Patient portals

## Deployment & Operations

### Pre-deployment Checklist

- [ ] All tests passing
- [ ] Security scan completed
- [ ] Dependencies updated and audited
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Rollback plan documented

### Monitoring

- Application performance metrics
- Error tracking and alerting
- Audit log monitoring
- Security event monitoring

## Getting Help

- Check existing documentation in `/docs`
- Review related test files for usage examples
- Look for inline code comments
- Search commit history for context

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-20 | 1.0.0 | Initial CLAUDE.md created |

---

*This document should be updated as the project evolves. When adding new features, patterns, or conventions, please update the relevant sections.*
