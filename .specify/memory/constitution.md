<!--
Sync Impact Report:
- Version change: none → 1.0.0
- List of modified principles: N/A (initial creation)
- Added sections:
    - Core Principles
    - Technology Stack
    - Development Workflow
    - Governance
- Removed sections: N/A
- Templates requiring updates:
    - ✅ .specify/templates/plan-template.md (No changes needed, will use new constitution)
    - ✅ .specify/templates/spec-template.md (No changes needed)
    - ✅ .specify/templates/tasks-template.md (No changes needed)
    - ✅ .gemini/commands/*.toml (No changes needed)
- Follow-up TODOs: None
-->
# ValidPEP Constitution

## Core Principles

### I. Fast, Accurate, and Actionable Validation
The core focus of ValidPEP is to provide instant (<2s), accurate (99.5% match with official validators), and actionable PEPPOL invoice validation. All error messages MUST be clear, provide user-friendly explanations, and include suggested fixes to guide users toward resolution.

### II. Superior User Experience (UX)
The platform MUST offer a clean, modern, and minimalist design to reduce cognitive load. It must be intuitive for both technical and non-technical users, featuring a responsive interface, clear status indicators, and helpful interaction patterns like progressive disclosure. Accessibility to WCAG 2.1 Level AA standards is non-negotiable.

### III. Privacy-First Architecture
User data privacy is paramount. Invoice data MUST NEVER be stored permanently on any system. All processing is ephemeral, and files are deleted immediately after validation. Data in transit MUST be encrypted using HTTPS. The system MUST be GDPR compliant, and no sensitive data from invoices may be logged or used for analytics.

### IV. High-Quality, Maintainable Code
The codebase MUST be clean, well-architected, and maintainable. This is enforced through a commitment to comprehensive test coverage (>80% unit test coverage). An automated CI/CD pipeline MUST be used for all deployments to ensure consistency and quality. Validation rules MUST be version-controlled and architected for easy updates without requiring code changes.

### V. Developer-Friendly and Extensible
While the initial focus is a user-friendly web interface, the system MUST be designed for future extension and integration. The architecture should be modular to support future features like batch validation, API access, and custom rule sets. Future API development should follow modern standards to ensure it is intuitive for developers.

## Technology Stack

The technology stack is defined to ensure consistency and leverage modern, efficient tools for development and deployment.
- **Frontend:** React 18+ with TypeScript, styled with Tailwind CSS, and built with Vite.
- **Backend:** Vercel Serverless Functions running on Node.js 20+. API routes will be handled by Next.js.
- **Data & Cache:** Vercel KV (Redis) will be used for caching validation rules and code lists. No persistent user data will be stored.

## Development Workflow

The development process is designed to ensure quality and rapid iteration, following a continuous integration and deployment (CI/CD) model.
1.  All code changes MUST be introduced through GitHub Pull Requests.
2.  Automated tests (Unit and Integration) MUST pass in the CI pipeline before a PR can be merged.
3.  All PRs generate a preview deployment on Vercel for manual review and testing.
4.  After approval and merging to the `main` branch, changes are automatically deployed to the production environment.
5.  The testing strategy includes:
    - **Unit Tests:** >80% coverage for all new logic.
    - **Integration Tests:** End-to-end validation pipeline tests.
    - **E2E Tests:** Critical user journey validation.
    - **Manual Testing:** Accessibility audits and UX flow reviews.

## Governance

This constitution is the source of truth for all project principles and practices. All development, reviews, and deployments must comply with it.
- **Amendment:** Changes to this constitution require a pull request, documentation of the rationale, and approval from the technical lead.
- **Compliance:** All pull request reviews MUST verify compliance with the principles outlined herein. Any deviation requires explicit justification and approval.
- **Versioning:** This document follows semantic versioning.

**Version**: 1.0.0 | **Ratified**: 2025-11-12 | **Last Amended**: 2025-11-12