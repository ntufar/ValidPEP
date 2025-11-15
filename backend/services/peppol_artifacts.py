"""
PEPPOL validation artifacts loading (XSD and Schematron)
"""

import os
from pathlib import Path
from typing import Dict, Optional
import requests
from utils.cache import get_cache, set_cache

ARTIFACT_CACHE_PREFIX = 'peppol_validation_artifacts'
DEFAULT_TTL_SECONDS = 60 * 60 * 24  # 24 hours

# Find docs directory
POSSIBLE_DOC_ROOTS = [
    Path.cwd() / 'docs',
    Path.cwd().parent / 'docs',
    Path.cwd().parent.parent / 'docs',
]

DOCS_ROOT = next((d for d in POSSIBLE_DOC_ROOTS if d.exists()), POSSIBLE_DOC_ROOTS[0])

PEPPOL_XSD_BASE_URL = 'https://docs.peppol.eu/poacc/billing/3.0/xsd/'
UBL_MAINDOC_PATH = 'maindoc/UBL-Invoice-2.1.xsd'
CII_MAINDOC_PATH = 'cii/maindoc/CrossIndustryInvoice_100pD16B.xsd'

UBL_XSD_URL = f'{PEPPOL_XSD_BASE_URL}{UBL_MAINDOC_PATH}'
CII_XSD_URL = f'{PEPPOL_XSD_BASE_URL}{CII_MAINDOC_PATH}'
UBL_XSD_BASE_URL = f'{PEPPOL_XSD_BASE_URL}maindoc/'
CII_XSD_BASE_URL = f'{PEPPOL_XSD_BASE_URL}cii/maindoc/'


def load_schematron_from_disk(filename: str) -> str:
    """Load Schematron file from disk"""
    schematron_path = DOCS_ROOT / filename
    return schematron_path.read_text(encoding='utf-8')


def load_local_artifact_if_exists(filename: str) -> Optional[str]:
    """Load artifact from disk if it exists"""
    artifact_path = DOCS_ROOT / filename
    try:
        if artifact_path.exists():
            content = artifact_path.read_text(encoding='utf-8')
            if content.strip().startswith('<'):
                return content
    except Exception:
        pass
    return None


def fetch_remote_artifact(url: str) -> str:
    """Fetch artifact from remote URL"""
    response = requests.get(url, headers={'User-Agent': 'ValidPEP/1.0 (+https://github.com/)'})
    response.raise_for_status()
    return response.text


def get_peppol_validation_artifacts(format: str, country: str) -> Dict[str, Optional[str]]:
    """
    Get PEPPOL validation artifacts (XSD and Schematron)
    
    Args:
        format: 'ubl' or 'cii'
        country: Country code (e.g., 'NO', 'GB')
    
    Returns:
        Dictionary with 'xsd', 'xsd_base_url', 'xsd_error', 'schematron'
    """
    normalized_country = country.upper()
    cache_key = f'{ARTIFACT_CACHE_PREFIX}:{format}:{normalized_country}'
    
    # Try cache first
    cached_artifacts = get_cache(cache_key)
    if cached_artifacts:
        return cached_artifacts
    
    xsd_schema: Optional[str] = None
    xsd_base_url: Optional[str] = None
    xsd_error: Optional[str] = None
    schematron_rules: str
    
    if format == 'ubl':
        schematron_rules = load_schematron_from_disk('PEPPOL-EN16931-UBL.sch')
        xsd_schema = load_local_artifact_if_exists('UBL-Invoice-2.1.xsd')
        if xsd_schema:
            xsd_base_url = UBL_XSD_BASE_URL
        else:
            try:
                xsd_schema = fetch_remote_artifact(UBL_XSD_URL)
                xsd_base_url = UBL_XSD_BASE_URL
            except Exception as e:
                xsd_error = f'Failed to fetch UBL XSD: {str(e)}'
    elif format == 'cii':
        schematron_rules = load_schematron_from_disk('PEPPOL-EN16931-UBL.sch')
        xsd_schema = load_local_artifact_if_exists('CrossIndustryInvoice_100pD16B.xsd')
        if xsd_schema:
            xsd_base_url = CII_XSD_BASE_URL
        else:
            try:
                xsd_schema = fetch_remote_artifact(CII_XSD_URL)
                xsd_base_url = CII_XSD_BASE_URL
            except Exception as e:
                xsd_error = f'Failed to fetch CII XSD: {str(e)}'
    else:
        raise ValueError(f'Unsupported invoice format: {format}')
    
    artifacts = {
        'xsd': xsd_schema,
        'xsd_base_url': xsd_base_url,
        'xsd_error': xsd_error,
        'schematron': schematron_rules,
    }
    
    # Cache artifacts
    set_cache(cache_key, artifacts, ttl_seconds=DEFAULT_TTL_SECONDS)
    
    return artifacts


