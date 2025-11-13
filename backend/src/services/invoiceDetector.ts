// backend/src/services/invoiceDetector.ts

import libxmljs2 from 'libxmljs2';
import { InvoiceFormat } from '../types/validation';

export function detectInvoiceFormat(xmlString: string): InvoiceFormat {
  try {
    const xmlDoc = libxmljs2.parseXml(xmlString);
    const root = xmlDoc.root();

    if (!root) {
      return InvoiceFormat.Auto; // Cannot determine format without a root element
    }

    // Check for UBL (Universal Business Language) namespaces or root element names
    // Common UBL root elements: Invoice, CreditNote, Order
    // Common UBL namespaces: urn:oasis:names:specification:ubl:schema:xsd:Invoice-2, etc.
    const ublNamespaces = [
      'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
      'urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2',
      'urn:oasis:names:specification:ubl:schema:xsd:Order-2',
    ];

    const namespaceHref = root.namespace()?.href() ?? '';

    if (ublNamespaces.includes(namespaceHref) || ['Invoice', 'CreditNote', 'Order'].includes(root.name())) {
      return InvoiceFormat.UBL;
    }

    // Check for CII (Cross Industry Invoice) namespaces or root element names
    // Common CII root element: CrossIndustryInvoice
    // Common CII namespace: urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100
    const ciiNamespaces = [
      'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100',
    ];

    if (ciiNamespaces.includes(namespaceHref) || root.name() === 'CrossIndustryInvoice') {
      return InvoiceFormat.CII;
    }

    // If no specific format is detected, return Auto or throw an error
    return InvoiceFormat.Auto;

  } catch (error) {
    console.error('Error detecting invoice format:', error);
    return InvoiceFormat.Auto; // Fallback to auto on error
  }
}

export function detectInvoiceCountry(xmlString: string): string | undefined {
  try {
    const xmlDoc = libxmljs2.parseXml(xmlString);
    const root = xmlDoc.root();

    if (!root) {
      return undefined;
    }

    // Define namespaces for XPath queries
    const namespaces = {
      cbc: 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
      cac: 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
      ram: 'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100',
    };

    let countryCode: string | undefined;

    // Try to detect UBL country
    const ublCountryNode = xmlDoc.get('//cac:AccountingSupplierParty/cac:Party/cac:PostalAddress/cbc:Country/cbc:IdentificationCode', namespaces);
    const getTextContent = (node: libxmljs2.Node | null | undefined): string | undefined =>
      (node && typeof (node as libxmljs2.Element).text === 'function')
        ? (node as libxmljs2.Element).text()
        : undefined;

    countryCode = getTextContent(ublCountryNode);

    // If not UBL, try to detect CII country
    if (!countryCode) {
      const ciiCountryNode = xmlDoc.get('//ram:SupplyChainTradeTransaction/ram:ApplicableHeaderTradeAgreement/ram:SellerTradeParty/ram:PostalTradeAddress/ram:CountryID', namespaces);
      countryCode = getTextContent(ciiCountryNode);
    }

    return countryCode?.toUpperCase(); // Return uppercase country code
  } catch (error) {
    console.error('Error detecting invoice country:', error);
    return undefined;
  }
}
