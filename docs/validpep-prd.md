# ValidPEP - Product Requirements Document

**Version:** 1.0  
**Last Updated:** November 12, 2025  
**Project Status:** Planning Phase  
**Deployment Platform:** Vercel

---

## Executive Summary

ValidPEP is a modern web-based PEPPOL BIS Billing validation dashboard that addresses critical pain points in electronic invoice compliance. The platform provides real-time validation, enhanced error reporting, and actionable insights for businesses implementing PEPPOL e-invoicing.

**Core Value Proposition:** Fast, accurate PEPPOL invoice validation with superior UX and privacy-first architecture.

---

## Problem Statement

Current PEPPOL validation tools suffer from:
- Poor error messaging that doesn't guide users to fixes
- Encoding issues with special characters
- Rate limits and capacity constraints
- Lack of historical tracking and analytics
- Frequent specification updates causing confusion
- No batch validation capabilities
- Limited support for country-specific rules

---

## Goals and Success Metrics

### Primary Goals
1. Provide instant, accurate PEPPOL BIS Billing 3.0 validation
2. Deliver actionable error messages with suggested fixes
3. Support both UBL and CII formats
4. Maintain privacy-first architecture (data never stored permanently)

### Success Metrics
- **Validation accuracy:** 99.5% match with official PEPPOL validators
- **Performance:** <2s validation time for typical invoices
- **User engagement:** 60%+ return user rate within 30 days
- **Error resolution:** 80%+ of users successfully fix errors within 3 attempts

---

## Target Audience

### Primary Users
1. **ERP Developers/Integrators** - Building PEPPOL compliance into systems
2. **Accountants/Finance Teams** - Validating outbound invoices before sending
3. **Small Business Owners** - Ensuring compliance without technical expertise
4. **PEPPOL Service Providers** - Testing and debugging implementations

### User Personas

**Persona 1: Developer Dan**
- Integrating PEPPOL into company ERP
- Needs API access and batch validation
- Values technical accuracy and detailed error codes
- Wants CI/CD pipeline integration

**Persona 2: Accountant Anna**
- Validates 20-50 invoices daily
- Non-technical, needs clear guidance
- Wants historical tracking of validations
- Values reliability and ease of use

---

## Scope

### Phase 1 - MVP (Target: 8 weeks)

#### In Scope
- Single file validation (UBL and CII)
- Core PEPPOL BIS Billing 3.0.19 rules
- Schema (XSD) validation
- Schematron business rule validation
- Basic error reporting with line numbers
- Responsive web interface
- File drag-and-drop upload
- Download validation report (JSON/HTML)
- Privacy-first: all validation in browser or ephemeral backend
- Support for major countries: Norway, Sweden, Denmark, Netherlands, Germany

#### Out of Scope (Future Phases)
- User accounts and authentication
- Historical validation tracking
- Batch validation (>10 files)
- API access
- Advanced analytics dashboard
- Custom rule configuration
- Multi-language interface
- Mobile app

### Phase 2 - Enhanced Features (Target: +6 weeks)
- Batch validation (up to 100 files)
- User accounts (optional, for history)
- Validation history dashboard
- Basic analytics (success rates, common errors)
- API access (rate-limited)
- Export reports as PDF

### Phase 3 - Enterprise Features (Target: +8 weeks)
- Advanced analytics and insights
- Custom rule sets
- Team collaboration features
- Webhook notifications
- Premium API tier with higher limits
- White-label options

---

## Functional Requirements

### FR1: File Upload and Processing
- **FR1.1:** Support drag-and-drop file upload
- **FR1.2:** Accept .xml files up to 10 MB
- **FR1.3:** Detect format automatically (UBL vs CII)
- **FR1.4:** Display file metadata (size, format, detected version)
- **FR1.5:** Allow URL-based file import
- **FR1.6:** Support multiple file encoding (UTF-8, ISO-8859-1)

### FR2: Validation Engine
- **FR2.1:** Validate against PEPPOL BIS Billing 3.0.19 specification
- **FR2.2:** Perform XSD schema validation
- **FR2.3:** Execute Schematron business rules
- **FR2.4:** Validate country-specific rules (NO, SE, DK, NL, DE)
- **FR2.5:** Check code list compliance (ISO codes, VAT categories)
- **FR2.6:** Detect encoding issues and special characters
- **FR2.7:** Validate calculation correctness (totals, VAT, rounding)

### FR3: Error Reporting
- **FR3.1:** Display errors categorized by severity (Error, Warning, Info)
- **FR3.2:** Show line numbers and XML path for each issue
- **FR3.3:** Provide plain-language explanation for each error
- **FR3.4:** Suggest specific fixes for common errors
- **FR3.5:** Highlight problematic XML sections
- **FR3.6:** Link to relevant PEPPOL specification sections
- **FR3.7:** Display error statistics summary

### FR4: User Interface
- **FR4.1:** Clean, modern dashboard design
- **FR4.2:** Real-time validation progress indicator
- **FR4.3:** Split view: XML source + validation results
- **FR4.4:** Syntax highlighting for XML
- **FR4.5:** Clickable errors that jump to XML location
- **FR4.6:** Responsive design (desktop, tablet)
- **FR4.7:** Dark/light mode toggle
- **FR4.8:** Keyboard shortcuts for power users

### FR5: Export and Sharing
- **FR5.1:** Download validation report as JSON
- **FR5.2:** Download validation report as HTML
- **FR5.3:** Copy shareable validation summary
- **FR5.4:** Export annotated XML with error comments
- **FR5.5:** Generate validation certificate for passed invoices

### FR6: Documentation and Help
- **FR6.1:** Inline tooltips for technical terms
- **FR6.2:** Getting started guide
- **FR6.3:** FAQ section
- **FR6.4:** PEPPOL specification reference
- **FR6.5:** Example valid invoices (downloadable)
- **FR6.6:** Common error solutions knowledge base

---

## Non-Functional Requirements

### NFR1: Performance
- Validation completion: <2 seconds for typical invoice (<500 KB)
- Initial page load: <1 second
- Frontend validation (when possible): <500ms
- Backend API response: <3 seconds (p95)
- Support 100 concurrent validations

### NFR2: Reliability
- Uptime: 99.5% availability
- Zero data loss (ephemeral processing acceptable)
- Graceful degradation if backend unavailable
- Automatic fallback to frontend validation

### NFR3: Security and Privacy
- No permanent storage of invoice data
- All uploads encrypted in transit (HTTPS)
- Backend processing: files deleted after validation
- No logging of invoice contents
- GDPR compliant
- No third-party analytics tracking sensitive data
- CSP headers to prevent XSS

### NFR4: Scalability
- Handle 10,000 validations/day on free tier
- Designed to scale to 100,000/day with minimal changes
- Efficient caching of validation rules
- CDN for static assets

### NFR5: Maintainability
- Clean code architecture
- Comprehensive test coverage (>80%)
- Automated deployment pipeline
- Version-controlled validation rules
- Easy rule updates without code changes

### NFR6: Compatibility
- Support latest 2 versions of Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome Android)
- Minimum screen width: 320px
- Works without JavaScript (basic validation only)

### NFR7: Accessibility
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatible
- Color contrast ratios meet standards
- Alt text for all images

---

## Technical Architecture

### Frontend Stack
- **Framework:** React 18+ with TypeScript
- **Styling:** Tailwind CSS
- **XML Parsing:** fast-xml-parser
- **Code Editor:** Monaco Editor (VS Code engine)
- **State Management:** React Context + Hooks
- **Build Tool:** Vite
- **Testing:** Vitest + React Testing Library

### Backend Stack
- **Platform:** Vercel Serverless Functions
- **Runtime:** Node.js 20+
- **Validation Engine:** 
  - XSD: libxmljs2
  - Schematron: Custom implementation or xslt3
- **Caching:** Vercel KV (Redis)
- **API Framework:** Next.js API Routes

### Data Storage
- **Cache:** Vercel KV (validation rules, code lists)
- **Future:** Vercel Postgres (user accounts, history)
- **Files:** Ephemeral only, no persistent storage

### External Dependencies
- PEPPOL validation artifacts (Schematron rules)
- ISO code lists (countries, currencies)
- PEPPOL code lists (VAT categories, document types)

### Architecture Diagram
```
┌─────────────────────────────────────────┐
│         User Browser                    │
│  ┌─────────────────────────────────┐   │
│  │   React Frontend App             │   │
│  │   - File upload UI               │   │
│  │   - Basic validation (XSD)       │   │
│  │   - Result visualization         │   │
│  └──────────────┬──────────────────┘   │
└─────────────────┼───────────────────────┘
                  │
                  │ HTTPS
                  ▼
┌─────────────────────────────────────────┐
│         Vercel Platform                  │
│  ┌──────────────────────────────────┐  │
│  │   Static Hosting (Frontend)      │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │   Serverless Functions           │  │
│  │   - /api/validate (complex)      │  │
│  │   - /api/rules (rule updates)    │  │
│  │   - /api/batch (future)          │  │
│  └──────────────┬───────────────────┘  │
│                 │                        │
│  ┌──────────────▼───────────────────┐  │
│  │   Vercel KV (Redis Cache)        │  │
│  │   - Validation rules             │  │
│  │   - Code lists                   │  │
│  │   - Result cache (optional)      │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## User Stories

### Epic 1: Basic Validation

**US1.1:** As an accountant, I want to drag and drop an invoice XML file so that I can quickly validate it without navigating file dialogs.
- **Acceptance Criteria:**
  - Drop zone visible on homepage
  - Visual feedback when file hovers over drop zone
  - File validation starts immediately after drop
  - Error message if file type is invalid

**US1.2:** As a developer, I want to see detailed error messages with line numbers so that I can quickly fix validation issues.
- **Acceptance Criteria:**
  - Each error shows XML line number
  - Error message explains what's wrong in plain language
  - Clicking error highlights corresponding XML
  - Errors categorized by type (schema, business rule)

**US1.3:** As a business owner, I want to know if my invoice is valid with a clear yes/no answer so that I can confidently send it.
- **Acceptance Criteria:**
  - Large, clear validation status badge (✓ Valid / ✗ Invalid)
  - Summary shows total errors/warnings
  - Option to download validation certificate if valid
  - Clear next steps if invalid

### Epic 2: Error Resolution

**US2.1:** As a finance team member, I want suggested fixes for common errors so that I can resolve issues without technical expertise.
- **Acceptance Criteria:**
  - Each error includes "Suggested Fix" section
  - Fix suggestions are actionable and specific
  - Links to documentation when needed
  - Common errors have interactive examples

**US2.2:** As a developer, I want to see the exact XML path of errors so that I can programmatically fix issues in my code.
- **Acceptance Criteria:**
  - XPath displayed for each error
  - Ability to copy XPath to clipboard
  - XPath navigable in XML viewer
  - Technical details toggleable for non-technical users

### Epic 3: Multi-Format Support

**US3.1:** As an integrator, I want to validate both UBL and CII formats so that I can support diverse client needs.
- **Acceptance Criteria:**
  - Automatic format detection
  - Clear indication of detected format
  - Format-specific validation rules applied
  - No user configuration required

**US3.2:** As a multinational company, I want country-specific validation so that invoices comply with local PEPPOL requirements.
- **Acceptance Criteria:**
  - Country detection from invoice data
  - Manual country override option
  - Country-specific rules clearly indicated in results
  - Support for NO, SE, DK, NL, DE rules

### Epic 4: Export and Documentation

**US4.1:** As a compliance officer, I want to download validation reports so that I can maintain audit trails.
- **Acceptance Criteria:**
  - Download as JSON (machine-readable)
  - Download as HTML (human-readable)
  - Report includes timestamp and file hash
  - Report includes validation rule version

**US4.2:** As a new user, I want example valid invoices so that I can understand the expected format.
- **Acceptance Criteria:**
  - Library of example invoices
  - Examples for different countries
  - Examples for different document types
  - Examples for edge cases (credits, prepayments)

---

## UI/UX Requirements

### Visual Design Principles
- **Minimalist:** Clean interface, reduce cognitive load
- **Trust-building:** Professional appearance, clear validation status
- **Efficiency:** Minimal clicks to complete validation
- **Forgiving:** Clear error recovery paths

### Key Screens

#### 1. Homepage / Upload Screen
- Hero section explaining ValidPEP
- Prominent drop zone for file upload
- "Try Example" button with sample invoices
- Quick stats (validations performed, success rate)

#### 2. Validation Results Screen
- Top: Status banner (✓ Valid or ✗ Invalid + error count)
- Left panel: XML source with syntax highlighting
- Right panel: Error list with filters (Error/Warning/Info)
- Bottom: Action buttons (Download Report, Validate Another)

#### 3. Error Detail View
- Error title and code
- Plain language explanation
- Suggested fix with code example
- Link to specification section
- XML context showing surrounding lines

#### 4. Documentation Page
- Getting started guide
- FAQ
- PEPPOL specification quick reference
- API documentation (future)

### Interaction Patterns
- **Progressive disclosure:** Show basic info first, technical details on demand
- **Immediate feedback:** Validation starts on file upload
- **Non-blocking:** User can review XML while validation runs
- **Keyboard shortcuts:** Power users can navigate without mouse

---

## API Specification (Future Phase 2)

### Endpoint: POST /api/validate

**Request:**
```json
{
  "file": "base64_encoded_xml",
  "format": "ubl|cii|auto",
  "country": "NO|SE|DK|NL|DE|auto",
  "options": {
    "includeWarnings": true,
    "includeXPath": true
  }
}
```

**Response:**
```json
{
  "valid": true,
  "format": "ubl",
  "version": "3.0.19",
  "country": "NO",
  "timestamp": "2025-11-12T10:30:00Z",
  "errors": [],
  "warnings": [
    {
      "code": "W001",
      "severity": "warning",
      "message": "Invoice date is in the future",
      "xpath": "/Invoice/IssueDate",
      "line": 12,
      "suggestion": "Verify the invoice date is correct"
    }
  ],
  "statistics": {
    "totalLines": 450,
    "errorCount": 0,
    "warningCount": 1
  }
}
```

### Rate Limits (Free Tier)
- 100 requests/hour per IP
- 1000 requests/day per IP
- Header: `X-RateLimit-Remaining`

---

## Deployment Strategy

### Vercel Configuration
- **Frontend:** Static site generation
- **Functions:** Serverless with 10s timeout
- **Regions:** Auto (edge network)
- **Environment:** Production + Preview branches

### CI/CD Pipeline
1. **Commit to GitHub**
2. **Automated Tests:** Unit + Integration
3. **Preview Deployment:** Test environment on Vercel
4. **Manual Review:** Check preview
5. **Merge to Main:** Auto-deploy to production
6. **Post-Deploy Tests:** Smoke tests on production

### Monitoring
- **Vercel Analytics:** Page views, performance
- **Custom Monitoring:** Validation success rates, error types
- **Uptime:** External monitoring (UptimeRobot)
- **Logs:** Vercel function logs for debugging

### Rollback Strategy
- Instant rollback via Vercel dashboard
- Previous deployments always available
- Database migrations backward-compatible

---

## Testing Strategy

### Unit Tests (Target: 80% coverage)
- Validation logic
- XML parsing
- Error formatting
- Utility functions

### Integration Tests
- API endpoints
- File upload flow
- Validation pipeline end-to-end

### E2E Tests
- Critical user journeys
- Cross-browser compatibility
- Mobile responsiveness

### Manual Testing
- Accessibility audit
- UX flow review
- Real PEPPOL invoice samples

### Test Data
- Official PEPPOL test files
- Real anonymized invoices (with permission)
- Edge cases (large files, special characters)
- Invalid samples for negative testing

---

## Risk Management

### Technical Risks

**Risk 1: Vercel timeout on complex validations**
- **Likelihood:** Medium
- **Impact:** High
- **Mitigation:** Implement frontend validation fallback, optimize Schematron processing

**Risk 2: PEPPOL specification changes**
- **Likelihood:** High (regular updates)
- **Impact:** Medium
- **Mitigation:** Version-controlled rules, automated update checks, notification system

**Risk 3: Validation accuracy discrepancies**
- **Likelihood:** Medium
- **Impact:** High
- **Mitigation:** Extensive testing against official validators, community feedback loop

### Business Risks

**Risk 4: Low user adoption**
- **Likelihood:** Medium
- **Impact:** High
- **Mitigation:** Focus on superior UX, developer outreach, SEO optimization

**Risk 5: Scaling costs exceeding free tier**
- **Likelihood:** High (if successful)
- **Impact:** Medium
- **Mitigation:** Optimize for efficiency, implement caching, plan monetization strategy

---

## Launch Plan

### Pre-Launch (Weeks 1-2)
- Set up development environment
- Design mockups and prototypes
- Set up GitHub repository and Vercel project
- Obtain PEPPOL validation artifacts

### Development (Weeks 3-8)
- Week 3-4: Core validation engine
- Week 5-6: UI implementation
- Week 7: Integration and testing
- Week 8: Polish and bug fixes

### Soft Launch (Week 9)
- Private beta with 10-20 users
- Gather feedback
- Fix critical issues
- Refine UX based on feedback

### Public Launch (Week 10)
- Publish to Product Hunt
- Post on relevant forums (PEPPOL community, accounting subreddits)
- SEO optimization
- Documentation completion

### Post-Launch
- Monitor usage and errors
- Weekly updates based on feedback
- Plan Phase 2 features
- Build community

---

## Success Criteria

### MVP Success (3 months post-launch)
- ✓ 1,000+ unique users
- ✓ 10,000+ validations performed
- ✓ 99%+ validation accuracy vs official validators
- ✓ <2s average validation time
- ✓ 50%+ return user rate
- ✓ Positive feedback from 5+ beta users

### Long-term Success (12 months)
- ✓ 10,000+ monthly active users
- ✓ API adoption by 50+ developers
- ✓ Mentioned in PEPPOL community resources
- ✓ Revenue-positive (if monetized)
- ✓ Recognition as go-to PEPPOL validator

---

## Future Considerations

### Potential Features
- Real-time collaborative validation
- Integration with popular accounting software
- Machine learning for error prediction
- Mobile app (iOS/Android)
- Enterprise on-premise deployment
- Blockchain-based validation certificates

### Monetization Options (Post-MVP)
- Freemium: Free for <100 validations/month
- API access tiers: $9/mo (10k calls), $49/mo (100k calls)
- Enterprise licenses: Custom pricing
- White-label solution: $499/mo
- Consulting services: PEPPOL implementation help

### Partnerships
- PEPPOL Service Providers
- Accounting software vendors
- ERP integration partners
- PEPPOL authorities (for official endorsement)

---

## Appendices

### Appendix A: PEPPOL Resources
- PEPPOL BIS Billing 3.0 Specification: https://docs.peppol.eu/poacc/billing/3.0/
- Validation Artifacts: https://github.com/OpenPEPPOL/peppol-bis-invoice-3
- Code Lists: https://docs.peppol.eu/poacc/billing/3.0/codelist/

### Appendix B: Competitor Analysis
- OpenPEPPOL Validator: Official but limited UX
- Ecosio Validator: Good but proprietary
- Pagero Validator: Enterprise-focused
- **Gap:** No modern, developer-friendly, open alternative

### Appendix C: Legal Considerations
- Terms of Service required
- Privacy Policy (GDPR compliance)
- Disclaimer: Tool for assistance, not legal compliance guarantee
- Open source licensing (consider MIT or Apache 2.0)

---

**Document Owner:** Product Lead  
**Technical Lead:** TBD  
**Last Review Date:** November 12, 2025  
**Next Review Date:** December 12, 2025