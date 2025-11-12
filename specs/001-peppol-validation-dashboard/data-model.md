# Data Model: ValidPEP PEPPOL BIS Billing Validation Dashboard

**Date**: 2025-11-12
**Feature**: [Link to spec.md](../spec.md)

## Introduction

This document outlines the conceptual data model for the ValidPEP PEPPOL BIS Billing Validation Dashboard, derived from the feature specification and clarifications. It defines the key entities, their attributes, relationships, and relevant state transitions.

## Entities

### 1. Invoice

Represents an electronic invoice document submitted for validation. Its content is ephemeral and not stored permanently.

*   **Attributes:**
    *   `id`: String (SHA256 Content Hash of the invoice XML) - **Primary Key**. Used for unique identification in audit trails and reports.
    *   `content`: String (Full XML data of the invoice) - **Ephemeral**. This attribute is processed in-memory and never persisted.
    *   `format`: Enum (`UBL`, `CII`) - Automatically detected format of the invoice.
    *   `size`: Number (in bytes) - Size of the invoice XML file.
    *   `encoding`: String (e.g., `UTF-8`, `ISO-8859-1`) - Detected character encoding of the invoice.
    *   `country`: String (e.g., `NO`, `SE`, `DK`, `NL`, `DE`) - Detected or user-specified country for country-specific validation rules.
    *   `status`: Enum (`Uploading`, `Parsing`, `Validating_Schema`, `Validating_Schematron`, `Validated`, `Invalid`) - Current state of the invoice within the validation pipeline.
    *   `validationResultId`: String (UUID) - **Foreign Key** to `ValidationResult`. Represents the outcome of the validation process for this invoice.

*   **State Transitions (for `status` attribute):**
    *   `Uploading` → `Parsing`
    *   `Parsing` → `Validating_Schema` (on successful parse)
    *   `Parsing` → `Invalid` (on parsing failure)
    *   `Validating_Schema` → `Validating_Schematron` (on successful schema validation)
    *   `Validating_Schema` → `Invalid` (on schema validation failure)
    *   `Validating_Schematron` → `Validated` (on successful Schematron validation)
    *   `Validating_Schematron` → `Invalid` (on Schematron validation failure)

### 2. ValidationRule

Represents a specific rule or set of rules used to check the compliance of an Invoice. These rules are cached for performance.

*   **Attributes:**
    *   `id`: String (Unique identifier for the rule, e.g., `PEPPOL_BIS_3.0.19_XSD`, `PEPPOL_BIS_3.0.19_SCH_NO`) - **Primary Key**.
    *   `type`: Enum (`XSD`, `Schematron`, `Country_Specific`) - The type of validation rule.
    *   `version`: String (e.g., `3.0.19`) - Version of the PEPPOL specification the rule applies to.
    *   `severity`: Enum (`Error`, `Warning`, `Info`) - Default severity level associated with the rule.
    *   `description`: String - A brief human-readable description of the rule.
    *   `source`: String (URL or path) - Reference to the rule definition (e.g., XSD file, Schematron file).
    *   `lastUpdated`: DateTime - Timestamp of when the rule was last updated/fetched.

### 3. ValidationResult

Represents the comprehensive outcome of applying all relevant `ValidationRule`s to an `Invoice`.

*   **Attributes:**
    *   `id`: String (UUID) - **Primary Key**.
    *   `invoiceId`: String (SHA256 Content Hash) - **Foreign Key** to `Invoice`.
    *   `overallStatus`: Enum (`Valid`, `Invalid`) - The final validation status of the invoice.
    *   `timestamp`: DateTime - The exact time when the validation was completed.
    *   `totalErrors`: Number - Count of issues with `Error` severity.
    *   `totalWarnings`: Number - Count of issues with `Warning` severity.
    *   `totalInfos`: Number - Count of issues with `Info` severity.
    *   `issues`: Array of `Issue` IDs - **One-to-many relationship** with `Issue` entities.

### 4. Issue

Represents a single error, warning, or informational message generated during the validation of an `Invoice`.

*   **Attributes:**
    *   `id`: String (UUID) - **Primary Key**.
    *   `validationResultId`: String (UUID) - **Foreign Key** to `ValidationResult`.
    *   `severity`: Enum (`Error`, `Warning`, `Info`) - The severity level of the issue.
    *   `code`: String (e.g., `BR-DE-12`) - A specific code identifying the validation rule that triggered the issue.
    *   `message`: String - A plain-language explanation of the issue.
    *   `xpath`: String - The XML Path (XPath) to the problematic element in the invoice.
    *   `lineNumber`: Number - The line number in the XML where the issue was found.
    *   `suggestion`: String - A suggested fix for the issue.
    *   `specLink`: String (URL) - A link to the relevant section of the PEPPOL specification.

## Relationships

*   An `Invoice` has one `ValidationResult`.
*   A `ValidationResult` can have many `Issue`s.
*   `ValidationRule`s are applied to an `Invoice` to produce `ValidationResult`s and `Issue`s.

## Validation Rules (from Functional Requirements)

*   **FR1.2:** Invoice XML files must be accepted up to 10 MB.
*   **FR1.3:** Invoice format (UBL vs CII) must be automatically detected.
*   **FR1.6:** Invoice encoding (UTF-8, ISO-8859-1) must be supported.
*   **FR2.1:** Validation against PEPPOL BIS Billing 3.0.19 specification.
*   **FR2.2:** Perform XSD schema validation.
*   **FR2.3:** Execute Schematron business rules.
*   **FR2.4:** Validate country-specific rules (NO, SE, DK, NL, DE).
*   **FR2.5:** Check code list compliance (ISO codes, VAT categories).
*   **FR2.6:** Detect encoding issues and special characters.
*   **FR2.7:** Validate calculation correctness (totals, VAT, rounding).
