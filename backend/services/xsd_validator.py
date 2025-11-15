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
    elif 'UBL-ExtensionContentDataType-2.1.xsd' in schema_location:
        return f'{OASIS_UBL_BASE}common/UBL-ExtensionContentDataType-2.1.xsd'
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
        # Build locations mapping: namespace -> local file path (download schemas to temp files)
        # Create a temp directory structure that preserves relative paths
        locations = {}
        xsd_ns = '{http://www.w3.org/2001/XMLSchema}'
        fetched_schemas = set()  # Track which schemas we've already fetched to avoid loops
        temp_files = []  # Keep track of temp files for cleanup
        temp_dirs = []  # Keep track of temp directories for cleanup
        import tempfile
        import os
        
        # Create a temp directory for schemas with proper structure
        temp_base = tempfile.mkdtemp(prefix='peppol_xsd_')
        temp_dirs.append(temp_base)
        temp_common_dir = os.path.join(temp_base, 'common')
        os.makedirs(temp_common_dir, exist_ok=True)
        
        def fetch_nested_imports(schema_content: str, base_url_for_imports: str, depth: int = 0):
            """Recursively fetch nested imports from a schema (max depth 5 to avoid infinite loops)"""
            if depth > 5:
                return  # Prevent infinite recursion
            
            try:
                nested_doc = etree.parse(BytesIO(schema_content.encode('utf-8')))
                nested_root = nested_doc.getroot()
                
                # Check both import and include elements
                for import_elem in nested_root.findall(f'.//{xsd_ns}import') + nested_root.findall(f'.//{xsd_ns}include'):
                    namespace = import_elem.get('namespace')
                    schema_location = import_elem.get('schemaLocation')
                    
                    # For include, namespace might be None, use schemaLocation directly
                    if not namespace and schema_location:
                        # Try to resolve include - these need to be in the same directory as the including schema
                        # Resolve relative to the base URL
                        from urllib.parse import urljoin
                        if base_url_for_imports:
                            resolved_url = urljoin(base_url_for_imports, schema_location)
                        else:
                            resolved_url = _resolve_schema_location('', schema_location, base_url_for_imports, local_base_path)
                        
                        if resolved_url and not resolved_url.startswith('file://'):
                            try:
                                response = requests.get(resolved_url, timeout=5, headers={'User-Agent': 'ValidPEP/1.0'})
                                if response.status_code == 200:
                                    # For includes, save to same directory as the including schema
                                    # Determine directory based on where the including schema would be
                                    filename = resolved_url.split('/')[-1]
                                    # If base_url_for_imports contains 'common/', save to common dir
                                    if 'common/' in base_url_for_imports or 'common/' in resolved_url:
                                        include_path = os.path.join(temp_common_dir, filename)
                                    else:
                                        include_path = os.path.join(temp_base, filename)
                                    
                                    with open(include_path, 'w', encoding='utf-8') as f:
                                        f.write(response.text)
                                    temp_files.append(include_path)
                                    # Recursively fetch nested imports
                                    fetch_nested_imports(response.text, resolved_url.rsplit('/', 1)[0] + '/', depth + 1)
                            except requests.RequestException:
                                pass
                    
                    elif namespace and schema_location and namespace not in fetched_schemas:
                        resolved_url = _resolve_schema_location(namespace, schema_location, base_url_for_imports, local_base_path)
                        if resolved_url:
                            if resolved_url.startswith('file://'):
                                # Local file - use directly
                                if namespace not in locations:
                                    locations[namespace] = resolved_url[7:]  # Remove file:// prefix
                            else:
                                # Remote URL - download to temp file in proper directory structure
                                try:
                                    response = requests.get(resolved_url, timeout=5, headers={'User-Agent': 'ValidPEP/1.0'})
                                    if response.status_code == 200:
                                        fetched_schemas.add(namespace)
                                        # Determine where to save based on URL path
                                        if 'common/' in resolved_url:
                                            # Save to common subdirectory
                                            filename = resolved_url.split('/')[-1]
                                            temp_file_path = os.path.join(temp_common_dir, filename)
                                        else:
                                            # Save to base temp directory
                                            filename = resolved_url.split('/')[-1]
                                            temp_file_path = os.path.join(temp_base, filename)
                                        
                                        with open(temp_file_path, 'w', encoding='utf-8') as f:
                                            f.write(response.text)
                                        temp_files.append(temp_file_path)
                                        locations[namespace] = temp_file_path
                                        # Recursively fetch nested imports
                                        fetch_nested_imports(response.text, resolved_url.rsplit('/', 1)[0] + '/', depth + 1)
                                except requests.RequestException:
                                    # If fetch fails, still add URL to locations (xmlschema will try)
                                    if namespace not in locations:
                                        locations[namespace] = resolved_url
            except Exception:
                # If parsing fails, continue
                pass
        
        # Collect top-level imports
        imports_to_resolve = []
        for import_elem in xsd_root.findall(f'.//{xsd_ns}import'):
            namespace = import_elem.get('namespace')
            schema_location = import_elem.get('schemaLocation')
            if namespace and schema_location:
                imports_to_resolve.append((namespace, schema_location))
        
        # Resolve each import and pre-fetch nested imports
        for namespace, schema_location in imports_to_resolve:
            resolved_url = _resolve_schema_location(namespace, schema_location, base_url, local_base_path)
            if resolved_url:
                if resolved_url.startswith('file://'):
                    locations[namespace] = resolved_url[7:]  # Remove file:// prefix
                else:
                    # Pre-fetch to temp file in proper directory structure
                    try:
                        response = requests.get(resolved_url, timeout=5, headers={'User-Agent': 'ValidPEP/1.0'})
                        if response.status_code == 200:
                            fetched_schemas.add(namespace)
                            # Determine where to save based on URL path
                            if 'common/' in resolved_url:
                                # Save to common subdirectory
                                filename = resolved_url.split('/')[-1]
                                temp_file_path = os.path.join(temp_common_dir, filename)
                            else:
                                # Save to base temp directory
                                filename = resolved_url.split('/')[-1]
                                temp_file_path = os.path.join(temp_base, filename)
                            
                            with open(temp_file_path, 'w', encoding='utf-8') as f:
                                f.write(response.text)
                            temp_files.append(temp_file_path)
                            locations[namespace] = temp_file_path
                            # Recursively fetch nested imports
                            fetch_nested_imports(response.text, resolved_url.rsplit('/', 1)[0] + '/', depth=0)
                        else:
                            locations[namespace] = resolved_url
                    except requests.RequestException:
                        # If pre-fetch fails, still add URL to locations
                        locations[namespace] = resolved_url
        
        # Suppress XMLSchemaImportWarning - we'll handle errors ourselves
        with warnings.catch_warnings():
            warnings.filterwarnings('ignore', category=xmlschema.XMLSchemaImportWarning)
            
            # Save main schema to temp directory too, so relative imports work
            main_schema_path = os.path.join(temp_base, 'main.xsd')
            with open(main_schema_path, 'w', encoding='utf-8') as f:
                f.write(xsd_schema)
            temp_files.append(main_schema_path)
            
            # Use locations parameter to explicitly map namespaces to schema locations
            # Also set base_url to temp directory so relative imports resolve correctly
            # Add timeout protection to prevent hanging on slow/unreachable URLs
            import threading
            import queue as queue_module
            
            schema_queue = queue_module.Queue()
            error_queue = queue_module.Queue()
            
            def load_schema_with_timeout():
                try:
                    # Build schema with all locations pre-resolved
                    # Use main schema from temp file with temp_base as base_url
                    # This ensures relative imports like ../common/ work correctly
                    s = xmlschema.XMLSchema(
                        main_schema_path,
                        base_url=f'file://{temp_base}/',
                        defuse='remote',
                        locations=locations if locations else None,
                        build=True  # Build fully to ensure all imports are resolved
                    )
                    schema_queue.put(s)
                except Exception as e:
                    error_queue.put(e)
            
            # Load schema in a separate thread with timeout
            thread = threading.Thread(target=load_schema_with_timeout, daemon=True)
            thread.start()
            thread.join(timeout=30)  # 30 second timeout (reduced since we pre-fetch)
            
            if thread.is_alive():
                # Thread still running - timeout occurred
                # Try fallback: load without locations (incomplete but won't hang)
                try:
                    schema = xmlschema.XMLSchema(
                        xsd_schema,
                        base_url=base_url,
                        defuse='remote',
                        build=False
                    )
                except Exception:
                    raise TimeoutError(
                        'XSD schema loading timed out after 30 seconds. '
                        'This may be due to slow or unreachable external schema URLs. '
                        'Try using local schema files or check network connectivity.'
                    )
            
            # Check for errors
            if not error_queue.empty():
                raise error_queue.get()
            
            # Get schema
            if schema_queue.empty():
                # Fallback: try without locations (may result in incomplete validation)
                schema = xmlschema.XMLSchema(
                    xsd_schema,
                    base_url=base_url,
                    defuse='remote'
                )
            else:
                schema = schema_queue.get()
        
        # Validate the XML
        try:
            schema.validate(xml_string)
            # If validation passes, no exceptions are raised
            result = {
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
            
            result = {
                'is_valid': False,
                'issues': issues
            }
        finally:
            # Clean up temp files and directories after validation
            for temp_file in temp_files:
                try:
                    os.unlink(temp_file)
                except Exception:
                    pass
            for temp_dir in temp_dirs:
                try:
                    import shutil
                    shutil.rmtree(temp_dir)
                except Exception:
                    pass
        
        return result
            
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

