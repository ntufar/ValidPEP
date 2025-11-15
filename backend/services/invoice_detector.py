"""
Invoice format and country detection
"""

from typing import Optional
from lxml import etree


def detect_invoice_format(xml_string: str) -> str:
    """
    Detect the invoice format (UBL or CII) from XML content
    
    Args:
        xml_string: XML content as string
    
    Returns:
        'ubl', 'cii', or 'auto'
    """
    try:
        xml_doc = etree.fromstring(xml_string.encode('utf-8'))
        root = xml_doc
        
        if root is None:
            return 'auto'
        
        # UBL namespaces
        ubl_namespaces = [
            'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
            'urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2',
            'urn:oasis:names:specification:ubl:schema:xsd:Order-2',
        ]
        
        namespace = root.nsmap.get(None, '') if root.nsmap else ''
        local_name = root.tag.split('}')[-1] if '}' in root.tag else root.tag
        
        if namespace in ubl_namespaces or local_name in ['Invoice', 'CreditNote', 'Order']:
            return 'ubl'
        
        # CII namespaces
        cii_namespaces = [
            'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100',
        ]
        
        if namespace in cii_namespaces or local_name == 'CrossIndustryInvoice':
            return 'cii'
        
        return 'auto'
        
    except Exception as e:
        print(f'Error detecting invoice format: {e}')
        return 'auto'


def detect_invoice_country(xml_string: str) -> Optional[str]:
    """
    Detect the invoice country code from XML content
    
    Args:
        xml_string: XML content as string
    
    Returns:
        Country code (e.g., 'NO', 'SE', 'GB') or None
    """
    try:
        xml_doc = etree.fromstring(xml_string.encode('utf-8'))
        root = xml_doc
        
        if root is None:
            return None
        
        # Define namespaces
        namespaces = {
            'cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
            'cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
            'ram': 'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100',
        }
        
        country_code = None
        
        # Try UBL country detection
        ubl_country_nodes = xml_doc.xpath(
            '//cac:AccountingSupplierParty/cac:Party/cac:PostalAddress/cac:Country/cbc:IdentificationCode',
            namespaces=namespaces
        )
        
        if ubl_country_nodes:
            country_code = ubl_country_nodes[0].text
        
        # Try CII country detection if UBL didn't work
        if not country_code:
            cii_country_nodes = xml_doc.xpath(
                '//ram:SupplyChainTradeTransaction/ram:ApplicableHeaderTradeAgreement/ram:SellerTradeParty/ram:PostalTradeAddress/ram:CountryID',
                namespaces=namespaces
            )
            
            if cii_country_nodes:
                country_code = cii_country_nodes[0].text
        
        return country_code.upper() if country_code else None
        
    except Exception as e:
        print(f'Error detecting invoice country: {e}')
        return None


