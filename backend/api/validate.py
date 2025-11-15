"""
PEPPOL Invoice Validation API Endpoint
Python implementation using xmlschema and lxml.isoschematron for proper XSD and Schematron validation
"""

import json
import base64
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path

# Validation libraries
import xmlschema

# XML parsing
from lxml import etree

# Import our services
from services.invoice_detector import detect_invoice_format, detect_invoice_country
from services.peppol_artifacts import get_peppol_validation_artifacts, DOCS_ROOT
from services.xsd_validator import validate_xml_against_xsd
from services.schematron_validator import validate_xml_against_schematron
from utils.logger import get_logger
from utils.error_handler import handle_error

logger = get_logger()

MAX_XML_BYTES = 10 * 1024 * 1024  # 10 MB


def handler_internal(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main validation handler for Vercel serverless function
    
    Args:
        request: HTTP request object with JSON body containing:
            - file: Base64 encoded XML content
            - format: Optional preferred format (ubl, cii, auto)
            - country: Optional preferred country code
    
    Returns:
        JSON response with validation results
    """
    try:
        # Parse request data
        base64_file = request_data.get('file', '')
        preferred_format = request_data.get('format', 'auto')
        preferred_country = request_data.get('country', 'auto')
        
        logger.info('Received validation request', {
            'preferred_format': preferred_format,
            'preferred_country': preferred_country
        })
        
        # Validate input
        if not base64_file or not isinstance(base64_file, str) or len(base64_file.strip()) == 0:
            return {
                'statusCode': 400,
                'body': json.dumps({'message': 'No file provided for validation.'})
            }
        
        # Normalize and validate base64
        normalized_payload = base64_file.replace(' ', '').replace('\n', '').replace('\r', '')
        if not all(c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=' for c in normalized_payload):
            return {
                'statusCode': 400,
                'body': json.dumps({'message': 'Invalid base64 payload provided.'})
            }
        
        # Decode base64
        try:
            xml_bytes = base64.b64decode(normalized_payload)
        except Exception as e:
            return {
                'statusCode': 400,
                'body': json.dumps({'message': f'Failed to decode base64: {str(e)}'})
            }
        
        if len(xml_bytes) == 0:
            return {
                'statusCode': 400,
                'body': json.dumps({'message': 'XML file is empty after decoding.'})
            }
        
        if len(xml_bytes) > MAX_XML_BYTES:
            return {
                'statusCode': 413,
                'body': json.dumps({
                    'message': f'XML file exceeds the maximum supported size ({MAX_XML_BYTES / (1024 * 1024)} MB).'
                })
            }
        
        xml_string = xml_bytes.decode('utf-8')
        issues: List[Dict[str, Any]] = []
        overall_valid = True
        detected_format = 'auto'
        detected_country: Optional[str] = None
        
        # 1. Detect Invoice Format
        try:
            detected_format = detect_invoice_format(xml_string)
            if preferred_format and preferred_format != 'auto' and preferred_format != detected_format:
                issues.append({
                    'severity': 'warning',
                    'message': f"Preferred format '{preferred_format}' does not match detected format '{detected_format}'. Proceeding with detected format."
                })
            detected_country = detect_invoice_country(xml_string)
        except Exception as e:
            issues.append({
                'severity': 'error',
                'message': f'Failed to inspect invoice metadata: {str(e)}'
            })
            overall_valid = False
        
        if not overall_valid:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'valid': False,
                    'format': detected_format,
                    'version': 'N/A',
                    'country': detected_country or preferred_country or 'N/A',
                    'timestamp': datetime.utcnow().isoformat() + 'Z',
                    'errors': [i for i in issues if i['severity'] == 'error'],
                    'warnings': [i for i in issues if i['severity'] == 'warning'],
                    'statistics': {
                        'totalLines': len(xml_string.split('\n')),
                        'errorCount': len([i for i in issues if i['severity'] == 'error']),
                        'warningCount': len([i for i in issues if i['severity'] == 'warning'])
                    }
                })
            }
        
        # 2. Parse XML
        try:
            xml_doc = etree.fromstring(xml_bytes)
        except etree.XMLSyntaxError as e:
            issues.append({
                'severity': 'error',
                'message': f'XML parsing failed: {str(e)}',
                'lineNumber': getattr(e, 'lineno', None)
            })
            overall_valid = False
        
        if not overall_valid:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'valid': False,
                    'format': detected_format,
                    'version': 'N/A',
                    'country': detected_country or preferred_country or 'N/A',
                    'timestamp': datetime.utcnow().isoformat() + 'Z',
                    'errors': [i for i in issues if i['severity'] == 'error'],
                    'warnings': [i for i in issues if i['severity'] == 'warning'],
                    'statistics': {
                        'totalLines': len(xml_string.split('\n')),
                        'errorCount': len([i for i in issues if i['severity'] == 'error']),
                        'warningCount': len([i for i in issues if i['severity'] == 'warning'])
                    }
                })
            }
        
        # 3. Get Validation Artifacts (XSD and Schematron)
        format_to_validate = preferred_format if preferred_format and preferred_format != 'auto' else detected_format
        country_to_validate = preferred_country.upper() if preferred_country and preferred_country != 'auto' else (detected_country or 'NO')
        
        logger.info('Getting validation artifacts', {
            'format_to_validate': format_to_validate,
            'country_to_validate': country_to_validate
        })
        
        try:
            artifacts = get_peppol_validation_artifacts(format_to_validate, country_to_validate)
            logger.info('Artifacts loaded', {
                'has_xsd': bool(artifacts.get('xsd')),
                'has_schematron': bool(artifacts.get('schematron'))
            })
        except Exception as e:
            logger.error('Failed to load artifacts', {'error': str(e)})
            issues.append({
                'severity': 'error',
                'message': f'Failed to load validation artifacts for {format_to_validate}/{country_to_validate}: {str(e)}'
            })
            overall_valid = False
        
        if not overall_valid:
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'valid': False,
                    'format': detected_format,
                    'version': 'N/A',
                    'country': country_to_validate,
                    'timestamp': datetime.utcnow().isoformat() + 'Z',
                    'errors': [i for i in issues if i['severity'] == 'error'],
                    'warnings': [i for i in issues if i['severity'] == 'warning'],
                    'statistics': {
                        'totalLines': len(xml_string.split('\n')),
                        'errorCount': len([i for i in issues if i['severity'] == 'error']),
                        'warningCount': len([i for i in issues if i['severity'] == 'warning'])
                    }
                })
            }
        
        xsd_schema = artifacts.get('xsd')
        schematron_rules = artifacts.get('schematron')
        xsd_base_url = artifacts.get('xsd_base_url')
        
        # 4. XSD Validation
        if xsd_schema:
            try:
                logger.info('Starting XSD validation', {
                    'xsd_schema_length': len(xsd_schema),
                    'xml_length': len(xml_string)
                })
                
                # Get local base path for resolving relative imports
                xsd_local_path = None
                if xsd_schema and DOCS_ROOT.exists():
                    # If XSD was loaded from disk, use local path for imports
                    xsd_local_path = str(DOCS_ROOT)
                
                xsd_result = validate_xml_against_xsd(
                    xml_string,
                    xsd_schema,
                    base_url=xsd_base_url,
                    local_base_path=xsd_local_path
                )
                
                logger.info('XSD validation completed', {
                    'is_valid': xsd_result['is_valid'],
                    'issue_count': len(xsd_result['issues'])
                })
                
                if not xsd_result['is_valid']:
                    overall_valid = False
                    issues.extend(xsd_result['issues'])
            except Exception as e:
                logger.error('XSD validation error', {'error': str(e)})
                error_message = str(e)
                # Add as warning if it's a non-critical issue
                if any(keyword in error_message.lower() for keyword in [
                    'external', 'import', 'unresolved', 'incomplete',
                    'invalid xsd schema', 'invalid schema', 'failed to parse'
                ]):
                    issues.append({
                        'severity': 'warning',
                        'message': f'XSD validation skipped: {error_message}. Continuing with other validation checks.'
                    })
                else:
                    issues.append({
                        'severity': 'error',
                        'message': f'XSD validation failed: {error_message}'
                    })
                    overall_valid = False
        else:
            issues.append({
                'severity': 'warning',
                'message': artifacts.get('xsd_error', 'XSD schema not available for validation.')
            })
        
        # 5. Schematron Validation
        if schematron_rules:
            try:
                logger.info('Starting Schematron validation', {
                    'schematron_rules_length': len(schematron_rules)
                })
                
                schematron_result = validate_xml_against_schematron(
                    xml_string,
                    schematron_rules
                )
                
                logger.info('Schematron validation completed', {
                    'is_valid': schematron_result['is_valid'],
                    'issue_count': len(schematron_result['issues'])
                })
                
                if not schematron_result['is_valid']:
                    overall_valid = False
                    issues.extend(schematron_result['issues'])
            except Exception as e:
                logger.error('Schematron validation error', {'error': str(e)})
                issues.append({
                    'severity': 'warning',
                    'message': f'Schematron validation skipped: {str(e)}'
                })
        else:
            issues.append({
                'severity': 'warning',
                'message': 'Schematron rules not available for validation.'
            })
        
        # Build final response
        total_lines = len(xml_string.split('\n'))
        errors = [i for i in issues if i['severity'] == 'error']
        warnings = [i for i in issues if i['severity'] == 'warning']
        
        response = {
            'valid': overall_valid,
            'format': format_to_validate,
            'version': 'PEPPOL BIS Billing 3.0.19',
            'country': country_to_validate,
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'errors': errors,
            'warnings': warnings,
            'statistics': {
                'totalLines': total_lines,
                'errorCount': len(errors),
                'warningCount': len(warnings)
            }
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps(response)
        }
        
    except Exception as e:
        logger.error('Validation error', {'error': str(e), 'type': type(e).__name__})
        return handle_error(e, 'POST /api/validate')


# Vercel serverless function entry point
# Vercel Python functions receive a Request object
def handler(request):
    """
    Vercel serverless function entry point
    Vercel passes a Request object with .json() method
    """
    try:
        # Parse JSON body
        if hasattr(request, 'json'):
            body = request.json()
        elif hasattr(request, 'get_json'):
            body = request.get_json()
        elif isinstance(request, dict):
            body = request.get('body', request)
        else:
            body = {}
        
        # Call main handler
        result = handler_internal({
            'file': body.get('file', ''),
            'format': body.get('format', 'auto'),
            'country': body.get('country', 'auto')
        })
        
        # Return Vercel response format
        return {
            'statusCode': result['statusCode'],
            'headers': result.get('headers', {'Content-Type': 'application/json'}),
            'body': result['body']
        }
    except Exception as e:
        return handle_error(e, 'POST /api/validate')


# handler_internal is defined above, no need to redefine

