"""
Simple test script for Python backend validation
Run with: python test_python_backend.py
"""

import base64
import json
from api.validate import handler_internal

# Sample XML invoice (base64 encoded)
sample_xml = """<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
    <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
    <cbc:ID>INV-001</cbc:ID>
    <cbc:IssueDate>2025-01-01</cbc:IssueDate>
    <cbc:InvoiceTypeCode listID="UNCL7143">380</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode listID="ISO4217">EUR</cbc:DocumentCurrencyCode>
</Invoice>"""

def test_validation():
    """Test the validation endpoint"""
    # Encode XML to base64
    base64_xml = base64.b64encode(sample_xml.encode('utf-8')).decode('utf-8')
    
    # Create request
    request = {
        'file': base64_xml,
        'format': 'auto',
        'country': 'auto'
    }
    
    print('Testing Python backend validation...')
    print(f'Request: {json.dumps(request, indent=2)}')
    print()
    
    # Call handler
    try:
        result = handler_internal(request)
        print('Result:')
        print(json.dumps(json.loads(result['body']), indent=2))
        print()
        print(f'Status Code: {result["statusCode"]}')
    except Exception as e:
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_validation()


