# Python Backend Migration - Quick Start

## ✅ Migration Complete!

The backend has been migrated from Node.js/TypeScript to Python to leverage superior XSD validation libraries.

## Key Files Created

- `api/validate.py` - Main validation endpoint
- `services/xsd_validator.py` - XSD validation using `xmlschema` with timeout protection
- `services/schematron_validator.py` - Schematron validation using `lxml.isoschematron`
- `services/invoice_detector.py` - Format/country detection
- `services/peppol_artifacts.py` - Artifact loading
- `utils/logger.py`, `utils/error_handler.py`, `utils/cache.py` - Utilities
- `requirements.txt` - Python dependencies
- `vercel.json` - Vercel configuration
- `test_python_backend.py` - Local testing script

## Installation

```bash
cd backend
pip install -r requirements.txt
```

## Testing Locally

```bash
python test_python_backend.py
```

## Key Improvements

1. **XSD Validation**: `xmlschema` library handles external imports automatically ✅
   - Recursive import/include fetching
   - OASIS URL fallback for reliability
   - Timeout protection (30 seconds) to prevent hanging
   - Proper directory structure for relative imports

2. **Schematron Validation**: `lxml.isoschematron` provides full ISO Schematron support ✅
   - Graceful error handling for unsupported features
   - Full XPath assertion evaluation

3. **No Hanging**: Threading-based timeout protection ensures completion ✅
   - 30-second timeout for schema loading
   - Pre-fetches all nested schemas before validation
   - Proper error handling if timeout occurs

4. **Better Error Messages**: More detailed validation errors ✅
   - XPath locations for errors
   - Line numbers when available
   - Clear error messages

## How XSD Validation Works

The XSD validator (`services/xsd_validator.py`) implements a robust solution for handling external schema imports:

1. **Schema Location Resolution**
   - Checks local files first (if available)
   - Falls back to OASIS URLs (reliable source)
   - Falls back to PEPPOL URLs (may 404)

2. **Recursive Import Fetching**
   - Pre-fetches all top-level imports
   - Recursively fetches nested imports and includes
   - Handles both `xsd:import` (with namespace) and `xsd:include` (without namespace)
   - Maximum depth of 5 to prevent infinite loops

3. **Directory Structure**
   - Creates temp directory structure matching original schema layout
   - Preserves relative import paths (e.g., `../common/`)
   - Saves schemas to appropriate subdirectories

4. **Timeout Protection**
   - Threading-based timeout (30 seconds) for schema loading
   - Prevents indefinite hanging on slow/unreachable URLs
   - Graceful fallback if timeout occurs

5. **Validation**
   - Uses `xmlschema.XMLSchema` with all locations pre-resolved
   - Validates XML against complete schema with all imports
   - Returns detailed error messages with XPath locations

## Performance Characteristics

- **First Request**: ~30-40 seconds (fetches all schemas from network)
- **Subsequent Requests**: Faster (schemas may be cached)
- **Network Dependency**: Requires internet access for OASIS/PEPPOL URLs
- **Timeout**: 30 seconds maximum for schema loading

## Vercel Deployment

**Note**: Vercel supports Python serverless functions. The `vercel.json` configuration file is included.

1. **Deploy to Vercel**: 
   - Vercel will automatically detect Python files
   - Dependencies from `requirements.txt` will be installed
   - Function will be available at `/api/validate`

2. **Alternative Platforms**:
   - AWS Lambda (Python runtime)
   - Google Cloud Functions (Python runtime)
   - Azure Functions (Python runtime)

## Next Steps

1. ✅ Test locally: `python test_python_backend.py`
2. ✅ Install dependencies: `pip install -r requirements.txt`
3. ✅ Validation logic is working correctly
4. Deploy to Vercel or alternative platform
5. ✅ Frontend API calls work as-is (same interface)

## API Compatibility

The API maintains the same interface, so the frontend should work without changes!

**Request:**
```json
POST /api/validate
{
  "file": "<base64_xml>",
  "format": "auto",
  "country": "auto"
}
```

**Response:**
```json
{
  "valid": true,
  "format": "ubl",
  "version": "PEPPOL BIS Billing 3.0.19",
  "country": "GB",
  "timestamp": "2025-11-15T06:00:00Z",
  "errors": [],
  "warnings": [],
  "statistics": {...}
}
```

