import { v4 as uuidv4 } from 'uuid';
import {
  AzureArchitectRequest,
  AzureArchitectResponse,
  AzureService,
  ArchitectureTemplate,
  AzureBestPractice,
  ServiceRecommendationRequest,
  ServiceRecommendationResponse,
  HealthcareUseCase,
} from '@healthit-care/shared';

// Healthcare-relevant Azure Services Knowledge Base
const AZURE_SERVICES: AzureService[] = [
  {
    id: 'health-data-services',
    name: 'Azure Health Data Services',
    category: 'healthcare',
    description: 'Unified platform for protected health information (PHI) with FHIR, DICOM, and MedTech services.',
    healthcareRelevance: 'Core service for healthcare interoperability - hosts FHIR APIs, DICOM imaging, and IoT medical device data.',
    hipaaCompliant: true,
    pricingTier: 'medium',
    documentationUrl: 'https://learn.microsoft.com/azure/healthcare-apis/',
  },
  {
    id: 'api-management',
    name: 'Azure API Management',
    category: 'integration',
    description: 'Publish APIs to external, partner, and employee developers securely and at scale.',
    healthcareRelevance: 'Essential for exposing FHIR APIs securely, implementing rate limiting, and API versioning for healthcare integrations.',
    hipaaCompliant: true,
    pricingTier: 'medium',
    documentationUrl: 'https://learn.microsoft.com/azure/api-management/',
  },
  {
    id: 'key-vault',
    name: 'Azure Key Vault',
    category: 'security',
    description: 'Safeguard cryptographic keys and secrets used by cloud applications and services.',
    healthcareRelevance: 'Critical for storing encryption keys for PHI, managing certificates, and securing API keys.',
    hipaaCompliant: true,
    pricingTier: 'low',
    documentationUrl: 'https://learn.microsoft.com/azure/key-vault/',
  },
  {
    id: 'virtual-machines',
    name: 'Azure Virtual Machines',
    category: 'compute',
    description: 'On-demand, scalable computing resources with Linux or Windows.',
    healthcareRelevance: 'Host integration engines (Cloverleaf, Mirth), legacy healthcare applications, and custom solutions.',
    hipaaCompliant: true,
    pricingTier: 'medium',
    documentationUrl: 'https://learn.microsoft.com/azure/virtual-machines/',
  },
  {
    id: 'aks',
    name: 'Azure Kubernetes Service',
    category: 'compute',
    description: 'Managed Kubernetes service for containerized applications.',
    healthcareRelevance: 'Deploy containerized healthcare workloads with automatic scaling, ideal for microservices architectures.',
    hipaaCompliant: true,
    pricingTier: 'medium',
    documentationUrl: 'https://learn.microsoft.com/azure/aks/',
  },
  {
    id: 'blob-storage',
    name: 'Azure Blob Storage',
    category: 'storage',
    description: 'Massively scalable object storage for unstructured data.',
    healthcareRelevance: 'Store medical documents, images, backups, and archive data with encryption at rest.',
    hipaaCompliant: true,
    pricingTier: 'low',
    documentationUrl: 'https://learn.microsoft.com/azure/storage/blobs/',
  },
  {
    id: 'sql-database',
    name: 'Azure SQL Database',
    category: 'database',
    description: 'Fully managed relational database with auto-scale, integral intelligence, and robust security.',
    healthcareRelevance: 'Store structured patient data, audit logs, and application data with built-in encryption.',
    hipaaCompliant: true,
    pricingTier: 'medium',
    documentationUrl: 'https://learn.microsoft.com/azure/azure-sql/',
  },
  {
    id: 'cosmos-db',
    name: 'Azure Cosmos DB',
    category: 'database',
    description: 'Globally distributed, multi-model database service.',
    healthcareRelevance: 'Ideal for globally distributed healthcare applications requiring low latency and high availability.',
    hipaaCompliant: true,
    pricingTier: 'high',
    documentationUrl: 'https://learn.microsoft.com/azure/cosmos-db/',
  },
  {
    id: 'expressroute',
    name: 'Azure ExpressRoute',
    category: 'networking',
    description: 'Private connections between Azure datacenters and on-premises infrastructure.',
    healthcareRelevance: 'Secure, dedicated connectivity between hospital data centers and Azure - essential for hybrid scenarios.',
    hipaaCompliant: true,
    pricingTier: 'high',
    documentationUrl: 'https://learn.microsoft.com/azure/expressroute/',
  },
  {
    id: 'firewall',
    name: 'Azure Firewall',
    category: 'security',
    description: 'Cloud-native, intelligent network firewall security service.',
    healthcareRelevance: 'Protect healthcare workloads with threat intelligence-based filtering and network segmentation.',
    hipaaCompliant: true,
    pricingTier: 'medium',
    documentationUrl: 'https://learn.microsoft.com/azure/firewall/',
  },
  {
    id: 'active-directory',
    name: 'Microsoft Entra ID (Azure AD)',
    category: 'identity',
    description: 'Enterprise identity service with single sign-on, multi-factor authentication.',
    healthcareRelevance: 'Manage healthcare worker identities, implement MFA, and secure access to clinical applications.',
    hipaaCompliant: true,
    pricingTier: 'low',
    documentationUrl: 'https://learn.microsoft.com/azure/active-directory/',
  },
  {
    id: 'monitor',
    name: 'Azure Monitor',
    category: 'monitoring',
    description: 'Full-stack monitoring for applications and infrastructure.',
    healthcareRelevance: 'Monitor healthcare application health, set up alerts for critical systems, and analyze logs.',
    hipaaCompliant: true,
    pricingTier: 'low',
    documentationUrl: 'https://learn.microsoft.com/azure/azure-monitor/',
  },
  {
    id: 'log-analytics',
    name: 'Log Analytics',
    category: 'monitoring',
    description: 'Collect and analyze telemetry from cloud and on-premises environments.',
    healthcareRelevance: 'Centralize logs from integration engines, create audit trails for compliance.',
    hipaaCompliant: true,
    pricingTier: 'low',
    documentationUrl: 'https://learn.microsoft.com/azure/azure-monitor/logs/',
  },
  {
    id: 'synapse',
    name: 'Azure Synapse Analytics',
    category: 'analytics',
    description: 'Limitless analytics service for enterprise data warehousing and big data analytics.',
    healthcareRelevance: 'Build healthcare data lakes, perform population health analytics, and clinical research.',
    hipaaCompliant: true,
    pricingTier: 'high',
    documentationUrl: 'https://learn.microsoft.com/azure/synapse-analytics/',
  },
  {
    id: 'machine-learning',
    name: 'Azure Machine Learning',
    category: 'ai-ml',
    description: 'Enterprise-grade service for the machine learning lifecycle.',
    healthcareRelevance: 'Develop clinical prediction models, image analysis for radiology, and NLP for clinical notes.',
    hipaaCompliant: true,
    pricingTier: 'high',
    documentationUrl: 'https://learn.microsoft.com/azure/machine-learning/',
  },
  {
    id: 'site-recovery',
    name: 'Azure Site Recovery',
    category: 'storage',
    description: 'Business continuity and disaster recovery service.',
    healthcareRelevance: 'Ensure healthcare system availability with automated failover and recovery.',
    hipaaCompliant: true,
    pricingTier: 'medium',
    documentationUrl: 'https://learn.microsoft.com/azure/site-recovery/',
  },
];

// Architecture Templates with ASCII Diagrams
const ARCHITECTURE_TEMPLATES: ArchitectureTemplate[] = [
  {
    id: 'fhir-api-basic',
    name: 'FHIR API Platform',
    description: 'Basic FHIR API setup for healthcare interoperability with secure access and monitoring.',
    useCase: 'fhir-api',
    services: ['health-data-services', 'api-management', 'key-vault', 'monitor', 'active-directory'],
    diagram: `
┌─────────────────────────────────────────────────────────────┐
│                    External Applications                     │
│              (EHR, Patient Apps, Partners)                   │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼───────────────────────────────────┐
│                  Azure API Management                        │
│    • Rate Limiting  • OAuth 2.0  • API Versioning           │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│              Azure Health Data Services                      │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │   FHIR API   │  │    DICOM     │  │     MedTech     │    │
│  │   Service    │  │   Service    │  │    Connector    │    │
│  └──────────────┘  └──────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
    ┌────▼────┐          ┌────▼────┐         ┌────▼────┐
    │ Key     │          │ Azure   │         │  Log    │
    │ Vault   │          │ Monitor │         │Analytics│
    └─────────┘          └─────────┘         └─────────┘
`,
    considerations: [
      'Enable managed identity for secure service-to-service communication',
      'Configure CORS policies in API Management for web applications',
      'Set up diagnostic settings to send logs to Log Analytics',
      'Implement retry policies for downstream service calls',
    ],
    estimatedMonthlyCost: '$500 - $2,000',
    complianceNotes: [
      'Enable Customer-Managed Keys (CMK) for data encryption',
      'Configure audit logging for all FHIR operations',
      'Implement IP restrictions and virtual network integration',
      'Sign BAA with Microsoft for HIPAA compliance',
    ],
  },
  {
    id: 'integration-engine-azure',
    name: 'Integration Engine in Azure',
    description: 'Host healthcare integration engines (Cloverleaf, Mirth) in Azure with high availability.',
    useCase: 'integration-engine',
    services: ['virtual-machines', 'blob-storage', 'sql-database', 'firewall', 'monitor', 'key-vault'],
    diagram: `
┌─────────────────────────────────────────────────────────────┐
│                     On-Premises Hospital                     │
│    ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│    │   EHR   │  │   LIS   │  │   RIS   │  │   PACS  │       │
│    └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘       │
└─────────┼────────────┼────────────┼────────────┼────────────┘
          └────────────┴──────┬─────┴────────────┘
                              │ ExpressRoute / VPN
┌─────────────────────────────▼───────────────────────────────┐
│                     Azure Virtual Network                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Integration Engine Subnet               │    │
│  │  ┌─────────────┐    ┌─────────────┐                 │    │
│  │  │   VM 1      │    │   VM 2      │  Load          │    │
│  │  │ Cloverleaf  │◄──►│ Cloverleaf  │  Balanced      │    │
│  │  │  Primary    │    │  Secondary  │                 │    │
│  │  └──────┬──────┘    └──────┬──────┘                 │    │
│  └─────────┼──────────────────┼────────────────────────┘    │
│            │                  │                              │
│  ┌─────────▼──────────────────▼────────────────────────┐    │
│  │                 Shared Storage                       │    │
│  │    Azure Files (SMB)  +  Azure SQL Database         │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
          │
    ┌─────▼─────┐
    │  Azure    │
    │  Firewall │
    └───────────┘
`,
    considerations: [
      'Use Availability Zones for high availability',
      'Configure automated backups for VMs and databases',
      'Set up Azure Files with SMB for shared configuration',
      'Implement NSG rules for network segmentation',
    ],
    estimatedMonthlyCost: '$1,500 - $5,000',
    complianceNotes: [
      'Enable Azure Disk Encryption for all VMs',
      'Configure JIT (Just-In-Time) VM access',
      'Enable boot diagnostics and serial console',
      'Implement Azure Backup for VM protection',
    ],
  },
  {
    id: 'healthcare-data-lake',
    name: 'Healthcare Data Lake & Analytics',
    description: 'Build a comprehensive healthcare data lake for analytics and population health management.',
    useCase: 'data-lake',
    services: ['synapse', 'blob-storage', 'health-data-services', 'machine-learning', 'key-vault'],
    diagram: `
┌─────────────────────────────────────────────────────────────┐
│                     Data Sources                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │   EHR   │  │  Claims │  │   IoT   │  │  FHIR   │        │
│  │   Data  │  │   Data  │  │ Devices │  │   API   │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
└───────┼────────────┼────────────┼────────────┼──────────────┘
        └────────────┴──────┬─────┴────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              Azure Data Lake Storage Gen2                    │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│   │   Raw    │───►│ Curated  │───►│  Served  │              │
│   │   Zone   │    │   Zone   │    │   Zone   │              │
│   └──────────┘    └──────────┘    └──────────┘              │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   Azure Synapse Analytics                    │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│   │  Spark Pools │  │   SQL Pools  │  │  Pipelines   │      │
│   └──────┬───────┘  └──────┬───────┘  └──────────────┘      │
│          │                 │                                 │
│   ┌──────▼─────────────────▼───────┐                        │
│   │     Power BI Integration       │                        │
│   └────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
`,
    considerations: [
      'Implement data quality checks at each zone transition',
      'Use Delta Lake format for ACID transactions',
      'Set up row-level security in Synapse',
      'Consider data anonymization for research datasets',
    ],
    estimatedMonthlyCost: '$3,000 - $15,000',
    complianceNotes: [
      'Implement data classification and labeling',
      'Enable soft delete and versioning for compliance',
      'Configure private endpoints for all services',
      'Set up Purview for data governance',
    ],
  },
  {
    id: 'hybrid-healthcare',
    name: 'Hybrid Healthcare Architecture',
    description: 'Connect on-premises hospital systems to Azure cloud services securely.',
    useCase: 'hybrid-cloud',
    services: ['expressroute', 'firewall', 'active-directory', 'virtual-machines', 'monitor'],
    diagram: `
┌─────────────────────────────────────────────────────────────┐
│              On-Premises Hospital Data Center                │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   Epic   │  │  Legacy  │  │   File   │  │    AD    │    │
│  │   EHR    │  │   Apps   │  │  Servers │  │    DC    │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       └─────────────┴──────┬─────┴──────────────┘          │
│                            │                                │
│  ┌─────────────────────────▼─────────────────────────┐     │
│  │           Edge Router / Firewall                   │     │
│  └─────────────────────────┬─────────────────────────┘     │
└────────────────────────────┼────────────────────────────────┘
                             │
              ┌──────────────▼──────────────┐
              │      Azure ExpressRoute     │
              │    (Dedicated Connection)   │
              └──────────────┬──────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    Azure Hub VNet                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Azure Firewall  │  VPN Gateway  │  Azure Bastion   │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│     ┌──────────────────────┼──────────────────────┐         │
│     │                      │                      │         │
│  ┌──▼───┐              ┌───▼──┐             ┌────▼───┐      │
│  │Spoke │              │Spoke │             │ Spoke  │      │
│  │ VNet │              │ VNet │             │  VNet  │      │
│  │ Apps │              │ Data │             │  DMZ   │      │
│  └──────┘              └──────┘             └────────┘      │
└─────────────────────────────────────────────────────────────┘
`,
    considerations: [
      'Implement hub-and-spoke network topology',
      'Use Azure AD Connect for identity synchronization',
      'Plan IP address space carefully to avoid conflicts',
      'Implement Azure Private Link for PaaS services',
    ],
    estimatedMonthlyCost: '$2,000 - $10,000',
    complianceNotes: [
      'Ensure ExpressRoute meets data residency requirements',
      'Implement network traffic encryption',
      'Configure centralized logging in hub network',
      'Document all network flows for compliance audits',
    ],
  },
  {
    id: 'disaster-recovery',
    name: 'Healthcare Disaster Recovery',
    description: 'Multi-region disaster recovery setup for critical healthcare systems.',
    useCase: 'disaster-recovery',
    services: ['site-recovery', 'blob-storage', 'sql-database', 'monitor'],
    diagram: `
┌────────────────────────────┐    ┌────────────────────────────┐
│      Primary Region         │    │     Secondary Region        │
│      (e.g., East US)        │    │     (e.g., West US)         │
│                              │    │                              │
│  ┌──────────────────────┐   │    │   ┌──────────────────────┐   │
│  │    Production VMs    │   │    │   │    Standby VMs       │   │
│  │    (Active)          │◄──┼────┼──►│    (Passive)         │   │
│  └──────────┬───────────┘   │    │   └──────────┬───────────┘   │
│             │               │    │              │               │
│  ┌──────────▼───────────┐   │    │   ┌──────────▼───────────┐   │
│  │   Azure SQL DB       │   │    │   │   Azure SQL DB       │   │
│  │   (Primary)          │───┼────┼──►│   (Geo-Secondary)    │   │
│  └──────────────────────┘   │    │   └──────────────────────┘   │
│             │               │    │              │               │
│  ┌──────────▼───────────┐   │    │   ┌──────────▼───────────┐   │
│  │   Blob Storage       │   │    │   │   Blob Storage       │   │
│  │   (RA-GRS)           │───┼────┼──►│   (Read Replica)     │   │
│  └──────────────────────┘   │    │   └──────────────────────┘   │
└──────────────┬───────────────┘    └───────────────┬──────────────┘
               │                                    │
               └──────────────┬─────────────────────┘
                              │
              ┌───────────────▼────────────────┐
              │     Azure Traffic Manager      │
              │     (Priority Routing)         │
              └────────────────────────────────┘
`,
    considerations: [
      'Define RPO and RTO for each workload',
      'Test failover procedures regularly',
      'Automate failover with Azure Automation',
      'Consider active-active for critical services',
    ],
    estimatedMonthlyCost: '$1,000 - $5,000 (+ primary region costs)',
    complianceNotes: [
      'Ensure secondary region meets data residency requirements',
      'Maintain compliance in both regions',
      'Document disaster recovery procedures',
      'Include DR in compliance audits',
    ],
  },
];

// Best Practices for Healthcare in Azure
const BEST_PRACTICES: AzureBestPractice[] = [
  {
    id: 'bp-encryption',
    category: 'security',
    title: 'Enable encryption everywhere',
    description: 'Encrypt all PHI data at rest and in transit using Azure-managed or customer-managed keys.',
    implementation: 'Enable Azure Disk Encryption, Storage Service Encryption, TLS 1.2+, and consider CMK with Key Vault.',
    priority: 'critical',
  },
  {
    id: 'bp-network-isolation',
    category: 'networking',
    title: 'Implement network isolation',
    description: 'Use VNets, NSGs, and private endpoints to isolate healthcare workloads.',
    implementation: 'Create dedicated VNets for healthcare, use private endpoints for PaaS, implement NSG rules.',
    priority: 'critical',
  },
  {
    id: 'bp-identity',
    category: 'security',
    title: 'Use Managed Identities',
    description: 'Avoid storing credentials by using Azure Managed Identities for service-to-service auth.',
    implementation: 'Enable system-assigned managed identity on VMs, App Services, and AKS.',
    priority: 'high',
  },
  {
    id: 'bp-audit-logging',
    category: 'compliance',
    title: 'Centralize audit logging',
    description: 'Send all logs to Log Analytics for compliance reporting and security monitoring.',
    implementation: 'Configure diagnostic settings on all resources, set up Azure Sentinel for SIEM.',
    priority: 'critical',
  },
  {
    id: 'bp-backup',
    category: 'operations',
    title: 'Implement comprehensive backup',
    description: 'Back up all healthcare data with appropriate retention policies.',
    implementation: 'Use Azure Backup for VMs, enable geo-redundant storage, test restores regularly.',
    priority: 'high',
  },
  {
    id: 'bp-cost-management',
    category: 'cost',
    title: 'Implement cost controls',
    description: 'Use Azure Cost Management to track and optimize healthcare workload costs.',
    implementation: 'Set budgets, use Reserved Instances for predictable workloads, right-size VMs.',
    priority: 'medium',
  },
  {
    id: 'bp-tagging',
    category: 'operations',
    title: 'Tag all resources',
    description: 'Use consistent tagging for cost allocation, compliance, and operations.',
    implementation: 'Create tagging policy with required tags: Environment, Application, Owner, Compliance.',
    priority: 'medium',
  },
  {
    id: 'bp-zero-trust',
    category: 'security',
    title: 'Implement Zero Trust',
    description: 'Never trust, always verify - implement identity-based security.',
    implementation: 'Use Conditional Access, MFA, PIM for admin access, and micro-segmentation.',
    priority: 'high',
  },
];

// Q&A Knowledge Base
const QUESTIONS: Array<{
  keywords: string[];
  question: string;
  category: string;
  answer: string;
  relatedServices: string[];
  relatedArchitectures: string[];
}> = [
  {
    keywords: ['fhir', 'api', 'interoperability', 'health data'],
    question: 'How do I set up a FHIR API in Azure?',
    category: 'Getting Started',
    answer: `To set up a FHIR API in Azure:

1. **Create Azure Health Data Services workspace**
   - Go to Azure Portal → Create Resource → Search "Azure Health Data Services"
   - Create a workspace in your preferred region (consider data residency)

2. **Deploy FHIR service**
   - Within the workspace, add a FHIR service
   - Choose FHIR version (R4 recommended for new implementations)
   - Configure authentication (Azure AD required)

3. **Set up API Management (recommended)**
   - Create Azure API Management instance
   - Import FHIR API specification
   - Configure OAuth 2.0 for secure access
   - Set up rate limiting and monitoring

4. **Configure security**
   - Enable Customer-Managed Keys in Key Vault
   - Set up private endpoints for network isolation
   - Configure CORS for web applications

5. **Test and monitor**
   - Use Postman or FHIR client to test endpoints
   - Set up Azure Monitor alerts for errors
   - Enable diagnostic logging`,
    relatedServices: ['health-data-services', 'api-management', 'key-vault'],
    relatedArchitectures: ['fhir-api-basic'],
  },
  {
    keywords: ['hipaa', 'compliance', 'baa', 'compliant'],
    question: 'How do I make Azure HIPAA compliant?',
    category: 'Compliance',
    answer: `To achieve HIPAA compliance in Azure:

1. **Sign the BAA (Business Associate Agreement)**
   - Microsoft offers a BAA through Online Services Terms
   - Covers most Azure services (check compliance documentation)
   - Required before processing PHI in Azure

2. **Use HIPAA-eligible services**
   - Azure Health Data Services (FHIR, DICOM)
   - Azure SQL Database, Cosmos DB
   - Azure Virtual Machines, AKS
   - Azure Storage (with encryption)
   - Azure Key Vault

3. **Implement technical safeguards**
   - Encryption at rest (Azure-managed or CMK)
   - Encryption in transit (TLS 1.2+)
   - Access controls (RBAC, Conditional Access)
   - Audit logging (all access to PHI)

4. **Administrative safeguards**
   - Document security policies
   - Train staff on Azure security
   - Implement incident response plan
   - Regular risk assessments

5. **Physical safeguards (Azure responsibility)**
   - Azure data centers are certified
   - Choose appropriate regions for data residency

6. **Regular audits**
   - Use Azure Security Center/Defender for Cloud
   - Review access logs regularly
   - Conduct penetration testing`,
    relatedServices: ['key-vault', 'active-directory', 'monitor'],
    relatedArchitectures: ['fhir-api-basic', 'hybrid-healthcare'],
  },
  {
    keywords: ['cloverleaf', 'mirth', 'integration', 'engine', 'vm'],
    question: 'How do I host an integration engine in Azure?',
    category: 'Integration',
    answer: `To host Cloverleaf or Mirth in Azure:

1. **Choose compute option**
   - **Azure VMs**: Best for traditional deployment, full control
   - **AKS**: For containerized Mirth, better scalability

2. **VM deployment approach**
   - Use D-series VMs (balanced compute/memory)
   - Deploy in Availability Zones for HA
   - Configure Azure Load Balancer for distribution
   - Use Azure Files (SMB) for shared config

3. **Network configuration**
   - Create dedicated subnet for integration
   - Configure NSG rules for HL7 ports (2575, etc.)
   - Set up VPN/ExpressRoute for on-prem connectivity
   - Consider Azure Firewall for centralized security

4. **Storage setup**
   - Azure Files for shared configuration
   - Blob Storage for message archives
   - Azure SQL for metadata/logging

5. **High availability**
   - Deploy minimum 2 VMs across zones
   - Use Load Balancer with health probes
   - Configure auto-failover for databases
   - Set up Azure Site Recovery for DR

6. **Monitoring**
   - Install Azure Monitor agent
   - Create custom dashboards for message flows
   - Set up alerts for queue depths and errors`,
    relatedServices: ['virtual-machines', 'blob-storage', 'sql-database'],
    relatedArchitectures: ['integration-engine-azure'],
  },
  {
    keywords: ['expressroute', 'hybrid', 'on-prem', 'vpn', 'connect'],
    question: 'How do I connect on-premises systems to Azure?',
    category: 'Networking',
    answer: `Options for connecting on-premises to Azure:

1. **Azure ExpressRoute (Recommended for healthcare)**
   - Dedicated private connection
   - Predictable performance (50 Mbps to 10 Gbps)
   - Doesn't traverse public internet
   - Higher cost but better for PHI
   - 99.95% SLA

2. **Site-to-Site VPN**
   - IPsec tunnel over internet
   - Up to 1.25 Gbps aggregate
   - Lower cost than ExpressRoute
   - Good for dev/test or backup path
   - Use with ExpressRoute for redundancy

3. **Implementation steps**
   - Plan IP address space (avoid conflicts)
   - Deploy Virtual Network Gateway
   - Configure on-premises router/firewall
   - Set up BGP for dynamic routing
   - Implement hub-and-spoke topology

4. **Security considerations**
   - Use Azure Firewall in hub network
   - Implement NSGs on all subnets
   - Enable DDoS Protection
   - Configure forced tunneling if needed

5. **Best practices**
   - Monitor connection health
   - Plan for failover scenarios
   - Document all network flows
   - Regular bandwidth reviews`,
    relatedServices: ['expressroute', 'firewall'],
    relatedArchitectures: ['hybrid-healthcare'],
  },
  {
    keywords: ['cost', 'pricing', 'budget', 'expensive', 'cheap'],
    question: 'What does it cost to run healthcare workloads in Azure?',
    category: 'Cost',
    answer: `Healthcare Azure costs vary by architecture:

**FHIR API Platform: $500 - $2,000/month**
- Health Data Services: ~$300-800 (based on API calls)
- API Management: ~$150-400 (Developer/Standard tier)
- Key Vault: ~$5-20
- Monitoring: ~$50-200

**Integration Engine: $1,500 - $5,000/month**
- 2x D4s_v5 VMs: ~$600
- Azure SQL: ~$200-500
- Storage: ~$50-200
- Networking: ~$100-300

**Data Lake & Analytics: $3,000 - $15,000/month**
- Synapse: ~$1,000-5,000 (based on usage)
- Storage: ~$200-1,000
- Machine Learning: ~$500-3,000

**Cost optimization strategies:**
1. Use Reserved Instances (1-3 year) - save 40-60%
2. Right-size VMs based on actual usage
3. Use auto-shutdown for dev/test
4. Implement Storage lifecycle policies
5. Use Spot VMs for non-critical workloads
6. Set budgets and alerts in Cost Management

**Free tier available:**
- Azure AD (50,000 objects)
- Key Vault (10,000 operations/month)
- Azure Monitor (5GB logs/month)
- API Management (Developer tier for dev/test)`,
    relatedServices: ['virtual-machines', 'synapse', 'health-data-services'],
    relatedArchitectures: [],
  },
];

export class AzureArchitectService {
  ask(request: AzureArchitectRequest): AzureArchitectResponse {
    const { query, context } = request;
    const queryLower = query.toLowerCase();

    // Find matching question from knowledge base
    const matchedQuestion = QUESTIONS.find(q =>
      q.keywords.some(keyword => queryLower.includes(keyword))
    );

    // Get relevant services based on query
    const relevantServices = AZURE_SERVICES.filter(service => {
      const searchText = `${service.name} ${service.description} ${service.healthcareRelevance}`.toLowerCase();
      return query.split(' ').some(word => word.length > 3 && searchText.includes(word.toLowerCase()));
    }).slice(0, 5);

    // Get relevant architectures
    const relevantArchitectures = ARCHITECTURE_TEMPLATES.filter(arch => {
      if (context?.useCase && arch.useCase === context.useCase) return true;
      const searchText = `${arch.name} ${arch.description}`.toLowerCase();
      return query.split(' ').some(word => word.length > 3 && searchText.includes(word.toLowerCase()));
    }).slice(0, 3);

    // Get relevant best practices
    const bestPractices = BEST_PRACTICES.filter(bp => {
      const searchText = `${bp.title} ${bp.description}`.toLowerCase();
      return query.split(' ').some(word => word.length > 3 && searchText.includes(word.toLowerCase()));
    }).slice(0, 3);

    // Generate answer
    let answer = matchedQuestion?.answer || this.generateGenericAnswer(query, relevantServices);

    return {
      id: uuidv4(),
      query,
      answer,
      recommendedServices: relevantServices,
      relevantArchitectures,
      bestPractices,
      additionalResources: [
        {
          title: 'Azure for Healthcare Documentation',
          url: 'https://learn.microsoft.com/azure/industry/health/',
          type: 'documentation',
        },
        {
          title: 'Azure Health Data Services',
          url: 'https://learn.microsoft.com/azure/healthcare-apis/',
          type: 'documentation',
        },
        {
          title: 'Azure Pricing Calculator',
          url: 'https://azure.microsoft.com/pricing/calculator/',
          type: 'pricing',
        },
      ],
      generatedAt: new Date().toISOString(),
    };
  }

  private generateGenericAnswer(query: string, services: AzureService[]): string {
    if (services.length === 0) {
      return `I don't have specific information about "${query}" in my healthcare Azure knowledge base.

Please try asking about:
- Setting up FHIR APIs
- HIPAA compliance in Azure
- Hosting integration engines (Cloverleaf/Mirth)
- Connecting on-premises to Azure
- Healthcare data analytics
- Disaster recovery for hospitals

Or select a specific use case from the dropdown to get architecture recommendations.`;
    }

    return `Based on your query, here are relevant Azure services for healthcare:

${services.map(s => `**${s.name}**: ${s.healthcareRelevance}`).join('\n\n')}

For specific architecture guidance, please ask about:
- How to set up [specific service]
- Best practices for [security/compliance/networking]
- Cost estimates for healthcare workloads`;
  }

  getRecommendation(request: ServiceRecommendationRequest): ServiceRecommendationResponse {
    const { useCase, requirements } = request;

    // Find matching architecture
    const architecture = ARCHITECTURE_TEMPLATES.find(a => a.useCase === useCase) || ARCHITECTURE_TEMPLATES[0];

    // Get core services
    const coreServices = AZURE_SERVICES.filter(s => architecture.services.includes(s.id));

    // Add optional services based on requirements
    const optionalServices: AzureService[] = [];

    if (requirements.highAvailability) {
      optionalServices.push(AZURE_SERVICES.find(s => s.id === 'site-recovery')!);
    }

    if (requirements.hybridConnectivity) {
      optionalServices.push(AZURE_SERVICES.find(s => s.id === 'expressroute')!);
    }

    if (requirements.multiRegion) {
      const trafficManager: AzureService = {
        id: 'traffic-manager',
        name: 'Azure Traffic Manager',
        category: 'networking',
        description: 'DNS-based traffic load balancer for global distribution.',
        healthcareRelevance: 'Route users to closest region for performance and failover.',
        hipaaCompliant: true,
        pricingTier: 'low',
        documentationUrl: 'https://learn.microsoft.com/azure/traffic-manager/',
      };
      optionalServices.push(trafficManager);
    }

    // Generate implementation steps
    const implementationSteps = [
      'Sign Microsoft BAA for HIPAA compliance',
      'Create resource groups with appropriate tags',
      'Deploy Azure Virtual Network with subnets',
      'Set up Azure Key Vault for secrets management',
      'Deploy core services: ' + coreServices.map(s => s.name).join(', '),
      'Configure identity and access management',
      'Set up Azure Monitor and Log Analytics',
      'Implement backup and disaster recovery',
      'Conduct security review and penetration testing',
      'Document architecture and runbooks',
    ];

    return {
      id: uuidv4(),
      useCase,
      coreServices: coreServices.filter(Boolean),
      optionalServices: optionalServices.filter(Boolean),
      architecture,
      estimatedCost: {
        monthly: architecture.estimatedMonthlyCost,
        breakdown: coreServices.map(s => ({
          service: s.name,
          cost: s.pricingTier === 'high' ? '$500-2000' : s.pricingTier === 'medium' ? '$100-500' : '$0-100',
        })),
      },
      implementationSteps,
      generatedAt: new Date().toISOString(),
    };
  }

  getArchitectures(): ArchitectureTemplate[] {
    return ARCHITECTURE_TEMPLATES;
  }

  getServices(): AzureService[] {
    return AZURE_SERVICES;
  }

  getBestPractices(): AzureBestPractice[] {
    return BEST_PRACTICES;
  }

  getUseCases(): Array<{ id: HealthcareUseCase; name: string; description: string }> {
    return [
      { id: 'fhir-api', name: 'FHIR API Platform', description: 'Healthcare interoperability with FHIR' },
      { id: 'integration-engine', name: 'Integration Engine', description: 'Host Cloverleaf/Mirth in Azure' },
      { id: 'data-lake', name: 'Healthcare Data Lake', description: 'Analytics and population health' },
      { id: 'hybrid-cloud', name: 'Hybrid Architecture', description: 'Connect on-premises to cloud' },
      { id: 'disaster-recovery', name: 'Disaster Recovery', description: 'Multi-region DR setup' },
      { id: 'dicom-imaging', name: 'Medical Imaging', description: 'DICOM storage and processing' },
      { id: 'ehr-integration', name: 'EHR Integration', description: 'Connect EHR systems' },
      { id: 'patient-portal', name: 'Patient Portal', description: 'Patient-facing applications' },
    ];
  }
}
