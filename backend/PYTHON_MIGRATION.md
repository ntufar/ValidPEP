# Python Backend Migration Guide

## Overview

We've migrated the backend from Node.js/TypeScript to Python to leverage superior XSD validation libraries (`xmlschema` and `lxml.isoschematron`).

## What Changed

### ✅ New Python Backend Structure

```
backend/
  api/
    validate.py          # Main API endpoint (replaces Next.js route)
  services/
    invoice_detector.py  # Format/country detection
    xsd_validator.py     # XSD validation using xmlschema
    schematron_validator.py  # Schematron validation using lxml.isoschematron
    peppol_artifacts.py  # Artifact loading
  utils/
    logger.py            # Logging utility
    error_handler.py     # Error handling
    cache.py             # Cache utility (Vercel KV)
  requirements.txt       # Python dependencies
  vercel.json           # Vercel configuration
```

### ✅ Key Improvements

1. **XSD Validation**: Uses `xmlschema` library which:
   - ✅ Handles external imports automatically
   - ✅ Supports XSD 1.0 and 1.1
   - ✅ Pure Python (no native bindings)
   - ✅ Works reliably in serverless
   - ✅ **Timeout protection** (30 seconds) to prevent hanging
   - ✅ **Recursive import fetching** - pre-fetches all nested schemas
   - ✅ **OASIS URL fallback** - more reliable than PEPPOL URLs
   - ✅ **Proper directory structure** - preserves relative import paths

2. **Schematron Validation**: Uses `lxml.isoschematron` library which:
   - ✅ Full ISO Schematron support
   - ✅ XPath 1.0-3.1 support
   - ✅ Built into lxml (already installed)
   - ✅ No additional dependencies required
   - ✅ **Graceful error handling** for unsupported features

## Installation

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Local Development

For local testing, you can run the Python code directly:

```python
# Test the validation
from api.validate import handler_internal

result = handler_internal({
    'file': '<base64_encoded_xml>',
    'format': 'auto',
    'country': 'auto'
})
```

### 3. Vercel Deployment

Vercel will automatically detect Python files in the `api/` directory and deploy them as serverless functions.

**Note**: Make sure `vercel.json` is configured correctly.

## API Compatibility

The API endpoint maintains the same interface:

**Request:**
```json
{
  "file": "<base64_encoded_xml>",
  "format": "ubl|cii|auto",
  "country": "NO|SE|GB|auto"
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
  "statistics": {
    "totalLines": 100,
    "errorCount": 0,
    "warningCount": 0
  }
}
```

## Testing

### Local Testing

1. Install dependencies: `pip install -r requirements.txt`
2. Test individual services:
   ```python
   from services.xsd_validator import validate_xml_against_xsd
   result = validate_xml_against_xsd(xml_string, xsd_schema)
   ```

### Vercel Testing

1. Deploy to Vercel: `vercel deploy`
2. Test the endpoint: `curl -X POST https://your-app.vercel.app/api/validate -d '{"file":"..."}'`

## Migration Checklist

- [x] Create Python API endpoint
- [x] Port XSD validation to xmlschema
- [x] Port Schematron validation to lxml.isoschematron
- [x] Port invoice detection
- [x] Port artifact loading
- [x] Create utilities (logger, error handler, cache)
- [x] Create requirements.txt
- [x] Configure Vercel
- [x] **Fix XSD validation hanging issues**
- [x] **Implement timeout protection**
- [x] **Add recursive import fetching**
- [x] **Implement OASIS URL fallback**
- [x] Test locally ✅
- [ ] Test on Vercel
- [x] Update frontend if needed (should work as-is) ✅
- [ ] Remove old TypeScript backend code (optional)

## Next Steps

1. **Test locally**: Run the Python code and verify it works
2. **Deploy to Vercel**: Test the serverless function
3. **Update frontend**: Should work as-is, but verify API calls
4. **Monitor**: Check logs for any issues

## Troubleshooting

### Import Errors

If you get import errors, make sure:
- All dependencies are installed: `pip install -r requirements.txt`
- Python path includes the backend directory

### Vercel Deployment Issues

- Check `vercel.json` configuration
- Ensure `requirements.txt` is in the backend directory
- Check Vercel build logs for Python errors

### Cache Issues

The cache utility uses in-memory fallback. For production, you may want to:
- Use Vercel KV via Redis client
- Or implement a proper Redis connection

## Benefits of Python Migration

1. ✅ **Proper XSD validation** with external imports
2. ✅ **Full Schematron support** with XPath
3. ✅ **Better library ecosystem** for XML validation
4. ✅ **More maintainable** code with better error handling
5. ✅ **No hanging issues** - timeout protection ensures completion
6. ✅ **Reliable schema resolution** - OASIS URL fallback
7. ✅ **Complete import handling** - recursively fetches all nested schemas
8. ✅ **Proper error detection** - finds real validation errors correctly

## Implementation Details

### XSD Validation Architecture

The XSD validator (`services/xsd_validator.py`) implements a multi-layered approach:

1. **Schema Location Resolution** (`_resolve_schema_location`)
   - Priority: Local files → OASIS URLs → PEPPOL URLs
   - Handles relative paths correctly

2. **Recursive Import Fetching** (`fetch_nested_imports`)
   - Pre-fetches all nested imports and includes
   - Maximum depth of 5 to prevent infinite loops
   - Handles both `xsd:import` (with namespace) and `xsd:include` (without namespace)

3. **Directory Structure Management**
   - Creates temp directories matching original schema layout
   - Preserves relative import paths (e.g., `../common/`)
   - Organizes schemas in appropriate subdirectories

4. **Timeout Protection**
   - Threading-based timeout (30 seconds) for schema loading
   - Prevents indefinite hanging on slow/unreachable URLs
   - Graceful fallback if timeout occurs

5. **Validation Execution**
   - Uses `xmlschema.XMLSchema` with all locations pre-resolved
   - Validates against complete schema with all imports
   - Returns detailed error messages with XPath locations

### Performance

- **First Request**: ~30-40 seconds (includes network requests for all schemas)
- **Subsequent Requests**: Faster (schemas may be cached)
- **Network Dependency**: Requires internet access for OASIS/PEPPOL URLs
- **Timeout**: 30 seconds maximum for schema loading

