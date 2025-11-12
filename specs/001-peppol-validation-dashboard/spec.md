# Feature Specification: ValidPEP PEPPOL BIS Billing Validation Dashboard

**Feature Branch**: `001-peppol-validation-dashboard`  
**Created**: 2025-11-12  
**Status**: Draft  
**Input**: User description: "ValidPEP is a modern web-based PEPPOL BIS Billing validation dashboard that addresses critical pain points in electronic invoice compliance. The platform provides real-time validation, enhanced error reporting, and actionable insights for businesses implementing PEPPOL e-invoicing. More detailed PRD is in @/Users/ntufar/projects/ValidPEP/docs/validpep-prd.md"

## Clarifications
### Session 2025-11-12
- Q: How should a validated invoice be uniquely identified for audit trails or future reference, given the privacy-first approach? → A: Content Hash (e.g., SHA256)
- Q: What are the distinct states an invoice can be in during the validation process, and how should these states be communicated to the user? → A: Uploading -> Parsing -> Validating (Schema) -> Validating (Schematron) -> Validated/Invalid
- Q: Given the privacy-first approach, what operational metrics or logs (if any) will be collected to monitor the health and performance of the validation service without compromising user data? → A: Aggregate metrics only (e.g., total validations, error counts by type, average validation time)
- Q: How should the system behave if external PEPPOL validation artifacts or code lists are temporarily unavailable or return unexpected data? → A: Use cached versions of artifacts/code lists if available
- Q: What is the desired user experience and system behavior when a user exceeds the validation rate limits (e.g., for UI-based validation)? → A: No explicit rate limiting for UI-based validation in MVP

## User Scenarios & Testing (mandatory)

### User Story 1 - Drag and Drop Validation (Priority: P1)

As an accountant, I want to drag and drop an invoice XML file so that I can quickly validate it without navigating file dialogs.

**Why this priority**: This is a core user interaction for quick and easy validation, directly addressing a pain point of cumbersome file uploads.

**Independent Test**: Can be fully tested by dragging an XML file onto the designated area and observing the immediate start of validation.

**Acceptance Scenarios**:

1.  **Given** the user is on the homepage, **When** an XML file is dragged over the drop zone, **Then** visual feedback (e.g., highlight) is provided.
2.  **Given** an XML file is dropped onto the drop zone, **When** the file is valid, **Then** validation starts immediately.
3.  **Given** an invalid file type (e.g., .pdf) is dropped, **When** the file is processed, **Then** an error message indicating invalid file type is displayed.

---

### User Story 2 - Detailed Error Messages (Priority: P1)

As a developer, I want to see detailed error messages with line numbers so that I can quickly fix validation issues.

**Why this priority**: Crucial for developers and technical users to efficiently debug and resolve compliance issues.

**Independent Test**: Can be fully tested by uploading an invalid XML file and verifying that error messages include line numbers and clear explanations.

**Acceptance Scenarios**:

1.  **Given** an invalid XML file has been validated, **When** the validation results are displayed, **Then** each error shows the XML line number.
2.  **Given** an error is displayed, **When** the user reviews it, **Then** the error message explains what is wrong in plain language.
3.  **Given** an error is displayed, **When** the user clicks on it, **Then** the corresponding XML section is highlighted.

---

### User Story 3 - Clear Validation Status (Priority: P1)

As a business owner, I want to know if my invoice is valid with a clear yes/no answer so that I can confidently send it.

**Why this priority**: Provides immediate and unambiguous feedback for non-technical users, building confidence in compliance.

**Independent Test**: Can be fully tested by validating both valid and invalid invoices and observing the prominent status indicator.

**Acceptance Scenarios**:

1.  **Given** a valid invoice has been validated, **When** the results are displayed, **Then** a large, clear "Valid" status badge is shown.
2.  **Given** an invalid invoice has been validated, **When** the results are displayed, **Then** a large, clear "Invalid" status badge is shown, along with a summary of errors.
3.  **Given** a valid invoice, **When** validation is complete, **Then** an option to download a validation certificate is available.

---

### User Story 4 - Suggested Fixes for Errors (Priority: P2)

As a finance team member, I want suggested fixes for common errors so that I can resolve issues without technical expertise.

**Why this priority**: Enhances user experience for non-technical users by guiding them to solutions, reducing reliance on support.

**Independent Test**: Can be tested by uploading files with common errors and verifying that actionable suggestions are provided for each.

**Acceptance Scenarios**:

1.  **Given** an error is displayed, **When** the user views the error details, **Then** a "Suggested Fix" section is present.
2.  **Given** a common error, **When** a suggestion is provided, **Then** the suggestion is actionable and specific.

---

### User Story 5 - Exact XML Path for Errors (Priority: P2)

As a developer, I want to see the exact XML path of errors so that I can programmatically fix issues in my code.

**Why this priority**: Provides technical detail essential for automated processing and integration by developers.

**Independent Test**: Can be tested by uploading an invalid XML and verifying that the XPath for each error is correctly displayed and copyable.

**Acceptance Scenarios**:

1.  **Given** an error is displayed, **When** the user views the error details, **Then** the XPath for the error location is displayed.
2.  **Given** the XPath is displayed, **When** the user interacts with it, **Then** the XPath can be copied to the clipboard.

---

### User Story 6 - Multi-Format Support (Priority: P2)

As an integrator, I want to validate both UBL and CII formats so that I can support diverse client needs.

**Why this priority**: Broadens the utility of the platform by supporting key e-invoicing standards.

**Independent Test**: Can be tested by uploading both UBL and CII formatted invoices and confirming successful validation for both.

**Acceptance Scenarios**:

1.  **Given** a UBL formatted invoice is uploaded, **When** validation occurs, **Then** the system automatically detects UBL format and applies UBL-specific rules.
2.  **Given** a CII formatted invoice is uploaded, **When** validation occurs, **Then** the system automatically detects CII format and applies CII-specific rules.

---

### User Story 7 - Country-Specific Validation (Priority: P2)

As a multinational company, I want country-specific validation so that invoices comply with local PEPPOL requirements.

**Why this priority**: Ensures compliance with regional variations of PEPPOL standards, critical for international operations.

**Independent Test**: Can be tested by uploading invoices for supported countries (NO, SE, DK, NL, DE) and verifying that country-specific rules are applied.

**Acceptance Scenarios**:

1.  **Given** an invoice for a supported country (e.g., Norway) is uploaded, **When** validation occurs, **Then** the system detects the country and applies Norway-specific PEPPOL rules.
2.  **Given** an invoice is uploaded, **When** the system detects the country, **Then** the detected country is clearly indicated in the validation results.

---

### User Story 8 - Download Validation Reports (Priority: P3)

As a compliance officer, I want to download validation reports so that I can maintain audit trails.

**Why this priority**: Provides essential functionality for record-keeping and compliance auditing.

**Independent Test**: Can be tested by validating an invoice and then downloading the report in both JSON and HTML formats.

**Acceptance Scenarios**:

1.  **Given** an invoice has been validated, **When** the user requests a report download, **Then** the report can be downloaded as a JSON file.
2.  **Given** an invoice has been validated, **When** the user requests a report download, **Then** the report can be downloaded as an HTML file.

---

### User Story 9 - Example Valid Invoices (Priority: P3)

As a new user, I want example valid invoices so that I can understand the expected format.

**Why this priority**: Aids user onboarding and understanding of the system's expectations.

**Independent Test**: Can be tested by navigating to the examples section and downloading various valid invoice samples.

**Acceptance Scenarios**:

1.  **Given** the user is on the documentation or homepage, **When** they look for examples, **Then** a library of example valid invoices is available.
2.  **Given** example invoices are available, **When** the user selects one, **Then** they can download examples for different countries and document types.

### Edge Cases

-   **Invalid XML Structure**: What happens when a non-XML file or malformed XML is uploaded? (Should result in a clear error message indicating parsing failure).
-   **Large File Uploads**: How does the system handle files close to or exceeding the 10 MB limit? (Should provide a clear message if too large, and maintain performance for files within limits).
-   **Encoding Issues**: How does the system handle invoices with unusual or mixed character encodings? (Should attempt to detect and process common encodings, and report issues if unresolvable).
-   **No Internet Connection**: What is the user experience if the backend validation service is unreachable? (Should gracefully degrade, potentially offering client-side schema validation if possible, and inform the user).
-   **Rapid Consecutive Validations**: How does the system handle a user submitting multiple validation requests in quick succession? (For MVP, there is no explicit rate limiting for UI-based validation. The system should handle as many as resources allow without crashing).

## Requirements (mandatory)

### Functional Requirements

-   **FR1: File Upload and Processing**
    -   **FR1.1:** Support drag-and-drop file upload
    -   **FR1.2:** Accept .xml files up to 10 MB
    -   **FR1.3:** Detect format automatically (UBL vs CII)
    -   **FR1.4:** Display file metadata (size, format, detected version)
    -   **FR1.5:** Allow URL-based file import
    -   **FR1.6:** Support multiple file encoding (UTF-8, ISO-8859-1)

-   **FR2: Validation Engine**
    -   **FR2.1:** Validate against PEPPOL BIS Billing 3.0.19 specification
    -   **FR2.2:** Perform XSD schema validation
    -   **FR2.3:** Execute Schematron business rules
    -   **FR2.4:** Validate country-specific rules (NO, SE, DK, NL, DE)
    -   **FR2.5:** Check code list compliance (ISO codes, VAT categories)
    -   **FR2.6:** Detect encoding issues and special characters
    -   **FR2.7:** Validate calculation correctness (totals, VAT, rounding)
    -   **FR2.8:** Use cached versions of external PEPPOL validation artifacts and code lists if live versions are temporarily unavailable.

-   **FR3: Error Reporting**
    -   **FR3.1:** Display errors categorized by severity (Error, Warning, Info)
    -   **FR3.2:** Show line numbers and XML path for each issue
    -   **FR3.3:** Provide plain-language explanation for each error
    -   **FR3.4:** Suggest specific fixes for common errors
    -   **FR3.5:** Highlight problematic XML sections
    -   **FR3.6:** Link to relevant PEPPOL specification sections
    -   **FR3.7:** Display error statistics summary

-   **FR4: User Interface**
    -   **FR4.1:** Clean, modern dashboard design
    -   **FR4.2:** Real-time validation progress indicator, displaying states: Uploading, Parsing, Validating (Schema), Validating (Schematron), Validated/Invalid.
    -   **FR4.3:** Split view: XML source + validation results
    -   **FR4.4:** Syntax highlighting for XML
    -   **FR4.5:** Clickable errors that jump to XML location
    -   **FR4.6:** Responsive design (desktop, tablet)
    -   **FR4.7:** Dark/light mode toggle
    -   **FR4.8:** Keyboard shortcuts for power users

-   **FR5: Export and Sharing**
    -   **FR5.1:** Download validation report as JSON
    -   **FR5.2:** Download validation report as HTML
    -   **FR5.3:** Copy shareable validation summary
    -   **FR5.4:** Export annotated XML with error comments
    -   **FR5.5:** Generate validation certificate for passed invoices

-   **FR6: Documentation and Help**
    -   **FR6.1:** Inline tooltips for technical terms
    -   **FR6.2:** Getting started guide
    -   **FR6.3:** FAQ section
    -   **FR6.4:** PEPPOL specification reference
    -   **FR6.5:** Example valid invoices (downloadable)
    -   **FR6.6:** Common error solutions knowledge base

### Key Entities

-   **Invoice**: The XML document representing an electronic invoice (UBL or CII format) that is submitted for validation.
    -   *Attributes (conceptual):* Content (XML data), Format (UBL/CII), Size, Encoding, Country (detected/specified).
    -   *Unique Identifier:* Content Hash (e.g., SHA256)
-   **Validation Rule**: A specific rule or set of rules (e.g., XSD schema, Schematron business rule, country-specific rule) used to check the compliance of an Invoice.
    -   *Attributes (conceptual):* Type (XSD/Schematron/Country), Version, Severity.
-   **Validation Result**: The outcome of applying Validation Rules to an Invoice, comprising a collection of issues.
    -   *Attributes (conceptual):* Overall Status (Valid/Invalid), List of Issues.
-   **Issue**: A specific error, warning, or informational message generated during validation.
    -   *Attributes (conceptual):* Severity (Error/Warning/Info), Message (plain language), Code, XPath, Line Number, Suggested Fix, Link to Specification.

## Success Criteria (mandatory)

### Measurable Outcomes

-   **SC-001**: Validation accuracy: 99.5% match with official PEPPOL validators.
-   **SC-002**: Performance: <2s validation time for typical invoices (<500 KB).
-   **SC-003**: User engagement: 60%+ return user rate within 30 days.
-   **SC-004**: Error resolution: 80%+ of users successfully fix errors within 3 attempts.
-   **SC-005**: System uptime: 99.5% availability.
-   **SC-006**: Initial page load: <1 second.
-   **SC-007**: Handle 10,000 validations/day on free tier.
-   **SC-008**: Operational monitoring provides aggregate metrics (total validations, error counts by type, average validation time) without compromising user data.