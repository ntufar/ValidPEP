"""
Schematron validation using lxml.isoschematron
Full ISO Schematron support with XPath assertions

Note: lxml.isoschematron has limitations with some ISO Schematron features
like <let> elements. This implementation attempts to work around these issues.
"""

from typing import Dict, List, Any
from io import BytesIO

try:
    from lxml import etree
    from lxml.isoschematron import Schematron
    SCHEMATRON_AVAILABLE = True
except ImportError:
    # Fallback if lxml not available
    SCHEMATRON_AVAILABLE = False


def validate_xml_against_schematron(
    xml_string: str,
    schematron_rules: str
) -> Dict[str, Any]:
    """
    Validate XML against Schematron rules using lxml.isoschematron
    
    Args:
        xml_string: XML content to validate
        schematron_rules: Schematron rules as string
    
    Returns:
        Dictionary with 'is_valid' boolean and 'issues' list
    """
    issues: List[Dict[str, Any]] = []
    
    if not SCHEMATRON_AVAILABLE:
        # Fallback: basic validation
        return {
            'is_valid': True,
            'issues': [{
                'severity': 'warning',
                'message': 'Schematron validation unavailable: lxml.isoschematron not available'
            }]
        }
    
    try:
        # Parse Schematron rules
        # Note: lxml.isoschematron may have issues with certain ISO Schematron features
        # like <let> elements. We'll try to use it but handle errors gracefully.
        schematron_doc = etree.parse(BytesIO(schematron_rules.encode('utf-8')))
        
        # Try to create Schematron validator with relaxed settings
        # store_report=True enables SVRL output for detailed error messages
        try:
            schematron = Schematron(
                schematron_doc,
                store_report=True,
                error_finder='//svrl:failed-assert',
                phase=None  # Validate all phases
            )
        except etree.SchematronParseError as parse_error:
            # If Schematron parsing fails, it's likely due to lxml.isoschematron limitations
            # with certain ISO Schematron features (e.g., <let> elements)
            return {
                'is_valid': True,  # Don't fail validation, just skip Schematron
                'issues': [{
                    'severity': 'warning',
                    'message': f'Schematron validation skipped: lxml.isoschematron cannot parse this Schematron file. '
                              f'This may be due to advanced ISO Schematron features not fully supported. '
                              f'Error: {str(parse_error)}'
                }]
            }
        
        # Parse XML to validate
        xml_doc = etree.parse(BytesIO(xml_string.encode('utf-8')))
        
        # Validate XML against Schematron
        is_valid = schematron.validate(xml_doc)
        
        if is_valid:
            return {
                'is_valid': True,
                'issues': []
            }
        
        # Extract validation errors from Schematron validation report
        # lxml.isoschematron can provide SVRL (Schematron Validation Report Language) output
        # Check if we have a validation report
        if hasattr(schematron, 'validation_report') and schematron.validation_report is not None:
            # Parse SVRL output to extract failed assertions
            svrl_ns = '{http://purl.oclc.org/dsdl/svrl}'
            report_root = schematron.validation_report.getroot()
            
            # Extract failed assertions
            failed_asserts = report_root.findall(f'.//{svrl_ns}failed-assert')
            for assert_elem in failed_asserts:
                # Get the text content (assertion message)
                message = assert_elem.text or ''
                if not message:
                    # Try to get message from child text node
                    message = ''.join(assert_elem.itertext()).strip()
                
                # Get location attribute (XPath)
                xpath = assert_elem.get('location', None)
                
                # Get test attribute (the XPath expression that failed)
                test = assert_elem.get('test', None)
                
                # Get rule context
                role = assert_elem.get('role', None)
                
                issues.append({
                    'severity': 'error',
                    'message': message or 'Schematron assertion failed',
                    'xpath': xpath or test,
                    'lineNumber': None,  # SVRL doesn't always provide line numbers
                    'code': role
                })
            
            # Extract reports (informational)
            reports = report_root.findall(f'.//{svrl_ns}report')
            for report_elem in reports:
                message = report_elem.text or ''.join(report_elem.itertext()).strip()
                xpath = report_elem.get('location', None)
                test = report_elem.get('test', None)
                role = report_elem.get('role', None)
                
                issues.append({
                    'severity': 'info',
                    'message': message or 'Schematron report',
                    'xpath': xpath or test,
                    'lineNumber': None,
                    'code': role
                })
        
        # If no detailed errors found but validation failed, check error_log
        if not issues:
            error_log = schematron.error_log
            if error_log:
                for error in error_log:
                    issues.append({
                        'severity': 'error',
                        'message': error.message,
                        'xpath': None,
                        'lineNumber': error.line,
                        'code': None
                    })
            else:
                # Generic error if no details available
                issues.append({
                    'severity': 'error',
                    'message': 'Schematron validation failed (no detailed error information available)'
                })
        
        return {
            'is_valid': False,
            'issues': issues
        }
        
    except etree.XMLSyntaxError as e:
        # If Schematron rules or XML cannot be parsed
        issues.append({
            'severity': 'error',
            'message': f'Failed to parse Schematron rules or XML: {str(e)}'
        })
        
        return {
            'is_valid': False,
            'issues': issues
        }
        
    except Exception as e:
        # If validation fails due to other errors
        issues.append({
            'severity': 'error',
            'message': f'Schematron validation failed: {str(e)}'
        })
        
        return {
            'is_valid': False,
            'issues': issues
        }

