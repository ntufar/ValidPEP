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

2. **Schematron Validation**: Uses `lxml.isoschematron` library which:
   - ✅ Full ISO Schematron support
   - ✅ XPath 1.0-3.1 support
   - ✅ Built into lxml (already installed)
   - ✅ No additional dependencies required

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
- [ ] Test locally
- [ ] Test on Vercel
- [ ] Update frontend if needed (should work as-is)
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
5. ✅ **No hanging issues** - libraries handle imports correctly

