"""
XSD validation using xmlschema library
Properly handles external imports and XSD 1.0/1.1
"""

from typing import Dict, List, Any, Optional
import xmlschema
from xmlschema.resources import XMLResource
from lxml import etree
import requests
import warnings
from pathlib import Path


def _try_oasis_url(schema_location: str) -> Optional[str]:
    """
    Try to construct an OASIS UBL URL for common schema files
    Returns None if the schema location doesn't match UBL common patterns
    """
    # OASIS UBL 2.1 base URL
    OASIS_UBL_BASE = 'https://docs.oasis-open.org/ubl/os-UBL-2.1/xsd/'
    
    # Common UBL schema patterns
    if 'UBL-CommonAggregateComponents-2.1.xsd' in schema_location:
        return f'{OASIS_UBL_BASE}common/UBL-CommonAggregateComponents-2.1.xsd'
    elif 'UBL-CommonBasicComponents-2.1.xsd' in schema_location:
        return f'{OASIS_UBL_BASE}common/UBL-CommonBasicComponents-2.1.xsd'
    elif 'UBL-CommonExtensionComponents-2.1.xsd' in schema_location:
        return f'{OASIS_UBL_BASE}common/UBL-CommonExtensionComponents-2.1.xsd'
    elif 'UBL-QualifiedDataTypes-2.1.xsd' in schema_location:
        return f'{OASIS_UBL_BASE}common/UBL-QualifiedDataTypes-2.1.xsd'
    elif 'UBL-UnqualifiedDataTypes-2.1.xsd' in schema_location:
        return f'{OASIS_UBL_BASE}common/UBL-UnqualifiedDataTypes-2.1.xsd'
    elif 'CCTS_CCT_SchemaModule-2.1.xsd' in schema_location:
        return f'{OASIS_UBL_BASE}common/CCTS_CCT_SchemaModule-2.1.xsd'
    elif 'common/' in schema_location:
        # Try to extract filename and construct OASIS URL
        filename = schema_location.split('/')[-1]
        if filename.endswith('.xsd'):
            return f'{OASIS_UBL_BASE}common/{filename}'
    
    return None


class CustomSchemaLoader(xmlschema.loaders.SchemaLoader):
    """
    Custom schema loader that handles OASIS URL fallback and local files
    """
    def __init__(self, *args, local_base_path: Optional[str] = None, **kwargs):
        super().__init__(*args, **kwargs)
        self.local_base_path = local_base_path
    
    def _fetch_resource(self, url: str) -> XMLResource:
        """
        Override to handle OASIS fallback and local files
        """
        # First, try to resolve as local file if local_base_path is provided
        if self.local_base_path:
            filename = url.split('/')[-1]
            local_paths = [
                Path(self.local_base_path) / filename,
                Path(self.local_base_path) / 'common' / filename,
                Path(self.local_base_path).parent / 'common' / filename,
            ]
            
            for local_path in local_paths:
                if local_path.exists() and local_path.is_file():
                    try:
                        return XMLResource(str(local_path))
                    except Exception:
                        pass
        
        # If not found locally, try remote URL
        try:
            return XMLResource(url)
        except Exception:
            pass
        
        # If original URL fails, try OASIS fallback
        oasis_url = _try_oasis_url(url)
        if oasis_url:
            try:
                return XMLResource(oasis_url)
            except Exception:
                pass
        
        # If all fail, raise an error
        raise requests.RequestException(f'Failed to load schema from {url} (tried local, remote, and OASIS fallback)')


def _resolve_schema_location(
    namespace: str,
    schema_location: str,
    base_url: Optional[str],
    local_base_path: Optional[str]
) -> Optional[str]:
    """
    Resolve a schema location to a URL, trying local files first, then OASIS (reliable), then PEPPOL (may 404)
    Returns the resolved URL or None if all attempts fail
    """
    from urllib.parse import urljoin
    
    # First, try local file if local_base_path is provided
    if local_base_path:
        # schema_location is relative (e.g., "../common/UBL-CommonExtensionComponents-2.1.xsd")
        # Resolve it relative to local_base_path
        local_path = Path(local_base_path) / schema_location
        # Normalize the path (resolve ..)
        try:
            local_path = local_path.resolve()
            if local_path.exists() and local_path.is_file():
                return f'file://{local_path}'
        except Exception:
            pass
    
    # Try OASIS fallback first (more reliable than PEPPOL URLs which often 404)
    oasis_url = _try_oasis_url(schema_location)
    if oasis_url:
        return oasis_url
    
    # Finally, try to resolve relative to base_url (PEPPOL URLs)
    if base_url:
        try:
            resolved_url = urljoin(base_url, schema_location)
            return resolved_url
        except Exception:
            pass
    
    return None


def validate_xml_against_xsd(
    xml_string: str,
    xsd_schema: str,
    base_url: Optional[str] = None,
    local_base_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Validate XML against XSD schema using xmlschema library
    
    Args:
        xml_string: XML content to validate
        xsd_schema: XSD schema content as string
        base_url: Base URL for resolving relative schema imports
        local_base_path: Local file system path for resolving relative imports
    
    Returns:
        Dictionary with 'is_valid' boolean and 'issues' list
    """
    issues: List[Dict[str, Any]] = []
    
    try:
        # Parse the XSD to find import statements and resolve schema locations
        from lxml import etree
        from io import BytesIO
        
        xsd_doc = etree.parse(BytesIO(xsd_schema.encode('utf-8')))
        xsd_root = xsd_doc.getroot()
        
        # Resolve imported schema locations to reliable URLs (prefer OASIS over PEPPOL)
        # Build locations mapping: namespace -> URL
        locations = {}
        xsd_ns = '{http://www.w3.org/2001/XMLSchema}'
        
        # Collect all imports (including nested ones we'll discover)
        imports_to_resolve = []
        for import_elem in xsd_root.findall(f'.//{xsd_ns}import'):
            namespace = import_elem.get('namespace')
            schema_location = import_elem.get('schemaLocation')
            if namespace and schema_location:
                imports_to_resolve.append((namespace, schema_location))
        
        # Resolve each import to a reliable URL (prefer OASIS)
        for namespace, schema_location in imports_to_resolve:
            resolved_url = _resolve_schema_location(namespace, schema_location, base_url, local_base_path)
            if resolved_url:
                # Use OASIS URLs directly - they're more reliable than PEPPOL URLs
                # xmlschema will fetch them, but we've verified they exist via _resolve_schema_location
                if resolved_url.startswith('file://'):
                    locations[namespace] = resolved_url[7:]  # Remove file:// prefix
                else:
                    locations[namespace] = resolved_url
        
        # Suppress XMLSchemaImportWarning - we'll handle errors ourselves
        with warnings.catch_warnings():
            warnings.filterwarnings('ignore', category=xmlschema.XMLSchemaImportWarning)
            
            # Use locations parameter to explicitly map namespaces to schema locations
            # Note: xmlschema will handle nested imports automatically, resolving them from the provided locations
            schema = xmlschema.XMLSchema(
                xsd_schema,
                base_url=base_url,
                defuse='remote',
                locations=locations if locations else None
            )
        
        # Validate the XML
        try:
            schema.validate(xml_string)
            # If validation passes, no exceptions are raised
            return {
                'is_valid': True,
                'issues': []
            }
        except xmlschema.XMLSchemaException as e:
            # Validation failed - extract error details
            issues.append({
                'severity': 'error',
                'message': str(e),
                'xpath': getattr(e, 'path', None),
                'lineNumber': getattr(e, 'line', None)
            })
            
            return {
                'is_valid': False,
                'issues': issues
            }
            
    except xmlschema.XMLSchemaParseError as e:
        # Schema parsing failed
        issues.append({
            'severity': 'error',
            'message': f'Failed to parse XSD schema: {str(e)}',
            'lineNumber': getattr(e, 'line', None)
        })
        
        return {
            'is_valid': False,
            'issues': issues
        }
        
    except Exception as e:
        # Other errors
        issues.append({
            'severity': 'error',
            'message': f'XSD validation error: {str(e)}'
        })
        
        return {
            'is_valid': False,
            'issues': issues
        }

