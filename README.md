# ValidPEP PEPPOL BIS Billing Validation Dashboard

ValidPEP is a modern web-based PEPPOL BIS Billing validation dashboard that addresses critical pain points in electronic invoice compliance. The platform provides real-time validation, enhanced error reporting, and actionable insights for businesses implementing PEPPOL e-invoicing.

## Features

### File Upload and Processing
*   **Drag-and-drop XML file upload** (up to 10 MB).
*   **Automatic detection** of UBL vs. CII formats.
*   Display of file metadata (size, format, detected version).
*   Support for multiple file encodings (UTF-8, ISO-8859-1).
*   **URL-based file import**.

### Validation Engine
*   Validation against **PEPPOL BIS Billing 3.0.19 specification**.
*   **XSD schema validation** and **Schematron business rules** execution.
*   **Country-specific rule validation** (NO, SE, DK, NL, DE).
*   Code list compliance checks (ISO codes, VAT categories).
*   Detection of encoding issues and calculation correctness.
*   Use of **cached external validation artifacts**.

### Error Reporting
*   Categorized errors (Error, Warning, Info) with **line numbers and XML paths**.
*   **Plain-language explanations** and **suggested fixes** for common errors.
*   Highlighting of problematic XML sections.

### User Interface
*   Clean, modern dashboard with **real-time validation progress** (Uploading, Parsing, Validating (Schema), Validating (Schematron), Validated/Invalid).
*   Split view for XML source and validation results with **syntax highlighting**.
*   **Clickable errors** that jump to XML location.
*   Responsive design, dark/light mode, and keyboard shortcuts.

### Export and Sharing
*   Download validation reports as **JSON or HTML**.
*   **Copy shareable validation summary**.
*   **Export annotated XML** with error comments.
*   Generate validation certificates for passed invoices.

### Documentation and Help
*   **Inline tooltips** for technical terms.
*   Getting started guide, FAQ, PEPPOL specification reference.
*   **Example valid invoices** (downloadable).
*   Common error solutions knowledge base.

## Technology Stack

*   **Frontend:** React 18+ with TypeScript, styled with Tailwind CSS, and built with Vite.
*   **Backend:** Vercel Serverless Functions (Node.js 20+), Next.js API Routes.
*   **Data & Cache:** Vercel KV (Redis) for caching validation rules and code lists.

## Architecture

The application follows a modern web application architecture with a clear separation between the frontend and backend.

*   **Frontend:** A React-based single-page application (SPA) built with Vite, providing a rich and interactive user interface.
*   **Backend:** Leverages Vercel Serverless Functions and Next.js API Routes for scalable and efficient validation processing.
*   **Data Flow:** User-uploaded XML files are sent to the backend for validation. Validation results, including detailed error messages, are returned to the frontend for display.
*   **Caching:** Vercel KV (Redis) is used to cache frequently accessed PEPPOL validation artifacts and code lists, ensuring fast validation times and resilience against external service outages.
*   **Privacy-First:** No permanent storage of invoice data; all processing is ephemeral, and files are deleted immediately after validation.

## Getting Started

### Prerequisites
*   Node.js 20+
*   npm or yarn

### Installation
```bash
git clone [repository-url] # Replace with the actual repository URL
cd ValidPEP
npm install # or yarn install
```

### Running Locally
```bash
# Frontend
cd frontend
npm run dev # or yarn dev

# Backend (Vercel development server)
cd backend
vercel dev
```

## Usage

Once the application is running, navigate to `http://localhost:3000` (or the port specified by Vite/Next.js). Drag and drop your PEPPOL BIS Billing XML invoice file into the designated area. Observe real-time validation progress and detailed error reports.

## Contributing

Refer to `CONTRIBUTING.md` for guidelines on how to contribute to this project.

## License

This project is licensed under the [License Name] - see the `LICENSE.md` file for details.
