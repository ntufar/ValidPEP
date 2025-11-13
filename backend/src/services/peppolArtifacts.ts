// backend/src/services/peppolArtifacts.ts

import { promises as fs, existsSync } from 'fs';
import path from 'path';
import { kv } from '../utils/cache';
import { InvoiceFormat } from '../types/validation';

const ARTIFACT_CACHE_PREFIX = 'peppol_validation_artifacts';
const DEFAULT_TTL_SECONDS = 60 * 60 * 24; // 24 hours

const POSSIBLE_DOC_ROOTS = [
  path.resolve(process.cwd(), 'docs'),
  path.resolve(process.cwd(), '../docs'),
  path.resolve(process.cwd(), '../../docs'),
];

const DOCS_ROOT = POSSIBLE_DOC_ROOTS.find(candidate => existsSync(candidate)) ?? POSSIBLE_DOC_ROOTS[0];
const PEPPOL_XSD_BASE_URL = 'https://docs.peppol.eu/poacc/billing/3.0/xsd/';
const UBL_MAINDOC_PATH = 'maindoc/UBL-Invoice-2.1.xsd';
const CII_MAINDOC_PATH = 'cii/maindoc/CrossIndustryInvoice_100pD16B.xsd';

const UBL_XSD_URL = new URL(UBL_MAINDOC_PATH, PEPPOL_XSD_BASE_URL).toString();
const CII_XSD_URL = new URL(CII_MAINDOC_PATH, PEPPOL_XSD_BASE_URL).toString();
const UBL_XSD_BASE_URL = new URL('./', UBL_XSD_URL).toString();
const CII_XSD_BASE_URL = new URL('./', CII_XSD_URL).toString();

interface ValidationArtifacts {
  xsd?: string;
  xsdBaseUrl?: string;
  xsdError?: string;
  schematron: string;
}

async function loadSchematronFromDisk(filename: string): Promise<string> {
  const schematronPath = path.resolve(DOCS_ROOT, filename);
  return fs.readFile(schematronPath, 'utf8');
}

async function loadLocalArtifactIfExists(filename: string): Promise<string | undefined> {
  const artifactPath = path.resolve(DOCS_ROOT, filename);
  try {
    const content = await fs.readFile(artifactPath, 'utf8');
    if (!content.trim().startsWith('<')) {
      return undefined;
    }
    return content;
  } catch {
    return undefined;
  }
}

async function fetchRemoteArtifact(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'ValidPEP/1.0 (+https://github.com/)' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

export async function getPeppolValidationArtifacts(format: InvoiceFormat, country: string): Promise<ValidationArtifacts> {
  const normalizedCountry = country.toUpperCase();
  const cacheKey = `${ARTIFACT_CACHE_PREFIX}:${format}:${normalizedCountry}`;
  const cachedArtifacts = await kv.get<ValidationArtifacts>(cacheKey);
  if (cachedArtifacts) {
    return cachedArtifacts;
  }

  let xsdSchema: string | undefined;
  let xsdBaseUrl: string | undefined;
  let xsdError: string | undefined;
  let schematronRules: string;

  if (format === InvoiceFormat.UBL) {
    schematronRules = await loadSchematronFromDisk('PEPPOL-EN16931-UBL.sch');
    xsdSchema = await loadLocalArtifactIfExists('UBL-Invoice-2.1.xsd');
    if (xsdSchema) {
      xsdBaseUrl = UBL_XSD_BASE_URL;
    } else {
      try {
        xsdSchema = await fetchRemoteArtifact(UBL_XSD_URL);
        xsdBaseUrl = UBL_XSD_BASE_URL;
      } catch (error) {
        xsdError = `Failed to fetch UBL XSD: ${(error as Error).message}`;
      }
    }
  } else if (format === InvoiceFormat.CII) {
    schematronRules = await loadSchematronFromDisk('PEPPOL-EN16931-UBL.sch');
    xsdSchema = await loadLocalArtifactIfExists('CrossIndustryInvoice_100pD16B.xsd');
    if (xsdSchema) {
      xsdBaseUrl = CII_XSD_BASE_URL;
    } else {
      try {
        xsdSchema = await fetchRemoteArtifact(CII_XSD_URL);
        xsdBaseUrl = CII_XSD_BASE_URL;
      } catch (error) {
        xsdError = `Failed to fetch CII XSD: ${(error as Error).message}`;
      }
    }
  } else {
    throw new Error(`Unsupported invoice format: ${format}`);
  }

  const artifacts: ValidationArtifacts = {
    xsd: xsdSchema,
    xsdBaseUrl,
    xsdError,
    schematron: schematronRules,
  };

  await kv.set(cacheKey, artifacts, { ttlSeconds: DEFAULT_TTL_SECONDS });

  return artifacts;
}
