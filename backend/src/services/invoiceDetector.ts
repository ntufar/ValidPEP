// backend/src/services/invoiceDetector.ts

import { DOMParser } from '@xmldom/xmldom';
import * as xpath from 'xpath';
import { InvoiceFormat } from '../types/validation';

export function detectInvoiceFormat(xmlString: string): InvoiceFormat {
  try {
    const parser = new DOMParser({
      locator: {},
      errorHandler: {
        warning: () => {},
        error: () => {},
        fatalError: () => {},
      },
    });
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.getElementsByTagName('parsererror');
    if (parserError.length > 0) {
      return InvoiceFormat.Auto;
    }
    
    const root = xmlDoc.documentElement;

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

    const namespaceHref = root.namespaceURI ?? '';
    const localName = root.localName || root.nodeName;

    if (ublNamespaces.includes(namespaceHref) || ['Invoice', 'CreditNote', 'Order'].includes(localName)) {
      return InvoiceFormat.UBL;
    }

    // Check for CII (Cross Industry Invoice) namespaces or root element names
    // Common CII root element: CrossIndustryInvoice
    // Common CII namespace: urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100
    const ciiNamespaces = [
      'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100',
    ];

    if (ciiNamespaces.includes(namespaceHref) || localName === 'CrossIndustryInvoice') {
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
    const parser = new DOMParser({
      locator: {},
      errorHandler: {
        warning: () => {},
        error: () => {},
        fatalError: () => {},
      },
    });
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.getElementsByTagName('parsererror');
    if (parserError.length > 0) {
      return undefined;
    }
    
    const root = xmlDoc.documentElement;

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
    const select = xpath.useNamespaces(namespaces);
    const ublCountryNode = select(
      '//cac:AccountingSupplierParty/cac:Party/cac:PostalAddress/cac:Country/cbc:IdentificationCode',
      xmlDoc,
      true
    ) as Node | null;

    countryCode = ublCountryNode?.textContent?.trim();

    // If not UBL, try to detect CII country
    if (!countryCode) {
      const ciiCountryNode = select(
        '//ram:SupplyChainTradeTransaction/ram:ApplicableHeaderTradeAgreement/ram:SellerTradeParty/ram:PostalTradeAddress/ram:CountryID',
        xmlDoc,
        true
      ) as Node | null;
      countryCode = ciiCountryNode?.textContent?.trim();
    }

    return countryCode?.toUpperCase(); // Return uppercase country code
  } catch (error) {
    console.error('Error detecting invoice country:', error);
    return undefined;
  }
}
