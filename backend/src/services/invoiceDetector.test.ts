// backend/src/services/invoiceDetector.test.ts

import { detectInvoiceFormat, detectInvoiceCountry } from './invoiceDetector';
import { InvoiceFormat } from '../types/validation';

jest.mock('libxmljs2', () => ({
  __esModule: true,
  default: {
    parseXml: jest.fn(),
  },
}));

const mockedParseXml = jest.requireMock('libxmljs2').default.parseXml as jest.Mock;

mockedParseXml.mockImplementation((xmlString: string) => {
  const mockRoot = {
    name: jest.fn(() => {
      if (xmlString.includes('<Invoice')) return 'Invoice';
      if (xmlString.includes('<rsm:CrossIndustryInvoice')) return 'CrossIndustryInvoice';
      if (xmlString.includes('<UnknownDocument')) return 'UnknownDocument';
      return 'root';
    }),
    namespace: jest.fn(() => {
      if (xmlString.includes('urn:oasis:names:specification:ubl:schema:xsd:Invoice-2')) {
        return { href: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2' };
      }
      if (xmlString.includes('urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100')) {
        return { href: 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100' };
      }
      return null;
    }),
  };

  const mockDocument = {
    root: jest.fn(() => mockRoot),
    get: jest.fn((xpath: string) => {
      if (xpath.includes('cbc:IdentificationCode') && xmlString.includes('<cbc:IdentificationCode>NO</cbc:IdentificationCode>')) {
        return { text: jest.fn(() => 'NO') };
      }
      if (xpath.includes('ram:CountryID') && xmlString.includes('<ram:CountryID>SE</ram:CountryID>')) {
        return { text: jest.fn(() => 'SE') };
      }
      return null;
    }),
  };

  if (xmlString.includes('Invalid XML')) {
    throw new Error('Invalid XML');
  }

  return mockDocument;
});

describe('invoiceDetector', () => {
  beforeEach(() => {
    mockedParseXml.mockClear();
  });

  describe('detectInvoiceFormat', () => {
    it('should detect UBL format correctly', () => {
      const ublXml = `<?xml version="1.0" encoding="UTF-8"?>
        <Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
          <cbc:UBLVersionID xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">2.1</cbc:UBLVersionID>
        </Invoice>`;
      expect(detectInvoiceFormat(ublXml)).toBe(InvoiceFormat.UBL);
    });

    it('should detect CII format correctly', () => {
      const ciiXml = `<?xml version="1.0" encoding="UTF-8"?>
        <rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100">
          <rsm:ExchangedDocumentContext>
            <ram:GuidelineSpecifiedDocumentContextParameter xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100">
              <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</ram:ID>
            </ram:GuidelineSpecifiedDocumentContextParameter>
          </rsm:ExchangedDocumentContext>
        </rsm:CrossIndustryInvoice>`;
      expect(detectInvoiceFormat(ciiXml)).toBe(InvoiceFormat.CII);
    });

    it('should return Auto for unknown format', () => {
      const unknownXml = `<?xml version="1.0" encoding="UTF-8"?>
        <UnknownDocument>
          <SomeElement>test</SomeElement>
        </UnknownDocument>`;
      expect(detectInvoiceFormat(unknownXml)).toBe(InvoiceFormat.Auto);
    });

    it('should return Auto for invalid XML', () => {
      const invalidXml = `Invalid XML`; // This will trigger the mock's error
      expect(detectInvoiceFormat(invalidXml)).toBe(InvoiceFormat.Auto);
    });
  });

  describe('detectInvoiceCountry', () => {
    it('should detect UBL country correctly', () => {
      const ublXml = `<?xml version="1.0" encoding="UTF-8"?>
        <Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
                 xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
                 xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
          <cac:AccountingSupplierParty>
            <cac:Party>
              <cac:PostalAddress>
                <cac:Country>
                  <cbc:IdentificationCode>NO</cbc:IdentificationCode>
                </cac:Country>
              </cac:PostalAddress>
            </cac:Party>
          </cac:AccountingSupplierParty>
        </Invoice>`;
      expect(detectInvoiceCountry(ublXml)).toBe('NO');
    });

    it('should detect CII country correctly', () => {
      const ciiXml = `<?xml version="1.0" encoding="UTF-8"?>
        <rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
                                  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100">
          <rsm:SupplyChainTradeTransaction>
            <ram:ApplicableHeaderTradeAgreement>
              <ram:SellerTradeParty>
                <ram:PostalTradeAddress>
                  <ram:CountryID>SE</ram:CountryID>
                </ram:PostalTradeAddress>
              </ram:SellerTradeParty>
            </ram:ApplicableHeaderTradeAgreement>
          </rsm:SupplyChainTradeTransaction>
        </rsm:CrossIndustryInvoice>`;
      expect(detectInvoiceCountry(ciiXml)).toBe('SE');
    });

    it('should return undefined for unknown country in UBL', () => {
      const ublXml = `<?xml version="1.0" encoding="UTF-8"?>
        <Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
          <cac:AccountingSupplierParty xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
            <cac:Party>
              <cac:PostalAddress>
                <!-- Missing CountryID -->
              </cac:PostalAddress>
            </cac:Party>
          </cac:AccountingSupplierParty>
        </Invoice>`;
      expect(detectInvoiceCountry(ublXml)).toBeUndefined();
    });

    it('should return undefined for unknown country in CII', () => {
      const ciiXml = `<?xml version="1.0" encoding="UTF-8"?>
        <rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100">
          <rsm:SupplyChainTradeTransaction>
            <ram:ApplicableHeaderTradeAgreement xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100">
              <ram:SellerTradeParty>
                <ram:PostalTradeAddress>
                  <!-- Missing CountryID -->
                </ram:PostalTradeAddress>
              </ram:SellerTradeParty>
            </ram:ApplicableHeaderTradeAgreement>
          </rsm:SupplyChainTradeTransaction>
        </rsm:CrossIndustryInvoice>`;
      expect(detectInvoiceCountry(ciiXml)).toBeUndefined();
    });

    it('should return undefined for invalid XML', () => {
      const invalidXml = `Invalid XML`;
      expect(detectInvoiceCountry(invalidXml)).toBeUndefined();
    });
  });
});
